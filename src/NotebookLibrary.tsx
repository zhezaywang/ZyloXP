import {
  ArrowRight,
  BookmarkCheck,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock3,
  FlaskConical,
  Gauge,
  ListTodo,
  NotebookPen,
  NotebookTabs,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { LabRunSnapshot } from './LabBenchLog';
import {
  STUDY_LIST_KINDS,
  getStudyListItemKey,
} from './studyList';
import type {
  StudyListItem,
  StudyListKind,
  StudyListResource,
} from './studyList';

export type NotebookLibraryView =
  | 'study-list'
  | 'notes'
  | 'formulas'
  | 'questions'
  | 'bench';

export type SavedQuestionLibraryItem = {
  accuracy: number | null;
  attempts: number;
  difficulty: string;
  id: string;
  prompt: string;
  questionIndex: number;
  reviewLabel: string;
  subtopic: string;
  topic: string;
  xp: number;
};

const NOTEBOOK_LIBRARY_VIEWS = [
  {
    description: 'Your next learning targets',
    icon: ListTodo,
    id: 'study-list',
    label: 'Study List',
  },
  {
    description: 'Working observations and ideas',
    icon: NotebookPen,
    id: 'notes',
    label: 'Notes',
  },
  {
    description: 'Relationships and recall',
    icon: NotebookTabs,
    id: 'formulas',
    label: 'Formulas',
  },
  {
    description: 'Bookmarked practice prompts',
    icon: BookmarkCheck,
    id: 'questions',
    label: 'Saved Questions',
  },
  {
    description: 'Reusable instrument setups',
    icon: FlaskConical,
    id: 'bench',
    label: 'Bench Runs',
  },
] satisfies Array<{
  description: string;
  icon: typeof NotebookPen;
  id: NotebookLibraryView;
  label: string;
}>;

export function NotebookLibraryTabs({
  activeView,
  benchRunCount,
  formulaCount,
  noteCount,
  onChange,
  questionCount,
  studyListCount,
}: {
  activeView: NotebookLibraryView;
  benchRunCount: number;
  formulaCount: number;
  noteCount: number;
  onChange: (view: NotebookLibraryView) => void;
  questionCount: number;
  studyListCount: number;
}) {
  const counts: Record<NotebookLibraryView, number> = {
    bench: benchRunCount,
    formulas: formulaCount,
    notes: noteCount,
    questions: questionCount,
    'study-list': studyListCount,
  };
  const savedItemCount =
    noteCount + formulaCount + questionCount + benchRunCount + studyListCount;

  return (
    <section
      aria-label="Notebook library"
      className="notebookLibraryNavigation"
    >
      <header>
        <div>
          <p className="eyebrow">Knowledge library</p>
          <h2>Keep every useful artifact close</h2>
        </div>
        <span>
          {savedItemCount} saved {savedItemCount === 1 ? 'item' : 'items'}
        </span>
      </header>

      <nav aria-label="Notebook views">
        {NOTEBOOK_LIBRARY_VIEWS.map((view) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;
          const count = counts[view.id];

          return (
            <button
              aria-pressed={isActive}
              className={isActive ? 'active' : ''}
              key={view.id}
              onClick={() => onChange(view.id)}
              type="button"
            >
              <Icon aria-hidden="true" size={18} />
              <span>
                <strong>{view.label}</strong>
                <small>{view.description}</small>
              </span>
              <em>{count}</em>
            </button>
          );
        })}
      </nav>
    </section>
  );
}

type StudyListKindFilter = 'All' | StudyListKind;

