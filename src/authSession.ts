export const AUTH_SESSION_STORAGE_KEY = 'zyloxp-auth-session-v2';
export const AUTH_SESSION_REVOCATION_KEY = 'zyloxp-auth-revocation-v1';

const LEGACY_AUTH_SESSION_STORAGE_KEY = 'zyloxp-session-v1';
const TAB_SESSION_DURATION_MS = 12 * 60 * 60_000;
const REMEMBERED_SESSION_DURATION_MS = 7 * 24 * 60 * 60_000;
const MAX_CLOCK_SKEW_MS = 60_000;
const SESSION_NONCE_PATTERN = /^[a-zA-Z0-9_-]{16,80}$/;

export type StoredAuthSession = {
  expiresAt: number;
  issuedAt: number;
  nonce: string;
  persistent: boolean;
  version: 2;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function removeStorageEntry(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // The in-memory authentication state remains authoritative for this render.
  }
}

function clearLegacySession() {
  if (typeof window === 'undefined') {
    return;
  }

  removeStorageEntry(window.localStorage, LEGACY_AUTH_SESSION_STORAGE_KEY);
  removeStorageEntry(window.sessionStorage, LEGACY_AUTH_SESSION_STORAGE_KEY);
}

function createNonce() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  const bytes = window.crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

function parseStoredAuthSession(
  serializedSession: string,
  expectedPersistence: boolean,
  timestamp: number,
): StoredAuthSession | null {
  try {
    const parsed = JSON.parse(serializedSession) as unknown;
    if (
      !isRecord(parsed) ||
      parsed.version !== 2 ||
      parsed.persistent !== expectedPersistence ||
      typeof parsed.issuedAt !== 'number' ||
      !Number.isSafeInteger(parsed.issuedAt) ||
      typeof parsed.expiresAt !== 'number' ||
      !Number.isSafeInteger(parsed.expiresAt) ||
      typeof parsed.nonce !== 'string' ||
      !SESSION_NONCE_PATTERN.test(parsed.nonce)
    ) {
      return null;
    }

    const maximumDuration = expectedPersistence
      ? REMEMBERED_SESSION_DURATION_MS
      : TAB_SESSION_DURATION_MS;
    const duration = parsed.expiresAt - parsed.issuedAt;
    if (
      parsed.issuedAt > timestamp + MAX_CLOCK_SKEW_MS ||
      duration <= 0 ||
      duration > maximumDuration ||
      parsed.expiresAt <= timestamp
    ) {
      return null;
    }

    return parsed as StoredAuthSession;
  } catch {
    return null;
  }
}

function readSessionFromStorage(
  storage: Storage,
  persistent: boolean,
  timestamp: number,
) {
  try {
    const serializedSession = storage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!serializedSession) {
      return null;
    }

    const session = parseStoredAuthSession(
      serializedSession,
      persistent,
      timestamp,
    );
    if (!session) {
      removeStorageEntry(storage, AUTH_SESSION_STORAGE_KEY);
    }
    return session;
  } catch {
    return null;
  }
}

export function readStoredAuthSession(
  timestamp = Date.now(),
): StoredAuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  clearLegacySession();
  const rememberedSession = readSessionFromStorage(
    window.localStorage,
    true,
    timestamp,
  );
  if (rememberedSession) {
    return rememberedSession;
  }

  return readSessionFromStorage(
    window.sessionStorage,
    false,
    timestamp,
  );
}

export function saveStoredAuthSession(
  persistent: boolean,
  timestamp = Date.now(),
): StoredAuthSession {
  if (typeof window === 'undefined') {
    throw new Error('Browser storage is unavailable.');
  }

  clearLegacySession();
  const session: StoredAuthSession = {
    expiresAt:
      timestamp +
      (persistent
        ? REMEMBERED_SESSION_DURATION_MS
        : TAB_SESSION_DURATION_MS),
    issuedAt: timestamp,
    nonce: createNonce(),
    persistent,
    version: 2,
  };
  const serializedSession = JSON.stringify(session);

  if (persistent) {
    try {
      window.localStorage.setItem(
        AUTH_SESSION_STORAGE_KEY,
        serializedSession,
      );
      removeStorageEntry(window.sessionStorage, AUTH_SESSION_STORAGE_KEY);
      return session;
    } catch {
      const tabSession = saveStoredAuthSession(false, timestamp);
      return tabSession;
    }
  }

  window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, serializedSession);
  removeStorageEntry(window.localStorage, AUTH_SESSION_STORAGE_KEY);
  return session;
}

export function clearStoredAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  clearLegacySession();
  removeStorageEntry(window.localStorage, AUTH_SESSION_STORAGE_KEY);
  removeStorageEntry(window.sessionStorage, AUTH_SESSION_STORAGE_KEY);
}

export function revokeStoredAuthSession() {
  clearStoredAuthSession();
  try {
    const nonce = window.crypto?.randomUUID?.() ?? createNonce();
    window.localStorage.setItem(
      AUTH_SESSION_REVOCATION_KEY,
      `${Date.now()}:${nonce}`,
    );
  } catch {
    // The initiating tab still signs out when cross-tab signaling is blocked.
  }
}
