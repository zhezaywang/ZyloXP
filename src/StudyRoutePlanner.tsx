import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  CircuitBoard,
  Clock3,
  FileCheck2,
  FlaskConical,
  Gauge,
  NotebookTabs,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

export type StudyRouteDuration = 10 | 20 | 30;
export type StudyRouteGoal = 'balanced' | 'career' | 'lab' | 'review';
export type StudyRoutePace = 'challenge' | 'steady';
export type StudyRouteAction =
  | 'career'
  | 'lab'
  | 'notebook'
  | 'portfolio'
  | 'practice'
  | 'review'
  | 'sprint'
  | 'workbench';

export type StudyRouteStep = {
  action: StudyRouteAction;
  detail: string;
  id: string;
  minutes: number;
  sourceId?: string;
  title: string;
};

export type StudyRoute = {
  completedAt: number | null;
  completedStepIds: string[];
  config: {
    duration: StudyRouteDuration;
    goal: StudyRouteGoal;
    pace: StudyRoutePace;
  };
  createdAt: number;
  earnedXp: number;
  id: string;
  openedStepIds: string[];
  steps: StudyRouteStep[];
};

export type StudyRouteConfig = StudyRoute['config'];

type StudyRoutePlannerProps = {
  coach: ReactNode;
  completionCount: number;
  onBack: () => void;
  onFinish: () => void;
  onGenerate: (config: StudyRouteConfig) => void;
  onOpenStep: (step: StudyRouteStep) => void;
  onReset: () => void;
  onToggleStep: (stepId: string) => void;
  rewardXp: number;
  route: StudyRoute | null;
};

const GOALS: Array<{
  detail: string;
  icon: typeof Target;
  id: StudyRouteGoal;
  label: string;
}> = [
  {
    detail: 'Mix recall, practice, hands-on work, and career evidence.',
    icon: Route,
    id: 'balanced',
    label: 'Balanced route',
  },
  {
    detail: 'Clear due questions and strengthen memory before adding new work.',
    icon: BrainCircuit,
    id: 'review',
    label: 'Catch up on review',
  },
  {
    detail: 'Build the weakest role skill and add career-facing evidence.',
    icon: BriefcaseBusiness,
    id: 'career',
    label: 'Career readiness',
  },
  {
    detail: 'Prioritize measurement, diagnosis, and circuit-building practice.',
    icon: FlaskConical,
    id: 'lab',
    label: 'Hands-on bench',
  },
];

const ACTION_META: Record<
  StudyRouteAction,
  {
    icon: typeof Target;
    label: string;
  }
> = {
  career: {
    icon: BriefcaseBusiness,
    label: 'Career',
  },
  lab: {
    icon: FlaskConical,
    label: 'Lab',
  },
  notebook: {
    icon: NotebookTabs,
    label: 'Notebook',
  },
  portfolio: {
    icon: FileCheck2,
    label: 'Evidence',
  },
  practice: {
    icon: BookOpenCheck,
    label: 'Practice',
  },
  review: {
    icon: BrainCircuit,
    label: 'Review',
  },
  sprint: {
    icon: Trophy,
    label: 'Sprint',
  },
  workbench: {
    icon: CircuitBoard,
    label: 'Build',
  },
};

function getGoalLabel(goal: StudyRouteGoal) {
  return GOALS.find((candidate) => candidate.id === goal)?.label ?? 'Study route';
}

