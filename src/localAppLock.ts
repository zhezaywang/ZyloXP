export type LocalAppLockConfig = {
  enabledAt: number;
  iterations: number;
  lockOnHidden: boolean;
  salt: string;
  timeoutMinutes: number;
  verifier: string;
  version: 1;
};

export type LocalAppLockAttemptState = {
  blockedUntil: number;
  failedAttempts: number;
  lastFailedAt: number;
  version: 1;
};

export type LocalAppLockVerificationResult = {
  attemptsRemaining: number;
  blockedUntil: number;
  failedAttempts: number;
  ok: boolean;
};

export const APP_LOCK_TIMEOUT_OPTIONS = [5, 15, 30, 60] as const;
export const LOCAL_APP_LOCK_STORAGE_KEY = 'zyloxp-local-app-lock-v1';
export const LOCAL_APP_LOCK_ATTEMPT_STORAGE_KEY =
  'zyloxp-local-app-lock-attempts-v1';
export const LOCAL_APP_LOCK_COMMAND_STORAGE_KEY =
  'zyloxp-local-app-lock-command-v1';
const LOCAL_APP_LOCK_ACTIVITY_KEY = 'zyloxp-local-app-lock-activity-v1';
const PBKDF2_ITERATIONS = 600_000;
const PIN_PATTERN = /^\d{6}$/;
const ATTEMPT_RESET_MS = 24 * 60 * 60_000;
const ATTEMPTS_BEFORE_DELAY = 5;

function getAttemptDelayMs(failedAttempts: number) {
  if (failedAttempts < ATTEMPTS_BEFORE_DELAY) {
    return 0;
  }
  if (failedAttempts < 7) {
    return 30_000;
  }
  if (failedAttempts < 9) {
    return 2 * 60_000;
  }
  if (failedAttempts < 11) {
    return 10 * 60_000;
  }
  return 30 * 60_000;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = window.atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function isTimeoutMinutes(value: unknown): value is number {
  return APP_LOCK_TIMEOUT_OPTIONS.includes(
    value as (typeof APP_LOCK_TIMEOUT_OPTIONS)[number],
  );
}

async function derivePinVerifier(
  pin: string,
  salt: Uint8Array,
  iterations: number,
) {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await window.crypto.subtle.deriveBits(
    {
      hash: 'SHA-256',
      iterations,
      name: 'PBKDF2',
      salt: Uint8Array.from(salt).buffer,
    },
    keyMaterial,
    256,
  );

  return new Uint8Array(bits);
}

function constantTimeEqual(first: Uint8Array, second: Uint8Array) {
  if (first.length !== second.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < first.length; index += 1) {
    difference |= first[index] ^ second[index];
  }
  return difference === 0;
}

export function isLocalAppLockSupported() {
  return Boolean(
    typeof window !== 'undefined' &&
      window.crypto?.subtle &&
      window.crypto.getRandomValues,
  );
}

export function isValidLocalAppLockPin(pin: string) {
  return PIN_PATTERN.test(pin);
}

export function readLocalAppLockConfig(): LocalAppLockConfig | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedConfig = window.localStorage.getItem(
      LOCAL_APP_LOCK_STORAGE_KEY,
    );
    if (!storedConfig) {
      return null;
    }

    const parsedConfig = JSON.parse(storedConfig) as Partial<LocalAppLockConfig>;
    if (
      parsedConfig.version !== 1 ||
      typeof parsedConfig.enabledAt !== 'number' ||
      !Number.isFinite(parsedConfig.enabledAt) ||
      parsedConfig.enabledAt <= 0 ||
      typeof parsedConfig.iterations !== 'number' ||
      !Number.isInteger(parsedConfig.iterations) ||
      parsedConfig.iterations < 100_000 ||
      parsedConfig.iterations > 1_000_000 ||
      typeof parsedConfig.salt !== 'string' ||
      parsedConfig.salt.length < 20 ||
      parsedConfig.salt.length > 64 ||
      typeof parsedConfig.verifier !== 'string' ||
      parsedConfig.verifier.length < 40 ||
      parsedConfig.verifier.length > 80 ||
      !isTimeoutMinutes(parsedConfig.timeoutMinutes)
    ) {
      return null;
    }

    const salt = base64ToBytes(parsedConfig.salt);
    const verifier = base64ToBytes(parsedConfig.verifier);
    if (salt.length !== 16 || verifier.length !== 32) {
      return null;
    }

    return {
      ...(parsedConfig as Omit<LocalAppLockConfig, 'lockOnHidden'>),
      lockOnHidden: parsedConfig.lockOnHidden === true,
    };
  } catch {
    return null;
  }
}

