import type { LucideIcon } from 'lucide-react';

export type FocusDuration = 10 | 20 | 30 | 45;
export type FocusEnergy = 'low' | 'steady' | 'strong';
export type FocusOutcome = 'blocked' | 'completed' | 'partial';

export type FocusObjective = {
  detail: string;
  id: string;
  icon: LucideIcon;
  label: string;
  signal: string;
};

export type FocusSession = {
  distractions: number;
  durationMinutes: FocusDuration;
  endedAt: number | null;
  id: string;
  intention: string;
  notes: string;
  objectiveDetail: string;
  objectiveId: string;
  objectiveTitle: string;
  pausedAt: number | null;
  pausedDurationMs: number;
  startedAt: number;
};

export type FocusSessionRecord = {
  completedAt: number;
  distractions: number;
  durationMinutes: FocusDuration;
  energy: FocusEnergy;
  focusedSeconds: number;
  id: string;
  objectiveTitle: string;
  outcome: FocusOutcome;
  takeaway: string;
};

export type FocusSessionConfig = {
  durationMinutes: FocusDuration;
  intention: string;
  objectiveId: string;
};

export type FocusDebrief = {
  energy: FocusEnergy;
  outcome: FocusOutcome;
  takeaway: string;
};

const FOCUS_DURATIONS: FocusDuration[] = [10, 20, 30, 45];

function isFocusDuration(value: unknown): value is FocusDuration {
  return FOCUS_DURATIONS.includes(value as FocusDuration);
}

function isFocusOutcome(value: unknown): value is FocusOutcome {
  return value === 'blocked' || value === 'completed' || value === 'partial';
}

function isFocusEnergy(value: unknown): value is FocusEnergy {
  return value === 'low' || value === 'steady' || value === 'strong';
}

function readFiniteNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback;
}

export function normalizeFocusSession(value: unknown): FocusSession | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const stored = value as Record<string, unknown>;
  if (
    typeof stored.id !== 'string' ||
    typeof stored.objectiveId !== 'string' ||
    typeof stored.objectiveTitle !== 'string' ||
    !isFocusDuration(stored.durationMinutes)
  ) {
    return null;
  }

  const startedAt = Math.max(0, readFiniteNumber(stored.startedAt));
  if (startedAt === 0) {
    return null;
  }

  const endedAt =
    typeof stored.endedAt === 'number' && Number.isFinite(stored.endedAt)
      ? Math.max(startedAt, stored.endedAt)
      : null;
  const pausedAt =
    endedAt === null &&
    typeof stored.pausedAt === 'number' &&
    Number.isFinite(stored.pausedAt)
      ? Math.max(startedAt, stored.pausedAt)
      : null;

  return {
    distractions: Math.min(
      99,
      Math.max(0, Math.round(readFiniteNumber(stored.distractions))),
    ),
    durationMinutes: stored.durationMinutes,
    endedAt,
    id: stored.id.slice(0, 80),
    intention:
      typeof stored.intention === 'string'
        ? stored.intention.slice(0, 140)
        : '',
    notes: typeof stored.notes === 'string' ? stored.notes.slice(0, 800) : '',
    objectiveDetail:
      typeof stored.objectiveDetail === 'string'
        ? stored.objectiveDetail.slice(0, 180)
        : '',
    objectiveId: stored.objectiveId.slice(0, 80),
    objectiveTitle: stored.objectiveTitle.slice(0, 120),
    pausedAt,
    pausedDurationMs: Math.max(
      0,
      readFiniteNumber(stored.pausedDurationMs),
    ),
    startedAt,
  };
}

export function normalizeFocusHistory(value: unknown): FocusSessionRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .flatMap((item) => {
      if (!item || typeof item !== 'object') {
        return [];
      }

      const stored = item as Record<string, unknown>;
      if (
        typeof stored.id !== 'string' ||
        typeof stored.objectiveTitle !== 'string' ||
        !isFocusDuration(stored.durationMinutes) ||
        !isFocusOutcome(stored.outcome) ||
        !isFocusEnergy(stored.energy)
      ) {
        return [];
      }

      const completedAt = Math.max(0, readFiniteNumber(stored.completedAt));
      if (completedAt === 0) {
        return [];
      }

      return [
        {
          completedAt,
          distractions: Math.min(
            99,
            Math.max(0, Math.round(readFiniteNumber(stored.distractions))),
          ),
          durationMinutes: stored.durationMinutes,
          energy: stored.energy,
          focusedSeconds: Math.max(
            0,
            Math.round(readFiniteNumber(stored.focusedSeconds)),
          ),
          id: stored.id.slice(0, 80),
          objectiveTitle: stored.objectiveTitle.slice(0, 120),
          outcome: stored.outcome,
          takeaway:
            typeof stored.takeaway === 'string'
              ? stored.takeaway.slice(0, 500)
              : '',
        },
      ];
    })
    .sort((left, right) => right.completedAt - left.completedAt)
    .slice(0, 20);
}

export function getFocusElapsedMs(session: FocusSession, now: number) {
  const effectiveEnd =
    session.endedAt ?? session.pausedAt ?? Math.max(session.startedAt, now);
  return Math.max(
    0,
    effectiveEnd - session.startedAt - session.pausedDurationMs,
  );
}

export function getFocusRemainingMs(session: FocusSession, now: number) {
  return Math.max(
    0,
    session.durationMinutes * 60_000 - getFocusElapsedMs(session, now),
  );
}

export function formatFocusTimer(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0',
  )}`;
}
