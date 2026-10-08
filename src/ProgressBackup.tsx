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
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { restoreProgressEntries } from './progressRestore';

const BACKUP_SCHEMA_VERSION = 1;
const MAX_BACKUP_FILE_BYTES = 2 * 1024 * 1024;
const MAX_BACKUP_DEPTH = 16;
const MAX_BACKUP_NODES = 25_000;
const MAX_BACKUP_COLLECTION_SIZE = 10_000;
const UNSAFE_BACKUP_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
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
  {
    expected: 'array',
    key: 'zyloxp-pcb-designs-v1',
    label: 'Saved PCB boards',
  },
  {
    expected: 'object',
    key: 'zyloxp-pcb-draft-v1',
    label: 'PCB draft',
  },
  {
    expected: 'array',
    key: 'zyloxp-recent-learning-v1',
    label: 'Recent learning',
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

function assertSafeBackupValue(rootValue: unknown) {
  const pendingValues = [{ depth: 0, value: rootValue }];
  let visitedNodes = 0;

  while (pendingValues.length > 0) {
    const nextValue = pendingValues.pop();
    if (!nextValue) {
      continue;
    }

    visitedNodes += 1;
    if (visitedNodes > MAX_BACKUP_NODES) {
      throw new Error('This backup contains too much nested data.');
    }
    if (nextValue.depth > MAX_BACKUP_DEPTH) {
      throw new Error('This backup is nested too deeply.');
    }

    const { value } = nextValue;
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'boolean'
    ) {
      continue;
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        throw new Error('This backup contains an invalid number.');
      }
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length > MAX_BACKUP_COLLECTION_SIZE) {
        throw new Error('This backup contains an oversized list.');
      }
      value.forEach((item) =>
        pendingValues.push({ depth: nextValue.depth + 1, value: item }),
      );
      continue;
    }

    if (!isRecord(value)) {
      throw new Error('This backup contains an unsupported value.');
    }

    const entries = Object.entries(value);
    if (entries.length > MAX_BACKUP_COLLECTION_SIZE) {
      throw new Error('This backup contains an oversized data group.');
    }
    entries.forEach(([key, item]) => {
      if (UNSAFE_BACKUP_KEYS.has(key)) {
        throw new Error('This backup contains an unsafe data key.');
      }
      pendingValues.push({ depth: nextValue.depth + 1, value: item });
    });
  }
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
          assertSafeBackupValue(parsedValue);
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
  assertSafeBackupValue(parsedData);
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
  const fileRequestRef = useRef(0);
  const currentBackup = useMemo(createBackupFromStorage, []);
  const currentSummary = useMemo(
    () => summarizeBackup(currentBackup),
    [currentBackup],
  );
  const [pendingBackup, setPendingBackup] = useState<ZyloBackup | null>(null);
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [requiresReload, setRequiresReload] = useState(false);
  const pendingSummary = pendingBackup
    ? summarizeBackup(pendingBackup)
    : null;
  const pendingDraft = pendingBackup?.data['zyloxp-pcb-draft-v1'];
  const pendingBoards = pendingBackup?.data['zyloxp-pcb-designs-v1'];
  const includesLearning = pendingBackup?.data['zyloxp-learner-state-v1'] !== undefined;
  const includesJournal = pendingBackup?.data['zyloxp-field-journal-v1'] !== undefined;

  useEffect(() => () => { fileRequestRef.current += 1; }, []);

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
    const request = ++fileRequestRef.current;
    setPendingBackup(null);
    setStatus(null);
    setIsReading(false);

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

    setIsReading(true);
    try {
      const parsedBackup = parseZyloBackup(await backupFile.text());
      if (request === fileRequestRef.current) setPendingBackup(parsedBackup);
    } catch (error) {
      if (request === fileRequestRef.current) setStatus({
        message:
          error instanceof Error
            ? error.message
            : 'The selected backup could not be read.',
        tone: 'error',
      });
    } finally {
      if (request === fileRequestRef.current) setIsReading(false);
    }
  }

  function handleRestore() {
    if (!pendingBackup || isRestoring || requiresReload) {
      return;
    }

    setIsRestoring(true);
    setStatus(null);
    const keysToRestore = BACKUP_GROUPS.filter((group) =>
      Object.prototype.hasOwnProperty.call(pendingBackup.data, group.key),
    ).map((group) => group.key);

    try {
      const result = restoreProgressEntries(window.localStorage, keysToRestore.map((key) => [
        key, JSON.stringify(pendingBackup.data[key]),
      ]));
      if (!result.ok) {
        setIsRestoring(false);
        setRequiresReload(!result.recovered);
        setStatus({
          message: result.recovered
            ? 'Restore failed. Your previous local data was recovered. You can try again.'
            : 'Restore stopped, and some local data could not be recovered. Keep your backup file and reload before retrying.',
          tone: 'error',
        });
        return;
      }

      setPendingBackup(null);
      setStatus({
        message: 'Progress restored. Reloading ZyloXP...',
        tone: 'success',
      });
      window.location.reload();
    } catch {
      setIsRestoring(false);
      setRequiresReload(true);
      setStatus({
        message: 'Restore could not finish. Keep your backup file and reload before retrying.',
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
          disabled={isRestoring || requiresReload}
          onClick={handleExport}
          type="button"
        >
          <Download size={17} />
          Download backup
        </button>
        <button
          className="secondaryButton backupAction"
          disabled={isRestoring || requiresReload}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <Upload size={17} />
          Choose backup
        </button>
        <input
          accept=".json,application/json"
          aria-label="Choose a progress backup file"
          disabled={isRestoring || requiresReload}
          hidden
          onChange={handleFileChange}
          ref={fileInputRef}
          type="file"
        />
      </div>

      {isReading && <p className="backupIncludes" role="status">Reading backup...</p>}

      {pendingBackup && pendingSummary && (
        <div className="backupPreview">
          <div className="backupPreviewHeader">
            <FileCheck2 size={20} />
            <div>
              <strong>Backup ready to restore</strong>
              <span>{formatBackupDate(pendingBackup.createdAt)}</span>
            </div>
            <button
              aria-label="Cancel restore"
              className="backupPreviewClose"
              disabled={isRestoring || requiresReload}
              onClick={() => setPendingBackup(null)}
              title="Cancel restore"
              type="button"
            >
              <X size={17} />
            </button>
          </div>

          {(includesLearning || includesJournal) && (
            <div className="backupSnapshot preview">
              {includesLearning && (
                <>
                  <div><strong>{pendingSummary.xp.toLocaleString()}</strong><span>XP</span></div>
                  <div><strong>{pendingSummary.prompts.toLocaleString()}</strong><span>Prompts</span></div>
                  <div><strong>{pendingSummary.labRuns.toLocaleString()}</strong><span>Lab runs</span></div>
                </>
              )}
              {includesJournal && (
                <div><strong>{pendingSummary.notes.toLocaleString()}</strong><span>Notes</span></div>
              )}
            </div>
          )}

          {isRecord(pendingDraft) && typeof pendingDraft.name === 'string' && (
            <p className="backupIncludes">PCB draft: <strong>{pendingDraft.name.slice(0, 60)}</strong></p>
          )}
          {Array.isArray(pendingBoards) && (
            <p className="backupIncludes">Saved PCB boards: <strong>{pendingBoards.length}</strong></p>
          )}

          <p className="backupIncludes">
            Replaces {pendingSummary.groupLabels.join(', ')} on this device.
            Other local data stays unchanged. Download a backup first to keep a copy of your current progress.
            Close other ZyloXP tabs before restoring.
          </p>

          <div className="backupPreviewActions">
            <button
              className="secondaryButton"
              disabled={isRestoring || requiresReload}
              onClick={() => setPendingBackup(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="primaryButton"
              disabled={isRestoring || requiresReload}
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
      {requiresReload && (
        <button className="secondaryButton" onClick={() => window.location.reload()} type="button">Reload app</button>
      )}
    </section>
  );
}
