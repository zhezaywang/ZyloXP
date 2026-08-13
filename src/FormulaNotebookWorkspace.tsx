import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Eye,
  FlaskConical,
  NotebookTabs,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';

export type FormulaConfidence = 'learning' | 'ready';
export type NotebookFilter = 'all' | 'learning' | 'ready' | 'saved';

export type FormulaEntry = {
  assumptions: string;
  collectionId: 'circuits' | 'power' | 'hardware' | 'signals';
  context: string;
  difficulty: number | null;
  formula: string;
  id: string;
  source: 'lab' | 'question';
  sourceId: string;
  subtitle: string;
  title: string;
};

export type FormulaReviewState = {
  completed: boolean;
  entryIds: string[];
  position: number;
  readyCount: number;
  revealed: boolean;
  reviewedCount: number;
};

type FormulaNotebookWorkspaceProps = {
  domainCount: number;
  entries: FormulaEntry[];
  filter: NotebookFilter;
  formulaConfidence: Record<string, FormulaConfidence>;
  formulaReviewCompletions: number;
  learningCount: number;
  library: FormulaEntry[];
  onEndReview: () => void;
  onFilterChange: (filter: NotebookFilter) => void;
  onOpenSource: (entry: FormulaEntry) => void;
  onQueryChange: (query: string) => void;
  onRate: (confidence: FormulaConfidence) => void;
  onReveal: () => void;
  onStartReview: () => void;
  onToggleSaved: (entryId: string) => void;
  query: string;
  readyCount: number;
  recallXp: number;
  reviewState: FormulaReviewState | null;
  rewardedFormulaIds: string[];
  savedFormulaIds: string[];
};

