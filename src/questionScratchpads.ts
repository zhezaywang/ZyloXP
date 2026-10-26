import { isProgressRestoreInProgress } from './progressRestore';

export const QUESTION_SCRATCHPAD_KEY = 'zyloxp-question-scratchpads-v1';
export const QUESTION_SCRATCHPAD_LIMIT = 600;
export const MAX_QUESTION_SCRATCHPADS = 80;
export const QUESTION_SCRATCHPADS_CHANGED = 'zyloxp-scratchpads-changed';
const DRAFT_PREFIX = 'zyloxp-question-draft-v1:';
type ScratchpadStorage = Pick<Storage, 'getItem' | 'setItem'>;
type Draft = { text: string; base: string | null };
type Failure = 'unavailable' | 'damaged' | 'capacity' | 'conflict' | 'restoring';
export type ScratchpadState = Draft & {
  status: 'saved' | 'empty' | 'pending' | Failure;
  savedText: string | null;
  recovery: 'session' | 'memory' | null;
};

function storedText(text: string) { return text.trim() ? text : null; }
function isQuestionId(key: string) {
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(key)
    && !['__proto__', 'constructor', 'prototype'].includes(key);
}

export function isScratchpadMap(value: unknown): value is Record<string, string> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
    && Object.entries(value!).every(([key, text]) => isQuestionId(key)
      && typeof text === 'string' && text.length <= QUESTION_SCRATCHPAD_LIMIT);
}

export function readSavedScratchpads(storage: ScratchpadStorage):
  { ok: true; notes: Record<string, string> } | { ok: false; reason: 'unavailable' | 'damaged' } {
  let raw: string | null;
  try { raw = storage.getItem(QUESTION_SCRATCHPAD_KEY); }
  catch { return { ok: false, reason: 'unavailable' }; }
  if (raw === null) return { ok: true, notes: {} };
  try {
    const notes: unknown = JSON.parse(raw);
    if (!isScratchpadMap(notes)) {
      return { ok: false, reason: 'damaged' };
    }
    return { ok: true, notes };
  } catch { return { ok: false, reason: 'damaged' }; }
}

export function readSavedScratchpad(storage: ScratchpadStorage, questionId: string) {
  const result = readSavedScratchpads(storage);
  return result.ok
    ? { ok: true as const, text: Object.hasOwn(result.notes, questionId) ? result.notes[questionId] : null }
    : result;
}

export function persistScratchpad(storage: ScratchpadStorage, questionId: string, draft: Draft):
  { ok: true; text: string | null } | { ok: false; reason: Failure; savedText?: string | null } {
  if (!isQuestionId(questionId)) return { ok: false, reason: 'damaged' };
  const result = readSavedScratchpads(storage);
  if (!result.ok) return result;
  const notes = result.notes;
  const current = Object.hasOwn(notes, questionId) ? notes[questionId] : null;
  const next = storedText(draft.text.slice(0, QUESTION_SCRATCHPAD_LIMIT));
  if (current === next) return { ok: true, text: next };
  if (current !== draft.base) return { ok: false, reason: 'conflict', savedText: current };
  if (next !== null && current === null && Object.keys(notes).length >= MAX_QUESTION_SCRATCHPADS) {
    return { ok: false, reason: 'capacity' };
  }
  const updated = { ...notes };
  if (next === null) delete updated[questionId];
  else Object.defineProperty(updated, questionId, { value: next, enumerable: true, configurable: true, writable: true });
  try {
    storage.setItem(QUESTION_SCRATCHPAD_KEY, JSON.stringify(updated));
    return { ok: true, text: next };
  } catch { return { ok: false, reason: 'unavailable' }; }
}

const pendingDrafts = new Map<string, Draft>();
const memoryOnlyDrafts = new Set<string>();

export function updateSavedScratchpad(questionId: string, text: string, base: string | null): ReturnType<typeof persistScratchpad> {
  if (isProgressRestoreInProgress(QUESTION_SCRATCHPAD_KEY)) return { ok: false, reason: 'restoring' };
  try {
    const result = persistScratchpad(window.localStorage, questionId, { text, base });
    if (result.ok) window.dispatchEvent(new Event(QUESTION_SCRATCHPADS_CHANGED));
    return result;
  } catch { return { ok: false, reason: 'unavailable' }; }
}
function warnBeforeLeaving(event: BeforeUnloadEvent) {
  if (memoryOnlyDrafts.size) { event.preventDefault(); event.returnValue = ''; }
}

