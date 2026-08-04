import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleGauge,
  Clock3,
  Flame,
  GitBranch,
  RotateCcw,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type LearningActivityDay = {
  applied: number;
  dateKey: string;
  dateLabel: string;
  dayLabel: string;
  focusMinutes: number;
  isToday: boolean;
  questions: number;
  xp: number;
};

export type LearningSkillSignal = {
  careerWeight: number;
  dueCount: number;
  id: string;
  progress: number;
  status: 'Current' | 'Locked' | 'Unlocked';
  title: string;
  unit: string;
};

type InsightMetric = 'applied' | 'focusMinutes' | 'questions' | 'xp';
type InsightRange = 7 | 14 | 30;

type LearningInsightsProps = {
  accuracy: number | null;
  activityDays: LearningActivityDay[];
  careerReadiness: number;
  careerRole: string;
  coach: ReactNode;
  currentLevel: number;
  currentStreak: number;
  dailyGoalMinutes: number;
  onBack: () => void;
  onOpenReview: () => void;
  onOpenSkillMap: (skillId: string) => void;
  onOpenWeeklyPlan: () => void;
  onPracticeSkill: (skillId: string) => void;
  reviewDueCount: number;
  skillSignals: LearningSkillSignal[];
  strongReviewCount: number;
  weeklyPlanComplete: boolean;
  weeklyPlanTargetXp: number | null;
  weeklyPlanXp: number;
  xpToNextLevel: number;
};

const METRICS: Array<{
  id: InsightMetric;
  label: string;
  shortLabel: string;
  unit: string;
}> = [
  { id: 'xp', label: 'XP earned', shortLabel: 'XP', unit: 'XP' },
  {
    id: 'questions',
    label: 'Questions answered',
    shortLabel: 'Questions',
    unit: 'questions',
  },
  {
    id: 'focusMinutes',
    label: 'Focused minutes',
    shortLabel: 'Focus',
    unit: 'min',
  },
  {
    id: 'applied',
    label: 'Applied sessions',
    shortLabel: 'Applied',
    unit: 'sessions',
  },
];

const RANGES: InsightRange[] = [7, 14, 30];

function hasActivity(day: LearningActivityDay) {
  return (
    day.xp > 0 ||
    day.questions > 0 ||
    day.focusMinutes > 0 ||
    day.applied > 0
  );
}

function getLongestRun(days: LearningActivityDay[]) {
  return days.reduce(
    (state, day) => {
      const current = hasActivity(day) ? state.current + 1 : 0;
      return {
        best: Math.max(state.best, current),
        current,
      };
    },
    { best: 0, current: 0 },
  ).best;
}

function getHeatLevel(day: LearningActivityDay) {
  if (!hasActivity(day)) {
    return 0;
  }

  const score =
    day.xp / 45 +
    day.questions / 4 +
    day.focusMinutes / 15 +
    day.applied;

  if (score >= 8) {
    return 4;
  }
  if (score >= 4) {
    return 3;
  }
  if (score >= 2) {
    return 2;
  }
  return 1;
}

function getTrendLabel(current: number, previous: number) {
  if (current === 0 && previous === 0) {
    return 'No activity yet';
  }
  if (previous === 0) {
    return 'New momentum';
  }

  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) {
    return 'Holding steady';
  }

  return `${change > 0 ? '+' : ''}${change}% vs prior week`;
}

function formatMetricValue(value: number, metric: InsightMetric) {
  if (metric === 'focusMinutes') {
    return `${value} min`;
  }
  if (metric === 'applied') {
    return `${value} ${value === 1 ? 'session' : 'sessions'}`;
  }
  if (metric === 'questions') {
    return `${value} ${value === 1 ? 'question' : 'questions'}`;
  }
  return `${value.toLocaleString()} XP`;
}