export function StudyListWorkspace({
  catalog,
  items,
  onAdd,
  onClearCompleted,
  onMove,
  onOpen,
  onRemove,
  onToggleComplete,
}: {
  catalog: StudyListResource[];
  items: StudyListItem[];
  onAdd: (resource: StudyListResource) => void;
  onClearCompleted: () => void;
  onMove: (item: StudyListItem, direction: -1 | 1) => void;
  onOpen: (item: StudyListItem) => void;
  onRemove: (item: StudyListItem) => void;
  onToggleComplete: (item: StudyListItem) => void;
}) {
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] =
    useState<StudyListKindFilter>('All');
  const savedKeys = useMemo(
    () => new Set(items.map(getStudyListItemKey)),
    [items],
  );
  const availableResources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return catalog
      .filter((resource) => {
        if (savedKeys.has(getStudyListItemKey(resource))) {
          return false;
        }

        const matchesKind =
          kindFilter === 'All' || resource.kind === kindFilter;
        const matchesQuery =
          normalizedQuery.length === 0 ||
          `${resource.title} ${resource.subtitle} ${resource.kind}`
            .toLowerCase()
            .includes(normalizedQuery);

        return matchesKind && matchesQuery;
      })
      .slice(0, normalizedQuery ? 8 : 6);
  }, [catalog, kindFilter, query, savedKeys]);
  const activeCount = items.filter((item) => item.completedAt === null).length;
  const completedCount = items.length - activeCount;
  const nextItem = items.find((item) => item.completedAt === null) ?? null;

  return (
    <section
      aria-labelledby="study-list-workspace-title"
      className="notebookArtifactWorkspace studyListWorkspace"
    >
      <header className="notebookArtifactHeader studyListHeader">
        <span aria-hidden="true">
          <ListTodo size={23} />
        </span>
        <div>
          <p className="eyebrow">Personal learning queue</p>
          <h2 id="study-list-workspace-title">Study List</h2>
          <p>{activeCount} active · {completedCount} completed</p>
        </div>
        <button
          className="secondaryButton"
          disabled={!nextItem}
          onClick={() => nextItem && onOpen(nextItem)}
          type="button"
        >
          Open next
          <ArrowRight aria-hidden="true" size={16} />
        </button>
      </header>

      <section aria-labelledby="study-list-add-title" className="studyListBuilder">
        <div className="studyListBuilderHeading">
          <div>
            <p className="eyebrow">Add from library</p>
            <h3 id="study-list-add-title">Choose your next target</h3>
          </div>
          <span>{catalog.length} available</span>
        </div>
        <div className="studyListCatalogControls">
          <label>
            <Search aria-hidden="true" size={17} />
            <span className="srOnly">Search learning library</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search concepts, labs, games, or careers"
              type="search"
              value={query}
            />
          </label>
          <label>
            <span className="srOnly">Filter by content type</span>
            <select
              onChange={(event) =>
                setKindFilter(event.target.value as StudyListKindFilter)
              }
              value={kindFilter}
            >
              <option value="All">All types</option>
              {STUDY_LIST_KINDS.map((kind) => (
                <option key={kind} value={kind}>{kind}</option>
              ))}
            </select>
          </label>
        </div>
        {availableResources.length > 0 ? (
          <div className="studyListSuggestions">
            {availableResources.map((resource) => (
              <article key={getStudyListItemKey(resource)}>
                <span>{resource.kind}</span>
                <div>
                  <strong>{resource.title}</strong>
                  <small>{resource.subtitle}</small>
                </div>
                <button
                  aria-label={`Add ${resource.title} to Study List`}
                  className="iconButton"
                  onClick={() => onAdd(resource)}
                  title="Add to Study List"
                  type="button"
                >
                  <Plus aria-hidden="true" size={17} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="studyListCatalogEmpty" role="status">
            <Search aria-hidden="true" size={19} />
            <span>No unsaved matches in this view.</span>
          </div>
        )}
      </section>

      <div className="studyListQueueHeading">
        <div>
          <p className="eyebrow">Ordered queue</p>
          <h3>{items.length === 0 ? 'Nothing queued yet' : 'Up next'}</h3>
        </div>
        {completedCount > 0 && (
          <button onClick={onClearCompleted} type="button">
            Clear completed
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="notebookArtifactEmpty studyListEmpty">
          <ListTodo aria-hidden="true" size={27} />
          <strong>Build a focused queue</strong>
          <p>Add a target above and it will stay ready across sessions.</p>
        </div>
      ) : (
        <div className="studyListItems">
          {items.map((item, index) => {
            const isComplete = item.completedAt !== null;

            return (
              <article
                className={isComplete ? 'complete' : ''}
                key={getStudyListItemKey(item)}
              >
                <button
                  aria-label={`${isComplete ? 'Mark incomplete' : 'Mark complete'}: ${item.title}`}
                  aria-pressed={isComplete}
                  className="studyListCheck"
                  onClick={() => onToggleComplete(item)}
                  title={isComplete ? 'Mark incomplete' : 'Mark complete'}
                  type="button"
                >
                  {isComplete ? (
                    <CheckCircle2 aria-hidden="true" size={21} />
                  ) : (
                    <Circle aria-hidden="true" size={21} />
                  )}
                </button>
                <div className="studyListItemCopy">
                  <span>{item.kind}</span>
                  <h3>{item.title}</h3>
                  <p>{item.subtitle}</p>
                </div>
                <div className="studyListItemActions">
                  <button
                    className="secondaryButton"
                    onClick={() => onOpen(item)}
                    type="button"
                  >
                    Open
                    <ArrowRight aria-hidden="true" size={15} />
                  </button>
                  <button
                    aria-label={`Move ${item.title} up`}
                    className="iconButton ghost"
                    disabled={index === 0}
                    onClick={() => onMove(item, -1)}
                    title="Move up"
                    type="button"
                  >
                    <ChevronUp aria-hidden="true" size={17} />
                  </button>
                  <button
                    aria-label={`Move ${item.title} down`}
                    className="iconButton ghost"
                    disabled={index === items.length - 1}
                    onClick={() => onMove(item, 1)}
                    title="Move down"
                    type="button"
                  >
                    <ChevronDown aria-hidden="true" size={17} />
                  </button>
                  <button
                    aria-label={`Remove ${item.title} from Study List`}
                    className="iconButton ghost"
                    onClick={() => onRemove(item)}
                    title="Remove from Study List"
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={17} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function SavedQuestionLibrary({
  items,
  onBrowse,
  onOpen,
  onRemove,
}: {
  items: SavedQuestionLibraryItem[];
  onBrowse: () => void;
  onOpen: (questionIndex: number) => void;
  onRemove: (questionId: string) => void;
}) {
  return (
    <section
      aria-labelledby="saved-question-library-title"
      className="notebookArtifactWorkspace"
    >
      <header className="notebookArtifactHeader">
        <span aria-hidden="true">
          <BookmarkCheck size={23} />
        </span>
        <div>
          <p className="eyebrow">Practice collection</p>
          <h2 id="saved-question-library-title">Saved questions</h2>
          <p>Return to the prompts worth solving again.</p>
        </div>
        <strong>{items.length} saved</strong>
      </header>

      {items.length === 0 ? (
        <div className="notebookArtifactEmpty">
          <BookOpen aria-hidden="true" size={27} />
          <strong>No questions saved yet</strong>
          <p>Bookmark a useful prompt during Practice to collect it here.</p>
          <button className="secondaryButton" onClick={onBrowse} type="button">
            Browse Question Bank
            <ArrowRight aria-hidden="true" size={17} />
          </button>
        </div>
      ) : (
        <div className="notebookArtifactList">
          {items.map((item) => (
            <article className="notebookQuestionRow" key={item.id}>
              <span className="notebookArtifactIcon question" aria-hidden="true">
                <BookOpen size={19} />
              </span>
              <div className="notebookArtifactCopy">
                <small>
                  {item.topic} · {item.difficulty}
                </small>
                <h3>{item.subtopic}</h3>
                <p>{item.prompt}</p>
                <div>
                  <span>{item.reviewLabel}</span>
                  <span>{item.attempts} attempts</span>
                  <span>
                    {item.accuracy === null
                      ? `+${item.xp} XP`
                      : `${item.accuracy}% accuracy`}
                  </span>
                </div>
              </div>
              <div className="notebookArtifactActions">
                <button
                  className="secondaryButton"
                  onClick={() => onOpen(item.questionIndex)}
                  type="button"
                >
                  Open question
                  <ArrowRight aria-hidden="true" size={16} />
                </button>
                <button
                  aria-label={`Remove ${item.subtopic} from saved questions`}
                  className="iconButton ghost"
                  onClick={() => onRemove(item.id)}
                  title="Remove saved question"
                  type="button"
                >
                  <BookmarkCheck aria-hidden="true" size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function formatRunTime(savedAt: number) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(savedAt);
}

export function BenchRunLibrary({
  getLabTitle,
  onDelete,
  onOpen,
  onOpenLabs,
  runs,
}: {
  getLabTitle: (labId: string) => string;
  onDelete: (runId: string) => void;
  onOpen: (run: LabRunSnapshot) => void;
  onOpenLabs: () => void;
  runs: LabRunSnapshot[];
}) {
  return (
    <section
      aria-labelledby="bench-run-library-title"
      className="notebookArtifactWorkspace"
    >
      <header className="notebookArtifactHeader">
        <span aria-hidden="true">
          <FlaskConical size={23} />
        </span>
        <div>
          <p className="eyebrow">Experiment archive</p>
          <h2 id="bench-run-library-title">Bench runs</h2>
          <p>Restore saved lab controls and continue testing.</p>
        </div>
        <strong>{runs.length} saved</strong>
      </header>

      {runs.length === 0 ? (
        <div className="notebookArtifactEmpty">
          <Gauge aria-hidden="true" size={27} />
          <strong>No bench runs saved yet</strong>
          <p>Save an instrument setup from any interactive lab.</p>
          <button className="secondaryButton" onClick={onOpenLabs} type="button">
            Open Labs
            <ArrowRight aria-hidden="true" size={17} />
          </button>
        </div>
      ) : (
        <div className="notebookArtifactList">
          {runs.map((run) => (
            <article className="notebookBenchRow" key={run.id}>
              <span className="notebookArtifactIcon bench" aria-hidden="true">
                <FlaskConical size={19} />
              </span>
              <div className="notebookArtifactCopy">
                <small>{getLabTitle(run.labId)}</small>
                <h3>{run.output}</h3>
                <div>
                  <span>
                    <Clock3 aria-hidden="true" size={13} />
                    {formatRunTime(run.savedAt)}
                  </span>
                  <span>
                    <RotateCcw aria-hidden="true" size={13} />
                    Restorable setup
                  </span>
                </div>
              </div>
              <div className="notebookArtifactActions">
                <button
                  className="secondaryButton"
                  onClick={() => onOpen(run)}
                  type="button"
                >
                  Restore in lab
                  <ArrowRight aria-hidden="true" size={16} />
                </button>
                <button
                  aria-label={`Delete ${getLabTitle(run.labId)} bench run`}
                  className="iconButton ghost"
                  onClick={() => onDelete(run.id)}
                  title="Delete bench run"
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
