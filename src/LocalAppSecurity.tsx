import {
  Check,
  Clock3,
  KeyRound,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  ShieldOff,
  TriangleAlert,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  APP_LOCK_TIMEOUT_OPTIONS,
  LOCAL_APP_LOCK_ATTEMPT_STORAGE_KEY,
  isLocalAppLockSupported,
  isValidLocalAppLockPin,
  readLocalAppLockAttemptState,
} from './localAppLock';
import type {
  LocalAppLockConfig,
  LocalAppLockVerificationResult,
} from './localAppLock';

type SecurityActionResult = {
  message: string;
  ok: boolean;
};

type LocalSecuritySettingsProps = {
  config: LocalAppLockConfig | null;
  onChangePin: (
    currentPin: string,
    nextPin: string,
  ) => Promise<SecurityActionResult>;
  onDisable: (currentPin: string) => Promise<SecurityActionResult>;
  onEnable: (
    pin: string,
    timeoutMinutes: number,
    lockOnHidden: boolean,
  ) => Promise<SecurityActionResult>;
  onLockOnHiddenChange: (enabled: boolean) => void;
  onLockNow: () => void;
  onTimeoutChange: (timeoutMinutes: number) => void;
};

function PinInput({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="securityPinField">
      <span>{label}</span>
      <input
        aria-label={label}
        autoComplete="off"
        inputMode="numeric"
        maxLength={6}
        onChange={(event) =>
          onChange(event.target.value.replace(/\D/g, '').slice(0, 6))
        }
        pattern="[0-9]{6}"
        placeholder="6 digits"
        type="password"
        value={value}
      />
    </label>
  );
}

