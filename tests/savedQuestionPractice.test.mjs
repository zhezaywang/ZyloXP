import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import { selectSavedPractice } from '../src/savedQuestionPractice.ts';

const server = await createServer({ cacheDir: 'node_modules/.cache/saved-practice-tests', server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
after(() => server.close());
const { filterSavedQuestions } = await server.ssrLoadModule('/src/NotebookLibrary.tsx');

test('saved sessions take a bounded, unique snapshot without changing the collection', () => {
  const items = Array.from({ length: 12 }, (_, index) => ({ id: `q-${index}`, questionIndex: index }));
  const before = structuredClone(items);
  assert.deepEqual(selectSavedPractice(items, 5), items.slice(0, 5));
  assert.deepEqual(selectSavedPractice(items, 10), items.slice(0, 10));
  assert.deepEqual(selectSavedPractice([items[0], items[0], ...items.slice(1)], 5), items.slice(0, 5));
  assert.deepEqual(selectSavedPractice(items.slice(0, 2), 5), items.slice(0, 2));
  assert.deepEqual(selectSavedPractice([], 5), []);
  assert.deepEqual(items, before);
  for (const value of [0, -1, 100, NaN, Infinity]) assert.equal(selectSavedPractice(items, value).length, 5);
});

test('session selection follows combined engineering search, topic and practice order', () => {
  const items = [
    { id: 'strong', subtopic: 'Op-amp gain', topic: 'Analog Electronics', prompt: 'Find voltage gain', accuracy: 90, attempts: 10 },
    { id: 'new', subtopic: 'Op-amp follower', topic: 'Analog Electronics', prompt: 'Output voltage', accuracy: null, attempts: 0 },
    { id: 'weak', subtopic: 'Op-amp output', topic: 'Analog Electronics', prompt: 'Voltage gain', accuracy: 25, attempts: 4 },
    { id: 'other', subtopic: 'Stored charge', topic: 'DC Circuits', prompt: 'Capacitor', accuracy: 10, attempts: 3 },
  ];
  const selection = (query, topic, order) => selectSavedPractice(filterSavedQuestions(items, query, topic, order), 5).map((q) => q.id);
  assert.deepEqual(selection('operational amplifier', '', 'weakest'), ['weak', 'strong', 'new']);
  assert.deepEqual(selection('', 'Analog Electronics', 'unattempted'), ['new', 'strong', 'weak']);
  assert.deepEqual(selection('operational amplifier', 'DC Circuits', 'saved'), []);
});
