import assert from 'node:assert/strict';
import test from 'node:test';

async function freshRestore(name) {
  return import(`../src/progressRestore.ts?${name}`);
}

function memoryStorage(seed = []) {
  const values = new Map(seed);
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
}

test('restores only included groups and keeps autosave paused until reload', async () => {
  const { restoreProgressEntries, isProgressRestoreInProgress } = await freshRestore('success');
  const storage = memoryStorage([['draft', 'old'], ['profile', 'keep']]);
  assert.equal(isProgressRestoreInProgress(), false);
  assert.deepEqual(restoreProgressEntries(storage, [['draft', 'restored'], ['boards', 'saved']]), { ok: true });
  assert.deepEqual([...storage.values], [['draft', 'restored'], ['profile', 'keep'], ['boards', 'saved']]);
  assert.equal(isProgressRestoreInProgress(), true);
  assert.equal(isProgressRestoreInProgress('draft'), true);
  assert.equal(isProgressRestoreInProgress('boards'), true);
  assert.equal(isProgressRestoreInProgress('profile'), false);
  assert.deepEqual(restoreProgressEntries(storage, [['draft', 'duplicate']]), { ok: false, recovered: false });
  assert.equal(storage.getItem('draft'), 'restored');
});

test('reads every previous value before attempting any writes', async () => {
  const { restoreProgressEntries, isProgressRestoreInProgress } = await freshRestore('read-failure');
  const storage = memoryStorage([['draft', 'old']]);
  let writes = 0;
  const denied = {
    ...storage,
    getItem(key) { if (key === 'boards') throw new Error('denied'); return storage.getItem(key); },
    setItem() { writes += 1; },
  };
  assert.deepEqual(restoreProgressEntries(denied, [['draft', 'new'], ['boards', 'new']]), { ok: false, recovered: true });
  assert.equal(writes, 0);
  assert.equal(storage.getItem('draft'), 'old');
  assert.equal(isProgressRestoreInProgress(), false);
});

test('a failed write rolls back overwritten and newly created groups before allowing a retry', async () => {
  const { restoreProgressEntries, isProgressRestoreInProgress } = await freshRestore('rollback');
  const storage = memoryStorage([['draft', 'old'], ['hearts', 'keep']]);
  const full = {
    ...storage,
    setItem(key, value) { if (key === 'hearts') throw new Error('quota'); storage.setItem(key, value); },
  };
  assert.deepEqual(restoreProgressEntries(full, [['draft', 'new'], ['boards', 'new'], ['hearts', 'new']]), { ok: false, recovered: true });
  assert.deepEqual([...storage.values], [['draft', 'old'], ['hearts', 'keep']]);
  assert.equal(isProgressRestoreInProgress(), false);
  assert.deepEqual(restoreProgressEntries(storage, [['draft', 'retry']]), { ok: true });
  assert.equal(storage.getItem('draft'), 'retry');
});

test('a rollback failure is reported accurately and cannot resume stale autosaves', async () => {
  const { restoreProgressEntries, isProgressRestoreInProgress } = await freshRestore('failed-rollback');
  const storage = memoryStorage([['draft', 'old']]);
  let writes = 0;
  const denied = {
    ...storage,
    setItem(key, value) { if (++writes > 1) throw new Error('denied'); storage.setItem(key, value); },
  };
  assert.deepEqual(restoreProgressEntries(denied, [['draft', 'new'], ['boards', 'new']]), { ok: false, recovered: false });
  assert.equal(storage.getItem('draft'), 'new');
  assert.equal(isProgressRestoreInProgress(), true);
});

test('a failed rollback removal is also reported instead of claiming recovery', async () => {
  const { restoreProgressEntries } = await freshRestore('failed-removal');
  const storage = memoryStorage();
  const denied = {
    ...storage,
    setItem(key, value) { if (key === 'boards') throw new Error('quota'); storage.setItem(key, value); },
    removeItem() { throw new Error('denied'); },
  };
  assert.deepEqual(restoreProgressEntries(denied, [['draft', 'new'], ['boards', 'new']]), { ok: false, recovered: false });
});

test('duplicate groups fail preflight without changing storage', async () => {
  const { restoreProgressEntries, isProgressRestoreInProgress } = await freshRestore('duplicates');
  const storage = memoryStorage([['draft', 'old']]);
  assert.deepEqual(restoreProgressEntries(storage, [['draft', 'new'], ['draft', 'newer']]), { ok: false, recovered: true });
  assert.equal(storage.getItem('draft'), 'old');
  assert.equal(isProgressRestoreInProgress(), false);
});
