import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ cacheDir: 'node_modules/.cache/scratchpad-tests', server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
after(() => server.close());
const { persistScratchpad, readSavedScratchpad, createWorkingOutline, QUESTION_SCRATCHPAD_KEY: key } = await server.ssrLoadModule('/src/questionScratchpads.ts');
const { parseZyloBackup } = await server.ssrLoadModule('/src/ProgressBackup.tsx');
const { getScratchpadItems, filterScratchpads, exportScratchpadText } = await server.ssrLoadModule('/src/ScratchpadLibrary.tsx');

function storage(notes = {}) {
  const values = new Map([[key, JSON.stringify(notes)]]);
  return { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
const read = (store) => JSON.parse(store.getItem(key));
const backup = (notes) => JSON.stringify({ app: 'ZyloXP', schemaVersion: 1, createdAt: '2026-10-10T00:00:00Z', data: { [key]: notes } });

test('saving, editing and clearing preserve every unrelated scratchpad', () => {
  const store = storage({ 'EE-00001': 'First note', 'EE-00002': 'Second note' });
  assert.deepEqual(persistScratchpad(store, 'EE-00001', { text: 'Edited', base: 'First note' }), { ok: true, text: 'Edited' });
  assert.deepEqual(read(store), { 'EE-00001': 'Edited', 'EE-00002': 'Second note' });
  assert.deepEqual(persistScratchpad(store, 'EE-00001', { text: ' \n ', base: 'Edited' }), { ok: true, text: null });
  assert.deepEqual(read(store), { 'EE-00002': 'Second note' });
  assert.deepEqual(readSavedScratchpad(store, 'EE-00001'), { ok: true, text: null });
});

test('capacity never evicts old work, but allows edits and freeing a slot', () => {
  const notes = Object.fromEntries(Array.from({ length: 80 }, (_, i) => [`EE-${i}`, `Note ${i}`]));
  const store = storage(notes);
  assert.deepEqual(persistScratchpad(store, 'EE-new', { text: 'New', base: null }), { ok: false, reason: 'capacity' });
  assert.deepEqual(read(store), notes);
  assert.equal(persistScratchpad(store, 'EE-0', { text: 'Edited', base: 'Note 0' }).ok, true);
  assert.equal(persistScratchpad(store, 'EE-1', { text: '', base: 'Note 1' }).ok, true);
  assert.equal(persistScratchpad(store, 'EE-new', { text: 'New', base: null }).ok, true);
  assert.equal(Object.keys(read(store)).length, 80);
  assert.equal(read(store)['EE-79'], 'Note 79');
});

test('stale writes and clears require conflict resolution, while idempotent writes succeed', () => {
  const store = storage({ 'EE-1': 'Other tab', 'EE-2': 'Unrelated' });
  for (const text of ['Mine', '']) {
    assert.deepEqual(persistScratchpad(store, 'EE-1', { text, base: 'Old' }), { ok: false, reason: 'conflict', savedText: 'Other tab' });
  }
  assert.equal(read(store)['EE-1'], 'Other tab');
  assert.equal(persistScratchpad(store, 'EE-1', { text: 'Other tab', base: 'Old' }).ok, true);
  assert.equal(persistScratchpad(store, 'EE-1', { text: 'Mine', base: 'Other tab' }).ok, true);
  assert.equal(read(store)['EE-2'], 'Unrelated');
});

test('malformed storage and unsafe IDs cannot be overwritten by editing', () => {
  const store = storage();
  for (const raw of ['invalid json', 'null', '[]', '{"EE-1":42}', '{"__proto__":"unsafe"}', '{"constructor":"unsafe"}', JSON.stringify({ 'EE-1': 'a'.repeat(601) })]) {
    store.setItem(key, raw);
    assert.deepEqual(persistScratchpad(store, 'EE-1', { text: 'New', base: null }), { ok: false, reason: 'damaged' });
    assert.equal(store.getItem(key), raw);
  }
  store.setItem(key, '{}');
  for (const id of ['__proto__', 'constructor', 'prototype', '', 'EE/1']) {
    assert.deepEqual(persistScratchpad(store, id, { text: 'New', base: null }), { ok: false, reason: 'damaged' });
  }
  assert.equal(store.getItem(key), '{}');
});

test('read and write failures remain explicit and do not report a successful save', () => {
  const store = storage({ 'EE-1': 'Original' });
  const denied = () => { throw new Error('Storage denied'); };
  assert.deepEqual(readSavedScratchpad({ ...store, getItem: denied }, 'EE-1'), { ok: false, reason: 'unavailable' });
  assert.deepEqual(persistScratchpad({ ...store, setItem: denied }, 'EE-1', { text: 'Unsaved', base: 'Original' }), { ok: false, reason: 'unavailable' });
  assert.equal(read(store)['EE-1'], 'Original');
});

test('note limits and the working outline leave room for reasoning', () => {
  const store = storage();
  persistScratchpad(store, 'EE-1', { text: 'a'.repeat(1000), base: null });
  assert.equal(read(store)['EE-1'].length, 600);
  const outline = createWorkingOutline(['8 V', '8 ohm']);
  assert.equal(outline, 'Given: 8 V; 8 ohm\n\nFind:\n\nWorking:\n\nCheck (units and scale):\n');
  assert.ok(createWorkingOutline(['x'.repeat(1000)]).length < 400);
});

test('scratchpad backups are accepted only with valid bounded note content', () => {
  const notes = { 'EE-1': 'Reasoning', 'EE-2': 'Units check' };
  assert.deepEqual(parseZyloBackup(backup(notes)).data[key], notes);
  for (const invalid of [[], { 'EE-1': 42 }, { 'EE-1': 'x'.repeat(601) }, Object.fromEntries(Array.from({ length: 81 }, (_, i) => [`EE-${i}`, 'note']))]) {
    assert.throws(() => parseZyloBackup(backup(invalid)), /invalid format/);
  }
  assert.throws(() => parseZyloBackup(backup(JSON.parse('{"__proto__":"unsafe"}'))), /unsafe data key/);
  const oldBackup = { app: 'ZyloXP', schemaVersion: 1, createdAt: '2026-10-10T00:00:00Z', data: { 'zyloxp-field-journal-v1': [] } };
  assert.deepEqual(parseZyloBackup(JSON.stringify(oldBackup)).data, oldBackup.data);
});

const sources = [
  { id: 'EE-1', topic: 'DC Circuit Analysis', subtopic: "Ohm's law", prompt: 'Find the current in a resistor.' },
  { id: 'EE-2', topic: 'Analog Electronics', subtopic: 'Operational amplifier', prompt: 'Find the amplifier gain.' },
];

test('the scratchpad library joins by identity without dropping unavailable questions or changing notes', () => {
  const notes = { 'EE-1': 'Original reasoning\nV / R', 'EE-missing': 'Work from an older bank', 'EE-2': 'Gain reasoning' };
  const snapshot = structuredClone(notes);
  const items = getScratchpadItems(notes, sources);
  assert.equal(items.length, 3);
  assert.equal(items.find((item) => item.id === 'EE-1').questionIndex, 0);
  assert.equal(items.find((item) => item.id === 'EE-2').questionIndex, 1);
  assert.equal(items.find((item) => item.id === 'EE-missing').questionIndex, null);
  assert.equal(items.find((item) => item.id === 'EE-missing').title, 'Work from an older bank');
  assert.equal(items.find((item) => item.id === 'EE-missing').text, notes['EE-missing']);
  assert.deepEqual(notes, snapshot);
});

test('scratchpad search combines note content, engineering aliases and topic filters', () => {
  const items = getScratchpadItems({ 'EE-1': 'Check the unit scale', 'EE-2': 'Feedback resistor ratio', 'EE-missing': 'Saved prototype observation' }, sources);
  assert.deepEqual(filterScratchpads(items, 'op amp', '').map((item) => item.id), ['EE-2']);
  assert.deepEqual(filterScratchpads(items, 'unit scale', '').map((item) => item.id), ['EE-1']);
  assert.equal(filterScratchpads(items, 'unit scale', 'Analog Electronics').length, 0);
  assert.deepEqual(filterScratchpads(items, '', 'Unavailable questions').map((item) => item.id), ['EE-missing']);
  assert.equal(filterScratchpads(items, '', '').length, 3);
});

test('text export preserves full multiline working and the exact filtered question context', () => {
  const notes = { 'EE-1': 'Given: 8 V\nWorking: 8 / 8 = 1 A\nCheck: units', 'EE-2': 'Do not include this filtered-out note' };
  const items = filterScratchpads(getScratchpadItems(notes, sources), '', 'DC Circuit Analysis');
  const text = exportScratchpadText(items);
  assert.ok(text.includes('1 scratchpad\n'));
  assert.ok(text.includes('Question: EE-1\nFind the current in a resistor.'));
  assert.ok(text.includes(notes['EE-1']));
  assert.ok(!text.includes(notes['EE-2']));
});
