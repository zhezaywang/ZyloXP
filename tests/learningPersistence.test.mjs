import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import { addStudyListResource, canAddStudyListResource, restoreStudyListItems, normalizeStudyListItems } from '../src/studyList.ts';
import { readFieldJournalEditor, saveFieldJournalEditor, readPendingFieldJournalDraft, stageFieldJournalDraft, clearPendingFieldJournalDraft } from '../src/fieldJournalDraft.ts';

const server = await createServer({
  cacheDir: 'node_modules/.cache/persistence-tests',
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom',
});
after(() => server.close());
const { normalizeFieldNotes } = await server.ssrLoadModule('/src/fieldNotes.ts');
const note = { id: 'note', title: 'First', body: 'Observation', category: 'lab', createdAt: 100, updatedAt: 200, pinned: false };

test('invalid journal dates are bounded and safe to format', () => {
  const notes = normalizeFieldNotes([{ ...note, createdAt: -1, updatedAt: 1e100 }, { ...note, id: 'second', createdAt: 600, updatedAt: 300 }], 1000);
  assert.deepEqual(notes.map((item) => [item.createdAt, item.updatedAt]), [[1000, 1000], [600, 600]]);
  for (const item of notes) assert.doesNotThrow(() => new Date(item.updatedAt).toISOString());
});

test('duplicate imported note identifiers remain independent and normalization is stable', () => {
  const notes = normalizeFieldNotes([note, { ...note, title: 'Second' }, { ...note, id: '', title: 'Third' }, null], 1000);
  assert.equal(notes.length, 3);
  assert.equal(new Set(notes.map((item) => item.id)).size, 3);
  assert.deepEqual(normalizeFieldNotes(notes, 1000), notes);
  assert.equal(notes.filter((item) => item.id !== notes[0].id).length, 2);
});

test('journal editor recovery retains edit identity and clears only when requested', (t) => {
  const values = new Map();
  const previous = globalThis.window;
  globalThis.window = { sessionStorage: { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) } };
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  const editor = { draft: { title: 'Draft', body: 'Unsaved measurement', category: 'lab' }, editingNoteId: 'note' };
  assert.equal(saveFieldJournalEditor(editor), true);
  assert.deepEqual(readFieldJournalEditor(), editor);
  assert.equal(stageFieldJournalDraft(editor.draft), true);
  assert.deepEqual(readPendingFieldJournalDraft(), editor.draft);
  assert.deepEqual(readPendingFieldJournalDraft(), editor.draft);
  clearPendingFieldJournalDraft();
  assert.equal(readPendingFieldJournalDraft(), null);
  assert.deepEqual(readFieldJournalEditor(), editor);
  assert.equal(saveFieldJournalEditor(null), true);
  assert.equal(readFieldJournalEditor(), null);
});

test('draft recovery fails explicitly when browser storage is unavailable', (t) => {
  const previous = globalThis.window;
  globalThis.window = { sessionStorage: { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); } } };
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  assert.equal(readFieldJournalEditor(), null);
  assert.equal(saveFieldJournalEditor({ draft: { title: 'Draft', body: 'Note', category: 'idea' }, editingNoteId: null }), false);
});

const item = (id, completedAt = null) => ({ id, title: id, kind: 'Lab', subtitle: 'Lab resource', addedAt: 100, completedAt });
test('a full Study List rejects new resources without displacing existing work', () => {
  const full = Array.from({ length: 60 }, (_, index) => item(`lab-${index}`));
  assert.equal(canAddStudyListResource(full, item('extra')), false);
  assert.equal(addStudyListResource(full, item('extra')), full);
  assert.equal(canAddStudyListResource(full, full[0]), true);
  const reopened = addStudyListResource([{ ...full[0], completedAt: 200 }, ...full.slice(1)], full[0]);
  assert.equal(reopened.length, 60);
  assert.equal(reopened[0].completedAt, null);
});

test('Study List undo is atomic at capacity and does not resurrect unrelated removals', () => {
  const full = Array.from({ length: 60 }, (_, index) => item(`lab-${index}`));
  assert.equal(restoreStudyListItems(full, [item('removed')], [item('removed'), ...full]), null);
  const restored = restoreStudyListItems(full.slice(1), [full[0]], full);
  assert.deepEqual(restored, full);
  assert.deepEqual(normalizeStudyListItems(restored), restored);
  const completed = item('completed', 200);
  const kept = item('kept');
  const removedLater = item('removed-later');
  const newlyAdded = item('new');
  assert.deepEqual(restoreStudyListItems([kept, newlyAdded], [completed], [removedLater, completed, kept]), [completed, kept, newlyAdded]);
  assert.deepEqual(restoreStudyListItems([item('completed'), kept], [completed], [completed, kept]), [item('completed'), kept]);
});
