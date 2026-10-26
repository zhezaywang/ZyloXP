import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import { buildAppHash, parseAppHash } from '../src/appRouting.ts';

const server = await createServer({ cacheDir: 'node_modules/.cache/session-history-tests', server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
after(() => server.close());
const { addSessionToHistory, createSessionHistoryRecord, filterSessionHistory, getSessionReplayIndices, normalizeSessionHistory } = await server.ssrLoadModule('/src/sessionHistoryModel.ts');
const { lessonQuestions: questions } = await server.ssrLoadModule('/src/data.ts');
const session = {
  source: 'custom', label: 'Circuit review', startedAt: 1000, completedAt: 121000, earnedXp: 50,
  questionIndices: [0, 1, 2], results: [
    { questionId: questions[0].id, result: 'correct', optionIndex: questions[0].correctIndex, confidence: 'sure' },
    { questionId: questions[1].id, result: 'wrong', optionIndex: (questions[1].correctIndex + 1) % questions[1].options.length, confidence: 'guess' },
    { questionId: questions[2].id, result: 'skipped', optionIndex: null, confidence: null },
  ],
};
const record = () => createSessionHistoryRecord(session, questions);

test('session snapshots preserve exact answers and text without bank metadata or shared references', () => {
  const bank = structuredClone(questions);
  const input = structuredClone(session);
  const saved = createSessionHistoryRecord(input, bank);
  assert.equal(saved.items.length, 3);
  assert.deepEqual(saved.items.map((item) => item.answer), session.results);
  assert.equal(saved.items[0].question.prompt, questions[0].prompt);
  assert.equal(saved.items[0].question.solution, questions[0].solution);
  assert.equal('factCheckedAt' in saved.items[0].question, false);
  assert.equal('diagram' in saved.items[0].question, false);
  bank[0].options[0] = 'Changed answer';
  bank[0].prompt = 'Changed prompt';
  input.results[0].result = 'wrong';
  assert.equal(saved.items[0].question.prompt, questions[0].prompt);
  assert.deepEqual(saved.items[0].question.options, questions[0].options);
  assert.equal(saved.items[0].answer.result, 'correct');
});

test('unfinished, incomplete and duplicated-question sessions are never archived as complete', () => {
  for (const completedAt of [null, NaN, Infinity]) assert.equal(createSessionHistoryRecord({ ...session, completedAt }, questions), null);
  assert.equal(createSessionHistoryRecord({ ...session, results: session.results.slice(1) }, questions), null);
  for (const questionIndices of [[], [0, 0], [0, 999], [0, 1.5]]) {
    assert.equal(createSessionHistoryRecord({ ...session, questionIndices }, questions), null);
  }
});

test('history is newest-first, bounded, idempotent and non-mutating', () => {
  const entries = Array.from({ length: 25 }, (_, i) => ({ ...record(), id: `session-${i}`, completedAt: 121000 + i }));
  const before = structuredClone(entries);
  const normalized = normalizeSessionHistory(entries);
  assert.equal(normalized.length, 20);
  assert.deepEqual(normalized.map((item) => item.id), entries.slice(5).reverse().map((item) => item.id));
  assert.deepEqual(addSessionToHistory(normalized, normalized[0]), normalized);
  assert.deepEqual(normalizeSessionHistory(normalized), normalized);
  assert.deepEqual(entries, before);
});

test('malformed records are rejected whole instead of silently altering their scores', () => {
  const valid = record();
  for (const patch of [
    { id: '<script>' }, { label: '' }, { label: 'x'.repeat(81) }, { source: 'unknown' },
    { startedAt: -1 }, { startedAt: 1.5 }, { completedAt: 0 }, { completedAt: Date.now() + 172800000 },
    { earnedXp: -1 }, { earnedXp: Infinity }, { items: [] }, { items: Array(11).fill(valid.items[0]) },
    { items: [valid.items[0], valid.items[0]] }, { items: [valid.items[0], null] },
  ]) assert.deepEqual(normalizeSessionHistory([{ ...valid, ...patch }]), [], JSON.stringify(patch));
  for (const patch of [{ prompt: 5 }, { solution: 'x'.repeat(8001) }, { options: ['only'] }, { options: [null, 'a'] }, { correctIndex: 99 }]) {
    const damaged = structuredClone(valid);
    Object.assign(damaged.items[1].question, patch);
    assert.deepEqual(normalizeSessionHistory([damaged]), []);
  }
  for (const value of [null, {}, 'invalid', [null, 0, {}]]) assert.deepEqual(normalizeSessionHistory(value), []);
});

test('legacy answers remain honest and invalid answer metadata is removed', () => {
  const saved = record();
  saved.items[0].answer = { questionId: questions[0].id, result: 'correct' };
  saved.items[1].answer.optionIndex = 999;
  const normalized = normalizeSessionHistory([saved])[0];
  for (const item of normalized.items.slice(0, 2)) {
    assert.equal(item.answer.optionIndex, null);
    assert.equal(item.answer.confidence, null);
  }
  saved.items[1].answer.questionId = 'not-this-question';
  assert.deepEqual(normalizeSessionHistory([saved]), []);
});

test('session search combines titles, engineering aliases and misses without reordering history', () => {
  const first = record();
  first.label = 'Op-amp review';
  const perfect = { ...record(), id: 'perfect', label: 'Perfect practice', items: [record().items[0]] };
  const history = [first, perfect];
  assert.deepEqual(filterSessionHistory(history, '', false), history);
  assert.deepEqual(filterSessionHistory(history, 'Perfect practice', false), [perfect]);
  assert.deepEqual(filterSessionHistory(history, 'operational amplifier', false), [first]);
  assert.deepEqual(filterSessionHistory(history, '', true), [first]);
  assert.deepEqual(filterSessionHistory(history, 'Perfect practice', true), []);
  assert.deepEqual(filterSessionHistory(history, 'unknownword', false), []);
});

test('replays use IDs and preserve original order across bank reordering including index zero', () => {
  const saved = record();
  const bank = [questions[2], questions[0], questions[1]];
  assert.deepEqual(getSessionReplayIndices(saved, bank, false), [1, 2, 0]);
  assert.deepEqual(getSessionReplayIndices(saved, bank, true), [2, 0]);
  assert.deepEqual(getSessionReplayIndices(saved, [questions[2]], false), [0]);
});

test('changed questions never inherit historical choice indices or enter exact replays', () => {
  const saved = record();
  for (const field of ['topic', 'subtopic', 'prompt', 'formula', 'solution', 'explanation', 'assumptions']) {
    const bank = structuredClone(questions);
    bank[1][field] += ' changed';
    assert.deepEqual(getSessionReplayIndices(saved, bank, true), [2], field);
  }
  for (const patch of [{ correctIndex: (questions[1].correctIndex + 1) % questions[1].options.length }, { options: [...questions[1].options, 'extra'] }, { options: [...questions[1].options].reverse() }]) {
    const bank = structuredClone(questions);
    Object.assign(bank[1], patch);
    assert.deepEqual(getSessionReplayIndices(saved, bank, false), [0, 2]);
  }
  assert.deepEqual(saved, record());
});

test('session history routes support direct links, refresh and safe malformed paths', () => {
  for (const resourceId of [null, 'session-1000-121000']) {
    const route = { section: 'practice', page: 'session-history', resourceId };
    assert.deepEqual(parseAppHash(buildAppHash(route)), route);
    assert.equal(buildAppHash({ ...route, page: 'sprint-summary' }), buildAppHash(route));
  }
  assert.deepEqual(parseAppHash('#/practice/history/%ZZ'), { section: 'practice', page: 'session-history', resourceId: null });
});