function forgetDraft(questionId: string) {
  pendingDrafts.delete(questionId);
  memoryOnlyDrafts.delete(questionId);
  try { window.sessionStorage.removeItem(DRAFT_PREFIX + questionId); }
  catch {
    try { window.sessionStorage.setItem(DRAFT_PREFIX + questionId, 'null'); }
    catch { /* A retained older draft will require explicit conflict resolution. */ }
  }
  if (!memoryOnlyDrafts.size) window.removeEventListener('beforeunload', warnBeforeLeaving);
}

function rememberDraft(questionId: string, draft: Draft): 'session' | 'memory' {
  pendingDrafts.set(questionId, draft);
  try {
    window.sessionStorage.setItem(DRAFT_PREFIX + questionId, JSON.stringify(draft));
    memoryOnlyDrafts.delete(questionId);
    if (!memoryOnlyDrafts.size) window.removeEventListener('beforeunload', warnBeforeLeaving);
    return 'session';
  } catch {
    memoryOnlyDrafts.add(questionId);
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return 'memory';
  }
}

export function readQuestionDraft(questionId: string): ScratchpadState {
  let saved: ReturnType<typeof readSavedScratchpad>;
  try { saved = readSavedScratchpad(window.localStorage, questionId); }
  catch { saved = { ok: false, reason: 'unavailable' }; }
  let draft = pendingDrafts.get(questionId);
  if (!draft) {
    try {
      const parsed = JSON.parse(window.sessionStorage.getItem(DRAFT_PREFIX + questionId) ?? 'null');
      if (parsed && typeof parsed.text === 'string' && parsed.text.length <= QUESTION_SCRATCHPAD_LIMIT
        && (parsed.base === null || (typeof parsed.base === 'string' && parsed.base.length <= QUESTION_SCRATCHPAD_LIMIT))) {
        draft = { text: parsed.text, base: parsed.base };
      }
    } catch { /* A browser may disable temporary storage independently. */ }
  }
  if (draft && saved.ok && storedText(draft.text) === saved.text) {
    forgetDraft(questionId);
    draft = undefined;
  }
  if (draft) {
    return {
      ...draft,
      status: !saved.ok ? saved.reason : saved.text !== draft.base ? 'conflict' : 'pending',
      savedText: saved.ok ? saved.text : null,
      recovery: rememberDraft(questionId, draft),
    };
  }
  return {
    text: saved.ok ? saved.text ?? '' : '',
    base: saved.ok ? saved.text : null,
    status: saved.ok ? saved.text ? 'saved' : 'empty' : saved.reason,
    savedText: saved.ok ? saved.text : null,
    recovery: null,
  };
}

export function writeQuestionDraft(questionId: string, text: string, base: string | null): ScratchpadState {
  const draft = { text: text.slice(0, QUESTION_SCRATCHPAD_LIMIT), base };
  let result: ReturnType<typeof persistScratchpad>;
  try {
    result = updateSavedScratchpad(questionId, draft.text, draft.base);
  } catch { result = { ok: false, reason: 'unavailable' }; }
  if (result.ok) {
    forgetDraft(questionId);
    return { ...draft, base: result.text, savedText: result.text, status: result.text ? 'saved' : 'empty', recovery: null };
  }
  return { ...draft, status: result.reason, savedText: result.savedText ?? null, recovery: rememberDraft(questionId, draft) };
}

export function loadSavedQuestionDraft(questionId: string): ScratchpadState {
  try {
    const saved = readSavedScratchpad(window.localStorage, questionId);
    if (!saved.ok) return readQuestionDraft(questionId);
    forgetDraft(questionId);
    return { text: saved.text ?? '', base: saved.text, savedText: saved.text, status: saved.text ? 'saved' : 'empty', recovery: null };
  } catch { return readQuestionDraft(questionId); }
}

export function createWorkingOutline(givenValues: string[]) {
  const given = givenValues.join('; ').slice(0, 300);
  return `Given: ${given}\n\nFind:\n\nWorking:\n\nCheck (units and scale):\n`;
}
