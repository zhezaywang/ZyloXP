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
    window.sessionStorage.removeItem(FIELD_JOURNAL_DRAFT_KEY);
    if (!storedDraft) {
      return null;
    }

    const draft = JSON.parse(storedDraft) as Partial<FieldJournalDraftSeed>;
    if (
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
