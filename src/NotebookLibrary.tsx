import {
  ArrowRight,
  BookmarkCheck,
  BookOpen,
  Clock3,
  FlaskConical,
  Gauge,
  NotebookPen,
  NotebookTabs,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type { LabRunSnapshot } from './LabBenchLog';

export type NotebookLibraryView =
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
}: {
  activeView: NotebookLibraryView;
  benchRunCount: number;
  formulaCount: number;
  noteCount: number;
  onChange: (view: NotebookLibraryView) => void;
  questionCount: number;
}) {
  const counts: Record<NotebookLibraryView, number> = {
    bench: benchRunCount,
    formulas: formulaCount,
    notes: noteCount,
    questions: questionCount,
  };
  const savedItemCount =
    noteCount + formulaCount + questionCount + benchRunCount;

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