export function FormulaNotebookWorkspace({
  domainCount,
  entries,
  filter,
  formulaConfidence,
  formulaReviewCompletions,
  learningCount,
  library,
  onEndReview,
  onFilterChange,
  onOpenSource,
  onQueryChange,
  onRate,
  onReveal,
  onStartReview,
  onToggleSaved,
  query,
  readyCount,
  recallXp,
  reviewState,
  rewardedFormulaIds,
  savedFormulaIds,
}: FormulaNotebookWorkspaceProps) {
  const savedEntries = library.filter((entry) =>
    savedFormulaIds.includes(entry.id),
  );
  const currentReviewEntry = reviewState
    ? library.find(
        (entry) => entry.id === reviewState.entryIds[reviewState.position],
      )
    : null;
  const notebookFilters: {
    count: number;
    id: NotebookFilter;
    label: string;
  }[] = [
    {
      count: library.length,
      id: 'all',
      label: 'All formulas',
    },
    {
      count: savedEntries.length,
      id: 'saved',
      label: 'Saved',
    },
    {
      count: learningCount,
      id: 'learning',
      label: 'Learning',
    },
    {
      count: readyCount,
      id: 'ready',
      label: 'Ready',
    },
  ];

  return (
    <section
      className="formulaNotebookWorkspace"
      aria-labelledby="formula-notebook-title"
    >
      <header className="formulaNotebookHeader">
        <span className="formulaNotebookMark">
          <NotebookTabs size={24} />
        </span>
        <div>
          <p className="eyebrow">Engineering Notebook</p>
          <h2 id="formula-notebook-title">
            {reviewState ? 'Quick recall' : 'Your formula library'}
          </h2>
          <p>
            {reviewState
              ? 'Recall the relationship before revealing it, then rate your confidence.'
              : 'Keep useful relationships, assumptions, and source problems together.'}
          </p>
        </div>
        <div className="formulaNotebookHeaderActions">
          <span>
            <strong>{savedEntries.length}</strong>
            saved
          </span>
          <button
            className={reviewState ? 'secondaryButton' : 'primaryButton'}
            onClick={reviewState ? onEndReview : onStartReview}
            type="button"
          >
            {reviewState ? (
              <>
                <ArrowLeft size={17} />
                Back to library
              </>
            ) : (
              <>
                <BrainCircuit size={17} />
                Start quick recall
              </>
            )}
          </button>
        </div>
      </header>

      {reviewState ? (
        reviewState.completed ? (
          <section className="formulaRecallComplete" aria-live="polite">
            <span>
              <CheckCircle2 size={30} />
            </span>
            <p className="eyebrow">Recall complete</p>
            <h3>That round is in the books.</h3>
            <p>
              You marked {reviewState.readyCount} of {reviewState.reviewedCount}{' '}
              formulas ready. Learning cards will lead your next round.
            </p>
            <div className="formulaRecallResults">
              <div>
                <strong>{reviewState.reviewedCount}</strong>
                <span>reviewed</span>
              </div>
              <div>
                <strong>{reviewState.readyCount}</strong>
                <span>ready</span>
              </div>
              <div>
                <strong>
                  {reviewState.reviewedCount - reviewState.readyCount}
                </strong>
                <span>learning</span>
              </div>
            </div>
            <div className="formulaRecallCompleteActions">
              <button
                className="secondaryButton"
                onClick={onEndReview}
                type="button"
              >
                <NotebookTabs size={17} />
                Browse library
              </button>
              <button
                className="primaryButton"
                onClick={onStartReview}
                type="button"
              >
                <RefreshCw size={17} />
                Review again
              </button>
            </div>
          </section>
        ) : currentReviewEntry ? (
          <section className="formulaRecallStage" aria-live="polite">
            <header>
              <div>
                <span>
                  Card {reviewState.position + 1} of{' '}
                  {reviewState.entryIds.length}
                </span>
                <strong>
                  {reviewState.reviewedCount} checked ·{' '}
                  {reviewState.readyCount} ready
                </strong>
              </div>
              <div
                className="formulaRecallProgress"
                aria-label={`${Math.round(
                  ((reviewState.position + Number(reviewState.revealed)) /
                    reviewState.entryIds.length) *
                    100,
                )}% through recall round`}
              >
                <span
                  style={{
                    width: `${
                      ((reviewState.position + Number(reviewState.revealed)) /
                        reviewState.entryIds.length) *
                      100
                    }%`,
                  }}
                />
              </div>
            </header>

            <div className="formulaRecallPrompt">
              <span className="formulaSourceBadge">
                {currentReviewEntry.source === 'lab' ? (
                  <FlaskConical size={15} />
                ) : (
                  <Target size={15} />
                )}
                {currentReviewEntry.source === 'lab' ? 'Lab' : 'Question'} ·{' '}
                {currentReviewEntry.subtitle}
              </span>
              <h3>{currentReviewEntry.title}</h3>
              <p>{currentReviewEntry.context}</p>

              <div
                className={`formulaRecallAnswer ${
                  reviewState.revealed ? 'revealed' : ''
                }`}
              >
                {reviewState.revealed ? (
                  <>
                    <span>Governing relationship</span>
                    <strong>{currentReviewEntry.formula}</strong>
                    <p>
                      <span>Use when</span>
                      {currentReviewEntry.assumptions}
                    </p>
                  </>
                ) : (
                  <>
                    <BrainCircuit size={28} />
                    <strong>Build the relationship from memory.</strong>
                    <span>
                      Say it aloud or write it down before you reveal the card.
                    </span>
                  </>
                )}
              </div>

              {reviewState.revealed ? (
                <div className="formulaRecallRatings">
                  <button
                    className="secondaryButton"
                    onClick={() => onRate('learning')}
                    type="button"
                  >
                    <RotateCcw size={18} />
                    Review again
                  </button>
                  <button
                    className="primaryButton"
                    onClick={() => onRate('ready')}
                    type="button"
                  >
                    <CheckCircle2 size={18} />
                    I know this
                    {!rewardedFormulaIds.includes(currentReviewEntry.id) && (
                      <span>+{recallXp} XP</span>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  className="primaryButton formulaRevealButton"
                  onClick={onReveal}
                  type="button"
                >
                  Reveal formula
                  <Eye size={18} />
                </button>
              )}
            </div>
          </section>
        ) : (
          <section className="formulaNotebookEmpty">
            <NotebookTabs size={25} />
            <strong>This recall card is no longer available.</strong>
            <button onClick={onEndReview} type="button">
              Return to library
            </button>
          </section>
        )
      ) : (
        <>
          <section className="formulaNotebookStats" aria-label="Notebook summary">
            <article>
              <span>
                <BookmarkCheck size={18} />
                Saved
              </span>
              <strong>{savedEntries.length}</strong>
              <small>relationships kept</small>
            </article>
            <article>
              <span>
                <CircleGauge size={18} />
                Learning
              </span>
              <strong>{learningCount}</strong>
              <small>lead the next recall</small>
            </article>
            <article>
              <span>
                <CheckCircle2 size={18} />
                Ready
              </span>
              <strong>{readyCount}</strong>
              <small>recalled confidently</small>
            </article>
            <article>
              <span>
                <Sparkles size={18} />
                Coverage
              </span>
              <strong>{domainCount}</strong>
              <small>{domainCount === 1 ? 'domain' : 'domains'} represented</small>
            </article>
          </section>

          <div className="formulaNotebookToolbar">
            <label className="formulaNotebookSearch">
              <Search size={18} />
              <input
                aria-label="Search formula notebook"
                onChange={(event) => onQueryChange(event.currentTarget.value)}
                placeholder="Search relationships, topics, or assumptions"
                type="search"
                value={query}
              />
            </label>

            <nav aria-label="Filter formula notebook">
              {notebookFilters.map((notebookFilter) => (
                <button
                  aria-pressed={filter === notebookFilter.id}
                  className={filter === notebookFilter.id ? 'active' : ''}
                  key={notebookFilter.id}
                  onClick={() => onFilterChange(notebookFilter.id)}
                  type="button"
                >
                  {notebookFilter.label}
                  <span>{notebookFilter.count}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="formulaNotebookGrid">
            <div className="formulaCardGrid" aria-live="polite">
              {entries.map((entry) => {
                const isSaved = savedFormulaIds.includes(entry.id);
                const confidence = formulaConfidence[entry.id] ?? 'learning';

                return (
                  <article
                    className={`formulaCard ${isSaved ? 'saved' : ''}`}
                    key={entry.id}
                  >
                    <header>
                      <span className="formulaSourceBadge">
                        {entry.source === 'lab' ? (
                          <FlaskConical size={14} />
                        ) : (
                          <Target size={14} />
                        )}
                        {entry.source === 'lab' ? 'Lab' : 'Question'}
                      </span>
                      <button
                        aria-label={
                          isSaved
                            ? `Remove ${entry.title} from notebook`
                            : `Save ${entry.title} to notebook`
                        }
                        aria-pressed={isSaved}
                        className={isSaved ? 'saved' : ''}
                        onClick={() => onToggleSaved(entry.id)}
                        title={isSaved ? 'Remove formula' : 'Save formula'}
                        type="button"
                      >
                        {isSaved ? (
                          <BookmarkCheck size={18} />
                        ) : (
                          <Bookmark size={18} />
                        )}
                      </button>
                    </header>

                    <div className="formulaCardTitle">
                      <span>{entry.subtitle}</span>
                      <h3>{entry.title}</h3>
                    </div>

                    <div className="formulaRelationship">
                      <span>Relationship</span>
                      <strong>{entry.formula}</strong>
                    </div>

                    <p className="formulaAssumption">
                      <span>Use when</span>
                      {entry.assumptions}
                    </p>

                    <footer>
                      <span
                        className={`formulaConfidence ${
                          isSaved ? confidence : 'available'
                        }`}
                      >
                        {isSaved ? (
                          confidence === 'ready' ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <CircleGauge size={14} />
                          )
                        ) : (
                          <Sparkles size={14} />
                        )}
                        {isSaved
                          ? confidence === 'ready'
                            ? 'Ready'
                            : 'Learning'
                          : 'Available'}
                      </span>
                      <button
                        onClick={() => onOpenSource(entry)}
                        type="button"
                      >
                        Open {entry.source}
                        <ArrowRight size={15} />
                      </button>
                    </footer>
                  </article>
                );
              })}

              {entries.length === 0 && (
                <div className="formulaNotebookEmpty">
                  <Search size={24} />
                  <strong>No formulas match this view.</strong>
                  <span>Try another filter or a broader search.</span>
                  <button
                    onClick={() => {
                      onFilterChange('all');
                      onQueryChange('');
                    }}
                    type="button"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            <aside className="formulaReviewQueue" aria-label="Quick recall queue">
              <header>
                <span>
                  <BrainCircuit size={20} />
                </span>
                <div>
                  <p className="eyebrow">Quick recall</p>
                  <h3>Next five cards</h3>
                </div>
              </header>
              <p>
                Learning cards come first, followed by formulas already marked
                ready.
              </p>

              {savedEntries.length > 0 ? (
                <div>
                  {[...savedEntries]
                    .sort((left, right) => {
                      const leftConfidence =
                        formulaConfidence[left.id] ?? 'learning';
                      const rightConfidence =
                        formulaConfidence[right.id] ?? 'learning';

                      return (
                        Number(leftConfidence === 'ready') -
                          Number(rightConfidence === 'ready') ||
                        left.title.localeCompare(right.title)
                      );
                    })
                    .slice(0, 5)
                    .map((entry, index) => {
                      const confidence =
                        formulaConfidence[entry.id] ?? 'learning';

                      return (
                        <button
                          key={entry.id}
                          onClick={() => onOpenSource(entry)}
                          type="button"
                        >
                          <span>{index + 1}</span>
                          <div>
                            <strong>{entry.title}</strong>
                            <small>
                              {confidence === 'ready'
                                ? 'Ready'
                                : 'Learning'}{' '}
                              · {entry.formula}
                            </small>
                          </div>
                          <ChevronRight size={16} />
                        </button>
                      );
                    })}
                </div>
              ) : (
                <div className="formulaQueueEmpty">
                  <Bookmark size={20} />
                  <strong>No cards saved yet</strong>
                  <span>Use the bookmark icon in the library to add one.</span>
                </div>
              )}

              <button
                className="primaryButton fullWidth"
                onClick={onStartReview}
                type="button"
              >
                <BrainCircuit size={17} />
                {savedEntries.length === 0
                  ? 'Build recall queue'
                  : `Start ${Math.min(5, savedEntries.length)}-card recall`}
              </button>
              <small>
                {formulaReviewCompletions === 0
                  ? 'Your first round unlocks Formula Fluent.'
                  : `${formulaReviewCompletions} recall ${
                      formulaReviewCompletions === 1 ? 'round' : 'rounds'
                    } completed.`}
              </small>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
