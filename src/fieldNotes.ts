import {
  isFieldNoteCategory,
  type FieldNoteCategory,
} from './fieldJournalDraft';

export type FieldNote = {
  body: string;
  category: FieldNoteCategory;
  createdAt: number;
  id: string;
  pinned: boolean;
  title: string;
  updatedAt: number;
};

export const FIELD_JOURNAL_STORAGE_KEY = 'zyloxp-field-journal-v1';
export const MAX_FIELD_NOTES = 40;

export function sortFieldNotes(notes: FieldNote[]) {
  return [...notes].sort(
    (first, second) =>
      Number(second.pinned) - Number(first.pinned) ||
      second.updatedAt - first.updatedAt,
  );
}

export function normalizeFieldNotes(value: unknown, now = Date.now()): FieldNote[] {
  if (!Array.isArray(value)) return [];
  const usedIds = new Set<string>();
  const timestamp = (value: unknown, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= now ? value : fallback;
  return sortFieldNotes(value.flatMap((storedNote, index) => {
    if (!storedNote || typeof storedNote !== 'object') return [];
    const note = storedNote as Partial<FieldNote>;
    if (typeof note.title !== 'string' || typeof note.body !== 'string' || !isFieldNoteCategory(note.category)) return [];
    const title = note.title.trim().slice(0, 80);
    const body = note.body.trim().slice(0, 1200);
    if (!title || !body) return [];
    const createdAt = timestamp(note.createdAt, now);
    const updatedAt = Math.max(createdAt, timestamp(note.updatedAt, createdAt));
    let id = typeof note.id === 'string' ? note.id.trim().slice(0, 100) : '';
    if (!id || usedIds.has(id)) {
      id = `field-note-${createdAt}-${index}`;
      while (usedIds.has(id)) id += '-copy';
    }
    usedIds.add(id);
    return [{ body, category: note.category, createdAt, updatedAt, id, pinned: note.pinned === true, title }];
  })).slice(0, MAX_FIELD_NOTES);
}

export function readFieldNotes(): FieldNote[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedNotes = window.localStorage.getItem(
      FIELD_JOURNAL_STORAGE_KEY,
    );
    if (!storedNotes) {
      return [];
    }

    return normalizeFieldNotes(JSON.parse(storedNotes));
  } catch {
    return [];
  }
}
