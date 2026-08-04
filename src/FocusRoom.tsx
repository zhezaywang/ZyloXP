import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleGauge,
  Clock3,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Square,
  Target,
  TriangleAlert,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  formatFocusTimer,
  getFocusElapsedMs,
  getFocusRemainingMs,
} from './focusSession';
import type {
  FocusDebrief,
  FocusDuration,
  FocusEnergy,
  FocusObjective,
  FocusOutcome,
  FocusSession,
  FocusSessionConfig,
  FocusSessionRecord,
} from './focusSession';

type FocusRoomProps = {
  clock: number;
  coach: ReactNode;
  history: FocusSessionRecord[];
  objectives: FocusObjective[];
  onAddDistraction: (delta: number) => void;
  onBack: () => void;
  onDiscardDebrief: () => void;
  onEnd: () => void;
  onNotesChange: (notes: string) => void;
  onOpenObjective: (objectiveId: string) => void;
  onPause: () => void;
  onResume: () => void;
  onSaveDebrief: (debrief: FocusDebrief) => void;
  onStart: (config: FocusSessionConfig) => void;
  session: FocusSession | null;
};

const DURATIONS: FocusDuration[] = [10, 20, 30, 45];

const OUTCOMES: Array<{
  detail: string;
  icon: typeof CheckCircle2;
  id: FocusOutcome;
  label: string;
}> = [
  {
    detail: 'The intention was reached.',
    icon: CheckCircle2,
    id: 'completed',
    label: 'Completed',
  },
  {
    detail: 'Useful progress, with more to do.',
    icon: CircleGauge,
    id: 'partial',
    label: 'Partial',
  },
  {
    detail: 'A blocker stopped the session.',
    icon: TriangleAlert,
    id: 'blocked',
    label: 'Blocked',
  },
];

const ENERGY_LEVELS: Array<{
  id: FocusEnergy;
  label: string;
}> = [
  { id: 'low', label: 'Low' },
  { id: 'steady', label: 'Steady' },
  { id: 'strong', label: 'Strong' },
];

function formatFocusedTime(seconds: number) {
  if (seconds < 60) {
    return '<1 min';
  }

  const minutes = Math.floor(seconds / 60);
  return `${minutes} ${minutes === 1 ? 'min' : 'min'}`;
}

function formatHistoryDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(timestamp);
}

