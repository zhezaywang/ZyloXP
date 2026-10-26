import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getSprintReview, matchesSprintReviewFilter, normalizeSprintAnswer } from '../src/sprintReviewModel.ts';

const questions = ['a', 'b', 'c', 'd'].map((id) => ({ id, options: ['1 A', '2 A', '3 A'], correctIndex: 0 }));
const session = { completedAt: 100, questionIndices: [0, 1, 2, 3], results: [
  { questionId: 'a', result: 'correct', optionIndex: 0, confidence: 'sure' },
  { questionId: 'b', result: 'wrong', optionIndex: 1, confidence: 'sure' },
  { questionId: 'c', result: 'correct', optionIndex: 0, confidence: 'guess' },
  { questionId: 'd', result: 'skipped', optionIndex: null, confidence: null },
] };

test('sprint review is available only after completion and preserves session order and numbers', () => {
  for (const completedAt of [null, NaN, Infinity]) {
    assert.deepEqual(getSprintReview({ ...session, completedAt }, questions), []);
  }
  assert.deepEqual(getSprintReview(null, questions), []);
  const before = structuredClone(session);
  const items = getSprintReview({ ...session, questionIndices: [3, 0, 1, 2], results: [...session.results].reverse() }, questions);
  assert.deepEqual(items.map((item) => [item.number, item.question.id]), [[1, 'd'], [2, 'a'], [3, 'b'], [4, 'c']]);
  assert.deepEqual(session, before);
});

test('review filters include skipped misses and uncertain correct answers without renumbering', () => {
  const items = getSprintReview(session, questions);
  const numbers = (filter) => items.filter((item) => matchesSprintReviewFilter(item, filter)).map((item) => item.number);
  assert.deepEqual(numbers('all'), [1, 2, 3, 4]);
  assert.deepEqual(numbers('missed'), [2, 4]);
  assert.deepEqual(numbers('skipped'), [4]);
  assert.deepEqual(numbers('uncertain'), [3]);
  assert.deepEqual(numbers('unknown'), [1, 2, 3, 4]);
});

test('legacy results keep their recorded outcome without inventing an answer or confidence', () => {
  for (const result of ['correct', 'wrong', 'skipped']) {
    assert.deepEqual(normalizeSprintAnswer({ questionId: 'a', result }, questions[0]), {
      questionId: 'a', result, optionIndex: null, confidence: null,
    });
  }
});

test('invalid choices and confidence cannot produce misleading answer labels', () => {
  for (const optionIndex of [-1, 3, 0.5, '0', NaN, Infinity, null, undefined]) {
    const answer = normalizeSprintAnswer({ questionId: 'a', result: 'correct', optionIndex, confidence: 'sure' }, questions[0]);
    assert.equal(answer.optionIndex, null);
    assert.equal(answer.confidence, null);
  }
  for (const result of ['correct', 'skipped']) {
    assert.equal(normalizeSprintAnswer({ questionId: 'a', result, optionIndex: 1 }, questions[0]).optionIndex, null);
  }
  assert.equal(normalizeSprintAnswer({ questionId: 'a', result: 'wrong', optionIndex: 0 }, questions[0]).optionIndex, null);
  assert.equal(normalizeSprintAnswer({ ...session.results[0], confidence: 'unknown' }, questions[0]).confidence, null);
});

test('unknown records, duplicate questions and invalid indices never leak into the review', () => {
  for (const value of [null, 0, 'answer', {}, { questionId: 'outside', result: 'correct' }, { questionId: 'a', result: 'invalid' }]) {
    assert.equal(normalizeSprintAnswer(value, questions[0]), null);
  }
  const items = getSprintReview({ ...session, questionIndices: [0, 0, -1, 999, 0.5, 2], results: [...session.results, { questionId: 'outside', result: 'wrong' }] }, questions);
  assert.deepEqual(items.map((item) => [item.number, item.question.id]), [[1, 'a'], [6, 'c']]);
  assert.deepEqual(getSprintReview({ ...session, results: [] }, questions), []);
});