export async function createLocalAppLockConfig(
  pin: string,
  timeoutMinutes: number,
  lockOnHidden = false,
): Promise<LocalAppLockConfig> {
  if (!isLocalAppLockSupported()) {
    throw new Error('Web Crypto is unavailable in this browser.');
  }
  if (!isValidLocalAppLockPin(pin)) {
    throw new Error('Use exactly six digits.');
  }
  if (!isTimeoutMinutes(timeoutMinutes)) {
    throw new Error('Choose a supported auto-lock time.');
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const verifier = await derivePinVerifier(pin, salt, PBKDF2_ITERATIONS);

  return {
    enabledAt: Date.now(),
    iterations: PBKDF2_ITERATIONS,
    lockOnHidden,
    salt: bytesToBase64(salt),
    timeoutMinutes,
    verifier: bytesToBase64(verifier),
    version: 1,
  };
}

export async function verifyLocalAppLockPin(
  pin: string,
  config: LocalAppLockConfig,
) {
  if (!isLocalAppLockSupported() || !isValidLocalAppLockPin(pin)) {
    return false;
  }

  try {
    const candidate = await derivePinVerifier(
      pin,
      base64ToBytes(config.salt),
      config.iterations,
    );
    return constantTimeEqual(candidate, base64ToBytes(config.verifier));
  } catch {
    return false;
  }
}

export function readLocalAppLockAttemptState(
  timestamp = Date.now(),
): LocalAppLockAttemptState {
  const emptyState: LocalAppLockAttemptState = {
    blockedUntil: 0,
    failedAttempts: 0,
    lastFailedAt: 0,
    version: 1,
  };

  if (typeof window === 'undefined') {
    return emptyState;
  }

  try {
    const stored = window.localStorage.getItem(
      LOCAL_APP_LOCK_ATTEMPT_STORAGE_KEY,
    );
    if (!stored) {
      return emptyState;
    }

    const parsed = JSON.parse(stored) as Partial<LocalAppLockAttemptState>;
    if (
      parsed.version !== 1 ||
      typeof parsed.failedAttempts !== 'number' ||
      !Number.isInteger(parsed.failedAttempts) ||
      parsed.failedAttempts < 0 ||
      parsed.failedAttempts > 1_000_000 ||
      typeof parsed.lastFailedAt !== 'number' ||
      !Number.isFinite(parsed.lastFailedAt) ||
      parsed.lastFailedAt < 0 ||
      typeof parsed.blockedUntil !== 'number' ||
      !Number.isFinite(parsed.blockedUntil) ||
      parsed.blockedUntil < 0
    ) {
      return emptyState;
    }

    if (
      parsed.lastFailedAt === 0 ||
      timestamp - parsed.lastFailedAt >= ATTEMPT_RESET_MS
    ) {
      clearLocalAppLockAttempts();
      return emptyState;
    }

    return parsed as LocalAppLockAttemptState;
  } catch {
    return emptyState;
  }
}

function recordLocalAppLockFailure(timestamp = Date.now()) {
  const currentState = readLocalAppLockAttemptState(timestamp);
  const failedAttempts = currentState.failedAttempts + 1;
  const blockedUntil = timestamp + getAttemptDelayMs(failedAttempts);
  const nextState: LocalAppLockAttemptState = {
    blockedUntil,
    failedAttempts,
    lastFailedAt: timestamp,
    version: 1,
  };

  try {
    window.localStorage.setItem(
      LOCAL_APP_LOCK_ATTEMPT_STORAGE_KEY,
      JSON.stringify(nextState),
    );
  } catch {
    // The current render still enforces the returned delay when storage fails.
  }

  return nextState;
}

export function clearLocalAppLockAttempts() {
  try {
    window.localStorage.removeItem(LOCAL_APP_LOCK_ATTEMPT_STORAGE_KEY);
  } catch {
    // A successful in-memory unlock remains valid when storage is unavailable.
  }
}

export async function verifyLocalAppLockPinWithProtection(
  pin: string,
  config: LocalAppLockConfig,
  timestamp = Date.now(),
): Promise<LocalAppLockVerificationResult> {
  const currentState = readLocalAppLockAttemptState(timestamp);
  if (currentState.blockedUntil > timestamp) {
    return {
      attemptsRemaining: 0,
      blockedUntil: currentState.blockedUntil,
      failedAttempts: currentState.failedAttempts,
      ok: false,
    };
  }

  const verified = await verifyLocalAppLockPin(pin, config);
  if (verified) {
    clearLocalAppLockAttempts();
    return {
      attemptsRemaining: ATTEMPTS_BEFORE_DELAY,
      blockedUntil: 0,
      failedAttempts: 0,
      ok: true,
    };
  }

  const nextState = recordLocalAppLockFailure(timestamp);
  return {
    attemptsRemaining: Math.max(
      0,
      ATTEMPTS_BEFORE_DELAY - nextState.failedAttempts,
    ),
    blockedUntil: nextState.blockedUntil,
    failedAttempts: nextState.failedAttempts,
    ok: false,
  };
}

export function saveLocalAppLockConfig(config: LocalAppLockConfig) {
  window.localStorage.setItem(
    LOCAL_APP_LOCK_STORAGE_KEY,
    JSON.stringify(config),
  );
}

export function removeLocalAppLockConfig() {
  try {
    window.localStorage.removeItem(LOCAL_APP_LOCK_STORAGE_KEY);
  } finally {
    clearLocalAppLockActivity();
    clearLocalAppLockAttempts();
  }
}

export function broadcastLocalAppLock() {
  try {
    const nonce = window.crypto?.randomUUID?.() ?? String(Math.random());
    window.localStorage.setItem(
      LOCAL_APP_LOCK_COMMAND_STORAGE_KEY,
      `${Date.now()}:${nonce}`,
    );
  } catch {
    // The initiating tab still locks even when cross-tab signaling is blocked.
  }
}

export function markLocalAppLockActivity(timestamp = Date.now()) {
  try {
    window.sessionStorage.setItem(
      LOCAL_APP_LOCK_ACTIVITY_KEY,
      String(timestamp),
    );
  } catch {
    // The in-memory inactivity timer still protects the current render.
  }
}

export function readLocalAppLockActivity() {
  try {
    const storedActivity = Number(
      window.sessionStorage.getItem(LOCAL_APP_LOCK_ACTIVITY_KEY),
    );
    return Number.isFinite(storedActivity) && storedActivity > 0
      ? storedActivity
      : null;
  } catch {
    return null;
  }
}

export function clearLocalAppLockActivity() {
  try {
    window.sessionStorage.removeItem(LOCAL_APP_LOCK_ACTIVITY_KEY);
  } catch {
    // A locked in-memory render remains effective without browser storage.
  }
}

export function isLocalAppLockExpired(
  config: LocalAppLockConfig,
  timestamp = Date.now(),
) {
  const lastActivity = readLocalAppLockActivity();
  return (
    lastActivity === null ||
    timestamp - lastActivity >= config.timeoutMinutes * 60_000
  );
}