export function LearningInsights({
  accuracy,
  activityDays,
  careerReadiness,
  careerRole,
  coach,
  currentLevel,
  currentStreak,
  dailyGoalMinutes,
  onBack,
  onOpenReview,
  onOpenSkillMap,
  onOpenWeeklyPlan,
  onPracticeSkill,
  reviewDueCount,
  skillSignals,
  strongReviewCount,
  weeklyPlanComplete,
  weeklyPlanTargetXp,
  weeklyPlanXp,
  xpToNextLevel,
}: LearningInsightsProps) {
  const [metric, setMetric] = useState<InsightMetric>('xp');
  const [range, setRange] = useState<InsightRange>(14);
  const prioritizedSkills = useMemo(
    () =>
      [...skillSignals].sort(
        (left, right) =>
          Number(left.status === 'Locked') -
            Number(right.status === 'Locked') ||
          right.dueCount - left.dueCount ||
          left.progress - right.progress ||
          right.careerWeight - left.careerWeight,
      ),
    [skillSignals],
  );
  const [selectedSkillId, setSelectedSkillId] = useState(
    prioritizedSkills[0]?.id ?? '',
  );
  const selectedSkill =
    skillSignals.find((skill) => skill.id === selectedSkillId) ??
    prioritizedSkills[0];
  const visibleDays = activityDays.slice(-range);
  const activeDays = visibleDays.filter(hasActivity);
  const metricConfig =
    METRICS.find((option) => option.id === metric) ?? METRICS[0];
  const metricTotal = visibleDays.reduce((sum, day) => sum + day[metric], 0);
  const metricMaximum = Math.max(
    1,
    ...visibleDays.map((day) => day[metric]),
  );
  const bestMetricDay = [...visibleDays].sort(
    (left, right) => right[metric] - left[metric],
  )[0];
  const latestSeven = activityDays.slice(-7);
  const previousSeven = activityDays.slice(-14, -7);
  const latestMetricTotal = latestSeven.reduce(
    (sum, day) => sum + day[metric],
    0,
  );
  const previousMetricTotal = previousSeven.reduce(
    (sum, day) => sum + day[metric],
    0,
  );
  const totalXp = visibleDays.reduce((sum, day) => sum + day.xp, 0);
  const totalQuestions = visibleDays.reduce(
    (sum, day) => sum + day.questions,
    0,
  );
  const totalFocus = visibleDays.reduce(
    (sum, day) => sum + day.focusMinutes,
    0,
  );
  const totalApplied = visibleDays.reduce(
    (sum, day) => sum + day.applied,
    0,
  );
  const xpPerActiveDay =
    activeDays.length === 0 ? 0 : Math.round(totalXp / activeDays.length);
  const projectedStudyDays =
    xpPerActiveDay === 0
      ? null
      : Math.max(1, Math.ceil(xpToNextLevel / xpPerActiveDay));
  const longestRun = getLongestRun(visibleDays);
  const heatmapWeeks = Array.from({ length: 5 }, (_, weekIndex) =>
    activityDays.slice(weekIndex * 7, weekIndex * 7 + 7),
  );
  const weekProgress =
    weeklyPlanTargetXp === null
      ? 0
      : Math.min(100, (weeklyPlanXp / Math.max(1, weeklyPlanTargetXp)) * 100);
  const weakestOpenSkill =
    prioritizedSkills.find((skill) => skill.status !== 'Locked') ??
    prioritizedSkills[0];
  const primaryAction =
    reviewDueCount > 0
      ? {
          detail: `${reviewDueCount} scheduled ${
            reviewDueCount === 1 ? 'question is' : 'questions are'
          } ready now.`,
          icon: RotateCcw,
          label: 'Clear review queue',
          onClick: onOpenReview,
        }
      : weakestOpenSkill && weakestOpenSkill.progress < 70
        ? {
            detail: `${weakestOpenSkill.title} is your lowest open signal at ${Math.round(
              weakestOpenSkill.progress,
            )}%.`,
            icon: Target,
            label: `Practice ${weakestOpenSkill.title}`,
            onClick: () => onPracticeSkill(weakestOpenSkill.id),
          }
        : {
            detail:
              weeklyPlanTargetXp === null
                ? 'Set a repeatable pace for the rest of this week.'
                : 'Keep your plan moving with one focused practice set.',
            icon: weeklyPlanTargetXp === null ? CalendarDays : Zap,
            label:
              weeklyPlanTargetXp === null
                ? 'Build weekly plan'
                : 'Continue practice',
            onClick:
              weeklyPlanTargetXp === null
                ? onOpenWeeklyPlan
                : () =>
                    weakestOpenSkill &&
                    onPracticeSkill(weakestOpenSkill.id),
          };
  const PrimaryActionIcon = primaryAction.icon;
  const calendarStart = activityDays[0]?.dateLabel ?? 'No history';
  const calendarEnd =
    activityDays[activityDays.length - 1]?.dateLabel ?? 'No history';

  return (
    <section className="learningInsightsPage" aria-label="Learning Insights">
      <header className="insightsHeader">
        <button
          className="secondaryButton compactHeaderBack"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          Back to progress
        </button>

        <div>
          <p className="eyebrow">Learning intelligence</p>
          <h1>Insights</h1>
          <p>See your rhythm, retention pressure, and strongest next move.</p>
        </div>

        <button
          className="primaryButton"
          onClick={primaryAction.onClick}
          type="button"
        >
          {primaryAction.label}
          <ArrowRight size={18} />
        </button>
      </header>

      <section className="insightsPulse" aria-label="Current learning pulse">
        <div className="insightsPulseLead">
          <span className="insightsPulseIcon">
            <Sparkles size={22} />
          </span>
          <span>
            <small>Current readout</small>
            <strong>
              {reviewDueCount > 0
                ? 'Review pressure is the clearest signal'
                : currentStreak > 1
                  ? 'Your learning rhythm is building'
                  : 'A repeatable rhythm starts with one session'}
            </strong>
            <em>{primaryAction.detail}</em>
          </span>
        </div>

        <div className="insightsPulseMetric">
          <span>Level {currentLevel}</span>
          <strong>{xpToNextLevel} XP to next</strong>
          <small>
            {projectedStudyDays === null
              ? 'Complete a session to estimate pace'
              : `About ${projectedStudyDays} active ${
                  projectedStudyDays === 1 ? 'day' : 'days'
                } at your recent pace`}
          </small>
        </div>

        <div className="insightsPulseMetric">
          <span>{careerRole.replace(' Engineer', '')}</span>
          <strong>{careerReadiness}% career ready</strong>
          <small>{accuracy === null ? 'Accuracy calibrating' : `${accuracy}% practice accuracy`}</small>
        </div>
      </section>

      <section className="insightsOverview" aria-label="Insight summary">
        <article>
          <span>
            <Flame size={18} />
            Active rhythm
          </span>
          <strong>{activeDays.length}/{range} days</strong>
          <small>
            {longestRun} day best run in this view
          </small>
        </article>
        <article>
          <span>
            <Zap size={18} />
            XP pace
          </span>
          <strong>{xpPerActiveDay.toLocaleString()}</strong>
          <small>XP per active day</small>
        </article>
        <article>
          <span>
            <Clock3 size={18} />
            Focus
          </span>
          <strong>{totalFocus} min</strong>
          <small>{dailyGoalMinutes} min daily goal</small>
        </article>
        <article className={reviewDueCount > 0 ? 'attention' : ''}>
          <span>
            <RotateCcw size={18} />
            Retention
          </span>
          <strong>{reviewDueCount} due</strong>
          <small>{strongReviewCount} strong signals</small>
        </article>
      </section>

      <div className="insightsMainGrid">
        <section className="insightsActivityPanel" aria-label="Activity trend">
          <header>
            <div>
              <p className="eyebrow">Activity lens</p>
              <h2>{metricConfig.label}</h2>
            </div>

            <div className="insightsRangeControl" aria-label="Activity range">
              {RANGES.map((option) => (
                <button
                  aria-pressed={range === option}
                  className={range === option ? 'active' : ''}
                  key={option}
                  onClick={() => setRange(option)}
                  type="button"
                >
                  {option}D
                </button>
              ))}
            </div>
          </header>

          <div className="insightsMetricControl" aria-label="Activity metric">
            {METRICS.map((option) => (
              <button
                aria-pressed={metric === option.id}
                className={metric === option.id ? 'active' : ''}
                key={option.id}
                onClick={() => setMetric(option.id)}
                type="button"
              >
                {option.shortLabel}
              </button>
            ))}
          </div>

          <div
            className={`insightsBarChart ${range === 30 ? 'dense' : ''}`}
            style={{ gridTemplateColumns: `repeat(${visibleDays.length}, minmax(4px, 1fr))` }}
          >
            {visibleDays.map((day) => {
              const value = day[metric];
              const height =
                value === 0 ? 3 : Math.max(10, (value / metricMaximum) * 100);

              return (
                <div
                  className={`insightsBarDay ${day.isToday ? 'today' : ''}`}
                  key={day.dateKey}
                  title={`${day.dateLabel}: ${formatMetricValue(value, metric)}`}
                >
                  <span className="insightsBarValue">{value || ''}</span>
                  <span className="insightsBarTrack">
                    <i style={{ height: `${height}%` }} />
                  </span>
                  <small>{day.dayLabel.slice(0, 1)}</small>
                </div>
              );
            })}
          </div>

          <footer className="insightsChartSummary">
            <div>
              <span>{range}-day total</span>
              <strong>{formatMetricValue(metricTotal, metric)}</strong>
            </div>
            <div>
              <span>Strongest day</span>
              <strong>
                {bestMetricDay && bestMetricDay[metric] > 0
                  ? `${bestMetricDay.dayLabel}, ${bestMetricDay.dateLabel}`
                  : 'No signal yet'}
              </strong>
            </div>
            <div>
              <span>7-day trend</span>
              <strong>
                {getTrendLabel(latestMetricTotal, previousMetricTotal)}
              </strong>
            </div>
          </footer>
        </section>

        <aside className="insightsCoachPanel">
          {coach}

          <section className="insightsNextMove" aria-label="Recommended next move">
            <span className="insightsNextMoveIcon">
              <PrimaryActionIcon size={20} />
            </span>
            <div>
              <p className="eyebrow">Best next move</p>
              <h2>{primaryAction.label}</h2>
              <p>{primaryAction.detail}</p>
            </div>
            <button onClick={primaryAction.onClick} type="button">
              Start
              <ArrowRight size={17} />
            </button>
          </section>

          <section className="insightsWeekGoal" aria-label="Weekly plan status">
            <header>
              <span>
                <CalendarDays size={18} />
                Weekly plan
              </span>
              <strong>
                {weeklyPlanComplete
                  ? 'Complete'
                  : weeklyPlanTargetXp === null
                    ? 'Not set'
                    : `${Math.round(weekProgress)}%`}
              </strong>
            </header>
            <div>
              <span style={{ width: `${weekProgress}%` }} />
            </div>
            <p>
              {weeklyPlanTargetXp === null
                ? 'Choose study days and targets that fit the week you actually have.'
                : `${weeklyPlanXp.toLocaleString()} of ${weeklyPlanTargetXp.toLocaleString()} XP logged this week.`}
            </p>
            <button onClick={onOpenWeeklyPlan} type="button">
              {weeklyPlanTargetXp === null ? 'Build plan' : 'View plan'}
              <ArrowRight size={16} />
            </button>
          </section>
        </aside>
      </div>

      <section className="insightsCalendarPanel" aria-label="Five week consistency">
        <header>
          <div>
            <p className="eyebrow">Consistency map</p>
            <h2>Five weeks at a glance</h2>
          </div>
          <span>
            {calendarStart} to {calendarEnd}
          </span>
        </header>

        <div className="insightsCalendarLayout">
          <div className="insightsHeatmap" aria-label="Daily activity heatmap">
            <div className="insightsHeatmapLabels" aria-hidden="true">
              {heatmapWeeks[0]?.map((day) => (
                <span key={day.dateKey}>{day.dayLabel.slice(0, 1)}</span>
              ))}
            </div>
            <div className="insightsHeatmapWeeks">
              {heatmapWeeks.map((week, weekIndex) => (
                <div className="insightsHeatmapWeek" key={`week-${weekIndex}`}>
                  {week.map((day) => (
                    <span
                      aria-label={`${day.dateLabel}: ${day.xp} XP, ${day.focusMinutes} focus minutes`}
                      className={`level-${getHeatLevel(day)} ${
                        day.isToday ? 'today' : ''
                      }`}
                      key={day.dateKey}
                      role="img"
                      title={`${day.dateLabel}: ${day.xp} XP, ${day.questions} questions, ${day.focusMinutes} min`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="insightsRhythmReadout">
            <article>
              <span>Questions</span>
              <strong>{totalQuestions}</strong>
              <small>across the selected {range} days</small>
            </article>
            <article>
              <span>Applied work</span>
              <strong>{totalApplied}</strong>
              <small>labs, sprints, projects, and checks</small>
            </article>
            <article>
              <span>Current streak</span>
              <strong>
                {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
              </strong>
              <small>
                {currentStreak > 0
                  ? 'Keep the next session small and repeatable'
                  : 'Any focused activity starts the signal'}
              </small>
            </article>
          </div>
        </div>

        <footer className="insightsHeatLegend">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <i className={`level-${level}`} key={level} />
          ))}
          <span>More</span>
        </footer>
      </section>

      <section className="insightsSkillPanel" aria-label="Skill signals">
        <header>
          <div>
            <p className="eyebrow">Skill signals</p>
            <h2>Choose a unit to inspect</h2>
          </div>
          <button
            className="secondaryButton"
            onClick={() =>
              selectedSkill && onOpenSkillMap(selectedSkill.id)
            }
            type="button"
          >
            <GitBranch size={17} />
            Open Skill Map
          </button>
        </header>

        <div className="insightsSkillLayout">
          <nav className="insightsSkillList" aria-label="Learning units">
            {skillSignals.map((skill) => (
              <button
                aria-current={
                  selectedSkill?.id === skill.id ? 'true' : undefined
                }
                className={
                  selectedSkill?.id === skill.id ? 'active' : ''
                }
                key={skill.id}
                onClick={() => setSelectedSkillId(skill.id)}
                type="button"
              >
                <span>
                  <small>{skill.unit}</small>
                  <strong>{skill.title}</strong>
                </span>
                <span className="insightsSkillMeter">
                  <i style={{ width: `${skill.progress}%` }} />
                </span>
                <span>
                  <strong>{Math.round(skill.progress)}%</strong>
                  <small>
                    {skill.status === 'Locked'
                      ? 'Locked'
                      : skill.dueCount > 0
                        ? `${skill.dueCount} due`
                        : 'On track'}
                  </small>
                </span>
              </button>
            ))}
          </nav>

          {selectedSkill && (
            <article className="insightsSkillDetail">
              <span className="insightsSkillDetailIcon">
                <CircleGauge size={23} />
              </span>
              <div>
                <p className="eyebrow">{selectedSkill.unit}</p>
                <h3>{selectedSkill.title}</h3>
                <p>
                  {selectedSkill.status === 'Locked'
                    ? 'This unit is visible, but its prerequisite still needs more mastery.'
                    : selectedSkill.dueCount > 0
                      ? `${selectedSkill.dueCount} scheduled ${
                          selectedSkill.dueCount === 1 ? 'check is' : 'checks are'
                        } waiting in this unit.`
                      : selectedSkill.progress < 50
                        ? 'A short focused set will strengthen the core relationship before harder applications.'
                        : 'This unit is stable enough to extend through mixed practice or an applied lab.'}
                </p>
              </div>

              <div className="insightsSkillFacts">
                <span>
                  <strong>{Math.round(selectedSkill.progress)}%</strong>
                  Mastery
                </span>
                <span>
                  <strong>{selectedSkill.dueCount}</strong>
                  Due now
                </span>
                <span>
                  <strong>
                    {selectedSkill.careerWeight > 0
                      ? `${Math.round(selectedSkill.careerWeight * 100)}%`
                      : 'Support'}
                  </strong>
                  Role weight
                </span>
              </div>

              <div className="insightsSkillActions">
                <button
                  className="primaryButton"
                  disabled={selectedSkill.status === 'Locked'}
                  onClick={() => onPracticeSkill(selectedSkill.id)}
                  type="button"
                >
                  <Target size={17} />
                  Practice skill
                </button>
                <button
                  className="secondaryButton"
                  onClick={() => onOpenSkillMap(selectedSkill.id)}
                  type="button"
                >
                  Inspect connections
                  <ArrowRight size={17} />
                </button>
              </div>
            </article>
          )}
        </div>
      </section>

      <section className="insightsInterpretation" aria-label="Learning interpretation">
        <header>
          <div>
            <p className="eyebrow">What the signals mean</p>
            <h2>A useful read, not just more numbers</h2>
          </div>
          <BarChart3 size={22} />
        </header>

        <div>
          <article>
            <span className="insightsInterpretationIcon">
              <Flame size={19} />
            </span>
            <div>
              <strong>Consistency</strong>
              <p>
                {activeDays.length === 0
                  ? 'There is no activity in this window yet. One short session creates the first baseline.'
                  : activeDays.length >= Math.ceil(range / 2)
                    ? `You studied on ${activeDays.length} of ${range} days. Frequency is supporting retention.`
                    : `${activeDays.length} active ${
                        activeDays.length === 1 ? 'day' : 'days'
                      } produced ${totalXp.toLocaleString()} XP. Smaller repeat sessions would make that progress easier to retain.`}
              </p>
            </div>
          </article>

          <article>
            <span className="insightsInterpretationIcon">
              <BriefcaseBusiness size={19} />
            </span>
            <div>
              <strong>Practice balance</strong>
              <p>
                {totalApplied === 0 && totalQuestions > 0
                  ? 'Your recent work is recall-heavy. Add a lab or project to turn the concepts into evidence.'
                  : totalApplied >= Math.max(1, Math.floor(totalQuestions / 8))
                    ? `${totalApplied} applied sessions are keeping your question practice connected to real tasks.`
                    : 'Question practice is leading. One applied session would improve the balance this period.'}
              </p>
            </div>
          </article>

          <article>
            <span className="insightsInterpretationIcon">
              {reviewDueCount > 0 ? (
                <RotateCcw size={19} />
              ) : (
                <CheckCircle2 size={19} />
              )}
            </span>
            <div>
              <strong>Retention</strong>
              <p>
                {reviewDueCount > 0
                  ? `${reviewDueCount} due ${
                      reviewDueCount === 1 ? 'item is' : 'items are'
                    } the highest-value place to begin.`
                  : `${strongReviewCount} strong signals are holding, with no scheduled reviews waiting now.`}
              </p>
            </div>
          </article>
        </div>
      </section>
    </section>
  );
}