export function StudyRoutePlanner({
  coach,
  completionCount,
  onBack,
  onFinish,
  onGenerate,
  onOpenStep,
  onReset,
  onToggleStep,
  rewardXp,
  route,
}: StudyRoutePlannerProps) {
  const [duration, setDuration] = useState<StudyRouteDuration>(20);
  const [goal, setGoal] = useState<StudyRouteGoal>('balanced');
  const [pace, setPace] = useState<StudyRoutePace>('steady');
  const completedCount = route?.completedStepIds.length ?? 0;
  const routeProgress = route
    ? (completedCount / Math.max(1, route.steps.length)) * 100
    : 0;
  const allStepsComplete =
    route !== null && completedCount === route.steps.length;

  return (
    <section className="studyRoutePage" aria-label="Zy study route planner">
      <header className="studyRouteHeader">
        <button
          className="secondaryButton compactHeaderBack"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </button>

        <div>
          <p className="eyebrow">Zy Coach</p>
          <h1>Study Route</h1>
          <p>A focused sequence across the tools that move you forward.</p>
        </div>

        <div
          className={`studyRouteStatus ${
            route?.completedAt ? 'complete' : route ? 'active' : ''
          }`}
        >
          {route?.completedAt ? (
            <CheckCircle2 size={20} />
          ) : route ? (
            <Route size={20} />
          ) : (
            <Sparkles size={20} />
          )}
          <span>
            <small>{route ? getGoalLabel(route.config.goal) : 'Route status'}</small>
            <strong>
              {route?.completedAt
                ? 'Route complete'
                : route
                  ? `${completedCount}/${route.steps.length} steps`
                  : 'Ready to build'}
            </strong>
          </span>
        </div>
      </header>

      {!route ? (
        <div className="routeBuilderLayout">
          <section className="routeCoachPanel" aria-label="Zy route guidance">
            {coach}
            <div className="routeCoachSignals">
              <div>
                <ShieldCheck size={18} />
                <span>
                  <strong>Resumable</strong>
                  <small>Your route follows you across the app.</small>
                </span>
              </div>
              <div>
                <Gauge size={18} />
                <span>
                  <strong>Time-boxed</strong>
                  <small>Every step fits the budget you choose.</small>
                </span>
              </div>
              <div>
                <Target size={18} />
                <span>
                  <strong>Progress-aware</strong>
                  <small>Steps use your current review and career signals.</small>
                </span>
              </div>
            </div>
          </section>

          <section className="routeBuilder" aria-label="Study route settings">
            <header>
              <span>
                <Route size={21} />
              </span>
              <div>
                <p className="eyebrow">Route builder</p>
                <h2>What should this session accomplish?</h2>
              </div>
            </header>

            <fieldset className="routeGoalChoices">
              <legend>Focus goal</legend>
              <div>
                {GOALS.map((routeGoal) => {
                  const GoalIcon = routeGoal.icon;

                  return (
                    <button
                      aria-pressed={goal === routeGoal.id}
                      className={goal === routeGoal.id ? 'active' : ''}
                      key={routeGoal.id}
                      onClick={() => setGoal(routeGoal.id)}
                      type="button"
                    >
                      <GoalIcon size={18} />
                      <span>
                        <strong>{routeGoal.label}</strong>
                        <small>{routeGoal.detail}</small>
                      </span>
                      {goal === routeGoal.id && <Check size={16} />}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="routeBuilderControls">
              <fieldset>
                <legend>Time budget</legend>
                <div className="routeSegmentedControl">
                  {([10, 20, 30] as StudyRouteDuration[]).map(
                    (routeDuration) => (
                      <button
                        aria-pressed={duration === routeDuration}
                        className={duration === routeDuration ? 'active' : ''}
                        key={routeDuration}
                        onClick={() => setDuration(routeDuration)}
                        type="button"
                      >
                        {routeDuration} min
                      </button>
                    ),
                  )}
                </div>
              </fieldset>

              <fieldset>
                <legend>Pace</legend>
                <div className="routeSegmentedControl">
                  {(['steady', 'challenge'] as StudyRoutePace[]).map(
                    (routePace) => (
                      <button
                        aria-pressed={pace === routePace}
                        className={pace === routePace ? 'active' : ''}
                        key={routePace}
                        onClick={() => setPace(routePace)}
                        type="button"
                      >
                        {routePace === 'steady' ? 'Steady' : 'Challenge'}
                      </button>
                    ),
                  )}
                </div>
              </fieldset>
            </div>

            <div className="routeBuildSummary">
              <Clock3 size={18} />
              <span>
                <strong>
                  {duration} minutes · {pace} pace
                </strong>
                <small>
                  Zy will combine {duration === 10 ? 2 : duration === 20 ? 3 : 4}{' '}
                  activities around {getGoalLabel(goal).toLowerCase()}.
                </small>
              </span>
            </div>

            <button
              className="primaryButton fullWidth"
              onClick={() => onGenerate({ duration, goal, pace })}
              type="button"
            >
              <Sparkles size={17} />
              Build my route
            </button>
          </section>
        </div>
      ) : route.completedAt ? (
        <section className="routeCompleteStage" aria-live="polite">
          <div className="routeCompleteCoach">{coach}</div>
          <span className="routeCompleteMark">
            <CheckCircle2 size={34} />
          </span>
          <p className="eyebrow">Route complete</p>
          <h2>You connected the work instead of just collecting it.</h2>
          <p>
            {route.steps.length} activities across {route.config.duration} focused
            minutes are now part of today&apos;s progress.
          </p>
          <div className="routeCompleteMetrics">
            <div>
              <strong>{route.steps.length}</strong>
              <span>steps completed</span>
            </div>
            <div>
              <strong>{route.config.duration}</strong>
              <span>focus minutes</span>
            </div>
            <div>
              <strong>{route.earnedXp > 0 ? `+${route.earnedXp}` : 'Milestone'}</strong>
              <span>{route.earnedXp > 0 ? 'XP earned' : 'earned earlier'}</span>
            </div>
          </div>
          <button className="primaryButton" onClick={onReset} type="button">
            <RefreshCw size={17} />
            Build another route
          </button>
          <small>
            {completionCount} study {completionCount === 1 ? 'route' : 'routes'} completed
          </small>
        </section>
      ) : (
        <>
          <section className="studyRouteMetricBand" aria-label="Study route metrics">
            <div>
              <Clock3 size={19} />
              <span>Time budget</span>
              <strong>{route.config.duration} min</strong>
            </div>
            <div>
              <Route size={19} />
              <span>Route steps</span>
              <strong>{route.steps.length}</strong>
            </div>
            <div>
              <Gauge size={19} />
              <span>Pace</span>
              <strong>{route.config.pace}</strong>
            </div>
            <div>
              <Zap size={19} />
              <span>First completion</span>
              <strong>
                {completionCount === 0 ? `+${rewardXp} XP` : 'Milestone earned'}
              </strong>
            </div>
          </section>

          <div className="activeRouteLayout">
            <main className="routeTimeline" aria-label="Study route steps">
              <header>
                <div>
                  <p className="eyebrow">Active route</p>
                  <h2>{getGoalLabel(route.config.goal)}</h2>
                  <p>Open each activity before checking it off.</p>
                </div>
                <button className="secondaryButton" onClick={onReset} type="button">
                  <RefreshCw size={16} />
                  Rebuild
                </button>
              </header>

              <div>
                {route.steps.map((step, index) => {
                  const meta = ACTION_META[step.action];
                  const StepIcon = meta.icon;
                  const isOpened = route.openedStepIds.includes(step.id);
                  const isComplete = route.completedStepIds.includes(step.id);
                  const isCurrent =
                    !isComplete &&
                    route.steps.find(
                      (candidate) =>
                        !route.completedStepIds.includes(candidate.id),
                    )?.id === step.id;

                  return (
                    <article
                      className={`${isComplete ? 'complete' : ''} ${
                        isCurrent ? 'current' : ''
                      }`}
                      key={step.id}
                    >
                      <span className="routeStepNumber">
                        {isComplete ? <Check size={17} /> : index + 1}
                      </span>
                      <div className="routeStepBody">
                        <header>
                          <span>
                            <StepIcon size={15} />
                            {meta.label}
                          </span>
                          <strong>{step.minutes} min</strong>
                        </header>
                        <h3>{step.title}</h3>
                        <p>{step.detail}</p>
                        <div className="routeStepActions">
                          <button
                            className="secondaryButton"
                            onClick={() => onOpenStep(step)}
                            type="button"
                          >
                            {isOpened ? 'Reopen activity' : 'Open activity'}
                            <ArrowRight size={15} />
                          </button>
                          <button
                            aria-pressed={isComplete}
                            className={isComplete ? 'complete' : ''}
                            disabled={!isOpened && !isComplete}
                            onClick={() => onToggleStep(step.id)}
                            type="button"
                          >
                            <CheckCircle2 size={16} />
                            {isComplete ? 'Completed' : 'Mark complete'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </main>

            <aside className="routeProgressPanel" aria-label="Route progress">
              <div className="routeProgressCoach">{coach}</div>
              <section>
                <header>
                  <span>Route progress</span>
                  <strong>{Math.round(routeProgress)}%</strong>
                </header>
                <div
                  className="routeProgressMeter"
                  aria-label={`${Math.round(routeProgress)}% complete`}
                >
                  <span style={{ width: `${routeProgress}%` }} />
                </div>
                <p>
                  {allStepsComplete
                    ? 'Every step is checked. Finish the route to record today’s progress.'
                    : `${route.steps.length - completedCount} ${
                        route.steps.length - completedCount === 1 ? 'step' : 'steps'
                      } remaining.`}
                </p>
              </section>

              <div className="routeProgressRules">
                <div className="complete">
                  <CheckCircle2 size={16} />
                  <span>Route saved across pages</span>
                </div>
                <div className={route.openedStepIds.length > 0 ? 'complete' : ''}>
                  <CheckCircle2 size={16} />
                  <span>Open at least one activity</span>
                </div>
                <div className={allStepsComplete ? 'complete' : ''}>
                  <CheckCircle2 size={16} />
                  <span>Complete every step</span>
                </div>
              </div>

              <button
                className="primaryButton fullWidth"
                disabled={!allStepsComplete}
                onClick={onFinish}
                type="button"
              >
                <Trophy size={17} />
                Finish study route
              </button>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
