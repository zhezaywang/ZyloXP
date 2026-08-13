import {
  CheckCircle2,
  Download,
  FileCheck2,
  ShieldCheck,
  TriangleAlert,
  Upload,
  X,
} from 'lucide-react';
import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';

const BACKUP_SCHEMA_VERSION = 1;
const MAX_BACKUP_FILE_BYTES = 2 * 1024 * 1024;
const BACKUP_GROUPS = [
  {
    expected: 'object',
    key: 'zyloxp-learner-state-v1',
    label: 'Learning progress',
  },
  {
    expected: 'object',
    key: 'zyloxp-heart-state-v1',
    label: 'Hearts',
  },
  {
    expected: 'object',
    key: 'zyloxp-saved-lab-v1',
    label: 'Active lab',
  },
  {
    expected: 'array',
    key: 'zyloxp-field-journal-v1',
    label: 'Field Journal',
  },
  {
    expected: 'array',
    key: 'zyloxp-study-list-v1',
    label: 'Study List',
  },
] as const;

type BackupStorageKey = (typeof BACKUP_GROUPS)[number]['key'];
type BackupPayload = Partial<Record<BackupStorageKey, unknown>>;

export type ZyloBackup = {
  app: 'ZyloXP';
  createdAt: string;
  data: BackupPayload;
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
};

type BackupSummary = {
  groupCount: number;
  groupLabels: string[];
  labRuns: number;
  notes: number;
  prompts: number;
  xp: number;
};

type BackupStatus = {
  message: string;
  tone: 'error' | 'success';
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isExpectedValue(
  value: unknown,
  expected: (typeof BACKUP_GROUPS)[number]['expected'],
) {
  return expected === 'array' ? Array.isArray(value) : isRecord(value);
}

function getSafeCount(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : 0;
}

function createBackupFromStorage(): ZyloBackup {
  const data: BackupPayload = {};

  if (typeof window !== 'undefined') {
    BACKUP_GROUPS.forEach((group) => {
      try {
        const storedValue = window.localStorage.getItem(group.key);
        if (!storedValue) {
          return;
        }

        const parsedValue = JSON.parse(storedValue) as unknown;
        if (isExpectedValue(parsedValue, group.expected)) {
          data[group.key] = parsedValue;
        }
      } catch {
        // Invalid local entries are omitted so one damaged group cannot block a backup.
      }
    });
  }

  return {
    app: 'ZyloXP',
    createdAt: new Date().toISOString(),
    data,
    schemaVersion: BACKUP_SCHEMA_VERSION,
  };
}

export function parseZyloBackup(serializedBackup: string): ZyloBackup {
  let parsedBackup: unknown;

  try {
    parsedBackup = JSON.parse(serializedBackup) as unknown;
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  if (
    !isRecord(parsedBackup) ||
    parsedBackup.app !== 'ZyloXP' ||
    !isRecord(parsedBackup.data)
  ) {
    throw new Error('That file is not a ZyloXP progress backup.');
  }

  if (parsedBackup.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error('This backup version is not supported yet.');
  }

  if (
    typeof parsedBackup.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(parsedBackup.createdAt))
  ) {
    throw new Error('The backup date is missing or invalid.');
  }

  const parsedData = parsedBackup.data;
  const knownKeys = new Set<string>(BACKUP_GROUPS.map((group) => group.key));
  const payloadKeys = Object.keys(parsedData);
  if (payloadKeys.some((key) => !knownKeys.has(key))) {
    throw new Error('This backup contains an unknown data group.');
  }

  const data: BackupPayload = {};
  BACKUP_GROUPS.forEach((group) => {
    if (!Object.prototype.hasOwnProperty.call(parsedData, group.key)) {
      return;
    }

    const value = parsedData[group.key];
    if (!isExpectedValue(value, group.expected)) {
      throw new Error(`${group.label} has an invalid format.`);
    }
    data[group.key] = value;
  });

  if (Object.keys(data).length === 0) {
    throw new Error('This backup does not contain any progress data.');
  }

  return {
    app: 'ZyloXP',
    createdAt: parsedBackup.createdAt,
    data,
    schemaVersion: BACKUP_SCHEMA_VERSION,
  };
}

function summarizeBackup(backup: ZyloBackup): BackupSummary {
  const learnerState = isRecord(backup.data['zyloxp-learner-state-v1'])
    ? backup.data['zyloxp-learner-state-v1']
    : {};
  const journal = Array.isArray(backup.data['zyloxp-field-journal-v1'])
    ? backup.data['zyloxp-field-journal-v1']
    : [];
  const labRuns = Array.isArray(learnerState.labRunHistory)
    ? learnerState.labRunHistory.length
    : 0;

  return {
    groupCount: BACKUP_GROUPS.filter((group) =>
      Object.prototype.hasOwnProperty.call(backup.data, group.key),
    ).length,
    groupLabels: BACKUP_GROUPS.filter((group) =>
      Object.prototype.hasOwnProperty.call(backup.data, group.key),
    ).map((group) => group.label),
    labRuns,
    notes: journal.length,
    prompts: getSafeCount(learnerState.completedPrompts),
    xp: getSafeCount(learnerState.earnedXp),
  };
}

function formatBackupDate(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(createdAt));
}

