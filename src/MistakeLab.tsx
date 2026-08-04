import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Calculator,
  CheckCircle2,
  Clock3,
  Eye,
  Gauge,
  Lightbulb,
  RefreshCw,
  Ruler,
  Save,
  Sparkles,
  Target,
  TriangleAlert,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  MistakeCause,
  MistakeLabItem,
  MistakeReflection,
} from './mistakeLabModel';

type MistakeFilter = 'active' | 'all' | 'recovered' | 'reflected';

type MistakeLabProps = {
  coach: ReactNode;
  items: MistakeLabItem[];
  onBack: () => void;
  onPracticeQuestion: (item: MistakeLabItem) => void;
  onSaveReflection: (
    questionId: string,
    reflection: MistakeReflection,
  ) => void;
  onStartRecovery: () => void;
  recoveryActive: boolean;
  recoveryCompletionCount: number;
  reflections: Record<string, MistakeReflection>;
};

const MISTAKE_CAUSES: Array<{
  detail: string;
  icon: typeof BrainCircuit;
  id: MistakeCause;
  label: string;
}> = [
  {
    detail: 'The underlying idea was not stable yet.',
    icon: BrainCircuit,
    id: 'concept',
    label: 'Concept gap',
  },
  {
    detail: 'The wrong relationship or equation was selected.',
    icon: Calculator,
    id: 'formula',
    label: 'Formula choice',
  },
  {
    detail: 'A prefix, conversion, or scale changed the result.',
    icon: Ruler,
    id: 'units',
    label: 'Units / scale',
  },
  {
    detail: 'A symbol, branch, or measurement point was misread.',
    icon: Eye,
    id: 'diagram',
    label: 'Diagram read',
  },
  {
    detail: 'The process was skipped or the answer was rushed.',
    icon: Gauge,
    id: 'rushed',
    label: 'Rushed',
  },
];

const FILTERS: Array<{ id: MistakeFilter; label: string }> = [
  { id: 'active', label: 'Active' },
  { id: 'reflected', label: 'Reflected' },
  { id: 'recovered', label: 'Recovered' },
  { id: 'all', label: 'All' },
];

