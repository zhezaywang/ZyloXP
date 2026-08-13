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

    const parsedNotes = JSON.parse(storedNotes) as unknown;
    if (!Array.isArray(parsedNotes)) {
      return [];
    }

    return sortFieldNotes(
      parsedNotes
        .flatMap((storedNote, index) => {
          if (!storedNote || typeof storedNote !== 'object') {
            return [];
          }

          const note = storedNote as Partial<FieldNote>;
          if (
            typeof note.title !== 'string' ||
            typeof note.body !== 'string' ||
            !isFieldNoteCategory(note.category)
          ) {
            return [];
          }

          const title = note.title.trim().slice(0, 80);
          const body = note.body.trim().slice(0, 1200);
          if (!title || !body) {
            return [];
          }

          const createdAt =
            typeof note.createdAt === 'number' &&
            Number.isFinite(note.createdAt) &&
            note.createdAt > 0
              ? note.createdAt
              : Date.now();
          const updatedAt =
            typeof note.updatedAt === 'number' &&
            Number.isFinite(note.updatedAt) &&
            note.updatedAt > 0
              ? Math.max(createdAt, note.updatedAt)
              : createdAt;

          return [
            {
              body,
              category: note.category,
              createdAt,
              id:
                typeof note.id === 'string' && note.id.trim()
                  ? note.id.slice(0, 100)
                  : `field-note-${createdAt}-${index}`,
              pinned: note.pinned === true,
              title,
              updatedAt,
            },
          ];
        })
        .slice(0, MAX_FIELD_NOTES),
    );
  } catch {
    return [];
  }
}
