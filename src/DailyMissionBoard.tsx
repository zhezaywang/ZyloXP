import {
  ArrowRight,
  Award,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

export type DailyMissionId = 'challenge' | 'questions' | 'xp';

export type DailyMissionView = {
  actionLabel: string;
  current: number;
  detail: string;
  icon: LucideIcon;
  id: DailyMissionId;
  target: number;
  title: string;
  unit: string;
};

export type WeeklyActivityDay = {
  careerProjects: number;
  dateKey: string;
  dayLabel: string;
  diagnostics: number;
  exams: number;
  focusMinutes: number;
  isToday: boolean;
  labMissions: number;
  questions: number;
  sprints: number;
  xp: number;
};

type DailyMissionBoardProps = {
  completedCount: number;
  currentStreak: number;
  dailyGoal: number;
  hasWeeklyPlan: boolean;
  missions: DailyMissionView[];
  onClaimReward: () => void;
  onOpenMission: (missionId: DailyMissionId) => void;
  onOpenWeeklyPlan: () => void;
  rewardClaimed: boolean;
  rewardXp: number;
  weeklyActivity: WeeklyActivityDay[];
  weeklyPlanComplete: boolean;
};

function hasDailyActivity(activity: WeeklyActivityDay | undefined) {
  return Boolean(
    activity &&
      (activity.careerProjects > 0 ||
        activity.exams > 0 ||
        activity.questions > 0 ||
        activity.labMissions > 0 ||
        activity.sprints > 0 ||
        activity.diagnostics > 0 ||
        activity.xp > 0),
  );
}

export function DailyMissionBoard({
  completedCount,
  currentStreak,
  dailyGoal,
  hasWeeklyPlan,
  missions,
  onClaimReward,
  onOpenMission,
  onOpenWeeklyPlan,
  rewardClaimed,
  rewardXp,
  weeklyActivity,
  weeklyPlanComplete,
}: DailyMissionBoardProps) {
  const [detailsExpanded, setDetailsExpanded] = useState(() =>
    typeof window === 'undefined'
      ? true
      : !window.matchMedia('(max-width: 720px)').matches,
  );
  const allComplete = completedCount === missions.length;
  const nextMission =
    missions.find((mission) => mission.current < mission.target) ??
    missions[missions.length - 1] ??
    null;
  const NextMissionIcon = nextMission?.icon ?? Target;
  const activeDays = weeklyActivity.filter(hasDailyActivity).length;
  const getMomentumValue = (activity: WeeklyActivityDay) =>
    Math.max(activity.focusMinutes, Math.ceil(activity.xp / 10));
  const weeklyMomentumMaximum = Math.max(
    dailyGoal,
    ...weeklyActivity.map(getMomentumValue),
  );
  const collapsedActionLabel = allComplete
    ? rewardClaimed
      ? 'Open weekly plan'
      : `Claim +${rewardXp} XP`
    : nextMission?.actionLabel ?? 'Continue learning';

  function handleCollapsedAction() {
    if (!allComplete && nextMission) {
      onOpenMission(nextMission.id);
      return;
    }

    if (!rewardClaimed) {
      onClaimReward();
      return;
    }

    onOpenWeeklyPlan();
  }

  return (
    <section className="dailyMissionBoard" aria-labelledby="daily-mission-title">
      <header>
        <div>
          <p className="eyebrow">Daily Charge</p>
          <h2 id="daily-mission-title">Build today's momentum</h2>
        </div>
        <div className="dailyMissionHeaderActions">
          <span
            className={`dailyMissionStatus ${allComplete ? 'complete' : ''}`}
          >
            {allComplete ? (
              <CheckCircle2 size={17} />
            ) : (
              <CircleGauge size={17} />
            )}
            {completedCount}/{missions.length} complete
          </span>
          <button
            aria-controls="daily-mission-details"
            aria-expanded={detailsExpanded}
            aria-label={
              detailsExpanded
                ? 'Collapse daily mission details'
                : 'Expand daily mission details'
            }
            className="dailyMissionToggle"
            onClick={() => setDetailsExpanded((expanded) => !expanded)}
            title={detailsExpanded ? 'Collapse details' : 'Expand details'}
            type="button"
          >
            <ChevronRight
              aria-hidden="true"
              className={detailsExpanded ? 'expanded' : ''}
              size={18}
            />
          </button>
        </div>
      </header>

      {!detailsExpanded && nextMission && (
        <button
          aria-label={`${
            allComplete
              ? rewardClaimed
                ? 'Daily Charge complete.'
                : 'All daily missions complete.'
              : `${nextMission.title}. ${Math.min(
                  nextMission.current,
                  nextMission.target,
                )} of ${nextMission.target} ${nextMission.unit}.`
          } ${collapsedActionLabel}.`}
          className={`dailyMissionPeek ${allComplete ? 'complete' : ''}`}
          onClick={handleCollapsedAction}
          type="button"
        >
          <span className="dailyMissionPeekIcon">
            <NextMissionIcon size={20} />
          </span>
          <span className="dailyMissionPeekCopy">
            <small>{allComplete ? 'Daily Charge' : 'Next mission'}</small>
            <strong>
              {allComplete
                ? rewardClaimed
                  ? 'Momentum secured for today'
                  : 'Your daily reward is ready'
                : nextMission.title}
            </strong>
            <span>
              {allComplete
                ? collapsedActionLabel
                : `${nextMission.detail} · ${collapsedActionLabel}`}
            </span>
          </span>
          <span className="dailyMissionPeekProgress">
            <strong>
              {allComplete
                ? `${completedCount}/${missions.length}`
                : `${Math.min(nextMission.current, nextMission.target)}/${
                    nextMission.target
                  }`}
            </strong>
            <span aria-hidden="true">
              <span
                style={{
                  width: `${
                    allComplete
                      ? 100
                      : Math.min(
                          100,
                          (nextMission.current / nextMission.target) * 100,
                        )
                  }%`,
                }}
              />
            </span>
          </span>
          <ArrowRight aria-hidden="true" size={18} />
        </button>
      )}

      <div className="dailyMissionDetails" id="daily-mission-details">
        {detailsExpanded && (
          <>
            <div className="dailyMissionBody">
              <div className="dailyMissionList">
                {missions.map((mission) => {
                  const Icon = mission.icon;
                  const complete = mission.current >= mission.target;
                  const progress = Math.min(
                    100,
                    (mission.current / mission.target) * 100,
                  );

                  return (
                    <button
                      aria-label={`${mission.title}. ${Math.min(
                        mission.current,
                        mission.target,
                      )} of ${mission.target} ${mission.unit}. ${
                        mission.actionLabel
                      }.`}
                      className={`dailyMissionItem ${
                        complete ? 'complete' : ''
                      }`}
                      key={mission.id}
                      onClick={() => onOpenMission(mission.id)}
                      title={mission.actionLabel}
                      type="button"
                    >
                      <span className="dailyMissionIcon">
                        <Icon size={19} />
                      </span>
                      <div className="dailyMissionCopy">
                        <div>
                          <strong>{mission.title}</strong>
                          <span>{mission.detail}</span>
                        </div>
                        <div
                          aria-label={`${Math.round(progress)}% complete`}
                          className="dailyMissionMeter"
                        >
                          <span style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="dailyMissionCount">
                        <strong>
                          {Math.min(mission.current, mission.target)}/
                          {mission.target}
                        </strong>
                        <span>{mission.unit}</span>
                      </div>
                      {complete ? <Check size={18} /> : <ArrowRight size={18} />}
                    </button>
                  );
                })}
              </div>

              <aside
                className={`dailyRewardPanel ${allComplete ? 'ready' : ''}`}
              >
                <span className="dailyRewardIcon">
                  {rewardClaimed ? (
                    <CheckCircle2 size={25} />
                  ) : (
                    <Award size={25} />
                  )}
                </span>
                <div>
                  <span>Daily reward</span>
                  <strong>+{rewardXp} XP</strong>
                  <small>
                    {rewardClaimed
                      ? 'Charge secured for today'
                      : allComplete
                        ? 'Your reward is ready'
                        : 'Complete all three missions'}
                  </small>
                </div>
                <button
                  className="primaryButton"
                  disabled={!allComplete || rewardClaimed}
                  onClick={onClaimReward}
                  type="button"
                >
                  {rewardClaimed ? (
                    <>
                      <Check size={17} />
                      Reward claimed
                    </>
                  ) : allComplete ? (
                    <>
                      <Award size={17} />
                      Claim +{rewardXp} XP
                    </>
                  ) : (
                    `${missions.length - completedCount} ${
                      missions.length - completedCount === 1
                        ? 'mission'
                        : 'missions'
                    } left`
                  )}
                </button>
              </aside>
            </div>

            <footer className="weeklyMomentum">
              <div className="weeklyMomentumSummary">
                <div>
                  <span>7-day momentum</span>
                  <strong>{currentStreak}-day streak</strong>
                </div>
                <div className="weeklyMomentumActions">
                  <span>{activeDays}/7 active days</span>
                  <button onClick={onOpenWeeklyPlan} type="button">
                    <CalendarDays size={15} />
                    {hasWeeklyPlan
                      ? weeklyPlanComplete
                        ? 'Week complete'
                        : 'View weekly plan'
                      : 'Plan this week'}
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
              <div
                aria-label={`${activeDays} active days in the last seven days`}
                className="weeklyMomentumChart"
                role="img"
              >
                {weeklyActivity.map((activity) => {
                  const momentumValue = getMomentumValue(activity);
                  const barHeight =
                    momentumValue === 0
                      ? 7
                      : Math.max(
                          16,
                          Math.round(
                            (momentumValue / weeklyMomentumMaximum) * 100,
                          ),
                        );

                  return (
                    <div
                      aria-label={`${activity.dayLabel}: ${
                        activity.focusMinutes
                      } focus minutes and ${activity.xp} XP`}
                      className={`${hasDailyActivity(activity) ? 'active' : ''} ${
                        activity.isToday ? 'today' : ''
                      }`}
                      key={activity.dateKey}
                      title={`${activity.dayLabel}: ${
                        activity.focusMinutes
                      } focus min, ${activity.xp} XP`}
                    >
                      <span className="weeklyMomentumTrack">
                        <span style={{ height: `${barHeight}%` }} />
                      </span>
                      <small>{activity.dayLabel}</small>
                    </div>
                  );
                })}
              </div>
            </footer>
          </>
        )}
      </div>
    </section>
  );
}
