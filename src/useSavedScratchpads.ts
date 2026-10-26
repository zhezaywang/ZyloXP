import { useEffect, useState } from 'react';
import { QUESTION_SCRATCHPAD_KEY, QUESTION_SCRATCHPADS_CHANGED, readSavedScratchpads } from './questionScratchpads';

function readCollection(): ReturnType<typeof readSavedScratchpads> {
  if (typeof window === 'undefined') return { ok: true, notes: {} };
  try { return readSavedScratchpads(window.localStorage); }
  catch { return { ok: false, reason: 'unavailable' }; }
}

export function useSavedScratchpads() {
  const [collection, setCollection] = useState(readCollection);
  function readLatest() { setCollection(readCollection()); }
  function refresh() { window.dispatchEvent(new Event(QUESTION_SCRATCHPADS_CHANGED)); }
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === null || event.key === QUESTION_SCRATCHPAD_KEY) readLatest();
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', readLatest);
    window.addEventListener(QUESTION_SCRATCHPADS_CHANGED, readLatest);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', readLatest);
      window.removeEventListener(QUESTION_SCRATCHPADS_CHANGED, readLatest);
    };
  }, []);
  return { collection, refresh };
}