function formatLastSeen(timestamp: number) {
  const elapsed = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(elapsed / 60_000);

  if (minutes < 1) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getCauseLabel(cause: MistakeCause | undefined) {
  return MISTAKE_CAUSES.find((item) => item.id === cause)?.label;
}

export function MistakeLab({
  coach,
  items,
  onBack,
  onPracticeQuestion,
  onSaveReflection,
  onStartRecovery,
  recoveryActive,
  recoveryCompletionCount,
  reflections,
}: MistakeLabProps) {
  const activeItems = useMemo(
    () => items.filter((item) => !item.recovered),
    [items],
  );
  const recoveredItems = useMemo(
    () => items.filter((item) => item.recovered),
    [items],
  );
  const reflectedItems = useMemo(
    () => items.filter((item) => Boolean(reflections[item.id])),
    [items, reflections],
  );
  const patternGroups = useMemo(() => {
    const patterns = new Map<
      string,
      { active: number; mistakes: number; questions: number; topic: string }
    >();

    items.forEach((item) => {
      const pattern = patterns.get(item.topic) ?? {
        active: 0,
        mistakes: 0,
        questions: 0,
        topic: item.topic,
      };
      pattern.active += Number(!item.recovered);
      pattern.mistakes += item.mistakes;
      pattern.questions += 1;
      patterns.set(item.topic, pattern);
    });

    return [...patterns.values()]
      .sort(
        (left, right) =>
          right.active - left.active ||
          right.mistakes - left.mistakes ||
          left.topic.localeCompare(right.topic),
      )
      .slice(0, 4);
  }, [items]);
  const commonCause = useMemo(() => {
    const counts = new Map<MistakeCause, number>();

    Object.values(reflections).forEach((reflection) => {
      counts.set(reflection.cause, (counts.get(reflection.cause) ?? 0) + 1);
    });

    return [...counts.entries()].sort(
      ([leftCause, leftCount], [rightCause, rightCount]) =>
        rightCount - leftCount || leftCause.localeCompare(rightCause),
    )[0]?.[0];
  }, [reflections]);
  const [filter, setFilter] = useState<MistakeFilter>(
    activeItems.length > 0 ? 'active' : 'all',
  );
  const [topicFilter, setTopicFilter] = useState('all');
  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesStatus =
          filter === 'all' ||
          (filter === 'active' && !item.recovered) ||
          (filter === 'recovered' && item.recovered) ||
          (filter === 'reflected' && Boolean(reflections[item.id]));
        const matchesTopic =
          topicFilter === 'all' || item.topic === topicFilter;

        return matchesStatus && matchesTopic;
      }),
    [filter, items, reflections, topicFilter],
  );
  const [selectedItemId, setSelectedItemId] = useState(
    activeItems[0]?.id ?? items[0]?.id ?? '',
  );
  const selectedItem =
    filteredItems.find((item) => item.id === selectedItemId) ??
    filteredItems[0] ??
    items.find((item) => item.id === selectedItemId) ??
    items[0];
  const storedReflection = selectedItem
    ? reflections[selectedItem.id]
    : undefined;
  const [draftCause, setDraftCause] = useState<MistakeCause | null>(
    storedReflection?.cause ?? null,
  );
  const [draftNote, setDraftNote] = useState(storedReflection?.note ?? '');
  const reflectionSaved =
    storedReflection !== undefined &&
    storedReflection.cause === draftCause &&
    storedReflection.note === draftNote.trim();

  useEffect(() => {
    if (
      filteredItems.length > 0 &&
      !filteredItems.some((item) => item.id === selectedItemId)
    ) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [filteredItems, selectedItemId]);

  useEffect(() => {
    setDraftCause(storedReflection?.cause ?? null);
    setDraftNote(storedReflection?.note ?? '');
  }, [
    selectedItem?.id,
    storedReflection?.cause,
    storedReflection?.note,
  ]);

  function handleSaveReflection() {
    if (!selectedItem || !draftCause) {
      return;
    }

    onSaveReflection(selectedItem.id, {
      cause: draftCause,
      note: draftNote.trim(),
      updatedAt: Date.now(),
    });
  }

  return (
    <section className="mistakeLabPage" aria-label="Mistake Lab">
      <header className="mistakeLabHeader">
        <button
          className="secondaryButton compactHeaderBack"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </button>
        <div>
          <p className="eyebrow">Zy Recovery</p>
          <h1>Mistake Lab</h1>
          <p>Find the pattern, name the cause, and test the repair.</p>
        </div>
        <button
          className="primaryButton"
          disabled={activeItems.length === 0 && !recoveryActive}
          onClick={onStartRecovery}
          type="button"
        >
          {recoveryActive ? (
            <>
              <RefreshCw size={17} />
              Resume recovery
            </>
          ) : (
            <>
              <Sparkles size={17} />
              Start {Math.min(5, activeItems.length)}-question recovery
            </>
          )}
        </button>
      </header>

      <section className="mistakeMetricBand" aria-label="Mistake Lab metrics">
        <div className="active">
          <TriangleAlert size={19} />
          <span>Active misses</span>
          <strong>{activeItems.length}</strong>
        </div>
        <div className="repeat">
          <RefreshCw size={19} />
          <span>Total mistakes</span>
          <strong>
            {items.reduce((total, item) => total + item.mistakes, 0)}
          </strong>
        </div>
        <div className="reflected">
          <Lightbulb size={19} />
          <span>Reflected</span>
          <strong>{reflectedItems.length}</strong>
        </div>
        <div className="recovered">
          <CheckCircle2 size={19} />
          <span>Recovered</span>
          <strong>{recoveredItems.length}</strong>
        </div>
      </section>

      <section className="mistakePatternStrip" aria-label="Mistake patterns">
        <header>
          <span>
            <Target size={17} />
            Pattern map
          </span>
          <small>
            {commonCause
              ? `${getCauseLabel(commonCause)} is your most common tagged cause.`
              : 'Tag a cause to reveal your strongest pattern.'}
          </small>
        </header>
        <div>
          <button
            aria-pressed={topicFilter === 'all'}
            className={topicFilter === 'all' ? 'active' : ''}
            onClick={() => setTopicFilter('all')}
            type="button"
          >
            <strong>All topics</strong>
            <span>{items.length} questions</span>
          </button>
          {patternGroups.map((pattern) => (
            <button
              aria-pressed={topicFilter === pattern.topic}
              className={topicFilter === pattern.topic ? 'active' : ''}
              key={pattern.topic}
              onClick={() => setTopicFilter(pattern.topic)}
              type="button"
            >
              <strong>{pattern.topic}</strong>
              <span>
                {pattern.active} active · {pattern.mistakes} misses
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="mistakeLabLayout">
        <main className="mistakeQueue" aria-label="Mistake queue">
          <header>
            <div>
              <p className="eyebrow">Error queue</p>
              <h2>
                {filteredItems.length}{' '}
                {filteredItems.length === 1 ? 'question' : 'questions'}
              </h2>
            </div>
            <nav aria-label="Mistake filters">
              {FILTERS.map((option) => (
                <button
                  aria-pressed={filter === option.id}
                  className={filter === option.id ? 'active' : ''}
                  key={option.id}
                  onClick={() => setFilter(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </nav>
          </header>

          {filteredItems.length > 0 ? (
            <div className="mistakeQueueList">
              {filteredItems.map((item, index) => {
                const reflection = reflections[item.id];

                return (
                  <button
                    aria-pressed={selectedItem?.id === item.id}
                    className={`${selectedItem?.id === item.id ? 'active' : ''} ${
                      item.recovered ? 'recovered' : ''
                    }`}
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    type="button"
                  >
                    <span className="mistakeQueueIndex">
                      {item.recovered ? <CheckCircle2 size={16} /> : index + 1}
                    </span>
                    <span className="mistakeQueueCopy">
                      <small>
                        {item.topic} · {item.subtopic}
                      </small>
                      <strong>{item.prompt}</strong>
                      <span>
                        {item.accuracy}% accuracy · {item.mistakes}{' '}
                        {item.mistakes === 1 ? 'miss' : 'misses'} ·{' '}
                        {formatLastSeen(item.lastAnsweredAt)}
                      </span>
                    </span>
                    <em className={reflection ? 'tagged' : ''}>
                      {item.recovered
                        ? 'Recovered'
                        : reflection
                          ? getCauseLabel(reflection.cause)
                          : 'Needs reflection'}
                    </em>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mistakeQueueEmpty">
              <CheckCircle2 size={26} />
              <strong>No questions match this view.</strong>
              <p>Try another filter or return to all topics.</p>
              <button
                className="secondaryButton"
                onClick={() => {
                  setFilter('all');
                  setTopicFilter('all');
                }}
                type="button"
              >
                Show all mistakes
              </button>
            </div>
          )}
        </main>

        <aside className="mistakeReflectionRail" aria-label="Reflection workbench">
          <div className="mistakeCoach">{coach}</div>
          {selectedItem ? (
            <section className="mistakeReflectionTool">
              <header>
                <span className={selectedItem.recovered ? 'recovered' : 'active'}>
                  {selectedItem.recovered ? 'Recovered check' : 'Active repair'}
                </span>
                <small>{selectedItem.difficultyLabel}</small>
              </header>
              <p className="eyebrow">{selectedItem.subtopic}</p>
              <h2>{selectedItem.prompt}</h2>
              <div className="mistakeFormula">
                <span>Governing relation</span>
                <strong>{selectedItem.formula || 'Conceptual reasoning'}</strong>
              </div>

              <fieldset className="mistakeCausePicker">
                <legend>What changed the result?</legend>
                <div>
                  {MISTAKE_CAUSES.map((cause) => {
                    const Icon = cause.icon;

                    return (
                      <button
                        aria-pressed={draftCause === cause.id}
                        className={draftCause === cause.id ? 'active' : ''}
                        key={cause.id}
                        onClick={() => setDraftCause(cause.id)}
                        title={cause.detail}
                        type="button"
                      >
                        <Icon size={16} />
                        <span>{cause.label}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <label className="mistakeNoteField">
                <span>
                  Repair note
                  <small>{draftNote.length}/180</small>
                </span>
                <textarea
                  maxLength={180}
                  onChange={(event) => setDraftNote(event.currentTarget.value)}
                  placeholder="Write the check you will use next time."
                  rows={3}
                  value={draftNote}
                />
              </label>

              <div className="mistakeReflectionActions">
                <button
                  className="secondaryButton"
                  disabled={!draftCause || reflectionSaved}
                  onClick={handleSaveReflection}
                  type="button"
                >
                  {reflectionSaved ? (
                    <>
                      <CheckCircle2 size={17} />
                      Reflection saved
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save reflection
                    </>
                  )}
                </button>
                <button
                  className="primaryButton"
                  onClick={() => onPracticeQuestion(selectedItem)}
                  type="button"
                >
                  Practice this prompt
                  <ArrowRight size={17} />
                </button>
              </div>

              <footer>
                <Clock3 size={15} />
                <span>
                  {recoveryCompletionCount === 0
                    ? 'Your first completed recovery unlocks Pattern Breaker.'
                    : `${recoveryCompletionCount} recovery ${
                        recoveryCompletionCount === 1 ? 'sprint' : 'sprints'
                      } completed.`}
                </span>
              </footer>
            </section>
          ) : (
            <section className="mistakeReflectionEmpty">
              <BrainCircuit size={28} />
              <strong>Your mistake queue is clear.</strong>
              <p>New misses will appear here automatically.</p>
            </section>
          )}
        </aside>
      </div>
    </section>
  );
}