export function FocusRoom({
  clock,
  coach,
  history,
  objectives,
  onAddDistraction,
  onBack,
  onDiscardDebrief,
  onEnd,
  onNotesChange,
  onOpenObjective,
  onPause,
  onResume,
  onSaveDebrief,
  onStart,
  session,
}: FocusRoomProps) {
  const [selectedObjectiveId, setSelectedObjectiveId] = useState(
    objectives[0]?.id ?? '',
  );
  const [durationMinutes, setDurationMinutes] =
    useState<FocusDuration>(20);
  const [intention, setIntention] = useState('');
  const [outcome, setOutcome] = useState<FocusOutcome>('completed');
  const [energy, setEnergy] = useState<FocusEnergy>('steady');
  const [takeaway, setTakeaway] = useState('');
  const selectedObjective =
    objectives.find((objective) => objective.id === selectedObjectiveId) ??
    objectives[0];
  const activeObjective =
    objectives.find((objective) => objective.id === session?.objectiveId) ??
    null;
  const ActiveObjectiveIcon = activeObjective?.icon ?? Target;
  const remainingMs = session ? getFocusRemainingMs(session, clock) : 0;
  const elapsedMs = session ? getFocusElapsedMs(session, clock) : 0;
  const focusedSeconds =
    session === null
      ? 0
      : Math.min(
          session.durationMinutes * 60,
          Math.floor(elapsedMs / 1000),
        );
  const progress =
    session === null
      ? 0
      : Math.min(
          100,
          (elapsedMs / (session.durationMinutes * 60_000)) * 100,
        );
  const isDebrief = session?.endedAt !== null && session !== null;
  const isPaused = session?.pausedAt !== null && !isDebrief;
  const historyStats = useMemo(
    () => ({
      completed: history.filter((record) => record.outcome === 'completed')
        .length,
      focusedMinutes: Math.floor(
        history.reduce((sum, record) => sum + record.focusedSeconds, 0) / 60,
      ),
      sessions: history.length,
    }),
    [history],
  );

  useEffect(() => {
    if (isDebrief) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isDebrief, session?.id]);

  useEffect(() => {
    if (session && session.endedAt === null) {
      setOutcome('completed');
      setEnergy('steady');
      setTakeaway('');
    }
  }, [session?.id]);

  function handleStart() {
    if (!selectedObjective) {
      return;
    }

    onStart({
      durationMinutes,
      intention: intention.trim(),
      objectiveId: selectedObjective.id,
    });
  }

  if (session && isDebrief) {
    return (
      <section className="focusRoomPage" aria-label="Focus session debrief">
        <header className="focusRoomHeader">
          <button
            className="secondaryButton compactHeaderBack"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft size={17} />
            Back to dashboard
          </button>
          <div>
            <p className="eyebrow">Session complete</p>
            <h1>Focus debrief</h1>
            <p>Capture the result while the work is still fresh.</p>
          </div>
          <span className="focusRoomHeaderSignal complete">
            <CheckCircle2 size={19} />
            Ready to save
          </span>
        </header>

        <section className="focusDebriefSummary" aria-label="Session summary">
          <span className="focusDebriefIcon">
            <ActiveObjectiveIcon size={23} />
          </span>
          <div>
            <small>Objective</small>
            <strong>{session.objectiveTitle}</strong>
            <p>
              {session.intention || session.objectiveDetail}
            </p>
          </div>
          <div>
            <small>Focused time</small>
            <strong>{formatFocusedTime(focusedSeconds)}</strong>
          </div>
          <div>
            <small>Distractions</small>
            <strong>{session.distractions}</strong>
          </div>
        </section>

        <div className="focusDebriefGrid">
          <main className="focusDebriefForm">
            <fieldset className="focusDebriefChoices">
              <legend>How far did you get?</legend>
              <div>
                {OUTCOMES.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      aria-pressed={outcome === option.id}
                      className={outcome === option.id ? 'active' : ''}
                      key={option.id}
                      onClick={() => setOutcome(option.id)}
                      type="button"
                    >
                      <Icon size={19} />
                      <span>
                        <strong>{option.label}</strong>
                        <small>{option.detail}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="focusEnergyChoices">
              <legend>Energy at the finish</legend>
              <div>
                {ENERGY_LEVELS.map((option) => (
                  <button
                    aria-pressed={energy === option.id}
                    className={energy === option.id ? 'active' : ''}
                    key={option.id}
                    onClick={() => setEnergy(option.id)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="focusTakeawayField">
              <span>One useful takeaway</span>
              <textarea
                maxLength={500}
                onChange={(event) => setTakeaway(event.target.value)}
                placeholder="What became clearer, or what should the next session begin with?"
                rows={4}
                value={takeaway}
              />
              <small>{takeaway.length}/500</small>
            </label>

            <div className="focusDebriefActions">
              <button
                className="secondaryButton"
                onClick={onDiscardDebrief}
                type="button"
              >
                Discard session
              </button>
              <button
                className="primaryButton"
                onClick={() =>
                  onSaveDebrief({
                    energy,
                    outcome,
                    takeaway: takeaway.trim(),
                  })
                }
                type="button"
              >
                Save debrief
                <ArrowRight size={18} />
              </button>
            </div>
          </main>

          <aside className="focusDebriefCoach">
            {coach}
            <section>
              <Sparkles size={20} />
              <div>
                <strong>Why debrief?</strong>
                <p>
                  A short outcome note gives the next session a better starting
                  point than memory alone.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </section>
    );
  }

  if (session) {
    return (
      <section className="focusRoomPage active" aria-label="Active focus session">
        <header className="focusRoomHeader">
          <button
            className="secondaryButton compactHeaderBack"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft size={17} />
            Leave timer running
          </button>
          <div>
            <p className="eyebrow">Deep work session</p>
            <h1>Focus Room</h1>
            <p>Your timer follows you across ZyloXP.</p>
          </div>
          <span className={`focusRoomHeaderSignal ${isPaused ? 'paused' : ''}`}>
            {isPaused ? <Pause size={18} /> : <Clock3 size={18} />}
            {isPaused ? 'Paused' : 'In focus'}
          </span>
        </header>

        <section className="focusTimerStage" aria-label="Focus timer">
          <div className="focusTimerObjective">
            <span>
              <ActiveObjectiveIcon size={22} />
            </span>
            <div>
              <small>Current objective</small>
              <strong>{session.objectiveTitle}</strong>
              <p>{session.intention || session.objectiveDetail}</p>
            </div>
          </div>

          <div className="focusTimerClock" aria-live="polite">
            <small>{isPaused ? 'Paused with' : 'Time remaining'}</small>
            <strong>{formatFocusTimer(remainingMs)}</strong>
            <span>
              {Math.floor(elapsedMs / 60_000)} of {session.durationMinutes} min
            </span>
          </div>

          <div className="focusTimerProgress" aria-label={`${Math.round(progress)}% elapsed`}>
            <span style={{ width: `${progress}%` }} />
          </div>

          <div className="focusTimerControls">
            <button
              className="primaryButton"
              onClick={isPaused ? onResume : onPause}
              type="button"
            >
              {isPaused ? <Play size={18} /> : <Pause size={18} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              className="secondaryButton"
              onClick={onEnd}
              type="button"
            >
              <Square size={17} />
              End session
            </button>
          </div>
        </section>

        <div className="focusActiveGrid">
          <main className="focusWorkPanel">
            <header>
              <div>
                <p className="eyebrow">Work surface</p>
                <h2>Keep the next action obvious</h2>
              </div>
              <button
                className="primaryButton"
                onClick={() => onOpenObjective(session.objectiveId)}
                type="button"
              >
                Open activity
                <ArrowRight size={17} />
              </button>
            </header>

            <label className="focusNotesField">
              <span>Live session notes</span>
              <textarea
                maxLength={800}
                onChange={(event) => onNotesChange(event.target.value)}
                placeholder="Capture a formula, blocker, or question without leaving the session."
                rows={7}
                value={session.notes}
              />
              <small>{session.notes.length}/800</small>
            </label>
          </main>

          <aside className="focusSessionRail">
            {coach}

            <section className="focusDistractionCounter">
              <header>
                <div>
                  <small>Distraction log</small>
                  <strong>{session.distractions}</strong>
                </div>
                <span>Notice it, log it, return.</span>
              </header>
              <div>
                <button
                  aria-label="Remove one distraction"
                  disabled={session.distractions === 0}
                  onClick={() => onAddDistraction(-1)}
                  title="Remove one"
                  type="button"
                >
                  <Minus size={18} />
                </button>
                <button
                  aria-label="Log one distraction"
                  onClick={() => onAddDistraction(1)}
                  title="Log one"
                  type="button"
                >
                  <Plus size={18} />
                </button>
              </div>
            </section>

            <section className="focusSessionCue">
              <Target size={20} />
              <div>
                <small>Session cue</small>
                <strong>
                  {progress < 20
                    ? 'Settle into the first step'
                    : progress < 75
                      ? 'Stay with the hard middle'
                      : 'Capture the result'}
                </strong>
                <p>
                  {progress < 20
                    ? 'Open the activity and define what success looks like.'
                    : progress < 75
                      ? 'Log interruptions without changing the objective.'
                      : 'Use the final minutes to record what should happen next.'}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="focusRoomPage" aria-label="Focus Room builder">
      <header className="focusRoomHeader">
        <button
          className="secondaryButton compactHeaderBack"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </button>
        <div>
          <p className="eyebrow">Intentional practice</p>
          <h1>Focus Room</h1>
          <p>Choose one outcome, start the clock, and keep your place.</p>
        </div>
        <span className="focusRoomHeaderSignal">
          <Clock3 size={18} />
          Timer ready
        </span>
      </header>

      <section className="focusRoomIntro">
        <div>
          <span className="focusRoomIntroIcon">
            <Sparkles size={23} />
          </span>
          <span>
            <small>Focus loop</small>
            <strong>Plan, work, then capture the result</strong>
            <p>
              The timer stays active while you move through questions, labs,
              and review pages.
            </p>
          </span>
        </div>
        <div>
          <small>Sessions</small>
          <strong>{historyStats.sessions}</strong>
        </div>
        <div>
          <small>Focused</small>
          <strong>{historyStats.focusedMinutes} min</strong>
        </div>
        <div>
          <small>Completed</small>
          <strong>{historyStats.completed}</strong>
        </div>
      </section>

      <div className="focusBuilderGrid">
        <main className="focusSessionBuilder">
          <fieldset className="focusObjectivePicker">
            <legend>1. Choose one objective</legend>
            <div>
              {objectives.map((objective) => {
                const Icon = objective.icon;
                return (
                  <button
                    aria-pressed={selectedObjective?.id === objective.id}
                    className={
                      selectedObjective?.id === objective.id ? 'active' : ''
                    }
                    key={objective.id}
                    onClick={() => setSelectedObjectiveId(objective.id)}
                    type="button"
                  >
                    <span>
                      <Icon size={20} />
                    </span>
                    <span>
                      <small>{objective.signal}</small>
                      <strong>{objective.label}</strong>
                      <em>{objective.detail}</em>
                    </span>
                    <CheckCircle2 size={18} />
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="focusDurationPicker">
            <legend>2. Set the boundary</legend>
            <div>
              {DURATIONS.map((duration) => (
                <button
                  aria-pressed={durationMinutes === duration}
                  className={durationMinutes === duration ? 'active' : ''}
                  key={duration}
                  onClick={() => setDurationMinutes(duration)}
                  type="button"
                >
                  <strong>{duration}</strong>
                  <span>min</span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className="focusIntentionField">
            <span>3. Name the finish line</span>
            <input
              maxLength={140}
              onChange={(event) => setIntention(event.target.value)}
              placeholder={
                selectedObjective
                  ? `For example: ${selectedObjective.detail}`
                  : 'What should be true when the timer ends?'
              }
              type="text"
              value={intention}
            />
            <small>{intention.length}/140</small>
          </label>

          <section className="focusStartSummary">
            <div>
              <small>Selected session</small>
              <strong>{selectedObjective?.label ?? 'Choose an objective'}</strong>
              <span>{durationMinutes} focused minutes</span>
            </div>
            <button
              className="primaryButton"
              disabled={!selectedObjective}
              onClick={handleStart}
              type="button"
            >
              <Play size={18} />
              Start focus session
            </button>
          </section>
        </main>

        <aside className="focusBuilderRail">
          {coach}

          <section className="focusBoundaryGuide">
            <Clock3 size={20} />
            <div>
              <strong>Choose the honest duration</strong>
              <p>
                A completed 10-minute block is more useful than a 45-minute
                promise you cannot keep.
              </p>
            </div>
          </section>

          <section className="focusHistoryPreview">
            <header>
              <div>
                <p className="eyebrow">Recent sessions</p>
                <h2>Your focus log</h2>
              </div>
              <RotateCcw size={18} />
            </header>

            {history.length === 0 ? (
              <div className="focusHistoryEmpty">
                <Clock3 size={22} />
                <strong>No sessions yet</strong>
                <p>Your first saved debrief will appear here.</p>
              </div>
            ) : (
              <div className="focusHistoryList">
                {history.slice(0, 5).map((record) => (
                  <article key={record.id}>
                    <span
                      className={`focusHistoryStatus ${record.outcome}`}
                    >
                      {record.outcome === 'completed' ? (
                        <CheckCircle2 size={16} />
                      ) : record.outcome === 'partial' ? (
                        <CircleGauge size={16} />
                      ) : (
                        <TriangleAlert size={16} />
                      )}
                    </span>
                    <span>
                      <strong>{record.objectiveTitle}</strong>
                      <small>
                        {formatHistoryDate(record.completedAt)} /{' '}
                        {formatFocusedTime(record.focusedSeconds)}
                      </small>
                    </span>
                    <em>{record.energy}</em>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
