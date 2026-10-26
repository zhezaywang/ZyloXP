import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCheckpointResults, getConfidenceAlignment, matchesCheckpointFilter } from '../src/checkpointResults.ts';

const question = (id) => ({ id, options: ['1 A', '2 A', '3 A'], correctIndex: 0 });
const questions = ['a', 'b', 'c', 'd', 'e'].map(question);
const exam = {
  id: 'checkpoint-test', completedAt: 1000, questionIds: questions.map((q) => q.id),
  answers: {
    a: { optionIndex: 0, confidence: 'high', flagged: false },
    b: { optionIndex: 1, confidence: 'high', flagged: true },
    c: { optionIndex: null, confidence: 'low', flagged: true },
    d: { optionIndex: 0, confidence: 'low', flagged: false },
    e: { optionIndex: 2, confidence: 'medium', flagged: false },
  },
};

test('checkpoint solutions are available only after submission', () => {
  assert.deepEqual(getCheckpointResults(null, questions), []);
  assert.deepEqual(getCheckpointResults({ ...exam, completedAt: null }, questions), []);
  assert.equal(getCheckpointResults({ ...exam, completedAt: 0 }, questions).length, 5);
});

test('review follows original exam numbering without mutating answers or including other questions', () => {
  const before = structuredClone(exam);
  const results = getCheckpointResults(exam, [...questions].reverse().concat(question('outside')));
  assert.deepEqual(results.map((r) => r.question.id), ['a', 'b', 'c', 'd', 'e']);
  assert.deepEqual(results.map((r) => r.number), [1, 2, 3, 4, 5]);
  assert.deepEqual(exam, before);
  assert.deepEqual(getCheckpointResults(exam, questions.filter((q) => q.id !== 'b')).map((r) => r.number), [1, 3, 4, 5]);
});

test('review filters preserve question numbers and distinguish missing answers from uncertainty', () => {
  const results = getCheckpointResults(exam, questions);
  const numbers = (filter) => results.filter((r) => matchesCheckpointFilter(r, filter)).map((r) => r.number);
  assert.deepEqual(numbers('all'), [1, 2, 3, 4, 5]);
  assert.deepEqual(numbers('missed'), [2, 3, 5]);
  assert.deepEqual(numbers('unanswered'), [3]);
  assert.deepEqual(numbers('flagged'), [2, 3]);
  assert.deepEqual(numbers('uncertain'), [4, 5]);
});

test('missing and invalid answers do not produce NaN confidence or an invalid option label', () => {
  for (const optionIndex of [null, undefined, -1, 3, 0.5, NaN, Infinity, '0']) {
    const results = getCheckpointResults({ ...exam, questionIds: ['a'], answers: { a: { optionIndex, confidence: 'high' } } }, questions);
    assert.equal(results[0].optionIndex, null);
    assert.equal(results[0].correct, false);
    assert.equal(getConfidenceAlignment(results), null);
  }
  const missing = getCheckpointResults({ ...exam, answers: {} }, questions);
  assert.ok(missing.every((result) => result.confidence === null && !result.flagged));
  assert.equal(getConfidenceAlignment(missing), null);
  const invalid = getCheckpointResults({ ...exam, answers: { a: { optionIndex: 0, confidence: 'unknown' } } }, questions);
  assert.equal(getConfidenceAlignment(invalid), null);
});

test('confidence alignment uses only answered, explicitly rated predictions', () => {
  const results = getCheckpointResults(exam, questions);
  assert.equal(getConfidenceAlignment(results), 43);
  assert.equal(getConfidenceAlignment([results[0]]), 85);
  assert.equal(getConfidenceAlignment([results[1]]), 15);
  assert.equal(getConfidenceAlignment([results[2]]), null);
  assert.equal(getConfidenceAlignment([]), null);
});