export function ProgressBackup() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentBackup = useMemo(createBackupFromStorage, []);
  const currentSummary = useMemo(
    () => summarizeBackup(currentBackup),
    [currentBackup],
  );
  const [pendingBackup, setPendingBackup] = useState<ZyloBackup | null>(null);
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const pendingSummary = pendingBackup
    ? summarizeBackup(pendingBackup)
    : null;

  function handleExport() {
    const backup = createBackupFromStorage();
    const summary = summarizeBackup(backup);

    if (summary.groupCount === 0) {
      setStatus({
        message: 'No saved progress is available to export yet.',
        tone: 'error',
      });
      return;
    }

    try {
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const objectUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.download = `zyloxp-backup-${backup.createdAt.slice(0, 10)}.json`;
      downloadLink.href = objectUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      setStatus({
        message: `${summary.groupCount} data groups downloaded.`,
        tone: 'success',
      });
    } catch {
      setStatus({
        message: 'The backup could not be downloaded.',
        tone: 'error',
      });
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const backupFile = event.target.files?.[0];
    event.target.value = '';
    setPendingBackup(null);
    setStatus(null);

    if (!backupFile) {
      return;
    }

    if (backupFile.size > MAX_BACKUP_FILE_BYTES) {
      setStatus({
        message: 'That file is too large to be a ZyloXP backup.',
        tone: 'error',
      });
      return;
    }

    try {
      const parsedBackup = parseZyloBackup(await backupFile.text());
      setPendingBackup(parsedBackup);
    } catch (error) {
      setStatus({
        message:
          error instanceof Error
            ? error.message
            : 'The selected backup could not be read.',
        tone: 'error',
      });
    }
  }

  function handleRestore() {
    if (!pendingBackup) {
      return;
    }

    setIsRestoring(true);
    setStatus(null);
    const previousValues = new Map<BackupStorageKey, string | null>();
    const keysToRestore = BACKUP_GROUPS.filter((group) =>
      Object.prototype.hasOwnProperty.call(pendingBackup.data, group.key),
    ).map((group) => group.key);

    try {
      keysToRestore.forEach((key) => {
        previousValues.set(key, window.localStorage.getItem(key));
        window.localStorage.setItem(
          key,
          JSON.stringify(pendingBackup.data[key]),
        );
      });

      setPendingBackup(null);
      setStatus({
        message: 'Progress restored. Reloading ZyloXP...',
        tone: 'success',
      });
      window.location.reload();
    } catch {
      previousValues.forEach((previousValue, key) => {
        try {
          if (previousValue === null) {
            window.localStorage.removeItem(key);
          } else {
            window.localStorage.setItem(key, previousValue);
          }
        } catch {
          // The visible error below still gives the learner a recovery path.
        }
      });
      setIsRestoring(false);
      setStatus({
        message: 'Restore failed, so your current progress was kept.',
        tone: 'error',
      });
    }
  }

  return (
    <section className="progressBackup" aria-labelledby="progress-backup-title">
      <div className="progressBackupHeader">
        <span className="progressBackupIcon" aria-hidden="true">
          <ShieldCheck size={21} />
        </span>
        <div>
          <strong id="progress-backup-title">Progress backup</strong>
          <small>
            {currentSummary.groupCount > 0
              ? `${currentSummary.groupCount} data groups on this device`
              : 'No saved progress yet'}
          </small>
        </div>
      </div>

      <div className="backupSnapshot" aria-label="Current saved progress">
        <div>
          <strong>{currentSummary.xp.toLocaleString()}</strong>
          <span>XP</span>
        </div>
        <div>
          <strong>{currentSummary.prompts.toLocaleString()}</strong>
          <span>Prompts</span>
        </div>
        <div>
          <strong>{currentSummary.labRuns.toLocaleString()}</strong>
          <span>Lab runs</span>
        </div>
        <div>
          <strong>{currentSummary.notes.toLocaleString()}</strong>
          <span>Notes</span>
        </div>
      </div>

      <div className="backupActions">
        <button
          className="secondaryButton backupAction"
          onClick={handleExport}
          type="button"
        >
          <Download size={17} />
          Download backup
        </button>
        <button
          className="secondaryButton backupAction"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <Upload size={17} />
          Choose backup
        </button>
        <input
          accept=".json,application/json"
          hidden
          onChange={handleFileChange}
          ref={fileInputRef}
          type="file"
        />
      </div>

      {pendingBackup && pendingSummary && (
        <div className="backupPreview">
          <div className="backupPreviewHeader">
            <FileCheck2 size={20} />
            <div>
              <strong>Backup ready to restore</strong>
              <span>{formatBackupDate(pendingBackup.createdAt)}</span>
            </div>
            <button
              className="backupPreviewClose"
              onClick={() => setPendingBackup(null)}
              title="Cancel restore"
              type="button"
            >
              <X size={17} />
            </button>
          </div>

          <div className="backupSnapshot preview">
            <div>
              <strong>{pendingSummary.xp.toLocaleString()}</strong>
              <span>XP</span>
            </div>
            <div>
              <strong>{pendingSummary.prompts.toLocaleString()}</strong>
              <span>Prompts</span>
            </div>
            <div>
              <strong>{pendingSummary.labRuns.toLocaleString()}</strong>
              <span>Lab runs</span>
            </div>
            <div>
              <strong>{pendingSummary.notes.toLocaleString()}</strong>
              <span>Notes</span>
            </div>
          </div>

          <p className="backupIncludes">
            Restores {pendingSummary.groupLabels.join(', ')}. Other local data
            stays unchanged.
          </p>

          <div className="backupPreviewActions">
            <button
              className="secondaryButton"
              disabled={isRestoring}
              onClick={() => setPendingBackup(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="primaryButton"
              disabled={isRestoring}
              onClick={handleRestore}
              type="button"
            >
              <ShieldCheck size={17} />
              {isRestoring ? 'Restoring...' : 'Restore included data'}
            </button>
          </div>
        </div>
      )}

      {status && (
        <p
          className={`backupStatus ${status.tone}`}
          role={status.tone === 'error' ? 'alert' : 'status'}
        >
          {status.tone === 'success' ? (
            <CheckCircle2 size={17} />
          ) : (
            <TriangleAlert size={17} />
          )}
          {status.message}
        </p>
      )}
    </section>
  );
}
