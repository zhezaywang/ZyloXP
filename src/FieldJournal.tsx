import {
  Briefcase,
  Calculator,
  Check,
  FlaskConical,
  Lightbulb,
  NotebookPen,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import {
  isFieldNoteCategory,
  readPendingFieldJournalDraft,
} from './fieldJournalDraft';
import type {
  FieldJournalDraft as FieldNoteDraft,
  FieldNoteCategory,
} from './fieldJournalDraft';

type FieldNote = {
  body: string;
  category: FieldNoteCategory;
  createdAt: number;
  id: string;
  pinned: boolean;
  title: string;
  updatedAt: number;
};

type JournalFilter = 'all' | FieldNoteCategory;

const FIELD_JOURNAL_STORAGE_KEY = 'zyloxp-field-journal-v1';
const MAX_FIELD_NOTES = 40;
const EMPTY_DRAFT: FieldNoteDraft = {
  body: '',
  category: 'idea',
  title: '',
};

const CATEGORY_OPTIONS: Array<{
  icon: typeof Lightbulb;
  id: FieldNoteCategory;
  label: string;
}> = [
  { icon: Lightbulb, id: 'idea', label: 'Idea' },
  { icon: Calculator, id: 'formula', label: 'Formula' },
  { icon: FlaskConical, id: 'lab', label: 'Lab' },
  { icon: Briefcase, id: 'career', label: 'Career' },
];

function sortFieldNotes(notes: FieldNote[]) {
  return [...notes].sort(
    (first, second) =>
      Number(second.pinned) - Number(first.pinned) ||
      second.updatedAt - first.updatedAt,
  );
}

function readFieldNotes(): FieldNote[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedNotes = window.localStorage.getItem(FIELD_JOURNAL_STORAGE_KEY);
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

function formatNoteTime(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const elapsedMinutes = Math.floor((now.getTime() - timestamp) / 60_000);

  if (elapsedMinutes < 1) {
    return 'Now';
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  if (date.toDateString() === now.toDateString()) {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function FieldJournal({
  onNoteCountChange,
}: {
  onNoteCountChange?: (count: number) => void;
}) {
  const [notes, setNotes] = useState<FieldNote[]>(readFieldNotes);
  const [pendingDraft] = useState<FieldNoteDraft | null>(
    readPendingFieldJournalDraft,
  );
  const [filter, setFilter] = useState<JournalFilter>('all');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<FieldNoteDraft>(
    pendingDraft ?? EMPTY_DRAFT,
  );
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(Boolean(pendingDraft));
  const [deletedNote, setDeletedNote] = useState<FieldNote | null>(null);
  const editorRef = useRef<HTMLFormElement | null>(null);

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return notes.filter((note) => {
      const matchesFilter = filter === 'all' || note.category === filter;
      const matchesQuery =
        !normalizedQuery ||
        `${note.title} ${note.body}`.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [filter, notes, query]);

  const pinnedCount = notes.filter((note) => note.pinned).length;

  useEffect(() => {
    try {
      window.localStorage.setItem(
        FIELD_JOURNAL_STORAGE_KEY,
        JSON.stringify(notes),
      );
    } catch {
      // Keep the journal available in memory when storage is unavailable.
    }
  }, [notes]);

  useEffect(() => {
    onNoteCountChange?.(notes.length);
  }, [notes.length, onNoteCountChange]);

  function resetEditor() {
    setDraft(EMPTY_DRAFT);
    setEditingNoteId(null);
    setEditorOpen(false);
  }

  function openEditor(note?: FieldNote) {
    if (note) {
      setDraft({
        body: note.body,
        category: note.category,
        title: note.title,
      });
      setEditingNoteId(note.id);
    } else {
      setDraft(EMPTY_DRAFT);
      setEditingNoteId(null);
    }

    setEditorOpen(true);
    window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.title.trim();
    const body = draft.body.trim();
    if (!title || !body) {
      return;
    }

    const updatedAt = Date.now();
    setNotes((currentNotes) => {
      if (editingNoteId) {
        return sortFieldNotes(
          currentNotes.map((note) =>
            note.id === editingNoteId
              ? {
                  ...note,
                  body: body.slice(0, 1200),
                  category: draft.category,
                  title: title.slice(0, 80),
                  updatedAt,
                }
              : note,
          ),
        );
      }

      const note: FieldNote = {
        body: body.slice(0, 1200),
        category: draft.category,
        createdAt: updatedAt,
        id: `field-note-${updatedAt}-${Math.random().toString(36).slice(2, 8)}`,
        pinned: false,
        title: title.slice(0, 80),
        updatedAt,
      };

      return sortFieldNotes([note, ...currentNotes]).slice(
        0,
        MAX_FIELD_NOTES,
      );
    });
    setDeletedNote(null);
    resetEditor();
  }

  function handleTogglePin(noteId: string) {
    setNotes((currentNotes) =>
      sortFieldNotes(
        currentNotes.map((note) =>
          note.id === noteId
            ? { ...note, pinned: !note.pinned }
            : note,
        ),
      ),
    );
  }

  function handleDelete(note: FieldNote) {
    setNotes((currentNotes) =>
      currentNotes.filter((candidate) => candidate.id !== note.id),
    );
    setDeletedNote(note);

    if (editingNoteId === note.id) {
      resetEditor();
    }
  }

  function handleUndoDelete() {
    if (!deletedNote) {
      return;
    }

    setNotes((currentNotes) =>
      sortFieldNotes([
        deletedNote,
        ...currentNotes.filter((note) => note.id !== deletedNote.id),
      ]).slice(0, MAX_FIELD_NOTES),
    );
    setDeletedNote(null);
  }

  return (
    <section className="fieldJournal" aria-labelledby="field-journal-title">
      <header className="fieldJournalHeader">
        <span className="fieldJournalMark">
          <NotebookPen size={23} />
        </span>
        <div>
          <p className="eyebrow">Field Journal</p>
          <h2 id="field-journal-title">Working notes</h2>
        </div>
        <div className="fieldJournalCounts" aria-label="Journal summary">
          <span>
            <strong>{notes.length}</strong> notes
          </span>
          <span>
            <strong>{pinnedCount}</strong> pinned
          </span>
        </div>
        <button
          className="primaryButton"
          onClick={() => (editorOpen ? resetEditor() : openEditor())}
          type="button"
        >
          {editorOpen ? <X size={17} /> : <Plus size={17} />}
          {editorOpen ? 'Close editor' : 'New note'}
        </button>
      </header>

      {editorOpen && (
        <form
          className="fieldJournalEditor"
          onSubmit={handleSubmit}
          ref={editorRef}
        >
          <header>
            <div>
              <p className="eyebrow">
                {editingNoteId ? 'Update entry' : 'New entry'}
              </p>
              <h3>{editingNoteId ? 'Edit field note' : 'Capture a field note'}</h3>
            </div>
            <button
              aria-label="Close note editor"
              onClick={resetEditor}
              title="Close editor"
              type="button"
            >
              <X size={18} />
            </button>
          </header>

          <label className="fieldJournalTitleInput">
            <span>Title</span>
            <input
              maxLength={80}
              onChange={(event) => {
                const title = event.currentTarget.value;
                setDraft((current) => ({
                  ...current,
                  title,
                }));
              }}
              placeholder="Observation or question"
              required
              value={draft.title}
            />
          </label>

          <fieldset className="fieldJournalCategories">
            <legend>Category</legend>
            {CATEGORY_OPTIONS.map((category) => {
              const Icon = category.icon;

              return (
                <button
                  aria-pressed={draft.category === category.id}
                  className={category.id}
                  key={category.id}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      category: category.id,
                    }))
                  }
                  type="button"
                >
                  <Icon size={16} />
                  {category.label}
                </button>
              );
            })}
          </fieldset>

          <label className="fieldJournalBodyInput">
            <span>Note</span>
            <textarea
              maxLength={1200}
              onChange={(event) => {
                const body = event.currentTarget.value;
                setDraft((current) => ({
                  ...current,
                  body,
                }));
              }}
              placeholder="Record the reasoning, measurement, or next check."
              required
              rows={5}
              value={draft.body}
            />
          </label>

          <footer>
            <span>{draft.body.length}/1200</span>
            <button className="secondaryButton" onClick={resetEditor} type="button">
              Cancel
            </button>
            <button
              className="primaryButton"
              disabled={!draft.title.trim() || !draft.body.trim()}
              type="submit"
            >
              <Check size={17} />
              {editingNoteId ? 'Update note' : 'Save note'}
            </button>
          </footer>
        </form>
      )}

      <div className="fieldJournalToolbar">
        <label>
          <Search size={17} />
          <input
            aria-label="Search field notes"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search notes"
            type="search"
            value={query}
          />
        </label>

        <nav aria-label="Filter field notes">
          <button
            aria-pressed={filter === 'all'}
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
            type="button"
          >
            All
            <span>{notes.length}</span>
          </button>
          {CATEGORY_OPTIONS.map((category) => (
            <button
              aria-pressed={filter === category.id}
              className={`${category.id} ${
                filter === category.id ? 'active' : ''
              }`}
              key={category.id}
              onClick={() => setFilter(category.id)}
              type="button"
            >
              {category.label}
            </button>
          ))}
        </nav>
      </div>

      {deletedNote && (
        <div className="fieldJournalUndo" aria-live="polite">
          <span>“{deletedNote.title}” removed</span>
          <button onClick={handleUndoDelete} type="button">
            Undo
          </button>
          <button
            aria-label="Dismiss deleted note message"
            onClick={() => setDeletedNote(null)}
            title="Dismiss"
            type="button"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="fieldJournalGrid" aria-live="polite">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => {
            const category =
              CATEGORY_OPTIONS.find((option) => option.id === note.category) ??
              CATEGORY_OPTIONS[0];
            const CategoryIcon = category.icon;

            return (
              <article className={`fieldNote ${note.category}`} key={note.id}>
                <header>
                  <span className="fieldNoteCategory">
                    <CategoryIcon size={14} />
                    {category.label}
                  </span>
                  <time dateTime={new Date(note.updatedAt).toISOString()}>
                    {formatNoteTime(note.updatedAt)}
                  </time>
                  <button
                    aria-label={
                      note.pinned ? `Unpin ${note.title}` : `Pin ${note.title}`
                    }
                    aria-pressed={note.pinned}
                    className={note.pinned ? 'pinned' : ''}
                    onClick={() => handleTogglePin(note.id)}
                    title={note.pinned ? 'Unpin note' : 'Pin note'}
                    type="button"
                  >
                    {note.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                  </button>
                  <button
                    aria-label={`Edit ${note.title}`}
                    onClick={() => openEditor(note)}
                    title="Edit note"
                    type="button"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    aria-label={`Delete ${note.title}`}
                    className="delete"
                    onClick={() => handleDelete(note)}
                    title="Delete note"
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </header>

                <h3>{note.title}</h3>
                <p>{note.body}</p>

                <footer>
                  {note.pinned && (
                    <span>
                      <Pin size={13} />
                      Pinned
                    </span>
                  )}
                  <small>
                    {note.updatedAt > note.createdAt ? 'Edited' : 'Created'}{' '}
                    {formatNoteTime(note.updatedAt)}
                  </small>
                </footer>
              </article>
            );
          })
        ) : (
          <div className="fieldJournalEmpty">
            <NotebookPen size={25} />
            <strong>
              {notes.length === 0 ? 'No field notes yet' : 'No matching notes'}
            </strong>
            <span>
              {notes.length === 0
                ? 'Create the first entry from this notebook.'
                : 'Try another category or search.'}
            </span>
            <button
              onClick={() => {
                if (notes.length === 0) {
                  openEditor();
                  return;
                }

                setFilter('all');
                setQuery('');
              }}
              type="button"
            >
              {notes.length === 0 ? 'New note' : 'Clear filters'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
