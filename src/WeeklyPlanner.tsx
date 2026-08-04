import {
  ArrowLeft,
  Award,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  FlaskConical,
  Route,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type WeeklyPlanPreset = 'balanced' | 'career' | 'momentum';
export type WeeklyPlanMinutes = 15 | 25 | 40;
export type WeeklyPlanAction = 'lab' | 'practice' | 'route';

export type WeeklyPlan = {
  createdAt: number;
  minutesPerDay: WeeklyPlanMinutes;
  preset: WeeklyPlanPreset;
  rewardClaimedAt: number | null;
  studyDays: number[];
  targetChallenges: number;
  targetQuestions: number;
  targetXp: number;
  weekKey: string;
};

export type WeeklyPlanConfig = Pick<
  WeeklyPlan,
  | 'minutesPerDay'
  | 'preset'
  | 'studyDays'
  | 'targetChallenges'
  | 'targetQuestions'
  | 'targetXp'
>;

export type WeeklyPlanDay = {
  challenges: number;
  dateKey: string;
  dateLabel: string;
  dayIndex: number;
  dayLabel: string;
  focusMinutes: number;
  isToday: boolean;
  questions: number;
  xp: number;
};

type WeeklyPlannerProps = {
  backLabel: string;
  careerRole: string;
  coach: ReactNode;
  days: WeeklyPlanDay[];
  onBack: () => void;
  onClaimReward: () => void;
  onCreate: (config: WeeklyPlanConfig) => void;
  onOpenAction: (action: WeeklyPlanAction) => void;
  onReset: () => void;
  plan: WeeklyPlan | null;
  rewardXp: number;
  weekLabel: string;
};

type ChartMetric = 'focus' | 'questions' | 'xp';

const PRESETS: Array<{
  detail: string;
  icon: typeof Target;
  id: WeeklyPlanPreset;
  label: string;
  targetChallenges: number;
  targetQuestions: number;
  targetXp: number;
}> = [
  {
    detail: 'A compact plan that protects momentum on busy weeks.',
    icon: Zap,
    id: 'momentum',
    label: 'Momentum',
    targetChallenges: 1,
    targetQuestions: 12,
    targetXp: 200,
  },
  {
    detail: 'A steady mix of recall, practice, and applied work.',
    icon: CircleGauge,
    id: 'balanced',
    label: 'Balanced',
    targetChallenges: 2,
    targetQuestions: 25,
    targetXp: 450,
  },
  {
    detail: 'More project and lab evidence for the active career path.',
    icon: BriefcaseBusiness,
    id: 'career',
    label: 'Career push',
    targetChallenges: 4,
    targetQuestions: 35,
    targetXp: 700,
  },
];

const CHART_METRICS: Array<{
  id: ChartMetric;
  label: string;
}> = [
  { id: 'focus', label: 'Focus' },
  { id: 'xp', label: 'XP' },
  { id: 'questions', label: 'Questions' },
];

const DEFAULT_STUDY_DAYS = [0, 1, 3, 5];

function clampPercent(value: number, target: number) {
  return Math.min(100, Math.round((value / Math.max(1, target)) * 100));
}

function getChartValue(day: WeeklyPlanDay, metric: ChartMetric) {
  if (metric === 'questions') {
    return day.questions;
  }

  return metric === 'xp' ? day.xp : day.focusMinutes;
}

export function WeeklyPlanner({
  backLabel,
  careerRole,
  coach,
  days,
  onBack,
  onClaimReward,
  onCreate,
  onOpenAction,
  onReset,
  plan,
  rewardXp,
  weekLabel,
}: WeeklyPlannerProps) {
  const [preset, setPreset] = useState<WeeklyPlanPreset>('momentum');
  const [minutesPerDay, setMinutesPerDay] =
    useState<WeeklyPlanMinutes>(25);
  const [studyDays, setStudyDays] = useState<number[]>(DEFAULT_STUDY_DAYS);
  const [chartMetric, setChartMetric] = useState<ChartMetric>('focus');
  const presetConfig =
    PRESETS.find((candidate) => candidate.id === preset) ?? PRESETS[0];
  const totalXp = days.reduce((sum, day) => sum + day.xp, 0);
  const totalQuestions = days.reduce((sum, day) => sum + day.questions, 0);
  const totalChallenges = days.reduce((sum, day) => sum + day.challenges, 0);
  const totalFocus = days.reduce((sum, day) => sum + day.focusMinutes, 0);
  const planComplete = Boolean(
    plan &&
      totalXp >= plan.targetXp &&
      totalQuestions >= plan.targetQuestions &&
      totalChallenges >= plan.targetChallenges,
  );
  const chartMaximum = Math.max(
    1,
    ...days.map((day) => getChartValue(day, chartMetric)),
  );
  const nextAction: WeeklyPlanAction =
    plan && totalChallenges < plan.targetChallenges
      ? 'lab'
      : plan && totalQuestions < plan.targetQuestions
        ? 'practice'
        : 'route';
  const nextMove =
    nextAction === 'lab'
      ? {
          detail: 'Applied work is furthest from its weekly target.',
          label: 'Complete a lab mission',
        }
      : nextAction === 'practice'
        ? {
            detail: 'A short adaptive set closes the largest remaining gap.',
            label: 'Add focused questions',
          }
        : planComplete
          ? {
              detail: 'Every weekly target is complete. Keep the route optional.',
              label: 'Protect the finish',
            }
          : {
              detail: 'A guided route can add XP across several useful activities.',
              label: 'Build a focused route',
            };

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [plan?.createdAt]);

  function toggleStudyDay(dayIndex: number) {
    setStudyDays((currentDays) => {
      if (currentDays.includes(dayIndex)) {
        return currentDays.length <= 2
          ? currentDays
          : currentDays.filter((candidate) => candidate !== dayIndex);
      }

      return [...currentDays, dayIndex].sort((left, right) => left - right);
    });
  }

  function createPlan() {
    onCreate({
      minutesPerDay,
      preset,
      studyDays,
      targetChallenges: presetConfig.targetChallenges,
      targetQuestions: presetConfig.targetQuestions,
      targetXp: presetConfig.targetXp,
    });
  }

  return (
    <section className="weeklyPlanPage" aria-label="Weekly learning planner">
      <header className="weeklyPlanHeader">
        <button
          className="secondaryButton compactHeaderBack"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          {backLabel}
        </button>

        <div>
          <p className="eyebrow">Momentum Planning</p>
          <h1>Weekly Planner</h1>
          <p>{weekLabel} · Turn activity into a schedule you can keep.</p>
        </div>

        <div
          className={`weeklyPlanStatus ${
            planComplete ? 'complete' : plan ? 'active' : ''
          }`}
        >
          {planComplete ? (
            <CheckCircle2 size={20} />
          ) : plan ? (
            <CalendarDays size={20} />
          ) : (
            <Sparkles size={20} />
          )}
          <span>
            <small>Week status</small>
            <strong>
              {planComplete
                ? 'Targets complete'
                : plan
                  ? `${plan.studyDays.length} study days`
                  : 'Ready to plan'}
            </strong>
          </span>
        </div>
      </header>

      {!plan ? (
        <div className="weeklyPlanBuilderLayout">
          <section className="weeklyPlanCoach" aria-label="Weekly planning guidance">
            {coach}
            <div className="weeklyPlanCoachSignals">
              <div>
                <CalendarDays size={18} />
                <span>
                  <strong>Flexible days</strong>
                  <small>Choose when study should fit, not just how much.</small>
                </span>
              </div>
              <div>
                <BarChart3 size={18} />
                <span>
                  <strong>Live progress</strong>
                  <small>XP, questions, and applied work update automatically.</small>
                </span>
              </div>
              <div>
                <Target size={18} />
                <span>
                  <strong>Action-aware</strong>
                  <small>The plan points to the activity with the largest gap.</small>
                </span>
              </div>
            </div>
          </section>

          <section className="weeklyPlanBuilder" aria-label="Weekly plan settings">
            <header>
              <span>
                <CalendarDays size={21} />
              </span>
              <div>
                <p className="eyebrow">Plan builder</p>
                <h2>Choose a workload you can repeat</h2>
              </div>
            </header>

            <fieldset className="weeklyPresetPicker">
              <legend>Weekly workload</legend>
              <div>
                {PRESETS.map((option) => {
                  const Icon = option.icon;

                  return (
                    <button
                      aria-pressed={preset === option.id}
                      className={preset === option.id ? 'active' : ''}
                      key={option.id}
                      onClick={() => setPreset(option.id)}
                      type="button"
                    >
                      <Icon size={18} />
                      <span>
                        <strong>{option.label}</strong>
                        <small>{option.detail}</small>
                      </span>
                      {preset === option.id && <Check size={16} />}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="weeklyDayPicker">
              <legend>Preferred study days</legend>
              <div>
                {days.map((day) => (
                  <button
                    aria-label={`${day.dayLabel} ${day.dateLabel}`}
                    aria-pressed={studyDays.includes(day.dayIndex)}
                    className={studyDays.includes(day.dayIndex) ? 'active' : ''}
                    key={day.dateKey}
                    onClick={() => toggleStudyDay(day.dayIndex)}
                    type="button"
                  >
                    <span>{day.dayLabel.slice(0, 1)}</span>
                    <strong>{day.dateLabel.split(' ')[1]}</strong>
                  </button>
                ))}
              </div>
              <small>Keep at least two days selected.</small>
            </fieldset>

            <fieldset className="weeklyMinutesPicker">
              <legend>Time per study day</legend>
              <div>
                {([15, 25, 40] as WeeklyPlanMinutes[]).map((minutes) => (
                  <button
                    aria-pressed={minutesPerDay === minutes}
                    className={minutesPerDay === minutes ? 'active' : ''}
                    key={minutes}
                    onClick={() => setMinutesPerDay(minutes)}
                    type="button"
                  >
                    <Clock3 size={16} />
                    {minutes} min
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="weeklyPlanPreview" aria-label="Weekly plan preview">
              <span>
                <strong>{presetConfig.targetXp} XP</strong>
                <small>weekly target</small>
              </span>
              <span>
                <strong>{presetConfig.targetQuestions}</strong>
                <small>questions</small>
              </span>
              <span>
                <strong>{presetConfig.targetChallenges}</strong>
                <small>applied sessions</small>
              </span>
              <span>
                <strong>{studyDays.length * minutesPerDay} min</strong>
                <small>planned time</small>
              </span>
            </div>

            <button className="primaryButton" onClick={createPlan} type="button">
              <CalendarDays size={18} />
              Create weekly plan
            </button>
          </section>
        </div>
      ) : (
        <>
          <section className="weeklyPlanSummary" aria-label="Weekly progress summary">
            <div>
              <Zap size={19} />
              <span>XP</span>
              <strong>
                {totalXp}/{plan.targetXp}
              </strong>
            </div>
            <div>
              <BookOpenCheck size={19} />
              <span>Questions</span>
              <strong>
                {totalQuestions}/{plan.targetQuestions}
              </strong>
            </div>
            <div>
              <FlaskConical size={19} />
              <span>Applied work</span>
              <strong>
                {totalChallenges}/{plan.targetChallenges}
              </strong>
            </div>
            <div>
              <Clock3 size={19} />
              <span>Focus logged</span>
              <strong>{totalFocus} min</strong>
            </div>
          </section>

          <div className="weeklyPlanActiveLayout">
            <main className="weeklyPlanProgress" aria-label="Weekly activity progress">
              <header>
                <div>
                  <p className="eyebrow">Activity trace</p>
                  <h2>{weekLabel}</h2>
                </div>
                <div className="weeklyChartTabs" aria-label="Weekly chart metric">
                  {CHART_METRICS.map((metric) => (
                    <button
                      aria-pressed={chartMetric === metric.id}
                      className={chartMetric === metric.id ? 'active' : ''}
                      key={metric.id}
                      onClick={() => setChartMetric(metric.id)}
                      type="button"
                    >
                      {metric.label}
                    </button>
                  ))}
                </div>
              </header>

              <div
                className="weeklyPlanChart"
                role="img"
                aria-label={`${chartMetric} activity for ${weekLabel}`}
              >
                {days.map((day) => {
                  const value = getChartValue(day, chartMetric);
                  const barHeight =
                    value === 0
                      ? 6
                      : Math.max(14, Math.round((value / chartMaximum) * 100));

                  return (
                    <div
                      className={`${plan.studyDays.includes(day.dayIndex) ? 'planned' : ''} ${
                        day.isToday ? 'today' : ''
                      }`}
                      key={day.dateKey}
                      title={`${day.dayLabel}: ${day.focusMinutes} min, ${day.xp} XP, ${day.questions} questions`}
                    >
                      <strong>{value}</strong>
                      <span>
                        <i style={{ height: `${barHeight}%` }} />
                      </span>
                      <small>{day.dayLabel}</small>
                      {plan.studyDays.includes(day.dayIndex) && <em>planned</em>}
                    </div>
                  );
                })}
              </div>

              <section className="weeklyTargetProgress" aria-label="Weekly targets">
                {[
                  {
                    current: totalXp,
                    icon: Zap,
                    label: 'Earn XP',
                    target: plan.targetXp,
                    unit: 'XP',
                  },
                  {
                    current: totalQuestions,
                    icon: BookOpenCheck,
                    label: 'Practice questions',
                    target: plan.targetQuestions,
                    unit: 'questions',
                  },
                  {
                    current: totalChallenges,
                    icon: FlaskConical,
                    label: 'Applied sessions',
                    target: plan.targetChallenges,
                    unit: 'sessions',
                  },
                ].map((target) => {
                  const Icon = target.icon;
                  const progress = clampPercent(target.current, target.target);

                  return (
                    <article
                      className={progress >= 100 ? 'complete' : ''}
                      key={target.label}
                    >
                      <Icon size={18} />
                      <div>
                        <span>
                          <strong>{target.label}</strong>
                          <small>
                            {Math.min(target.current, target.target)}/{target.target}{' '}
                            {target.unit}
                          </small>
                        </span>
                        <div
                          role="progressbar"
                          aria-label={`${target.label} ${progress}% complete`}
                          aria-valuemax={100}
                          aria-valuemin={0}
                          aria-valuenow={progress}
                        >
                          <span style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      {progress >= 100 && <CheckCircle2 size={18} />}
                    </article>
                  );
                })}
              </section>
            </main>

            <aside className="weeklyPlanRail" aria-label="Weekly plan actions">
              <div className="weeklyPlanActiveCoach">{coach}</div>

              <section className="weeklyNextMove">
                <span className="weeklyNextMoveIcon">
                  <Target size={20} />
                </span>
                <div>
                  <p className="eyebrow">Best next move</p>
                  <h2>{nextMove.label}</h2>
                  <p>{nextMove.detail}</p>
                </div>
                <button
                  className="primaryButton"
                  onClick={() => onOpenAction(nextAction)}
                  type="button"
                >
                  {nextAction === 'lab' ? (
                    <FlaskConical size={17} />
                  ) : nextAction === 'practice' ? (
                    <BookOpenCheck size={17} />
                  ) : (
                    <Route size={17} />
                  )}
                  {nextAction === 'lab'
                    ? 'Open career lab'
                    : nextAction === 'practice'
                      ? 'Start adaptive practice'
                      : 'Open Study Route'}
                </button>
              </section>

              <section
                className={`weeklyReward ${
                  planComplete ? 'ready' : ''
                } ${plan.rewardClaimedAt ? 'claimed' : ''}`}
              >
                <Award size={24} />
                <span>
                  <small>Weekly milestone</small>
                  <strong>+{rewardXp} XP</strong>
                  <p>
                    {plan.rewardClaimedAt
                      ? 'Reward secured for this week.'
                      : planComplete
                        ? 'All targets complete. Your reward is ready.'
                        : 'Complete all three targets to unlock the reward.'}
                  </p>
                </span>
                <button
                  className="secondaryButton"
                  disabled={!planComplete || plan.rewardClaimedAt !== null}
                  onClick={onClaimReward}
                  type="button"
                >
                  {plan.rewardClaimedAt ? (
                    <>
                      <Check size={17} />
                      Reward claimed
                    </>
                  ) : (
                    <>
                      <Trophy size={17} />
                      Claim weekly reward
                    </>
                  )}
                </button>
              </section>

              <button
                className="weeklyPlanRebuild"
                onClick={onReset}
                type="button"
              >
                Rebuild this week
                <ChevronRight size={17} />
              </button>
              <small>
                {careerRole} · {plan.minutesPerDay} minutes on{' '}
                {plan.studyDays.length} planned days
              </small>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