export function LocalSecuritySettings({
  config,
  onChangePin,
  onDisable,
  onEnable,
  onLockOnHiddenChange,
  onLockNow,
  onTimeoutChange,
}: LocalSecuritySettingsProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [nextPin, setNextPin] = useState('');
  const [confirmNextPin, setConfirmNextPin] = useState('');
  const [timeoutMinutes, setTimeoutMinutes] = useState(15);
  const [lockOnHidden, setLockOnHidden] = useState(false);
  const [busyAction, setBusyAction] = useState<
    'change' | 'disable' | 'enable' | null
  >(null);
  const [message, setMessage] = useState('');
  const [manageOpen, setManageOpen] = useState(false);
  const supported = isLocalAppLockSupported();

  useEffect(() => {
    if (config) {
      setTimeoutMinutes(config.timeoutMinutes);
      setLockOnHidden(config.lockOnHidden);
    }
  }, [config]);

  function clearPinFields() {
    setPin('');
    setConfirmPin('');
    setCurrentPin('');
    setNextPin('');
    setConfirmNextPin('');
  }

  async function handleEnable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pin !== confirmPin) {
      setMessage('The PIN entries do not match.');
      return;
    }

    setBusyAction('enable');
    setMessage('');
    const result = await onEnable(pin, timeoutMinutes, lockOnHidden);
    setBusyAction(null);
    setMessage(result.message);
    if (result.ok) {
      clearPinFields();
    }
  }

  async function handleChangePin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (nextPin !== confirmNextPin) {
      setMessage('The new PIN entries do not match.');
      return;
    }

    setBusyAction('change');
    setMessage('');
    const result = await onChangePin(currentPin, nextPin);
    setBusyAction(null);
    setMessage(result.message);
    if (result.ok) {
      clearPinFields();
      setManageOpen(false);
    }
  }

  async function handleDisable() {
    setBusyAction('disable');
    setMessage('');
    const result = await onDisable(currentPin);
    setBusyAction(null);
    setMessage(result.message);
    if (result.ok) {
      clearPinFields();
      setManageOpen(false);
    }
  }

  return (
    <section className="localSecuritySettings" aria-label="Device privacy lock">
      <div className={`localSecurityStatus ${config ? 'enabled' : ''}`}>
        <span>{config ? <ShieldCheck size={20} /> : <ShieldOff size={20} />}</span>
        <div>
          <strong>{config ? 'Device lock enabled' : 'Device lock is off'}</strong>
          <small>
            {config
              ? `ZyloXP locks after ${config.timeoutMinutes} minutes without activity.`
              : 'Require a local PIN before an idle browser session can be reopened.'}
          </small>
        </div>
        {config && <Check size={17} />}
      </div>

      <p className="localSecurityScope">
        This privacy lock protects the app on this browser. It does not encrypt
        local learning data or replace server-side account security.
      </p>

      {!supported && (
        <div className="localSecurityMessage error" role="alert">
          <TriangleAlert size={16} />
          This browser does not provide the Web Crypto API needed for a secure
          verifier.
        </div>
      )}

      {!config ? (
        <form className="localSecurityForm" onSubmit={handleEnable}>
          <div className="localSecurityPinGrid">
            <PinInput label="New device PIN" onChange={setPin} value={pin} />
            <PinInput
              label="Confirm device PIN"
              onChange={setConfirmPin}
              value={confirmPin}
            />
          </div>
          <label className="securityTimeoutField">
            <span>Lock after</span>
            <select
              aria-label="Auto-lock delay"
              onChange={(event) => setTimeoutMinutes(Number(event.target.value))}
              value={timeoutMinutes}
            >
              {APP_LOCK_TIMEOUT_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes idle
                </option>
              ))}
            </select>
          </label>
          <label className="securityToggleRow">
            <input
              checked={lockOnHidden}
              onChange={(event) => setLockOnHidden(event.target.checked)}
              type="checkbox"
            />
            <span>
              <strong>Lock when hidden</strong>
              <small>Require the PIN after switching away from ZyloXP.</small>
            </span>
          </label>
          <button
            className="localSecurityPrimary"
            disabled={
              !supported ||
              busyAction !== null ||
              !isValidLocalAppLockPin(pin) ||
              pin !== confirmPin
            }
            type="submit"
          >
            <LockKeyhole size={17} />
            {busyAction === 'enable' ? 'Creating verifier...' : 'Enable device lock'}
          </button>
        </form>
      ) : (
        <>
          <div className="localSecurityControls">
            <label className="securityTimeoutField">
              <span>
                <Clock3 size={15} />
                Auto-lock
              </span>
              <select
                aria-label="Auto-lock delay"
                onChange={(event) => {
                  const nextTimeout = Number(event.target.value);
                  setTimeoutMinutes(nextTimeout);
                  onTimeoutChange(nextTimeout);
                  setMessage(`Auto-lock updated to ${nextTimeout} minutes.`);
                }}
                value={timeoutMinutes}
              >
                {APP_LOCK_TIMEOUT_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </label>
            <button className="localSecurityLockNow" onClick={onLockNow} type="button">
              <LockKeyhole size={17} />
              Lock now
            </button>
          </div>

          <label className="securityToggleRow">
            <input
              checked={lockOnHidden}
              onChange={(event) => {
                const enabled = event.target.checked;
                setLockOnHidden(enabled);
                onLockOnHiddenChange(enabled);
                setMessage(
                  enabled
                    ? 'Background locking enabled.'
                    : 'Background locking disabled.',
                );
              }}
              type="checkbox"
            />
            <span>
              <strong>Lock when hidden</strong>
              <small>Require the PIN after switching apps or browser tabs.</small>
            </span>
          </label>

          <div className="localSecurityAssurance">
            <ShieldCheck size={17} />
            <span>
              <strong>Protected retries</strong>
              <small>Incorrect PINs trigger persistent, progressive delays.</small>
            </span>
          </div>

          <button
            aria-expanded={manageOpen}
            className="localSecurityManageToggle"
            onClick={() => {
              setManageOpen((open) => !open);
              setMessage('');
              clearPinFields();
            }}
            type="button"
          >
            <KeyRound size={17} />
            Change or remove PIN
          </button>

          {manageOpen && (
            <form className="localSecurityForm manage" onSubmit={handleChangePin}>
              <PinInput
                label="Current PIN"
                onChange={setCurrentPin}
                value={currentPin}
              />
              <div className="localSecurityPinGrid">
                <PinInput label="New PIN" onChange={setNextPin} value={nextPin} />
                <PinInput
                  label="Confirm new PIN"
                  onChange={setConfirmNextPin}
                  value={confirmNextPin}
                />
              </div>
              <div className="localSecurityManageActions">
                <button
                  disabled={
                    busyAction !== null ||
                    !isValidLocalAppLockPin(currentPin) ||
                    !isValidLocalAppLockPin(nextPin) ||
                    nextPin !== confirmNextPin
                  }
                  type="submit"
                >
                  <KeyRound size={16} />
                  {busyAction === 'change' ? 'Updating...' : 'Change PIN'}
                </button>
                <button
                  className="danger"
                  disabled={
                    busyAction !== null || !isValidLocalAppLockPin(currentPin)
                  }
                  onClick={() => void handleDisable()}
                  type="button"
                >
                  <ShieldOff size={16} />
                  {busyAction === 'disable' ? 'Removing...' : 'Remove lock'}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {message && (
        <div
          className={`localSecurityMessage ${
            /wrong|incorrect|retry protection|try again|does not|do not|unavailable|failed|could not|not enabled/i.test(
              message,
            )
              ? 'error'
              : 'success'
          }`}
          role="status"
        >
          {/wrong|incorrect|retry protection|try again|does not|do not|unavailable|failed|could not|not enabled/i.test(
            message,
          ) ? (
            <TriangleAlert size={16} />
          ) : (
            <Check size={16} />
          )}
          {message}
        </div>
      )}
    </section>
  );
}

export function LocalAppLockScreen({
  onSignOut,
  onUnlock,
}: {
  onSignOut: () => void;
  onUnlock: (pin: string) => Promise<LocalAppLockVerificationResult>;
}) {
  const [initialAttemptState] = useState(readLocalAppLockAttemptState);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(
    initialAttemptState.failedAttempts,
  );
  const [blockedUntil, setBlockedUntil] = useState(
    initialAttemptState.blockedUntil,
  );
  const [blockSeconds, setBlockSeconds] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (blockedUntil <= Date.now()) {
      setBlockSeconds(0);
      return;
    }

    const updateCountdown = () => {
      const seconds = Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000));
      setBlockSeconds(seconds);
      if (seconds === 0) {
        setBlockedUntil(0);
        setError(
          failedAttempts >= 5
            ? 'You can try one PIN again. Another miss will trigger a longer delay.'
            : 'You can try again.',
        );
      }
    };
    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(intervalId);
  }, [blockedUntil, failedAttempts]);

  useEffect(() => {
    const syncAttemptState = (event: StorageEvent) => {
      if (event.key !== LOCAL_APP_LOCK_ATTEMPT_STORAGE_KEY) {
        return;
      }

      const nextState = readLocalAppLockAttemptState();
      setFailedAttempts(nextState.failedAttempts);
      setBlockedUntil(nextState.blockedUntil);
      if (nextState.blockedUntil > Date.now()) {
        setError('Too many incorrect PINs. Retry protection is active.');
      }
    };

    window.addEventListener('storage', syncAttemptState);
    return () => window.removeEventListener('storage', syncAttemptState);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || blockSeconds > 0 || !isValidLocalAppLockPin(pin)) {
      return;
    }

    setBusy(true);
    setError('');
    const result = await onUnlock(pin);
    setBusy(false);
    if (result.ok) {
      return;
    }

    setFailedAttempts(result.failedAttempts);
    setBlockedUntil(result.blockedUntil);
    setPin('');
    if (result.blockedUntil > Date.now()) {
      const seconds = Math.max(
        1,
        Math.ceil((result.blockedUntil - Date.now()) / 1000),
      );
      setError(`Retry protection is active. Try again in ${seconds} seconds.`);
    } else {
      setError(
        `That PIN is incorrect. ${result.attemptsRemaining} ${
          result.attemptsRemaining === 1 ? 'attempt remains' : 'attempts remain'
        } before a delay.`,
      );
    }
  }

  return (
    <main className="localLockScreen" aria-labelledby="local-lock-title">
      <section className="localLockPanel">
        <header>
          <span className="localLockMark">
            <LockKeyhole size={28} />
          </span>
          <div>
            <p>ZyloXP</p>
            <h1 id="local-lock-title">Session locked</h1>
          </div>
        </header>

        <p className="localLockPrompt">
          Enter the six-digit device PIN to continue where you left off.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            <span>Device PIN</span>
            <input
              aria-describedby={error ? 'local-lock-error' : undefined}
              autoComplete="off"
              autoFocus
              disabled={busy || blockSeconds > 0}
              inputMode="numeric"
              maxLength={6}
              onChange={(event) =>
                setPin(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
              pattern="[0-9]{6}"
              placeholder="Enter 6 digits"
              type="password"
              value={pin}
            />
          </label>
          <button
            disabled={
              busy || blockSeconds > 0 || !isValidLocalAppLockPin(pin)
            }
            type="submit"
          >
            <ShieldCheck size={18} />
            {busy
              ? 'Checking...'
              : blockSeconds > 0
                ? `Try again in ${blockSeconds}s`
                : 'Unlock ZyloXP'}
          </button>
        </form>

        {error && (
          <div
            className={blockSeconds > 0 ? 'localLockError' : 'localLockNotice'}
            id="local-lock-error"
            role="status"
          >
            {blockSeconds > 0 ? (
              <TriangleAlert size={16} />
            ) : (
              <KeyRound size={16} />
            )}
            {error}
          </div>
        )}

        <footer>
          <span>
            Local privacy lock · progressive retries · learning data stays on
            this browser
          </span>
          <button onClick={onSignOut} type="button">
            <LogOut size={15} />
            Sign out
          </button>
        </footer>
      </section>
    </main>
  );
}
