export const MAX_HEARTS = 10;
export const HEART_RECHARGE_MS = 10 * 60 * 1000;
export const HEART_STORAGE_KEY = 'zyloxp-heart-state-v1';

export type HeartState = {
  hearts: number;
  nextHeartAt: number | null;
};

export function normalizeHeartState(state: HeartState, now = Date.now()): HeartState {
  const hearts = Number.isFinite(state.hearts)
    ? Math.min(MAX_HEARTS, Math.max(0, Math.round(state.hearts)))
    : MAX_HEARTS;

  if (hearts === MAX_HEARTS) {
    return { hearts, nextHeartAt: null };
  }

  const storedNextHeartAt =
    typeof state.nextHeartAt === 'number' && Number.isFinite(state.nextHeartAt)
      ? state.nextHeartAt
      : null;
  const nextHeartAt = storedNextHeartAt ?? now + HEART_RECHARGE_MS;

  if (now < nextHeartAt) {
    return { hearts, nextHeartAt };
  }

  const recoveredHearts = 1 + Math.floor((now - nextHeartAt) / HEART_RECHARGE_MS);
  const nextHearts = Math.min(MAX_HEARTS, hearts + recoveredHearts);

  return {
    hearts: nextHearts,
    nextHeartAt:
      nextHearts < MAX_HEARTS ? nextHeartAt + recoveredHearts * HEART_RECHARGE_MS : null,
  };
}

export function getFullRechargeMs(
  hearts: number,
  nextHeartAt: number | null,
  now = Date.now(),
) {
  if (hearts >= MAX_HEARTS || nextHeartAt === null) {
    return 0;
  }

  const nextHeartMs = Math.max(0, nextHeartAt - now);
  return nextHeartMs + Math.max(0, MAX_HEARTS - hearts - 1) * HEART_RECHARGE_MS;
}

export function formatHeartCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatHeartDuration(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60000));

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}
