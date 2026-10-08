export type FieldNoteCategory = 'career' | 'formula' | 'idea' | 'lab';

export type FieldJournalDraft = {
  body: string;
  category: FieldNoteCategory;
  title: string;
};

export type FieldJournalDraftSeed = {
  body?: string;
  category: FieldNoteCategory;
  title: string;
};

const FIELD_JOURNAL_DRAFT_KEY = 'zyloxp-field-journal-draft-v1';
const FIELD_JOURNAL_EDITOR_KEY = 'zyloxp-field-journal-editor-v1';

export type FieldJournalEditor = { draft: FieldJournalDraft; editingNoteId: string | null };

export function readFieldJournalEditor(): FieldJournalEditor | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = JSON.parse(window.sessionStorage.getItem(FIELD_JOURNAL_EDITOR_KEY) ?? 'null');
    if (!value || !value.draft || typeof value.draft.title !== 'string' || typeof value.draft.body !== 'string' || !isFieldNoteCategory(value.draft.category)) return null;
    return { draft: { title: value.draft.title.slice(0, 80), body: value.draft.body.slice(0, 1200), category: value.draft.category },
      editingNoteId: typeof value.editingNoteId === 'string' ? value.editingNoteId.slice(0, 100) : null };
  } catch { return null; }
}

export function saveFieldJournalEditor(editor: FieldJournalEditor | null) {
  try {
    if (editor) window.sessionStorage.setItem(FIELD_JOURNAL_EDITOR_KEY, JSON.stringify(editor));
    else window.sessionStorage.removeItem(FIELD_JOURNAL_EDITOR_KEY);
    return true;
  } catch { return false; }
}

export function clearPendingFieldJournalDraft() {
  try { window.sessionStorage.removeItem(FIELD_JOURNAL_DRAFT_KEY); } catch { /* Draft remains available for retry. */ }
}

export function isFieldNoteCategory(
  value: unknown,
): value is FieldNoteCategory {
  return (
    value === 'career' ||
    value === 'formula' ||
    value === 'idea' ||
    value === 'lab'
  );
}

export function stageFieldJournalDraft(seed: FieldJournalDraftSeed) {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.sessionStorage.setItem(
      FIELD_JOURNAL_DRAFT_KEY,
      JSON.stringify({
        body: seed.body?.slice(0, 1200) ?? '',
        category: seed.category,
        title: seed.title.slice(0, 80),
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function readPendingFieldJournalDraft(): FieldJournalDraft | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedDraft = window.sessionStorage.getItem(FIELD_JOURNAL_DRAFT_KEY);
    if (!storedDraft) {
      return null;
    }

    const draft = JSON.parse(storedDraft) as Partial<FieldJournalDraftSeed>;
    if (
      !draft ||
      typeof draft.title !== 'string' ||
      !draft.title.trim() ||
      !isFieldNoteCategory(draft.category)
    ) {
      return null;
    }

    return {
      body: typeof draft.body === 'string' ? draft.body.slice(0, 1200) : '',
      category: draft.category,
      title: draft.title.trim().slice(0, 80),
    };
  } catch {
    return null;
  }
}
