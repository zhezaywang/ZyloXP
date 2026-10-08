type RestoreStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type RestoreResult = { ok: true } | { ok: false; recovered: boolean };

let restoringKeys: Set<string> | null = null;

export function isProgressRestoreInProgress(key?: string) {
  return restoringKeys !== null && (key === undefined || restoringKeys.has(key));
}

// Keep autosave paused after a successful restore until the fresh page reads it.
export function restoreProgressEntries(
  storage: RestoreStorage,
  entries: ReadonlyArray<readonly [string, string]>,
): RestoreResult {
  if (isProgressRestoreInProgress()) return { ok: false, recovered: false };
  const previousValues = new Map<string, string | null>();
  const writtenKeys: string[] = [];
  restoringKeys = new Set(entries.map(([key]) => key));

  try {
    for (const [key] of entries) {
      if (previousValues.has(key)) throw new Error('Duplicate restore key.');
      previousValues.set(key, storage.getItem(key));
    }
    for (const [key, value] of entries) {
      storage.setItem(key, value);
      writtenKeys.push(key);
    }
    return { ok: true };
  } catch {
    let recovered = true;
    for (const key of writtenKeys.reverse()) {
      try {
        const previous = previousValues.get(key)!;
        if (previous === null) storage.removeItem(key);
        else storage.setItem(key, previous);
      } catch {
        recovered = false;
      }
    }
    if (recovered) restoringKeys = null;
    return { ok: false, recovered };
  }
}
