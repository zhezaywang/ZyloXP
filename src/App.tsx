import {
  Activity,
  Apple,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Atom,
  Award,
  BarChart3,
  BatteryCharging,
  Bell,
  Bookmark,
  BookmarkCheck,
  BrainCircuit,
  CalendarDays,
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  CircleHelp,
  Clock3,
  Download,
  GraduationCap,
  Gamepad2,
  Heart,
  History,
  Eye,
  EyeOff,
  FlaskConical,
  GitBranch,
  Image as ImageIcon,
  Lightbulb,
  Lock,
  Mail,
  Menu,
  MessageCircleQuestion,
  Maximize2,
  Minimize2,
  NotebookPen,
  NotebookTabs,
  Pause,
  Play,
  RefreshCw,
  Route,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Target,
  TriangleAlert,
  Trophy,
  User,
  WifiOff,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  ComponentType,
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import type { CircuitDesign } from './CircuitWorkbench';
import type {
  DailyMissionId,
  DailyMissionView,
  WeeklyActivityDay,
} from './DailyMissionBoard';
import {
  electricalConcepts,
  engineeringGames,
  getElectricalConcept,
  getEngineeringGame,
  getQuestionAtlasConcept,
  getQuestionAtlasGame,
} from './electricalAtlasData';
import type {
  CheckpointDomain,
  CheckpointDomainId,
  CheckpointExamAnswer,
  CheckpointExamConfig,
  CheckpointExamState,
} from './CheckpointExam';
import { getCheckpointDurationMinutes } from './checkpointExamTiming';
import type { PortfolioEvidence } from './EvidencePortfolio';
import { stageFieldJournalDraft } from './fieldJournalDraft';
import type { FieldJournalDraftSeed } from './fieldJournalDraft';
import {
  FIELD_JOURNAL_STORAGE_KEY,
  readFieldNotes,
} from './fieldNotes';
import type { FieldNote } from './fieldNotes';
import {
  formatFocusTimer,
  getFocusElapsedMs,
  getFocusRemainingMs,
  normalizeFocusHistory,
  normalizeFocusSession,
} from './focusSession';
import type {
  FocusDebrief,
  FocusObjective,
  FocusSession,
  FocusSessionConfig,
  FocusSessionRecord,
} from './focusSession';
import type { LabRunSnapshot } from './LabBenchLog';
import { calculateLabMetrics } from './labMetrics';
import type {
  FormulaConfidence,
  FormulaEntry,
  FormulaReviewState,
  NotebookFilter,
} from './FormulaNotebookWorkspace';
import {
  LocalAppLockScreen,
  LocalSecuritySettings,
} from './LocalAppSecurity';
import {
  LOCAL_APP_LOCK_COMMAND_STORAGE_KEY,
  LOCAL_APP_LOCK_STORAGE_KEY,
  broadcastLocalAppLock,
  clearLocalAppLockActivity,
  createLocalAppLockConfig,
  isLocalAppLockExpired,
  markLocalAppLockActivity,
  readLocalAppLockActivity,
  readLocalAppLockConfig,
  removeLocalAppLockConfig,
  saveLocalAppLockConfig,
  verifyLocalAppLockPinWithProtection,
} from './localAppLock';
import type {
  LocalAppLockConfig,
  LocalAppLockVerificationResult,
} from './localAppLock';
import { resolvePublicAssetPath } from './publicAsset';
import {
  getSearchResultScore,
  normalizeSearchText,
} from './searchRanking';
import type { LabSimulationValues } from './labMetrics';
import type {
  NotebookLibraryView,
  SavedQuestionLibraryItem,
} from './NotebookLibrary';
import {
  STUDY_LIST_STORAGE_KEY,
  addStudyListResource,
  getStudyListItemKey,
  isStudyListKind,
  normalizeStudyListItems,
  readStudyListItems,
  saveStudyListItems,
} from './studyList';
import type {
  StudyListItem,
  StudyListResource,
} from './studyList';
import {
  RecentLearning,
  readRecentLearningItems,
  saveRecentLearningItems,
  upsertRecentLearningItem,
} from './RecentLearning';
import type { RecentLearningItem } from './RecentLearning';
import type {
  LearningActivityDay,
  LearningSkillSignal,
} from './LearningInsights';
import {
  DEVICE_ALERTS_STORAGE_KEY,
  readDeviceAlertPermission,
  readDeviceAlertsEnabled,
  sendDeviceAlert,
} from './deviceAlerts';
import type { DeviceAlertPermission } from './deviceAlerts';
import {
  HEART_RECHARGE_MS,
  HEART_STORAGE_KEY,
  MAX_HEARTS,
  formatHeartCountdown,
  formatHeartDuration,
  getFullRechargeMs,
  normalizeHeartState,
} from './heartSystem';
import type { HeartState } from './heartSystem';
import {
  MISTAKE_CAUSE_IDS,
  type MistakeCause,
  type MistakeLabItem,
  type MistakeReflection,
} from './mistakeLabModel';
import {
  bankSignals,
  bankSummary,
  careerTracks,
  labScenarios,
  lessonQuestions,
  navigation,
  skillNodes,
  stats,
  topicSignals,
} from './data';
import type { AppSection, CareerTrack, LabScenario, LessonQuestion, SkillNode } from './data';
import type { SkillMapNode } from './SkillMap';
import type {
  StudyRoute,
  StudyRouteConfig,
  StudyRouteStep,
} from './StudyRoutePlanner';
import type {
  WeeklyPlan,
  WeeklyPlanAction,
  WeeklyPlanConfig,
  WeeklyPlanDay,
} from './WeeklyPlanner';
import type { ZyTutorAction, ZyTutorContext } from './ZyTutor';
import { APP_UPDATE_READY_EVENT } from './appEvents';
import { buildAppHash, parseAppHash } from './appRouting';
import type { AppPage as ActivePage, AppRoute } from './appRouting';

function createPreloadableLazy<
  TModule,
  TComponent extends ComponentType<any>,
>(
  importer: () => Promise<TModule>,
  selectComponent: (module: TModule) => TComponent,
) {
  let componentPromise: Promise<{ default: TComponent }> | null = null;
  const load = () => {
    componentPromise ??= importer().then((module) => ({
      default: selectComponent(module),
    }));
    return componentPromise;
  };

  return {
    Component: lazy(load),
    preload: () => load().then(() => undefined),
  };
}

const {
  Component: EngineeringToolkit,
  preload: preloadEngineeringToolkit,
} = createPreloadableLazy(
  () => import('./EngineeringToolkit'),
  (module) => module.EngineeringToolkit,
);
const { Component: ZyTutor, preload: preloadZyTutor } =
  createPreloadableLazy(
    () => import('./ZyTutor'),
    (module) => module.ZyTutor,
  );
const {
  Component: NotebookLibraryTabs,
  preload: preloadNotebookLibrary,
} = createPreloadableLazy(
  () => import('./NotebookLibrary'),
  (module) => module.NotebookLibraryTabs,
);
const { Component: SavedQuestionLibrary } = createPreloadableLazy(
  () => import('./NotebookLibrary'),
  (module) => module.SavedQuestionLibrary,
);
const { Component: BenchRunLibrary } = createPreloadableLazy(
  () => import('./NotebookLibrary'),
  (module) => module.BenchRunLibrary,
);
const { Component: StudyListWorkspace } = createPreloadableLazy(
  () => import('./NotebookLibrary'),
  (module) => module.StudyListWorkspace,
);
const {
  Component: FormulaNotebookWorkspace,
  preload: preloadFormulaNotebookWorkspace,
} = createPreloadableLazy(
  () => import('./FormulaNotebookWorkspace'),
  (module) => module.FormulaNotebookWorkspace,
);
const {
  Component: DailyMissionBoard,
  preload: preloadDailyMissionBoard,
} = createPreloadableLazy(
  () => import('./DailyMissionBoard'),
  (module) => module.DailyMissionBoard,
);

const CircuitWorkbench = lazy(() =>
  import('./CircuitWorkbench').then((module) => ({
    default: module.CircuitWorkbench,
  })),
);
const {
  Component: ElectricalAtlas,
  preload: preloadElectricalAtlas,
} = createPreloadableLazy(
  () => import('./ElectricalAtlas'),
  (module) => module.ElectricalAtlas,
);
const CheckpointExam = lazy(() =>
  import('./CheckpointExam').then((module) => ({
    default: module.CheckpointExam,
  })),
);
const {
  Component: EvidencePortfolio,
  preload: preloadEvidencePortfolio,
} = createPreloadableLazy(
  () => import('./EvidencePortfolio'),
  (module) => module.EvidencePortfolio,
);
const {
  Component: FieldJournal,
  preload: preloadFieldJournal,
} = createPreloadableLazy(
  () => import('./FieldJournal'),
  (module) => module.FieldJournal,
);
const FocusRoom = lazy(() =>
  import('./FocusRoom').then((module) => ({
    default: module.FocusRoom,
  })),
);
const LabBenchLog = lazy(() =>
  import('./LabBenchLog').then((module) => ({
    default: module.LabBenchLog,
  })),
);
const MistakeLab = lazy(() =>
  import('./MistakeLab').then((module) => ({
    default: module.MistakeLab,
  })),
);
const {
  Component: LabSchematic,
  preload: preloadLabSchematic,
} = createPreloadableLazy(
  () => import('./LabVisualStage'),
  (module) => module.LabSchematic,
);
const {
  Component: LabVisualStage,
  preload: preloadLabVisualStage,
} = createPreloadableLazy(
  () => import('./LabVisualStage'),
  (module) => module.LabVisualStage,
);
const LearningInsights = lazy(() =>
  import('./LearningInsights').then((module) => ({
    default: module.LearningInsights,
  })),
);
const ProgressBackup = lazy(() =>
  import('./ProgressBackup').then((module) => ({
    default: module.ProgressBackup,
  })),
);
const {
  Component: QuestionVisualStage,
  preload: preloadQuestionVisualStage,
} = createPreloadableLazy(
  () => import('./QuestionVisualStage'),
  (module) => module.QuestionVisualStage,
);
const SkillMap = lazy(() =>
  import('./SkillMap').then((module) => ({
    default: module.SkillMap,
  })),
);
const StudyRoutePlanner = lazy(() =>
  import('./StudyRoutePlanner').then((module) => ({
    default: module.StudyRoutePlanner,
  })),
);
const WeeklyPlanner = lazy(() =>
  import('./WeeklyPlanner').then((module) => ({
    default: module.WeeklyPlanner,
  })),
);
function WorkspacePageFallback({ label }: { label: string }) {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="pageLoadingState"
      role="status"
    >
      <header className="pageLoadingHeader">
        <span aria-hidden="true">
          <RefreshCw size={22} />
        </span>
        <div>
          <p className="eyebrow">Opening workspace</p>
          <h1>{label}</h1>
          <p>Bringing your latest progress into view.</p>
        </div>
      </header>
      <div aria-hidden="true" className="pageLoadingPreview">
        <span className="pageLoadingHero" />
        <div className="pageLoadingTabs">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="pageLoadingGrid">
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}

function DeferredPanelFallback() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="deferredPanelFallback"
      role="status"
    >
      <RefreshCw aria-hidden="true" size={18} />
      <span>Loading panel</span>
    </div>
  );
}

function DailyMissionBoardFallback() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading Daily Charge"
      className="dailyMissionBoard dailyMissionBoardFallback"
      role="status"
    >
      <header>
        <div>
          <p className="eyebrow">Daily Charge</p>
          <h2>Building today's momentum</h2>
        </div>
        <RefreshCw aria-hidden="true" size={18} />
      </header>
      <div aria-hidden="true" className="dailyMissionFallbackGrid">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

function QuestionVisualStageFallback({ label }: { label: string }) {
  return (
    <section
      aria-busy="true"
      aria-label={`Loading ${label}`}
      className="questionVisualStage questionVisualStageFallback"
      role="status"
    >
      <header className="visualStageHeader">
        <div>
          <span>Engineering visual</span>
          <strong>{label}</strong>
        </div>
        <RefreshCw aria-hidden="true" size={17} />
      </header>
      <div aria-hidden="true" className="questionVisualFallbackCanvas" />
    </section>
  );
}

type AuthMode = 'login' | 'create' | 'reset';
type EntryView = 'intro' | 'auth';
type SocialProvider = 'Apple' | 'Google';
type OverlayType =
  | 'notifications'
  | 'hearts'
  | 'help'
  | 'settings'
  | 'menu'
  | 'toolkit'
  | null;
type NotificationAction =
  | 'claim-daily'
  | 'hearts'
  | 'progress'
  | 'review'
  | 'weekly-plan';
type NotificationTone = 'achievement' | 'attention' | 'ready' | 'status';
type AppNotification = {
  action?: NotificationAction;
  actionLabel?: string;
  description: string;
  icon: typeof Bell;
  id: string;
  revision?: string;
  title: string;
  tone: NotificationTone;
};
type SearchResultKind =
  | 'Section'
  | 'Concept'
  | 'Game'
  | 'Tool'
  | 'Note'
  | 'Bench Run'
  | 'Skill'
  | 'Lab'
  | 'Career'
  | 'Question'
  | 'Formula';
type SearchKindFilter = 'All' | SearchResultKind;
type ZyGuideMood = 'celebrate' | 'focus' | 'idle' | 'retry';
type ZyReaction =
  | 'boost'
  | 'celebrate'
  | 'curious'
  | 'dance'
  | 'gasp'
  | 'idle'
  | 'think'
  | 'wave'
  | 'wink';
type PracticeMode = 'path' | 'mixed' | 'review' | 'saved';
type QuestionResult = 'correct' | 'wrong';
type AnswerConfidence = 'guess' | 'unsure' | 'sure';
type ReadingSize = 'standard' | 'large';
type SaveStatus = 'error' | 'idle' | 'saved' | 'saving';
type ToastAction = {
  label: string;
  run: () => void;
};
type ToastState = {
  action?: ToastAction;
  message: string;
};
type AppInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
  }>;
};
type CustomSessionDifficulty = 'all' | 'foundation' | 'applied' | 'advanced';
type CustomSessionLength = 5 | 10;
type SprintSource =
  | 'career'
  | 'custom'
  | 'diagnostic'
  | 'power'
  | 'recovery'
  | 'review';

type SearchResult = {
  id: string;
  kind: SearchResultKind;
  keywords?: string;
  routeHash?: string;
  subtitle: string;
  title: string;
  transient?: boolean;
};

const SEARCH_KIND_PRIORITY: Record<SearchResultKind, number> = {
  Section: 0,
  Concept: 1,
  Game: 2,
  Tool: 3,
  Note: 4,
  'Bench Run': 5,
  Skill: 6,
  Lab: 7,
  Formula: 8,
  Career: 9,
  Question: 10,
};

const SEARCH_RESULT_KINDS = Object.keys(
  SEARCH_KIND_PRIORITY,
) as SearchResultKind[];

const SEARCH_KIND_ICONS = {
  Section: Route,
  Concept: Atom,
  Game: Gamepad2,
  Tool: SlidersHorizontal,
  Note: NotebookPen,
  'Bench Run': History,
  Skill: BrainCircuit,
  Lab: FlaskConical,
  Career: GraduationCap,
  Question: Target,
  Formula: Calculator,
} satisfies Record<SearchResultKind, typeof Search>;

const RECENT_SEARCH_STORAGE_KEY = 'zyloxp-recent-search-v1';
const RECENT_SEARCH_LIMIT = 4;
const NOTIFICATION_READ_STORAGE_KEY = 'zyloxp-notification-read-v1';
const NOTIFICATION_READ_LIMIT = 100;

function getNotificationReadKey(notification: AppNotification) {
  return `${notification.id}:${notification.revision ?? 'current'}`;
}

function readStoredNotificationReadKeys() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedKeys = JSON.parse(
      window.localStorage.getItem(NOTIFICATION_READ_STORAGE_KEY) ?? '[]',
    ) as unknown;

    return Array.isArray(storedKeys)
      ? [
          ...new Set(
            storedKeys.filter(
              (key): key is string =>
                typeof key === 'string' && key.length > 0 && key.length <= 180,
            ),
          ),
        ].slice(0, NOTIFICATION_READ_LIMIT)
      : [];
  } catch {
    return [];
  }
}

function isStoredSearchResult(value: unknown): value is SearchResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const result = value as Partial<SearchResult>;
  return (
    typeof result.id === 'string' &&
    typeof result.kind === 'string' &&
    Object.prototype.hasOwnProperty.call(SEARCH_KIND_PRIORITY, result.kind) &&
    (result.routeHash === undefined ||
      (typeof result.routeHash === 'string' &&
        result.routeHash.startsWith('#/') &&
        result.routeHash.length <= 300)) &&
    typeof result.subtitle === 'string' &&
    typeof result.title === 'string'
  );
}

function readRecentSearchResults() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedResults = JSON.parse(
      window.localStorage.getItem(RECENT_SEARCH_STORAGE_KEY) ?? '[]',
    ) as unknown;
    return Array.isArray(storedResults)
      ? storedResults
          .filter(isStoredSearchResult)
          .slice(0, RECENT_SEARCH_LIMIT)
      : [];
  } catch {
    return [];
  }
}

function formatSearchArtifactDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(timestamp);
}

function preloadAppSection(section: AppSection) {
  let preload: Promise<void> | null = null;

  switch (section) {
    case 'learn':
      preload = preloadDailyMissionBoard();
      break;
    case 'practice':
      preload = preloadQuestionVisualStage();
      break;
    case 'labs':
      preload = Promise.all([
        preloadLabSchematic(),
        preloadLabVisualStage(),
      ]).then(() => undefined);
      break;
    case 'atlas':
      preload = preloadElectricalAtlas();
      break;
    case 'careers':
      preload = preloadEvidencePortfolio();
      break;
    case 'notebook':
      preload = Promise.all([
        preloadFieldJournal(),
        preloadFormulaNotebookWorkspace(),
        preloadNotebookLibrary(),
      ]).then(() => undefined);
      break;
    default:
      break;
  }

  return preload?.catch(() => undefined) ?? Promise.resolve();
}

const IDLE_PRELOAD_SECTIONS: AppSection[] = [
  'practice',
  'labs',
  'atlas',
  'careers',
  'notebook',
];

function preloadSearchResult(result: SearchResult) {
  let preload: Promise<unknown> | null = null;

  if (result.kind === 'Concept' || result.kind === 'Game') {
    preload = preloadElectricalAtlas();
  } else if (result.kind === 'Note') {
    preload = preloadFieldJournal();
  } else if (result.kind === 'Bench Run') {
    preload = preloadLabVisualStage();
  } else if (result.kind === 'Question' || result.kind === 'Skill') {
    preload = preloadQuestionVisualStage();
  } else if (result.kind === 'Lab') {
    preload = preloadLabVisualStage();
  } else if (result.kind === 'Career') {
    preload = preloadEvidencePortfolio();
  } else if (result.kind === 'Section') {
    preloadAppSection(result.id as AppSection);
    return;
  } else if (result.kind === 'Tool') {
    switch (result.id) {
      case 'checkpoint-exam':
        preload = import('./CheckpointExam');
        break;
      case 'circuit-workbench':
        preload = import('./CircuitWorkbench');
        break;
      case 'focus-room':
        preload = import('./FocusRoom');
        break;
      case 'insights':
        preload = import('./LearningInsights');
        break;
      case 'mistake-lab':
        preload = import('./MistakeLab');
        break;
      case 'skill-map':
        preload = import('./SkillMap');
        break;
      case 'study-route':
        preload = import('./StudyRoutePlanner');
        break;
      case 'toolkit':
        preload = preloadEngineeringToolkit();
        break;
      case 'weekly-plan':
        preload = import('./WeeklyPlanner');
        break;
      default:
        break;
    }
  }

  void preload?.catch(() => undefined);
}

const ZyTutorLaunchContext = createContext<(() => void) | null>(null);

type LabValueKey = keyof LabSimulationValues;

type LabMission = {
  brief: string;
  decimals: number;
  id: string;
  labId: string;
  target: number;
  title: string;
  tolerance: number;
  unit: string;
  xp: number;
};

type LabMissionFeedback = {
  kind: 'adjust' | 'success';
  message: string;
} | null;

type LabMode = 'calibration' | 'fault';

type LabFaultMeasurement = {
  id: string;
  label: string;
  mode: string;
  note: string;
  reading: string;
};

type LabFaultDiagnosis = {
  detail: string;
  id: string;
  label: string;
};

type LabFaultCase = {
  correctDiagnosisId: string;
  diagnoses: LabFaultDiagnosis[];
  explanation: string;
  id: string;
  labId: string;
  measurements: LabFaultMeasurement[];
  observedOutput: string;
  safetyNote: string;
  symptom: string;
  title: string;
  xp: number;
};

type LabFaultFeedback = {
  kind: 'success' | 'wrong';
  message: string;
} | null;

type QuestionMasteryRecord = {
  attempts: number;
  correct: number;
  highConfidenceMisses: number;
  lastConfidence: AnswerConfidence | null;
  lastAnsweredAt: number;
  lastResult: QuestionResult;
  nextReviewAt: number;
  reviewStage: number;
  streak: number;
};

type ReviewStatus = 'due' | 'learning' | 'new' | 'strong';

type ReviewPlanItem = {
  accuracy: number | null;
  dueLabel: string;
  question: LessonQuestion;
  questionIndex: number;
  reason: string;
  status: ReviewStatus;
  strength: number;
};

type DailyActivityRecord = {
  careerProjects: number;
  diagnostics: number;
  exams: number;
  focusMinutes: number;
  labMissions: number;
  questions: number;
  sprints: number;
  xp: number;
};

type DailyActivityHistory = Record<string, DailyActivityRecord>;

type Achievement = {
  description: string;
  icon: typeof Award;
  id: string;
  progress: string;
  title: string;
  unlocked: boolean;
};

type SprintAnswer = {
  questionId: string;
  result: QuestionResult | 'skipped';
};

type SprintState = {
  answerConfidence: AnswerConfidence | null;
  completedAt: number | null;
  diagnosticId: BankCollectionId | null;
  earnedXp: number;
  label: string;
  paused: boolean;
  position: number;
  questionIndices: number[];
  results: SprintAnswer[];
  selectedOption: number | null;
  source: SprintSource;
  startedAt: number;
};

type SprintLaunchOptions = {
  diagnosticId?: BankCollectionId | null;
  label: string;
  length?: number;
  message: string;
  source: SprintSource;
};

type SprintSummary = {
  completedAt: number;
  correct: number;
  earnedXp: number;
  source: SprintSource;
  total: number;
};

type CareerProfile = {
  labId: string;
  labLabel: string;
  projectDescription: string;
  projectTitle: string;
  role: string;
  skills: Array<{
    id: string;
    label: string;
    weight: number;
  }>;
};

type CareerProjectOption = {
  detail: string;
  id: string;
  label: string;
  signal: string;
};

type CareerProjectDecision = {
  correctOptionId: string;
  explanation: string;
  id: string;
  options: CareerProjectOption[];
  prompt: string;
  title: string;
};

type CareerProject = {
  brief: string;
  constraints: string[];
  decisions: CareerProjectDecision[];
  deliverable: string;
  labId: string;
  role: string;
  title: string;
  xp: number;
};

type CareerProjectRecord = {
  answers: Record<string, string>;
  completedAt: number | null;
  score: number;
};

type CareerSkillSignal = {
  id: string;
  label: string;
  progress: number;
  status: SkillNode['status'];
  title: string;
};

type CareerReadiness = {
  focusSkill: CareerSkillSignal;
  labCompleted: number;
  labScore: number;
  labTotal: number;
  practiceScore: number;
  profile: CareerProfile;
  projectCompleted: boolean;
  projectScore: number;
  role: string;
  score: number;
  skillScore: number;
  skills: CareerSkillSignal[];
  sprintCompleted: boolean;
  sprintScore: number;
};

type BankCollectionId = 'circuits' | 'power' | 'hardware' | 'signals';
type BankTopicState = 'mastered' | 'new' | 'practiced' | 'review';
type BankTopicFilter = 'all' | BankTopicState;
type LabCatalogProgress = 'complete' | 'new' | 'started';
type LabCatalogFilter = 'all' | LabCatalogProgress;
type PracticePathState = 'continue' | 'locked' | 'strong';
type PracticePathFilter = 'all' | PracticePathState;
type CareerCatalogSort = 'growth' | 'match' | 'name';

type BankCollection = {
  description: string;
  icon: typeof Target;
  id: BankCollectionId;
  label: string;
  skillId: string;
  topics: string[];
};

type BankTopicMastery = {
  accuracy: number;
  attempts: number;
  collectionId: BankCollectionId;
  id: string;
  imageCount: number;
  maxLevel: number;
  minLevel: number;
  questions: number;
  state: BankTopicState;
  topic: string;
};

type CustomSessionConfig = {
  collectionId: BankCollectionId | 'all';
  difficulty: CustomSessionDifficulty;
  length: CustomSessionLength;
  prioritizeReview: boolean;
};

type LearnerProfile = {
  displayName: string;
  email: string;
};

type StoredLearnerState = {
  activeSprint: SprintState | null;
  activityDate: string;
  activityHistory: DailyActivityHistory;
  bookmarkedQuestionIds: string[];
  careerProjectRecords: Record<string, CareerProjectRecord>;
  checkpointBestScore: number;
  checkpointExam: CheckpointExamState | null;
  checkpointExamCompletionCount: number;
  completedBankDiagnosticIds: string[];
  completedFaultCaseIds: string[];
  completedLabMissionIds: string[];
  completedPrompts: number;
  customSessionCompletions: number;
  customSessionConfig: CustomSessionConfig;
  currentQuestionIndex: number;
  dailyGoal: number;
  dailyMissionRewardDate: string | null;
  dailyXp: number;
  earnedXp: number;
  formulaConfidence: Record<string, FormulaConfidence>;
  formulaReadyRewardedIds: string[];
  formulaReviewCompletions: number;
  focusSession: FocusSession | null;
  focusSessionHistory: FocusSessionRecord[];
  highContrastEnabled: boolean;
  labRunHistory: LabRunSnapshot[];
  labSaveCount: number;
  lastSprintSummary: SprintSummary | null;
  learnerProfile: LearnerProfile;
  mistakeRecoveryCompletions: number;
  mistakeReflections: Record<string, MistakeReflection>;
  portfolioFeaturedIds: string[];
  portfolioHeadline: string;
  portfolioNotes: Record<string, string>;
  portfolioPublishCount: number;
  practiceMode: PracticeMode;
  practiceWithHearts: boolean;
  questionMastery: Record<string, QuestionMasteryRecord>;
  readingSize: ReadingSize;
  reducedMotionEnabled: boolean;
  savedCircuitDesigns: CircuitDesign[];
  savedFormulaIds: string[];
  skillProgress: Record<string, number>;
  soundEnabled: boolean;
  studyRoute: StudyRoute | null;
  studyRouteCompletionCount: number;
  tunedCareerRole: string;
  weeklyPlan: WeeklyPlan | null;
  weeklyPlanRewardWeek: string | null;
  workbenchSaveCount: number;
};

type SavedLabState = {
  activeLabId: string;
  values: LabSimulationValues;
};

const AUTH_SESSION_KEY = 'zyloxp-session-v1';
const LEARNER_STORAGE_KEY = 'zyloxp-learner-state-v1';
const SAVED_LAB_STORAGE_KEY = 'zyloxp-saved-lab-v1';
const SAVE_META_STORAGE_KEY = 'zyloxp-save-meta-v1';
const NOTEBOOK_LIBRARY_VIEW_STORAGE_KEY = 'zyloxp-notebook-library-view-v1';
const QUESTION_SCRATCHPAD_STORAGE_KEY = 'zyloxp-question-scratchpads-v1';
const QUESTION_SCRATCHPAD_LIMIT = 600;
const XP_PER_LEVEL = 400;
const SPRINT_LENGTH = 5;
const MAX_SESSION_LENGTH = 10;
const BANK_DIAGNOSTIC_BONUS_XP = 40;
const DAILY_MISSION_REWARD_XP = 75;
const FORMULA_RECALL_XP = 5;
const CIRCUIT_WORKBENCH_XP = 60;
const PORTFOLIO_READY_XP = 90;
const STUDY_ROUTE_XP = 75;
const CHECKPOINT_FIRST_BONUS_XP = 50;
const WEEKLY_PLAN_REWARD_XP = 100;
const REVIEW_INTERVALS_MS = [
  0,
  10 * 60 * 1000,
  24 * 60 * 60 * 1000,
  3 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  14 * 24 * 60 * 60 * 1000,
] as const;

function readQuestionScratchpad(questionId: string) {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const storedScratchpads = JSON.parse(
      window.localStorage.getItem(QUESTION_SCRATCHPAD_STORAGE_KEY) ?? '{}',
    ) as unknown;

    if (!storedScratchpads || typeof storedScratchpads !== 'object') {
      return '';
    }

    const scratchpad = (storedScratchpads as Record<string, unknown>)[questionId];
    return typeof scratchpad === 'string'
      ? scratchpad.slice(0, QUESTION_SCRATCHPAD_LIMIT)
      : '';
  } catch {
    return '';
  }
}

function saveQuestionScratchpad(questionId: string, scratchpad: string) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const parsedScratchpads = JSON.parse(
      window.localStorage.getItem(QUESTION_SCRATCHPAD_STORAGE_KEY) ?? '{}',
    ) as unknown;
    const storedScratchpads =
      parsedScratchpads && typeof parsedScratchpads === 'object'
        ? (parsedScratchpads as Record<string, unknown>)
        : {};
    const nextScratchpads = Object.fromEntries(
      Object.entries({
        ...storedScratchpads,
        [questionId]: scratchpad.slice(0, QUESTION_SCRATCHPAD_LIMIT),
      })
        .filter(([, value]) => typeof value === 'string' && value.trim())
        .slice(-80),
    );

    window.localStorage.setItem(
      QUESTION_SCRATCHPAD_STORAGE_KEY,
      JSON.stringify(nextScratchpads),
    );
  } catch {
    // Scratchpad persistence is optional; the in-memory note remains available.
  }
}

function readStoredNotebookLibraryView(): NotebookLibraryView | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedView = window.localStorage.getItem(
      NOTEBOOK_LIBRARY_VIEW_STORAGE_KEY,
    );

    return storedView === 'study-list' ||
      storedView === 'notes' ||
      storedView === 'formulas' ||
      storedView === 'questions' ||
      storedView === 'bench'
      ? storedView
      : null;
  } catch {
    return null;
  }
}

function getInitialNotebookLibraryView({
  benchRunCount,
  formulaCount,
  noteCount,
  questionCount,
}: {
  benchRunCount: number;
  formulaCount: number;
  noteCount: number;
  questionCount: number;
}): NotebookLibraryView {
  if (noteCount > 0) {
    return 'notes';
  }

  if (formulaCount > 0) {
    return 'formulas';
  }

  if (questionCount > 0) {
    return 'questions';
  }

  return benchRunCount > 0 ? 'bench' : 'notes';
}

const EMPTY_DAILY_ACTIVITY: DailyActivityRecord = {
  careerProjects: 0,
  diagnostics: 0,
  exams: 0,
  focusMinutes: 0,
  labMissions: 0,
  questions: 0,
  sprints: 0,
  xp: 0,
};
const SKILL_TOPIC_PRIORITY: Record<string, string[]> = {
  'voltage-current-resistance': ['DC Circuit Analysis'],
  'circuit-reading': [
    'Network Theorems and Two-Port Networks',
    'Analog Electronics and Op-Amps',
  ],
  'dc-analysis': ['DC Circuit Analysis', 'Power Electronics', 'Power Systems'],
  transients: ['Transient Circuit Analysis'],
  'signals-ac': [
    'AC Phasors and Impedance',
    'Signals and Systems',
    'Control Systems',
  ],
  'digital-logic': ['Digital Logic'],
};
const BANK_COLLECTIONS: BankCollection[] = [
  {
    id: 'circuits',
    label: 'Circuit Foundations',
    description: 'Core networks, fields, transients, and measurement judgment.',
    icon: CircleGauge,
    skillId: 'voltage-current-resistance',
    topics: [
      'DC Circuit Analysis',
      'Network Theorems and Two-Port Networks',
      'Transient Circuit Analysis',
      'Electromagnetics',
      'Measurement and Instrumentation',
    ],
  },
  {
    id: 'power',
    label: 'Power and Energy',
    description: 'AC behavior, machines, conversion, systems, and protection.',
    icon: BatteryCharging,
    skillId: 'signals-ac',
    topics: [
      'AC Phasors and Impedance',
      'Power Systems',
      'Transformers and Electrical Machines',
      'Power Electronics',
      'Electrical Safety and Protection',
    ],
  },
  {
    id: 'hardware',
    label: 'Hardware and Embedded',
    description: 'Devices, logic, analog design, boards, and embedded decisions.',
    icon: BrainCircuit,
    skillId: 'digital-logic',
    topics: [
      'Analog Electronics and Op-Amps',
      'Semiconductor Devices',
      'Digital Logic',
      'PCB Design and Signal Integrity',
      'Embedded Systems',
    ],
  },
  {
    id: 'signals',
    label: 'Signals and RF',
    description: 'Signal models, control, communications, lines, and antennas.',
    icon: Activity,
    skillId: 'signals-ac',
    topics: [
      'Transmission Lines',
      'Signals and Systems',
      'Control Systems',
      'Communications',
      'RF and Antennas',
    ],
  },
];
const BANK_TOPIC_SKILL_IDS: Record<string, string> = {
  'AC Phasors and Impedance': 'signals-ac',
  'Analog Electronics and Op-Amps': 'circuit-reading',
  Communications: 'signals-ac',
  'Control Systems': 'signals-ac',
  'DC Circuit Analysis': 'voltage-current-resistance',
  'Digital Logic': 'digital-logic',
  'Electrical Safety and Protection': 'voltage-current-resistance',
  Electromagnetics: 'signals-ac',
  'Embedded Systems': 'digital-logic',
  'Measurement and Instrumentation': 'circuit-reading',
  'Network Theorems and Two-Port Networks': 'circuit-reading',
  'PCB Design and Signal Integrity': 'circuit-reading',
  'Power Electronics': 'dc-analysis',
  'Power Systems': 'signals-ac',
  'RF and Antennas': 'signals-ac',
  'Semiconductor Devices': 'dc-analysis',
  'Signals and Systems': 'signals-ac',
  'Transient Circuit Analysis': 'transients',
  'Transformers and Electrical Machines': 'signals-ac',
  'Transmission Lines': 'signals-ac',
};
const PRACTICE_MODES: Array<{
  icon: typeof Target;
  id: PracticeMode;
  label: string;
}> = [
  { id: 'path', label: 'Path', icon: Target },
  { id: 'mixed', label: 'Mixed', icon: Shuffle },
  { id: 'review', label: 'Review', icon: RotateCcw },
  { id: 'saved', label: 'Saved', icon: Bookmark },
];
const ANSWER_CONFIDENCE_OPTIONS: Array<{
  icon: typeof CircleHelp;
  id: AnswerConfidence;
  label: string;
}> = [
  { id: 'guess', label: 'Guess', icon: CircleHelp },
  { id: 'unsure', label: 'Unsure', icon: BrainCircuit },
  { id: 'sure', label: 'Sure', icon: ShieldCheck },
];
const CUSTOM_SESSION_DIFFICULTIES: Array<{
  detail: string;
  id: CustomSessionDifficulty;
  label: string;
  range: [number, number] | null;
}> = [
  {
    id: 'all',
    label: 'All levels',
    detail: 'Balanced mix',
    range: null,
  },
  {
    id: 'foundation',
    label: 'Foundation',
    detail: 'Levels 1-8',
    range: [1, 8],
  },
  {
    id: 'applied',
    label: 'Applied',
    detail: 'Levels 9-17',
    range: [9, 17],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    detail: 'Levels 18-25',
    range: [18, 25],
  },
];
const DEFAULT_CUSTOM_SESSION_CONFIG: CustomSessionConfig = {
  collectionId: 'all',
  difficulty: 'all',
  length: 5,
  prioritizeReview: true,
};
const BANK_TOPIC_FILTERS: Array<{
  id: BankTopicFilter;
  label: string;
}> = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'practiced', label: 'Practiced' },
  { id: 'review', label: 'Review' },
  { id: 'mastered', label: 'Mastered' },
];
const LAB_CATALOG_FILTERS: Array<{
  id: LabCatalogFilter;
  label: string;
}> = [
  { id: 'all', label: 'All' },
  { id: 'started', label: 'Started' },
  { id: 'new', label: 'New' },
  { id: 'complete', label: 'Complete' },
];
const PRACTICE_PATH_FILTERS: Array<{
  id: PracticePathFilter;
  label: string;
}> = [
  { id: 'all', label: 'All' },
  { id: 'continue', label: 'Continue' },
  { id: 'strong', label: 'Strong' },
  { id: 'locked', label: 'Locked' },
];
const DEFAULT_LAB_VALUES: LabSimulationValues = {
  adcBitDepth: 10,
  adcFilterCutoff: 3,
  adcInputAmplitude: 1.2,
  adcInputFrequency: 1,
  adcReferenceVoltage: 3.3,
  adcSampleRate: 8,
  bjtBaseCurrent: 20,
  bjtCollectorResistance: 2.2,
  bjtCurrentGain: 90,
  bjtSupplyVoltage: 12,
  bjtTemperature: 25,
  capacitance: 47,
  digitalClockFrequency: 25,
  digitalPropagationDelay: 12,
  digitalSetupTime: 8,
  filterFrequency: 16,
  lineCurrent: 10,
  lineVoltage: 400,
  mosfetBusVoltage: 24,
  mosfetDutyCycle: 50,
  mosfetGateResistance: 10,
  mosfetGateVoltage: 8,
  mosfetLoadResistance: 8,
  mosfetSwitchingFrequency: 50,
  opAmpFeedbackResistance: 50,
  opAmpInputResistance: 10,
  opAmpInputVoltage: 0.2,
  opAmpSupplyVoltage: 12,
  pidDerivativeGain: 0.35,
  pidIntegralGain: 0.6,
  pidPlantTimeConstant: 1.5,
  pidProportionalGain: 1.6,
  pidSetpoint: 60,
  powerFactor: 0.85,
  rcResistance: 10,
  resistance: 10,
  resonanceCapacitance: 2.5,
  resonanceFrequency: 1000,
  resonanceInductance: 10,
  resonanceResistance: 12,
  resonanceSourceVoltage: 5,
  transmissionCharacteristicImpedance: 50,
  transmissionElectricalLength: 90,
  transmissionLoadImpedance: 50,
  transformerCoreArea: 12,
  transformerFrequency: 60,
  transformerLoadResistance: 10,
  transformerPrimaryTurns: 500,
  transformerPrimaryVoltage: 120,
  transformerSecondaryTurns: 105,
  transformerWindingResistance: 0.5,
  voltage: 5,
};
const LAB_VALUE_LIMITS: Record<LabValueKey, [number, number]> = {
  adcBitDepth: [4, 16],
  adcFilterCutoff: [0.2, 12],
  adcInputAmplitude: [0.1, 2.5],
  adcInputFrequency: [0.1, 12],
  adcReferenceVoltage: [1, 5],
  adcSampleRate: [1, 24],
  bjtBaseCurrent: [0, 120],
  bjtCollectorResistance: [0.5, 10],
  bjtCurrentGain: [40, 200],
  bjtSupplyVoltage: [3, 24],
  bjtTemperature: [-20, 100],
  capacitance: [1, 220],
  digitalClockFrequency: [5, 100],
  digitalPropagationDelay: [1, 30],
  digitalSetupTime: [1, 20],
  filterFrequency: [1, 5000],
  lineCurrent: [1, 50],
  lineVoltage: [120, 600],
  mosfetBusVoltage: [6, 60],
  mosfetDutyCycle: [10, 95],
  mosfetGateResistance: [2, 50],
  mosfetGateVoltage: [0, 12],
  mosfetLoadResistance: [2, 30],
  mosfetSwitchingFrequency: [5, 250],
  opAmpFeedbackResistance: [1, 100],
  opAmpInputResistance: [1, 20],
  opAmpInputVoltage: [0.05, 2],
  opAmpSupplyVoltage: [5, 15],
  pidDerivativeGain: [0, 1.2],
  pidIntegralGain: [0, 2],
  pidPlantTimeConstant: [0.5, 3],
  pidProportionalGain: [0.2, 4],
  pidSetpoint: [20, 90],
  powerFactor: [0.5, 1],
  rcResistance: [1, 100],
  resistance: [1, 48],
  resonanceCapacitance: [0.2, 20],
  resonanceFrequency: [100, 5000],
  resonanceInductance: [1, 100],
  resonanceResistance: [2, 100],
  resonanceSourceVoltage: [1, 12],
  transmissionCharacteristicImpedance: [25, 100],
  transmissionElectricalLength: [0, 360],
  transmissionLoadImpedance: [1, 200],
  transformerCoreArea: [4, 30],
  transformerFrequency: [20, 400],
  transformerLoadResistance: [2, 100],
  transformerPrimaryTurns: [100, 1200],
  transformerPrimaryVoltage: [24, 480],
  transformerSecondaryTurns: [20, 1000],
  transformerWindingResistance: [0.05, 5],
  voltage: [1, 24],
};

function normalizeLabValues(values: unknown): LabSimulationValues {
  const storedValues =
    values && typeof values === 'object'
      ? (values as Partial<LabSimulationValues>)
      : {};

  return Object.fromEntries(
    (Object.keys(DEFAULT_LAB_VALUES) as LabValueKey[]).map((key) => {
      const value = storedValues[key];
      const [minimum, maximum] = LAB_VALUE_LIMITS[key];

      return [
        key,
        typeof value === 'number' && Number.isFinite(value)
          ? Math.min(maximum, Math.max(minimum, value))
          : DEFAULT_LAB_VALUES[key],
      ];
    }),
  ) as LabSimulationValues;
}

function formatLabRunOutput(labId: string, values: LabSimulationValues) {
  const {
    adcDisplayedFrequency,
    bjtCollectorCurrent,
    current,
    digitalTimingMargin,
    filterOutput,
    mosfetTotalLoss,
    opAmpOutput,
    pidSettlingTime,
    rcTimeConstant,
    resonanceFrequency,
    threePhasePower,
    transmissionVswr,
    transformerSecondaryVoltage,
  } = calculateLabMetrics(values);

  return labId === 'lab-ohms'
    ? `${current.toFixed(2)} A`
    : labId === 'lab-bjt'
      ? `${bjtCollectorCurrent.toFixed(2)} mA IC`
    : labId === 'lab-rc'
      ? `${rcTimeConstant.toFixed(0)} ms`
      : labId === 'lab-filter'
        ? `${filterOutput.toFixed(2)} V RMS`
        : labId === 'lab-digital'
          ? `${digitalTimingMargin.toFixed(1)} ns`
          : labId === 'lab-opamp'
            ? `${Math.abs(opAmpOutput).toFixed(2)} Vpk`
            : labId === 'lab-mosfet'
              ? `${mosfetTotalLoss.toFixed(2)} W loss`
              : labId === 'lab-pid'
                ? `${pidSettlingTime.toFixed(2)} s settle`
                : labId === 'lab-adc'
                  ? `${adcDisplayedFrequency.toFixed(2)} kHz displayed`
                : labId === 'lab-transmission'
                  ? `${transmissionVswr.toFixed(2)}:1 VSWR`
                : labId === 'lab-transformer'
                  ? `${transformerSecondaryVoltage.toFixed(1)} V RMS`
                  : labId === 'lab-resonance'
                    ? `${resonanceFrequency.toFixed(0)} Hz f₀`
                  : `${threePhasePower.toFixed(2)} kW`;
}

function normalizeLabRunHistory(value: unknown): LabRunSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const validLabIds = new Set(labScenarios.map((lab) => lab.id));
  const runs = value
    .flatMap((storedRun, index) => {
      if (!storedRun || typeof storedRun !== 'object') {
        return [];
      }

      const run = storedRun as Partial<LabRunSnapshot>;
      if (
        typeof run.labId !== 'string' ||
        !validLabIds.has(run.labId) ||
        typeof run.savedAt !== 'number' ||
        !Number.isFinite(run.savedAt) ||
        run.savedAt <= 0 ||
        !run.values ||
        typeof run.values !== 'object'
      ) {
        return [];
      }

      const values = normalizeLabValues(run.values);
      const savedAt = Math.min(Date.now() + 86_400_000, run.savedAt);

      return [
        {
          id:
            typeof run.id === 'string' && run.id.trim().length > 0
              ? run.id.slice(0, 100)
              : `${run.labId}-${savedAt}-${index}`,
          labId: run.labId,
          output: formatLabRunOutput(run.labId, values),
          savedAt,
          values,
        },
      ];
    })
    .sort((first, second) => second.savedAt - first.savedAt);
  const labCounts = new Map<string, number>();
  const seenIds = new Set<string>();

  return runs
    .filter((run) => {
      const count = labCounts.get(run.labId) ?? 0;
      if (count >= 8 || seenIds.has(run.id)) {
        return false;
      }

      labCounts.set(run.labId, count + 1);
      seenIds.add(run.id);
      return true;
    })
    .slice(0, 24);
}

const LAB_MISSIONS: LabMission[] = [
  {
    id: 'ohms-sensor-loop',
    labId: 'lab-ohms',
    title: 'Sensor loop',
    brief: 'Tune the series loop until the ammeter reads 0.50 A.',
    target: 0.5,
    tolerance: 0.01,
    decimals: 2,
    unit: 'A',
    xp: 25,
  },
  {
    id: 'ohms-bench-load',
    labId: 'lab-ohms',
    title: 'Bench load',
    brief: 'Calibrate the branch for a stable 1.50 A current.',
    target: 1.5,
    tolerance: 0.02,
    decimals: 2,
    unit: 'A',
    xp: 30,
  },
  {
    id: 'ohms-safe-bias',
    labId: 'lab-ohms',
    title: 'Safe bias',
    brief: 'Reduce the current to a component-safe 0.25 A.',
    target: 0.25,
    tolerance: 0.01,
    decimals: 2,
    unit: 'A',
    xp: 35,
  },
  {
    id: 'rc-switch-delay',
    labId: 'lab-rc',
    title: 'Switch delay',
    brief: 'Build an RC network with a 470 ms time constant.',
    target: 470,
    tolerance: 5,
    decimals: 0,
    unit: 'ms',
    xp: 25,
  },
  {
    id: 'rc-one-second',
    labId: 'lab-rc',
    title: 'One-second timer',
    brief: 'Tune the network to a 1,000 ms time constant.',
    target: 1000,
    tolerance: 10,
    decimals: 0,
    unit: 'ms',
    xp: 30,
  },
  {
    id: 'rc-soft-start',
    labId: 'lab-rc',
    title: 'Soft start',
    brief: 'Create a slower 2,200 ms startup response.',
    target: 2200,
    tolerance: 20,
    decimals: 0,
    unit: 'ms',
    xp: 35,
  },
  {
    id: 'resonance-if-center',
    labId: 'lab-resonance',
    title: 'IF center frequency',
    brief:
      'Select the inductor and capacitor that center the resonator at 1,000 Hz.',
    target: 1000,
    tolerance: 10,
    decimals: 0,
    unit: 'Hz',
    xp: 30,
  },
  {
    id: 'resonance-tone-select',
    labId: 'lab-resonance',
    title: 'Tone selector',
    brief:
      'Move the series response peak to 2,000 Hz for the target tone.',
    target: 2000,
    tolerance: 20,
    decimals: 0,
    unit: 'Hz',
    xp: 35,
  },
  {
    id: 'resonance-machine-notch',
    labId: 'lab-resonance',
    title: 'Machine harmonic',
    brief:
      'Tune the resonator to the measured 500 Hz machine harmonic.',
    target: 500,
    tolerance: 8,
    decimals: 0,
    unit: 'Hz',
    xp: 40,
  },
  {
    id: 'filter-noise-rejection',
    labId: 'lab-filter',
    title: 'Noise rejection',
    brief: 'Attenuate the 16 Hz test signal until the output is 0.11 V RMS.',
    target: 0.11,
    tolerance: 0.02,
    decimals: 2,
    unit: 'V RMS',
    xp: 30,
  },
  {
    id: 'filter-cutoff',
    labId: 'lab-filter',
    title: 'Cutoff calibration',
    brief: 'Move the source to the -3 dB point at 3.54 V RMS.',
    target: 3.54,
    tolerance: 0.05,
    decimals: 2,
    unit: 'V RMS',
    xp: 35,
  },
  {
    id: 'filter-passband',
    labId: 'lab-filter',
    title: 'Passband check',
    brief: 'Preserve the signal with a 4.90 V RMS output.',
    target: 4.9,
    tolerance: 0.05,
    decimals: 2,
    unit: 'V RMS',
    xp: 40,
  },
  {
    id: 'digital-safe-capture',
    labId: 'lab-digital',
    title: 'Safe capture',
    brief: 'Build a comfortable synchronous path with 20.0 ns of setup margin.',
    target: 20,
    tolerance: 0.5,
    decimals: 1,
    unit: 'ns',
    xp: 30,
  },
  {
    id: 'digital-fast-bus',
    labId: 'lab-digital',
    title: 'Fast peripheral bus',
    brief: 'Raise the clock while preserving 8.0 ns of setup margin.',
    target: 8,
    tolerance: 0.5,
    decimals: 1,
    unit: 'ns',
    xp: 35,
  },
  {
    id: 'digital-edge-budget',
    labId: 'lab-digital',
    title: 'Edge budget',
    brief: 'Tune the path close to its limit with 2.0 ns of positive margin.',
    target: 2,
    tolerance: 0.25,
    decimals: 1,
    unit: 'ns',
    xp: 40,
  },
  {
    id: 'opamp-unity-output',
    labId: 'lab-opamp',
    title: 'Sensor preamp',
    brief: 'Set the inverting amplifier for a 1.00 Vpk output.',
    target: 1,
    tolerance: 0.05,
    decimals: 2,
    unit: 'Vpk',
    xp: 30,
  },
  {
    id: 'opamp-precision-gain',
    labId: 'lab-opamp',
    title: 'Precision gain',
    brief: 'Raise the signal to 2.50 Vpk while keeping the waveform clean.',
    target: 2.5,
    tolerance: 0.05,
    decimals: 2,
    unit: 'Vpk',
    xp: 35,
  },
  {
    id: 'opamp-output-headroom',
    labId: 'lab-opamp',
    title: 'Output headroom',
    brief: 'Deliver an 8.00 Vpk output without touching either supply limit.',
    target: 8,
    tolerance: 0.1,
    decimals: 2,
    unit: 'Vpk',
    xp: 40,
  },
  {
    id: 'bjt-sensor-bias',
    labId: 'lab-bjt',
    title: 'Sensor preamplifier',
    brief:
      'Bias the NPN stage at 1.80 mA while keeping it in the forward-active region.',
    target: 1.8,
    tolerance: 0.03,
    decimals: 2,
    unit: 'mA',
    xp: 30,
  },
  {
    id: 'bjt-led-sink',
    labId: 'lab-bjt',
    title: 'Indicator current sink',
    brief:
      'Set a 3.00 mA collector current without collapsing VCE into saturation.',
    target: 3,
    tolerance: 0.05,
    decimals: 2,
    unit: 'mA',
    xp: 35,
  },
  {
    id: 'bjt-line-driver',
    labId: 'lab-bjt',
    title: 'Line-driver bias',
    brief:
      'Commission a 4.50 mA quiescent point and preserve collector headroom.',
    target: 4.5,
    tolerance: 0.06,
    decimals: 2,
    unit: 'mA',
    xp: 40,
  },
  {
    id: 'mosfet-baseline-loss',
    labId: 'lab-mosfet',
    title: 'Baseline driver',
    brief: 'Tune the low-side switch to a measured 0.32 W total device loss.',
    target: 0.32,
    tolerance: 0.03,
    decimals: 2,
    unit: 'W',
    xp: 30,
  },
  {
    id: 'mosfet-high-frequency',
    labId: 'lab-mosfet',
    title: 'High-frequency converter',
    brief: 'Expose the switching penalty by reaching a 0.83 W device loss.',
    target: 0.83,
    tolerance: 0.04,
    decimals: 2,
    unit: 'W',
    xp: 35,
  },
  {
    id: 'mosfet-fast-drive',
    labId: 'lab-mosfet',
    title: 'Fast gate drive',
    brief: 'Strengthen the gate drive until total loss falls to 0.17 W.',
    target: 0.17,
    tolerance: 0.02,
    decimals: 2,
    unit: 'W',
    xp: 40,
  },
  {
    id: 'pid-balanced-loop',
    labId: 'lab-pid',
    title: 'Balanced position loop',
    brief: 'Tune the servo for a 3.27 s settling time with controlled overshoot.',
    target: 3.27,
    tolerance: 0.08,
    decimals: 2,
    unit: 's',
    xp: 30,
  },
  {
    id: 'pid-fast-axis',
    labId: 'lab-pid',
    title: 'Fast pick-and-place axis',
    brief: 'Increase loop bandwidth until the response settles in 2.01 s.',
    target: 2.01,
    tolerance: 0.08,
    decimals: 2,
    unit: 's',
    xp: 35,
  },
  {
    id: 'pid-low-overshoot',
    labId: 'lab-pid',
    title: 'Low-overshoot camera stage',
    brief: 'Damp the response to a measured 2.82 s settling time.',
    target: 2.82,
    tolerance: 0.08,
    decimals: 2,
    unit: 's',
    xp: 40,
  },
  {
    id: 'adc-clean-capture',
    labId: 'lab-adc',
    title: 'Clean sensor capture',
    brief:
      'Set up a Nyquist-safe acquisition that displays the 1.00 kHz input tone correctly.',
    target: 1,
    tolerance: 0.02,
    decimals: 2,
    unit: 'kHz',
    xp: 30,
  },
  {
    id: 'adc-alias-demonstration',
    labId: 'lab-adc',
    title: 'Controlled alias',
    brief:
      'Fold a high-frequency input into a measured 1.50 kHz false tone.',
    target: 1.5,
    tolerance: 0.02,
    decimals: 2,
    unit: 'kHz',
    xp: 35,
  },
  {
    id: 'adc-second-zone',
    labId: 'lab-adc',
    title: 'Second-zone capture',
    brief:
      'Tune the source and sample clock until the analyzer displays a 2.00 kHz component.',
    target: 2,
    tolerance: 0.02,
    decimals: 2,
    unit: 'kHz',
    xp: 40,
  },
  {
    id: 'transmission-match',
    labId: 'lab-transmission',
    title: 'Perfect termination',
    brief: 'Match the line and load for a 1.00:1 standing-wave ratio.',
    target: 1,
    tolerance: 0.02,
    decimals: 2,
    unit: 'VSWR',
    xp: 30,
  },
  {
    id: 'transmission-two-to-one',
    labId: 'lab-transmission',
    title: 'Controlled mismatch',
    brief: 'Create and measure a repeatable 2.00:1 standing-wave ratio.',
    target: 2,
    tolerance: 0.03,
    decimals: 2,
    unit: 'VSWR',
    xp: 35,
  },
  {
    id: 'transmission-four-to-one',
    labId: 'lab-transmission',
    title: 'Severe mismatch',
    brief: 'Tune the termination to a 4.00:1 standing-wave ratio.',
    target: 4,
    tolerance: 0.05,
    decimals: 2,
    unit: 'VSWR',
    xp: 40,
  },
  {
    id: 'transformer-controls-supply',
    labId: 'lab-transformer',
    title: '24 V controls supply',
    brief:
      'Select the winding ratio that delivers 24.0 V RMS to the loaded control circuit.',
    target: 24,
    tolerance: 0.25,
    decimals: 1,
    unit: 'V RMS',
    xp: 30,
  },
  {
    id: 'transformer-gate-drive-supply',
    labId: 'lab-transformer',
    title: '48 V isolated supply',
    brief:
      'Raise the secondary turns to deliver 48.0 V RMS without over-fluxing the core.',
    target: 48,
    tolerance: 0.4,
    decimals: 1,
    unit: 'V RMS',
    xp: 35,
  },
  {
    id: 'transformer-service-secondary',
    labId: 'lab-transformer',
    title: '120 V service secondary',
    brief:
      'Commission a 120.0 V RMS loaded secondary and preserve useful regulation.',
    target: 120,
    tolerance: 0.8,
    decimals: 1,
    unit: 'V RMS',
    xp: 40,
  },
  {
    id: 'power-shop-floor',
    labId: 'lab-power',
    title: 'Shop floor',
    brief: 'Balance the load at 5.89 kW of real power.',
    target: 5.89,
    tolerance: 0.06,
    decimals: 2,
    unit: 'kW',
    xp: 25,
  },
  {
    id: 'power-motor-bank',
    labId: 'lab-power',
    title: 'Motor bank',
    brief: 'Deliver 14.96 kW to the three-phase motor bank.',
    target: 14.96,
    tolerance: 0.08,
    decimals: 2,
    unit: 'kW',
    xp: 30,
  },
  {
    id: 'power-plant-load',
    labId: 'lab-power',
    title: 'Plant load',
    brief: 'Tune the feeder for 29.62 kW of real power.',
    target: 29.62,
    tolerance: 0.1,
    decimals: 2,
    unit: 'kW',
    xp: 35,
  },
];
const LAB_FAULT_CASES: LabFaultCase[] = [
  {
    id: 'ohms-open-load',
    labId: 'lab-ohms',
    title: 'Open load',
    symptom: 'The source is powered, but branch current remains at 0.00 A.',
    observedOutput: '0.00 A',
    safetyNote: 'De-energize the loop before measuring resistance across the load.',
    xp: 35,
    correctDiagnosisId: 'open-resistor',
    measurements: [
      {
        id: 'source-terminals',
        label: 'Source terminals',
        mode: 'V DC',
        reading: '7.00 V',
        note: 'The source holds its rated voltage while the branch draws no current.',
      },
      {
        id: 'across-load',
        label: 'Across resistor',
        mode: 'V DC',
        reading: '7.00 V',
        note: 'The full source voltage appears across the interrupted load path.',
      },
      {
        id: 'isolated-load',
        label: 'Resistor isolated',
        mode: 'Ω',
        reading: 'OL',
        note: 'The isolated component has no measurable conductive path.',
      },
    ],
    diagnoses: [
      {
        id: 'open-resistor',
        label: 'Open load resistor',
        detail: 'A broken resistive path prevents all branch current.',
      },
      {
        id: 'shorted-load',
        label: 'Shorted load resistor',
        detail: 'A short would force excessive current instead of zero current.',
      },
      {
        id: 'reversed-meter',
        label: 'Reversed ammeter leads',
        detail: 'Reversed leads change polarity, not the magnitude to zero.',
      },
    ],
    explanation:
      'Rated source voltage plus an OL resistance reading identifies an open load. With no closed path, Ohm’s law predicts zero current.',
  },
  {
    id: 'ohms-source-sag',
    labId: 'lab-ohms',
    title: 'Source sag',
    symptom: 'A 10 Ω load should draw about 0.50 A, but the meter settles at 0.31 A.',
    observedOutput: '0.31 A',
    safetyNote: 'Measure loaded voltage in parallel; never place an ammeter across the source.',
    xp: 40,
    correctDiagnosisId: 'source-resistance',
    measurements: [
      {
        id: 'source-open-circuit',
        label: 'Source, no load',
        mode: 'V DC',
        reading: '5.02 V',
        note: 'The source looks healthy until current is requested.',
      },
      {
        id: 'source-loaded',
        label: 'Source, loaded',
        mode: 'V DC',
        reading: '3.12 V',
        note: 'Terminal voltage collapses when the 10 Ω branch is connected.',
      },
      {
        id: 'load-resistance',
        label: 'Load isolated',
        mode: 'Ω',
        reading: '10.1 Ω',
        note: 'The load value is within tolerance.',
      },
    ],
    diagnoses: [
      {
        id: 'source-resistance',
        label: 'Excessive source resistance',
        detail: 'Internal or lead resistance causes voltage to sag under load.',
      },
      {
        id: 'load-drift',
        label: 'Load drifted high',
        detail: 'The isolated resistance reading does not support this fault.',
      },
      {
        id: 'ammeter-short',
        label: 'Ammeter is shorted',
        detail: 'A shorted meter path would raise current and create a safety hazard.',
      },
    ],
    explanation:
      'A normal open-circuit voltage and a large loaded-voltage drop point to source or lead resistance. The load itself still measures 10.1 Ω.',
  },
  {
    id: 'rc-open-capacitor',
    labId: 'lab-rc',
    title: 'No charge curve',
    symptom: 'The output follows the input step immediately with no visible exponential rise.',
    observedOutput: '~0 ms',
    safetyNote: 'Disconnect power and verify the capacitor is discharged before capacitance testing.',
    xp: 35,
    correctDiagnosisId: 'open-capacitor',
    measurements: [
      {
        id: 'input-step',
        label: 'Input step',
        mode: 'V DC',
        reading: '5.00 V',
        note: 'The source step is present and stable.',
      },
      {
        id: 'output-delay',
        label: 'Output delay',
        mode: 'TIME',
        reading: '<1 ms',
        note: 'The output node changes essentially at the same time as the input.',
      },
      {
        id: 'capacitance-test',
        label: 'Capacitor isolated',
        mode: 'CAP',
        reading: '0.0 nF',
        note: 'The meter cannot detect the expected 47 µF element.',
      },
    ],
    diagnoses: [
      {
        id: 'open-capacitor',
        label: 'Open capacitor',
        detail: 'The timing element is disconnected from the circuit.',
      },
      {
        id: 'shorted-capacitor',
        label: 'Shorted capacitor',
        detail: 'A short would clamp the output node instead of passing the step.',
      },
      {
        id: 'high-resistance',
        label: 'Resistor drifted high',
        detail: 'A larger resistance would slow the response rather than remove it.',
      },
    ],
    explanation:
      'An immediate output step and zero measured capacitance mean the capacitor is no longer participating in the network, so the RC time constant collapses.',
  },
  {
    id: 'rc-leakage',
    labId: 'lab-rc',
    title: 'Leaky timing node',
    symptom: 'The response is too fast and stops below the expected final voltage.',
    observedOutput: '118 ms',
    safetyNote: 'Discharge the capacitor before checking resistance or capacitance.',
    xp: 40,
    correctDiagnosisId: 'leaky-capacitor',
    measurements: [
      {
        id: 'capacitance-value',
        label: 'Capacitance',
        mode: 'CAP',
        reading: '47.1 µF',
        note: 'The small-signal capacitance value appears normal.',
      },
      {
        id: 'dc-leakage',
        label: 'Across capacitor',
        mode: 'Ω',
        reading: '3.3 kΩ',
        note: 'A healthy timing capacitor should not show this low steady DC resistance.',
      },
      {
        id: 'final-voltage',
        label: 'Final output',
        mode: 'V DC',
        reading: '3.64 V',
        note: 'The leakage path forms a divider and prevents a full 5 V charge.',
      },
    ],
    diagnoses: [
      {
        id: 'leaky-capacitor',
        label: 'Capacitor leakage',
        detail: 'A parallel leakage path shortens the effective time constant.',
      },
      {
        id: 'open-resistor',
        label: 'Open timing resistor',
        detail: 'An open resistor would prevent the capacitor from charging.',
      },
      {
        id: 'source-overvoltage',
        label: 'Source overvoltage',
        detail: 'The final output is low, not above its expected value.',
      },
    ],
    explanation:
      'Normal capacitance with low DC resistance reveals leakage. That parallel path lowers the effective resistance and creates a reduced final voltage.',
  },
  {
    id: 'resonance-low-damping',
    labId: 'lab-resonance',
    title: 'Overheated resonator',
    symptom:
      'The current peak is much sharper and higher than the approved sweep, and both reactive components run hot near center frequency.',
    observedOutput: '2.38 A peak · Q 30.1',
    safetyNote:
      'Reduce source amplitude before dwelling at resonance; reactive component voltage can exceed the source voltage by Q times.',
    xp: 45,
    correctDiagnosisId: 'resonance-damping-short',
    measurements: [
      {
        id: 'resonance-source-check',
        label: 'Source output',
        mode: 'V RMS',
        reading: '5.00 V',
        note: 'The generator amplitude remains at the approved test level.',
      },
      {
        id: 'resonance-series-resistance',
        label: 'Series path',
        mode: 'OHM',
        reading: '2.1 Ω',
        note: 'The commissioned fixture should present approximately 12 Ω of total series damping.',
      },
      {
        id: 'resonance-sweep-peak',
        label: 'Analyzer peak',
        mode: 'I / Q',
        reading: '2.38 A · 30.1',
        note: 'The narrow peak and large current are consistent with very low damping.',
      },
    ],
    diagnoses: [
      {
        id: 'resonance-damping-short',
        label: 'Damping resistor bypassed',
        detail:
          'A short across the damping resistor lowers series loss, raises Q, and increases resonant current.',
      },
      {
        id: 'resonance-cap-open',
        label: 'Capacitor open circuit',
        detail:
          'An open capacitor would interrupt the series current instead of creating a sharp peak.',
      },
      {
        id: 'resonance-analyzer-scale',
        label: 'Analyzer scaling error',
        detail:
          'The independently measured 2.1 Ω series path confirms a physical circuit change.',
      },
    ],
    explanation:
      'A healthy source with unexpectedly low series resistance explains both the high-Q response and the excessive current. The damping resistor has been electrically bypassed.',
  },
  {
    id: 'resonance-cap-drift',
    labId: 'lab-resonance',
    title: 'Center frequency shifted low',
    symptom:
      'A resonator commissioned for 1.00 kHz now peaks at 886 Hz after extended service.',
    observedOutput: '886 Hz center',
    safetyNote:
      'Isolate and discharge the capacitor before using capacitance mode.',
    xp: 45,
    correctDiagnosisId: 'resonance-capacitance-increase',
    measurements: [
      {
        id: 'resonance-inductor-check',
        label: 'Inductor isolated',
        mode: 'LCR',
        reading: '10.0 mH',
        note: 'The inductance remains at its nominal value.',
      },
      {
        id: 'resonance-capacitor-check',
        label: 'Capacitor isolated',
        mode: 'CAP',
        reading: '3.22 µF',
        note: 'The installed part was specified as 2.50 µF.',
      },
      {
        id: 'resonance-vna-center',
        label: 'Sweep center',
        mode: 'FREQ',
        reading: '886 Hz',
        note: 'The lower center frequency is repeatable at reduced source level.',
      },
    ],
    diagnoses: [
      {
        id: 'resonance-capacitance-increase',
        label: 'Capacitance drifted high',
        detail:
          'Increasing capacitance lowers f0 while leaving the measured inductance unchanged.',
      },
      {
        id: 'resonance-inductor-short',
        label: 'Inductor shorted turn',
        detail:
          'The isolated inductance measurement is still at its nominal value.',
      },
      {
        id: 'resonance-source-calibration',
        label: 'Source amplitude miscalibrated',
        detail:
          'Amplitude changes the current level in this linear model, not its center frequency.',
      },
    ],
    explanation:
      'The measured capacitance increased while the inductor stayed nominal. Because resonance varies with the inverse square root of LC, the larger capacitor shifts the center frequency down to approximately 886 Hz.',
  },
  {
    id: 'filter-open-capacitor',
    labId: 'lab-filter',
    title: 'Noise passes unchanged',
    symptom:
      'A 1 kHz interference tone appears at the output with almost the same amplitude as the input.',
    observedOutput: '4.96 V RMS',
    safetyNote:
      'Remove power and discharge the capacitor before measuring component values.',
    xp: 40,
    correctDiagnosisId: 'open-filter-capacitor',
    measurements: [
      {
        id: 'filter-input',
        label: 'Input, CH1',
        mode: 'V RMS',
        reading: '5.00 V',
        note: 'The function generator delivers the expected test amplitude.',
      },
      {
        id: 'filter-output',
        label: 'Output, CH2',
        mode: 'V RMS',
        reading: '4.96 V',
        note: 'The high-frequency signal is not being shunted away from the output.',
      },
      {
        id: 'filter-capacitance',
        label: 'Capacitor isolated',
        mode: 'CAP',
        reading: '0.0 nF',
        note: 'The meter cannot detect a connected capacitive element.',
      },
    ],
    diagnoses: [
      {
        id: 'open-filter-capacitor',
        label: 'Open shunt capacitor',
        detail: 'Without the shunt path, the output follows the input at every frequency.',
      },
      {
        id: 'shorted-filter-capacitor',
        label: 'Shorted shunt capacitor',
        detail: 'A short would clamp the output close to zero instead of passing the tone.',
      },
      {
        id: 'resistor-drifted-high',
        label: 'Series resistor drifted high',
        detail: 'More series resistance would increase attenuation rather than remove it.',
      },
    ],
    explanation:
      'A normal input, nearly identical high-frequency output, and zero measured capacitance identify an open capacitor. The intended low-impedance path to ground is missing.',
  },
  {
    id: 'filter-scope-loading',
    labId: 'lab-filter',
    title: 'Scope collapses the output',
    symptom:
      'The passband output drops only when the oscilloscope is connected.',
    observedOutput: '0.24 V RMS',
    safetyNote:
      'Verify the instrument input mode before probing and connect grounds only to the circuit reference node.',
    xp: 45,
    correctDiagnosisId: 'scope-termination',
    measurements: [
      {
        id: 'generator-output',
        label: 'Generator output',
        mode: 'V RMS',
        reading: '4.99 V',
        note: 'The source remains stable while the filter is connected.',
      },
      {
        id: 'output-high-z',
        label: 'Output, 1 MΩ DMM',
        mode: 'V RMS',
        reading: '4.87 V',
        note: 'A high-impedance instrument sees the expected passband level.',
      },
      {
        id: 'scope-input-mode',
        label: 'Scope input',
        mode: 'Ω',
        reading: '50 Ω',
        note: 'The channel is terminated for RF work instead of high-impedance probing.',
      },
    ],
    diagnoses: [
      {
        id: 'scope-termination',
        label: 'Incorrect 50 Ω scope termination',
        detail: 'The instrument loads the filter output and changes the circuit being measured.',
      },
      {
        id: 'generator-clipping',
        label: 'Function generator clipping',
        detail: 'The generator output remains at the expected amplitude.',
      },
      {
        id: 'open-series-resistor',
        label: 'Open series resistor',
        detail: 'The high-impedance DMM would also show a missing output path.',
      },
    ],
    explanation:
      'The output is correct with a high-impedance meter and collapses only with the scope attached. A 50 Ω termination heavily loads the RC node, so the measurement instrument becomes part of the circuit.',
  },
  {
    id: 'digital-setup-violation',
    labId: 'lab-digital',
    title: 'Intermittent missed capture',
    symptom:
      'The receiver occasionally captures the previous data bit when the interface runs at 80 MHz.',
    observedOutput: '−0.7 ns margin',
    safetyNote:
      'Use a high-impedance logic probe and connect its ground to the board reference before touching signal pins.',
    xp: 40,
    correctDiagnosisId: 'insufficient-setup-margin',
    measurements: [
      {
        id: 'digital-clock-period',
        label: 'Clock period',
        mode: 'TIME',
        reading: '12.5 ns',
        note: 'The 80 MHz clock period is stable at the receiver.',
      },
      {
        id: 'digital-data-arrival',
        label: 'Data arrival',
        mode: 'DELAY',
        reading: '9.2 ns',
        note: 'Board and source delay consume most of the available cycle.',
      },
      {
        id: 'digital-setup-requirement',
        label: 'Receiver setup',
        mode: 'SPEC',
        reading: '4.0 ns',
        note: 'The data path needs 13.2 ns total, which exceeds the 12.5 ns period.',
      },
    ],
    diagnoses: [
      {
        id: 'insufficient-setup-margin',
        label: 'Setup timing violation',
        detail: 'Data becomes valid too late for the receiver setup requirement.',
      },
      {
        id: 'stuck-data-line',
        label: 'Stuck data line',
        detail: 'A stuck line would fail consistently instead of near specific clock edges.',
      },
      {
        id: 'clock-divider-error',
        label: 'Clock divider error',
        detail: 'The measured clock is stable at the intended 80 MHz rate.',
      },
    ],
    explanation:
      'The 9.2 ns path delay plus 4.0 ns setup time requires 13.2 ns, but the clock provides only 12.5 ns. The negative margin explains the intermittent previous-bit capture.',
  },
  {
    id: 'digital-clock-ringing',
    labId: 'lab-digital',
    title: 'Double clock edge',
    symptom:
      'One transmitted edge occasionally produces two counter increments at the receiving device.',
    observedOutput: '2 threshold crossings',
    safetyNote:
      'Use the shortest probe ground connection available so the measurement does not add ringing of its own.',
    xp: 45,
    correctDiagnosisId: 'unterminated-clock-trace',
    measurements: [
      {
        id: 'digital-source-clock',
        label: 'Clock at source',
        mode: 'V',
        reading: '0.1–3.3 V clean',
        note: 'The driver output has one transition and no extra threshold crossing.',
      },
      {
        id: 'digital-receiver-clock',
        label: 'Clock at receiver',
        mode: 'V',
        reading: '−0.8–4.6 V',
        note: 'Overshoot and ringing cross the input threshold twice.',
      },
      {
        id: 'digital-series-termination',
        label: 'Source termination',
        mode: 'Ω',
        reading: '0 Ω',
        note: 'No damping resistor is fitted on the long point-to-point clock trace.',
      },
    ],
    diagnoses: [
      {
        id: 'unterminated-clock-trace',
        label: 'Unterminated clock trace',
        detail: 'A fast edge reflects from the receiver and creates another threshold crossing.',
      },
      {
        id: 'slow-data-path',
        label: 'Excessive data delay',
        detail: 'Data delay can corrupt a bit, but it does not create a second clock edge.',
      },
      {
        id: 'incorrect-logic-level',
        label: 'Incorrect logic supply',
        detail: 'The source levels are correct and the abnormal voltage appears only after the trace.',
      },
    ],
    explanation:
      'A clean source edge, severe receiver overshoot, and zero source resistance point to an undamped transmission-line reflection. The reflected waveform crosses the clock threshold a second time.',
  },
  {
    id: 'opamp-open-feedback',
    labId: 'lab-opamp',
    title: 'Output stuck at the rail',
    symptom:
      'A small centered sine input produces a nearly constant positive output instead of an inverted waveform.',
    observedOutput: '+10.4 V DC',
    safetyNote:
      'Power down both supply rails before measuring resistance through the feedback path.',
    xp: 40,
    correctDiagnosisId: 'open-feedback-resistor',
    measurements: [
      {
        id: 'opamp-supply-rails',
        label: 'Supply rails',
        mode: 'V DC',
        reading: '+12.0 / -12.0 V',
        note: 'Both amplifier supply rails are present and balanced.',
      },
      {
        id: 'opamp-output-dc',
        label: 'Output node',
        mode: 'V DC',
        reading: '+10.4 V',
        note: 'The output sits close to the positive swing limit with no closed-loop correction.',
      },
      {
        id: 'opamp-feedback-path',
        label: 'Feedback resistor',
        mode: 'OHM',
        reading: 'OL',
        note: 'The expected 50 kOhm path from output to the inverting input is open.',
      },
    ],
    diagnoses: [
      {
        id: 'open-feedback-resistor',
        label: 'Open feedback resistor',
        detail: 'The op-amp has lost negative feedback and behaves like a high-gain comparator.',
      },
      {
        id: 'shorted-output-load',
        label: 'Shorted output load',
        detail: 'A short would pull the output toward zero and raise output current.',
      },
      {
        id: 'missing-negative-rail',
        label: 'Missing negative supply rail',
        detail: 'The measured negative rail is present at its expected voltage.',
      },
    ],
    explanation:
      'Healthy supply rails, a saturated output, and an open feedback measurement identify a broken negative-feedback path. Without feedback, tiny input offset drives the op-amp to a rail.',
  },
  {
    id: 'opamp-output-clipping',
    labId: 'lab-opamp',
    title: 'Flattened sine peaks',
    symptom:
      'The amplifier output follows the expected phase but both waveform peaks flatten as gain is increased.',
    observedOutput: '3.5 Vpk clipped',
    safetyNote:
      'Verify probe attenuation and common ground before comparing the input and output channels.',
    xp: 45,
    correctDiagnosisId: 'insufficient-output-swing',
    measurements: [
      {
        id: 'opamp-input-signal',
        label: 'Input, CH1',
        mode: 'V PK',
        reading: '0.50 V clean',
        note: 'The source remains sinusoidal and well inside the input range.',
      },
      {
        id: 'opamp-closed-loop-gain',
        label: 'Resistor ratio',
        mode: 'V/V',
        reading: '-10.0',
        note: 'The resistor network asks for a 5.0 Vpk inverted output.',
      },
      {
        id: 'opamp-output-swing',
        label: 'Output, CH2',
        mode: 'V PK',
        reading: '3.5 V plateau',
        note: 'With +/-5 V rails, this device can swing only about 3.5 V from ground.',
      },
    ],
    diagnoses: [
      {
        id: 'insufficient-output-swing',
        label: 'Output swing limit',
        detail: 'The requested amplitude exceeds the op-amp headroom from its supply rails.',
      },
      {
        id: 'slew-rate-limit',
        label: 'Slew-rate limiting',
        detail: 'Slew limiting creates sloped or triangular edges rather than flat voltage plateaus.',
      },
      {
        id: 'high-frequency-oscillation',
        label: 'High-frequency oscillation',
        detail: 'The measured distortion is a repeatable rail plateau, not a superimposed oscillation.',
      },
    ],
    explanation:
      'The resistor ratio requests 5.0 Vpk, but the measured device can produce only about 3.5 Vpk on +/-5 V rails. Symmetric flat peaks are the signature of output swing clipping.',
  },
  {
    id: 'bjt-load-line-saturation',
    labId: 'lab-bjt',
    title: 'Collector pinned low',
    symptom:
      'Increasing base drive no longer raises collector current, and the collector output remains close to ground.',
    observedOutput: '5.37 mA · 0.18 V VCE',
    safetyNote:
      'Limit base current before changing the collector load, and verify transistor power before holding a saturated test point.',
    xp: 40,
    correctDiagnosisId: 'bjt-overbiased-saturation',
    measurements: [
      {
        id: 'bjt-saturation-supply',
        label: 'Collector supply',
        mode: 'V DC',
        reading: '12.0 V',
        note: 'The collector rail remains at its nominal value.',
      },
      {
        id: 'bjt-saturation-base',
        label: 'Base current',
        mode: 'µA DC',
        reading: '100 µA',
        note: 'With beta near 90, the base drive requests about 9 mA of collector current.',
      },
      {
        id: 'bjt-saturation-vce',
        label: 'Collector-emitter',
        mode: 'V DC',
        reading: '0.18 V',
        note: 'The collector resistor limits current before the requested beta current can flow.',
      },
    ],
    diagnoses: [
      {
        id: 'bjt-overbiased-saturation',
        label: 'Transistor driven into saturation',
        detail:
          'The requested collector current exceeds the load-line limit, so VCE collapses to its saturation voltage.',
      },
      {
        id: 'bjt-low-current-gain',
        label: 'Current gain too low',
        detail:
          'Low beta would reduce collector current while leaving more collector voltage, not pin VCE at 0.18 V.',
      },
      {
        id: 'bjt-open-emitter',
        label: 'Open emitter connection',
        detail:
          'An open emitter would force collector current to zero.',
      },
    ],
    explanation:
      'The base drive requests about 9 mA, but a 12 V supply and 2.2 kΩ collector resistor can provide only about 5.37 mA above VCE(sat). The operating point is therefore fixed at the end of the load line.',
  },
  {
    id: 'bjt-thermal-bias-drift',
    labId: 'lab-bjt',
    title: 'Warm-up current drift',
    symptom:
      'Collector current is correct at room temperature but rises steadily as the enclosure warms.',
    observedOutput: '1.80 mA → 2.18 mA',
    safetyNote:
      'Reduce collector power before applying external heat, and monitor junction temperature during the test.',
    xp: 45,
    correctDiagnosisId: 'bjt-uncompensated-bias',
    measurements: [
      {
        id: 'bjt-drift-base-current',
        label: 'Base current',
        mode: 'µA DC',
        reading: '20.0 µA stable',
        note: 'The external bias source does not change as temperature rises.',
      },
      {
        id: 'bjt-drift-beta',
        label: 'Curve-tracer beta',
        mode: 'hFE',
        reading: '90 → 109',
        note: 'The device current gain increases between 25 °C and 85 °C.',
      },
      {
        id: 'bjt-drift-collector',
        label: 'Collector current',
        mode: 'mA DC',
        reading: '1.80 → 2.18 mA',
        note: 'Collector current follows the measured gain increase at the same base current.',
      },
    ],
    diagnoses: [
      {
        id: 'bjt-uncompensated-bias',
        label: 'Temperature-sensitive fixed base bias',
        detail:
          'The circuit has no emitter feedback or compensation to oppose the device gain change.',
      },
      {
        id: 'bjt-supply-rise',
        label: 'Collector supply rising',
        detail:
          'The base-current and gain measurements already account for the observed collector-current change.',
      },
      {
        id: 'bjt-collector-resistor-short',
        label: 'Collector resistor partially shorted',
        detail:
          'A resistor fault would not produce the measured temperature-correlated beta increase.',
      },
    ],
    explanation:
      'The base current stays fixed while measured beta rises with temperature, so collector current rises in direct proportion. Emitter degeneration or an actively stabilized bias network would reduce this sensitivity.',
  },
  {
    id: 'mosfet-underdriven-gate',
    labId: 'lab-mosfet',
    title: 'Hot switch at normal current',
    symptom:
      'The load current is close to target, but the MOSFET package heats rapidly and the enclosure fails its thermal test.',
    observedOutput: '2.16 W on-state loss',
    safetyNote:
      'Use an isolated or differential probe for VGS and VDS. Keep every probe ground away from the switching node.',
    xp: 40,
    correctDiagnosisId: 'insufficient-gate-drive',
    measurements: [
      {
        id: 'mosfet-gate-voltage',
        label: 'Gate to source',
        mode: 'V PK',
        reading: '4.0 V',
        note: 'The gate exceeds threshold but never reaches the datasheet low-resistance test voltage.',
      },
      {
        id: 'mosfet-load-current',
        label: 'Drain current',
        mode: 'A DC',
        reading: '3.0 A',
        note: 'The load path is intact and current remains close to its expected value.',
      },
      {
        id: 'mosfet-on-voltage',
        label: 'On-state VDS',
        mode: 'V DC',
        reading: '0.72 V',
        note: 'The conducting channel drops far more voltage than a fully enhanced MOSFET.',
      },
    ],
    diagnoses: [
      {
        id: 'insufficient-gate-drive',
        label: 'Insufficient gate-drive voltage',
        detail: 'The MOSFET is only partly enhanced, so RDS(on) and conduction loss remain high.',
      },
      {
        id: 'open-load',
        label: 'Open load',
        detail: 'A 3.0 A drain-current measurement proves the load path is closed.',
      },
      {
        id: 'shorted-mosfet',
        label: 'Drain-source short',
        detail: 'A shorted device would not show a controlled 0.72 V on-state drop.',
      },
    ],
    explanation:
      'Threshold voltage only begins channel formation. The 4.0 V gate drive leaves a large 0.72 V drop at 3.0 A, so the channel dissipates about 2.16 W instead of reaching its specified low RDS(on).',
  },
  {
    id: 'mosfet-missing-flyback',
    labId: 'lab-mosfet',
    title: 'Drain spike on turn-off',
    symptom:
      'The driver works at low duty cycle, but MOSFETs fail after repeated inductive-load switching.',
    observedOutput: '92 V drain spike',
    safetyNote:
      'Use a correctly rated differential probe and current probe. Do not connect an earth-referenced probe ground to the drain.',
    xp: 45,
    correctDiagnosisId: 'missing-flyback-clamp',
    measurements: [
      {
        id: 'mosfet-bus-voltage',
        label: 'DC bus',
        mode: 'V DC',
        reading: '48.0 V',
        note: 'The supply remains inside its normal operating range.',
      },
      {
        id: 'mosfet-gate-waveform',
        label: 'Gate waveform',
        mode: 'V PK',
        reading: '10.1 V clean',
        note: 'The driver reaches the required gate voltage without false turn-on.',
      },
      {
        id: 'mosfet-drain-spike',
        label: 'Drain at turn-off',
        mode: 'V PK',
        reading: '92 V',
        note: 'Inductive energy drives the drain well above the 60 V device rating.',
      },
    ],
    diagnoses: [
      {
        id: 'missing-flyback-clamp',
        label: 'Missing or open flyback clamp',
        detail: 'The inductive current has no controlled path when the MOSFET turns off.',
      },
      {
        id: 'weak-gate-driver',
        label: 'Weak gate driver',
        detail: 'The measured gate waveform is clean and reaches 10.1 V.',
      },
      {
        id: 'bus-overvoltage',
        label: 'DC bus overvoltage',
        detail: 'The 48.0 V bus is normal; the excess voltage appears only during turn-off.',
      },
    ],
    explanation:
      'A normal bus and clean gate drive isolate the failure to the power loop. The 92 V turn-off spike is stored inductive energy, which requires a flyback diode, TVS, or another rated clamp path.',
  },
  {
    id: 'pid-low-damping',
    labId: 'lab-pid',
    title: 'Axis rings after every move',
    symptom:
      'The servo reaches the commanded position quickly but crosses it repeatedly before becoming usable.',
    observedOutput: '68% overshoot',
    safetyNote:
      'Disable drive power before touching the mechanism and keep the software travel limit active during closed-loop tests.',
    xp: 40,
    correctDiagnosisId: 'pid-insufficient-damping',
    measurements: [
      {
        id: 'pid-command-step',
        label: 'Command step',
        mode: 'POSITION',
        reading: '60.0° clean',
        note: 'The trajectory generator issues one stable command with no repeated steps.',
      },
      {
        id: 'pid-first-peak',
        label: 'First response peak',
        mode: 'POSITION',
        reading: '100.8°',
        note: 'The first peak exceeds the commanded position by about 68%.',
      },
      {
        id: 'pid-control-output',
        label: 'Controller output',
        mode: 'DRIVE',
        reading: '100% alternating',
        note: 'The controller reverses at full effort while the response continues to ring.',
      },
    ],
    diagnoses: [
      {
        id: 'pid-insufficient-damping',
        label: 'Insufficient loop damping',
        detail:
          'Aggressive proportional and integral action with too little derivative damping sustains the oscillation.',
      },
      {
        id: 'pid-encoder-noise',
        label: 'Noisy encoder feedback',
        detail:
          'Noise would roughen the trace rather than produce a repeatable decaying oscillation.',
      },
      {
        id: 'pid-mechanical-backlash',
        label: 'Mechanical backlash only',
        detail:
          'Backlash creates a dead zone or reversal error, not this large symmetric ringing.',
      },
    ],
    explanation:
      'A clean command, repeatable 68% peak, and alternating full controller effort identify an under-damped loop. Reduce proportional or integral aggression, then add measured derivative damping.',
  },
  {
    id: 'pid-integral-windup',
    labId: 'lab-pid',
    title: 'Slow recovery from the travel limit',
    symptom:
      'After the mechanism hits its stop, a reverse command is ignored for several seconds even though the encoder is healthy.',
    observedOutput: '3.8 s release delay',
    safetyNote:
      'Use a torque-limited commissioning mode and verify both software and physical limit switches before commanding the stop.',
    xp: 45,
    correctDiagnosisId: 'pid-windup',
    measurements: [
      {
        id: 'pid-actuator-limit',
        label: 'Actuator output',
        mode: 'DRIVE',
        reading: '100% saturated',
        note: 'The drive cannot create additional motion while the controller continues requesting more effort.',
      },
      {
        id: 'pid-integral-state',
        label: 'Integral accumulator',
        mode: 'STATE',
        reading: '+220%',
        note: 'The accumulated error grows far beyond the actuator range while the axis is blocked.',
      },
      {
        id: 'pid-reverse-delay',
        label: 'Reverse response',
        mode: 'TIME',
        reading: '3.8 s',
        note: 'The integral state must unwind before controller output can change direction.',
      },
    ],
    diagnoses: [
      {
        id: 'pid-windup',
        label: 'Integral windup',
        detail:
          'The integrator keeps accumulating error while the actuator is saturated.',
      },
      {
        id: 'pid-reversed-encoder',
        label: 'Reversed encoder polarity',
        detail:
          'Positive feedback would drive away continuously, not recover after a repeatable delay.',
      },
      {
        id: 'pid-derivative-kick',
        label: 'Derivative kick',
        detail:
          'Derivative kick creates a brief command spike rather than a multi-second release delay.',
      },
    ],
    explanation:
      'A saturated actuator, a 220% integral state, and delayed reversal are the signature of windup. Clamp or back-calculate the integrator whenever the drive reaches its limit.',
  },
  {
    id: 'adc-hidden-alias',
    labId: 'lab-adc',
    title: 'False tone in the spectrum',
    symptom:
      'A vibration channel reports a stable 1.50 kHz component even though the mechanical system has no mode at that frequency.',
    observedOutput: '1.50 kHz spectral peak',
    safetyNote:
      'Verify probe attenuation and input range before connecting the acquisition channel to an energized sensor interface.',
    xp: 40,
    correctDiagnosisId: 'adc-insufficient-sample-rate',
    measurements: [
      {
        id: 'adc-analog-input',
        label: 'Analog input',
        mode: 'SCOPE',
        reading: '6.50 kHz',
        note: 'The pre-converter waveform contains a clean high-frequency interference tone.',
      },
      {
        id: 'adc-sample-clock',
        label: 'Sample clock',
        mode: 'CLOCK',
        reading: '5.00 kS/s',
        note: 'Nyquist frequency is only 2.50 kHz, well below the analog interference.',
      },
      {
        id: 'adc-fft-output',
        label: 'Digital spectrum',
        mode: 'FFT',
        reading: '1.50 kHz',
        note: 'The converter folds the 6.50 kHz tone into the first Nyquist zone.',
      },
    ],
    diagnoses: [
      {
        id: 'adc-insufficient-sample-rate',
        label: 'Aliasing from an insufficient sample rate',
        detail:
          'The 6.50 kHz input folds to 1.50 kHz when sampled at 5.00 kS/s.',
      },
      {
        id: 'adc-sensor-resonance',
        label: 'A real 1.50 kHz sensor resonance',
        detail:
          'The analog scope identifies the actual component at 6.50 kHz before conversion.',
      },
      {
        id: 'adc-bit-depth',
        label: 'Insufficient ADC bit depth',
        detail:
          'Low resolution raises quantization noise but does not translate a tone to a new frequency.',
      },
    ],
    explanation:
      'The analog input is above the 2.50 kHz Nyquist limit. Uniform 5.00 kS/s sampling makes 6.50 kHz indistinguishable from 1.50 kHz, so the cure is a higher sample rate, effective anti-alias filtering, or both.',
  },
  {
    id: 'adc-input-clipping',
    labId: 'lab-adc',
    title: 'Flat-topped sensor waveform',
    symptom:
      'Increasing sensor excitation no longer raises the reported peak, and the acquired waveform develops broad flat tops.',
    observedOutput: 'Codes pinned at 0 and 1023',
    safetyNote:
      'Confirm the ADC reference and front-end common-mode limits before increasing input amplitude.',
    xp: 45,
    correctDiagnosisId: 'adc-over-range',
    measurements: [
      {
        id: 'adc-reference',
        label: 'ADC reference',
        mode: 'V DC',
        reading: '3.30 V',
        note: 'A centered unipolar input has approximately 1.65 V peak headroom.',
      },
      {
        id: 'adc-signal-amplitude',
        label: 'Conditioned signal',
        mode: 'V PK',
        reading: '2.20 Vpk',
        note: 'The conditioned waveform exceeds the available half-scale input range.',
      },
      {
        id: 'adc-code-histogram',
        label: 'Code histogram',
        mode: 'CODE',
        reading: '0 / 1023 rails',
        note: 'A large fraction of samples are stuck at the minimum and maximum codes.',
      },
    ],
    diagnoses: [
      {
        id: 'adc-over-range',
        label: 'ADC input over-range',
        detail:
          'The conditioned signal exceeds the converter input range and clips at both code rails.',
      },
      {
        id: 'adc-clock-jitter',
        label: 'Excessive sample-clock jitter',
        detail:
          'Clock jitter spreads spectral energy but does not pin repeated samples at both rails.',
      },
      {
        id: 'adc-missing-codes',
        label: 'Random missing codes',
        detail:
          'Missing codes create gaps in the histogram, not sustained minimum and maximum readings.',
      },
    ],
    explanation:
      'The 3.30 V reference provides 1.65 V of centered peak range, while the conditioned input reaches 2.20 Vpk. Add attenuation or gain control, then verify that the complete waveform remains inside the ADC rails.',
  },
  {
    id: 'transmission-open-connector',
    labId: 'lab-transmission',
    title: 'Open receiver connector',
    symptom:
      'The transmitter is healthy, but the receiver loses nearly all signal and the forward-power monitor oscillates.',
    observedOutput: '>20:1 VSWR',
    safetyNote:
      'Disable RF output before disconnecting the load, then calibrate the VNA at the cable reference plane.',
    xp: 40,
    correctDiagnosisId: 'open-rf-load',
    measurements: [
      {
        id: 'transmission-source-port',
        label: 'Source port',
        mode: 'PORT Ω',
        reading: '50.0 Ω',
        note: 'The transmitter output impedance is correct at the calibrated source plane.',
      },
      {
        id: 'transmission-load-resistance',
        label: 'Receiver load',
        mode: 'OHM',
        reading: 'OL',
        note: 'The isolated termination has no conductive path through the center contact.',
      },
      {
        id: 'transmission-vna-reflection',
        label: 'VNA S11',
        mode: 'S11',
        reading: 'Γ 0.96 ∠ 4°',
        note: 'A large positive reflection returns almost in phase with the incident wave.',
      },
    ],
    diagnoses: [
      {
        id: 'open-rf-load',
        label: 'Open connector or termination',
        detail: 'An open circuit reflects nearly all incident energy with positive polarity.',
      },
      {
        id: 'shorted-rf-load',
        label: 'Shorted termination',
        detail: 'A short also reflects strongly, but its reflection has opposite polarity.',
      },
      {
        id: 'weak-transmitter',
        label: 'Low transmitter output',
        detail: 'Low forward power does not explain the open load or large positive reflection.',
      },
    ],
    explanation:
      'A correct 50 Ω source, an OL load measurement, and Γ near +1 identify an open termination. The returning wave reinforces voltage at the open end while little power reaches the receiver.',
  },
  {
    id: 'transmission-crushed-coax',
    labId: 'lab-transmission',
    title: 'Crushed coax section',
    symptom:
      'The far-end load measures correctly, but a narrow-band receiver drops out when the cable is moved.',
    observedOutput: '1.79:1 VSWR',
    safetyNote:
      'De-energize the cable before resistance checks and use a TDR or low-power VNA stimulus for location testing.',
    xp: 45,
    correctDiagnosisId: 'local-low-impedance',
    measurements: [
      {
        id: 'transmission-far-load',
        label: 'Far-end termination',
        mode: 'OHM',
        reading: '50.1 Ω',
        note: 'The receiver termination remains correct when measured directly.',
      },
      {
        id: 'transmission-tdr-event',
        label: 'TDR trace',
        mode: 'TDR',
        reading: '−22% at 18 ns',
        note: 'A negative reflection appears before the far-end load response.',
      },
      {
        id: 'transmission-local-impedance',
        label: 'Event impedance',
        mode: 'TDR Ω',
        reading: '32 Ω',
        note: 'The local cable geometry has shifted well below its nominal 50 Ω impedance.',
      },
    ],
    diagnoses: [
      {
        id: 'local-low-impedance',
        label: 'Crushed low-impedance cable section',
        detail: 'Changed conductor spacing creates a localized negative reflection.',
      },
      {
        id: 'incorrect-far-load',
        label: 'Wrong receiver termination',
        detail: 'The far-end load measures 50.1 Ω and the reflection occurs earlier in time.',
      },
      {
        id: 'open-center-conductor',
        label: 'Open center conductor',
        detail: 'An open produces a strong positive reflection rather than this negative step.',
      },
    ],
    explanation:
      'The correct far-end load rules out termination error. A negative TDR event before the receiver and a 32 Ω local impedance identify a compressed section of coax.',
  },
  {
    id: 'transformer-shorted-turns',
    labId: 'lab-transformer',
    title: 'Core heats with no secondary load',
    symptom:
      'The transformer hums, draws heavy current, and heats rapidly even after the secondary circuit is disconnected.',
    observedOutput: '1.82 A no-load primary current',
    safetyNote:
      'De-energize and lock out the primary before resistance, insulation, or winding-ratio tests.',
    xp: 40,
    correctDiagnosisId: 'transformer-shorted-turns-diagnosis',
    measurements: [
      {
        id: 'transformer-primary-supply',
        label: 'Primary supply',
        mode: 'V AC',
        reading: '120.0 V / 60 Hz',
        note: 'The source voltage and frequency match the nameplate rating.',
      },
      {
        id: 'transformer-no-load-current',
        label: 'No-load primary',
        mode: 'A AC',
        reading: '1.82 A',
        note: 'The disconnected secondary should leave only a small magnetizing current.',
      },
      {
        id: 'transformer-ratio-test',
        label: 'Winding ratio',
        mode: 'TTR',
        reading: '4.34:1 unstable',
        note: 'The measured ratio is low and changes as the core warms.',
      },
    ],
    diagnoses: [
      {
        id: 'transformer-shorted-turns-diagnosis',
        label: 'Shorted winding turns',
        detail:
          'A shorted turn behaves like a heavily loaded secondary and drives large circulating current inside the winding.',
      },
      {
        id: 'transformer-open-secondary',
        label: 'Open secondary winding',
        detail:
          'The secondary is already disconnected; an open circuit does not explain heavy no-load current.',
      },
      {
        id: 'transformer-overloaded-output',
        label: 'External load overload',
        detail:
          'The high current remains after every external secondary load is removed.',
      },
    ],
    explanation:
      'Rated primary voltage and frequency exclude over-excitation. Heavy current with the secondary disconnected and an unstable turns ratio point to a shorted turn, which creates its own high-current closed loop inside the transformer.',
  },
  {
    id: 'transformer-overflux',
    labId: 'lab-transformer',
    title: 'Breaker trips after frequency change',
    symptom:
      'A transformer that operates normally at 60 Hz becomes loud and trips its primary breaker when powered from a lower-frequency source.',
    observedOutput: '1.50 T peak core flux',
    safetyNote:
      'Remove power before changing source frequency, and never exceed the nameplate volts-per-hertz ratio.',
    xp: 45,
    correctDiagnosisId: 'transformer-low-frequency-overflux',
    measurements: [
      {
        id: 'transformer-overflux-voltage',
        label: 'Primary voltage',
        mode: 'V AC',
        reading: '120.0 V',
        note: 'Applied RMS voltage remains at the 60 Hz nameplate value.',
      },
      {
        id: 'transformer-overflux-frequency',
        label: 'Source frequency',
        mode: 'FREQ',
        reading: '30.0 Hz',
        note: 'Frequency has fallen to half the rated value while voltage stayed constant.',
      },
      {
        id: 'transformer-overflux-current',
        label: 'Excitation current',
        mode: 'A AC',
        reading: '2.45 A distorted',
        note: 'Current contains a large nonlinear peak near each flux maximum.',
      },
    ],
    diagnoses: [
      {
        id: 'transformer-low-frequency-overflux',
        label: 'Core saturation from excessive volts per hertz',
        detail:
          'Halving frequency at constant voltage doubles the required flux swing and pushes the core into saturation.',
      },
      {
        id: 'transformer-secondary-short',
        label: 'Shorted external secondary',
        detail:
          'The same symptom occurs with the secondary open, so the external load is not the cause.',
      },
      {
        id: 'transformer-high-frequency-loss',
        label: 'Excessive high-frequency core loss',
        detail:
          'The source frequency moved lower, not higher, and the dominant failure is saturation current.',
      },
    ],
    explanation:
      'Peak flux is inversely proportional to frequency. Holding 120 V while dropping from 60 Hz to 30 Hz doubles volts per hertz, drives the core toward 1.50 T, and produces the distorted magnetizing current that trips the breaker.',
  },
  {
    id: 'power-phase-loss',
    labId: 'lab-power',
    title: 'Lost motor phase',
    symptom: 'The motor vibrates, torque falls, and the overload relay approaches trip.',
    observedOutput: '6.92 kW',
    safetyNote: 'Treat all phase conductors as energized and use properly rated probes and PPE.',
    xp: 40,
    correctDiagnosisId: 'open-phase',
    measurements: [
      {
        id: 'phase-currents',
        label: 'Phase currents',
        mode: 'A AC',
        reading: '12.4 / 0.0 / 12.1 A',
        note: 'One conductor carries no current while the other two are overloaded.',
      },
      {
        id: 'source-voltages',
        label: 'Source L-L',
        mode: 'V AC',
        reading: '400 / 401 / 399 V',
        note: 'The upstream three-phase supply remains balanced.',
      },
      {
        id: 'contactor-output',
        label: 'Contactor output',
        mode: 'V AC',
        reading: '400 / 0 / 399 V',
        note: 'The center pole is open on the load side of the contactor.',
      },
    ],
    diagnoses: [
      {
        id: 'open-phase',
        label: 'Open phase or contactor pole',
        detail: 'One phase is lost between the balanced source and motor.',
      },
      {
        id: 'low-power-factor',
        label: 'Low power factor',
        detail: 'Poor power factor would not drive one phase current to zero.',
      },
      {
        id: 'balanced-overload',
        label: 'Balanced mechanical overload',
        detail: 'A balanced overload raises all three phase currents.',
      },
    ],
    explanation:
      'Balanced source voltages but zero current and voltage on one contactor output identify a single-phasing fault downstream of the supply.',
  },
  {
    id: 'power-low-pf',
    labId: 'lab-power',
    title: 'Reactive current',
    symptom: 'The feeder current is high even though useful real power is below target.',
    observedOutput: '7.06 kW',
    safetyNote: 'Use a rated power analyzer and observe facility arc-flash procedures.',
    xp: 45,
    correctDiagnosisId: 'poor-power-factor',
    measurements: [
      {
        id: 'line-voltage',
        label: 'Line voltage',
        mode: 'V AC',
        reading: '400 V balanced',
        note: 'The supply magnitude and phase balance are normal.',
      },
      {
        id: 'line-current',
        label: 'Line current',
        mode: 'A AC',
        reading: '18.2 A balanced',
        note: 'All three conductors carry similarly high current.',
      },
      {
        id: 'power-analyzer',
        label: 'Power analyzer',
        mode: 'PF',
        reading: '0.56 lag',
        note: 'Reactive current dominates the load while real power remains 7.06 kW.',
      },
    ],
    diagnoses: [
      {
        id: 'poor-power-factor',
        label: 'Poor lagging power factor',
        detail: 'The balanced load draws excessive reactive current.',
      },
      {
        id: 'open-phase',
        label: 'Open phase',
        detail: 'All phase currents are present and balanced.',
      },
      {
        id: 'line-undervoltage',
        label: 'Line undervoltage',
        detail: 'The measured line voltage is at its expected 400 V value.',
      },
    ],
    explanation:
      'Balanced voltage and current exclude a lost phase. The 0.56 lagging power factor directly explains why current is high relative to useful real power.',
  },
];
const CAREER_PROFILES: Record<string, CareerProfile> = {
  'Embedded Systems Engineer': {
    role: 'Embedded Systems Engineer',
    labId: 'lab-digital',
    labLabel: 'Digital Timing Bench',
    projectTitle: 'Sensor interface bring-up',
    projectDescription:
      'Diagnose a sensor loop, verify its current draw, and connect the reading to a digital input decision.',
    skills: [
      {
        id: 'voltage-current-resistance',
        label: 'Electrical checks',
        weight: 0.45,
      },
      { id: 'digital-logic', label: 'Digital logic', weight: 0.35 },
      { id: 'circuit-reading', label: 'Board reading', weight: 0.2 },
    ],
  },
  'Electronics Design Engineer': {
    role: 'Electronics Design Engineer',
    labId: 'lab-opamp',
    labLabel: 'Op-Amp Signal Bench',
    projectTitle: 'Analog front-end review',
    projectDescription:
      'Size a timing network, inspect its transient response, and defend the component choices in a design review.',
    skills: [
      { id: 'circuit-reading', label: 'Schematic fluency', weight: 0.35 },
      { id: 'dc-analysis', label: 'DC analysis', weight: 0.3 },
      { id: 'transients', label: 'Transient response', weight: 0.35 },
    ],
  },
  'Power Electronics Engineer': {
    role: 'Power Electronics Engineer',
    labId: 'lab-mosfet',
    labLabel: 'MOSFET Switching Bench',
    projectTitle: '48 V solenoid driver review',
    projectDescription:
      'Select the switch, clamp, gate drive, and evidence required for a reliable inductive-load channel.',
    skills: [
      {
        id: 'dc-analysis',
        label: 'Power-stage analysis',
        weight: 0.4,
      },
      {
        id: 'transients',
        label: 'Switching transients',
        weight: 0.35,
      },
      {
        id: 'circuit-reading',
        label: 'Driver schematics',
        weight: 0.25,
      },
    ],
  },
  'RF Systems Engineer': {
    role: 'RF Systems Engineer',
    labId: 'lab-transmission',
    labLabel: 'Transmission Line Bench',
    projectTitle: '50 Ω telemetry link review',
    projectDescription:
      'Commission an impedance-controlled cable link, locate reflections, and defend the acceptance limits.',
    skills: [
      {
        id: 'signals-ac',
        label: 'RF and transmission lines',
        weight: 0.5,
      },
      {
        id: 'circuit-reading',
        label: 'RF schematic fluency',
        weight: 0.25,
      },
      {
        id: 'dc-analysis',
        label: 'Front-end load analysis',
        weight: 0.25,
      },
    ],
  },
  'Controls Engineer': {
    role: 'Controls Engineer',
    labId: 'lab-pid',
    labLabel: 'PID Servo Bench',
    projectTitle: 'Thermal chamber control review',
    projectDescription:
      'Tune a bounded heater loop, prevent windup, and define the evidence required for a stable temperature process.',
    skills: [
      {
        id: 'signals-ac',
        label: 'Feedback stability',
        weight: 0.4,
      },
      {
        id: 'transients',
        label: 'Dynamic response',
        weight: 0.35,
      },
      {
        id: 'digital-logic',
        label: 'Controller implementation',
        weight: 0.25,
      },
    ],
  },
  'Instrumentation Engineer': {
    role: 'Instrumentation Engineer',
    labId: 'lab-adc',
    labLabel: 'ADC Sampling Bench',
    projectTitle: 'Pressure transducer acquisition review',
    projectDescription:
      'Condition a field sensor, select a defensible converter strategy, and define traceable calibration evidence.',
    skills: [
      {
        id: 'signals-ac',
        label: 'Sampling and spectra',
        weight: 0.4,
      },
      {
        id: 'circuit-reading',
        label: 'Signal conditioning',
        weight: 0.35,
      },
      {
        id: 'digital-logic',
        label: 'Data acquisition',
        weight: 0.25,
      },
    ],
  },
  'Electrical Machines Engineer': {
    role: 'Electrical Machines Engineer',
    labId: 'lab-transformer',
    labLabel: 'Transformer and Magnetic Core Bench',
    projectTitle: '480 V control transformer review',
    projectDescription:
      'Size the magnetic circuit, coordinate protection, and define release evidence for an industrial control transformer.',
    skills: [
      {
        id: 'signals-ac',
        label: 'Magnetic circuits',
        weight: 0.4,
      },
      {
        id: 'transients',
        label: 'Inrush and protection',
        weight: 0.35,
      },
      {
        id: 'circuit-reading',
        label: 'Machine schematics',
        weight: 0.25,
      },
    ],
  },
  'Power Systems Engineer': {
    role: 'Power Systems Engineer',
    labId: 'lab-power',
    labLabel: 'Three-Phase Power Lab',
    projectTitle: 'Balanced feeder commissioning',
    projectDescription:
      'Balance a three-phase load, verify real power, and identify the operating margin for a plant feeder.',
    skills: [
      { id: 'signals-ac', label: 'AC systems', weight: 0.45 },
      { id: 'dc-analysis', label: 'Load analysis', weight: 0.2 },
      { id: 'transients', label: 'Protection response', weight: 0.35 },
    ],
  },
};

const CAREER_PROJECTS: Record<string, CareerProject> = {
  'Embedded Systems Engineer': {
    role: 'Embedded Systems Engineer',
    title: 'Sensor interface bring-up',
    brief:
      'A 3.3 V controller reads a field sensor that idles at 2.85 V and draws 22 mA. A long cable is producing intermittent input spikes.',
    constraints: [
      'MCU input absolute maximum: 3.6 V',
      'Useful sensor bandwidth: 10 Hz',
      'Cable length: 1.5 m',
      'Sensor must remain field-replaceable',
    ],
    deliverable:
      'Defend the input network, sampling strategy, and fault acceptance test.',
    labId: 'lab-ohms',
    xp: 80,
    decisions: [
      {
        id: 'input-network',
        title: 'Protect the input',
        prompt:
          'Choose the interface that protects the MCU without corrupting the normal 2.85 V signal.',
        correctOptionId: 'series-filter-clamp',
        explanation:
          'A modest series resistor limits clamp current, the local capacitor removes cable spikes, and a rated clamp keeps the pin below its absolute maximum without scaling the valid signal.',
        options: [
          {
            id: 'direct-wire',
            label: 'Connect the cable directly',
            detail: 'Shortest path, but the MCU pin receives the full transient energy.',
            signal: 'Fast / exposed',
          },
          {
            id: 'fixed-divider',
            label: 'Use a 2:1 divider',
            detail: 'Reduces every reading and changes the calibrated sensor transfer.',
            signal: 'Protected / distorted',
          },
          {
            id: 'series-filter-clamp',
            label: 'Add 1 kOhm, 100 nF, and a 3.3 V clamp',
            detail: 'Limits surge current and filters cable energy at the connector.',
            signal: 'Protected / calibrated',
          },
        ],
      },
      {
        id: 'sampling-plan',
        title: 'Capture a stable signal',
        prompt:
          'The useful signal changes below 10 Hz. Select a sampling plan that rejects isolated spikes while preserving response.',
        correctOptionId: 'sample-filter',
        explanation:
          'Sampling at 200 Hz provides useful oversampling margin. A short median stage rejects isolated impulses before a moving average reduces broadband noise.',
        options: [
          {
            id: 'sample-once',
            label: 'Sample once every second',
            detail: 'Low data load, but real transitions and single bad samples become indistinguishable.',
            signal: 'Sparse / fragile',
          },
          {
            id: 'sample-filter',
            label: 'Sample at 200 Hz, median, then average',
            detail: 'Separates impulse rejection from low-pass smoothing.',
            signal: 'Responsive / robust',
          },
          {
            id: 'sample-fast-raw',
            label: 'Sample at maximum rate with no filter',
            detail: 'Captures every spike and pushes the noise problem downstream.',
            signal: 'Fast / noisy',
          },
        ],
      },
      {
        id: 'fault-acceptance',
        title: 'Define acceptance',
        prompt:
          'Choose the commissioning test that proves both nominal operation and safe fault behavior.',
        correctOptionId: 'range-timeout-test',
        explanation:
          'A credible bring-up test checks the calibrated range, disconnect behavior, timeout handling, and the protected pin voltage during a repeatable transient.',
        options: [
          {
            id: 'nominal-only',
            label: 'Record one nominal ADC value',
            detail: 'Confirms one operating point but leaves faults and timing untested.',
            signal: 'Quick / incomplete',
          },
          {
            id: 'range-timeout-test',
            label: 'Sweep range, disconnect, and inject a transient',
            detail: 'Verifies scaling, open-sensor handling, recovery, and pin protection.',
            signal: 'Measured / defensible',
          },
          {
            id: 'software-threshold',
            label: 'Raise the software alarm threshold',
            detail: 'Hides symptoms without proving the electrical interface.',
            signal: 'Quiet / unverified',
          },
        ],
      },
    ],
  },
  'Electronics Design Engineer': {
    role: 'Electronics Design Engineer',
    title: 'Analog front-end review',
    brief:
      'A 0 to 100 mV bridge signal must use most of a 0 to 3.0 V ADC range from a single 3.3 V supply. Useful bandwidth is 50 Hz.',
    constraints: [
      'Input span: 0 to 100 mV',
      'ADC target span: 0 to 3.0 V',
      'Single supply: 3.3 V',
      'Useful bandwidth: 50 Hz',
    ],
    deliverable:
      'Select the gain, bandwidth, and verification evidence for design review.',
    labId: 'lab-rc',
    xp: 80,
    decisions: [
      {
        id: 'gain-stage',
        title: 'Set the analog gain',
        prompt:
          'Choose a practical first-pass amplifier configuration for the required 30 V/V gain.',
        correctOptionId: 'rrio-gain-30',
        explanation:
          'A rail-to-rail input/output amplifier with a non-inverting gain near 30 uses the ADC range while respecting the low input common-mode voltage and 3.3 V supply.',
        options: [
          {
            id: 'unity-buffer',
            label: 'Use a unity-gain buffer',
            detail: 'Preserves the signal but uses only about 3% of the ADC range.',
            signal: 'Stable / low resolution',
          },
          {
            id: 'rrio-gain-30',
            label: 'Use an RRIO non-inverting gain of 30',
            detail: 'Maps 0 to 100 mV into approximately 0 to 3.0 V.',
            signal: 'Full span / compatible',
          },
          {
            id: 'gain-50',
            label: 'Use a gain of 50',
            detail: 'Requests 5 V output from a 3.3 V amplifier and clips the upper range.',
            signal: 'Sensitive / saturated',
          },
        ],
      },
      {
        id: 'bandwidth-stage',
        title: 'Control the bandwidth',
        prompt:
          'Select the filter corner that preserves a 50 Hz signal while limiting higher-frequency noise.',
        correctOptionId: 'corner-100hz',
        explanation:
          'A first-order corner near 100 Hz keeps the useful 50 Hz content inside the passband while attenuating faster noise without excessive phase lag.',
        options: [
          {
            id: 'corner-10hz',
            label: 'Set the corner to 10 Hz',
            detail: 'Strong filtering, but it attenuates and delays the useful signal.',
            signal: 'Quiet / too slow',
          },
          {
            id: 'corner-100hz',
            label: 'Set the corner near 100 Hz',
            detail: 'Provides practical noise reduction with useful bandwidth margin.',
            signal: 'Balanced / measurable',
          },
          {
            id: 'no-filter',
            label: 'Leave the ADC input unfiltered',
            detail: 'Maximizes bandwidth but invites aliasing and amplifier noise.',
            signal: 'Wide / noisy',
          },
        ],
      },
      {
        id: 'design-evidence',
        title: 'Build the evidence',
        prompt:
          'Choose the validation set that best supports a design review and tolerance release.',
        correctOptionId: 'sweep-step-corners',
        explanation:
          'A DC sweep proves gain and headroom, a step response proves settling, and component corners expose offset, tolerance, and bandwidth risk before release.',
        options: [
          {
            id: 'single-reading',
            label: 'Capture one midscale reading',
            detail: 'Shows nominal operation at only one point.',
            signal: 'Simple / narrow',
          },
          {
            id: 'sweep-step-corners',
            label: 'Run a DC sweep, step test, and tolerance corners',
            detail: 'Covers transfer accuracy, settling, headroom, and component spread.',
            signal: 'Complete / reviewable',
          },
          {
            id: 'schematic-only',
            label: 'Submit the schematic calculation only',
            detail: 'Documents intent but provides no measured or simulated margin.',
            signal: 'Calculated / unproven',
          },
        ],
      },
    ],
  },
  'Power Electronics Engineer': {
    role: 'Power Electronics Engineer',
    title: '48 V solenoid driver review',
    brief:
      'A 48 V industrial solenoid draws 4 A and uses 20 kHz PWM hold current. The enclosure can reach 60 °C and the mechanism must release within 5 ms.',
    constraints: [
      'DC bus: 48 V',
      'Peak coil current: 4 A',
      'PWM frequency: 20 kHz',
      'Ambient temperature: 60 °C',
      'Mechanical release target: under 5 ms',
    ],
    deliverable:
      'Defend the MOSFET, clamp network, gate drive, and worst-case acceptance test.',
    labId: 'lab-mosfet',
    xp: 80,
    decisions: [
      {
        id: 'power-switch-selection',
        title: 'Select the switching device',
        prompt:
          'Choose the practical MOSFET and drive arrangement for the 48 V, 4 A channel.',
        correctOptionId: 'power-80v-driven-mosfet',
        explanation:
          'An 80 V MOSFET provides useful clamped-transient margin above the 48 V bus. A dedicated 10 V driver reaches the specified low RDS(on) and moves gate charge quickly.',
        options: [
          {
            id: 'power-60v-logic-mosfet',
            label: 'Use a 60 V MOSFET from a 3.3 V GPIO',
            detail: 'Leaves little drain-spike margin and may not fully enhance under tolerance.',
            signal: 'Simple / marginal',
          },
          {
            id: 'power-80v-driven-mosfet',
            label: 'Use an 80 V MOSFET with a 10 V gate driver',
            detail: 'Balances voltage margin, low on-resistance, and controlled edge speed.',
            signal: 'Rated / fully driven',
          },
          {
            id: 'power-200v-slow-mosfet',
            label: 'Use a 200 V MOSFET directly from the controller',
            detail: 'Adds voltage rating but usually carries unnecessary resistance and gate charge.',
            signal: 'High margin / inefficient',
          },
        ],
      },
      {
        id: 'power-clamp-network',
        title: 'Control turn-off energy',
        prompt:
          'Select the clamp that protects the switch while meeting the fast release target.',
        correctOptionId: 'power-diode-tvs-clamp',
        explanation:
          'A coordinated diode and TVS path keeps the drain below the MOSFET rating while allowing a higher controlled flyback voltage, which collapses coil current faster than a plain diode.',
        options: [
          {
            id: 'power-no-clamp',
            label: 'Rely on MOSFET avalanche',
            detail: 'Makes repetitive stored-energy stress part of normal operation.',
            signal: 'Fast / destructive',
          },
          {
            id: 'power-plain-diode',
            label: 'Use only a low-drop flyback diode',
            detail: 'Protects the switch but can stretch current decay beyond the release target.',
            signal: 'Protected / slow release',
          },
          {
            id: 'power-diode-tvs-clamp',
            label: 'Use a diode and rated TVS clamp',
            detail: 'Creates a bounded higher flyback voltage for faster current decay.',
            signal: 'Clamped / responsive',
          },
        ],
      },
      {
        id: 'power-acceptance-evidence',
        title: 'Prove the design margin',
        prompt:
          'Choose the evidence set that supports release at the worst operating corner.',
        correctOptionId: 'power-waveform-thermal-corners',
        explanation:
          'Simultaneous VGS, VDS, and current captures expose switching stress and timing. Repeating the test at hot ambient and worst duty cycle verifies voltage, loss, temperature, and release margin together.',
        options: [
          {
            id: 'power-room-temp-current',
            label: 'Measure coil current at room temperature',
            detail: 'Confirms load current but misses gate drive, drain stress, and hot resistance.',
            signal: 'Nominal / incomplete',
          },
          {
            id: 'power-waveform-thermal-corners',
            label: 'Capture VGS, VDS, current, and temperature at corners',
            detail: 'Verifies drain peak, edge timing, dissipation, and hot release behavior.',
            signal: 'Measured / release-ready',
          },
          {
            id: 'power-datasheet-only',
            label: 'Use datasheet maximum ratings only',
            detail: 'Absolute limits do not prove the assembled layout or clamp waveform.',
            signal: 'Documented / unverified',
          },
        ],
      },
    ],
  },
  'RF Systems Engineer': {
    role: 'RF Systems Engineer',
    title: '50 Ω telemetry link review',
    brief:
      'A 10 m coaxial telemetry link near 100 MHz shows receiver dropouts and a moving reflection when the field cable is flexed.',
    constraints: [
      'Source impedance: 50 Ω',
      'Cable impedance: 50 Ω',
      'Operating band centered near 100 MHz',
      'Receiver must remain field-replaceable',
    ],
    deliverable:
      'Specify the termination, measurement plan, and link acceptance record.',
    labId: 'lab-transmission',
    xp: 80,
    decisions: [
      {
        id: 'rf-termination',
        title: 'Terminate the link',
        prompt:
          'Choose the receiver interface that absorbs the incident wave and preserves the cable impedance.',
        correctOptionId: 'rf-50-ohm-load',
        explanation:
          'A 50 Ω termination at the receiver matches the cable, drives Γ toward zero, and transfers the incident power without a far-end reflection.',
        options: [
          {
            id: 'rf-high-impedance-load',
            label: 'Use a high-impedance receiver',
            detail: 'Minimizes DC loading but leaves the RF cable nearly open at its far end.',
            signal: 'Light load / strong reflection',
          },
          {
            id: 'rf-50-ohm-load',
            label: 'Terminate with 50 Ω at the receiver',
            detail: 'Matches the cable at the load reference plane.',
            signal: 'Matched / absorbed',
          },
          {
            id: 'rf-10-ohm-load',
            label: 'Terminate with 10 Ω',
            detail: 'Creates a large negative reflection and overloads the source.',
            signal: 'Heavy load / mismatched',
          },
        ],
      },
      {
        id: 'rf-measurement-plan',
        title: 'Locate the reflection',
        prompt:
          'Select the measurement plan that separates connector, cable, and receiver behavior.',
        correctOptionId: 'rf-calibrated-vna-tdr',
        explanation:
          'Calibrating at the cable reference plane removes fixture error. S11 shows mismatch across frequency while the TDR view locates the discontinuity in time.',
        options: [
          {
            id: 'rf-dmm-only',
            label: 'Measure DC resistance only',
            detail: 'Finds opens and shorts but cannot characterize a distributed RF mismatch.',
            signal: 'Simple / frequency blind',
          },
          {
            id: 'rf-calibrated-vna-tdr',
            label: 'Calibrate a VNA, sweep S11, then inspect TDR',
            detail: 'Measures reflection magnitude, phase, bandwidth, and distance.',
            signal: 'Vector / location-aware',
          },
          {
            id: 'rf-scope-source-end',
            label: 'Probe only the source waveform',
            detail: 'Shows symptoms but folds cable delay and load response into one trace.',
            signal: 'Visible / ambiguous',
          },
        ],
      },
      {
        id: 'rf-acceptance',
        title: 'Define acceptance',
        prompt:
          'Choose a release criterion that proves the complete installed link has useful margin.',
        correctOptionId: 'rf-band-and-tdr-limit',
        explanation:
          'Return loss above 20 dB corresponds to VSWR below about 1.22:1. Checking it across the band and requiring a clean TDR trace verifies both frequency performance and cable integrity.',
        options: [
          {
            id: 'rf-center-frequency-only',
            label: 'Check 50 Ω at one frequency',
            detail: 'A narrow result can hide connector resonances and band-edge mismatch.',
            signal: 'Quick / narrow',
          },
          {
            id: 'rf-band-and-tdr-limit',
            label: 'Require RL >20 dB across band and a clean TDR',
            detail: 'Limits reflection over frequency and rejects localized discontinuities.',
            signal: 'Bounded / traceable',
          },
          {
            id: 'rf-receiver-lock-only',
            label: 'Accept when the receiver locks once',
            detail: 'A single successful lock provides no quantified reflection or flex margin.',
            signal: 'Functional / unmeasured',
          },
        ],
      },
    ],
  },
  'Controls Engineer': {
    role: 'Controls Engineer',
    title: 'Thermal chamber control review',
    brief:
      'A 2 kW heater must move a chamber from 25 °C to 80 °C without exceeding 82 °C. The measured plant time constant is about 120 s and the heater is duty-cycle limited.',
    constraints: [
      'Temperature command: 80 °C',
      'Maximum permitted temperature: 82 °C',
      'Measured plant time constant: 120 s',
      'Heater output range: 0 to 100%',
      'Settling target: under 8 minutes',
    ],
    deliverable:
      'Defend the sensing cadence, bounded controller structure, and release test for the chamber.',
    labId: 'lab-pid',
    xp: 80,
    decisions: [
      {
        id: 'controls-sensing-plan',
        title: 'Measure the plant cleanly',
        prompt:
          'Choose the sensing plan that captures the slow chamber dynamics without feeding electrical noise into the controller.',
        correctOptionId: 'controls-rtd-one-second',
        explanation:
          'A one-second filtered RTD sample is fast relative to a 120 s plant, preserves useful dynamics, and avoids reacting to line-frequency and switching noise.',
        options: [
          {
            id: 'controls-ten-second-sample',
            label: 'Sample the RTD every 10 seconds',
            detail:
              'Reduces data rate but adds avoidable delay to an already slow feedback loop.',
            signal: 'Quiet / delayed',
          },
          {
            id: 'controls-rtd-one-second',
            label: 'Sample a filtered RTD once per second',
            detail:
              'Provides strong time-scale separation with practical noise rejection.',
            signal: 'Measured / responsive',
          },
          {
            id: 'controls-raw-fast-thermocouple',
            label: 'Use raw thermocouple data at 100 Hz',
            detail:
              'Collects far more switching noise than useful thermal information.',
            signal: 'Fast / noisy',
          },
        ],
      },
      {
        id: 'controls-controller-structure',
        title: 'Bound the controller',
        prompt:
          'Select the controller structure that reaches setpoint without storing excessive error while the heater is saturated.',
        correctOptionId: 'controls-pid-antiwindup',
        explanation:
          'A tuned PI or PID loop with derivative on measurement, output limiting, and anti-windup preserves smooth setpoint response and recovers promptly from saturation.',
        options: [
          {
            id: 'controls-aggressive-integral',
            label: 'Use aggressive integral action only',
            detail:
              'Removes offset but stores large error while the heater is at full output.',
            signal: 'Accurate / windup-prone',
          },
          {
            id: 'controls-pid-antiwindup',
            label: 'Use bounded PID with anti-windup',
            detail:
              'Coordinates proportional response, integral accuracy, damping, and saturation recovery.',
            signal: 'Stable / recoverable',
          },
          {
            id: 'controls-on-off',
            label: 'Use on-off control with a narrow deadband',
            detail:
              'Simple implementation, but it cycles continuously near the target.',
            signal: 'Simple / oscillatory',
          },
        ],
      },
      {
        id: 'controls-release-evidence',
        title: 'Prove the operating margin',
        prompt:
          'Choose the acceptance record that demonstrates stability and safe recovery across realistic process conditions.',
        correctOptionId: 'controls-step-corners-faults',
        explanation:
          'Setpoint steps at thermal-load corners establish rise, overshoot, settling, and steady-state error. Saturation recovery and sensor-fault tests prove the protection behavior.',
        options: [
          {
            id: 'controls-one-warmup',
            label: 'Record one room-temperature warmup',
            detail:
              'Shows nominal performance but not load changes, saturation recovery, or sensor faults.',
            signal: 'Nominal / incomplete',
          },
          {
            id: 'controls-step-corners-faults',
            label: 'Run step, corner, saturation, and sensor-fault tests',
            detail:
              'Quantifies response and verifies bounded behavior under credible faults.',
            signal: 'Traceable / release-ready',
          },
          {
            id: 'controls-final-temperature',
            label: 'Accept when the final temperature reaches 80 °C',
            detail:
              'Ignores overshoot, settling time, actuator cycling, and recovery.',
            signal: 'Target met / dynamics unknown',
          },
        ],
      },
    ],
  },
  'Instrumentation Engineer': {
    role: 'Instrumentation Engineer',
    title: 'Pressure transducer acquisition review',
    brief:
      'A 0 to 5 V pressure transducer must feed a 3.3 V data-acquisition controller. Useful sensor content extends to 800 Hz, while a nearby drive introduces a 7 kHz switching component.',
    constraints: [
      'ADC input range: 0 to 3.3 V',
      'Useful measurement bandwidth: DC to 800 Hz',
      'Interference component: 7 kHz',
      'Amplitude accuracy target: within 1%',
      'Field wiring must tolerate disconnects and transients',
    ],
    deliverable:
      'Defend the input conditioning, sample strategy, and traceable calibration record.',
    labId: 'lab-adc',
    xp: 80,
    decisions: [
      {
        id: 'instrument-input-stage',
        title: 'Condition the field signal',
        prompt:
          'Choose the input stage that preserves the calibrated pressure range while protecting the 3.3 V converter.',
        correctOptionId: 'instrument-buffered-attenuator',
        explanation:
          'A protected, buffered attenuator scales 5 V to about 3.1 V, presents predictable loading to the transducer, and leaves measurable rail margin for tolerance and transients.',
        options: [
          {
            id: 'instrument-direct-input',
            label: 'Connect the 5 V signal directly',
            detail:
              'Preserves the transducer transfer but exceeds the converter absolute input range.',
            signal: 'Simple / unsafe',
          },
          {
            id: 'instrument-buffered-attenuator',
            label: 'Use a protected 0.62 gain buffer',
            detail:
              'Scales full pressure to about 3.1 V with input protection and low ADC drive impedance.',
            signal: 'Protected / calibrated',
          },
          {
            id: 'instrument-zener-only',
            label: 'Clamp the sensor with a 3.3 V Zener',
            detail:
              'Prevents the highest voltage but distorts the upper portion of the measurement range.',
            signal: 'Clamped / nonlinear',
          },
        ],
      },
      {
        id: 'instrument-sampling-plan',
        title: 'Reject the switching tone',
        prompt:
          'Select the acquisition plan that preserves 800 Hz content without folding the 7 kHz interference into the measurement band.',
        correctOptionId: 'instrument-filter-20ksps',
        explanation:
          'A steep anti-alias filter above the 800 Hz passband and a 20 kS/s converter place the 7 kHz component below Nyquist while leaving transition-band room for practical filtering.',
        options: [
          {
            id: 'instrument-5ksps-no-filter',
            label: 'Sample at 5 kS/s without a filter',
            detail:
              'The 7 kHz interference folds to 2 kHz and remains indistinguishable after conversion.',
            signal: 'Compact / aliased',
          },
          {
            id: 'instrument-filter-20ksps',
            label: 'Filter near 1.2 kHz and sample at 20 kS/s',
            detail:
              'Preserves the measurement band, attenuates the drive tone, and provides ten times oversampling at 1 kHz.',
            signal: 'Separated / observable',
          },
          {
            id: 'instrument-average-only',
            label: 'Average 16 unfiltered samples',
            detail:
              'Reduces random noise but cannot reliably remove a coherent aliased tone.',
            signal: 'Smoother / ambiguous',
          },
        ],
      },
      {
        id: 'instrument-calibration-record',
        title: 'Prove measurement integrity',
        prompt:
          'Choose the release record that demonstrates accuracy, headroom, and fault behavior over the operating range.',
        correctOptionId: 'instrument-traceable-corners',
        explanation:
          'Traceable points across the range and temperature establish gain, offset, linearity, and uncertainty. Rail, disconnect, noise, and code-histogram evidence verifies the complete acquisition path.',
        options: [
          {
            id: 'instrument-one-point',
            label: 'Check one midscale pressure',
            detail:
              'A single point cannot separate offset, gain, linearity, or rail errors.',
            signal: 'Fast / incomplete',
          },
          {
            id: 'instrument-traceable-corners',
            label: 'Calibrate five points at temperature corners',
            detail:
              'Records uncertainty, linearity, headroom, noise, and credible sensor faults.',
            signal: 'Traceable / release-ready',
          },
          {
            id: 'instrument-code-count',
            label: 'Confirm that codes change with pressure',
            detail:
              'Shows basic function but provides no quantified accuracy or uncertainty.',
            signal: 'Functional / uncalibrated',
          },
        ],
      },
    ],
  },
  'Electrical Machines Engineer': {
    role: 'Electrical Machines Engineer',
    title: '480 V control transformer review',
    brief:
      'A 1 kVA control transformer must convert a 480 V, 60 Hz plant supply to 120 V for contactors, relays, and a small controller. The load has a high inrush component during startup.',
    constraints: [
      'Primary supply: 480 V RMS, 60 Hz',
      'Secondary requirement: 120 V RMS at 1 kVA',
      'Maximum design flux: 1.2 T at high-line voltage',
      'Expected startup inrush: up to 8 times nominal',
      'Secondary enclosure temperature limit: 80 °C',
    ],
    deliverable:
      'Defend the turns and flux margin, coordinated protection, and commissioning acceptance record.',
    labId: 'lab-transformer',
    xp: 80,
    decisions: [
      {
        id: 'machines-magnetic-design',
        title: 'Set the magnetic operating point',
        prompt:
          'Choose the winding design that provides 120 V while preserving flux margin at the highest expected primary voltage.',
        correctOptionId: 'machines-four-to-one-margin',
        explanation:
          'A 4:1 turns ratio establishes the nominal voltage conversion, while enough primary turns and core area keep peak flux below 1.2 T at high line. Ratio and volts per turn must be checked together.',
        options: [
          {
            id: 'machines-ratio-only',
            label: 'Use any 4:1 winding pair',
            detail:
              'The ratio may be correct while too few primary turns drive the core into saturation.',
            signal: 'Correct ratio / unknown flux',
          },
          {
            id: 'machines-four-to-one-margin',
            label: 'Use 4:1 turns with a high-line flux check',
            detail:
              'Meets the secondary target and verifies core area, frequency, and primary turns together.',
            signal: 'Correct ratio / bounded flux',
          },
          {
            id: 'machines-fewer-primary-turns',
            label: 'Reduce primary turns to improve regulation',
            detail:
              'Raises volts per turn and magnetizing current, increasing saturation risk.',
            signal: 'Lower copper / over-fluxed',
          },
        ],
      },
      {
        id: 'machines-protection-plan',
        title: 'Coordinate startup protection',
        prompt:
          'Select protection that tolerates normal magnetizing inrush but clears sustained winding or secondary faults.',
        correctOptionId: 'machines-coordinated-protection',
        explanation:
          'A transformer-rated time-delay primary device rides through bounded inrush, while coordinated secondary overcurrent protection clears load-side faults before winding damage accumulates.',
        options: [
          {
            id: 'machines-fast-primary',
            label: 'Use a fast fuse at nominal primary current',
            detail:
              'Likely opens during normal energization because magnetizing inrush exceeds nominal current.',
            signal: 'Fast clearing / nuisance trips',
          },
          {
            id: 'machines-coordinated-protection',
            label: 'Coordinate time-delay primary and secondary protection',
            detail:
              'Separates expected inrush, secondary faults, and upstream backup clearing.',
            signal: 'Selective / inrush-tolerant',
          },
          {
            id: 'machines-secondary-only',
            label: 'Protect only the secondary circuit',
            detail:
              'Leaves primary winding and internal faults without local overcurrent protection.',
            signal: 'Load protected / winding exposed',
          },
        ],
      },
      {
        id: 'machines-acceptance-evidence',
        title: 'Prove the transformer is ready',
        prompt:
          'Choose the commissioning record that demonstrates insulation, ratio, polarity, loss, regulation, and thermal performance.',
        correctOptionId: 'machines-complete-acceptance',
        explanation:
          'A complete record verifies insulation and winding identity before energization, then captures no-load current, loaded voltage, regulation, losses, and temperature rise at a controlled operating point.',
        options: [
          {
            id: 'machines-voltage-only',
            label: 'Check only the 120 V output',
            detail:
              'A correct voltage can coexist with excess no-load current, wrong polarity, poor insulation, or overheating.',
            signal: 'Functional / incomplete',
          },
          {
            id: 'machines-complete-acceptance',
            label: 'Run insulation, ratio, polarity, load, and thermal tests',
            detail:
              'Produces traceable evidence across electrical, magnetic, and thermal limits.',
            signal: 'Complete / release-ready',
          },
          {
            id: 'machines-nameplate-review',
            label: 'Accept the supplier nameplate',
            detail:
              'Nameplate data does not verify shipping damage, installation wiring, or actual loaded behavior.',
            signal: 'Documented / unverified',
          },
        ],
      },
    ],
  },
  'Power Systems Engineer': {
    role: 'Power Systems Engineer',
    title: 'Balanced feeder commissioning',
    brief:
      'A balanced 400 V pump feeder draws 18.2 A while delivering 7.06 kW at 0.56 lagging power factor. The commissioning target is at least 0.92.',
    constraints: [
      'Line voltage: 400 V RMS',
      'Measured current: 18.2 A balanced',
      'Real power: 7.06 kW',
      'Power-factor target: at least 0.92',
    ],
    deliverable:
      'Specify the measurement, correction stage, and commissioning acceptance record.',
    labId: 'lab-power',
    xp: 80,
    decisions: [
      {
        id: 'feeder-measurement',
        title: 'Establish the baseline',
        prompt:
          'Choose the measurement set required before changing the feeder.',
        correctOptionId: 'three-phase-baseline',
        explanation:
          'A three-phase analyzer should capture line voltage, each phase current, real and reactive power, power factor, and harmonic distortion at representative load.',
        options: [
          {
            id: 'single-current',
            label: 'Measure one phase current only',
            detail: 'Cannot prove phase balance, real power, or reactive demand.',
            signal: 'Fast / incomplete',
          },
          {
            id: 'three-phase-baseline',
            label: 'Log a synchronized three-phase power baseline',
            detail: 'Captures balance, kW, kVAR, power factor, and distortion together.',
            signal: 'Complete / traceable',
          },
          {
            id: 'nameplate-only',
            label: 'Use the motor nameplate values',
            detail: 'Rated values do not describe the present operating point.',
            signal: 'Available / indirect',
          },
        ],
      },
      {
        id: 'reactive-correction',
        title: 'Correct the reactive demand',
        prompt:
          'Select the practical first-pass correction for this measured operating point.',
        correctOptionId: 'staged-7-5-kvar',
        explanation:
          'The measured real power and power-factor change require roughly 7.4 kVAR of correction. A staged 7.5 kVAR bank is a practical starting point, subject to harmonic and switching checks.',
        options: [
          {
            id: 'fixed-2-kvar',
            label: 'Install a fixed 2 kVAR capacitor',
            detail: 'Undersized for the measured reactive demand and target.',
            signal: 'Low cost / insufficient',
          },
          {
            id: 'staged-7-5-kvar',
            label: 'Use a staged 7.5 kVAR correction bank',
            detail: 'Matches the calculated requirement and avoids fixed overcorrection at light load.',
            signal: 'Sized / controllable',
          },
          {
            id: 'larger-breaker',
            label: 'Increase the feeder breaker rating',
            detail: 'Does not reduce reactive current and may violate conductor coordination.',
            signal: 'More capacity / no correction',
          },
        ],
      },
      {
        id: 'commissioning-proof',
        title: 'Prove the correction',
        prompt:
          'Choose the acceptance record that confirms the feeder is improved and remains safe.',
        correctOptionId: 'pf-current-thd',
        explanation:
          'Acceptance should show the target power factor, lower line current, balanced phases, acceptable voltage and distortion, correct stage switching, and safe isolation records.',
        options: [
          {
            id: 'pf-only',
            label: 'Record only the final power factor',
            detail: 'Misses current reduction, balance, harmonics, and switching behavior.',
            signal: 'Targeted / incomplete',
          },
          {
            id: 'pf-current-thd',
            label: 'Record PF, current, balance, THD, and stage operation',
            detail: 'Demonstrates performance, power quality, and controlled switching.',
            signal: 'Verified / commissionable',
          },
          {
            id: 'visual-check',
            label: 'Confirm the capacitor contactor closes',
            detail: 'Shows actuation but not electrical performance or resonance risk.',
            signal: 'Visible / unmeasured',
          },
        ],
      },
    ],
  },
};

function getActivityDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getActivityDateWithOffset(offset: number, date = new Date()) {
  const shiftedDate = new Date(date);
  shiftedDate.setHours(12, 0, 0, 0);
  shiftedDate.setDate(shiftedDate.getDate() + offset);
  return shiftedDate;
}

function normalizeDailyActivityRecord(value: unknown): DailyActivityRecord | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const storedRecord = value as Record<string, unknown>;
  const readCount = (key: keyof DailyActivityRecord) => {
    const storedValue = storedRecord[key];
    return typeof storedValue === 'number' && Number.isFinite(storedValue)
      ? Math.max(0, Math.round(storedValue))
      : 0;
  };

  return {
    careerProjects: readCount('careerProjects'),
    diagnostics: readCount('diagnostics'),
    exams: readCount('exams'),
    focusMinutes: readCount('focusMinutes'),
    labMissions: readCount('labMissions'),
    questions: readCount('questions'),
    sprints: readCount('sprints'),
    xp: readCount('xp'),
  };
}

function pruneActivityHistory(history: DailyActivityHistory) {
  return Object.fromEntries(
    Object.entries(history)
      .filter(([dateKey]) => /^\d{4}-\d{2}-\d{2}$/.test(dateKey))
      .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
      .slice(-35),
  );
}

function hasDailyActivity(activity: DailyActivityRecord | undefined) {
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

function getCurrentStreak(history: DailyActivityHistory, date = new Date()) {
  let cursor = getActivityDateWithOffset(0, date);

  if (!hasDailyActivity(history[getActivityDateKey(cursor)])) {
    cursor = getActivityDateWithOffset(-1, date);
  }

  let streak = 0;
  for (let dayOffset = 0; dayOffset < 365; dayOffset += 1) {
    const dateKey = getActivityDateKey(cursor);
    if (!hasDailyActivity(history[dateKey])) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getWeeklyActivity(
  history: DailyActivityHistory,
  date = new Date(),
): WeeklyActivityDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = getActivityDateWithOffset(index - 6, date);
    const dateKey = getActivityDateKey(day);

    return {
      ...(history[dateKey] ?? EMPTY_DAILY_ACTIVITY),
      dateKey,
      dayLabel: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(day),
      isToday: index === 6,
    };
  });
}

function getPlannerWeekActivity(
  history: DailyActivityHistory,
  date = new Date(),
): WeeklyPlanDay[] {
  const todayKey = getActivityDateKey(date);
  const weekStart = new Date(date);
  weekStart.setHours(12, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

  return Array.from({ length: 7 }, (_, dayIndex) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + dayIndex);
    const dateKey = getActivityDateKey(day);
    const activity = history[dateKey] ?? EMPTY_DAILY_ACTIVITY;

    return {
      challenges:
        activity.careerProjects +
        activity.diagnostics +
        activity.exams +
        activity.labMissions +
        activity.sprints,
      dateKey,
      dateLabel: new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
      }).format(day),
      dayIndex,
      dayLabel: new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
      }).format(day),
      focusMinutes: activity.focusMinutes,
      isToday: dateKey === todayKey,
      questions: activity.questions,
      xp: activity.xp,
    };
  });
}

function getLearningInsightActivity(
  history: DailyActivityHistory,
  date = new Date(),
): LearningActivityDay[] {
  const todayKey = getActivityDateKey(date);

  return Array.from({ length: 35 }, (_, index) => {
    const day = getActivityDateWithOffset(index - 34, date);
    const dateKey = getActivityDateKey(day);
    const activity = history[dateKey] ?? EMPTY_DAILY_ACTIVITY;

    return {
      applied:
        activity.careerProjects +
        activity.diagnostics +
        activity.exams +
        activity.labMissions +
        activity.sprints,
      dateKey,
      dateLabel: new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
      }).format(day),
      dayLabel: new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
      }).format(day),
      focusMinutes: activity.focusMinutes,
      isToday: dateKey === todayKey,
      questions: activity.questions,
      xp: activity.xp,
    };
  });
}

function formatPlannerWeekLabel(days: WeeklyPlanDay[]) {
  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  return firstDay && lastDay
    ? `${firstDay.dateLabel} – ${lastDay.dateLabel}`
    : 'This week';
}

function clampReviewStage(value: number) {
  return Math.min(REVIEW_INTERVALS_MS.length - 1, Math.max(0, Math.round(value)));
}

function getReviewStatus(
  record: QuestionMasteryRecord | undefined,
  now: number,
): ReviewStatus {
  if (!record) {
    return 'new';
  }

  if (record.lastResult === 'wrong' || record.nextReviewAt <= now) {
    return 'due';
  }

  return record.reviewStage >= 3 ? 'strong' : 'learning';
}

function formatReviewTiming(nextReviewAt: number, now: number) {
  const remainingMs = nextReviewAt - now;

  if (remainingMs <= 0) {
    return 'Due now';
  }

  const remainingMinutes = Math.ceil(remainingMs / 60_000);
  if (remainingMinutes < 60) {
    return `In ${remainingMinutes} min`;
  }

  const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
  if (remainingHours < 24) {
    return `In ${remainingHours} hr`;
  }

  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  return `In ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
}

function getReviewPlanItems(
  questionMastery: Record<string, QuestionMasteryRecord>,
  now: number,
  includeNew: boolean,
): ReviewPlanItem[] {
  const statusPriority: Record<ReviewStatus, number> = {
    due: 0,
    new: 1,
    learning: 2,
    strong: 3,
  };

  const items = lessonQuestions.map((question, questionIndex) => {
    const record = questionMastery[question.id];
    const status = getReviewStatus(record, now);
    const accuracy =
      !record || record.attempts === 0
        ? null
        : Math.round((record.correct / record.attempts) * 100);
    const strength =
      record === undefined
        ? 0
        : Math.min(
            100,
            Math.round(record.reviewStage * 17 + (accuracy ?? 0) * 0.15),
          );
    const dueLabel =
      record === undefined
        ? 'Not started'
        : formatReviewTiming(record.nextReviewAt, now);
    const reason =
      record === undefined
        ? 'New coverage'
        : record.lastResult === 'wrong'
          ? record.lastConfidence === 'sure'
            ? 'High-confidence miss'
            : 'Recent miss'
          : status === 'due'
            ? 'Review interval reached'
            : status === 'learning'
              ? `${record.streak} correct in a row`
              : `Stage ${record.reviewStage} retention`;

    return {
      accuracy,
      dueLabel,
      question,
      questionIndex,
      reason,
      status,
      strength,
    };
  });

  const eligibleItems = includeNew
    ? items
    : items.filter((item) => item.status !== 'new');
  const selectionPool = eligibleItems.length > 0 ? eligibleItems : items;

  return selectionPool.sort((left, right) => {
    const leftRecord = questionMastery[left.question.id];
    const rightRecord = questionMastery[right.question.id];

    return (
      statusPriority[left.status] - statusPriority[right.status] ||
      Number(
        rightRecord?.lastResult === 'wrong' &&
          rightRecord.lastConfidence === 'sure',
      ) -
        Number(
          leftRecord?.lastResult === 'wrong' &&
            leftRecord.lastConfidence === 'sure',
        ) ||
      Number(rightRecord?.lastResult === 'wrong') -
        Number(leftRecord?.lastResult === 'wrong') ||
      (leftRecord?.reviewStage ?? 0) - (rightRecord?.reviewStage ?? 0) ||
      (left.accuracy ?? 0) - (right.accuracy ?? 0) ||
      (leftRecord?.lastAnsweredAt ?? 0) - (rightRecord?.lastAnsweredAt ?? 0) ||
      left.question.difficulty - right.question.difficulty ||
      left.questionIndex - right.questionIndex
    );
  });
}

function getUpdatedQuestionMastery(
  previousRecord: QuestionMasteryRecord | undefined,
  result: QuestionResult,
  answeredAt: number,
  confidence: AnswerConfidence | null = null,
): QuestionMasteryRecord {
  const attempts = (previousRecord?.attempts ?? 0) + 1;
  const correct =
    (previousRecord?.correct ?? 0) + Number(result === 'correct');
  const reviewStage =
    result === 'correct'
      ? confidence === 'guess'
        ? clampReviewStage((previousRecord?.reviewStage ?? 0) - 1)
        : clampReviewStage((previousRecord?.reviewStage ?? 0) + 1)
      : 0;

  return {
    attempts,
    correct,
    highConfidenceMisses:
      (previousRecord?.highConfidenceMisses ?? 0) +
      Number(result === 'wrong' && confidence === 'sure'),
    lastConfidence: confidence,
    lastAnsweredAt: answeredAt,
    lastResult: result,
    nextReviewAt:
      result === 'correct'
        ? answeredAt + REVIEW_INTERVALS_MS[reviewStage]
        : answeredAt,
    reviewStage,
    streak: result === 'correct' ? (previousRecord?.streak ?? 0) + 1 : 0,
  };
}

function getConfidenceFeedback(
  confidence: AnswerConfidence,
  result: QuestionResult,
) {
  if (confidence === 'sure') {
    return result === 'correct'
      ? { label: 'Confidence matched', tone: 'aligned' as const }
      : { label: 'Priority review added', tone: 'caution' as const };
  }

  if (confidence === 'guess') {
    return result === 'correct'
      ? { label: 'Correct guess · review sooner', tone: 'caution' as const }
      : { label: 'Uncertainty spotted', tone: 'aligned' as const };
  }

  return result === 'correct'
    ? { label: 'Understanding is forming', tone: 'neutral' as const }
    : { label: 'Useful review signal', tone: 'neutral' as const };
}

function getPracticeQuestionIndices(
  mode: PracticeMode,
  bookmarkedQuestionIds: string[],
  questionMastery: Record<string, QuestionMasteryRecord>,
  now = Date.now(),
) {
  return lessonQuestions.reduce<number[]>((indices, question, index) => {
    const mastery = questionMastery[question.id];
    const isIncluded =
      mode === 'path' ||
      mode === 'mixed' ||
      (mode === 'saved' && bookmarkedQuestionIds.includes(question.id)) ||
      (mode === 'review' &&
        mastery !== undefined &&
        (mastery.lastResult === 'wrong' || mastery.nextReviewAt <= now));

    if (isIncluded) {
      indices.push(index);
    }

    return indices;
  }, []);
}

function getAdaptiveQuestionIndices(
  skillId: string,
  questionMastery: Record<string, QuestionMasteryRecord>,
) {
  const priorityTopics = SKILL_TOPIC_PRIORITY[skillId] ?? [];
  const now = Date.now();

  return lessonQuestions
    .map((question, index) => {
      const topicRank = priorityTopics.indexOf(question.topic);
      const mastery = questionMastery[question.id];
      const topicScore = topicRank >= 0 ? topicRank * 12 : 100;
      const reviewScore =
        mastery &&
        (mastery.lastResult === 'wrong' || mastery.nextReviewAt <= now)
          ? -24
          : 0;
      const familiarityScore = (mastery?.attempts ?? 0) * 3;

      return {
        index,
        score: topicScore + reviewScore + familiarityScore,
      };
    })
    .sort((left, right) => left.score - right.score || left.index - right.index)
    .map((item) => item.index);
}

function getNextLabMissionId(labId: string, completedMissionIds: string[]) {
  const labMissions = LAB_MISSIONS.filter((mission) => mission.labId === labId);
  return (
    labMissions.find((mission) => !completedMissionIds.includes(mission.id))?.id ??
    labMissions[0]?.id ??
    LAB_MISSIONS[0].id
  );
}

function getBankCollectionForTopic(topic: string) {
  return (
    BANK_COLLECTIONS.find((collection) => collection.topics.includes(topic)) ??
    BANK_COLLECTIONS[0]
  );
}

const FORMULA_LIBRARY: FormulaEntry[] = [
  ...lessonQuestions.map((question) => ({
    assumptions: question.assumptions,
    collectionId: getBankCollectionForTopic(question.topic).id,
    context: question.careerContext,
    difficulty: question.difficulty,
    formula: question.formula,
    id: `question:${question.id}`,
    source: 'question' as const,
    sourceId: question.id,
    subtitle: question.topic,
    title: question.subtopic,
  })),
  ...labScenarios.map((lab) => ({
    assumptions: lab.assumptions,
    collectionId:
      lab.id === 'lab-power' ||
      lab.id === 'lab-mosfet' ||
      lab.id === 'lab-transformer'
        ? ('power' as const)
        : lab.id === 'lab-bjt' ||
            lab.id === 'lab-digital' ||
            lab.id === 'lab-opamp'
          ? ('hardware' as const)
        : lab.id === 'lab-filter' ||
            lab.id === 'lab-adc' ||
            lab.id === 'lab-pid' ||
            lab.id === 'lab-resonance' ||
            lab.id === 'lab-transmission'
          ? ('signals' as const)
          : ('circuits' as const),
    context: `${lab.metric}: ${lab.result}`,
    difficulty: null,
    formula: lab.formula,
    id: `lab:${lab.id}`,
    source: 'lab' as const,
    sourceId: lab.id,
    subtitle: lab.topic,
    title: lab.title,
  })),
];

function getBankTopicState(record?: QuestionMasteryRecord): BankTopicState {
  if (!record) {
    return 'new';
  }

  const accuracy = record.attempts === 0 ? 0 : (record.correct / record.attempts) * 100;
  if (record.lastResult === 'wrong') {
    return 'review';
  }

  return accuracy >= 80 ? 'mastered' : 'practiced';
}

function getCustomSessionQuestionIndices(
  config: CustomSessionConfig,
  questionMastery: Record<string, QuestionMasteryRecord>,
) {
  const difficultyRange = CUSTOM_SESSION_DIFFICULTIES.find(
    (difficulty) => difficulty.id === config.difficulty,
  )?.range;
  const statePriority: Record<BankTopicState, number> = {
    review: 0,
    new: 1,
    practiced: 2,
    mastered: 3,
  };

  return lessonQuestions
    .map((question, index) => ({ index, question }))
    .filter(({ question }) => {
      const collectionMatches =
        config.collectionId === 'all' ||
        getBankCollectionForTopic(question.topic).id === config.collectionId;
      const difficultyMatches =
        difficultyRange === null ||
        difficultyRange === undefined ||
        (question.difficulty >= difficultyRange[0] &&
          question.difficulty <= difficultyRange[1]);

      return collectionMatches && difficultyMatches;
    })
    .sort((left, right) => {
      if (config.prioritizeReview) {
        const leftRecord = questionMastery[left.question.id];
        const rightRecord = questionMastery[right.question.id];
        const stateDifference =
          statePriority[getBankTopicState(leftRecord)] -
          statePriority[getBankTopicState(rightRecord)];

        if (stateDifference !== 0) {
          return stateDifference;
        }

        const attemptDifference =
          (leftRecord?.attempts ?? 0) - (rightRecord?.attempts ?? 0);
        if (attemptDifference !== 0) {
          return attemptDifference;
        }
      }

      return (
        left.question.difficulty - right.question.difficulty ||
        left.index - right.index
      );
    })
    .map(({ index }) => index);
}

function getCareerReadiness(
  career: CareerTrack,
  skillProgress: Record<string, number>,
  completedLabMissionIds: string[],
  practiceAccuracy: number | null,
  lastSprintSummary: SprintSummary | null,
  careerProjectRecords: Record<string, CareerProjectRecord>,
): CareerReadiness {
  const fallbackSkill = skillNodes[0];
  const fallbackProfile: CareerProfile = {
    labId: labScenarios[0]?.id ?? 'lab-ohms',
    labLabel: labScenarios[0]?.title ?? "Ohm's Law Bench",
    projectDescription:
      'Build and verify a foundational engineering measurement.',
    projectTitle: 'Foundations verification',
    role: career.role,
    skills: [
      {
        id: fallbackSkill.id,
        label: fallbackSkill.title,
        weight: 1,
      },
    ],
  };
  const requestedProfile = CAREER_PROFILES[career.role];
  const firstValidProfile = Object.values(CAREER_PROFILES).find(
    (candidate) =>
      candidate &&
      Array.isArray(candidate.skills) &&
      candidate.skills.length > 0,
  );
  const profile =
    requestedProfile &&
    Array.isArray(requestedProfile.skills) &&
    requestedProfile.skills.length > 0
      ? requestedProfile
      : firstValidProfile ?? fallbackProfile;
  const profileSkills =
    Array.isArray(profile.skills) && profile.skills.length > 0
      ? profile.skills
      : fallbackProfile.skills;
  const skills = profileSkills.map((profileSkill) => {
    const skill = skillNodes.find((candidate) => candidate.id === profileSkill.id) ?? skillNodes[0];

    return {
      id: skill.id,
      label: profileSkill.label,
      progress: skillProgress[skill.id] ?? skill.progress,
      status: skill.status,
      title: skill.title,
    };
  });
  const skillScore = Math.round(
    profileSkills.reduce((score, profileSkill) => {
      const skill = skillNodes.find((candidate) => candidate.id === profileSkill.id);
      return score + (skillProgress[profileSkill.id] ?? skill?.progress ?? 0) * profileSkill.weight;
    }, 0),
  );
  const labMissions = LAB_MISSIONS.filter((mission) => mission.labId === profile.labId);
  const labCompleted = labMissions.filter((mission) =>
    completedLabMissionIds.includes(mission.id),
  ).length;
  const labScore =
    labMissions.length === 0 ? 0 : Math.round((labCompleted / labMissions.length) * 100);
  const practiceScore = practiceAccuracy ?? 0;
  const sprintScore =
    lastSprintSummary === null
      ? 0
      : Math.round((lastSprintSummary.correct / lastSprintSummary.total) * 100);
  const projectRecord = careerProjectRecords[career.role];
  const projectCompleted = projectRecord?.completedAt !== null &&
    projectRecord?.completedAt !== undefined;
  const projectScore = projectCompleted ? projectRecord.score : 0;
  const focusSkill =
    [...skills]
      .filter((skill) => skill.status !== 'Locked')
      .sort((left, right) => left.progress - right.progress)[0] ?? skills[0];
  const score = Math.min(
    100,
    Math.round(
      skillScore * 0.68 +
        labScore * 0.16 +
        practiceScore * 0.1 +
        sprintScore * 0.06 +
        projectScore * 0.1,
    ),
  );

  return {
    focusSkill,
    labCompleted,
    labScore,
    labTotal: labMissions.length,
    practiceScore,
    profile,
    projectCompleted,
    projectScore,
    role: career.role,
    score,
    skillScore,
    skills,
    sprintCompleted: lastSprintSummary !== null,
    sprintScore,
  };
}

function getCareerReadinessLabel(score: number) {
  if (score >= 75) {
    return 'Role ready';
  }

  if (score >= 50) {
    return 'Advancing';
  }

  return 'Building';
}

function getPortfolioEvidence({
  careerProjectRecords,
  completedBankDiagnosticIds,
  completedFaultCaseIds,
  completedLabMissionIds,
  formulaConfidence,
  savedCircuitDesigns,
  savedFormulaIds,
}: {
  careerProjectRecords: Record<string, CareerProjectRecord>;
  completedBankDiagnosticIds: string[];
  completedFaultCaseIds: string[];
  completedLabMissionIds: string[];
  formulaConfidence: Record<string, FormulaConfidence>;
  savedCircuitDesigns: CircuitDesign[];
  savedFormulaIds: string[];
}) {
  const projectEvidence: PortfolioEvidence[] = Object.entries(
    careerProjectRecords,
  ).flatMap(([role, record]) => {
    const project = CAREER_PROJECTS[role];
    const profile = CAREER_PROFILES[role];

    if (!project || !profile || record.completedAt === null) {
      return [];
    }

    return [
      {
        description: project.deliverable,
        id: `project:${role}`,
        kind: 'project',
        metric: `${record.score}% review score`,
        skills: profile.skills.map((skill) => skill.label),
        sourceId: role,
        subtitle: role,
        timestamp: record.completedAt,
        title: project.title,
      } satisfies PortfolioEvidence,
    ];
  });
  const labEvidence: PortfolioEvidence[] = labScenarios.flatMap((lab) => {
    const labMissions = LAB_MISSIONS.filter((mission) => mission.labId === lab.id);
    const labFaults = LAB_FAULT_CASES.filter(
      (faultCase) => faultCase.labId === lab.id,
    );
    const completedMissions = labMissions.filter((mission) =>
      completedLabMissionIds.includes(mission.id),
    ).length;
    const completedFaults = labFaults.filter((faultCase) =>
      completedFaultCaseIds.includes(faultCase.id),
    ).length;
    const completedTasks = completedMissions + completedFaults;
    const totalTasks = labMissions.length + labFaults.length;

    if (completedTasks === 0) {
      return [];
    }

    return [
      {
        description: `${completedMissions} calibration ${
          completedMissions === 1 ? 'mission' : 'missions'
        } and ${completedFaults} fault ${
          completedFaults === 1 ? 'diagnosis' : 'diagnoses'
        } completed on the live bench.`,
        id: `lab:${lab.id}`,
        kind: 'lab',
        metric: `${completedTasks}/${totalTasks} bench tasks`,
        skills: [lab.topic, lab.metric, 'Measurement judgment'],
        sourceId: lab.id,
        subtitle: lab.topic,
        title: lab.title,
      } satisfies PortfolioEvidence,
    ];
  });
  const circuitEvidence: PortfolioEvidence[] = savedCircuitDesigns.map(
    (design) => ({
      description: `Validated ${design.mode} ${design.voltage} V network with ${
        design.resistors.length
      } ${design.resistors.length === 1 ? 'resistor' : 'resistors'} and live component power checks.`,
      id: `circuit:${design.id}`,
      kind: 'circuit',
      metric: `${design.voltage} V · ${design.resistors.length}R`,
      skills: [
        'DC circuit analysis',
        'Component selection',
        `${design.mode[0].toUpperCase()}${design.mode.slice(1)} networks`,
      ],
      sourceId: design.id,
      subtitle: 'Circuit Workbench',
      timestamp: design.savedAt,
      title: design.name,
    }),
  );
  const diagnosticEvidence: PortfolioEvidence[] =
    completedBankDiagnosticIds.flatMap((diagnosticId) => {
      const collection = BANK_COLLECTIONS.find(
        (candidate) => candidate.id === diagnosticId,
      );

      if (!collection) {
        return [];
      }

      return [
        {
          description: collection.description,
          id: `diagnostic:${collection.id}`,
          kind: 'diagnostic',
          metric: 'Diagnostic complete',
          skills: collection.topics.slice(0, 3),
          sourceId: collection.id,
          subtitle: 'Question Bank',
          title: `${collection.label} diagnostic`,
        } satisfies PortfolioEvidence,
      ];
    });
  const formulaEvidence: PortfolioEvidence[] = FORMULA_LIBRARY.filter(
    (entry) =>
      savedFormulaIds.includes(entry.id) &&
      formulaConfidence[entry.id] === 'ready',
  ).map((entry) => ({
    description: `${entry.formula} · ${entry.assumptions}`,
    id: `formula:${entry.id}`,
    kind: 'formula',
    metric: 'Recall ready',
    skills: [
      entry.subtitle,
      BANK_COLLECTIONS.find(
        (collection) => collection.id === entry.collectionId,
      )?.label ?? 'Engineering foundations',
    ],
    sourceId: entry.id,
    subtitle: entry.subtitle,
    title: entry.title,
  }));
  const kindPriority: Record<PortfolioEvidence['kind'], number> = {
    project: 0,
    lab: 1,
    circuit: 2,
    diagnostic: 3,
    formula: 4,
  };

  return [
    ...projectEvidence,
    ...labEvidence,
    ...circuitEvidence,
    ...diagnosticEvidence,
    ...formulaEvidence,
  ].sort(
    (left, right) =>
      (right.timestamp ?? 0) - (left.timestamp ?? 0) ||
      kindPriority[left.kind] - kindPriority[right.kind] ||
      left.title.localeCompare(right.title),
  );
}

function createStudyRoute(
  config: StudyRouteConfig,
  {
    adaptiveSkill,
    adaptiveSkillProgress,
    portfolioEvidenceCount,
    readyFormulaCount,
    reviewCount,
    savedCircuitCount,
    tunedCareerReadiness,
  }: {
    adaptiveSkill: SkillNode;
    adaptiveSkillProgress: number;
    portfolioEvidenceCount: number;
    readyFormulaCount: number;
    reviewCount: number;
    savedCircuitCount: number;
    tunedCareerReadiness: CareerReadiness;
  },
): StudyRoute {
  type StepSeed = Omit<StudyRouteStep, 'id' | 'minutes'>;

  const reviewStep: StepSeed = {
    action: 'review',
    detail:
      reviewCount > 0
        ? `${reviewCount} questions are due. Start with the highest-priority memory checks.`
        : 'Preview the next retention queue and include a few new questions.',
    title:
      reviewCount > 0
        ? `Clear ${Math.min(5, reviewCount)} due review questions`
        : 'Build the next review queue',
  };
  const practiceStep: StepSeed = {
    action: 'practice',
    detail: `${adaptiveSkill.title} is currently at ${adaptiveSkillProgress}% mastery and is the best available skill to strengthen next.`,
    sourceId: adaptiveSkill.id,
    title: `Strengthen ${adaptiveSkill.title}`,
  };
  const labStep: StepSeed = {
    action: 'lab',
    detail: `Use the live controls and measurement checks tied to ${tunedCareerReadiness.role}.`,
    sourceId: tunedCareerReadiness.profile.labId,
    title: `Calibrate ${tunedCareerReadiness.profile.labLabel}`,
  };
  const careerStep: StepSeed = {
    action: 'career',
    detail: `Review the weakest role signal and the next evidence step at ${tunedCareerReadiness.score}% readiness.`,
    sourceId: tunedCareerReadiness.role,
    title: `Advance the ${tunedCareerReadiness.role} roadmap`,
  };
  const portfolioStep: StepSeed = {
    action: 'portfolio',
    detail:
      portfolioEvidenceCount > 0
        ? `Refine one of ${portfolioEvidenceCount} evidence items or strengthen its reflection.`
        : 'Inspect the evidence requirements and choose the next activity that can fill a portfolio slot.',
    title: 'Shape career evidence',
  };
  const notebookStep: StepSeed = {
    action: 'notebook',
    detail:
      readyFormulaCount > 0
        ? `${readyFormulaCount} formulas are recall-ready. Rehearse the assumptions that make them valid.`
        : 'Save and rehearse one governing relationship from recent work.',
    title: 'Run formula recall',
  };
  const sprintStep: StepSeed = {
    action: 'sprint',
    detail: `Use a five-question adaptive challenge centered on ${adaptiveSkill.title}.`,
    sourceId: adaptiveSkill.id,
    title: 'Run a focused Power Sprint',
  };
  const workbenchStep: StepSeed = {
    action: 'workbench',
    detail:
      savedCircuitCount > 0
        ? `Reopen one of ${savedCircuitCount} validated designs and test a new topology or source voltage.`
        : 'Build and validate a series or parallel resistor network.',
    title: 'Prototype in Circuit Workbench',
  };
  const routeSeeds: Record<StudyRouteConfig['goal'], StepSeed[]> = {
    balanced:
      config.pace === 'challenge'
        ? [sprintStep, reviewStep, labStep, portfolioStep]
        : [reviewStep, practiceStep, labStep, portfolioStep],
    career:
      config.pace === 'challenge'
        ? [sprintStep, practiceStep, portfolioStep, careerStep]
        : [careerStep, practiceStep, labStep, portfolioStep],
    lab:
      config.pace === 'challenge'
        ? [labStep, workbenchStep, sprintStep, practiceStep]
        : [labStep, workbenchStep, notebookStep, practiceStep],
    review:
      config.pace === 'challenge'
        ? [reviewStep, sprintStep, practiceStep, notebookStep]
        : [reviewStep, practiceStep, notebookStep, labStep],
  };
  const stepCount = config.duration === 10 ? 2 : config.duration === 20 ? 3 : 4;
  const selectedSeeds = routeSeeds[config.goal].slice(0, stepCount);
  const baseMinutes = Math.floor(config.duration / stepCount);
  const extraMinutes = config.duration - baseMinutes * stepCount;
  const createdAt = Date.now();
  const routeId = `study-route-${createdAt}`;
  const steps = selectedSeeds.map((seed, index) => ({
    ...seed,
    id: `${routeId}-step-${index + 1}`,
    minutes: baseMinutes + Number(index < extraMinutes),
  }));

  return {
    completedAt: null,
    completedStepIds: [],
    config,
    createdAt,
    earnedXp: 0,
    id: routeId,
    openedStepIds: [],
    steps,
  };
}

function playFeedbackTone(result: QuestionResult) {
  try {
    const audioContext = new window.AudioContext();
    const startTime = audioContext.currentTime;
    const notes = result === 'correct' ? [523.25, 659.25] : [220, 174.61];

    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const noteStart = startTime + index * 0.11;

      oscillator.type = result === 'correct' ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.08, noteStart + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.16);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + 0.17);
    });

    window.setTimeout(() => {
      void audioContext.close();
    }, 450);
  } catch {
    // Audio feedback is optional; visual feedback remains available.
  }
}

const sectionTitles: Record<AppSection, string> = {
  learn: 'Engineering Foundations',
  practice: 'Practice Session',
  labs: 'Engineering Labs',
  atlas: 'Electrical Engineering Atlas',
  careers: 'Career Map',
  bank: 'Question Bank',
  notebook: 'Engineering Notebook',
};

const sectionEyebrows: Record<AppSection, string> = {
  learn: 'ZyloXP / Skill Path',
  practice: 'ZyloXP / Adaptive Practice',
  labs: 'ZyloXP / Interactive Bench',
  atlas: 'ZyloXP / Explore + Play',
  careers: 'ZyloXP / Career Signals',
  bank: 'ZyloXP / Verified Collection',
  notebook: 'ZyloXP / Field Journal',
};

const sectionDescriptions: Record<AppSection, string> = {
  learn:
    'Build technical confidence through short lessons, practical labs, and career-linked progress.',
  practice:
    'Strengthen recall with adaptive questions, focused review, and confidence checks.',
  labs:
    'Open an interactive bench, change one variable at a time, and test your prediction.',
  atlas:
    'Explore the full electrical engineering landscape through live diagrams, concept maps, and playable challenges.',
  careers:
    'Turn completed skills and project evidence into a clearer path toward technical roles.',
  bank:
    'Browse verified topics and launch a focused diagnostic from the question collection.',
  notebook:
    'Organize your Study List, notes, formulas, saved questions, and repeatable lab setups in one learning library.',
};

const skillStatusClass: Record<SkillNode['status'], string> = {
  Current: 'statusCurrent',
  Unlocked: 'statusUnlocked',
  Locked: 'statusLocked',
};

const onboardingSteps: Array<{
  description: string;
  diagram: string;
  eyebrow: string;
  guide: string[];
  metric: string;
  mood: ZyGuideMood;
  points: string[];
  title: string;
}> = [
  {
    eyebrow: 'ZyloXP',
    title: 'Learn engineering like a daily game.',
    description:
      'ZyloXP turns technical careers into short lessons, XP, streaks, and skill paths. Start with core engineering foundations, then grow into more fields over time.',
    diagram: '/question-bank/images/IMG-0001.svg',
    metric: `${bankSummary.totalQuestions.toLocaleString()} prompts ready`,
    guide: [
      'I turn big technical ideas into one clear mission at a time.',
      'Your streak grows when you practice, test, and revisit a skill.',
    ],
    mood: 'idle',
    points: ['Short skill bites', 'XP, hearts, and streaks', 'Beginner-friendly foundations'],
  },
  {
    eyebrow: 'Practice + Labs',
    title: 'Move from answers to intuition.',
    description:
      'Answer quick prompts, then open lab mode to see the same idea with diagrams, sliders, and engineering checks.',
    diagram: '/question-bank/images/IMG-1876.svg',
    metric: `${bankSummary.svgDiagrams.toLocaleString()} visual diagrams`,
    guide: [
      'Change one lab value at a time and watch the relationship respond.',
      'A diagram becomes useful when you can predict what changes next.',
    ],
    mood: 'focus',
    points: ["Ohm's law bench", 'RC timing practice', 'Power and signal concepts'],
  },
  {
    eyebrow: 'Career Map',
    title: 'Connect every skill to a real role.',
    description:
      'Your progress points toward tracks like embedded systems, electronics design, power systems, and hardware testing.',
    diagram: '/question-bank/images/IMG-3751.svg',
    metric: 'Career-linked XP',
    guide: [
      'Every completed skill strengthens a real career signal.',
      'I will keep your next step close to the work you want to do.',
    ],
    mood: 'celebrate',
    points: ['Role-matched lessons', 'Skill signals', 'Next-step recommendations'],
  },
];

const sectionGuideContent: Record<
  AppSection,
  { label: string; messages: string[]; mood: ZyGuideMood }
> = {
  learn: {
    label: 'Zy / Path coach',
    messages: [
      'Core foundations is 72% charged. One short lesson can move it forward.',
      'Start with the current node, then use the lab to make the idea stick.',
      'Your embedded-systems signal is strongest when concepts and labs move together.',
    ],
    mood: 'idle',
  },
  practice: {
    label: 'Zy / Practice coach',
    messages: [
      'Check the units before the numbers. They often reveal the right relationship.',
      'A wrong answer is still useful data: find the assumption that changed the result.',
      'Use the diagram as evidence, then make your choice.',
    ],
    mood: 'focus',
  },
  labs: {
    label: 'Zy / Lab coach',
    messages: [
      'Move one control at a time so cause and effect stays visible.',
      'Predict the meter first, then use the slider to test your model.',
      'The strongest lab habit is explaining why the result changed.',
    ],
    mood: 'focus',
  },
  atlas: {
    label: 'Zy / Atlas guide',
    messages: [
      'Pick a domain, move the controls, and watch the engineering relationship respond.',
      'The games turn equations into targets, waveforms, timing decisions, and design tradeoffs.',
      'Follow related concepts when you want to see how one electrical idea connects to another.',
    ],
    mood: 'focus',
  },
  careers: {
    label: 'Zy / Career coach',
    messages: [
      'Your active path turns practice into a growing role-match signal.',
      'Tune the path to a role and I will keep related skills near the top.',
      'Career confidence grows from evidence: lessons, labs, and repeated checks.',
    ],
    mood: 'celebrate',
  },
  bank: {
    label: 'Zy / Bank guide',
    messages: [
      `Question bank v${bankSummary.contentVersion} is verified across ${bankSummary.topicCount} topics.`,
      'Open any topic to jump directly into a representative checked question.',
      'Levels 1 through 25 let you move from recall to deeper engineering judgment.',
    ],
    mood: 'focus',
  },
  notebook: {
    label: 'Zy / Recall coach',
    messages: [
      'Keep the prompt, formula, and bench setup that made an idea finally click.',
      'Saved questions are strongest when you return before the answer feels automatic.',
      'A good bench record makes the next experiment start with a better question.',
    ],
    mood: 'focus',
  },
};

function readStoredSession() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    if (window.localStorage.getItem(AUTH_SESSION_KEY) === 'active') {
      return true;
    }
  } catch {
    // Session storage may still be available when persistent storage is blocked.
  }

  try {
    return window.sessionStorage.getItem(AUTH_SESSION_KEY) === 'active';
  } catch {
    return false;
  }
}

function readStoredRememberSession() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(AUTH_SESSION_KEY) === 'active';
  } catch {
    return false;
  }
}

function formatAppLockVerificationFailure(
  result: LocalAppLockVerificationResult,
) {
  const remainingMs = result.blockedUntil - Date.now();
  if (remainingMs > 0) {
    const seconds = Math.max(1, Math.ceil(remainingMs / 1000));
    const duration =
      seconds >= 60
        ? `${Math.ceil(seconds / 60)} ${
            Math.ceil(seconds / 60) === 1 ? 'minute' : 'minutes'
          }`
        : `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
    return `Retry protection is active. Try again in ${duration}.`;
  }

  return `The current PIN is wrong. ${result.attemptsRemaining} ${
    result.attemptsRemaining === 1 ? 'attempt remains' : 'attempts remain'
  } before a delay.`;
}

function normalizeLearnerProfile(value: unknown): LearnerProfile {
  const fallback: LearnerProfile = {
    displayName: 'Zylo Learner',
    email: '',
  };

  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const profile = value as Partial<LearnerProfile>;
  const displayName =
    typeof profile.displayName === 'string'
      ? profile.displayName.trim().slice(0, 60)
      : '';
  const email =
    typeof profile.email === 'string'
      ? profile.email.trim().slice(0, 120)
      : '';

  return {
    displayName: displayName || fallback.displayName,
    email,
  };
}

function getLearnerInitials(displayName: string) {
  const nameParts = displayName.trim().split(/\s+/).filter(Boolean);

  if (nameParts.length === 0) {
    return 'ZL';
  }

  const firstInitial = nameParts[0].charAt(0);
  const secondInitial =
    nameParts.length > 1
      ? nameParts[nameParts.length - 1].charAt(0)
      : nameParts[0].charAt(1);

  return `${firstInitial}${secondInitial || ''}`.toUpperCase();
}

function readPreferredReducedMotion() {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readOnlineStatus() {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

function readStandaloneStatus() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const standaloneNavigator = navigator as Navigator & {
    standalone?: boolean;
  };
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    standaloneNavigator.standalone === true
  );
}

function readLastSavedAt() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedTimestamp = Number(
      window.localStorage.getItem(SAVE_META_STORAGE_KEY),
    );
    return Number.isFinite(storedTimestamp) && storedTimestamp > 0
      ? storedTimestamp
      : null;
  } catch {
    return null;
  }
}

function formatSavedAt(timestamp: number | null) {
  if (timestamp === null) {
    return 'Waiting for the first local save';
  }

  return `Saved at ${new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp)}`;
}

function normalizeStoredStudyRoute(value: unknown): StudyRoute | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const storedRoute = value as Partial<StudyRoute>;
  const storedConfig =
    storedRoute.config && typeof storedRoute.config === 'object'
      ? storedRoute.config
      : null;
  const duration =
    storedConfig?.duration === 10 ||
    storedConfig?.duration === 20 ||
    storedConfig?.duration === 30
      ? storedConfig.duration
      : null;
  const goal =
    storedConfig?.goal === 'balanced' ||
    storedConfig?.goal === 'career' ||
    storedConfig?.goal === 'lab' ||
    storedConfig?.goal === 'review'
      ? storedConfig.goal
      : null;
  const pace =
    storedConfig?.pace === 'challenge' || storedConfig?.pace === 'steady'
      ? storedConfig.pace
      : null;
  const validActions = new Set<StudyRouteStep['action']>([
    'career',
    'lab',
    'notebook',
    'portfolio',
    'practice',
    'review',
    'sprint',
    'workbench',
  ]);

  if (
    typeof storedRoute.id !== 'string' ||
    storedRoute.id.length === 0 ||
    storedRoute.id.length > 180 ||
    duration === null ||
    goal === null ||
    pace === null ||
    !Array.isArray(storedRoute.steps)
  ) {
    return null;
  }

  const steps = storedRoute.steps.slice(0, 4).flatMap((storedStep) => {
    if (
      !storedStep ||
      typeof storedStep !== 'object' ||
      typeof storedStep.id !== 'string' ||
      storedStep.id.length === 0 ||
      storedStep.id.length > 180 ||
      typeof storedStep.title !== 'string' ||
      storedStep.title.length === 0 ||
      typeof storedStep.detail !== 'string' ||
      !validActions.has(storedStep.action) ||
      typeof storedStep.minutes !== 'number' ||
      !Number.isFinite(storedStep.minutes)
    ) {
      return [];
    }

    return [
      {
        action: storedStep.action,
        detail: storedStep.detail.slice(0, 260),
        id: storedStep.id,
        minutes: Math.min(30, Math.max(1, Math.round(storedStep.minutes))),
        sourceId:
          typeof storedStep.sourceId === 'string'
            ? storedStep.sourceId.slice(0, 180)
            : undefined,
        title: storedStep.title.slice(0, 120),
      } satisfies StudyRouteStep,
    ];
  });

  if (steps.length === 0) {
    return null;
  }

  const validStepIds = new Set(steps.map((step) => step.id));
  const readStepIds = (stepIds: unknown) =>
    Array.isArray(stepIds)
      ? [
          ...new Set(
            stepIds.filter(
              (stepId): stepId is string =>
                typeof stepId === 'string' && validStepIds.has(stepId),
            ),
          ),
        ]
      : [];
  const completedStepIds = readStepIds(storedRoute.completedStepIds);
  const openedStepIds = readStepIds(storedRoute.openedStepIds);
  const completedAt =
    completedStepIds.length === steps.length &&
    typeof storedRoute.completedAt === 'number' &&
    Number.isFinite(storedRoute.completedAt)
      ? Math.max(0, storedRoute.completedAt)
      : null;

  return {
    completedAt,
    completedStepIds,
    config: {
      duration,
      goal,
      pace,
    },
    createdAt:
      typeof storedRoute.createdAt === 'number' &&
      Number.isFinite(storedRoute.createdAt)
        ? Math.max(0, storedRoute.createdAt)
        : 0,
    earnedXp:
      completedAt !== null &&
      typeof storedRoute.earnedXp === 'number' &&
      Number.isFinite(storedRoute.earnedXp)
        ? Math.max(0, Math.round(storedRoute.earnedXp))
        : 0,
    id: storedRoute.id,
    openedStepIds,
    steps,
  };
}

function normalizeStoredWeeklyPlan(value: unknown): WeeklyPlan | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const storedPlan = value as Partial<WeeklyPlan>;
  const preset =
    storedPlan.preset === 'balanced' ||
    storedPlan.preset === 'career' ||
    storedPlan.preset === 'momentum'
      ? storedPlan.preset
      : null;
  const minutesPerDay =
    storedPlan.minutesPerDay === 15 ||
    storedPlan.minutesPerDay === 25 ||
    storedPlan.minutesPerDay === 40
      ? storedPlan.minutesPerDay
      : null;
  const studyDays = Array.isArray(storedPlan.studyDays)
    ? [
        ...new Set(
          storedPlan.studyDays.filter(
            (dayIndex): dayIndex is number =>
              typeof dayIndex === 'number' &&
              Number.isInteger(dayIndex) &&
              dayIndex >= 0 &&
              dayIndex <= 6,
          ),
        ),
      ].sort((left, right) => left - right)
    : [];
  const readTarget = (value: unknown, maximum: number) =>
    typeof value === 'number' && Number.isFinite(value)
      ? Math.min(maximum, Math.max(1, Math.round(value)))
      : null;
  const targetXp = readTarget(storedPlan.targetXp, 10_000);
  const targetQuestions = readTarget(storedPlan.targetQuestions, 1_000);
  const targetChallenges = readTarget(storedPlan.targetChallenges, 100);

  if (
    !storedPlan.weekKey ||
    !/^\d{4}-\d{2}-\d{2}$/.test(storedPlan.weekKey) ||
    preset === null ||
    minutesPerDay === null ||
    studyDays.length < 2 ||
    targetXp === null ||
    targetQuestions === null ||
    targetChallenges === null
  ) {
    return null;
  }

  return {
    createdAt:
      typeof storedPlan.createdAt === 'number' &&
      Number.isFinite(storedPlan.createdAt)
        ? Math.max(0, storedPlan.createdAt)
        : 0,
    minutesPerDay,
    preset,
    rewardClaimedAt:
      typeof storedPlan.rewardClaimedAt === 'number' &&
      Number.isFinite(storedPlan.rewardClaimedAt)
        ? Math.max(0, storedPlan.rewardClaimedAt)
        : null,
    studyDays,
    targetChallenges,
    targetQuestions,
    targetXp,
    weekKey: storedPlan.weekKey,
  };
}

function normalizeStoredCheckpointExam(
  value: unknown,
): CheckpointExamState | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const storedExam = value as Partial<CheckpointExamState>;
  const storedConfig =
    storedExam.config && typeof storedExam.config === 'object'
      ? storedExam.config
      : null;
  const domainId =
    storedConfig?.domainId === 'all' ||
    storedConfig?.domainId === 'circuits' ||
    storedConfig?.domainId === 'hardware' ||
    storedConfig?.domainId === 'power' ||
    storedConfig?.domainId === 'signals'
      ? storedConfig.domainId
      : null;
  const length =
    storedConfig?.length === 5 || storedConfig?.length === 10
      ? storedConfig.length
      : null;
  const timing =
    storedConfig?.timing === 'deep' ||
    storedConfig?.timing === 'standard' ||
    storedConfig?.timing === 'untimed'
      ? storedConfig.timing
      : null;
  const validQuestionIds = new Set(
    lessonQuestions.map((question) => question.id),
  );
  const questionIds = Array.isArray(storedExam.questionIds)
    ? [
        ...new Set(
          storedExam.questionIds.filter(
            (questionId): questionId is string =>
              typeof questionId === 'string' &&
              validQuestionIds.has(questionId),
          ),
        ),
      ].slice(0, MAX_SESSION_LENGTH)
    : [];

  if (
    typeof storedExam.id !== 'string' ||
    storedExam.id.length === 0 ||
    storedExam.id.length > 180 ||
    domainId === null ||
    length === null ||
    timing === null ||
    questionIds.length !== length
  ) {
    return null;
  }

  const storedAnswers =
    storedExam.answers && typeof storedExam.answers === 'object'
      ? storedExam.answers
      : {};
  const answers = Object.fromEntries(
    questionIds.map((questionId) => {
      const question = lessonQuestions.find(
        (candidate) => candidate.id === questionId,
      );
      const storedAnswer = storedAnswers[questionId];
      const optionIndex =
        storedAnswer &&
        typeof storedAnswer.optionIndex === 'number' &&
        Number.isInteger(storedAnswer.optionIndex) &&
        storedAnswer.optionIndex >= 0 &&
        storedAnswer.optionIndex < (question?.options.length ?? 0)
          ? storedAnswer.optionIndex
          : null;
      const confidence =
        storedAnswer?.confidence === 'low' ||
        storedAnswer?.confidence === 'medium' ||
        storedAnswer?.confidence === 'high'
          ? storedAnswer.confidence
          : null;

      return [
        questionId,
        {
          confidence,
          flagged: storedAnswer?.flagged === true,
          optionIndex,
        } satisfies CheckpointExamAnswer,
      ];
    }),
  );
  const completedAt =
    typeof storedExam.completedAt === 'number' &&
    Number.isFinite(storedExam.completedAt)
      ? Math.max(0, storedExam.completedAt)
      : null;

  return {
    answers,
    bonusXp:
      completedAt !== null &&
      typeof storedExam.bonusXp === 'number' &&
      Number.isFinite(storedExam.bonusXp)
        ? Math.max(0, Math.round(storedExam.bonusXp))
        : 0,
    completedAt,
    config: {
      domainId,
      length,
      timing,
    },
    createdAt:
      typeof storedExam.createdAt === 'number' &&
      Number.isFinite(storedExam.createdAt)
        ? Math.max(0, storedExam.createdAt)
        : 0,
    currentIndex:
      typeof storedExam.currentIndex === 'number' &&
      Number.isFinite(storedExam.currentIndex)
        ? Math.min(
            questionIds.length - 1,
            Math.max(0, Math.round(storedExam.currentIndex)),
          )
        : 0,
    earnedXp:
      completedAt !== null &&
      typeof storedExam.earnedXp === 'number' &&
      Number.isFinite(storedExam.earnedXp)
        ? Math.max(0, Math.round(storedExam.earnedXp))
        : 0,
    expiresAt:
      timing !== 'untimed' &&
      typeof storedExam.expiresAt === 'number' &&
      Number.isFinite(storedExam.expiresAt)
        ? Math.max(0, storedExam.expiresAt)
        : null,
    id: storedExam.id,
    questionIds,
    score:
      completedAt !== null &&
      typeof storedExam.score === 'number' &&
      Number.isFinite(storedExam.score)
        ? Math.min(100, Math.max(0, Math.round(storedExam.score)))
        : null,
    startedAt:
      typeof storedExam.startedAt === 'number' &&
      Number.isFinite(storedExam.startedAt)
        ? Math.max(0, storedExam.startedAt)
        : 0,
  };
}

function normalizeStoredSprintState(value: unknown): SprintState | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const storedSprint = value as Partial<SprintState>;
  const validSources = new Set<SprintSource>([
    'career',
    'custom',
    'diagnostic',
    'power',
    'recovery',
    'review',
  ]);
  const source = validSources.has(storedSprint.source as SprintSource)
    ? (storedSprint.source as SprintSource)
    : null;
  const questionIndices = Array.isArray(storedSprint.questionIndices)
    ? [
        ...new Set(
          storedSprint.questionIndices.filter(
            (questionIndex): questionIndex is number =>
              typeof questionIndex === 'number' &&
              Number.isInteger(questionIndex) &&
              questionIndex >= 0 &&
              questionIndex < lessonQuestions.length,
          ),
        ),
      ].slice(0, MAX_SESSION_LENGTH)
    : [];

  if (
    source === null ||
    questionIndices.length === 0 ||
    (storedSprint.completedAt !== null &&
      storedSprint.completedAt !== undefined)
  ) {
    return null;
  }

  const validQuestionIds = new Set(
    questionIndices.map((questionIndex) => lessonQuestions[questionIndex].id),
  );
  const seenResultIds = new Set<string>();
  const results = Array.isArray(storedSprint.results)
    ? storedSprint.results.flatMap((storedResult) => {
        if (
          !storedResult ||
          typeof storedResult !== 'object' ||
          typeof storedResult.questionId !== 'string' ||
          !validQuestionIds.has(storedResult.questionId) ||
          seenResultIds.has(storedResult.questionId) ||
          (storedResult.result !== 'correct' &&
            storedResult.result !== 'wrong' &&
            storedResult.result !== 'skipped')
        ) {
          return [];
        }

        seenResultIds.add(storedResult.questionId);
        return [
          {
            questionId: storedResult.questionId,
            result: storedResult.result,
          } satisfies SprintAnswer,
        ];
      })
    : [];
  const position =
    typeof storedSprint.position === 'number' &&
    Number.isFinite(storedSprint.position)
      ? Math.min(
          questionIndices.length - 1,
          Math.max(0, Math.round(storedSprint.position)),
        )
      : 0;
  const currentQuestion = lessonQuestions[questionIndices[position]];
  const currentQuestionWasSubmitted = results.some(
    (result) => result.questionId === currentQuestion.id,
  );
  const selectedOption =
    currentQuestionWasSubmitted &&
    typeof storedSprint.selectedOption === 'number' &&
    Number.isInteger(storedSprint.selectedOption) &&
    storedSprint.selectedOption >= 0 &&
    storedSprint.selectedOption < currentQuestion.options.length
      ? storedSprint.selectedOption
      : null;
  const answerConfidence =
    selectedOption !== null &&
    (storedSprint.answerConfidence === 'guess' ||
      storedSprint.answerConfidence === 'unsure' ||
      storedSprint.answerConfidence === 'sure')
      ? storedSprint.answerConfidence
      : null;
  const validDiagnosticIds = new Set(
    BANK_COLLECTIONS.map((collection) => collection.id),
  );

  return {
    answerConfidence,
    completedAt: null,
    diagnosticId:
      source === 'diagnostic' &&
      validDiagnosticIds.has(
        storedSprint.diagnosticId as BankCollectionId,
      )
        ? (storedSprint.diagnosticId as BankCollectionId)
        : null,
    earnedXp:
      typeof storedSprint.earnedXp === 'number' &&
      Number.isFinite(storedSprint.earnedXp)
        ? Math.max(0, Math.round(storedSprint.earnedXp))
        : 0,
    label:
      typeof storedSprint.label === 'string' &&
      storedSprint.label.trim().length > 0
        ? storedSprint.label.trim().slice(0, 80)
        : source === 'career'
          ? 'Career Sprint'
          : source === 'diagnostic'
            ? 'Domain Diagnostic'
            : source === 'recovery'
              ? 'Mistake Recovery'
              : source === 'review'
                ? 'Smart Review'
                : source === 'custom'
                  ? 'Practice Session'
                  : 'Power Sprint',
    paused: storedSprint.paused === true,
    position,
    questionIndices,
    results,
    selectedOption,
    source,
    startedAt:
      typeof storedSprint.startedAt === 'number' &&
      Number.isFinite(storedSprint.startedAt)
        ? Math.max(0, storedSprint.startedAt)
        : Date.now(),
  };
}

function readStoredLearnerState(): StoredLearnerState {
  const activityDate = getActivityDateKey();
  const defaultReducedMotion = readPreferredReducedMotion();
  const defaultSkillProgress = Object.fromEntries(
    skillNodes.map((skill) => [skill.id, skill.progress]),
  );
  const fallback: StoredLearnerState = {
    activeSprint: null,
    activityDate,
    activityHistory: {},
    bookmarkedQuestionIds: [],
    careerProjectRecords: {},
    checkpointBestScore: 0,
    checkpointExam: null,
    checkpointExamCompletionCount: 0,
    completedBankDiagnosticIds: [],
    completedFaultCaseIds: [],
    completedLabMissionIds: [],
    completedPrompts: 0,
    customSessionCompletions: 0,
    customSessionConfig: DEFAULT_CUSTOM_SESSION_CONFIG,
    currentQuestionIndex: 0,
    dailyGoal: 20,
    dailyMissionRewardDate: null,
    dailyXp: 0,
    earnedXp: 1240,
    formulaConfidence: {},
    formulaReadyRewardedIds: [],
    formulaReviewCompletions: 0,
    focusSession: null,
    focusSessionHistory: [],
    highContrastEnabled: false,
    labRunHistory: [],
    labSaveCount: 0,
    lastSprintSummary: null,
    learnerProfile: normalizeLearnerProfile(null),
    mistakeRecoveryCompletions: 0,
    mistakeReflections: {},
    portfolioFeaturedIds: [],
    portfolioHeadline: '',
    portfolioNotes: {},
    portfolioPublishCount: 0,
    practiceMode: 'path',
    practiceWithHearts: true,
    questionMastery: {},
    readingSize: 'standard',
    reducedMotionEnabled: defaultReducedMotion,
    savedCircuitDesigns: [],
    savedFormulaIds: [],
    skillProgress: defaultSkillProgress,
    soundEnabled: true,
    studyRoute: null,
    studyRouteCompletionCount: 0,
    tunedCareerRole: careerTracks[0].role,
    weeklyPlan: null,
    weeklyPlanRewardWeek: null,
    workbenchSaveCount: 0,
  };

  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const storedState = window.localStorage.getItem(LEARNER_STORAGE_KEY);
    if (!storedState) {
      return fallback;
    }

    const parsedState = JSON.parse(storedState) as Partial<StoredLearnerState>;
    const storedProgress =
      parsedState.skillProgress && typeof parsedState.skillProgress === 'object'
        ? parsedState.skillProgress
        : {};
    const skillProgress = Object.fromEntries(
      skillNodes.map((skill) => {
        const progress = storedProgress[skill.id];
        return [
          skill.id,
          typeof progress === 'number' && Number.isFinite(progress)
            ? Math.min(100, Math.max(0, progress))
            : skill.progress,
        ];
      }),
    );
    const allowedDailyGoals = [10, 20, 30, 45];
    const storedQuestionIndex =
      typeof parsedState.currentQuestionIndex === 'number'
        ? Math.round(parsedState.currentQuestionIndex)
        : 0;
    const isCurrentActivityDay = parsedState.activityDate === activityDate;
    const validQuestionIds = new Set(lessonQuestions.map((question) => question.id));
    const validBankDiagnosticIds = new Set(
      BANK_COLLECTIONS.map((collection) => collection.id),
    );
    const validFaultCaseIds = new Set(
      LAB_FAULT_CASES.map((faultCase) => faultCase.id),
    );
    const validLabMissionIds = new Set(LAB_MISSIONS.map((mission) => mission.id));
    const validFormulaIds = new Set(FORMULA_LIBRARY.map((entry) => entry.id));
    const validResistorRatings = new Set([0.25, 0.5, 1, 2, 5]);
    const savedCircuitDesigns = Array.isArray(parsedState.savedCircuitDesigns)
      ? parsedState.savedCircuitDesigns
          .flatMap((storedDesign) => {
            if (
              !storedDesign ||
              typeof storedDesign !== 'object' ||
              typeof storedDesign.id !== 'string' ||
              storedDesign.id.length === 0 ||
              (storedDesign.mode !== 'series' &&
                storedDesign.mode !== 'parallel') ||
              !Array.isArray(storedDesign.resistors)
            ) {
              return [];
            }

            const resistors = storedDesign.resistors
              .slice(0, 4)
              .flatMap((storedResistor, index) => {
                if (
                  !storedResistor ||
                  typeof storedResistor !== 'object' ||
                  typeof storedResistor.resistance !== 'number' ||
                  !Number.isFinite(storedResistor.resistance)
                ) {
                  return [];
                }

                return [
                  {
                    id:
                      typeof storedResistor.id === 'string' &&
                      storedResistor.id.length > 0
                        ? storedResistor.id
                        : `r${index + 1}`,
                    rating:
                      typeof storedResistor.rating === 'number' &&
                      validResistorRatings.has(storedResistor.rating)
                        ? storedResistor.rating
                        : 0.5,
                    resistance: Math.min(
                      10_000,
                      Math.max(1, storedResistor.resistance),
                    ),
                  },
                ];
              });

            if (resistors.length === 0) {
              return [];
            }

            return [
              {
                id: storedDesign.id,
                mode: storedDesign.mode,
                name:
                  typeof storedDesign.name === 'string' &&
                  storedDesign.name.trim().length > 0
                    ? storedDesign.name.trim().slice(0, 42)
                    : 'Saved circuit',
                resistors,
                savedAt:
                  typeof storedDesign.savedAt === 'number' &&
                  Number.isFinite(storedDesign.savedAt)
                    ? Math.max(0, storedDesign.savedAt)
                    : 0,
                voltage:
                  typeof storedDesign.voltage === 'number' &&
                  Number.isFinite(storedDesign.voltage)
                    ? Math.min(24, Math.max(1, storedDesign.voltage))
                    : 9,
              } satisfies CircuitDesign,
            ];
          })
          .slice(0, 6)
      : [];
    const readFormulaIdList = (value: unknown) =>
      Array.isArray(value)
        ? [
            ...new Set(
              value.filter(
                (formulaId): formulaId is string =>
                  typeof formulaId === 'string' &&
                  validFormulaIds.has(formulaId),
              ),
            ),
          ]
        : [];
    const bookmarkedQuestionIds = Array.isArray(parsedState.bookmarkedQuestionIds)
      ? [
          ...new Set(
            parsedState.bookmarkedQuestionIds.filter(
              (questionId): questionId is string =>
                typeof questionId === 'string' && validQuestionIds.has(questionId),
            ),
          ),
        ]
      : [];
    const storedCareerProjectRecords =
      parsedState.careerProjectRecords &&
      typeof parsedState.careerProjectRecords === 'object'
        ? parsedState.careerProjectRecords
        : {};
    const careerProjectRecords = Object.fromEntries(
      Object.entries(CAREER_PROJECTS).flatMap(([role, project]) => {
        const storedRecord = storedCareerProjectRecords[role];
        if (!storedRecord || typeof storedRecord !== 'object') {
          return [];
        }

        const storedAnswers =
          storedRecord.answers && typeof storedRecord.answers === 'object'
            ? storedRecord.answers
            : {};
        const answers = Object.fromEntries(
          project.decisions.flatMap((decision) => {
            const optionId = storedAnswers[decision.id];
            return typeof optionId === 'string' &&
              decision.options.some((option) => option.id === optionId)
              ? [[decision.id, optionId]]
              : [];
          }),
        );
        const completedAt =
          typeof storedRecord.completedAt === 'number' &&
          Number.isFinite(storedRecord.completedAt)
            ? Math.max(0, storedRecord.completedAt)
            : null;
        const score =
          typeof storedRecord.score === 'number' &&
          Number.isFinite(storedRecord.score)
            ? Math.min(100, Math.max(0, Math.round(storedRecord.score)))
            : 0;

        if (Object.keys(answers).length === 0 && completedAt === null) {
          return [];
        }

        return [[role, { answers, completedAt, score } satisfies CareerProjectRecord]];
      }),
    );
    const savedFormulaIds = readFormulaIdList(parsedState.savedFormulaIds);
    const formulaReadyRewardedIds = readFormulaIdList(
      parsedState.formulaReadyRewardedIds,
    );
    const storedFormulaConfidence =
      parsedState.formulaConfidence &&
      typeof parsedState.formulaConfidence === 'object'
        ? parsedState.formulaConfidence
        : {};
    const formulaConfidence = Object.fromEntries(
      Object.entries(storedFormulaConfidence).filter(
        ([formulaId, confidence]) =>
          validFormulaIds.has(formulaId) &&
          (confidence === 'learning' || confidence === 'ready'),
      ),
    ) as Record<string, FormulaConfidence>;
    const completedLabMissionIds = Array.isArray(parsedState.completedLabMissionIds)
      ? [
          ...new Set(
            parsedState.completedLabMissionIds.filter(
              (missionId): missionId is string =>
                typeof missionId === 'string' && validLabMissionIds.has(missionId),
            ),
          ),
        ]
      : [];
    const completedFaultCaseIds = Array.isArray(
      parsedState.completedFaultCaseIds,
    )
      ? [
          ...new Set(
            parsedState.completedFaultCaseIds.filter(
              (faultCaseId): faultCaseId is string =>
                typeof faultCaseId === 'string' &&
                validFaultCaseIds.has(faultCaseId),
            ),
          ),
        ]
      : [];
    const completedBankDiagnosticIds = Array.isArray(
      parsedState.completedBankDiagnosticIds,
    )
      ? [
          ...new Set(
            parsedState.completedBankDiagnosticIds.filter(
              (diagnosticId): diagnosticId is string =>
                typeof diagnosticId === 'string' &&
                validBankDiagnosticIds.has(diagnosticId as BankCollectionId),
            ),
          ),
        ]
      : [];
    const storedQuestionMastery =
      parsedState.questionMastery && typeof parsedState.questionMastery === 'object'
        ? parsedState.questionMastery
        : {};
    const questionMastery = Object.fromEntries(
      lessonQuestions.flatMap((question) => {
        const record = storedQuestionMastery[question.id];
        if (!record || typeof record !== 'object') {
          return [];
        }

        const attempts =
          typeof record.attempts === 'number' && Number.isFinite(record.attempts)
            ? Math.max(0, Math.round(record.attempts))
            : 0;
        const correct =
          typeof record.correct === 'number' && Number.isFinite(record.correct)
            ? Math.min(attempts, Math.max(0, Math.round(record.correct)))
            : 0;
        const lastResult =
          record.lastResult === 'correct' || record.lastResult === 'wrong'
            ? record.lastResult
            : null;

        if (attempts === 0 || lastResult === null) {
          return [];
        }

        const lastAnsweredAt =
          typeof record.lastAnsweredAt === 'number' &&
          Number.isFinite(record.lastAnsweredAt)
            ? Math.max(0, record.lastAnsweredAt)
            : 0;
        const reviewStage =
          typeof record.reviewStage === 'number' &&
          Number.isFinite(record.reviewStage)
            ? clampReviewStage(record.reviewStage)
            : lastResult === 'correct'
              ? 1
              : 0;
        const nextReviewAt =
          typeof record.nextReviewAt === 'number' &&
          Number.isFinite(record.nextReviewAt)
            ? Math.max(0, record.nextReviewAt)
            : lastResult === 'correct'
              ? lastAnsweredAt + REVIEW_INTERVALS_MS[reviewStage]
              : lastAnsweredAt;
        const lastConfidence =
          record.lastConfidence === 'guess' ||
          record.lastConfidence === 'unsure' ||
          record.lastConfidence === 'sure'
            ? record.lastConfidence
            : null;

        return [
          [
            question.id,
            {
              attempts,
              correct,
              highConfidenceMisses:
                typeof record.highConfidenceMisses === 'number' &&
                Number.isFinite(record.highConfidenceMisses)
                  ? Math.max(0, Math.round(record.highConfidenceMisses))
                  : 0,
              lastConfidence,
              lastAnsweredAt,
              lastResult,
              nextReviewAt,
              reviewStage,
              streak:
                typeof record.streak === 'number' &&
                Number.isFinite(record.streak)
                  ? Math.max(0, Math.round(record.streak))
                  : lastResult === 'correct'
                    ? 1
                    : 0,
            } satisfies QuestionMasteryRecord,
          ],
        ];
      }),
    );
    const storedMistakeReflections =
      parsedState.mistakeReflections &&
      typeof parsedState.mistakeReflections === 'object'
        ? parsedState.mistakeReflections
        : {};
    const mistakeReflections = Object.fromEntries(
      Object.entries(storedMistakeReflections).flatMap(
        ([questionId, reflection]) => {
          if (
            !validQuestionIds.has(questionId) ||
            !reflection ||
            typeof reflection !== 'object' ||
            !MISTAKE_CAUSE_IDS.includes(reflection.cause as MistakeCause)
          ) {
            return [];
          }

          return [
            [
              questionId,
              {
                cause: reflection.cause as MistakeCause,
                note:
                  typeof reflection.note === 'string'
                    ? reflection.note.slice(0, 180)
                    : '',
                updatedAt:
                  typeof reflection.updatedAt === 'number' &&
                  Number.isFinite(reflection.updatedAt)
                    ? Math.max(0, reflection.updatedAt)
                    : 0,
              } satisfies MistakeReflection,
            ],
          ];
        },
      ),
    );
    const practiceMode = PRACTICE_MODES.some((mode) => mode.id === parsedState.practiceMode)
      ? (parsedState.practiceMode as PracticeMode)
      : 'path';
    const storedCustomSessionConfig =
      parsedState.customSessionConfig &&
      typeof parsedState.customSessionConfig === 'object'
        ? parsedState.customSessionConfig
        : DEFAULT_CUSTOM_SESSION_CONFIG;
    const customSessionConfig: CustomSessionConfig = {
      collectionId:
        storedCustomSessionConfig.collectionId === 'all' ||
        validBankDiagnosticIds.has(
          storedCustomSessionConfig.collectionId as BankCollectionId,
        )
          ? (storedCustomSessionConfig.collectionId as
              | BankCollectionId
              | 'all')
          : DEFAULT_CUSTOM_SESSION_CONFIG.collectionId,
      difficulty: CUSTOM_SESSION_DIFFICULTIES.some(
        (difficulty) => difficulty.id === storedCustomSessionConfig.difficulty,
      )
        ? (storedCustomSessionConfig.difficulty as CustomSessionDifficulty)
        : DEFAULT_CUSTOM_SESSION_CONFIG.difficulty,
      length: storedCustomSessionConfig.length === 10 ? 10 : 5,
      prioritizeReview:
        typeof storedCustomSessionConfig.prioritizeReview === 'boolean'
          ? storedCustomSessionConfig.prioritizeReview
          : DEFAULT_CUSTOM_SESSION_CONFIG.prioritizeReview,
    };
    const storedSprintSummary =
      parsedState.lastSprintSummary &&
      typeof parsedState.lastSprintSummary === 'object'
        ? parsedState.lastSprintSummary
        : null;
    const sprintTotal =
      storedSprintSummary &&
      typeof storedSprintSummary.total === 'number' &&
      Number.isFinite(storedSprintSummary.total)
        ? Math.min(
            MAX_SESSION_LENGTH,
            Math.max(1, Math.round(storedSprintSummary.total)),
          )
        : 0;
    const lastSprintSummary =
      storedSprintSummary &&
      sprintTotal > 0 &&
      typeof storedSprintSummary.completedAt === 'number' &&
      Number.isFinite(storedSprintSummary.completedAt)
        ? {
            completedAt: Math.max(0, storedSprintSummary.completedAt),
            correct:
              typeof storedSprintSummary.correct === 'number' &&
              Number.isFinite(storedSprintSummary.correct)
                ? Math.min(sprintTotal, Math.max(0, Math.round(storedSprintSummary.correct)))
                : 0,
            earnedXp:
              typeof storedSprintSummary.earnedXp === 'number' &&
              Number.isFinite(storedSprintSummary.earnedXp)
                ? Math.max(0, Math.round(storedSprintSummary.earnedXp))
                : 0,
            source:
              storedSprintSummary.source === 'career' ||
              storedSprintSummary.source === 'custom' ||
              storedSprintSummary.source === 'diagnostic' ||
              storedSprintSummary.source === 'power' ||
              storedSprintSummary.source === 'recovery' ||
              storedSprintSummary.source === 'review'
                ? storedSprintSummary.source
                : sprintTotal > SPRINT_LENGTH
                  ? 'custom'
                  : 'power',
            total: sprintTotal,
          }
        : null;
    const legacyCompletedPrompts =
      isCurrentActivityDay && typeof parsedState.completedPrompts === 'number'
        ? Math.min(3, Math.max(0, Math.round(parsedState.completedPrompts)))
        : 0;
    const legacyDailyXp =
      isCurrentActivityDay &&
      typeof parsedState.dailyXp === 'number' &&
      Number.isFinite(parsedState.dailyXp)
        ? Math.max(0, Math.round(parsedState.dailyXp))
        : 0;
    const storedActivityHistory =
      parsedState.activityHistory &&
      typeof parsedState.activityHistory === 'object'
        ? parsedState.activityHistory
        : {};
    const activityHistory = pruneActivityHistory(
      Object.fromEntries(
        Object.entries(storedActivityHistory).flatMap(([dateKey, record]) => {
          const normalizedRecord = normalizeDailyActivityRecord(record);
          return normalizedRecord ? [[dateKey, normalizedRecord]] : [];
        }),
      ),
    );

    if (
      !activityHistory[activityDate] &&
      (legacyCompletedPrompts > 0 || legacyDailyXp > 0)
    ) {
      activityHistory[activityDate] = {
        ...EMPTY_DAILY_ACTIVITY,
        focusMinutes: legacyCompletedPrompts,
        questions: legacyCompletedPrompts,
        xp: legacyDailyXp,
      };
    }
    const portfolioFeaturedIds = Array.isArray(
      parsedState.portfolioFeaturedIds,
    )
      ? [
          ...new Set(
            parsedState.portfolioFeaturedIds.filter(
              (evidenceId): evidenceId is string =>
                typeof evidenceId === 'string' &&
                evidenceId.length > 0 &&
                evidenceId.length <= 180,
            ),
          ),
        ].slice(0, 3)
      : [];
    const storedPortfolioNotes =
      parsedState.portfolioNotes &&
      typeof parsedState.portfolioNotes === 'object'
        ? parsedState.portfolioNotes
        : {};
    const portfolioNotes = Object.fromEntries(
      Object.entries(storedPortfolioNotes)
        .flatMap(([evidenceId, note]) =>
          typeof note === 'string' &&
          evidenceId.length > 0 &&
          evidenceId.length <= 180
            ? [[evidenceId, note.slice(0, 280)]]
            : [],
        )
        .slice(0, 80),
    );
    const studyRoute = normalizeStoredStudyRoute(parsedState.studyRoute);
    const checkpointExam = normalizeStoredCheckpointExam(
      parsedState.checkpointExam,
    );
    const weeklyPlan = normalizeStoredWeeklyPlan(parsedState.weeklyPlan);
    const focusSession = normalizeFocusSession(parsedState.focusSession);
    const focusSessionHistory = normalizeFocusHistory(
      parsedState.focusSessionHistory,
    );
    const activeSprint = normalizeStoredSprintState(parsedState.activeSprint);
    const weeklyPlanRewardWeek =
      typeof parsedState.weeklyPlanRewardWeek === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(parsedState.weeklyPlanRewardWeek)
        ? parsedState.weeklyPlanRewardWeek
        : weeklyPlan?.rewardClaimedAt
          ? weeklyPlan.weekKey
          : null;

    return {
      activeSprint,
      activityDate,
      activityHistory,
      bookmarkedQuestionIds,
      careerProjectRecords,
      checkpointBestScore:
        typeof parsedState.checkpointBestScore === 'number' &&
        Number.isFinite(parsedState.checkpointBestScore)
          ? Math.min(100, Math.max(0, Math.round(parsedState.checkpointBestScore)))
          : checkpointExam?.score ?? 0,
      checkpointExam,
      checkpointExamCompletionCount:
        typeof parsedState.checkpointExamCompletionCount === 'number' &&
        Number.isFinite(parsedState.checkpointExamCompletionCount)
          ? Math.max(
              0,
              Math.round(parsedState.checkpointExamCompletionCount),
            )
          : checkpointExam?.completedAt
            ? 1
            : 0,
      completedBankDiagnosticIds,
      completedFaultCaseIds,
      completedLabMissionIds,
      completedPrompts: legacyCompletedPrompts,
      customSessionCompletions:
        typeof parsedState.customSessionCompletions === 'number' &&
        Number.isFinite(parsedState.customSessionCompletions)
          ? Math.max(0, Math.round(parsedState.customSessionCompletions))
          : 0,
      customSessionConfig,
      currentQuestionIndex: Math.min(
        lessonQuestions.length - 1,
        Math.max(0, storedQuestionIndex),
      ),
      dailyGoal:
        typeof parsedState.dailyGoal === 'number' &&
        allowedDailyGoals.includes(parsedState.dailyGoal)
          ? parsedState.dailyGoal
          : 20,
      dailyMissionRewardDate:
        typeof parsedState.dailyMissionRewardDate === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(parsedState.dailyMissionRewardDate)
          ? parsedState.dailyMissionRewardDate
          : null,
      dailyXp: legacyDailyXp,
      earnedXp:
        typeof parsedState.earnedXp === 'number' && Number.isFinite(parsedState.earnedXp)
          ? Math.max(0, Math.round(parsedState.earnedXp))
          : 1240,
      formulaConfidence,
      formulaReadyRewardedIds,
      formulaReviewCompletions:
        typeof parsedState.formulaReviewCompletions === 'number' &&
        Number.isFinite(parsedState.formulaReviewCompletions)
          ? Math.max(0, Math.round(parsedState.formulaReviewCompletions))
          : 0,
      focusSession,
      focusSessionHistory,
      highContrastEnabled:
        typeof parsedState.highContrastEnabled === 'boolean'
          ? parsedState.highContrastEnabled
          : false,
      labRunHistory: normalizeLabRunHistory(parsedState.labRunHistory),
      labSaveCount:
        typeof parsedState.labSaveCount === 'number' &&
        Number.isFinite(parsedState.labSaveCount)
          ? Math.max(0, Math.round(parsedState.labSaveCount))
          : 0,
      lastSprintSummary,
      learnerProfile: normalizeLearnerProfile(parsedState.learnerProfile),
      mistakeRecoveryCompletions:
        typeof parsedState.mistakeRecoveryCompletions === 'number' &&
        Number.isFinite(parsedState.mistakeRecoveryCompletions)
          ? Math.max(0, Math.round(parsedState.mistakeRecoveryCompletions))
          : 0,
      mistakeReflections,
      portfolioFeaturedIds,
      portfolioHeadline:
        typeof parsedState.portfolioHeadline === 'string'
          ? parsedState.portfolioHeadline.slice(0, 80)
          : '',
      portfolioNotes,
      portfolioPublishCount:
        typeof parsedState.portfolioPublishCount === 'number' &&
        Number.isFinite(parsedState.portfolioPublishCount)
          ? Math.max(0, Math.round(parsedState.portfolioPublishCount))
          : 0,
      practiceMode,
      practiceWithHearts:
        typeof parsedState.practiceWithHearts === 'boolean'
          ? parsedState.practiceWithHearts
          : true,
      questionMastery,
      readingSize:
        parsedState.readingSize === 'large' ? 'large' : 'standard',
      reducedMotionEnabled:
        typeof parsedState.reducedMotionEnabled === 'boolean'
          ? parsedState.reducedMotionEnabled
          : defaultReducedMotion,
      savedCircuitDesigns,
      savedFormulaIds,
      skillProgress,
      soundEnabled:
        typeof parsedState.soundEnabled === 'boolean' ? parsedState.soundEnabled : true,
      studyRoute,
      studyRouteCompletionCount:
        typeof parsedState.studyRouteCompletionCount === 'number' &&
        Number.isFinite(parsedState.studyRouteCompletionCount)
          ? Math.max(0, Math.round(parsedState.studyRouteCompletionCount))
          : studyRoute?.completedAt
            ? 1
            : 0,
      tunedCareerRole:
        typeof parsedState.tunedCareerRole === 'string' &&
        careerTracks.some((career) => career.role === parsedState.tunedCareerRole)
          ? parsedState.tunedCareerRole
          : careerTracks[0].role,
      weeklyPlan,
      weeklyPlanRewardWeek,
      workbenchSaveCount:
        typeof parsedState.workbenchSaveCount === 'number' &&
        Number.isFinite(parsedState.workbenchSaveCount)
          ? Math.max(0, Math.round(parsedState.workbenchSaveCount))
          : savedCircuitDesigns.length,
    };
  } catch {
    return fallback;
  }
}

function readSavedLabState(): SavedLabState {
  const fallback: SavedLabState = {
    activeLabId: labScenarios[0].id,
    values: DEFAULT_LAB_VALUES,
  };

  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const storedState = window.localStorage.getItem(SAVED_LAB_STORAGE_KEY);
    if (!storedState) {
      return fallback;
    }

    const parsedState = JSON.parse(storedState) as Partial<SavedLabState>;
    const values = normalizeLabValues(parsedState.values);

    return {
      activeLabId:
        typeof parsedState.activeLabId === 'string' &&
        labScenarios.some((lab) => lab.id === parsedState.activeLabId)
          ? parsedState.activeLabId
          : labScenarios[0].id,
      values,
    };
  } catch {
    return fallback;
  }
}

function readStoredHeartState(): HeartState {
  const fallback: HeartState = { hearts: MAX_HEARTS, nextHeartAt: null };

  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const storedState = window.localStorage.getItem(HEART_STORAGE_KEY);
    if (!storedState) {
      return fallback;
    }

    const parsedState = JSON.parse(storedState) as Partial<HeartState>;
    return normalizeHeartState({
      hearts: typeof parsedState.hearts === 'number' ? parsedState.hearts : MAX_HEARTS,
      nextHeartAt:
        typeof parsedState.nextHeartAt === 'number' ? parsedState.nextHeartAt : null,
    });
  } catch {
    return fallback;
  }
}

function resolveAppRoute(route: AppRoute): AppRoute {
  if (route.page === 'concept') {
    return route.resourceId && getElectricalConcept(route.resourceId)
      ? { ...route, section: 'atlas' }
      : { page: 'overview', resourceId: null, section: 'atlas' };
  }

  if (route.page === 'game') {
    return route.resourceId && getEngineeringGame(route.resourceId)
      ? { ...route, section: 'atlas' }
      : { page: 'overview', resourceId: null, section: 'atlas' };
  }

  if (route.page === 'lesson') {
    return route.resourceId &&
      lessonQuestions.some((question) => question.id === route.resourceId)
      ? { ...route, section: 'practice' }
      : { page: 'overview', resourceId: null, section: 'practice' };
  }

  if (route.page === 'lab' || route.page === 'workbench') {
    return !route.resourceId ||
      labScenarios.some((lab) => lab.id === route.resourceId)
      ? { ...route, section: 'labs' }
      : { page: 'overview', resourceId: null, section: 'labs' };
  }

  if (
    route.page === 'career' ||
    route.page === 'career-project' ||
    route.page === 'portfolio'
  ) {
    return route.resourceId &&
      careerTracks.some((career) => career.role === route.resourceId)
      ? { ...route, section: 'careers' }
      : { page: 'overview', resourceId: null, section: 'careers' };
  }

  if (route.page === 'skill-map' && route.resourceId) {
    return skillNodes.some((skill) => skill.id === route.resourceId)
      ? { ...route, section: 'learn' }
      : { page: 'skill-map', resourceId: null, section: 'learn' };
  }

  return route;
}

function readInitialAppRoute() {
  if (typeof window === 'undefined') {
    return resolveAppRoute(parseAppHash(''));
  }

  return resolveAppRoute(parseAppHash(window.location.hash));
}

const SECTION_VIEW_LABELS: Record<AppSection, string> = {
  atlas: 'Electrical Engineering Atlas',
  bank: 'Question Bank',
  careers: 'Career Paths',
  labs: 'Engineering Labs',
  learn: 'Engineering Foundations',
  notebook: 'Engineering Notebook',
  practice: 'Practice',
};

function getActiveViewLabel({
  activeAtlasId,
  activeLab,
  activePage,
  activeSection,
  currentQuestion,
  currentQuestionIndex,
  selectedCareer,
}: {
  activeAtlasId: string | null;
  activeLab: LabScenario;
  activePage: ActivePage;
  activeSection: AppSection;
  currentQuestion: LessonQuestion;
  currentQuestionIndex: number;
  selectedCareer: CareerTrack;
}) {
  switch (activePage) {
    case 'concept':
      return getElectricalConcept(activeAtlasId)?.title ?? 'Electrical engineering concept';
    case 'game':
      return getEngineeringGame(activeAtlasId)?.title ?? 'Engineering learning game';
    case 'lesson':
      return `${currentQuestion.topic} practice, prompt ${currentQuestionIndex + 1}`;
    case 'lab':
      return `${activeLab.title} lab`;
    case 'workbench':
      return `${activeLab.title} workbench`;
    case 'career':
      return selectedCareer.role;
    case 'career-project':
      return `${selectedCareer.role} project`;
    case 'portfolio':
      return `${selectedCareer.role} portfolio`;
    case 'progress':
      return 'Learning Progress';
    case 'insights':
      return 'Learning Insights';
    case 'focus-room':
      return 'Focus Room';
    case 'review-plan':
      return 'Review Plan';
    case 'mistake-lab':
      return 'Mistake Lab';
    case 'checkpoint-exam':
      return 'Checkpoint Exam';
    case 'skill-map':
      return 'Skill Map';
    case 'study-route':
      return 'Study Route';
    case 'weekly-plan':
      return 'Weekly Planner';
    case 'sprint-summary':
      return 'Sprint Summary';
    case 'overview':
      return SECTION_VIEW_LABELS[activeSection];
  }
}

function App() {
  const [initialLearnerState] = useState<StoredLearnerState>(readStoredLearnerState);
  const [savedLabState] = useState<SavedLabState>(readSavedLabState);
  const [initialRoute] = useState<AppRoute>(readInitialAppRoute);
  const initialSprintState = initialLearnerState.activeSprint;
  const shouldRestoreActiveSprint =
    initialSprintState !== null && !initialSprintState.paused;
  const initialSprintQuestionIndex =
    initialSprintState?.questionIndices[initialSprintState.position] ?? -1;
  const initialRouteQuestionIndex =
    initialRoute.page === 'lesson' && initialRoute.resourceId
      ? lessonQuestions.findIndex(
          (question) => question.id === initialRoute.resourceId,
        )
      : -1;
  const initialQuestionIndex = shouldRestoreActiveSprint
    ? initialSprintQuestionIndex
    : initialRouteQuestionIndex >= 0
      ? initialRouteQuestionIndex
      : initialLearnerState.currentQuestionIndex;
  const initialRouteQuestion =
    initialQuestionIndex >= 0
      ? lessonQuestions[initialQuestionIndex]
      : null;
  const initialRouteSkillId =
    initialRoute.page === 'skill-map' &&
    initialRoute.resourceId &&
    skillNodes.some((skill) => skill.id === initialRoute.resourceId)
      ? initialRoute.resourceId
      : initialRouteQuestion
        ? BANK_TOPIC_SKILL_IDS[initialRouteQuestion.topic] ?? skillNodes[0].id
        : skillNodes[0].id;
  const initialRouteLabId =
    (initialRoute.page === 'lab' || initialRoute.page === 'workbench') &&
    initialRoute.resourceId
      ? initialRoute.resourceId
      : savedLabState.activeLabId;
  const initialRouteCareerRole =
    (initialRoute.page === 'career' ||
      initialRoute.page === 'career-project' ||
      initialRoute.page === 'portfolio') &&
    initialRoute.resourceId
      ? initialRoute.resourceId
      : initialLearnerState.tunedCareerRole;
  const initialAtlasId =
    (initialRoute.page === 'concept' || initialRoute.page === 'game') &&
    initialRoute.resourceId
      ? initialRoute.resourceId
      : null;
  const [isAuthenticated, setIsAuthenticated] = useState(readStoredSession);
  const [appLockConfig, setAppLockConfig] =
    useState<LocalAppLockConfig | null>(readLocalAppLockConfig);
  const [isAppLocked, setIsAppLocked] = useState(() => {
    const storedConfig = readLocalAppLockConfig();
    return storedConfig ? isLocalAppLockExpired(storedConfig) : false;
  });
  const [isOnline, setIsOnline] = useState(readOnlineStatus);
  const [isAppInstalled, setIsAppInstalled] = useState(readStandaloneStatus);
  const [deviceAlertPermission, setDeviceAlertPermission] =
    useState<DeviceAlertPermission>(readDeviceAlertPermission);
  const [deviceAlertsEnabled, setDeviceAlertsEnabled] = useState(
    readDeviceAlertsEnabled,
  );
  const [installPrompt, setInstallPrompt] =
    useState<AppInstallPromptEvent | null>(null);
  const onlineStatusRef = useRef(isOnline);
  const [rememberSession, setRememberSession] = useState(
    readStoredRememberSession,
  );
  const [entryView, setEntryView] = useState<EntryView>('intro');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [learnerProfile, setLearnerProfile] = useState(
    initialLearnerState.learnerProfile,
  );
  const learnerDisplayName =
    learnerProfile.displayName.trim() || 'Zylo Learner';
  const learnerInitials = getLearnerInitials(learnerDisplayName);
  const [activeSection, setActiveSection] = useState<AppSection>(
    shouldRestoreActiveSprint ? 'practice' : initialRoute.section,
  );
  const [activePage, setActivePage] = useState<ActivePage>(
    shouldRestoreActiveSprint ? 'lesson' : initialRoute.page,
  );
  const [focusViewEnabled, setFocusViewEnabled] = useState(false);
  const focusViewAvailable =
    activePage === 'lesson' ||
    activePage === 'lab' ||
    activePage === 'workbench';
  const focusViewActive = focusViewAvailable && focusViewEnabled;
  const [learningToolOrigin, setLearningToolOrigin] = useState<
    'insights' | 'overview'
  >('overview');
  const [activeSkillId, setActiveSkillId] = useState(initialRouteSkillId);
  const [activeLabId, setActiveLabId] = useState(initialRouteLabId);
  const [activeAtlasId, setActiveAtlasId] = useState<string | null>(
    initialAtlasId,
  );
  const [selectedCareerRole, setSelectedCareerRole] = useState(
    initialRouteCareerRole,
  );
  const [comparisonCareerRole, setComparisonCareerRole] = useState(
    careerTracks.find(
      (career) => career.role !== initialRouteCareerRole,
    )?.role ?? careerTracks[0].role,
  );
  const [careerCatalogQuery, setCareerCatalogQuery] = useState('');
  const [careerCatalogSort, setCareerCatalogSort] =
    useState<CareerCatalogSort>('match');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    initialQuestionIndex,
  );
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const lastRouteFocusKeyRef = useRef<string | null>(null);
  const routeScrollPositionsRef = useRef<Map<string, number>>(new Map());
  const shouldRestoreRouteScrollRef = useRef(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchActiveIndex, setSearchActiveIndex] = useState(-1);
  const [searchKindFilter, setSearchKindFilter] =
    useState<SearchKindFilter>('All');
  const [practicePathQuery, setPracticePathQuery] = useState('');
  const [practicePathFilter, setPracticePathFilter] =
    useState<PracticePathFilter>('all');
  const [recentSearchResults, setRecentSearchResults] = useState<SearchResult[]>(
    readRecentSearchResults,
  );
  const [recentLearningItems, setRecentLearningItems] = useState<
    RecentLearningItem[]
  >(readRecentLearningItems);
  const [readNotificationKeys, setReadNotificationKeys] = useState<string[]>(
    readStoredNotificationReadKeys,
  );
  const [studyToolsExpanded, setStudyToolsExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(
    shouldRestoreActiveSprint ? initialSprintState?.selectedOption ?? null : null,
  );
  const [answerConfidence, setAnswerConfidence] =
    useState<AnswerConfidence | null>(
      shouldRestoreActiveSprint
        ? initialSprintState?.answerConfidence ?? null
        : null,
    );
  const routeSyncModeRef = useRef<'history' | 'idle' | 'initial'>('initial');
  const [earnedXp, setEarnedXp] = useState(initialLearnerState.earnedXp);
  const [heartState, setHeartState] = useState<HeartState>(readStoredHeartState);
  const [heartClock, setHeartClock] = useState(Date.now());
  const [reviewClock, setReviewClock] = useState(Date.now());
  const [reviewPlanLength, setReviewPlanLength] =
    useState<CustomSessionLength>(5);
  const [reviewIncludeNew, setReviewIncludeNew] = useState(true);
  const [currentActivityDate, setCurrentActivityDate] = useState(
    initialLearnerState.activityDate,
  );
  const [activityHistory, setActivityHistory] = useState<DailyActivityHistory>(
    initialLearnerState.activityHistory,
  );
  const [dailyMissionRewardDate, setDailyMissionRewardDate] = useState(
    initialLearnerState.dailyMissionRewardDate,
  );
  const [practiceMode, setPracticeMode] = useState<PracticeMode>(
    initialLearnerState.practiceMode,
  );
  const [customSessionConfig, setCustomSessionConfig] =
    useState<CustomSessionConfig>(initialLearnerState.customSessionConfig);
  const [customSessionCompletions, setCustomSessionCompletions] = useState(
    initialLearnerState.customSessionCompletions,
  );
  const [savedFormulaIds, setSavedFormulaIds] = useState<string[]>(
    initialLearnerState.savedFormulaIds,
  );
  const [formulaConfidence, setFormulaConfidence] = useState<
    Record<string, FormulaConfidence>
  >(initialLearnerState.formulaConfidence);
  const [formulaReadyRewardedIds, setFormulaReadyRewardedIds] = useState<
    string[]
  >(initialLearnerState.formulaReadyRewardedIds);
  const [formulaReviewCompletions, setFormulaReviewCompletions] = useState(
    initialLearnerState.formulaReviewCompletions,
  );
  const [focusSession, setFocusSession] = useState<FocusSession | null>(
    initialLearnerState.focusSession,
  );
  const [focusSessionHistory, setFocusSessionHistory] = useState<
    FocusSessionRecord[]
  >(initialLearnerState.focusSessionHistory);
  const [focusClock, setFocusClock] = useState(Date.now());
  const [formulaReviewState, setFormulaReviewState] =
    useState<FormulaReviewState | null>(null);
  const [notebookFilter, setNotebookFilter] =
    useState<NotebookFilter>('all');
  const [notebookQuery, setNotebookQuery] = useState('');
  const [labCatalogFilter, setLabCatalogFilter] =
    useState<LabCatalogFilter>('all');
  const [labCatalogQuery, setLabCatalogQuery] = useState('');
  const [fieldNotes, setFieldNotes] = useState<FieldNote[]>(readFieldNotes);
  const [focusedFieldNoteId, setFocusedFieldNoteId] = useState<string | null>(
    null,
  );
  const [pendingFieldJournalDraft, setPendingFieldJournalDraft] =
    useState<FieldJournalDraftSeed | null>(null);
  const fieldNoteCount = fieldNotes.length;
  const [studyListItems, setStudyListItems] = useState<StudyListItem[]>(
    readStudyListItems,
  );
  const [notebookLibraryView, setNotebookLibraryView] =
    useState<NotebookLibraryView>(() =>
      readStoredNotebookLibraryView() ??
      getInitialNotebookLibraryView({
        benchRunCount: initialLearnerState.labRunHistory.length,
        formulaCount: initialLearnerState.savedFormulaIds.length,
        noteCount: fieldNoteCount,
        questionCount: initialLearnerState.bookmarkedQuestionIds.length,
      }),
    );
  const [bookmarkedQuestionIds, setBookmarkedQuestionIds] = useState<string[]>(
    initialLearnerState.bookmarkedQuestionIds,
  );
  const [careerProjectRecords, setCareerProjectRecords] = useState<
    Record<string, CareerProjectRecord>
  >(initialLearnerState.careerProjectRecords);
  const [checkpointExam, setCheckpointExam] =
    useState<CheckpointExamState | null>(initialLearnerState.checkpointExam);
  const [checkpointExamCompletionCount, setCheckpointExamCompletionCount] =
    useState(initialLearnerState.checkpointExamCompletionCount);
  const [checkpointBestScore, setCheckpointBestScore] = useState(
    initialLearnerState.checkpointBestScore,
  );
  const [completedBankDiagnosticIds, setCompletedBankDiagnosticIds] =
    useState<string[]>(initialLearnerState.completedBankDiagnosticIds);
  const [completedFaultCaseIds, setCompletedFaultCaseIds] = useState<string[]>(
    initialLearnerState.completedFaultCaseIds,
  );
  const [completedLabMissionIds, setCompletedLabMissionIds] = useState<string[]>(
    initialLearnerState.completedLabMissionIds,
  );
  const [questionMastery, setQuestionMastery] = useState<
    Record<string, QuestionMasteryRecord>
  >(initialLearnerState.questionMastery);
  const [mistakeReflections, setMistakeReflections] = useState<
    Record<string, MistakeReflection>
  >(initialLearnerState.mistakeReflections);
  const [mistakeRecoveryCompletions, setMistakeRecoveryCompletions] = useState(
    initialLearnerState.mistakeRecoveryCompletions,
  );
  const [savedCircuitDesigns, setSavedCircuitDesigns] = useState<
    CircuitDesign[]
  >(initialLearnerState.savedCircuitDesigns);
  const [portfolioFeaturedIds, setPortfolioFeaturedIds] = useState<string[]>(
    initialLearnerState.portfolioFeaturedIds,
  );
  const [portfolioHeadline, setPortfolioHeadline] = useState(
    initialLearnerState.portfolioHeadline,
  );
  const [portfolioNotes, setPortfolioNotes] = useState<Record<string, string>>(
    initialLearnerState.portfolioNotes,
  );
  const [portfolioPublishCount, setPortfolioPublishCount] = useState(
    initialLearnerState.portfolioPublishCount,
  );
  const [studyRoute, setStudyRoute] = useState<StudyRoute | null>(
    initialLearnerState.studyRoute,
  );
  const [studyRouteCompletionCount, setStudyRouteCompletionCount] = useState(
    initialLearnerState.studyRouteCompletionCount,
  );
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(
    initialLearnerState.weeklyPlan,
  );
  const [weeklyPlanRewardWeek, setWeeklyPlanRewardWeek] = useState(
    initialLearnerState.weeklyPlanRewardWeek,
  );
  const [overlay, setOverlay] = useState<OverlayType>(null);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(
    shouldRestoreActiveSprint && initialSprintState
      ? {
          message: `${initialSprintState.label} restored at prompt ${
            initialSprintState.position + 1
          } of ${initialSprintState.questionIndices.length}.`,
        }
      : null,
  );
  const [toastAutoDismissPaused, setToastAutoDismissPaused] = useState(false);
  const [hasExternalProgressUpdate, setHasExternalProgressUpdate] =
    useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(
    readLastSavedAt,
  );
  const saveStatusTimersRef = useRef<number[]>([]);
  const learnerSaveBlockedRef = useRef(false);
  const persistedLearnerStateRef = useRef(
    JSON.stringify(initialLearnerState),
  );
  const [tunedCareerRole, setTunedCareerRole] = useState(
    initialLearnerState.tunedCareerRole,
  );
  const [dailyGoal, setDailyGoal] = useState(initialLearnerState.dailyGoal);
  const [labRunHistory, setLabRunHistory] = useState<LabRunSnapshot[]>(
    initialLearnerState.labRunHistory,
  );
  const [labSaveCount, setLabSaveCount] = useState(initialLearnerState.labSaveCount);
  const [workbenchSaveCount, setWorkbenchSaveCount] = useState(
    initialLearnerState.workbenchSaveCount,
  );
  const [lastSprintSummary, setLastSprintSummary] = useState<SprintSummary | null>(
    initialLearnerState.lastSprintSummary,
  );
  const [sprintState, setSprintState] = useState<SprintState | null>(
    initialSprintState,
  );
  const [soundEnabled, setSoundEnabled] = useState(initialLearnerState.soundEnabled);
  const [practiceWithHearts, setPracticeWithHearts] = useState(
    initialLearnerState.practiceWithHearts,
  );
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(
    initialLearnerState.reducedMotionEnabled,
  );
  const [highContrastEnabled, setHighContrastEnabled] = useState(
    initialLearnerState.highContrastEnabled,
  );
  const [readingSize, setReadingSize] = useState<ReadingSize>(
    initialLearnerState.readingSize,
  );
  const [skillProgress, setSkillProgress] = useState<Record<string, number>>(
    initialLearnerState.skillProgress,
  );
  const [storedLabValues, setLabValues] =
    useState<LabSimulationValues>(savedLabState.values);
  const labValues = useMemo(
    () => normalizeLabValues(storedLabValues),
    [storedLabValues],
  );
  const [activeLabMissionId, setActiveLabMissionId] = useState(() =>
    getNextLabMissionId(
      savedLabState.activeLabId,
      initialLearnerState.completedLabMissionIds,
    ),
  );
  const [labMissionFeedback, setLabMissionFeedback] =
    useState<LabMissionFeedback>(null);
  const [activeBankDiagnosticId, setActiveBankDiagnosticId] =
    useState<BankCollectionId | null>(
      initialSprintState?.diagnosticId ?? null,
    );

  useEffect(() => {
    document.documentElement.dataset.zyloReadingSize = readingSize;

    return () => {
      delete document.documentElement.dataset.zyloReadingSize;
    };
  }, [readingSize]);
  const [bankCollectionId, setBankCollectionId] = useState<
    BankCollectionId | 'all'
  >('all');
  const [bankTopicFilter, setBankTopicFilter] =
    useState<BankTopicFilter>('all');
  const [bankTopicQuery, setBankTopicQuery] = useState('');

  const todayActivity =
    activityHistory[currentActivityDate] ?? EMPTY_DAILY_ACTIVITY;
  const completedPrompts = Math.min(3, todayActivity.questions);
  const dailyXp = todayActivity.xp;
  const dailyChallengeCount =
    todayActivity.careerProjects +
    todayActivity.labMissions +
    todayActivity.sprints +
    todayActivity.diagnostics +
    todayActivity.exams;
  const dailyMissions: DailyMissionView[] = [
    {
      actionLabel: 'Review due questions',
      id: 'questions',
      title: 'Work through 3 questions',
      detail: 'Practice, sprints, or diagnostics',
      current: todayActivity.questions,
      target: 3,
      unit: 'questions',
      icon: Target,
    },
    {
      actionLabel: 'Start focused practice',
      id: 'xp',
      title: 'Earn 50 XP',
      detail: 'Build progress anywhere in ZyloXP',
      current: dailyXp,
      target: 50,
      unit: 'XP',
      icon: Zap,
    },
    {
      actionLabel: 'Open an interactive lab',
      id: 'challenge',
      title: 'Complete a challenge',
      detail: 'Finish a lab, career project, or practice run',
      current: dailyChallengeCount,
      target: 1,
      unit: 'challenge',
      icon: FlaskConical,
    },
  ];
  const dailyMissionCompletedCount = dailyMissions.filter(
    (mission) => mission.current >= mission.target,
  ).length;
  const allDailyMissionsComplete =
    dailyMissionCompletedCount === dailyMissions.length;
  const dailyMissionProgress =
    (dailyMissionCompletedCount / dailyMissions.length) * 100;
  const dailyMissionRewardClaimed =
    dailyMissionRewardDate === currentActivityDate;
  const weeklyActivity = useMemo(
    () => getWeeklyActivity(activityHistory),
    [activityHistory, currentActivityDate],
  );
  const plannerWeekActivity = useMemo(
    () =>
      getPlannerWeekActivity(
        activityHistory,
        new Date(`${currentActivityDate}T12:00:00`),
      ),
    [activityHistory, currentActivityDate],
  );
  const learningInsightActivity = useMemo(
    () =>
      getLearningInsightActivity(
        activityHistory,
        new Date(`${currentActivityDate}T12:00:00`),
      ),
    [activityHistory, currentActivityDate],
  );
  const plannerWeekKey = plannerWeekActivity[0]?.dateKey ?? currentActivityDate;
  const plannerWeekLabel = formatPlannerWeekLabel(plannerWeekActivity);
  const currentWeeklyPlan =
    weeklyPlan?.weekKey === plannerWeekKey ? weeklyPlan : null;
  const weeklyPlanProgress = {
    challenges: plannerWeekActivity.reduce(
      (sum, day) => sum + day.challenges,
      0,
    ),
    questions: plannerWeekActivity.reduce(
      (sum, day) => sum + day.questions,
      0,
    ),
    xp: plannerWeekActivity.reduce((sum, day) => sum + day.xp, 0),
  };
  const weeklyPlanComplete = Boolean(
    currentWeeklyPlan &&
      weeklyPlanProgress.challenges >= currentWeeklyPlan.targetChallenges &&
      weeklyPlanProgress.questions >= currentWeeklyPlan.targetQuestions &&
      weeklyPlanProgress.xp >= currentWeeklyPlan.targetXp,
  );
  const currentStreak = getCurrentStreak(activityHistory);
  const focusRemainingMs = focusSession
    ? getFocusRemainingMs(focusSession, focusClock)
    : 0;
  const isFocusSessionRunning = Boolean(
    focusSession &&
      focusSession.endedAt === null &&
      focusSession.pausedAt === null &&
      focusRemainingMs > 0,
  );
  const focusHistoryMinutes = Math.floor(
    focusSessionHistory.reduce(
      (sum, record) => sum + record.focusedSeconds,
      0,
    ) / 60,
  );

  const heartsRemaining = heartState.hearts;
  const nextHeartAt = heartState.nextHeartAt;
  const nextHeartInMs =
    nextHeartAt === null ? 0 : Math.max(0, nextHeartAt - heartClock);
  const fullHeartRechargeMs = getFullRechargeMs(
    heartsRemaining,
    nextHeartAt,
    heartClock,
  );
  const baseActiveSkill = skillNodes.find((skill) => skill.id === activeSkillId) ?? skillNodes[0];
  const activeSkill = {
    ...baseActiveSkill,
    progress: skillProgress[baseActiveSkill.id] ?? baseActiveSkill.progress,
  };
  const activeLab = labScenarios.find((lab) => lab.id === activeLabId) ?? labScenarios[0];
  const activeLabRunHistory = labRunHistory.filter(
    (run) => run.labId === activeLab.id,
  );
  const selectedCareer =
    careerTracks.find((track) => track.role === selectedCareerRole) ?? careerTracks[0];
  const tunedCareer =
    careerTracks.find((track) => track.role === tunedCareerRole) ?? careerTracks[0];
  const activeCareerProject =
    CAREER_PROJECTS[selectedCareer.role] ??
    CAREER_PROJECTS[careerTracks[0].role];
  const activeCareerProjectRecord =
    careerProjectRecords[selectedCareer.role];
  const activeCareerProjectLab =
    labScenarios.find((lab) => lab.id === activeCareerProject.labId) ??
    labScenarios[0];
  const currentQuestion = lessonQuestions[currentQuestionIndex];
  const {
    adcAliased,
    adcClipped,
    adcDisplayedFrequency,
    adcEffectiveSnr,
    adcFilterGain,
    adcFilteredAmplitude,
    adcLsbMillivolts,
    adcNyquistFrequency,
    adcPeakCode,
    adcSamplesPerCycle,
    bjtAdjustedBeta,
    bjtBaseEmitterVoltage,
    bjtCollectorCurrent,
    bjtCollectorPower,
    bjtCollectorResistorPower,
    bjtCollectorVoltage,
    bjtCutoff,
    bjtForcedBeta,
    bjtIdealCollectorCurrent,
    bjtJunctionTemperature,
    bjtLoadLineCurrent,
    bjtSaturated,
    bjtSaturationMargin,
    bjtTransconductance,
    current,
    digitalMaxClock,
    digitalPeriod,
    digitalTimingMargin,
    digitalTimingUtilization,
    filterGainDb,
    filterOutput,
    filterPhase,
    mosfetConductionLoss,
    mosfetDrainCurrent,
    mosfetDrainVoltage,
    mosfetEfficiency,
    mosfetGateDriveLoss,
    mosfetJunctionTemperature,
    mosfetLoadPower,
    mosfetOn,
    mosfetOnResistance,
    mosfetSwitchingLoss,
    mosfetTotalLoss,
    mosfetTransitionTime,
    opAmpClipped,
    opAmpGain,
    opAmpHeadroom,
    opAmpInputCurrent,
    opAmpMaxSwing,
    opAmpOutput,
    pidControlEffort,
    pidDampingRatio,
    pidFinalValue,
    pidNaturalFrequency,
    pidOvershoot,
    pidRiseTime,
    pidSettlingTime,
    pidSteadyStateError,
    rcCutoff,
    rcTimeConstant,
    resonanceBandwidth,
    resonanceCapacitiveReactance,
    resonanceCapacitorVoltage,
    resonanceCurrent,
    resonanceFrequency,
    resonanceImpedance,
    resonanceInductiveReactance,
    resonanceInductorVoltage,
    resonanceLowerCutoff,
    resonanceNearPeak,
    resonancePhase,
    resonanceQualityFactor,
    resonanceResistorPower,
    resonanceUpperCutoff,
    threePhasePower,
    transmissionDeliveredPower,
    transmissionReflectedVoltage,
    transmissionReflectionCoefficient,
    transmissionReflectionMagnitude,
    transmissionReflectionPhase,
    transmissionReturnLoss,
    transmissionVswr,
    transformerCoreLoss,
    transformerCopperLoss,
    transformerEfficiency,
    transformerFluxDensity,
    transformerIdealSecondaryVoltage,
    transformerLoadPercent,
    transformerMagnetizingCurrent,
    transformerOutputPower,
    transformerPrimaryCurrent,
    transformerRegulation,
    transformerSaturated,
    transformerSecondaryCurrent,
    transformerSecondaryVoltage,
    transformerTemperatureRise,
    transformerTotalLoss,
    transformerTurnsRatio,
  } = calculateLabMetrics(labValues);
  const activeLabMissions = LAB_MISSIONS.filter(
    (mission) => mission.labId === activeLab.id,
  );
  const activeLabFaultCases = LAB_FAULT_CASES.filter(
    (faultCase) => faultCase.labId === activeLab.id,
  );
  const activeLabMission =
    activeLabMissions.find((mission) => mission.id === activeLabMissionId) ??
    activeLabMissions[0] ??
    LAB_MISSIONS[0];
  const activeLabMetric =
    activeLab.id === 'lab-ohms'
      ? current
      : activeLab.id === 'lab-bjt'
        ? bjtCollectorCurrent
      : activeLab.id === 'lab-rc'
        ? rcTimeConstant
      : activeLab.id === 'lab-resonance'
        ? resonanceFrequency
      : activeLab.id === 'lab-filter'
          ? filterOutput
          : activeLab.id === 'lab-digital'
            ? digitalTimingMargin
            : activeLab.id === 'lab-opamp'
              ? Math.abs(opAmpOutput)
              : activeLab.id === 'lab-mosfet'
                ? mosfetTotalLoss
                : activeLab.id === 'lab-pid'
                  ? pidSettlingTime
                : activeLab.id === 'lab-adc'
                  ? adcDisplayedFrequency
                : activeLab.id === 'lab-transmission'
                  ? transmissionVswr
                  : activeLab.id === 'lab-transformer'
                    ? transformerSecondaryVoltage
                  : threePhasePower;
  const activeLabMissionComplete = completedLabMissionIds.includes(
    activeLabMission.id,
  );
  const activeLabCompletedMissionCount = activeLabMissions.filter((mission) =>
    completedLabMissionIds.includes(mission.id),
  ).length;
  const activeLabCompletedFaultCount = activeLabFaultCases.filter((faultCase) =>
    completedFaultCaseIds.includes(faultCase.id),
  ).length;
  const labCatalogEntries = useMemo(
    () =>
      labScenarios
        .filter((lab) => lab.id !== activeLab.id)
        .map((lab) => {
          const labMissions = LAB_MISSIONS.filter(
            (mission) => mission.labId === lab.id,
          );
          const labFaults = LAB_FAULT_CASES.filter(
            (faultCase) => faultCase.labId === lab.id,
          );
          const completedMissions = labMissions.filter((mission) =>
            completedLabMissionIds.includes(mission.id),
          ).length;
          const completedFaults = labFaults.filter((faultCase) =>
            completedFaultCaseIds.includes(faultCase.id),
          ).length;
          const completedChecks = completedMissions + completedFaults;
          const totalChecks = labMissions.length + labFaults.length;
          const progress: LabCatalogProgress =
            totalChecks > 0 && completedChecks >= totalChecks
              ? 'complete'
              : completedChecks > 0
                ? 'started'
                : 'new';

          return {
            completedFaults,
            completedMissions,
            lab,
            progress,
            searchText: normalizeSearchText(
              [
                lab.title,
                lab.topic,
                lab.metric,
                lab.result,
                lab.formula,
                lab.visualLabel,
              ].join(' '),
            ),
            totalFaults: labFaults.length,
            totalMissions: labMissions.length,
          };
        }),
    [
      activeLab.id,
      completedFaultCaseIds,
      completedLabMissionIds,
    ],
  );
  const workbenchCatalogProgress: LabCatalogProgress =
    savedCircuitDesigns.length >= 6
      ? 'complete'
      : savedCircuitDesigns.length > 0
        ? 'started'
        : 'new';
  const normalizedLabCatalogQuery = normalizeSearchText(labCatalogQuery);
  const visibleLabCatalogEntries = useMemo(
    () =>
      labCatalogEntries.filter(
        (entry) =>
          (labCatalogFilter === 'all' ||
            entry.progress === labCatalogFilter) &&
          (!normalizedLabCatalogQuery ||
            entry.searchText.includes(normalizedLabCatalogQuery)),
      ),
    [
      labCatalogEntries,
      labCatalogFilter,
      normalizedLabCatalogQuery,
    ],
  );
  const workbenchSearchText = normalizeSearchText(
    'Circuit Workbench Build Mode series parallel DC networks live power check',
  );
  const showWorkbenchCatalogEntry =
    (labCatalogFilter === 'all' ||
      labCatalogFilter === workbenchCatalogProgress) &&
    (!normalizedLabCatalogQuery ||
      workbenchSearchText.includes(normalizedLabCatalogQuery));
  const labCatalogProgressCounts = labCatalogEntries.reduce<
    Record<LabCatalogProgress, number>
  >(
    (counts, entry) => ({
      ...counts,
      [entry.progress]: counts[entry.progress] + 1,
    }),
    { complete: 0, new: 0, started: 0 },
  );
  labCatalogProgressCounts[workbenchCatalogProgress] += 1;
  const labCatalogTotalCount = labCatalogEntries.length + 1;
  const visibleLabCatalogCount =
    visibleLabCatalogEntries.length + (showWorkbenchCatalogEntry ? 1 : 0);
  const isCorrect = selectedOption === currentQuestion.correctIndex;
  const questProgress = Math.min(100, (completedPrompts / 3) * 100);
  const guideContent = sectionGuideContent[activeSection];
  const allReviewItems = useMemo(
    () => getReviewPlanItems(questionMastery, reviewClock, true),
    [questionMastery, reviewClock],
  );
  const reviewQuestionIds = allReviewItems
    .filter((item) => item.status === 'due')
    .map((item) => item.question.id);
  const reviewStatusCounts: Record<ReviewStatus, number> = {
    due: allReviewItems.filter((item) => item.status === 'due').length,
    learning: allReviewItems.filter((item) => item.status === 'learning').length,
    new: allReviewItems.filter((item) => item.status === 'new').length,
    strong: allReviewItems.filter((item) => item.status === 'strong').length,
  };
  const reviewPlanItems = useMemo(
    () =>
      getReviewPlanItems(
        questionMastery,
        reviewClock,
        reviewIncludeNew,
      ).slice(0, reviewPlanLength),
    [
      questionMastery,
      reviewClock,
      reviewIncludeNew,
      reviewPlanLength,
    ],
  );
  const reviewPlanQuestionIndices = reviewPlanItems.map(
    (item) => item.questionIndex,
  );
  const mistakeLabItems = useMemo<MistakeLabItem[]>(
    () =>
      lessonQuestions
        .flatMap((question, questionIndex) => {
          const record = questionMastery[question.id];
          const mistakes = record ? record.attempts - record.correct : 0;

          if (!record || mistakes <= 0) {
            return [];
          }

          return [
            {
              accuracy: Math.round((record.correct / record.attempts) * 100),
              attempts: record.attempts,
              difficultyLabel: question.difficultyLabel,
              formula: question.formula,
              id: question.id,
              lastAnsweredAt: record.lastAnsweredAt,
              mistakes,
              prompt: question.prompt,
              questionIndex,
              recovered: record.lastResult === 'correct',
              subtopic: question.subtopic,
              topic: question.topic,
            },
          ];
        })
        .sort(
          (left, right) =>
            Number(left.recovered) - Number(right.recovered) ||
            right.mistakes - left.mistakes ||
            left.accuracy - right.accuracy ||
            right.lastAnsweredAt - left.lastAnsweredAt,
        ),
    [questionMastery],
  );
  const activeMistakeItems = mistakeLabItems.filter(
    (item) => !item.recovered,
  );
  const recoveredMistakeCount =
    mistakeLabItems.length - activeMistakeItems.length;
  const reflectedMistakeCount = mistakeLabItems.filter((item) =>
    Boolean(mistakeReflections[item.id]),
  ).length;
  const checkpointDomains: CheckpointDomain[] = [
    {
      description: 'Adaptive mix across every available domain.',
      id: 'all',
      label: 'All domains',
      questionCount: lessonQuestions.length,
    },
    ...BANK_COLLECTIONS.map((collection) => ({
      description: collection.description,
      id: collection.id as CheckpointDomainId,
      label: collection.label,
      questionCount: lessonQuestions.filter(
        (question) =>
          getBankCollectionForTopic(question.topic).id === collection.id,
      ).length,
    })),
  ];
  const checkpointQuestions = checkpointExam
    ? checkpointExam.questionIds.flatMap((questionId) => {
        const question = lessonQuestions.find(
          (candidate) => candidate.id === questionId,
        );
        return question ? [question] : [];
      })
    : [];
  const checkpointAnsweredCount = checkpointExam
    ? Object.values(checkpointExam.answers).filter(
        (answer) => answer.optionIndex !== null,
      ).length
    : 0;
  const customSessionQuestionIndices = useMemo(
    () =>
      getCustomSessionQuestionIndices(
        customSessionConfig,
        questionMastery,
      ),
    [customSessionConfig, questionMastery],
  );
  const customSessionSelection = customSessionQuestionIndices.slice(
    0,
    customSessionConfig.length,
  );
  const customSessionQuestionCount = customSessionSelection.length;
  const customSessionEstimatedXp = customSessionSelection.reduce(
    (xp, questionIndex) => xp + lessonQuestions[questionIndex].xp,
    0,
  );
  const customSessionCollection =
    customSessionConfig.collectionId === 'all'
      ? null
      : BANK_COLLECTIONS.find(
          (collection) => collection.id === customSessionConfig.collectionId,
        ) ?? null;
  const customSessionDifficulty =
    CUSTOM_SESSION_DIFFICULTIES.find(
      (difficulty) => difficulty.id === customSessionConfig.difficulty,
    ) ?? CUSTOM_SESSION_DIFFICULTIES[0];
  const savedFormulaEntries = FORMULA_LIBRARY.filter((entry) =>
    savedFormulaIds.includes(entry.id),
  );
  const readyFormulaCount = savedFormulaEntries.filter(
    (entry) => formulaConfidence[entry.id] === 'ready',
  ).length;
  const learningFormulaCount =
    savedFormulaEntries.length - readyFormulaCount;
  const notebookDomainCount = new Set(
    savedFormulaEntries.map((entry) => entry.collectionId),
  ).size;
  const filteredFormulaEntries = useMemo(() => {
    const normalizedQuery = notebookQuery.trim().toLowerCase();

    return FORMULA_LIBRARY.filter((entry) => {
      const isSaved = savedFormulaIds.includes(entry.id);
      const confidence = formulaConfidence[entry.id] ?? 'learning';
      const matchesFilter =
        notebookFilter === 'all' ||
        (notebookFilter === 'saved' && isSaved) ||
        (notebookFilter === 'learning' &&
          isSaved &&
          confidence === 'learning') ||
        (notebookFilter === 'ready' && isSaved && confidence === 'ready');
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          entry.title,
          entry.subtitle,
          entry.formula,
          entry.assumptions,
          entry.context,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    }).sort((left, right) => {
      const savedDifference =
        Number(savedFormulaIds.includes(right.id)) -
        Number(savedFormulaIds.includes(left.id));
      return savedDifference || left.title.localeCompare(right.title);
    });
  }, [
    formulaConfidence,
    notebookFilter,
    notebookQuery,
    savedFormulaIds,
  ]);
  const savedQuestionLibraryItems = useMemo<SavedQuestionLibraryItem[]>(() => {
    const reviewLabels: Record<ReviewStatus, string> = {
      due: 'Due now',
      learning: 'Learning',
      new: 'New',
      strong: 'Strong',
    };
    const reviewPriority: Record<ReviewStatus, number> = {
      due: 0,
      learning: 1,
      new: 2,
      strong: 3,
    };

    return bookmarkedQuestionIds
      .flatMap((questionId) => {
        const questionIndex = lessonQuestions.findIndex(
          (question) => question.id === questionId,
        );
        const question = lessonQuestions[questionIndex];

        if (!question) {
          return [];
        }

        const mastery = questionMastery[question.id];
        const accuracy =
          mastery && mastery.attempts > 0
            ? Math.round((mastery.correct / mastery.attempts) * 100)
            : null;
        const reviewStatus = getReviewStatus(mastery, reviewClock);

        return [
          {
            item: {
              accuracy,
              attempts: mastery?.attempts ?? 0,
              difficulty: question.difficultyLabel,
              id: question.id,
              prompt: question.prompt,
              questionIndex,
              reviewLabel: reviewLabels[reviewStatus],
              subtopic: question.subtopic,
              topic: question.topic,
              xp: question.xp,
            },
            reviewPriority: reviewPriority[reviewStatus],
            viewedAt: mastery?.lastAnsweredAt ?? 0,
          },
        ];
      })
      .sort(
        (left, right) =>
          left.reviewPriority - right.reviewPriority ||
          right.viewedAt - left.viewedAt ||
          left.item.topic.localeCompare(right.item.topic),
      )
      .map((entry) => entry.item);
  }, [bookmarkedQuestionIds, questionMastery, reviewClock]);
  const currentQuestionFormulaId = `question:${currentQuestion.id}`;
  const activeLabFormulaId = `lab:${activeLab.id}`;
  const isCurrentQuestionFormulaSaved =
    savedFormulaIds.includes(currentQuestionFormulaId);
  const isActiveLabFormulaSaved = savedFormulaIds.includes(activeLabFormulaId);
  const totalAttempts = Object.values(questionMastery).reduce(
    (sum, record) => sum + record.attempts,
    0,
  );
  const totalCorrect = Object.values(questionMastery).reduce(
    (sum, record) => sum + record.correct,
    0,
  );
  const practiceAccuracy =
    totalAttempts === 0 ? null : Math.round((totalCorrect / totalAttempts) * 100);
  const bankTopicMastery = useMemo<BankTopicMastery[]>(
    () =>
      topicSignals.map((topic) => {
        const question = lessonQuestions.find(
          (candidate) => candidate.topic === topic.topic,
        );
        const record = question ? questionMastery[question.id] : undefined;
        const collection = getBankCollectionForTopic(topic.topic);

        return {
          ...topic,
          accuracy:
            !record || record.attempts === 0
              ? 0
              : Math.round((record.correct / record.attempts) * 100),
          attempts: record?.attempts ?? 0,
          collectionId: collection.id,
          state: getBankTopicState(record),
        };
      }),
    [questionMastery],
  );
  const filteredBankTopics = useMemo(() => {
    const normalizedQuery = bankTopicQuery.trim().toLowerCase();

    return bankTopicMastery.filter((topic) => {
      const matchesCollection =
        bankCollectionId === 'all' || topic.collectionId === bankCollectionId;
      const matchesState =
        bankTopicFilter === 'all' || topic.state === bankTopicFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        topic.topic.toLowerCase().includes(normalizedQuery);

      return matchesCollection && matchesState && matchesQuery;
    });
  }, [
    bankCollectionId,
    bankTopicFilter,
    bankTopicMastery,
    bankTopicQuery,
  ]);
  const bankTopicStateCounts = {
    mastered: bankTopicMastery.filter((topic) => topic.state === 'mastered').length,
    new: bankTopicMastery.filter((topic) => topic.state === 'new').length,
    practiced: bankTopicMastery.filter((topic) => topic.state === 'practiced').length,
    review: bankTopicMastery.filter((topic) => topic.state === 'review').length,
  };
  const bankCollectionProgress = BANK_COLLECTIONS.map((collection) => {
    const collectionTopics = bankTopicMastery.filter(
      (topic) => topic.collectionId === collection.id,
    );

    return {
      ...collection,
      attempted: collectionTopics.filter((topic) => topic.state !== 'new').length,
      mastered: collectionTopics.filter((topic) => topic.state === 'mastered').length,
      review: collectionTopics.filter((topic) => topic.state === 'review').length,
    };
  });
  const recommendedBankTopics = [...bankTopicMastery]
    .sort((left, right) => {
      const priority: Record<BankTopicState, number> = {
        review: 0,
        practiced: 1,
        new: 2,
        mastered: 3,
      };

      return (
        priority[left.state] - priority[right.state] ||
        left.accuracy - right.accuracy ||
        left.topic.localeCompare(right.topic)
      );
    })
    .slice(0, 3);
  const recommendedBankCollection =
    bankCollectionProgress
      .filter(
        (collection) => !completedBankDiagnosticIds.includes(collection.id),
      )
      .sort(
        (left, right) =>
          right.review - left.review ||
          left.attempted - right.attempted ||
          left.label.localeCompare(right.label),
      )[0] ?? bankCollectionProgress[0];
  const RecommendedBankIcon = recommendedBankCollection.icon;
  const careerReadiness = useMemo(
    () =>
      careerTracks.map((career) =>
        getCareerReadiness(
          career,
          skillProgress,
          completedLabMissionIds,
          practiceAccuracy,
          lastSprintSummary,
          careerProjectRecords,
        ),
      ),
    [
      completedLabMissionIds,
      careerProjectRecords,
      lastSprintSummary,
      practiceAccuracy,
      skillProgress,
    ],
  );
  const careerReadinessByRole = useMemo(
    () =>
      Object.fromEntries(
        careerReadiness.map((readiness) => [readiness.role, readiness]),
      ) as Record<string, CareerReadiness>,
    [careerReadiness],
  );
  const selectedCareerReadiness =
    careerReadinessByRole[selectedCareer.role] ?? careerReadiness[0];
  const tunedCareerReadiness =
    careerReadinessByRole[tunedCareer.role] ?? careerReadiness[0];
  const visibleCareerTracks = useMemo(() => {
    const normalizedCareerQuery = normalizeSearchText(careerCatalogQuery);

    return careerTracks
      .filter((track) => track.role !== selectedCareer.role)
      .filter(
        (track) =>
          !normalizedCareerQuery ||
          normalizeSearchText(
            [
              track.role,
              track.focus,
              track.skills.join(' '),
              track.nextStep,
            ].join(' '),
          ).includes(normalizedCareerQuery),
      )
      .sort((left, right) => {
        if (careerCatalogSort === 'name') {
          return left.role.localeCompare(right.role);
        }

        const leftReadiness = careerReadinessByRole[left.role]?.score ?? 0;
        const rightReadiness = careerReadinessByRole[right.role]?.score ?? 0;

        return careerCatalogSort === 'growth'
          ? leftReadiness - rightReadiness || left.role.localeCompare(right.role)
          : rightReadiness - leftReadiness || left.role.localeCompare(right.role);
      });
  }, [
    careerCatalogQuery,
    careerCatalogSort,
    careerReadinessByRole,
    selectedCareer.role,
  ]);
  const skillMapNodes = useMemo<SkillMapNode[]>(
    () =>
      skillNodes.map((skill, skillIndex) => {
        const skillQuestions = lessonQuestions.filter(
          (question) => BANK_TOPIC_SKILL_IDS[question.topic] === skill.id,
        );
        const bankCollection =
          BANK_COLLECTIONS.map((collection) => ({
            collection,
            matchCount: collection.topics.filter(
              (topic) => BANK_TOPIC_SKILL_IDS[topic] === skill.id,
            ).length,
          })).sort(
            (left, right) =>
              right.matchCount - left.matchCount ||
              left.collection.label.localeCompare(right.collection.label),
          )[0]?.collection ?? BANK_COLLECTIONS[0];
        const relatedLab = labScenarios.find(
          (lab) =>
            lab.topic === skill.title ||
            BANK_TOPIC_SKILL_IDS[lab.topic] === skill.id,
        );
        const careerSkill = CAREER_PROFILES[tunedCareer.role].skills.find(
          (profileSkill) => profileSkill.id === skill.id,
        );

        return {
          attemptedQuestions: skillQuestions.filter(
            (question) => (questionMastery[question.id]?.attempts ?? 0) > 0,
          ).length,
          bankCollectionId: bankCollection.id,
          bankLabel: bankCollection.label,
          careerWeight: careerSkill?.weight ?? 0,
          difficulty: skill.difficulty,
          dueCount: skillQuestions.filter(
            (question) =>
              getReviewStatus(questionMastery[question.id], reviewClock) ===
              'due',
          ).length,
          icon: skill.icon,
          id: skill.id,
          lessons: skill.lessons,
          nextTitle: skillNodes[skillIndex + 1]?.title ?? null,
          prerequisiteTitle: skillNodes[skillIndex - 1]?.title ?? null,
          progress: skillProgress[skill.id] ?? skill.progress,
          relatedLabId: relatedLab?.id ?? null,
          relatedLabTitle: relatedLab?.title ?? null,
          status: skill.status,
          title: skill.title,
          unit: skill.unit,
        };
      }),
    [questionMastery, reviewClock, skillProgress, tunedCareer.role],
  );
  const skillMapDueCount = skillMapNodes.reduce(
    (sum, node) => sum + node.dueCount,
    0,
  );
  const skillMapAvailableCount = skillMapNodes.filter(
    (node) => node.status !== 'Locked',
  ).length;
  const learningSkillSignals = useMemo<LearningSkillSignal[]>(
    () =>
      skillMapNodes.map((node) => ({
        careerWeight: node.careerWeight,
        dueCount: node.dueCount,
        id: node.id,
        progress: node.progress,
        status: node.status,
        title: node.title,
        unit: node.unit,
      })),
    [skillMapNodes],
  );
  const activeSkillMapNode =
    skillMapNodes.find((node) => node.id === activeSkillId) ?? skillMapNodes[0];
  const comparisonCareer =
    careerTracks.find((track) => track.role === comparisonCareerRole) ??
    careerTracks.find((track) => track.role !== selectedCareer.role) ??
    careerTracks[0];
  const comparisonCareerReadiness =
    careerReadinessByRole[comparisonCareer.role] ?? careerReadiness[0];
  const portfolioEvidence = useMemo(
    () =>
      getPortfolioEvidence({
        careerProjectRecords,
        completedBankDiagnosticIds,
        completedFaultCaseIds,
        completedLabMissionIds,
        formulaConfidence,
        savedCircuitDesigns,
        savedFormulaIds,
      }),
    [
      careerProjectRecords,
      completedBankDiagnosticIds,
      completedFaultCaseIds,
      completedLabMissionIds,
      formulaConfidence,
      savedCircuitDesigns,
      savedFormulaIds,
    ],
  );
  const availablePortfolioEvidenceIds = new Set(
    portfolioEvidence.map((item) => item.id),
  );
  const activePortfolioFeaturedIds = portfolioFeaturedIds.filter((evidenceId) =>
    availablePortfolioEvidenceIds.has(evidenceId),
  );
  const isCurrentQuestionBookmarked = bookmarkedQuestionIds.includes(currentQuestion.id);
  const currentQuestionMastery = questionMastery[currentQuestion.id];
  const practiceModeLabel =
    PRACTICE_MODES.find((mode) => mode.id === practiceMode)?.label ?? 'Path';
  const currentLevel = Math.floor(earnedXp / XP_PER_LEVEL) + 1;
  const levelStartXp = (currentLevel - 1) * XP_PER_LEVEL;
  const levelProgress = Math.min(
    100,
    ((earnedXp - levelStartXp) / XP_PER_LEVEL) * 100,
  );
  const xpToNextLevel = currentLevel * XP_PER_LEVEL - earnedXp;
  const averageSkillProgress = Math.round(
    Object.values(skillProgress).reduce((sum, progress) => sum + progress, 0) /
      skillNodes.length,
  );
  const tunedSkillIds = new Set(
    tunedCareerReadiness.profile.skills.map((skill) => skill.id),
  );
  const careerAdaptiveSkills = skillNodes.filter(
    (skill) => skill.status !== 'Locked' && tunedSkillIds.has(skill.id),
  );
  const adaptiveSkill = (
    careerAdaptiveSkills.length > 0
      ? careerAdaptiveSkills
      : skillNodes.filter((skill) => skill.status !== 'Locked')
  )
    .reduce((weakestSkill, skill) => {
      const weakestProgress =
        skillProgress[weakestSkill.id] ?? weakestSkill.progress;
      const currentProgress = skillProgress[skill.id] ?? skill.progress;
      return currentProgress < weakestProgress ? skill : weakestSkill;
    }, skillNodes[0]);
  const adaptiveSkillProgress =
    skillProgress[adaptiveSkill.id] ?? adaptiveSkill.progress;
  const tutorSkillId =
    activePage === 'lesson'
      ? BANK_TOPIC_SKILL_IDS[currentQuestion.topic] ?? activeSkill.id
      : activeSkill.id;
  const tutorSkill =
    skillNodes.find((skill) => skill.id === tutorSkillId) ?? activeSkill;
  const tutorSkillProgress =
    skillProgress[tutorSkill.id] ?? tutorSkill.progress;
  const tutorSkillQuestion =
    lessonQuestions.find(
      (question) => BANK_TOPIC_SKILL_IDS[question.topic] === tutorSkill.id,
    ) ?? currentQuestion;
  const tutorRelatedLab =
    labScenarios.find(
      (lab) => BANK_TOPIC_SKILL_IDS[lab.topic] === tutorSkill.id,
    ) ?? activeLab;
  const tutorContext: ZyTutorContext = (() => {
    if (activePage === 'lesson') {
      return {
        assumptions: currentQuestion.assumptions,
        careerContext: currentQuestion.careerContext,
        description: currentQuestion.prompt,
        dueCount: reviewQuestionIds.length,
        explanation: currentQuestion.explanation,
        formula: currentQuestion.formula,
        id: `question-${currentQuestion.id}`,
        kind: 'question',
        labId: tutorRelatedLab.id,
        mastery: tutorSkillProgress,
        prompt: currentQuestion.prompt,
        solution: currentQuestion.solution,
        subtitle: `${currentQuestion.subtopic} · ${currentQuestion.difficultyLabel}`,
        title: currentQuestion.topic,
      };
    }

    if (activePage === 'lab' || activePage === 'workbench') {
      return {
        assumptions: activeLab.assumptions,
        careerContext: `This bench work builds measurement, calibration, and explanation evidence for ${tunedCareer.role}.`,
        description:
          activePage === 'workbench'
            ? `Build and verify a circuit connected to ${activeLab.topic}.`
            : activeLabMission.brief,
        dueCount: reviewQuestionIds.length,
        explanation: activeLab.result,
        formula: activeLab.formula,
        id: `lab-${activeLab.id}-${activeLabMission.id}`,
        kind: 'lab',
        labId: activeLab.id,
        mastery: tutorSkillProgress,
        subtitle:
          activePage === 'workbench'
            ? 'Circuit Workbench'
            : `${activeLabMission.title} · ${activeLab.topic}`,
        title: activeLab.title,
      };
    }

    if (
      activePage === 'career' ||
      activePage === 'career-project' ||
      activePage === 'portfolio'
    ) {
      return {
        careerContext: `${selectedCareer.role} work draws on ${selectedCareer.skills
          .slice(0, 3)
          .join(', ')}. ${selectedCareer.nextStep}`,
        description: selectedCareer.nextStep,
        dueCount: reviewQuestionIds.length,
        formula: tutorSkillQuestion.formula,
        id: `career-${selectedCareer.role}`,
        kind: 'career',
        labId: activeCareerProject.labId,
        mastery: tutorSkillProgress,
        subtitle: selectedCareer.focus,
        title: selectedCareer.role,
      };
    }

    if (activePage === 'focus-room') {
      return {
        careerContext: `Focused work on ${tutorSkill.title} strengthens the evidence behind your ${tunedCareer.role} path.`,
        description: focusSession
          ? `${focusSession.objectiveDetail}${
              focusSession.intention ? ` Your intention: ${focusSession.intention}` : ''
            }`
          : 'Choose one result to produce, protect the session, and capture what you learned.',
        dueCount: reviewQuestionIds.length,
        formula: tutorSkillQuestion.formula,
        id: `focus-${focusSession?.id ?? tutorSkill.id}`,
        kind: 'focus',
        labId: tutorRelatedLab.id,
        mastery: tutorSkillProgress,
        subtitle: focusSession
          ? focusSession.objectiveTitle
          : 'Deliberate study session',
        title: focusSession?.objectiveTitle ?? 'Focus Room',
      };
    }

    return {
      assumptions: tutorSkillQuestion.assumptions,
      careerContext: `${tutorSkill.title} supports ${tunedCareer.role}. ${tunedCareer.nextStep}`,
      description:
        guideContent.messages[0] ??
        `Strengthen ${tutorSkill.title} with one deliberate practice set.`,
      dueCount: reviewQuestionIds.length,
      explanation: tutorSkillQuestion.explanation,
      formula: tutorSkillQuestion.formula,
      id: `skill-${tutorSkill.id}-${activeSection}`,
      kind: 'skill',
      labId: tutorRelatedLab.id,
      mastery: tutorSkillProgress,
      subtitle: `${guideContent.label} · ${activeSection}`,
      title: tutorSkill.title,
    };
  })();
  const activeViewLabel = getActiveViewLabel({
    activeAtlasId,
    activeLab,
    activePage,
    activeSection,
    currentQuestion,
    currentQuestionIndex,
    selectedCareer,
  });
  const recentLearningCandidate = useMemo<RecentLearningItem | null>(() => {
    let candidate: Omit<RecentLearningItem, 'id' | 'routeHash' | 'viewedAt'> | null =
      null;
    let resourceId: string | null = null;

    if (activePage === 'lesson') {
      candidate = {
        kind: 'Question',
        subtitle: `${currentQuestion.subtopic} · ${currentQuestion.difficultyLabel}`,
        title: currentQuestion.topic,
      };
      resourceId = currentQuestion.id;
    } else if (activePage === 'lab' || activePage === 'workbench') {
      candidate = {
        kind: 'Lab',
        subtitle:
          activePage === 'workbench'
            ? `${activeLab.topic} · Circuit workbench`
            : `${activeLabCompletedMissionCount}/${activeLabMissions.length} missions · ${activeLabCompletedFaultCount}/${activeLabFaultCases.length} faults`,
        title:
          activePage === 'workbench'
            ? `${activeLab.title} Workbench`
            : activeLab.title,
      };
      resourceId = activeLab.id;
    } else if (activePage === 'concept') {
      const concept = getElectricalConcept(activeAtlasId);
      if (concept) {
        candidate = {
          kind: 'Concept',
          subtitle: `${concept.level} · ${concept.interactiveLabel}`,
          title: concept.title,
        };
        resourceId = concept.id;
      }
    } else if (activePage === 'game') {
      const game = getEngineeringGame(activeAtlasId);
      if (game) {
        candidate = {
          kind: 'Game',
          subtitle: `${game.duration} · ${game.skill}`,
          title: game.title,
        };
        resourceId = game.id;
      }
    } else if (
      activePage === 'career' ||
      activePage === 'career-project' ||
      activePage === 'portfolio'
    ) {
      const answeredProjectDecisions = Object.keys(
        activeCareerProjectRecord?.answers ?? {},
      ).length;
      candidate = {
        kind: 'Career',
        subtitle:
          activePage === 'career-project'
            ? `${selectedCareer.role} · ${answeredProjectDecisions}/${activeCareerProject.decisions.length} decisions`
            : activePage === 'portfolio'
              ? `${activePortfolioFeaturedIds.length} featured items · ${selectedCareer.role}`
              : `${selectedCareerReadiness.score}% readiness · ${selectedCareer.focus}`,
        title:
          activePage === 'career-project'
            ? activeCareerProject.title
            : activePage === 'portfolio'
              ? `${selectedCareer.role} Portfolio`
              : selectedCareer.role,
      };
      resourceId = selectedCareer.role;
    }

    if (!candidate || !resourceId) {
      return null;
    }

    const routeHash = buildAppHash({
      page: activePage,
      resourceId,
      section: activeSection,
    });

    return {
      ...candidate,
      id: `${candidate.kind}:${routeHash}`,
      routeHash,
      viewedAt: Date.now(),
    };
  }, [
    activeAtlasId,
    activeCareerProject.decisions.length,
    activeCareerProject.title,
    activeCareerProjectRecord?.answers,
    activeLab.id,
    activeLab.title,
    activeLab.topic,
    activeLabCompletedFaultCount,
    activeLabCompletedMissionCount,
    activeLabFaultCases.length,
    activeLabMissions.length,
    activePage,
    activePortfolioFeaturedIds.length,
    activeSection,
    currentQuestion.difficultyLabel,
    currentQuestion.id,
    currentQuestion.subtopic,
    currentQuestion.topic,
    selectedCareer.focus,
    selectedCareer.role,
    selectedCareerReadiness.score,
  ]);
  const documentViewLabel = isAuthenticated
    ? activeViewLabel
    : entryView === 'intro'
      ? 'Get Started'
      : authMode === 'create'
        ? 'Create Account'
        : authMode === 'reset'
          ? 'Reset Password'
          : 'Sign In';
  const routeFocusKey = isAuthenticated
    ? [
        activePage,
        activeSection,
        activePage === 'concept' || activePage === 'game'
          ? activeAtlasId
          : activePage === 'lesson'
          ? currentQuestion.id
          : activePage === 'lab' || activePage === 'workbench'
            ? activeLab.id
            : activePage === 'career' ||
                activePage === 'career-project' ||
                activePage === 'portfolio'
              ? selectedCareer.role
              : activePage === 'skill-map'
                ? activeSkillId
                : '',
      ].join(':')
    : `entry:${entryView}:${authMode}`;
  const focusObjectives: FocusObjective[] = [
    {
      detail:
        reviewQuestionIds.length > 0
          ? `Complete the next ${Math.min(5, reviewQuestionIds.length)} scheduled checks.`
          : 'Run a short recall set before adding new material.',
      icon: RotateCcw,
      id: 'review',
      label:
        reviewQuestionIds.length > 0
          ? 'Clear review pressure'
          : 'Strengthen retention',
      signal:
        reviewQuestionIds.length > 0
          ? `${reviewQuestionIds.length} due now`
          : `${reviewStatusCounts.strong} strong signals`,
    },
    {
      detail: `Raise ${adaptiveSkill.title} with one deliberate practice set.`,
      icon: Target,
      id: 'practice',
      label: `Practice ${adaptiveSkill.title}`,
      signal: `${Math.round(adaptiveSkillProgress)}% mastery`,
    },
    {
      detail: `Complete the next calibration or fault task in ${activeLab.title}.`,
      icon: FlaskConical,
      id: 'lab',
      label: activeLab.title,
      signal: `${activeLabCompletedMissionCount}/${activeLabMissions.length} missions`,
    },
    {
      detail: studyRoute
        ? `Move the next step in your ${studyRoute.config.duration}-minute route.`
        : 'Build a focused route across review, practice, and applied work.',
      icon: Route,
      id: 'route',
      label: studyRoute
        ? studyRoute.completedAt
          ? 'Build a new Study Route'
          : 'Resume your Study Route'
        : 'Build a Study Route',
      signal: studyRoute
        ? `${studyRoute.completedStepIds.length}/${studyRoute.steps.length} steps`
        : 'Guided sequence',
    },
  ];
  const isSprintActive = sprintState !== null && sprintState.completedAt === null;
  const sprintAnswered = sprintState?.results.length ?? 0;
  const sprintTarget = sprintState?.questionIndices.length ?? SPRINT_LENGTH;
  const comebackEarned = Object.values(questionMastery).some(
    (record) => record.attempts >= 2 && record.lastResult === 'correct',
  );
  const retainedQuestionCount = Object.values(questionMastery).filter(
    (record) => record.reviewStage >= 3,
  ).length;
  const completedCareerProjectCount = Object.values(
    careerProjectRecords,
  ).filter((record) => record.completedAt !== null).length;
  const achievements: Achievement[] = [
    {
      id: 'first-spark',
      title: 'First Spark',
      description: 'Complete your first practice attempt.',
      progress: `${Math.min(1, totalAttempts)}/1 attempt`,
      unlocked: totalAttempts >= 1,
      icon: Zap,
    },
    {
      id: 'comeback-circuit',
      title: 'Comeback Circuit',
      description: 'Correct a question after previously missing it.',
      progress: comebackEarned ? 'Recovered' : 'Waiting for a retry',
      unlocked: comebackEarned,
      icon: RotateCcw,
    },
    {
      id: 'memory-circuit',
      title: 'Memory Circuit',
      description: 'Advance three questions to retention stage three.',
      progress: `${Math.min(3, retainedQuestionCount)}/3 retained`,
      unlocked: retainedQuestionCount >= 3,
      icon: BrainCircuit,
    },
    {
      id: 'curated-stack',
      title: 'Curated Stack',
      description: 'Save three questions for focused practice.',
      progress: `${Math.min(3, bookmarkedQuestionIds.length)}/3 saved`,
      unlocked: bookmarkedQuestionIds.length >= 3,
      icon: Bookmark,
    },
    {
      id: 'field-notes',
      title: 'Field Notes',
      description: 'Save three engineering formulas to your notebook.',
      progress: `${Math.min(3, savedFormulaIds.length)}/3 formulas`,
      unlocked: savedFormulaIds.length >= 3,
      icon: NotebookTabs,
    },
    {
      id: 'formula-fluent',
      title: 'Formula Fluent',
      description: 'Complete your first quick-recall formula round.',
      progress: `${Math.min(1, formulaReviewCompletions)}/1 round`,
      unlocked: formulaReviewCompletions >= 1,
      icon: BrainCircuit,
    },
    {
      id: 'bench-ready',
      title: 'Bench Ready',
      description: 'Save a live lab configuration.',
      progress: `${Math.min(1, labSaveCount)}/1 lab`,
      unlocked: labSaveCount >= 1,
      icon: FlaskConical,
    },
    {
      id: 'circuit-architect',
      title: 'Circuit Architect',
      description: 'Validate and save a Circuit Workbench design.',
      progress: `${Math.min(1, workbenchSaveCount)}/1 design`,
      unlocked: workbenchSaveCount >= 1,
      icon: BatteryCharging,
    },
    {
      id: 'bench-calibrator',
      title: 'Bench Calibrator',
      description: 'Complete three live lab calibration missions.',
      progress: `${Math.min(3, completedLabMissionIds.length)}/3 missions`,
      unlocked: completedLabMissionIds.length >= 3,
      icon: CircleGauge,
    },
    {
      id: 'fault-finder',
      title: 'Fault Finder',
      description: 'Diagnose three engineering lab faults.',
      progress: `${Math.min(3, completedFaultCaseIds.length)}/3 cases`,
      unlocked: completedFaultCaseIds.length >= 3,
      icon: Wrench,
    },
    {
      id: 'daily-charge',
      title: 'Daily Charge',
      description: 'Complete all three daily missions.',
      progress: `${dailyMissionCompletedCount}/3 missions`,
      unlocked: allDailyMissionsComplete,
      icon: Target,
    },
    {
      id: 'steady-current',
      title: 'Steady Current',
      description: 'Build a seven-day learning streak.',
      progress: `${Math.min(7, currentStreak)}/7 days`,
      unlocked: currentStreak >= 7,
      icon: Activity,
    },
    {
      id: 'precision-run',
      title: 'Precision Run',
      description: 'Reach 80% accuracy across ten attempts.',
      progress: `${practiceAccuracy ?? 0}% · ${Math.min(10, totalAttempts)}/10`,
      unlocked:
        totalAttempts >= 10 && practiceAccuracy !== null && practiceAccuracy >= 80,
      icon: Award,
    },
    {
      id: 'power-surge',
      title: 'Power Surge',
      description: 'Complete a five-question Power Sprint.',
      progress:
        lastSprintSummary?.source === 'power' ? 'Sprint complete' : '0/1 sprint',
      unlocked: lastSprintSummary?.source === 'power',
      icon: Trophy,
    },
    {
      id: 'session-architect',
      title: 'Session Architect',
      description: 'Build and complete a custom practice session.',
      progress: `${Math.min(1, customSessionCompletions)}/1 session`,
      unlocked: customSessionCompletions >= 1,
      icon: SlidersHorizontal,
    },
    {
      id: 'pattern-breaker',
      title: 'Pattern Breaker',
      description: 'Complete your first targeted Mistake Recovery sprint.',
      progress: `${Math.min(1, mistakeRecoveryCompletions)}/1 recovery`,
      unlocked: mistakeRecoveryCompletions >= 1,
      icon: BrainCircuit,
    },
    {
      id: 'calibrated-mind',
      title: 'Calibrated Mind',
      description: 'Complete your first confidence-rated Checkpoint Exam.',
      progress: `${Math.min(1, checkpointExamCompletionCount)}/1 checkpoint`,
      unlocked: checkpointExamCompletionCount >= 1,
      icon: ShieldCheck,
    },
    {
      id: 'route-runner',
      title: 'Route Runner',
      description: 'Complete your first Zy-guided cross-app study route.',
      progress: `${Math.min(1, studyRouteCompletionCount)}/1 route`,
      unlocked: studyRouteCompletionCount >= 1,
      icon: Route,
    },
    {
      id: 'career-compass',
      title: 'Career Compass',
      description: 'Reach 50% readiness on your active career path.',
      progress: `${tunedCareerReadiness.score}% readiness`,
      unlocked: tunedCareerReadiness.score >= 50,
      icon: GraduationCap,
    },
    {
      id: 'project-evidence',
      title: 'Project Evidence',
      description: 'Complete your first role-based career project.',
      progress: `${Math.min(1, completedCareerProjectCount)}/1 project`,
      unlocked: completedCareerProjectCount >= 1,
      icon: Target,
    },
    {
      id: 'evidence-curator',
      title: 'Evidence Curator',
      description: 'Complete your first three-item career portfolio.',
      progress: `${Math.min(1, portfolioPublishCount)}/1 portfolio`,
      unlocked: portfolioPublishCount >= 1,
      icon: Award,
    },
    {
      id: 'domain-scout',
      title: 'Domain Scout',
      description: 'Complete your first Question Bank domain diagnostic.',
      progress: `${Math.min(1, completedBankDiagnosticIds.length)}/1 diagnostic`,
      unlocked: completedBankDiagnosticIds.length >= 1,
      icon: Search,
    },
  ];
  const unlockedAchievements = achievements.filter(
    (achievement) => achievement.unlocked,
  );
  const unlockedAchievementCount = unlockedAchievements.length;
  const latestUnlockedAchievement =
    unlockedAchievements[unlockedAchievements.length - 1] ?? null;
  const liveNotifications: AppNotification[] = [
    ...(allDailyMissionsComplete && !dailyMissionRewardClaimed
      ? [
          {
            action: 'claim-daily' as const,
            actionLabel: `Claim +${DAILY_MISSION_REWARD_XP} XP`,
            description:
              'All three Daily Charge missions are complete. Your XP is ready.',
            icon: Trophy,
            id: 'daily-reward-ready',
            revision: currentActivityDate,
            title: 'Daily reward ready',
            tone: 'ready' as const,
          },
        ]
      : []),
    ...(reviewQuestionIds.length > 0
      ? [
          {
            action: 'review' as const,
            actionLabel: 'Open review plan',
            description: `${reviewQuestionIds.length} scheduled ${
              reviewQuestionIds.length === 1 ? 'check is' : 'checks are'
            } ready for retrieval practice.`,
            icon: BrainCircuit,
            id: 'review-due',
            revision: String(reviewQuestionIds.length),
            title: `${reviewQuestionIds.length} ${
              reviewQuestionIds.length === 1 ? 'review is' : 'reviews are'
            } due`,
            tone: 'attention' as const,
          },
        ]
      : []),
    ...(weeklyPlanComplete &&
    currentWeeklyPlan &&
    currentWeeklyPlan.rewardClaimedAt === null
      ? [
          {
            action: 'weekly-plan' as const,
            actionLabel: 'Open weekly plan',
            description: `Your weekly targets are complete. The +${WEEKLY_PLAN_REWARD_XP} XP reward is waiting.`,
            icon: CalendarDays,
            id: 'weekly-reward-ready',
            revision: currentWeeklyPlan.weekKey,
            title: 'Weekly plan complete',
            tone: 'ready' as const,
          },
        ]
      : []),
    ...(heartsRemaining < MAX_HEARTS
      ? [
          {
            action: 'hearts' as const,
            actionLabel: 'View recharge',
            description: `${heartsRemaining}/${MAX_HEARTS} hearts available. Next heart in ${formatHeartCountdown(
              nextHeartInMs,
            )}.`,
            icon: Heart,
            id: 'heart-recharge',
            revision: String(heartsRemaining),
            title: 'Hearts are recharging',
            tone: 'status' as const,
          },
        ]
      : []),
    ...(latestUnlockedAchievement
      ? [
          {
            action: 'progress' as const,
            actionLabel: 'View achievements',
            description: `${latestUnlockedAchievement.title} is in your cabinet. ${unlockedAchievementCount}/${achievements.length} achievements unlocked.`,
            icon: latestUnlockedAchievement.icon,
            id: `achievement-${latestUnlockedAchievement.id}`,
            title: 'Achievement unlocked',
            tone: 'achievement' as const,
          },
        ]
      : []),
  ].slice(0, 5);
  const unreadNotificationCount = liveNotifications.filter(
    (notification) =>
      !readNotificationKeys.includes(getNotificationReadKey(notification)),
  ).length;

  const practicePathStateCounts = useMemo(
    () =>
      skillNodes.reduce<Record<PracticePathState, number>>(
        (counts, skill) => {
          const progress = skillProgress[skill.id] ?? skill.progress;
          const state: PracticePathState =
            skill.status === 'Locked'
              ? 'locked'
              : progress >= 70
                ? 'strong'
                : 'continue';

          counts[state] += 1;
          return counts;
        },
        { continue: 0, locked: 0, strong: 0 },
      ),
    [skillProgress],
  );
  const filteredSkills = useMemo(() => {
    const normalizedPathQuery = normalizeSearchText(practicePathQuery);

    return skillNodes.filter((skill) => {
      const progress = skillProgress[skill.id] ?? skill.progress;
      const state: PracticePathState =
        skill.status === 'Locked'
          ? 'locked'
          : progress >= 70
            ? 'strong'
            : 'continue';
      const matchesFilter =
        practicePathFilter === 'all' || state === practicePathFilter;
      const matchesQuery =
        !normalizedPathQuery ||
        normalizeSearchText(
          [
            skill.title,
            skill.unit,
            skill.careerSignal,
            skill.status,
            `level ${skill.difficulty}`,
          ].join(' '),
        ).includes(normalizedPathQuery);

      return matchesFilter && matchesQuery;
    });
  }, [practicePathFilter, practicePathQuery, skillProgress]);

  const searchIndex = useMemo<SearchResult[]>(
    () => [
      ...navigation.map((item) => ({
        id: item.id,
        kind: 'Section' as const,
        keywords: `${sectionTitles[item.id]} workspace home`,
        subtitle: sectionDescriptions[item.id],
        title: item.label,
      })),
      ...electricalConcepts.map((concept) => ({
        id: concept.id,
        kind: 'Concept' as const,
        keywords: [
          concept.keywords,
          concept.domain,
          concept.unit,
          concept.summary,
          concept.equation,
          concept.applications.join(' '),
          concept.principles.join(' '),
        ].join(' '),
        subtitle: `${concept.level} · ${concept.interactiveLabel}`,
        title: concept.title,
      })),
      ...engineeringGames.map((game) => ({
        id: game.id,
        kind: 'Game' as const,
        keywords: [
          game.skill,
          game.domain,
          game.description,
          game.conceptIds
            .map(
              (conceptId) =>
                getElectricalConcept(conceptId)?.title ?? conceptId,
            )
            .join(' '),
          'interactive challenge play simulator',
        ].join(' '),
        subtitle: `${game.duration} · ${game.skill}`,
        title: game.title,
      })),
      {
        id: 'focus-room',
        kind: 'Tool',
        keywords: 'timer concentration protected study block',
        subtitle: 'One objective, a persistent timer, and a short debrief',
        title: 'Focus Room',
      },
      {
        id: 'study-route',
        kind: 'Tool',
        keywords: 'guided plan sequence cross app',
        subtitle: 'Connect review, practice, labs, and career work',
        title: 'Study Route',
      },
      {
        id: 'study-list',
        kind: 'Tool',
        keywords: 'queue save collect organize next learning targets',
        subtitle: 'Collect and order your next learning targets',
        title: 'Study List',
      },
      {
        id: 'review-plan',
        kind: 'Tool',
        keywords: 'smart review due retrieval spaced repetition',
        subtitle: 'Scheduled recall and spaced review',
        title: 'Smart Review',
      },
      {
        id: 'mistake-lab',
        kind: 'Tool',
        keywords: 'wrong missed recovery reflection repairs',
        subtitle: 'Repair missed questions by cause',
        title: 'Mistake Lab',
      },
      {
        id: 'checkpoint-exam',
        kind: 'Tool',
        keywords: 'test assessment confidence exam',
        subtitle: 'Confidence-rated engineering assessment',
        title: 'Checkpoint Exam',
      },
      {
        id: 'skill-map',
        kind: 'Tool',
        keywords: 'mastery graph units progress career lens',
        subtitle: 'Mastery, review, and career lenses',
        title: 'Skill Map',
      },
      {
        id: 'weekly-plan',
        kind: 'Tool',
        keywords: 'calendar schedule targets goals week',
        subtitle: 'Plan repeatable study targets for the week',
        title: 'Weekly Plan',
      },
      {
        id: 'progress',
        kind: 'Tool',
        keywords: 'achievements xp streak history stats',
        subtitle: 'Achievements, XP, streaks, and history',
        title: 'Progress',
      },
      {
        id: 'insights',
        kind: 'Tool',
        keywords: 'analytics trends retention readiness data',
        subtitle: 'Learning trends, retention, and readiness',
        title: 'Learning Insights',
      },
      {
        id: 'toolkit',
        kind: 'Tool',
        keywords:
          'calculator convert references equations resistor color bands voltage divider led current limiter rc timing cutoff filter',
        subtitle: 'Circuit calculators, component sizing, and conversions',
        title: 'Engineering Toolkit',
      },
      {
        id: 'circuit-workbench',
        kind: 'Tool',
        keywords: 'build resistor series parallel validate design',
        subtitle: 'Build and validate resistor networks',
        title: 'Circuit Workbench',
      },
      {
        id: 'saved-practice',
        kind: 'Tool',
        keywords: 'bookmarks saved questions practice',
        subtitle: 'Practice your bookmarked question set',
        title: 'Saved Questions',
      },
      {
        id: 'power-sprint',
        kind: 'Tool',
        keywords: 'challenge five questions speed adaptive',
        subtitle: 'Start a five-question adaptive challenge',
        title: 'Power Sprint',
      },
      ...fieldNotes.map((note) => ({
        id: note.id,
        kind: 'Note' as const,
        keywords: [
          note.body,
          note.category,
          note.pinned ? 'pinned important' : '',
          'field journal personal note',
        ].join(' '),
        subtitle: `${
          note.category[0].toUpperCase() + note.category.slice(1)
        } note${note.pinned ? ' · Pinned' : ''}`,
        title: note.title,
      })),
      ...labRunHistory.map((run) => {
        const lab = labScenarios.find((candidate) => candidate.id === run.labId);

        return {
          id: run.id,
          kind: 'Bench Run' as const,
          keywords: [
            run.output,
            lab?.topic ?? '',
            lab?.formula ?? '',
            Object.entries(run.values)
              .map(([key, value]) => `${key} ${value}`)
              .join(' '),
            'saved setup restore experiment instrument',
          ].join(' '),
          subtitle: `${run.output} · Saved ${formatSearchArtifactDate(
            run.savedAt,
          )}`,
          title: lab?.title ?? 'Saved lab run',
        };
      }),
      ...skillNodes.map((skill) => ({
        id: skill.id,
        kind: 'Skill' as const,
        keywords: `${skill.unit} ${skill.careerSignal} ${skill.status}`,
        subtitle: `${skill.unit} · ${skill.careerSignal}`,
        title: skill.title,
      })),
      ...labScenarios.map((lab) => ({
        id: lab.id,
        kind: 'Lab' as const,
        keywords: [
          lab.topic,
          lab.status,
          lab.assumptions,
          lab.formula,
          lab.visualLabel,
          lab.metric,
          lab.result,
          'interactive simulator bench experiment',
        ].join(' '),
        subtitle: `${lab.topic} · ${lab.status}`,
        title: lab.title,
      })),
      ...FORMULA_LIBRARY.map((entry) => ({
        id: entry.id,
        kind: 'Formula' as const,
        keywords: `${entry.assumptions} ${entry.context} ${entry.subtitle} ${entry.source}`,
        subtitle: `${entry.formula} · ${entry.subtitle}`,
        title: entry.title,
      })),
      ...careerTracks.map((career) => ({
        id: career.role,
        kind: 'Career' as const,
        keywords: `${career.focus} ${career.skills.join(' ')} ${career.nextStep}`,
        subtitle: `${careerReadinessByRole[career.role]?.score ?? 0}% readiness · ${career.skills.join(', ')}`,
        title: career.role,
      })),
      ...lessonQuestions.map((question) => ({
        id: question.id,
        kind: 'Question' as const,
        keywords: [
          question.prompt,
          question.formula,
          question.explanation,
          question.solution,
          question.assumptions,
          question.careerContext,
          question.diagramAlt,
          question.visualLabel,
        ].join(' '),
        subtitle: `${question.topic} · ${question.difficultyLabel} · +${question.xp} XP`,
        title: question.subtopic,
      })),
    ],
    [careerReadinessByRole, fieldNotes, labRunHistory],
  );
  const studyListCatalog = useMemo<StudyListResource[]>(
    () =>
      searchIndex.flatMap((result) =>
        isStudyListKind(result.kind)
          ? [
              {
                id: result.id,
                kind: result.kind,
                subtitle: result.subtitle,
                title: result.title,
              },
            ]
          : [],
      ),
    [searchIndex],
  );
  const currentStudyListResource = useMemo<StudyListResource | null>(() => {
    let id: string | null = null;
    let kind: StudyListResource['kind'] | null = null;

    if (activePage === 'lesson') {
      id = currentQuestion.id;
      kind = 'Question';
    } else if (activePage === 'lab' || activePage === 'workbench') {
      id = activeLab.id;
      kind = 'Lab';
    } else if (activePage === 'concept' && activeAtlasId) {
      id = activeAtlasId;
      kind = 'Concept';
    } else if (activePage === 'game' && activeAtlasId) {
      id = activeAtlasId;
      kind = 'Game';
    } else if (
      activePage === 'career' ||
      activePage === 'career-project' ||
      activePage === 'portfolio'
    ) {
      id = selectedCareer.role;
      kind = 'Career';
    } else if (activePage === 'skill-map') {
      id = activeSkillMapNode.id;
      kind = 'Skill';
    }

    return id && kind
      ? studyListCatalog.find(
          (resource) => resource.id === id && resource.kind === kind,
        ) ?? null
      : null;
  }, [
    activeAtlasId,
    activeLab.id,
    activePage,
    activeSkillMapNode.id,
    currentQuestion.id,
    selectedCareer.role,
    studyListCatalog,
  ]);
  const currentStudyListItem = currentStudyListResource
    ? studyListItems.find(
        (item) =>
          getStudyListItemKey(item) ===
          getStudyListItemKey(currentStudyListResource),
      ) ?? null
    : null;
  const activeStudyListItems = studyListItems.filter(
    (item) => item.completedAt === null,
  );
  const currentStudyListQueueIndex = currentStudyListResource
    ? activeStudyListItems.findIndex(
        (item) =>
          getStudyListItemKey(item) ===
          getStudyListItemKey(currentStudyListResource),
      )
    : -1;
  const nextStudyListItem = (() => {
    if (activeStudyListItems.length === 0) {
      return null;
    }

    if (currentStudyListQueueIndex < 0) {
      return activeStudyListItems[0];
    }

    return activeStudyListItems.length > 1
      ? activeStudyListItems[
          (currentStudyListQueueIndex + 1) % activeStudyListItems.length
        ]
      : null;
  })();
  const rankedSearchResults = useMemo<SearchResult[]>(() => {
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) {
      return [];
    }

    return searchIndex
      .map((result) => ({
        result,
        score: getSearchResultScore(result, normalizedQuery),
      }))
      .filter(
        (
          entry,
        ): entry is {
          result: SearchResult;
          score: number;
        } => entry.score !== null,
      )
      .sort(
        (left, right) =>
          left.score - right.score ||
          SEARCH_KIND_PRIORITY[left.result.kind] -
            SEARCH_KIND_PRIORITY[right.result.kind] ||
          left.result.title.localeCompare(right.result.title),
      )
      .map((entry) => entry.result);
  }, [query, searchIndex]);
  const searchKindCounts = useMemo(() => {
    const counts = Object.fromEntries(
      SEARCH_RESULT_KINDS.map((kind) => [kind, 0]),
    ) as Record<SearchResultKind, number>;

    rankedSearchResults.forEach((result) => {
      counts[result.kind] += 1;
    });

    return counts;
  }, [rankedSearchResults]);
  const availableSearchKindFilters = SEARCH_RESULT_KINDS.filter(
    (kind) => searchKindCounts[kind] > 0,
  );
  const searchResults = useMemo(
    () =>
      rankedSearchResults
        .filter(
          (result) =>
            searchKindFilter === 'All' || result.kind === searchKindFilter,
        )
        .slice(0, 8),
    [rankedSearchResults, searchKindFilter],
  );
  const recentLearningSearchResults = useMemo<SearchResult[]>(
    () =>
      recentLearningItems.map((item) => ({
        id: item.id,
        kind: item.kind,
        routeHash: item.routeHash,
        subtitle: item.subtitle,
        title: item.title,
      })),
    [recentLearningItems],
  );
  const activeSessionResults = useMemo<SearchResult[]>(() => {
    const sessions: SearchResult[] = [];

    if (isSprintActive) {
      sessions.push({
        id: 'power-sprint',
        kind: 'Tool',
        subtitle: `${sprintAnswered}/${sprintTarget} questions answered · ${
          sprintState?.paused ? 'paused' : 'in progress'
        }`,
        title: `Resume ${sprintState?.label ?? 'Power Sprint'}`,
      });
    }

    if (focusSession && focusSession.endedAt === null) {
      sessions.push({
        id: 'focus-room',
        kind: 'Tool',
        subtitle: `${formatFocusTimer(focusRemainingMs)} remaining · ${
          focusSession.pausedAt === null ? 'timer running' : 'paused'
        }`,
        title:
          focusSession.pausedAt === null
            ? 'Return to Focus Room'
            : 'Resume Focus Session',
      });
    }

    if (checkpointExam && checkpointExam.completedAt === null) {
      sessions.push({
        id: 'checkpoint-exam',
        kind: 'Tool',
        subtitle: `${checkpointAnsweredCount}/${checkpointExam.questionIds.length} questions answered`,
        title: 'Resume Checkpoint',
      });
    }

    if (studyRoute && studyRoute.completedAt === null) {
      sessions.push({
        id: 'study-route',
        kind: 'Tool',
        subtitle: `${studyRoute.completedStepIds.length}/${studyRoute.steps.length} steps complete`,
        title: 'Resume Study Route',
      });
    }

    if (reviewQuestionIds.length > 0) {
      sessions.push({
        id: 'review-plan',
        kind: 'Tool',
        subtitle: `${reviewQuestionIds.length} scheduled checks due`,
        title: 'Open Smart Review',
      });
    }

    if (
      currentWeeklyPlan &&
      (!weeklyPlanComplete || currentWeeklyPlan.rewardClaimedAt === null)
    ) {
      sessions.push({
        id: 'weekly-plan',
        kind: 'Tool',
        subtitle: weeklyPlanComplete
          ? `+${WEEKLY_PLAN_REWARD_XP} XP reward ready`
          : `${weeklyPlanProgress.questions}/${currentWeeklyPlan.targetQuestions} questions · ${weeklyPlanProgress.xp}/${currentWeeklyPlan.targetXp} XP`,
        title: weeklyPlanComplete
          ? 'Claim Weekly Reward'
          : 'Continue Weekly Plan',
      });
    }

    return sessions.map((session) => ({
      ...session,
      transient: true,
    }));
  }, [
    checkpointAnsweredCount,
    checkpointExam,
    currentWeeklyPlan,
    focusRemainingMs,
    focusSession,
    isSprintActive,
    reviewQuestionIds.length,
    sprintAnswered,
    sprintState?.label,
    sprintState?.paused,
    sprintTarget,
    studyRoute,
    weeklyPlanComplete,
    weeklyPlanProgress.questions,
    weeklyPlanProgress.xp,
  ]);
  const activityIndicatorCount =
    unreadNotificationCount > 0
      ? unreadNotificationCount
      : activeSessionResults.length;
  const activityIndicatorIsQueue =
    unreadNotificationCount === 0 && activeSessionResults.length > 0;
  const quickSearchResults = useMemo<SearchResult[]>(() => {
    const recommendedResult: SearchResult = {
      id: 'power-sprint',
      kind: 'Tool',
      subtitle: 'Five adaptive questions with an XP bonus',
      title: 'Start Power Sprint',
    };
    const defaultResults: SearchResult[] = [
      {
        id: 'focus-room',
        kind: 'Tool',
        subtitle: 'Protect one objective with a focused timer',
        title: 'Focus Room',
      },
      {
        id: 'weekly-plan',
        kind: 'Tool',
        subtitle: 'Review targets and shape the week',
        title: 'Weekly Plan',
      },
      {
        id: 'study-list',
        kind: 'Tool',
        subtitle: 'Collect and order your next learning targets',
        title: 'Study List',
      },
      {
        id: 'toolkit',
        kind: 'Tool',
        subtitle: 'Calculators, resistor tools, and conversions',
        title: 'Engineering Toolkit',
      },
      {
        id: 'circuit-workbench',
        kind: 'Tool',
        subtitle: 'Build and validate resistor networks',
        title: 'Circuit Workbench',
      },
    ];
    const seenResults = new Set<string>();

    return [
      ...activeSessionResults,
      ...(activeSessionResults.length === 0 ? [recommendedResult] : []),
      ...recentLearningSearchResults,
      ...recentSearchResults,
      ...defaultResults,
    ]
      .filter((result) => {
        if (
          result.kind === 'Note' &&
          !fieldNotes.some((note) => note.id === result.id)
        ) {
          return false;
        }

        if (
          result.kind === 'Bench Run' &&
          !labRunHistory.some((run) => run.id === result.id)
        ) {
          return false;
        }

        const key = `${result.kind}:${result.id}`;
        if (seenResults.has(key)) {
          return false;
        }
        seenResults.add(key);
        return true;
      })
      .slice(0, 6);
  }, [
    activeSessionResults,
    fieldNotes,
    labRunHistory,
    recentLearningSearchResults,
    recentSearchResults,
  ]);
  const isSearchQueryActive = Boolean(query.trim());
  const activeSearchResultCount =
    searchKindFilter === 'All'
      ? rankedSearchResults.length
      : searchKindCounts[searchKindFilter];
  const quickSearchSummary =
    activeSessionResults.length > 0
      ? `${activeSessionResults.length} active ${
          activeSessionResults.length === 1 ? 'thread' : 'threads'
        } ready to resume`
      : recentLearningSearchResults.length > 0 || recentSearchResults.length > 0
        ? 'Recent destinations and useful tools'
        : 'Continue and useful tools';
  const visibleSearchResults = isSearchQueryActive
    ? searchResults
    : quickSearchResults;

  function applyAppRoute(route: AppRoute) {
    const resolvedRoute = resolveAppRoute(route);

    setOverlay(null);
    setTutorOpen(false);
    setQuery('');
    setSearchKindFilter('All');
    setSelectedOption(null);
    setSprintState((currentSession) =>
      currentSession &&
      currentSession.completedAt === null &&
      resolvedRoute.page !== 'lesson'
        ? {
            ...currentSession,
            paused: true,
          }
        : null,
    );
    setActiveBankDiagnosticId(null);
    setActiveSection(resolvedRoute.section);
    setActivePage(resolvedRoute.page);

    if (
      (resolvedRoute.page === 'concept' || resolvedRoute.page === 'game') &&
      resolvedRoute.resourceId
    ) {
      setActiveAtlasId(resolvedRoute.resourceId);
      return;
    }

    if (resolvedRoute.section === 'atlas') {
      setActiveAtlasId(null);
    }

    if (resolvedRoute.page === 'lesson' && resolvedRoute.resourceId) {
      const questionIndex = lessonQuestions.findIndex(
        (question) => question.id === resolvedRoute.resourceId,
      );
      const question = lessonQuestions[questionIndex];

      if (questionIndex >= 0 && question) {
        setCurrentQuestionIndex(questionIndex);
        setActiveSkillId(
          BANK_TOPIC_SKILL_IDS[question.topic] ?? skillNodes[0].id,
        );
        setPracticeMode('path');
      }
      return;
    }

    if (
      (resolvedRoute.page === 'lab' ||
        resolvedRoute.page === 'workbench') &&
      resolvedRoute.resourceId
    ) {
      setActiveLabId(resolvedRoute.resourceId);
      return;
    }

    if (
      (resolvedRoute.page === 'career' ||
        resolvedRoute.page === 'career-project' ||
        resolvedRoute.page === 'portfolio') &&
      resolvedRoute.resourceId
    ) {
      setSelectedCareerRole(resolvedRoute.resourceId);
      setComparisonCareerRole((currentRole) =>
        currentRole === resolvedRoute.resourceId
          ? careerTracks.find(
              (career) => career.role !== resolvedRoute.resourceId,
            )?.role ?? currentRole
          : currentRole,
      );
      return;
    }

    if (resolvedRoute.page === 'skill-map' && resolvedRoute.resourceId) {
      setActiveSkillId(resolvedRoute.resourceId);
    }
  }

  useEffect(() => {
    if (selectedOption === null) {
      setAnswerConfidence(null);
    }
  }, [currentQuestion.id, selectedOption]);

  useEffect(() => {
    setSearchActiveIndex(-1);
  }, [query, searchKindFilter]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        RECENT_SEARCH_STORAGE_KEY,
        JSON.stringify(recentSearchResults),
      );
    } catch {
      // Recent destinations remain available for this session.
    }
  }, [recentSearchResults]);

  useEffect(() => {
    try {
      saveRecentLearningItems(recentLearningItems);
    } catch {
      // Recent activity remains available for this session.
    }
  }, [recentLearningItems]);

  useEffect(() => {
    try {
      saveStudyListItems(studyListItems);
    } catch {
      // The Study List remains available for this session.
    }
  }, [studyListItems]);

  useEffect(() => {
    function handleStudyListStorage(event: StorageEvent) {
      if (event.key !== STUDY_LIST_STORAGE_KEY) {
        return;
      }

      try {
        setStudyListItems(
          event.newValue
            ? normalizeStudyListItems(JSON.parse(event.newValue) as unknown)
            : [],
        );
      } catch {
        // Ignore malformed updates from another tab and keep the current queue.
      }
    }

    window.addEventListener('storage', handleStudyListStorage);
    return () => window.removeEventListener('storage', handleStudyListStorage);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        NOTEBOOK_LIBRARY_VIEW_STORAGE_KEY,
        notebookLibraryView,
      );
    } catch {
      // Keep the selected Notebook view available for this session.
    }
  }, [notebookLibraryView]);

  useEffect(() => {
    if (!isAuthenticated || recentLearningCandidate === null) {
      return;
    }

    setRecentLearningItems((items) =>
      upsertRecentLearningItem(items, recentLearningCandidate),
    );
  }, [isAuthenticated, recentLearningCandidate]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        NOTIFICATION_READ_STORAGE_KEY,
        JSON.stringify(readNotificationKeys.slice(0, NOTIFICATION_READ_LIMIT)),
      );
    } catch {
      // Notification read state remains available for this session.
    }
  }, [readNotificationKeys]);

  useEffect(() => {
    if (!searchOpen || searchActiveIndex < 0) {
      return;
    }

    const activeResult = visibleSearchResults[searchActiveIndex];
    if (activeResult) {
      preloadSearchResult(activeResult);
    }
  }, [searchActiveIndex, searchOpen, visibleSearchResults]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const connection = (
      navigator as Navigator & {
        connection?: {
          effectiveType?: string;
          saveData?: boolean;
        };
      }
    ).connection;
    const shouldConserveData =
      connection?.saveData === true ||
      connection?.effectiveType === 'slow-2g' ||
      connection?.effectiveType === '2g';

    if (shouldConserveData) {
      return;
    }

    let cancelled = false;
    let idleCallbackId: number | null = null;
    let timeoutId: number | null = null;
    let preloadIndex = 0;

    const scheduleNextPreload = () => {
      if (cancelled || preloadIndex >= IDLE_PRELOAD_SECTIONS.length) {
        return;
      }

      if (typeof window.requestIdleCallback === 'function') {
        idleCallbackId = window.requestIdleCallback(
          () => {
            idleCallbackId = null;
            void warmNextWorkspace();
          },
          { timeout: 1800 },
        );
        return;
      }

      timeoutId = window.setTimeout(() => {
        timeoutId = null;
        void warmNextWorkspace();
      }, 350);
    };

    const warmNextWorkspace = async () => {
      const section = IDLE_PRELOAD_SECTIONS[preloadIndex];
      preloadIndex += 1;
      await preloadAppSection(section);

      if (cancelled || preloadIndex >= IDLE_PRELOAD_SECTIONS.length) {
        return;
      }

      timeoutId = window.setTimeout(() => {
        timeoutId = null;
        scheduleNextPreload();
      }, 320);
    };

    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      scheduleNextPreload();
    }, 1800);

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      if (idleCallbackId !== null) {
        window.cancelIdleCallback(idleCallbackId);
      }
    };
  }, [isAuthenticated]);

  useEffect(() => {
    document.title = `${documentViewLabel} | ZyloXP`;
  }, [documentViewLabel]);

  useEffect(() => {
    if (!isAuthenticated) {
      lastRouteFocusKeyRef.current = null;
      return;
    }

    if (lastRouteFocusKeyRef.current === null) {
      lastRouteFocusKeyRef.current = routeFocusKey;
      return;
    }

    if (lastRouteFocusKeyRef.current === routeFocusKey) {
      return;
    }

    lastRouteFocusKeyRef.current = routeFocusKey;
    const frameId = window.requestAnimationFrame(() => {
      mainContentRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isAuthenticated, routeFocusKey]);

  useEffect(() => {
    if (focusViewActive) {
      return;
    }

    function handleGlobalSearchShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.isContentEditable ||
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT';
      const isCommandSearch =
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'k';
      const isSlashSearch =
        event.key === '/' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isEditable;

      if (!isCommandSearch && !isSlashSearch) {
        return;
      }

      event.preventDefault();
      setSearchOpen(true);
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }

    document.addEventListener('keydown', handleGlobalSearchShortcut);
    return () =>
      document.removeEventListener('keydown', handleGlobalSearchShortcut);
  }, [focusViewActive]);

  useEffect(() => {
    if (!focusViewAvailable && focusViewEnabled) {
      setFocusViewEnabled(false);
    }
  }, [focusViewAvailable, focusViewEnabled]);

  useEffect(() => {
    if (!focusViewActive) {
      return;
    }

    function handleFocusViewEscape(event: KeyboardEvent) {
      if (
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        overlay === null &&
        !tutorOpen
      ) {
        setFocusViewEnabled(false);
      }
    }

    document.addEventListener('keydown', handleFocusViewEscape);
    return () =>
      document.removeEventListener('keydown', handleFocusViewEscape);
  }, [focusViewActive, overlay, tutorOpen]);

  useEffect(() => {
    if (!isAuthenticated) {
      routeScrollPositionsRef.current.clear();
      return;
    }

    const routeKey = routeFocusKey;

    return () => {
      routeScrollPositionsRef.current.set(routeKey, window.scrollY);
    };
  }, [isAuthenticated, routeFocusKey]);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    function handleHashChange() {
      routeSyncModeRef.current = 'history';
      shouldRestoreRouteScrollRef.current = true;
      applyAppRoute(parseAppHash(window.location.hash));
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (
      !isAuthenticated ||
      (isSprintActive &&
        sprintState?.paused === false &&
        activePage === 'lesson') ||
      activePage === 'sprint-summary'
    ) {
      return;
    }

    const resourceId =
      activePage === 'concept' || activePage === 'game'
        ? activeAtlasId
        : activePage === 'lesson'
        ? currentQuestion.id
        : activePage === 'lab' || activePage === 'workbench'
          ? activeLab.id
          : activePage === 'career' ||
              activePage === 'career-project' ||
              activePage === 'portfolio'
            ? selectedCareer.role
            : activePage === 'skill-map'
              ? activeSkillId
              : null;
    const nextHash = buildAppHash({
      page: activePage,
      resourceId,
      section: activeSection,
    });
    const currentHash = window.location.hash;

    if (routeSyncModeRef.current === 'initial') {
      routeSyncModeRef.current = 'idle';
      if (currentHash !== nextHash) {
        window.history.replaceState(null, '', nextHash);
      }
      return;
    }

    if (routeSyncModeRef.current === 'history') {
      routeSyncModeRef.current = 'idle';
      if (currentHash !== nextHash) {
        window.history.replaceState(null, '', nextHash);
      }
      return;
    }

    if (currentHash !== nextHash) {
      window.history.pushState(null, '', nextHash);
    }
  }, [
    activeAtlasId,
    activeLab.id,
    activePage,
    activeSection,
    activeSkillId,
    currentQuestion.id,
    isAuthenticated,
    isSprintActive,
    selectedCareer.role,
    sprintState?.paused,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const shouldRestore = shouldRestoreRouteScrollRef.current;
    const targetTop = shouldRestore
      ? routeScrollPositionsRef.current.get(routeFocusKey) ?? 0
      : 0;
    shouldRestoreRouteScrollRef.current = false;
    setShowBackToTop(false);
    let settleFrameId = 0;

    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: targetTop, left: 0, behavior: 'auto' });

      if (shouldRestore) {
        settleFrameId = window.requestAnimationFrame(() => {
          window.scrollTo({ top: targetTop, left: 0, behavior: 'auto' });
        });
      }
    });
    const settleTimeoutId = shouldRestore
      ? window.setTimeout(() => {
          window.scrollTo({ top: targetTop, left: 0, behavior: 'auto' });
        }, 160)
      : null;

    return () => {
      window.cancelAnimationFrame(frameId);
      if (settleFrameId) {
        window.cancelAnimationFrame(settleFrameId);
      }
      if (settleTimeoutId !== null) {
        window.clearTimeout(settleTimeoutId);
      }
    };
  }, [isAuthenticated, routeFocusKey]);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowBackToTop(false);
      setScrollProgress(0);
      return;
    }

    let frameId = 0;
    const updateVisibility = () => {
      frameId = 0;
      const threshold = Math.max(640, window.innerHeight * 0.8);
      const maximumScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const nextProgress =
        maximumScroll === 0
          ? 0
          : Math.min(
              100,
              Math.max(0, Math.round((window.scrollY / maximumScroll) * 100)),
            );
      setShowBackToTop(window.scrollY > threshold);
      setScrollProgress((currentProgress) =>
        currentProgress === nextProgress ? currentProgress : nextProgress,
      );
    };
    const handleScroll = () => {
      if (frameId === 0) {
        frameId = window.requestAnimationFrame(updateVisibility);
      }
    };

    updateVisibility();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    const pageResizeObserver = new ResizeObserver(handleScroll);
    pageResizeObserver.observe(document.documentElement);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      pageResizeObserver.disconnect();
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isAuthenticated]);

  useEffect(() => {
    setToastAutoDismissPaused(false);
  }, [toast]);

  useEffect(() => {
    if (!toast || toast.action || toastAutoDismissPaused) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeoutId);
  }, [toast, toastAutoDismissPaused]);

  useEffect(() => {
    if (toast?.action?.label !== 'Undo') {
      return;
    }
    const undoAction = toast.action;

    function handleToastUndoShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.isContentEditable ||
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT';
      const isUndoShortcut =
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === 'z';

      if (!isUndoShortcut || isEditable) {
        return;
      }

      event.preventDefault();
      setToast(null);
      undoAction.run();
    }

    document.addEventListener('keydown', handleToastUndoShortcut);
    return () =>
      document.removeEventListener('keydown', handleToastUndoShortcut);
  }, [toast]);

  useEffect(() => {
    const handleOffline = () => {
      onlineStatusRef.current = false;
      setIsOnline(false);
    };
    const handleOnline = () => {
      const wasOffline = !onlineStatusRef.current;
      onlineStatusRef.current = true;
      setIsOnline(true);

      if (wasOffline) {
        setToast({ message: 'Connection restored.' });
      }
    };
    const handleUpdateReady = () => {
      setToast({
        action: {
          label: 'Refresh',
          run: () => window.location.reload(),
        },
        message: 'A new ZyloXP version is ready.',
      });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener(APP_UPDATE_READY_EVENT, handleUpdateReady);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener(APP_UPDATE_READY_EVENT, handleUpdateReady);
    };
  }, []);

  useEffect(() => {
    const displayModeQuery = window.matchMedia?.(
      '(display-mode: standalone)',
    );
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as AppInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsAppInstalled(true);
      setToast({ message: 'ZyloXP installed successfully.' });
    };
    const handleDisplayModeChange = () => {
      setIsAppInstalled(readStandaloneStatus());
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    displayModeQuery?.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      displayModeQuery?.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  useEffect(() => {
    const handleLearnerStorageChange = (event: StorageEvent) => {
      if (
        event.key !== LEARNER_STORAGE_KEY ||
        event.newValue === persistedLearnerStateRef.current
      ) {
        return;
      }

      learnerSaveBlockedRef.current = true;
      saveStatusTimersRef.current.forEach((timerId) =>
        window.clearTimeout(timerId),
      );
      saveStatusTimersRef.current = [];
      setSaveStatus('idle');
      setToast(null);
      setHasExternalProgressUpdate(true);
    };

    window.addEventListener('storage', handleLearnerStorageChange);
    return () =>
      window.removeEventListener('storage', handleLearnerStorageChange);
  }, []);

  useEffect(() => {
    const handleFieldJournalStorageChange = (event: StorageEvent) => {
      if (event.key === FIELD_JOURNAL_STORAGE_KEY) {
        setFieldNotes(readFieldNotes());
      }
    };

    window.addEventListener('storage', handleFieldJournalStorageChange);
    return () =>
      window.removeEventListener('storage', handleFieldJournalStorageChange);
  }, []);

  useEffect(() => {
    if (deviceAlertPermission === 'unsupported') {
      return;
    }

    try {
      window.localStorage.setItem(
        DEVICE_ALERTS_STORAGE_KEY,
        deviceAlertsEnabled ? 'enabled' : 'disabled',
      );
    } catch {
      // The current session can still use alerts when storage is unavailable.
    }
  }, [deviceAlertPermission, deviceAlertsEnabled]);

  useEffect(() => {
    const syncDeviceAlertPermission = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      const nextPermission = readDeviceAlertPermission();
      setDeviceAlertPermission(nextPermission);
      if (nextPermission !== 'granted') {
        setDeviceAlertsEnabled(false);
      }
    };

    document.addEventListener(
      'visibilitychange',
      syncDeviceAlertPermission,
    );
    return () =>
      document.removeEventListener(
        'visibilitychange',
        syncDeviceAlertPermission,
      );
  }, []);

  useEffect(() => {
    if (isAuthenticated && rememberSession) {
      let persisted = false;
      try {
        window.localStorage.setItem(AUTH_SESSION_KEY, 'active');
        persisted = true;
      } catch {
        // The active tab can still hold a session when persistence is blocked.
      }
      try {
        if (persisted) {
          window.sessionStorage.removeItem(AUTH_SESSION_KEY);
        } else {
          window.sessionStorage.setItem(AUTH_SESSION_KEY, 'active');
        }
      } catch {
        // The authenticated render remains usable without browser storage.
      }
      return;
    }

    if (isAuthenticated) {
      try {
        window.sessionStorage.setItem(AUTH_SESSION_KEY, 'active');
      } catch {
        // The demo remains usable for the current render without browser storage.
      }
      try {
        window.localStorage.removeItem(AUTH_SESSION_KEY);
      } catch {
        // Persistent storage may be blocked independently.
      }
      return;
    }

    try {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
      // Sign-out still succeeds in memory.
    }
    try {
      window.sessionStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
      // Sign-out still succeeds in memory.
    }
  }, [isAuthenticated, rememberSession]);

  useEffect(() => {
    const syncAppLock = (event: StorageEvent) => {
      if (event.key === LOCAL_APP_LOCK_STORAGE_KEY) {
        const nextConfig = readLocalAppLockConfig();
        setAppLockConfig(nextConfig);
        if (!nextConfig) {
          setIsAppLocked(false);
        }
        return;
      }

      if (event.key === LOCAL_APP_LOCK_COMMAND_STORAGE_KEY) {
        const nextConfig = readLocalAppLockConfig();
        setAppLockConfig(nextConfig);
        if (nextConfig) {
          clearLocalAppLockActivity();
          setOverlay(null);
          setIsAppLocked(true);
        }
      }
    };

    window.addEventListener('storage', syncAppLock);
    return () => window.removeEventListener('storage', syncAppLock);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !appLockConfig || isAppLocked) {
      return;
    }

    const timeoutMs = appLockConfig.timeoutMinutes * 60_000;
    let lastActivity = readLocalAppLockActivity() ?? Date.now();
    let lockTimer = 0;

    const lockSession = () => {
      clearLocalAppLockActivity();
      setOverlay(null);
      setIsAppLocked(true);
    };
    const scheduleLock = () => {
      window.clearTimeout(lockTimer);
      const remainingMs = Math.max(0, timeoutMs - (Date.now() - lastActivity));
      lockTimer = window.setTimeout(lockSession, remainingMs);
    };
    const recordActivity = () => {
      lastActivity = Date.now();
      markLocalAppLockActivity(lastActivity);
      scheduleLock();
    };
    const checkVisibility = () => {
      if (
        document.visibilityState !== 'visible' &&
        appLockConfig.lockOnHidden
      ) {
        lockSession();
        return;
      }
      if (document.visibilityState !== 'visible') {
        return;
      }
      if (Date.now() - lastActivity >= timeoutMs) {
        lockSession();
      } else {
        scheduleLock();
      }
    };

    markLocalAppLockActivity(lastActivity);
    scheduleLock();
    window.addEventListener('keydown', recordActivity);
    window.addEventListener('pointerdown', recordActivity);
    window.addEventListener('touchstart', recordActivity, { passive: true });
    window.addEventListener('wheel', recordActivity, { passive: true });
    document.addEventListener('visibilitychange', checkVisibility);

    return () => {
      window.clearTimeout(lockTimer);
      window.removeEventListener('keydown', recordActivity);
      window.removeEventListener('pointerdown', recordActivity);
      window.removeEventListener('touchstart', recordActivity);
      window.removeEventListener('wheel', recordActivity);
      document.removeEventListener('visibilitychange', checkVisibility);
    };
  }, [appLockConfig, isAppLocked, isAuthenticated]);

  useEffect(() => {
    const updateActivityDate = () => {
      const nextActivityDate = getActivityDateKey();
      setCurrentActivityDate((activityDate) =>
        activityDate === nextActivityDate ? activityDate : nextActivityDate,
      );
    };
    const intervalId = window.setInterval(updateActivityDate, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(
      () => setReviewClock(Date.now()),
      60_000,
    );
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (
      !focusSession ||
      focusSession.endedAt !== null ||
      focusSession.pausedAt !== null
    ) {
      return;
    }

    setFocusClock(Date.now());
    const intervalId = window.setInterval(
      () => setFocusClock(Date.now()),
      1000,
    );
    return () => window.clearInterval(intervalId);
  }, [focusSession?.endedAt, focusSession?.id, focusSession?.pausedAt]);

  useEffect(() => {
    if (
      !focusSession ||
      focusSession.endedAt !== null ||
      focusRemainingMs > 0
    ) {
      return;
    }

    const endedAt = Date.now();
    setFocusSession((current) =>
      !current || current.id !== focusSession.id || current.endedAt !== null
        ? current
        : {
            ...current,
            endedAt,
            pausedAt: null,
            pausedDurationMs:
              current.pausedDurationMs +
              (current.pausedAt === null
                ? 0
                : Math.max(0, endedAt - current.pausedAt)),
          },
    );
    setToast({
      message: 'Focus session complete. Your debrief is ready.',
    });
    if (
      isAuthenticated &&
      deviceAlertsEnabled &&
      deviceAlertPermission === 'granted' &&
      document.visibilityState !== 'visible'
    ) {
      void sendDeviceAlert({
        body: `${focusSession.objectiveTitle} is complete. Open your debrief while the result is fresh.`,
        route: '/#/learn/focus',
        tag: `zyloxp-focus-${focusSession.id}`,
        title: 'Focus session complete',
      });
    }
  }, [
    deviceAlertPermission,
    deviceAlertsEnabled,
    focusClock,
    focusRemainingMs,
    focusSession,
    isAuthenticated,
  ]);

  useEffect(() => {
    const learnerState: StoredLearnerState = {
      activeSprint:
        sprintState?.completedAt === null ? sprintState : null,
      activityDate: currentActivityDate,
      activityHistory,
      bookmarkedQuestionIds,
      careerProjectRecords,
      checkpointBestScore,
      checkpointExam,
      checkpointExamCompletionCount,
      completedBankDiagnosticIds,
      completedFaultCaseIds,
      completedLabMissionIds,
      completedPrompts,
      customSessionCompletions,
      customSessionConfig,
      currentQuestionIndex,
      dailyGoal,
      dailyMissionRewardDate,
      dailyXp,
      earnedXp,
      formulaConfidence,
      formulaReadyRewardedIds,
      formulaReviewCompletions,
      focusSession,
      focusSessionHistory,
      highContrastEnabled,
      labRunHistory,
      labSaveCount,
      lastSprintSummary,
      learnerProfile,
      mistakeRecoveryCompletions,
      mistakeReflections,
      portfolioFeaturedIds,
      portfolioHeadline,
      portfolioNotes,
      portfolioPublishCount,
      practiceMode,
      practiceWithHearts,
      questionMastery,
      readingSize,
      reducedMotionEnabled,
      savedCircuitDesigns,
      savedFormulaIds,
      skillProgress,
      soundEnabled,
      studyRoute,
      studyRouteCompletionCount,
      tunedCareerRole,
      weeklyPlan,
      weeklyPlanRewardWeek,
      workbenchSaveCount,
    };
    const serializedLearnerState = JSON.stringify(learnerState);

    if (
      learnerSaveBlockedRef.current ||
      serializedLearnerState === persistedLearnerStateRef.current
    ) {
      return;
    }

    saveStatusTimersRef.current.forEach((timerId) =>
      window.clearTimeout(timerId),
    );
    saveStatusTimersRef.current = [];
    setSaveStatus('saving');

    try {
      window.localStorage.setItem(LEARNER_STORAGE_KEY, serializedLearnerState);
      persistedLearnerStateRef.current = serializedLearnerState;
      const savedAt = Date.now();
      window.localStorage.setItem(SAVE_META_STORAGE_KEY, String(savedAt));
      const savedTimer = window.setTimeout(() => {
        setLastSavedAt(savedAt);
        setSaveStatus('saved');
        const idleTimer = window.setTimeout(() => {
          setSaveStatus('idle');
        }, 1400);
        saveStatusTimersRef.current.push(idleTimer);
      }, 160);
      saveStatusTimersRef.current.push(savedTimer);
    } catch {
      setSaveStatus('error');
    }

    return () => {
      saveStatusTimersRef.current.forEach((timerId) =>
        window.clearTimeout(timerId),
      );
      saveStatusTimersRef.current = [];
    };
  }, [
    sprintState,
    activityHistory,
    bookmarkedQuestionIds,
    careerProjectRecords,
    checkpointBestScore,
    checkpointExam,
    checkpointExamCompletionCount,
    completedBankDiagnosticIds,
    completedFaultCaseIds,
    completedLabMissionIds,
    completedPrompts,
    customSessionCompletions,
    customSessionConfig,
    currentActivityDate,
    currentQuestionIndex,
    dailyGoal,
    dailyMissionRewardDate,
    dailyXp,
    earnedXp,
    formulaConfidence,
    formulaReadyRewardedIds,
    formulaReviewCompletions,
    focusSession,
    focusSessionHistory,
    highContrastEnabled,
    labRunHistory,
    labSaveCount,
    lastSprintSummary,
    learnerProfile,
    mistakeRecoveryCompletions,
    mistakeReflections,
    portfolioFeaturedIds,
    portfolioHeadline,
    portfolioNotes,
    portfolioPublishCount,
    practiceMode,
    practiceWithHearts,
    questionMastery,
    readingSize,
    reducedMotionEnabled,
    savedCircuitDesigns,
    savedFormulaIds,
    skillProgress,
    soundEnabled,
    studyRoute,
    studyRouteCompletionCount,
    tunedCareerRole,
    weeklyPlan,
    weeklyPlanRewardWeek,
    workbenchSaveCount,
  ]);

  useEffect(() => {
    try {
      window.localStorage.setItem(HEART_STORAGE_KEY, JSON.stringify(heartState));
    } catch {
      // Keep the in-memory timer working when browser storage is unavailable.
    }
  }, [heartState]);

  useEffect(() => {
    if (heartsRemaining >= MAX_HEARTS || nextHeartAt === null) {
      return;
    }

    const updateClock = () => setHeartClock(Date.now());
    updateClock();
    const intervalId = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(intervalId);
  }, [heartsRemaining, nextHeartAt]);

  useEffect(() => {
    const normalizedState = normalizeHeartState(heartState, heartClock);
    const recoveredHearts = normalizedState.hearts - heartState.hearts;
    if (
      normalizedState.hearts !== heartState.hearts ||
      normalizedState.nextHeartAt !== heartState.nextHeartAt
    ) {
      setHeartState(normalizedState);

      if (recoveredHearts > 0) {
        const rechargeMessage =
          recoveredHearts === 1
            ? `One heart recharged. ${normalizedState.hearts}/${MAX_HEARTS} ready.`
            : `${recoveredHearts} hearts recharged. ${normalizedState.hearts}/${MAX_HEARTS} ready.`;

        if (document.visibilityState === 'visible') {
          setToast({ message: rechargeMessage });
        } else if (
          isAuthenticated &&
          deviceAlertsEnabled &&
          deviceAlertPermission === 'granted'
        ) {
          void sendDeviceAlert({
            body:
              normalizedState.hearts === MAX_HEARTS
                ? 'Your hearts are full. Practice is ready when you are.'
                : rechargeMessage,
            route: '/#/practice',
            tag: 'zyloxp-hearts',
            title:
              recoveredHearts === 1
                ? 'A heart is ready'
                : `${recoveredHearts} hearts recharged`,
          });
        }
      }
    }
  }, [
    deviceAlertPermission,
    deviceAlertsEnabled,
    heartClock,
    heartState,
    isAuthenticated,
  ]);

  function showToast(message: string, action?: ToastAction) {
    setToast({ action, message });
  }

  function handleAddStudyListItem(resource: StudyListResource) {
    setStudyListItems((items) => addStudyListResource(items, resource));
    showToast(`${resource.title} added to your Study List.`);
  }

  function handleRemoveStudyListItem(item: StudyListItem) {
    const itemKey = getStudyListItemKey(item);
    const itemIndex = studyListItems.findIndex(
      (candidate) => getStudyListItemKey(candidate) === itemKey,
    );

    setStudyListItems((items) =>
      items.filter(
        (candidate) => getStudyListItemKey(candidate) !== itemKey,
      ),
    );
    showToast(`${item.title} removed from your Study List.`, {
      label: 'Undo',
      run: () =>
        setStudyListItems((items) => {
          if (
            items.some(
              (candidate) => getStudyListItemKey(candidate) === itemKey,
            )
          ) {
            return items;
          }

          const nextItems = [...items];
          nextItems.splice(
            Math.max(0, Math.min(itemIndex, items.length)),
            0,
            item,
          );
          return nextItems;
        }),
    });
  }

  function handleMoveStudyListItem(
    item: StudyListItem,
    direction: -1 | 1,
  ) {
    setStudyListItems((items) => {
      const currentIndex = items.findIndex(
        (candidate) =>
          getStudyListItemKey(candidate) === getStudyListItemKey(item),
      );
      const targetIndex = currentIndex + direction;

      if (
        currentIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= items.length
      ) {
        return items;
      }

      const nextItems = [...items];
      [nextItems[currentIndex], nextItems[targetIndex]] = [
        nextItems[targetIndex],
        nextItems[currentIndex],
      ];
      return nextItems;
    });
  }

  function handleClearCompletedStudyListItems() {
    const itemsBeforeClear = studyListItems;
    const completedItems = studyListItems.filter(
      (item) => item.completedAt !== null,
    );

    if (completedItems.length === 0) {
      return;
    }

    setStudyListItems((items) =>
      items.filter((item) => item.completedAt === null),
    );
    showToast(
      `${completedItems.length} completed ${
        completedItems.length === 1 ? 'item' : 'items'
      } cleared.`,
      {
        label: 'Undo',
        run: () =>
          setStudyListItems((items) => {
            const currentItems = new Map(
              items.map((item) => [getStudyListItemKey(item), item]),
            );
            const previousKeys = new Set(
              itemsBeforeClear.map(getStudyListItemKey),
            );

            return [
              ...itemsBeforeClear.map(
                (item) =>
                  currentItems.get(getStudyListItemKey(item)) ?? item,
              ),
              ...items.filter(
                (item) => !previousKeys.has(getStudyListItemKey(item)),
              ),
            ];
          }),
      },
    );
  }

  function handleToggleStudyListItemComplete(item: StudyListItem) {
    const itemKey = getStudyListItemKey(item);
    const completing = item.completedAt === null;

    setStudyListItems((items) =>
      items.map((candidate) =>
        getStudyListItemKey(candidate) === itemKey
          ? {
              ...candidate,
              completedAt: completing ? Date.now() : null,
            }
          : candidate,
      ),
    );
    showToast(
      completing
        ? `${item.title} marked complete.`
        : `${item.title} returned to your active queue.`,
    );
  }

  function markStudyListResourceComplete(
    kind: StudyListResource['kind'],
    resourceId: string,
  ) {
    const itemKey = getStudyListItemKey({ id: resourceId, kind });

    setStudyListItems((items) => {
      const itemIndex = items.findIndex(
        (item) =>
          getStudyListItemKey(item) === itemKey && item.completedAt === null,
      );

      if (itemIndex < 0) {
        return items;
      }

      const nextItems = [...items];
      nextItems[itemIndex] = {
        ...nextItems[itemIndex],
        completedAt: Date.now(),
      };
      return nextItems;
    });
  }

  function handleToggleCurrentStudyListItem() {
    if (!currentStudyListResource) {
      return;
    }

    if (currentStudyListItem) {
      handleRemoveStudyListItem(currentStudyListItem);
      return;
    }

    handleAddStudyListItem(currentStudyListResource);
  }

  function handleOpenStudyListItem(item: StudyListItem) {
    handleSearchResultSelect({
      id: item.id,
      kind: item.kind,
      subtitle: item.subtitle,
      title: item.title,
    });
  }

  async function handleInstallApp() {
    if (isAppInstalled) {
      showToast('ZyloXP is already installed.');
      return;
    }

    if (!installPrompt) {
      return;
    }

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);

      if (choice.outcome === 'accepted') {
        showToast('Installing ZyloXP.');
      }
    } catch {
      setInstallPrompt(null);
      showToast('ZyloXP could not be installed from this browser.');
    }
  }

  async function handleDeviceAlertsEnabledChange(enabled: boolean) {
    if (!enabled) {
      setDeviceAlertsEnabled(false);
      showToast('Device alerts turned off.');
      return;
    }

    if (deviceAlertPermission === 'unsupported') {
      return;
    }

    try {
      let nextPermission = readDeviceAlertPermission();
      if (nextPermission === 'default') {
        nextPermission = await window.Notification.requestPermission();
      }

      setDeviceAlertPermission(nextPermission);
      if (nextPermission === 'granted') {
        setDeviceAlertsEnabled(true);
        showToast('Device alerts are on.');
        return;
      }

      setDeviceAlertsEnabled(false);
      showToast(
        nextPermission === 'denied'
          ? 'Device alerts are blocked in this browser.'
          : 'Device alerts were not enabled.',
      );
    } catch {
      setDeviceAlertsEnabled(false);
      showToast('Device alerts could not be enabled.');
    }
  }

  function recordDailyActivity(delta: Partial<DailyActivityRecord>) {
    const activityDate = getActivityDateKey();
    const trackedDelta =
      isFocusSessionRunning && (delta.focusMinutes ?? 0) > 0
        ? { ...delta, focusMinutes: 0 }
        : delta;
    setCurrentActivityDate(activityDate);
    setActivityHistory((history) => {
      const currentRecord = history[activityDate] ?? EMPTY_DAILY_ACTIVITY;
      const nextRecord = Object.fromEntries(
        Object.entries(EMPTY_DAILY_ACTIVITY).map(([key]) => {
          const activityKey = key as keyof DailyActivityRecord;
          return [
            activityKey,
            currentRecord[activityKey] + (trackedDelta[activityKey] ?? 0),
          ];
        }),
      ) as DailyActivityRecord;

      return pruneActivityHistory({
        ...history,
        [activityDate]: nextRecord,
      });
    });
  }

  function handleClaimDailyMissionReward() {
    if (!allDailyMissionsComplete || dailyMissionRewardClaimed) {
      return;
    }

    setDailyMissionRewardDate(currentActivityDate);
    setEarnedXp((xp) => xp + DAILY_MISSION_REWARD_XP);
    recordDailyActivity({ xp: DAILY_MISSION_REWARD_XP });
    if (soundEnabled) {
      playFeedbackTone('correct');
    }
    showToast(`Daily Charge claimed. +${DAILY_MISSION_REWARD_XP} XP added.`);
  }

  function handleNotificationReadChange(
    notification: AppNotification,
    isRead: boolean,
  ) {
    const notificationKey = getNotificationReadKey(notification);
    setReadNotificationKeys((currentKeys) =>
      isRead
        ? [
            notificationKey,
            ...currentKeys.filter((key) => key !== notificationKey),
          ].slice(0, NOTIFICATION_READ_LIMIT)
        : currentKeys.filter((key) => key !== notificationKey),
    );
  }

  function handleMarkAllNotificationsRead() {
    const visibleNotificationKeys = liveNotifications.map(
      getNotificationReadKey,
    );
    setReadNotificationKeys((currentKeys) => [
      ...visibleNotificationKeys,
      ...currentKeys.filter(
        (key) => !visibleNotificationKeys.includes(key),
      ),
    ].slice(0, NOTIFICATION_READ_LIMIT));
  }

  function handleNotificationAction(notification: AppNotification) {
    handleNotificationReadChange(notification, true);
    const action = notification.action;

    if (!action) {
      return;
    }

    if (action === 'claim-daily') {
      handleClaimDailyMissionReward();
      setOverlay(null);
      return;
    }

    if (action === 'hearts') {
      setOverlay('hearts');
      return;
    }

    setOverlay(null);

    if (action === 'progress') {
      handleOpenProgress();
      return;
    }

    if (action === 'review') {
      handleOpenReviewPlan();
      return;
    }

    handleOpenWeeklyPlan();
  }

  function handlePracticeModeChange(mode: PracticeMode) {
    const questionIndices = getPracticeQuestionIndices(
      mode,
      bookmarkedQuestionIds,
      questionMastery,
    );

    if (questionIndices.length === 0) {
      showToast(
        mode === 'review'
          ? 'Your review queue is clear. Missed questions will appear here.'
          : 'Save a question first to build your saved practice set.',
      );
      return;
    }

    setSprintState(null);
    setActiveBankDiagnosticId(null);
    setPracticeMode(mode);
    setActiveSection('practice');
    setActivePage('lesson');
    setSelectedOption(null);

    if (!questionIndices.includes(currentQuestionIndex)) {
      setCurrentQuestionIndex(questionIndices[0]);
    }
  }

  function handleRemoveSavedQuestion(questionId: string) {
    const removedIndex = bookmarkedQuestionIds.indexOf(questionId);

    if (removedIndex < 0) {
      return;
    }

    setBookmarkedQuestionIds((questionIds) =>
      questionIds.filter((savedQuestionId) => savedQuestionId !== questionId),
    );
    showToast('Removed from saved questions.', {
      label: 'Undo',
      run: () => {
        setBookmarkedQuestionIds((questionIds) => {
          if (questionIds.includes(questionId)) {
            return questionIds;
          }

          const restoredIds = [...questionIds];
          restoredIds.splice(
            Math.min(Math.max(removedIndex, 0), restoredIds.length),
            0,
            questionId,
          );
          return restoredIds;
        });
        showToast('Question restored to saved practice.');
      },
    });
  }

  function handleToggleQuestionBookmark() {
    if (isCurrentQuestionBookmarked) {
      handleRemoveSavedQuestion(currentQuestion.id);
      return;
    }

    setBookmarkedQuestionIds((questionIds) => [...questionIds, currentQuestion.id]);
    showToast('Saved for focused practice.');
  }

  function handleToggleFormula(formulaId: string) {
    const formulaEntry = FORMULA_LIBRARY.find((entry) => entry.id === formulaId);

    if (!formulaEntry) {
      return;
    }

    if (savedFormulaIds.includes(formulaId)) {
      const removedIndex = savedFormulaIds.indexOf(formulaId);
      setSavedFormulaIds((formulaIds) =>
        formulaIds.filter((savedFormulaId) => savedFormulaId !== formulaId),
      );
      showToast(`${formulaEntry.title} removed from your notebook.`, {
        label: 'Undo',
        run: () => {
          setSavedFormulaIds((formulaIds) => {
            if (formulaIds.includes(formulaId)) {
              return formulaIds;
            }

            const restoredIds = [...formulaIds];
            restoredIds.splice(
              Math.min(Math.max(removedIndex, 0), restoredIds.length),
              0,
              formulaId,
            );
            return restoredIds;
          });
          showToast(`${formulaEntry.title} restored to your notebook.`);
        },
      });
      return;
    }

    setSavedFormulaIds((formulaIds) => [...formulaIds, formulaId]);
    setFormulaConfidence((confidence) =>
      confidence[formulaId]
        ? confidence
        : {
            ...confidence,
            [formulaId]: 'learning',
          },
    );
    showToast(`${formulaEntry.title} saved to your notebook.`);
  }

  function handleStartFormulaReview() {
    if (savedFormulaEntries.length === 0) {
      showToast('Save a formula from a question or lab to build a recall round.');
      return;
    }

    const entryIds = [...savedFormulaEntries]
      .sort((left, right) => {
        const leftConfidence = formulaConfidence[left.id] ?? 'learning';
        const rightConfidence = formulaConfidence[right.id] ?? 'learning';

        return (
          Number(leftConfidence === 'ready') -
            Number(rightConfidence === 'ready') ||
          left.title.localeCompare(right.title)
        );
      })
      .slice(0, 5)
      .map((entry) => entry.id);

    setFormulaReviewState({
      completed: false,
      entryIds,
      position: 0,
      readyCount: 0,
      revealed: false,
      reviewedCount: 0,
    });
    setNotebookFilter('saved');
    setNotebookQuery('');
    setNotebookLibraryView('formulas');
    setActiveSection('notebook');
    setActivePage('overview');
    setOverlay(null);
  }

  function handleRevealFormula() {
    setFormulaReviewState((reviewState) =>
      reviewState
        ? {
            ...reviewState,
            revealed: true,
          }
        : reviewState,
    );
  }

  function handleRateFormula(confidence: FormulaConfidence) {
    if (
      !formulaReviewState ||
      formulaReviewState.completed ||
      !formulaReviewState.revealed
    ) {
      return;
    }

    const formulaId =
      formulaReviewState.entryIds[formulaReviewState.position];
    const formulaEntry = FORMULA_LIBRARY.find((entry) => entry.id === formulaId);

    if (!formulaEntry) {
      return;
    }

    const earnsReward =
      confidence === 'ready' && !formulaReadyRewardedIds.includes(formulaId);
    const reviewedCount = formulaReviewState.reviewedCount + 1;
    const readyCount =
      formulaReviewState.readyCount + Number(confidence === 'ready');
    const isComplete =
      formulaReviewState.position >= formulaReviewState.entryIds.length - 1;

    setFormulaConfidence((currentConfidence) => ({
      ...currentConfidence,
      [formulaId]: confidence,
    }));
    recordDailyActivity({
      focusMinutes: 1,
      xp: earnsReward ? FORMULA_RECALL_XP : 0,
    });

    if (earnsReward) {
      setFormulaReadyRewardedIds((formulaIds) =>
        formulaIds.includes(formulaId)
          ? formulaIds
          : [...formulaIds, formulaId],
      );
      setEarnedXp((xp) => xp + FORMULA_RECALL_XP);

      if (soundEnabled) {
        playFeedbackTone('correct');
      }
    }

    if (isComplete) {
      setFormulaReviewState({
        ...formulaReviewState,
        completed: true,
        readyCount,
        reviewedCount,
      });
      setFormulaReviewCompletions((completionCount) => completionCount + 1);
      showToast(
        `Recall round complete. ${readyCount}/${reviewedCount} formulas ready.`,
      );
      return;
    }

    setFormulaReviewState({
      ...formulaReviewState,
      position: formulaReviewState.position + 1,
      readyCount,
      revealed: false,
      reviewedCount,
    });
  }

  function handleEndFormulaReview() {
    setFormulaReviewState(null);
    showToast('Formula library ready.');
  }

  function handleOpenFormulaSource(entry: FormulaEntry) {
    setFormulaReviewState(null);
    setSprintState(null);
    setOverlay(null);

    if (entry.source === 'lab') {
      handleLabSelect(entry.sourceId);
      return;
    }

    const questionIndex = lessonQuestions.findIndex(
      (question) => question.id === entry.sourceId,
    );

    if (questionIndex < 0) {
      return;
    }

    const question = lessonQuestions[questionIndex];
    setPracticeMode('path');
    setActiveBankDiagnosticId(null);
    setActiveSkillId(BANK_TOPIC_SKILL_IDS[question.topic] ?? skillNodes[0].id);
    setCurrentQuestionIndex(questionIndex);
    setSelectedOption(null);
    setActiveSection('practice');
    setActivePage('lesson');
    showToast(`${entry.title} opened in Practice.`);
  }

  function handleSectionChange(section: AppSection) {
    setFocusedFieldNoteId(null);

    if (section === activeSection && activePage === 'overview') {
      setOverlay(null);
      window.scrollTo({
        behavior: reducedMotionEnabled ? 'auto' : 'smooth',
        left: 0,
        top: 0,
      });
      return;
    }

    if (isSprintActive) {
      setSprintState((session) =>
        session && session.completedAt === null
          ? {
              ...session,
              paused: true,
            }
          : session,
      );
    }
    setActiveSection(section);
    setOverlay(null);

    if (section === 'atlas') {
      setActiveAtlasId(null);
    }

    if (section === 'practice') {
      setActivePage('overview');
      setSelectedOption(null);
      return;
    }

    if (section === 'labs' || section === 'careers') {
      setActivePage('overview');
      return;
    }

    setActivePage('overview');
  }

  function handleTopbarBack() {
    switch (activePage) {
      case 'concept':
      case 'game':
        handleBackToAtlas();
        return;
      case 'sprint-summary':
        handleBackFromSprintSummary();
        return;
      case 'focus-room':
        handleBackFromFocusRoom();
        return;
      case 'weekly-plan':
        handleBackFromWeeklyPlan();
        return;
      case 'study-route':
        handleBackFromStudyRoute();
        return;
      case 'skill-map':
        handleBackFromSkillMap();
        return;
      case 'checkpoint-exam':
        handleBackFromCheckpointExam();
        return;
      case 'mistake-lab':
        handleBackFromMistakeLab();
        return;
      case 'insights':
        handleBackFromInsights();
        return;
      case 'progress':
        handleBackFromProgress();
        return;
      case 'review-plan':
        handleBackFromReviewPlan();
        return;
      case 'lesson':
        if (activeBankDiagnosticId) {
          handleBackFromDiagnostic();
          return;
        }
        handleBackToPath();
        return;
      case 'portfolio':
        handleBackFromPortfolio();
        return;
      case 'workbench':
      case 'lab':
        handleBackToLabs();
        return;
      case 'career-project':
        setActiveSection('careers');
        setActivePage('career');
        return;
      case 'career':
        handleBackToCareers();
        return;
      case 'overview':
        return;
    }
  }

  function handleOpenFieldJournal(seed: FieldJournalDraftSeed) {
    stageFieldJournalDraft(seed);
    setPendingFieldJournalDraft(seed);
    setFocusedFieldNoteId(null);
    setNotebookFilter('all');
    setNotebookQuery('');
    setNotebookLibraryView('notes');
    setActiveSection('notebook');
    setActivePage('overview');
    setOverlay(null);
    showToast(`${seed.title} opened in your Field Journal.`);
  }

  function handleSkillSelect(skill: SkillNode) {
    setActiveSkillId(skill.id);
    setActiveBankDiagnosticId(null);
    setSelectedOption(null);

    if (skill.status === 'Locked') {
      setActiveSection('learn');
      setActivePage('overview');
      showToast(`${skill.title} is locked. Finish earlier units to power this node.`);
      return;
    }

    const [questionIndex] = getAdaptiveQuestionIndices(skill.id, questionMastery);
    setSprintState(null);
    setCurrentQuestionIndex(questionIndex ?? 0);
    setPracticeMode('path');
    setActiveSection('practice');
    setActivePage('lesson');
    showToast(`${skill.title} opened as a question page.`);
  }

  function resumeSprintSession(session: SprintState) {
    const sprintQuestionIndex =
      session.questionIndices[session.position] ?? session.questionIndices[0];
    const sprintQuestion = lessonQuestions[sprintQuestionIndex];

    setSprintState({
      ...session,
      paused: false,
    });
    setActiveBankDiagnosticId(session.diagnosticId);
    setCurrentQuestionIndex(sprintQuestionIndex);
    setSelectedOption(session.selectedOption);
    setAnswerConfidence(session.answerConfidence);
    if (sprintQuestion) {
      setActiveSkillId(
        BANK_TOPIC_SKILL_IDS[sprintQuestion.topic] ?? skillNodes[0].id,
      );
    }
    setActiveSection('practice');
    setActivePage('lesson');
  }

  function handleStartLesson() {
    if (isSprintActive && sprintState) {
      resumeSprintSession(sprintState);
      return;
    }

    setSprintState(null);
    setActiveBankDiagnosticId(null);
    setActiveSection('practice');
    setActivePage('lesson');
    setSelectedOption(null);
  }

  function handleStartLabPractice() {
    const practiceTopicByLab: Record<string, string> = {
      'lab-adc': 'Measurement and Instrumentation',
      'lab-bjt': 'Semiconductor Devices',
      'lab-digital': 'Digital Logic',
      'lab-filter': 'Signals and Systems',
      'lab-mosfet': 'Power Electronics',
      'lab-ohms': 'DC Circuit Analysis',
      'lab-opamp': 'Analog Electronics and Op-Amps',
      'lab-pid': 'Control Systems',
      'lab-power': 'Power Systems',
      'lab-rc': 'Transient Circuit Analysis',
      'lab-resonance': 'AC Phasors and Impedance',
      'lab-transmission': 'Transmission Lines',
      'lab-transformer': 'Transformers and Electrical Machines',
    };
    const practiceTopic =
      practiceTopicByLab[activeLab.id] ?? activeLab.topic;
    const questionIndex = lessonQuestions.findIndex(
      (question) => question.topic === practiceTopic,
    );

    setSprintState(null);
    setActiveBankDiagnosticId(null);
    setPracticeMode('path');
    setSelectedOption(null);
    setAnswerConfidence(null);
    if (questionIndex >= 0) {
      setCurrentQuestionIndex(questionIndex);
      setActiveSkillId(
        BANK_TOPIC_SKILL_IDS[practiceTopic] ?? skillNodes[0].id,
      );
    }
    setActiveSection('practice');
    setActivePage('lesson');
    showToast(`${practiceTopic} practice opened from ${activeLab.title}.`);
  }

  function handleStartAdaptivePractice() {
    const [questionIndex] = getAdaptiveQuestionIndices(adaptiveSkill.id, questionMastery);
    setSprintState(null);
    setActiveBankDiagnosticId(null);
    setActiveSkillId(adaptiveSkill.id);
    setCurrentQuestionIndex(questionIndex ?? 0);
    setPracticeMode('path');
    setActiveSection('practice');
    setActivePage('lesson');
    setSelectedOption(null);
    showToast(`${adaptiveSkill.title} selected from your adaptive focus.`);
  }

  function handleOpenReviewPlan() {
    setLearningToolOrigin('overview');
    setSprintState(null);
    setActiveBankDiagnosticId(null);
    setSelectedOption(null);
    setReviewClock(Date.now());
    setActiveSection('practice');
    setActivePage('review-plan');
  }

  function handleOpenDailyMission(missionId: DailyMissionId) {
    if (missionId === 'questions') {
      handleOpenReviewPlan();
      showToast('Your due-question review is ready.');
      return;
    }

    if (missionId === 'xp') {
      handleStartAdaptivePractice();
      return;
    }

    handleSectionChange('labs');
    showToast('Choose a lab mission to complete today’s challenge.');
  }

  function handleBackFromReviewPlan() {
    if (learningToolOrigin === 'insights') {
      setActiveSection('learn');
      setActivePage('insights');
      return;
    }

    setActiveSection('practice');
    setActivePage('overview');
  }

  function handleOpenInsightsReview() {
    setLearningToolOrigin('insights');
    setSprintState(null);
    setActiveBankDiagnosticId(null);
    setSelectedOption(null);
    setReviewClock(Date.now());
    setActiveSection('practice');
    setActivePage('review-plan');
  }

  function handleOpenReviewQuestion(
    questionIndex: number,
    sourceLabel = 'your review plan',
  ) {
    const question = lessonQuestions[questionIndex];
    if (!question) {
      return;
    }

    setSprintState(null);
    setActiveBankDiagnosticId(null);
    setActiveSkillId(
      BANK_TOPIC_SKILL_IDS[question.topic] ?? adaptiveSkill.id,
    );
    setCurrentQuestionIndex(questionIndex);
    setPracticeMode('path');
    setSelectedOption(null);
    setActiveSection('practice');
    setActivePage('lesson');
    showToast(`${question.subtopic} opened from ${sourceLabel}.`);
  }

  function handleStartSmartReview() {
    if (reviewPlanQuestionIndices.length === 0) {
      showToast('Your review plan is clear.');
      return;
    }

    const firstQuestion = lessonQuestions[reviewPlanQuestionIndices[0]];
    const reviewSkill =
      skillNodes.find(
        (skill) =>
          skill.id ===
          BANK_TOPIC_SKILL_IDS[firstQuestion?.topic ?? ''],
      ) ?? adaptiveSkill;

    launchSprint(reviewSkill, reviewPlanQuestionIndices, {
      label: 'Smart Review',
      length: reviewPlanLength,
      message: `Smart Review started with ${reviewPlanQuestionIndices.length} scheduled checks.`,
      source: 'review',
    });
  }

  function launchSprint(
    skill: SkillNode,
    questionIndices: number[],
    options: SprintLaunchOptions,
  ) {
    const questionLimit = Math.min(
      MAX_SESSION_LENGTH,
      Math.max(1, Math.round(options.length ?? SPRINT_LENGTH)),
    );
    const sprintQuestionIndices = questionIndices.slice(0, questionLimit);
    setSprintState({
      answerConfidence: null,
      completedAt: null,
      diagnosticId: options.diagnosticId ?? null,
      earnedXp: 0,
      label: options.label,
      paused: false,
      position: 0,
      questionIndices: sprintQuestionIndices,
      results: [],
      selectedOption: null,
      source: options.source,
      startedAt: Date.now(),
    });
    setActiveBankDiagnosticId(options.diagnosticId ?? null);
    setActiveSkillId(skill.id);
    setCurrentQuestionIndex(sprintQuestionIndices[0] ?? 0);
    setPracticeMode('mixed');
    setActiveSection('practice');
    setActivePage('lesson');
    setSelectedOption(null);
    showToast(options.message);
  }

  function handleOpenMistakeLab() {
    setActiveSection('practice');
    setActivePage('mistake-lab');
    setOverlay(null);
  }

  function handleBackFromMistakeLab() {
    setActiveSection('learn');
    setActivePage('overview');
    showToast('Mistake Lab saved. Your recovery queue is ready.');
  }

  function handleSaveMistakeReflection(
    questionId: string,
    reflection: MistakeReflection,
  ) {
    setMistakeReflections((currentReflections) => ({
      ...currentReflections,
      [questionId]: reflection,
    }));
    showToast('Reflection saved to your mistake pattern.');
  }

  function launchMistakeRecovery(
    questionIndices: number[],
    label: string,
  ) {
    const validQuestionIndices = questionIndices.filter(
      (questionIndex) => lessonQuestions[questionIndex],
    );
    const firstQuestion = lessonQuestions[validQuestionIndices[0]];

    if (!firstQuestion || validQuestionIndices.length === 0) {
      showToast('Your active mistake queue is clear.');
      return;
    }

    const recoverySkill =
      skillNodes.find(
        (skill) =>
          skill.id === BANK_TOPIC_SKILL_IDS[firstQuestion.topic],
      ) ?? adaptiveSkill;

    launchSprint(recoverySkill, validQuestionIndices, {
      label,
      length: validQuestionIndices.length,
      message: `${label} started with ${validQuestionIndices.length} targeted ${
        validQuestionIndices.length === 1 ? 'prompt' : 'prompts'
      }.`,
      source: 'recovery',
    });
  }

  function handleStartMistakeRecovery() {
    if (
      sprintState?.source === 'recovery' &&
      sprintState.completedAt === null
    ) {
      resumeSprintSession(sprintState);
      showToast('Mistake Recovery resumed.');
      return;
    }

    launchMistakeRecovery(
      activeMistakeItems
        .slice(0, SPRINT_LENGTH)
        .map((item) => item.questionIndex),
      'Mistake Recovery',
    );
  }

  function handlePracticeMistakeQuestion(item: MistakeLabItem) {
    launchMistakeRecovery([item.questionIndex], 'One-question Repair');
  }

  function handleOpenSkillMap() {
    setLearningToolOrigin('overview');
    setActiveSection('learn');
    setActivePage('skill-map');
    setOverlay(null);
  }

  function handleBackFromSkillMap() {
    setActiveSection('learn');
    setActivePage(
      learningToolOrigin === 'insights' ? 'insights' : 'overview',
    );
  }

  function handleSkillMapSelect(skillId: string) {
    if (skillNodes.some((skill) => skill.id === skillId)) {
      setActiveSkillId(skillId);
    }
  }

  function handleSkillMapPractice(skillId: string) {
    const skill = skillNodes.find((candidate) => candidate.id === skillId);

    if (skill) {
      handleSkillSelect(skill);
    }
  }

  function handleSkillMapBank(collectionId: string) {
    const collection =
      BANK_COLLECTIONS.find((candidate) => candidate.id === collectionId) ??
      BANK_COLLECTIONS[0];

    setBankCollectionId(collection.id);
    setBankTopicFilter('all');
    setBankTopicQuery('');
    setActiveSection('bank');
    setActivePage('overview');
    setOverlay(null);
    showToast(`${collection.label} opened from your Skill Map.`);
  }

  function handleOpenCheckpointExam() {
    setActiveSection('learn');
    setActivePage('checkpoint-exam');
    setOverlay(null);
  }

  function handleBackFromCheckpointExam() {
    setActiveSection('learn');
    setActivePage('overview');
    showToast(
      checkpointExam && checkpointExam.completedAt === null
        ? 'Checkpoint saved. A timed exam will continue running.'
        : 'Back to Today.',
    );
  }

  function handleCreateCheckpointExam(config: CheckpointExamConfig) {
    const candidates = lessonQuestions
      .map((question, questionIndex) => ({
        mastery: questionMastery[question.id],
        question,
        questionIndex,
      }))
      .filter(
        ({ question }) =>
          config.domainId === 'all' ||
          getBankCollectionForTopic(question.topic).id === config.domainId,
      )
      .sort((left, right) => {
        const leftAccuracy = left.mastery
          ? left.mastery.correct / left.mastery.attempts
          : -1;
        const rightAccuracy = right.mastery
          ? right.mastery.correct / right.mastery.attempts
          : -1;

        return (
          Number(right.mastery?.lastResult === 'wrong') -
            Number(left.mastery?.lastResult === 'wrong') ||
          leftAccuracy - rightAccuracy ||
          (left.mastery?.attempts ?? 0) - (right.mastery?.attempts ?? 0) ||
          left.question.difficulty - right.question.difficulty ||
          left.questionIndex - right.questionIndex
        );
      });

    if (candidates.length < config.length) {
      showToast(
        `${candidates.length} questions are available in this domain. Choose a shorter checkpoint.`,
      );
      return;
    }

    const now = Date.now();
    const questionIds = candidates
      .slice(0, config.length)
      .map(({ question }) => question.id);
    const durationMinutes = getCheckpointDurationMinutes(config);
    const answers = Object.fromEntries(
      questionIds.map((questionId) => [
        questionId,
        {
          confidence: null,
          flagged: false,
          optionIndex: null,
        } satisfies CheckpointExamAnswer,
      ]),
    );

    setCheckpointExam({
      answers,
      bonusXp: 0,
      completedAt: null,
      config,
      createdAt: now,
      currentIndex: 0,
      earnedXp: 0,
      expiresAt:
        durationMinutes > 0 ? now + durationMinutes * 60_000 : null,
      id: `checkpoint-${now}`,
      questionIds,
      score: null,
      startedAt: now,
    });
    setActiveSection('learn');
    setActivePage('checkpoint-exam');
    showToast(
      `${config.length}-question checkpoint generated. Feedback is locked until submission.`,
    );
  }

  function handleCheckpointAnswerPatch(
    questionId: string,
    patch: Partial<CheckpointExamAnswer>,
  ) {
    setCheckpointExam((currentExam) => {
      if (
        !currentExam ||
        currentExam.completedAt !== null ||
        !currentExam.answers[questionId]
      ) {
        return currentExam;
      }

      return {
        ...currentExam,
        answers: {
          ...currentExam.answers,
          [questionId]: {
            ...currentExam.answers[questionId],
            ...patch,
          },
        },
      };
    });
  }

  function handleCheckpointNavigate(questionIndex: number) {
    setCheckpointExam((currentExam) =>
      currentExam && currentExam.completedAt === null
        ? {
            ...currentExam,
            currentIndex: Math.min(
              currentExam.questionIds.length - 1,
              Math.max(0, Math.round(questionIndex)),
            ),
          }
        : currentExam,
    );
  }

  function handleSubmitCheckpoint(expired = false) {
    if (!checkpointExam || checkpointExam.completedAt !== null) {
      return;
    }

    const completedAt = Date.now();
    const examQuestions = checkpointExam.questionIds.flatMap((questionId) => {
      const question = lessonQuestions.find(
        (candidate) => candidate.id === questionId,
      );
      return question ? [question] : [];
    });
    const results = examQuestions.map((question) => ({
      correct:
        checkpointExam.answers[question.id]?.optionIndex ===
        question.correctIndex,
      question,
    }));
    const correctCount = results.filter((result) => result.correct).length;
    const score = Math.round(
      (correctCount / Math.max(1, results.length)) * 100,
    );
    const firstCompletionBonus =
      checkpointExamCompletionCount === 0 ? CHECKPOINT_FIRST_BONUS_XP : 0;
    const questionXp = results.reduce(
      (xp, result) => xp + (result.correct ? result.question.xp : 0),
      0,
    );
    const examXp = questionXp + firstCompletionBonus;

    setCheckpointExam({
      ...checkpointExam,
      bonusXp: firstCompletionBonus,
      completedAt,
      earnedXp: examXp,
      score,
    });
    setCheckpointExamCompletionCount((count) => count + 1);
    setCheckpointBestScore((bestScore) => Math.max(bestScore, score));
    setReviewClock(completedAt);
    setQuestionMastery((mastery) => {
      const nextMastery = { ...mastery };

      results.forEach((result, resultIndex) => {
        nextMastery[result.question.id] = getUpdatedQuestionMastery(
          nextMastery[result.question.id],
          result.correct ? 'correct' : 'wrong',
          completedAt + resultIndex,
        );
      });

      return nextMastery;
    });
    setSkillProgress((progressBySkill) => {
      const nextProgress = { ...progressBySkill };

      results.forEach((result) => {
        if (!result.correct) {
          return;
        }

        const skillId =
          BANK_TOPIC_SKILL_IDS[result.question.topic] ?? skillNodes[0].id;
        const baseSkill =
          skillNodes.find((skill) => skill.id === skillId) ?? skillNodes[0];
        nextProgress[skillId] = Math.min(
          100,
          (nextProgress[skillId] ?? baseSkill.progress) + 2,
        );
      });

      return nextProgress;
    });
    setEarnedXp((xp) => xp + examXp);
    recordDailyActivity({
      exams: 1,
      focusMinutes: Math.max(
        1,
        Math.min(
          30,
          Math.round((completedAt - checkpointExam.startedAt) / 60_000),
        ),
      ),
      questions: results.length,
      xp: examXp,
    });

    if (soundEnabled) {
      playFeedbackTone(score >= 70 ? 'correct' : 'wrong');
    }

    showToast(
      expired
        ? `Time ended. Checkpoint submitted at ${score}%.`
        : `Checkpoint submitted at ${score}% with +${examXp} XP.`,
    );
  }

  function handleResetCheckpointExam() {
    const previousExam = checkpointExam;
    setCheckpointExam(null);
    setActiveSection('learn');
    setActivePage('checkpoint-exam');
    showToast(
      'Checkpoint builder ready.',
      previousExam
        ? {
            label: 'Undo',
            run: () => {
              setCheckpointExam(previousExam);
              setActiveSection('learn');
              setActivePage('checkpoint-exam');
              showToast('Checkpoint restored.');
            },
          }
        : undefined,
    );
  }

  function handleOpenCheckpointMistakes() {
    setActiveSection('practice');
    setActivePage('mistake-lab');
    showToast('Checkpoint misses are prioritized in Mistake Lab.');
  }

  function startNewSprint(
    skill: SkillNode,
    message: string,
    source: SprintSource = 'power',
  ) {
    launchSprint(
      skill,
      getAdaptiveQuestionIndices(skill.id, questionMastery),
      {
        label: source === 'career' ? 'Career Sprint' : 'Power Sprint',
        message,
        source,
      },
    );
  }

  function handleStartSprint() {
    if (isSprintActive && sprintState) {
      resumeSprintSession(sprintState);
      return;
    }

    startNewSprint(
      adaptiveSkill,
      `Power Sprint started with ${SPRINT_LENGTH} adaptive prompts.`,
    );
  }

  function handleStartCareerSprint() {
    if (isSprintActive) {
      handleStartSprint();
      return;
    }

    const careerSkill =
      skillNodes.find(
        (skill) => skill.id === selectedCareerReadiness.focusSkill.id,
      ) ?? adaptiveSkill;
    setTunedCareerRole(selectedCareer.role);
    startNewSprint(
      careerSkill,
      `${selectedCareer.role} sprint started with ${SPRINT_LENGTH} focused prompts.`,
      'career',
    );
  }

  function handleCustomSessionConfigChange(
    patch: Partial<CustomSessionConfig>,
  ) {
    setCustomSessionConfig((config) => ({
      ...config,
      ...patch,
    }));
  }

  function handleResetCustomSession() {
    const previousConfig = customSessionConfig;
    const configChanged =
      previousConfig.collectionId !==
        DEFAULT_CUSTOM_SESSION_CONFIG.collectionId ||
      previousConfig.difficulty !== DEFAULT_CUSTOM_SESSION_CONFIG.difficulty ||
      previousConfig.length !== DEFAULT_CUSTOM_SESSION_CONFIG.length ||
      previousConfig.prioritizeReview !==
        DEFAULT_CUSTOM_SESSION_CONFIG.prioritizeReview;

    setCustomSessionConfig(DEFAULT_CUSTOM_SESSION_CONFIG);
    showToast(
      'Session builder reset to a balanced five-question mix.',
      configChanged
        ? {
            label: 'Undo',
            run: () => {
              setCustomSessionConfig(previousConfig);
              showToast('Previous session blueprint restored.');
            },
          }
        : undefined,
    );
  }

  function handleStartCustomSession() {
    if (customSessionQuestionCount === 0) {
      showToast('No questions match this blueprint. Try another level or domain.');
      return;
    }

    const sessionSkill =
      skillNodes.find(
        (skill) => skill.id === customSessionCollection?.skillId,
      ) ?? adaptiveSkill;
    const label =
      customSessionCollection !== null
        ? `${customSessionCollection.label} Session`
        : customSessionConfig.difficulty === 'all'
          ? 'Mixed Mastery Session'
          : `${customSessionDifficulty.label} Session`;

    launchSprint(sessionSkill, customSessionQuestionIndices, {
      label,
      length: customSessionConfig.length,
      message: `${label} started with ${customSessionQuestionCount} focused prompts.`,
      source: 'custom',
    });
  }

  function handleCancelSprint() {
    const sprintSource = sprintState?.source;
    setSprintState(null);
    setActiveBankDiagnosticId(null);
    setPracticeMode('path');
    setSelectedOption(null);

    if (sprintSource === 'recovery') {
      setActiveSection('practice');
      setActivePage('mistake-lab');
      showToast('Mistake Recovery ended. Your reflections are still saved.');
      return;
    }

    setActiveSection(
      sprintSource === 'diagnostic'
        ? 'bank'
        : sprintSource === 'custom' || sprintSource === 'review'
          ? 'practice'
          : 'learn',
    );
    setActivePage('overview');
    showToast(
      sprintSource === 'diagnostic'
        ? 'Domain diagnostic ended. Your Question Bank progress is saved.'
        : sprintSource === 'custom'
          ? 'Custom session ended. Your builder is ready.'
          : sprintSource === 'review'
            ? 'Smart Review ended. Your schedule is saved.'
          : 'Power Sprint ended. Your regular path is ready.',
    );
  }

  function handleOpenProgress() {
    setActivePage('progress');
    setOverlay(null);
  }

  function handleBackFromProgress() {
    setActivePage('overview');
    setActiveSection('learn');
  }

  function handleOpenInsights() {
    setActivePage('insights');
    setOverlay(null);
  }

  function handleBackFromInsights() {
    setActivePage('progress');
    setActiveSection('learn');
  }

  function handleOpenInsightSkill(skillId: string) {
    setLearningToolOrigin('insights');
    setActiveSkillId(skillId);
    setActiveSection('learn');
    setActivePage('skill-map');
    setOverlay(null);
  }

  function handleOpenFocusRoom() {
    setActivePage('focus-room');
    setOverlay(null);
  }

  function handleOpenTutor() {
    void preloadZyTutor().catch(() => undefined);
    setOverlay(null);
    setTutorOpen(true);
  }

  function handleTutorAction(action: ZyTutorAction) {
    setTutorOpen(false);

    if (action === 'practice') {
      if (activePage === 'lesson') {
        showToast('Back to the current question.');
        return;
      }
      handleStartAdaptivePractice();
      return;
    }

    if (action === 'review') {
      handleOpenReviewPlan();
      return;
    }

    if (action === 'lab') {
      handleLabSelect(tutorContext.labId ?? activeLab.id);
      return;
    }

    if (action === 'notebook') {
      setNotebookLibraryView('formulas');
      setActiveSection('notebook');
      setActivePage('overview');
      setOverlay(null);
      showToast('Formula Notebook opened from Zy Tutor.');
      return;
    }

    if (action === 'skill-map') {
      setActiveSkillId(tutorSkill.id);
      handleOpenSkillMap();
      return;
    }

    handleOpenFocusRoom();
  }

  function handleBackFromFocusRoom() {
    setActiveSection('learn');
    setActivePage('overview');
  }

  function handleStartFocusSession(config: FocusSessionConfig) {
    const objective =
      focusObjectives.find(
        (candidate) => candidate.id === config.objectiveId,
      ) ?? focusObjectives[0];

    if (!objective) {
      showToast('Choose a focus objective first.');
      return;
    }

    const startedAt = Date.now();
    setFocusClock(startedAt);
    setFocusSession({
      distractions: 0,
      durationMinutes: config.durationMinutes,
      endedAt: null,
      id: `focus-${startedAt}`,
      intention: config.intention.slice(0, 140),
      notes: '',
      objectiveDetail: objective.detail,
      objectiveId: objective.id,
      objectiveTitle: objective.label,
      pausedAt: null,
      pausedDurationMs: 0,
      startedAt,
    });
    showToast(
      `${config.durationMinutes}-minute focus session started. The timer will follow you.`,
    );
  }

  function handlePauseFocusSession() {
    const pausedAt = Date.now();
    setFocusClock(pausedAt);
    setFocusSession((current) =>
      !current || current.endedAt !== null || current.pausedAt !== null
        ? current
        : { ...current, pausedAt },
    );
  }

  function handleResumeFocusSession() {
    const resumedAt = Date.now();
    setFocusClock(resumedAt);
    setFocusSession((current) =>
      !current || current.endedAt !== null || current.pausedAt === null
        ? current
        : {
            ...current,
            pausedAt: null,
            pausedDurationMs:
              current.pausedDurationMs +
              Math.max(0, resumedAt - current.pausedAt),
          },
    );
  }

  function handleEndFocusSession() {
    const endedAt = Date.now();
    setFocusClock(endedAt);
    setFocusSession((current) =>
      !current || current.endedAt !== null
        ? current
        : {
            ...current,
            endedAt,
            pausedAt: null,
            pausedDurationMs:
              current.pausedDurationMs +
              (current.pausedAt === null
                ? 0
                : Math.max(0, endedAt - current.pausedAt)),
          },
    );
  }

  function handleFocusNotesChange(notes: string) {
    setFocusSession((current) =>
      current ? { ...current, notes: notes.slice(0, 800) } : current,
    );
  }

  function handleFocusDistraction(delta: number) {
    setFocusSession((current) =>
      !current
        ? current
        : {
            ...current,
            distractions: Math.min(
              99,
              Math.max(0, current.distractions + delta),
            ),
          },
    );
  }

  function handleDiscardFocusDebrief() {
    setFocusSession(null);
    showToast('Focus session discarded without changing your activity log.');
  }

  function handleSaveFocusDebrief(debrief: FocusDebrief) {
    if (!focusSession || focusSession.endedAt === null) {
      return;
    }

    const focusedSeconds = Math.min(
      focusSession.durationMinutes * 60,
      Math.max(
        0,
        Math.floor(getFocusElapsedMs(focusSession, focusSession.endedAt) / 1000),
      ),
    );
    const focusedMinutes = Math.floor(focusedSeconds / 60);
    const record: FocusSessionRecord = {
      completedAt: focusSession.endedAt,
      distractions: focusSession.distractions,
      durationMinutes: focusSession.durationMinutes,
      energy: debrief.energy,
      focusedSeconds,
      id: focusSession.id,
      objectiveTitle: focusSession.objectiveTitle,
      outcome: debrief.outcome,
      takeaway:
        debrief.takeaway || focusSession.notes.trim().slice(0, 500),
    };

    setFocusSessionHistory((history) => [
      record,
      ...history.filter((item) => item.id !== record.id),
    ].slice(0, 20));
    setFocusSession(null);

    if (focusedMinutes > 0) {
      recordDailyActivity({ focusMinutes: focusedMinutes });
    }

    showToast(
      focusedMinutes > 0
        ? `${focusedMinutes} focused ${
            focusedMinutes === 1 ? 'minute' : 'minutes'
          } added to Insights.`
        : 'Debrief saved. Sessions under one minute do not change focus totals.',
    );
  }

  function handleOpenFocusObjective(objectiveId: string) {
    if (objectiveId === 'review') {
      handleOpenReviewPlan();
      return;
    }
    if (objectiveId === 'practice') {
      handleStartAdaptivePractice();
      return;
    }
    if (objectiveId === 'lab') {
      handleLabSelect(activeLab.id);
      return;
    }

    handleOpenStudyRoute();
  }

  function handleBackToPath() {
    setSprintState((session) =>
      session && session.completedAt === null
        ? {
            ...session,
            paused: true,
          }
        : session,
    );

    if (
      sprintState?.source === 'recovery' &&
      sprintState.completedAt === null
    ) {
      setActivePage('mistake-lab');
      setActiveSection('practice');
      showToast('Mistake Recovery paused. Resume it from the lab.');
      return;
    }

    const isPracticeSession =
      sprintState?.source === 'custom' || sprintState?.source === 'review';
    setActivePage('overview');
    setActiveSection(isPracticeSession ? 'practice' : 'learn');
    showToast(
      isSprintActive
        ? `${sprintState?.label ?? 'Practice session'} paused. Resume it from Today.`
        : isPracticeSession
          ? 'Back at the session builder.'
          : 'Back on the lesson path.',
    );
  }

  function handleOpenWeeklyPlan() {
    setLearningToolOrigin('overview');
    setActiveSection('learn');
    setActivePage('weekly-plan');
    setOverlay(null);
  }

  function handleBackFromWeeklyPlan() {
    setActiveSection('learn');
    setActivePage(
      learningToolOrigin === 'insights' ? 'insights' : 'overview',
    );
  }

  function handleOpenInsightsWeeklyPlan() {
    setLearningToolOrigin('insights');
    setActiveSection('learn');
    setActivePage('weekly-plan');
    setOverlay(null);
  }

  function handleCreateWeeklyPlan(config: WeeklyPlanConfig) {
    setWeeklyPlan({
      ...config,
      createdAt: Date.now(),
      rewardClaimedAt:
        weeklyPlanRewardWeek === plannerWeekKey ? Date.now() : null,
      weekKey: plannerWeekKey,
    });
    setActiveSection('learn');
    setActivePage('weekly-plan');
    showToast(
      `${config.studyDays.length}-day weekly plan created with ${config.targetXp} XP in view.`,
    );
  }

  function handleResetWeeklyPlan() {
    const previousPlan = weeklyPlan;
    setWeeklyPlan(null);
    showToast(
      'Weekly plan builder is ready.',
      previousPlan
        ? {
            label: 'Undo',
            run: () => {
              setWeeklyPlan(previousPlan);
              showToast('Weekly plan restored.');
            },
          }
        : undefined,
    );
  }

  function handleClaimWeeklyPlanReward() {
    if (
      !currentWeeklyPlan ||
      !weeklyPlanComplete ||
      currentWeeklyPlan.rewardClaimedAt !== null ||
      weeklyPlanRewardWeek === plannerWeekKey
    ) {
      return;
    }

    setWeeklyPlan({
      ...currentWeeklyPlan,
      rewardClaimedAt: Date.now(),
    });
    setWeeklyPlanRewardWeek(plannerWeekKey);
    setEarnedXp((xp) => xp + WEEKLY_PLAN_REWARD_XP);
    recordDailyActivity({ xp: WEEKLY_PLAN_REWARD_XP });
    showToast(`Weekly plan complete. +${WEEKLY_PLAN_REWARD_XP} XP added.`);
  }

  function handleWeeklyPlanAction(action: WeeklyPlanAction) {
    if (action === 'lab') {
      handleLabSelect(CAREER_PROFILES[tunedCareer.role].labId);
      return;
    }

    if (action === 'practice') {
      handleStartAdaptivePractice();
      return;
    }

    handleOpenStudyRoute();
  }

  function handleOpenStudyRoute() {
    setActiveSection('learn');
    setActivePage('study-route');
    setOverlay(null);
  }

  function handleBackFromStudyRoute() {
    setActiveSection('learn');
    setActivePage('overview');
    showToast(
      studyRoute && studyRoute.completedAt === null
        ? 'Study route saved. Resume it from Today.'
        : 'Back to Today.',
    );
  }

  function handleGenerateStudyRoute(config: StudyRouteConfig) {
    const nextRoute = createStudyRoute(config, {
      adaptiveSkill,
      adaptiveSkillProgress,
      portfolioEvidenceCount: portfolioEvidence.length,
      readyFormulaCount,
      reviewCount: reviewQuestionIds.length,
      savedCircuitCount: savedCircuitDesigns.length,
      tunedCareerReadiness,
    });

    setStudyRoute(nextRoute);
    setActiveSection('learn');
    setActivePage('study-route');
    showToast(
      `${config.duration}-minute route built with ${nextRoute.steps.length} focused steps.`,
    );
  }

  function handleResetStudyRoute() {
    const previousRoute = studyRoute;
    setStudyRoute(null);
    showToast(
      'Route builder ready for a new plan.',
      previousRoute
        ? {
            label: 'Undo',
            run: () => {
              setStudyRoute(previousRoute);
              showToast('Study route restored.');
            },
          }
        : undefined,
    );
  }

  function handleOpenStudyRouteStep(step: StudyRouteStep) {
    setStudyRoute((currentRoute) => {
      if (
        !currentRoute ||
        currentRoute.openedStepIds.includes(step.id)
      ) {
        return currentRoute;
      }

      return {
        ...currentRoute,
        openedStepIds: [...currentRoute.openedStepIds, step.id],
      };
    });

    if (step.action === 'review') {
      handleOpenReviewPlan();
      return;
    }

    if (step.action === 'practice') {
      const skill = skillNodes.find((candidate) => candidate.id === step.sourceId);
      if (skill) {
        handleSkillSelect(skill);
      } else {
        handleStartAdaptivePractice();
      }
      return;
    }

    if (step.action === 'lab' && step.sourceId) {
      handleLabSelect(step.sourceId);
      return;
    }

    if (step.action === 'workbench') {
      handleOpenCircuitWorkbench();
      return;
    }

    if (step.action === 'career' && step.sourceId) {
      handleCareerSelect(step.sourceId);
      return;
    }

    if (step.action === 'portfolio') {
      handleOpenPortfolio();
      return;
    }

    if (step.action === 'notebook') {
      setNotebookFilter('all');
      setNotebookQuery('');
      setNotebookLibraryView('formulas');
      setActiveSection('notebook');
      setActivePage('overview');
      showToast('Formula recall opened from your Study Route.');
      return;
    }

    handleStartSprint();
  }

  function handleToggleStudyRouteStep(stepId: string) {
    setStudyRoute((currentRoute) => {
      if (!currentRoute || currentRoute.completedAt !== null) {
        return currentRoute;
      }

      const isComplete = currentRoute.completedStepIds.includes(stepId);
      if (!isComplete && !currentRoute.openedStepIds.includes(stepId)) {
        return currentRoute;
      }

      return {
        ...currentRoute,
        completedStepIds: isComplete
          ? currentRoute.completedStepIds.filter(
              (candidate) => candidate !== stepId,
            )
          : [...currentRoute.completedStepIds, stepId],
      };
    });
  }

  function handleFinishStudyRoute() {
    if (
      !studyRoute ||
      studyRoute.completedAt !== null ||
      studyRoute.completedStepIds.length !== studyRoute.steps.length
    ) {
      showToast('Complete every route step before finishing.');
      return;
    }

    const isFirstRoute = studyRouteCompletionCount === 0;
    const earnedRouteXp = isFirstRoute ? STUDY_ROUTE_XP : 0;
    setStudyRoute((currentRoute) =>
      currentRoute
        ? {
            ...currentRoute,
            completedAt: Date.now(),
            earnedXp: earnedRouteXp,
          }
        : currentRoute,
    );
    setStudyRouteCompletionCount((count) => count + 1);
    recordDailyActivity({
      focusMinutes: studyRoute.config.duration,
      xp: earnedRouteXp,
    });

    if (isFirstRoute) {
      setEarnedXp((xp) => xp + STUDY_ROUTE_XP);
      if (soundEnabled) {
        playFeedbackTone('correct');
      }
    }

    showToast(
      isFirstRoute
        ? `Study Route complete. +${STUDY_ROUTE_XP} XP.`
        : 'Study Route complete. Today’s focus time was recorded.',
    );
  }

  function handleBackFromDiagnostic() {
    setSprintState((session) =>
      session && session.completedAt === null
        ? {
            ...session,
            paused: true,
          }
        : session,
    );
    setActivePage('overview');
    setActiveSection('bank');
    showToast('Domain diagnostic paused. Resume it from Today when you are ready.');
  }

  function handleBackFromSprintSummary() {
    const sprintSource = sprintState?.source;
    setSprintState(null);
    setActiveBankDiagnosticId(null);

    if (sprintSource === 'review') {
      setActiveSection('practice');
      setActivePage('review-plan');
      setReviewClock(Date.now());
      return;
    }

    if (sprintSource === 'recovery') {
      setActiveSection('practice');
      setActivePage('mistake-lab');
      setReviewClock(Date.now());
      return;
    }

    setActivePage('overview');
    setActiveSection(
      sprintSource === 'diagnostic'
        ? 'bank'
        : sprintSource === 'custom'
          ? 'practice'
          : 'learn',
    );
  }

  function handleRestartSprint() {
    if (sprintState?.diagnosticId) {
      handleStartBankDiagnostic(sprintState.diagnosticId);
      return;
    }

    if (sprintState?.source === 'custom') {
      handleStartCustomSession();
      return;
    }

    if (sprintState?.source === 'review') {
      handleStartSmartReview();
      return;
    }

    if (sprintState?.source === 'recovery') {
      launchMistakeRecovery(
        sprintState.questionIndices,
        sprintState.label,
      );
      return;
    }

    handleStartSprint();
  }

  function handleStrengthenSprintSkill() {
    if (sprintState?.source === 'recovery') {
      handleOpenMistakeLab();
      return;
    }

    if (sprintState?.source === 'review') {
      handleOpenReviewPlan();
      return;
    }

    if (!sprintState?.diagnosticId) {
      handleStartAdaptivePractice();
      return;
    }

    const focusResult =
      sprintState.results.find((result) => result.result !== 'correct') ??
      sprintState.results[0];
    const question = focusResult
      ? lessonQuestions.find(
          (candidate) => candidate.id === focusResult.questionId,
        )
      : undefined;

    if (question) {
      handleOpenTopicSample(question.topic);
    }
  }

  function handleReviewSprintMistakes() {
    if (sprintState?.source === 'recovery') {
      setSprintState(null);
      setActiveBankDiagnosticId(null);
      setActiveSection('practice');
      setActivePage('mistake-lab');
      showToast('Missed recovery prompts are back in your active queue.');
      return;
    }

    setSprintState(null);
    setActiveBankDiagnosticId(null);
    handlePracticeModeChange('review');
  }

  function handleBackToLabs() {
    setActivePage('overview');
    setActiveSection('labs');
    showToast('Back to Labs.');
  }

  function handleAtlasConceptSelect(conceptId: string) {
    const concept = getElectricalConcept(conceptId);
    if (!concept) {
      return;
    }

    setActiveAtlasId(conceptId);
    setActiveSection('atlas');
    setActivePage('concept');
    setOverlay(null);
    showToast(`${concept.title} opened in the EE Atlas.`);
  }

  function handleAtlasGameSelect(gameId: string) {
    const game = getEngineeringGame(gameId);
    if (!game) {
      return;
    }

    setActiveAtlasId(gameId);
    setActiveSection('atlas');
    setActivePage('game');
    setOverlay(null);
    showToast(`${game.title} ready to play.`);
  }

  function handleBackToAtlas() {
    setActiveAtlasId(null);
    setActiveSection('atlas');
    setActivePage('overview');
  }

  function handleOpenCircuitWorkbench() {
    setActiveSection('labs');
    setActivePage('workbench');
    setOverlay(null);
  }

  function handleSaveCircuitDesign(design: CircuitDesign) {
    const isFirstDesign = workbenchSaveCount === 0;
    const savedAt = Date.now();
    const savedDesign: CircuitDesign = {
      ...design,
      id: `circuit-${savedAt}`,
      name: design.name.trim() || 'Saved circuit',
      resistors: design.resistors.map((resistor) => ({ ...resistor })),
      savedAt,
    };

    setSavedCircuitDesigns((designs) => [savedDesign, ...designs].slice(0, 6));
    setWorkbenchSaveCount((count) => count + 1);

    if (isFirstDesign) {
      setEarnedXp((xp) => xp + CIRCUIT_WORKBENCH_XP);
      recordDailyActivity({
        focusMinutes: 6,
        labMissions: 1,
        xp: CIRCUIT_WORKBENCH_XP,
      });

      if (soundEnabled) {
        playFeedbackTone('correct');
      }
    }

    showToast(
      isFirstDesign
        ? `Circuit validated and saved. +${CIRCUIT_WORKBENCH_XP} XP.`
        : `${savedDesign.name} saved to the workbench shelf.`,
    );
  }

  function handleDeleteCircuitDesign(designId: string) {
    const design = savedCircuitDesigns.find(
      (candidate) => candidate.id === designId,
    );
    const removedIndex = savedCircuitDesigns.findIndex(
      (candidate) => candidate.id === designId,
    );

    if (!design) {
      return;
    }

    setSavedCircuitDesigns((designs) =>
      designs.filter((candidate) => candidate.id !== designId),
    );
    showToast(`${design.name} removed from saved designs.`, {
      label: 'Undo',
      run: () => {
        setSavedCircuitDesigns((designs) => {
          if (designs.some((candidate) => candidate.id === design.id)) {
            return designs;
          }

          const restoredDesigns = [...designs];
          restoredDesigns.splice(
            Math.min(Math.max(removedIndex, 0), restoredDesigns.length),
            0,
            design,
          );
          return restoredDesigns.slice(0, 6);
        });
        showToast(`${design.name} restored to saved designs.`);
      },
    });
  }

  function handleBackToCareers() {
    setActivePage('overview');
    setActiveSection('careers');
    showToast('Back to Career Map.');
  }

  function handleLabSelect(labId: string) {
    const nextLab = labScenarios.find((lab) => lab.id === labId);
    setActiveLabId(labId);
    setActiveLabMissionId(
      getNextLabMissionId(labId, completedLabMissionIds),
    );
    setLabMissionFeedback(null);
    setActiveSection('labs');
    setActivePage('lab');
    showToast(nextLab ? `${nextLab.title} opened as a lab page.` : 'Lab page opened.');
  }

  function handleCareerSelect(role: string) {
    setComparisonCareerRole((currentRole) =>
      currentRole === role ? selectedCareerRole : currentRole,
    );
    setSelectedCareerRole(role);
    setActiveSection('careers');
    setActivePage('career');
    showToast(`${role} opened as a career page.`);
  }

  function handleOpenPortfolio() {
    setActiveSection('careers');
    setActivePage('portfolio');
    setOverlay(null);
  }

  function handleBackFromPortfolio() {
    setActiveSection('careers');
    setActivePage('career');
    showToast('Back to Career Page.');
  }

  function handleTogglePortfolioFeatured(evidenceId: string) {
    if (activePortfolioFeaturedIds.includes(evidenceId)) {
      const removedIndex = portfolioFeaturedIds.indexOf(evidenceId);
      setPortfolioFeaturedIds((featuredIds) =>
        featuredIds.filter((candidate) => candidate !== evidenceId),
      );
      showToast('Removed from featured evidence.', {
        label: 'Undo',
        run: () => {
          setPortfolioFeaturedIds((featuredIds) => {
            if (featuredIds.includes(evidenceId)) {
              return featuredIds;
            }

            const restoredIds = [...featuredIds];
            restoredIds.splice(
              Math.min(Math.max(removedIndex, 0), restoredIds.length),
              0,
              evidenceId,
            );
            return restoredIds;
          });
          showToast('Evidence restored to your portfolio.');
        },
      });
      return;
    }

    if (activePortfolioFeaturedIds.length >= 3) {
      showToast('Your portfolio can feature three items. Remove one to swap it.');
      return;
    }

    setPortfolioFeaturedIds((featuredIds) => [
      ...featuredIds.filter((candidate) =>
        availablePortfolioEvidenceIds.has(candidate),
      ),
      evidenceId,
    ]);
    showToast('Added to featured evidence.');
  }

  function handlePortfolioNoteChange(evidenceId: string, note: string) {
    setPortfolioNotes((notes) => ({
      ...notes,
      [evidenceId]: note.slice(0, 280),
    }));
  }

  function handlePublishPortfolio() {
    const readyToPublish =
      portfolioHeadline.trim().length >= 8 &&
      activePortfolioFeaturedIds.length === 3;

    if (!readyToPublish) {
      showToast('Add a headline and feature three evidence items first.');
      return;
    }

    const isFirstPublish = portfolioPublishCount === 0;
    setPortfolioPublishCount((count) => count + 1);

    if (isFirstPublish) {
      setEarnedXp((xp) => xp + PORTFOLIO_READY_XP);
      recordDailyActivity({
        focusMinutes: 8,
        xp: PORTFOLIO_READY_XP,
      });

      if (soundEnabled) {
        playFeedbackTone('correct');
      }
    }

    showToast(
      isFirstPublish
        ? `Portfolio marked ready. +${PORTFOLIO_READY_XP} XP.`
        : 'Portfolio update saved.',
    );
  }

  function handleOpenPortfolioEvidence(evidence: PortfolioEvidence) {
    setOverlay(null);

    if (evidence.kind === 'project') {
      setSelectedCareerRole(evidence.sourceId);
      setActiveSection('careers');
      setActivePage('career-project');
      showToast(`${evidence.title} opened in Project Studio.`);
      return;
    }

    if (evidence.kind === 'lab') {
      handleLabSelect(evidence.sourceId);
      return;
    }

    if (evidence.kind === 'circuit') {
      const selectedDesign = savedCircuitDesigns.find(
        (design) => design.id === evidence.sourceId,
      );

      if (selectedDesign) {
        setSavedCircuitDesigns((designs) => [
          selectedDesign,
          ...designs.filter((design) => design.id !== selectedDesign.id),
        ]);
      }

      handleOpenCircuitWorkbench();
      showToast(`${evidence.title} opened in Circuit Workbench.`);
      return;
    }

    if (evidence.kind === 'diagnostic') {
      setBankCollectionId(evidence.sourceId as BankCollectionId);
      setBankTopicFilter('all');
      setActiveSection('bank');
      setActivePage('overview');
      showToast(`${evidence.title} opened in Question Bank.`);
      return;
    }

    const formulaEntry = FORMULA_LIBRARY.find(
      (entry) => entry.id === evidence.sourceId,
    );
    setNotebookFilter('all');
    setNotebookQuery(formulaEntry?.title ?? evidence.title);
    setNotebookLibraryView('formulas');
    setActiveSection('notebook');
    setActivePage('overview');
    showToast(`${evidence.title} opened in your notebook.`);
  }

  function handleCareerComparisonChange(role: string) {
    if (role === selectedCareer.role) {
      return;
    }

    setComparisonCareerRole(role);
  }

  function handleOpenCareerSkill(skillId: string) {
    const skill = skillNodes.find((candidate) => candidate.id === skillId);

    if (!skill) {
      return;
    }

    handleSkillSelect(skill);
  }

  function handleTunePathFromCareer() {
    setTunedCareerRole(selectedCareer.role);
    showToast(
      `${selectedCareer.role} is active. Adaptive practice now follows its weakest available skill.`,
    );
  }

  function handleOpenCareerProject() {
    setActiveSection('careers');
    setActivePage('career-project');
    setOverlay(null);
  }

  function handleCareerProjectAnswer(
    decisionId: string,
    optionId: string,
  ) {
    const decision = activeCareerProject.decisions.find(
      (candidate) => candidate.id === decisionId,
    );

    if (
      !decision ||
      !decision.options.some((option) => option.id === optionId)
    ) {
      return;
    }

    setCareerProjectRecords((records) => {
      const currentRecord = records[selectedCareer.role] ?? {
        answers: {},
        completedAt: null,
        score: 0,
      };

      return {
        ...records,
        [selectedCareer.role]: {
          ...currentRecord,
          answers: {
            ...currentRecord.answers,
            [decisionId]: optionId,
          },
        },
      };
    });
  }

  function handleSubmitCareerProject() {
    const record = careerProjectRecords[selectedCareer.role];
    const hasEveryDecision = activeCareerProject.decisions.every(
      (decision) => record?.answers[decision.id],
    );

    if (!record || !hasEveryDecision) {
      showToast('Complete all three project decisions before review.');
      return;
    }

    const correctDecisions = activeCareerProject.decisions.filter(
      (decision) =>
        record.answers[decision.id] === decision.correctOptionId,
    ).length;
    const score = Math.round(
      (correctDecisions / activeCareerProject.decisions.length) * 100,
    );
    const isFirstCompletion = record.completedAt === null;
    const completedAt = record.completedAt ?? Date.now();

    setCareerProjectRecords((records) => ({
      ...records,
      [selectedCareer.role]: {
        ...record,
        completedAt,
        score: Math.max(record.score, score),
      },
    }));

    if (isFirstCompletion) {
      setEarnedXp((xp) => xp + activeCareerProject.xp);
      recordDailyActivity({
        careerProjects: 1,
        focusMinutes: 8,
        xp: activeCareerProject.xp,
      });

      if (soundEnabled) {
        playFeedbackTone('correct');
      }
    }

    markStudyListResourceComplete('Career', selectedCareer.role);

    showToast(
      isFirstCompletion
        ? `Project review complete. ${score}% evidence score and +${activeCareerProject.xp} XP.`
        : `Project evidence updated. Best score ${Math.max(record.score, score)}%.`,
    );
  }

  function handleLabValueChange(key: LabValueKey, value: number) {
    setLabMissionFeedback(null);
    setLabValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  }

  function handleLabMissionSelect(missionId: string) {
    const mission = LAB_MISSIONS.find(
      (candidate) =>
        candidate.id === missionId && candidate.labId === activeLab.id,
    );

    if (!mission) {
      return;
    }

    setActiveLabMissionId(mission.id);
    setLabMissionFeedback(null);
  }

  function handleCheckLabMission() {
    const delta = activeLabMetric - activeLabMission.target;
    const absoluteDelta = Math.abs(delta);

    if (absoluteDelta > activeLabMission.tolerance) {
      const direction = delta < 0 ? 'low' : 'high';
      setLabMissionFeedback({
        kind: 'adjust',
        message: `Reading is ${absoluteDelta.toFixed(activeLabMission.decimals)} ${
          activeLabMission.unit
        } too ${direction}. Adjust the bench and check again.`,
      });
      return;
    }

    if (activeLab.id === 'lab-bjt' && (bjtCutoff || bjtSaturated)) {
      setLabMissionFeedback({
        kind: 'adjust',
        message: bjtCutoff
          ? 'The current target is close, but the transistor is in cutoff. Restore base drive and check again.'
          : 'The current target is close, but VCE has collapsed into saturation. Increase headroom and check again.',
      });
      return;
    }

    if (activeLab.id === 'lab-bjt' && bjtJunctionTemperature >= 85) {
      setLabMissionFeedback({
        kind: 'adjust',
        message:
          'The current target is close, but junction temperature is above the 85 °C calibration limit. Reduce device power and check again.',
      });
      return;
    }

    const wasAlreadyComplete = completedLabMissionIds.includes(
      activeLabMission.id,
    );
    if (!wasAlreadyComplete) {
      setCompletedLabMissionIds((missionIds) => [
        ...missionIds,
        activeLabMission.id,
      ]);
      setEarnedXp((xp) => xp + activeLabMission.xp);
      recordDailyActivity({
        focusMinutes: 3,
        labMissions: 1,
        xp: activeLabMission.xp,
      });

      if (soundEnabled) {
        playFeedbackTone('correct');
      }
    }

    const completedMissionIds = new Set(completedLabMissionIds);
    completedMissionIds.add(activeLabMission.id);
    if (
      activeLabMissions.every((mission) =>
        completedMissionIds.has(mission.id),
      )
    ) {
      markStudyListResourceComplete('Lab', activeLab.id);
    }

    setLabMissionFeedback({
      kind: 'success',
      message: wasAlreadyComplete
        ? 'Calibration still holds inside the required tolerance.'
        : `Target locked. +${activeLabMission.xp} XP added to your progress.`,
    });
  }

  function handleSolveLabFault(faultCaseId: string) {
    const faultCase = LAB_FAULT_CASES.find(
      (candidate) =>
        candidate.id === faultCaseId && candidate.labId === activeLab.id,
    );

    if (!faultCase) {
      return;
    }

    if (completedFaultCaseIds.includes(faultCase.id)) {
      showToast(`${faultCase.title} replayed. No duplicate XP was added.`);
      return;
    }

    setCompletedFaultCaseIds((faultCaseIds) => [
      ...faultCaseIds,
      faultCase.id,
    ]);
    setEarnedXp((xp) => xp + faultCase.xp);
    recordDailyActivity({
      focusMinutes: 4,
      labMissions: 1,
      xp: faultCase.xp,
    });

    if (soundEnabled) {
      playFeedbackTone('correct');
    }

    showToast(`${faultCase.title} diagnosed. +${faultCase.xp} XP added.`);
  }

  function handleSaveLab() {
    const savedLabState: SavedLabState = {
      activeLabId,
      values: labValues,
    };
    const savedAt = Date.now();
    const run: LabRunSnapshot = {
      id: `${activeLabId}-${savedAt}-${Math.random().toString(36).slice(2, 8)}`,
      labId: activeLabId,
      output: formatLabRunOutput(activeLabId, labValues),
      savedAt,
      values: { ...labValues },
    };

    try {
      window.localStorage.setItem(SAVED_LAB_STORAGE_KEY, JSON.stringify(savedLabState));
      setLabRunHistory((runs) => {
        const activeLabRuns = runs
          .filter((savedRun) => savedRun.labId === activeLabId)
          .slice(0, 7);
        const otherLabRuns = runs.filter(
          (savedRun) => savedRun.labId !== activeLabId,
        );

        return [run, ...activeLabRuns, ...otherLabRuns]
          .sort((first, second) => second.savedAt - first.savedAt)
          .slice(0, 24);
      });
      setLabSaveCount((count) => count + 1);
      showToast(`${activeLab.title} saved to your Bench Log.`);
    } catch {
      showToast('This browser could not save the lab values.');
    }
  }

  function handleRestoreLabRun(run: LabRunSnapshot) {
    const restoredLab =
      labScenarios.find((lab) => lab.id === run.labId) ?? activeLab;
    const values = normalizeLabValues(run.values);

    setActiveLabId(restoredLab.id);
    setLabValues(values);
    setActiveLabMissionId(
      getNextLabMissionId(restoredLab.id, completedLabMissionIds),
    );
    setLabMissionFeedback(null);

    try {
      window.localStorage.setItem(
        SAVED_LAB_STORAGE_KEY,
        JSON.stringify({
          activeLabId: restoredLab.id,
          values,
        } satisfies SavedLabState),
      );
    } catch {
      // The restored setup remains active for this session.
    }

    showToast(`${restoredLab.title} restored from the Bench Log.`);
  }

  function handleOpenNotebookLabRun(run: LabRunSnapshot) {
    handleRestoreLabRun(run);
    setActiveSection('labs');
    setActivePage('lab');
    setOverlay(null);
  }

  function handleDeleteLabRun(runId: string) {
    const deletedRun = labRunHistory.find((run) => run.id === runId);

    if (!deletedRun) {
      return;
    }

    setLabRunHistory((runs) => runs.filter((run) => run.id !== runId));
    showToast('Saved lab run deleted.', {
      label: 'Undo',
      run: () => {
        setLabRunHistory((runs) => {
          if (runs.some((run) => run.id === deletedRun.id)) {
            return runs;
          }

          return [deletedRun, ...runs]
            .sort((first, second) => second.savedAt - first.savedAt)
            .slice(0, 24);
        });
        showToast('Saved lab run restored.');
      },
    });
  }

  function handleOpenRecentLearning(item: RecentLearningItem) {
    applyAppRoute(parseAppHash(item.routeHash));
    showToast(`${item.title} resumed.`);
  }

  function handleClearRecentLearning() {
    const clearedItems = recentLearningItems;
    setRecentLearningItems([]);
    showToast('Recent learning history cleared.', {
      label: 'Undo',
      run: () => {
        setRecentLearningItems(clearedItems);
        showToast('Recent learning history restored.');
      },
    });
  }

  function handleSearchKeyDown(
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === 'Escape') {
      event.preventDefault();
      setQuery('');
      setSearchKindFilter('All');
      setSearchOpen(false);
      setSearchActiveIndex(-1);
      event.currentTarget.blur();
      return;
    }

    if (visibleSearchResults.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSearchActiveIndex((currentIndex) =>
        currentIndex >= visibleSearchResults.length - 1
          ? 0
          : currentIndex + 1,
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSearchActiveIndex((currentIndex) =>
        currentIndex <= 0
          ? visibleSearchResults.length - 1
          : currentIndex - 1,
      );
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearchResultSelect(
        visibleSearchResults[searchActiveIndex >= 0 ? searchActiveIndex : 0],
      );
    }
  }

  function handleSearchResultSelect(result: SearchResult) {
    const fieldNote =
      result.kind === 'Note'
        ? fieldNotes.find((note) => note.id === result.id) ?? null
        : null;
    const benchRun =
      result.kind === 'Bench Run'
        ? labRunHistory.find((run) => run.id === result.id) ?? null
        : null;

    if (result.kind === 'Note' && !fieldNote) {
      showToast('That Field Journal note is no longer available.');
      return;
    }

    if (result.kind === 'Bench Run' && !benchRun) {
      showToast('That saved Bench Run is no longer available.');
      return;
    }

    if (!result.transient) {
      setRecentSearchResults((currentResults) =>
        [
          result,
          ...currentResults.filter(
            (currentResult) =>
              currentResult.id !== result.id ||
              currentResult.kind !== result.kind,
          ),
        ].slice(0, RECENT_SEARCH_LIMIT),
      );
    }
    setQuery('');
    setSearchKindFilter('All');
    setSearchOpen(false);
    setSearchActiveIndex(-1);
    setOverlay(null);

    if (result.routeHash) {
      applyAppRoute(parseAppHash(result.routeHash));
      showToast(`${result.title} resumed.`);
      return;
    }

    if (fieldNote) {
      setFocusedFieldNoteId(fieldNote.id);
      setNotebookFilter('all');
      setNotebookQuery('');
      setNotebookLibraryView('notes');
      setActiveSection('notebook');
      setActivePage('overview');
      showToast(`${fieldNote.title} opened in your Field Journal.`);
      return;
    }

    if (benchRun) {
      handleOpenNotebookLabRun(benchRun);
      return;
    }

    if (result.kind === 'Section') {
      handleSectionChange(result.id as AppSection);
      showToast(`${result.title} opened.`);
      return;
    }

    if (result.kind === 'Tool') {
      switch (result.id) {
        case 'focus-room':
          handleOpenFocusRoom();
          return;
        case 'study-route':
          handleOpenStudyRoute();
          return;
        case 'study-list':
          setFocusedFieldNoteId(null);
          setNotebookLibraryView('study-list');
          setActiveSection('notebook');
          setActivePage('overview');
          showToast('Study List opened.');
          return;
        case 'review-plan':
          handleOpenReviewPlan();
          return;
        case 'mistake-lab':
          handleOpenMistakeLab();
          return;
        case 'checkpoint-exam':
          handleOpenCheckpointExam();
          return;
        case 'skill-map':
          handleOpenSkillMap();
          return;
        case 'weekly-plan':
          handleOpenWeeklyPlan();
          return;
        case 'progress':
          setActiveSection('learn');
          handleOpenProgress();
          return;
        case 'insights':
          setActiveSection('learn');
          handleOpenInsights();
          return;
        case 'toolkit':
          setOverlay('toolkit');
          return;
        case 'circuit-workbench':
          handleOpenCircuitWorkbench();
          return;
        case 'saved-practice':
          handlePracticeModeChange('saved');
          return;
        case 'power-sprint':
          handleStartSprint();
          return;
        default:
          return;
      }
    }

    if (result.kind === 'Skill') {
      const skill = skillNodes.find((item) => item.id === result.id);
      if (skill) {
        handleSkillSelect(skill);
      }
      return;
    }

    if (result.kind === 'Concept') {
      handleAtlasConceptSelect(result.id);
      return;
    }

    if (result.kind === 'Game') {
      handleAtlasGameSelect(result.id);
      return;
    }

    if (result.kind === 'Lab') {
      handleLabSelect(result.id);
      return;
    }

    if (result.kind === 'Career') {
      handleCareerSelect(result.id);
      return;
    }

    if (result.kind === 'Formula') {
      const formulaEntry = FORMULA_LIBRARY.find(
        (entry) => entry.id === result.id,
      );
      setFocusedFieldNoteId(null);
      setNotebookFilter('all');
      setNotebookQuery(formulaEntry?.title ?? '');
      setNotebookLibraryView('formulas');
      setActiveSection('notebook');
      setActivePage('overview');
      showToast(`${formulaEntry?.title ?? 'Formula'} opened in your notebook.`);
      return;
    }

    const questionIndex = lessonQuestions.findIndex((question) => question.id === result.id);
    if (questionIndex >= 0) {
      const question = lessonQuestions[questionIndex];
      const skillId = BANK_TOPIC_SKILL_IDS[question.topic] ?? skillNodes[0].id;
      setSprintState(null);
      setPracticeMode('path');
      setActiveBankDiagnosticId(null);
      setActiveSkillId(skillId);
      setCurrentQuestionIndex(questionIndex);
      setSelectedOption(null);
      setActiveSection('practice');
      setActivePage('lesson');
      showToast(`${question.topic} opened in Practice.`);
    }
  }

  function handleStartBankDiagnostic(collectionId: BankCollectionId) {
    const collection =
      BANK_COLLECTIONS.find((candidate) => candidate.id === collectionId) ??
      BANK_COLLECTIONS[0];
    const questionIndices = collection.topics
      .map((topic) =>
        lessonQuestions.findIndex((question) => question.topic === topic),
      )
      .filter((questionIndex) => questionIndex >= 0)
      .sort((leftIndex, rightIndex) => {
        const leftRecord = questionMastery[lessonQuestions[leftIndex].id];
        const rightRecord = questionMastery[lessonQuestions[rightIndex].id];
        const statePriority: Record<BankTopicState, number> = {
          review: 0,
          new: 1,
          practiced: 2,
          mastered: 3,
        };

        return (
          statePriority[getBankTopicState(leftRecord)] -
            statePriority[getBankTopicState(rightRecord)] ||
          (leftRecord?.attempts ?? 0) - (rightRecord?.attempts ?? 0)
        );
      });
    const skill =
      skillNodes.find((candidate) => candidate.id === collection.skillId) ??
      skillNodes[0];

    launchSprint(
      skill,
      questionIndices,
      {
        diagnosticId: collection.id,
        label: `${collection.label} Diagnostic`,
        message: `${collection.label} diagnostic started with ${questionIndices.length} domain checks.`,
        source: 'diagnostic',
      },
    );
  }

  function handlePreviewBank() {
    setSprintState(null);
    setActiveBankDiagnosticId(null);
    setActiveSkillId(BANK_TOPIC_SKILL_IDS[lessonQuestions[0].topic] ?? skillNodes[0].id);
    setPracticeMode('path');
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setActiveSection('practice');
    setActivePage('lesson');
    showToast('A verified question-bank sample is open in Practice.');
  }

  function handleOpenTopicSample(topic: string) {
    const questionIndex = lessonQuestions.findIndex((question) => question.topic === topic);

    if (questionIndex < 0) {
      showToast(`No app sample is available for ${topic} yet.`);
      return;
    }

    const skillId = BANK_TOPIC_SKILL_IDS[topic] ?? skillNodes[0].id;
    setSprintState(null);
    setActiveBankDiagnosticId(null);
    setActiveSkillId(skillId);
    setCurrentQuestionIndex(questionIndex);
    setSelectedOption(null);
    setPracticeMode('path');
    setActiveSection('practice');
    setActivePage('lesson');
    showToast(`${topic} opened from the verified question bank.`);
  }

  function handleAnswer(optionIndex: number) {
    if (selectedOption !== null) {
      return;
    }

    if (practiceWithHearts && heartsRemaining === 0) {
      setToast(null);
      setOverlay('hearts');
      return;
    }

    const submittedConfidence = answerConfidence ?? 'unsure';
    setAnswerConfidence(submittedConfidence);
    setSelectedOption(optionIndex);
    const answeredAt = Date.now();
    const answerResult: QuestionResult =
      optionIndex === currentQuestion.correctIndex ? 'correct' : 'wrong';
    setReviewClock(answeredAt);
    recordDailyActivity({
      focusMinutes: 1,
      questions: 1,
      xp: answerResult === 'correct' ? currentQuestion.xp : 0,
    });
    setQuestionMastery((mastery) => {
      const previousRecord = mastery[currentQuestion.id];

      return {
        ...mastery,
        [currentQuestion.id]: getUpdatedQuestionMastery(
          previousRecord,
          answerResult,
          answeredAt,
          submittedConfidence,
        ),
      };
    });
    if (isSprintActive) {
      setSprintState((session) => {
        if (
          !session ||
          session.completedAt !== null ||
          session.results.some((result) => result.questionId === currentQuestion.id)
        ) {
          return session;
        }

        return {
          ...session,
          answerConfidence: submittedConfidence,
          earnedXp:
            session.earnedXp +
            (answerResult === 'correct' ? currentQuestion.xp : 0),
          results: [
            ...session.results,
            {
              questionId: currentQuestion.id,
              result: answerResult,
            },
          ],
          selectedOption: optionIndex,
        };
      });
    }

    if (soundEnabled) {
      playFeedbackTone(answerResult);
    }

    if (optionIndex === currentQuestion.correctIndex) {
      const nextSkillProgress = Math.min(
        100,
        (skillProgress[activeSkill.id] ?? activeSkill.progress) + 4,
      );
      setEarnedXp((xp) => xp + currentQuestion.xp);
      setSkillProgress((progress) => ({
        ...progress,
        [activeSkill.id]: Math.min(
          100,
          (progress[activeSkill.id] ?? activeSkill.progress) + 4,
        ),
      }));
      markStudyListResourceComplete('Question', currentQuestion.id);
      if (nextSkillProgress >= 100) {
        markStudyListResourceComplete('Skill', activeSkill.id);
      }
      return;
    }

    if (practiceWithHearts) {
      const nextHearts = Math.max(0, heartsRemaining - 1);
      const now = Date.now();
      setHeartClock(now);
      setHeartState({
        hearts: nextHearts,
        nextHeartAt: nextHeartAt ?? now + HEART_RECHARGE_MS,
      });

      if (nextHearts === 0) {
        setToast(null);
        setOverlay('hearts');
        return;
      }

      return;
    }
  }

  function handleNextPrompt() {
    const canOpenSprintSummary =
      isSprintActive &&
      sprintState !== null &&
      sprintState.results.length >= sprintState.questionIndices.length;

    if (practiceWithHearts && heartsRemaining === 0 && !canOpenSprintSummary) {
      setToast(null);
      setOverlay('hearts');
      return;
    }

    if (isSprintActive && sprintState) {
      const hasCurrentResult = sprintState.results.some(
        (result) => result.questionId === currentQuestion.id,
      );
      const nextSession = hasCurrentResult
        ? sprintState
        : {
            ...sprintState,
            results: [
              ...sprintState.results,
              {
                questionId: currentQuestion.id,
                result: 'skipped' as const,
              },
            ],
          };

      if (!hasCurrentResult) {
        const answeredAt = Date.now();
        setReviewClock(answeredAt);
        recordDailyActivity({
          focusMinutes: 1,
          questions: 1,
        });
        setQuestionMastery((mastery) => {
          const previousRecord = mastery[currentQuestion.id];

          return {
            ...mastery,
            [currentQuestion.id]: getUpdatedQuestionMastery(
              previousRecord,
              'wrong',
              answeredAt,
            ),
          };
        });
      }

      if (nextSession.results.length >= nextSession.questionIndices.length) {
        const completedAt = Date.now();
        const correct = nextSession.results.filter(
          (result) => result.result === 'correct',
        ).length;
        const diagnosticBonus =
          activeBankDiagnosticId !== null &&
          !completedBankDiagnosticIds.includes(activeBankDiagnosticId)
            ? BANK_DIAGNOSTIC_BONUS_XP
            : 0;
        const completedSession = {
          ...nextSession,
          completedAt,
          earnedXp: nextSession.earnedXp + diagnosticBonus,
        };

        if (activeBankDiagnosticId !== null) {
          if (diagnosticBonus > 0) {
            setCompletedBankDiagnosticIds((diagnosticIds) => [
              ...diagnosticIds,
              activeBankDiagnosticId,
            ]);
            setEarnedXp((xp) => xp + diagnosticBonus);
          }

          setActiveBankDiagnosticId(null);
        }

        recordDailyActivity({
          diagnostics: activeBankDiagnosticId === null ? 0 : 1,
          focusMinutes: 2,
          sprints: activeBankDiagnosticId === null ? 1 : 0,
          xp: diagnosticBonus,
        });
        if (nextSession.source === 'custom') {
          setCustomSessionCompletions((count) => count + 1);
        }
        if (nextSession.source === 'recovery') {
          setMistakeRecoveryCompletions((count) => count + 1);
        }
        setSprintState(completedSession);
        setLastSprintSummary({
          completedAt,
          correct,
          earnedXp: completedSession.earnedXp,
          source: completedSession.source,
          total: completedSession.questionIndices.length,
        });
        setSelectedOption(null);
        setActivePage('sprint-summary');
        return;
      }

      const nextPosition = Math.min(
        nextSession.position + 1,
        nextSession.questionIndices.length - 1,
      );
      setSprintState({
        ...nextSession,
        answerConfidence: null,
        paused: false,
        position: nextPosition,
        selectedOption: null,
      });
      setCurrentQuestionIndex(nextSession.questionIndices[nextPosition]);
      setSelectedOption(null);
      return;
    }

    if (selectedOption === null) {
      recordDailyActivity({
        focusMinutes: 1,
        questions: 1,
      });
    }

    const questionIndices = getPracticeQuestionIndices(
      practiceMode,
      bookmarkedQuestionIds,
      questionMastery,
    );

    if (questionIndices.length === 0) {
      setPracticeMode('path');
      setCurrentQuestionIndex((index) => (index + 1) % lessonQuestions.length);
      setSelectedOption(null);
      showToast(
        practiceMode === 'review'
          ? 'Review queue cleared. Returning to your path.'
          : 'Saved set finished. Returning to your path.',
      );
      return;
    }

    const poolPosition = questionIndices.indexOf(currentQuestionIndex);
    const step = practiceMode === 'mixed' ? 7 : 1;
    const nextPoolPosition =
      poolPosition < 0 ? 0 : (poolPosition + step) % questionIndices.length;
    setCurrentQuestionIndex(questionIndices[nextPoolPosition]);
    setSelectedOption(null);
  }

  async function handleEnableAppLock(
    pin: string,
    timeoutMinutes: number,
    lockOnHidden: boolean,
  ) {
    try {
      const config = await createLocalAppLockConfig(
        pin,
        timeoutMinutes,
        lockOnHidden,
      );
      saveLocalAppLockConfig(config);
      markLocalAppLockActivity();
      setAppLockConfig(config);
      setIsAppLocked(false);
      broadcastLocalAppLock();
      return {
        message:
          'Device lock enabled with protected retries. Only the salted verifier was stored.',
        ok: true,
      };
    } catch {
      return {
        message: 'The device lock could not be enabled in this browser.',
        ok: false,
      };
    }
  }

  async function handleChangeAppLockPin(currentPin: string, nextPin: string) {
    if (!appLockConfig) {
      return { message: 'The device lock is not enabled.', ok: false };
    }

    const verification = await verifyLocalAppLockPinWithProtection(
      currentPin,
      appLockConfig,
    );
    if (!verification.ok) {
      return {
        message: formatAppLockVerificationFailure(verification),
        ok: false,
      };
    }

    try {
      const nextConfig = await createLocalAppLockConfig(
        nextPin,
        appLockConfig.timeoutMinutes,
        appLockConfig.lockOnHidden,
      );
      saveLocalAppLockConfig(nextConfig);
      markLocalAppLockActivity();
      setAppLockConfig(nextConfig);
      broadcastLocalAppLock();
      return { message: 'Device PIN updated.', ok: true };
    } catch {
      return { message: 'The new PIN could not be stored.', ok: false };
    }
  }

  async function handleDisableAppLock(currentPin: string) {
    if (!appLockConfig) {
      return { message: 'The device lock is already off.', ok: true };
    }

    const verification = await verifyLocalAppLockPinWithProtection(
      currentPin,
      appLockConfig,
    );
    if (!verification.ok) {
      return {
        message: formatAppLockVerificationFailure(verification),
        ok: false,
      };
    }

    try {
      removeLocalAppLockConfig();
      setAppLockConfig(null);
      setIsAppLocked(false);
      return { message: 'Device lock removed.', ok: true };
    } catch {
      return { message: 'The device lock could not be removed.', ok: false };
    }
  }

  function handleAppLockTimeoutChange(timeoutMinutes: number) {
    if (!appLockConfig) {
      return;
    }

    const nextConfig = { ...appLockConfig, timeoutMinutes };
    try {
      saveLocalAppLockConfig(nextConfig);
      markLocalAppLockActivity();
      setAppLockConfig(nextConfig);
    } catch {
      showToast('Auto-lock timing could not be saved in this browser.');
    }
  }

  function handleAppLockHiddenChange(lockOnHidden: boolean) {
    if (!appLockConfig) {
      return;
    }

    const nextConfig = { ...appLockConfig, lockOnHidden };
    try {
      saveLocalAppLockConfig(nextConfig);
      markLocalAppLockActivity();
      setAppLockConfig(nextConfig);
    } catch {
      showToast('Background-lock preference could not be saved.');
    }
  }

  function handleLockAppNow() {
    if (!appLockConfig) {
      return;
    }

    clearLocalAppLockActivity();
    broadcastLocalAppLock();
    setOverlay(null);
    setIsAppLocked(true);
  }

  async function handleUnlockApp(pin: string) {
    if (!appLockConfig) {
      setIsAppLocked(false);
      return {
        attemptsRemaining: 5,
        blockedUntil: 0,
        failedAttempts: 0,
        ok: true,
      };
    }

    const verification = await verifyLocalAppLockPinWithProtection(
      pin,
      appLockConfig,
    );
    if (verification.ok) {
      markLocalAppLockActivity();
      setIsAppLocked(false);
    }
    return verification;
  }

  function handleAuthModeChange(mode: AuthMode) {
    setAuthMode(mode);
    setAuthNotice('');

    if (mode === 'reset') {
      setAuthPassword('');
    }
  }

  function handleOpenAuth(mode: AuthMode) {
    handleAuthModeChange(mode);
    if (mode === 'create') {
      setRememberSession(true);
    }
    setEntryView('auth');
  }

  function handleBackToIntro() {
    setEntryView('intro');
    setAuthMode('login');
    setAuthNotice('');
  }

  function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (authMode === 'reset') {
      const destination = authEmail.trim() || 'your email';
      setAuthNotice(`Password reset link sent to ${destination}.`);
      setAuthMode('login');
      setAuthPassword('');
      return;
    }

    const normalizedEmail = authEmail.trim().slice(0, 120);
    if (authMode === 'create') {
      setLearnerProfile({
        displayName: authName.trim().slice(0, 60) || 'Zylo Learner',
        email: normalizedEmail,
      });
    } else if (normalizedEmail) {
      setLearnerProfile((profile) => ({
        ...profile,
        email: normalizedEmail,
      }));
    }

    setIsAuthenticated(true);
    showToast(
      authMode === 'create'
        ? 'Account created. Welcome to ZyloXP.'
        : 'Welcome back. Your path is ready.',
    );
  }

  function handleSocialAuth(provider: SocialProvider) {
    setIsAuthenticated(true);
    showToast(`Signed in with ${provider}. Your path is ready.`);
  }

  function handleSignOut() {
    clearLocalAppLockActivity();
    setIsAppLocked(Boolean(appLockConfig));
    setIsAuthenticated(false);
    setEntryView('auth');
    setAuthMode('login');
    setFocusViewEnabled(false);
    setOverlay(null);
    setAuthPassword('');
    setToast(null);
  }

  if (!isAuthenticated) {
    if (entryView === 'intro') {
      return (
        <GetStartedScreen
          onCreateAccount={() => handleOpenAuth('create')}
          onSignIn={() => handleOpenAuth('login')}
        />
      );
    }

    return (
      <AuthScreen
        email={authEmail}
        mode={authMode}
        name={authName}
        notice={authNotice}
        onEmailChange={setAuthEmail}
        onBackToIntro={handleBackToIntro}
        onModeChange={handleAuthModeChange}
        onNameChange={setAuthName}
        onPasswordChange={setAuthPassword}
        onRememberSessionChange={setRememberSession}
        onSocialAuth={handleSocialAuth}
        onSubmit={handleAuthSubmit}
        password={authPassword}
        rememberSession={rememberSession}
      />
    );
  }

  if (isAppLocked && appLockConfig) {
    return (
      <LocalAppLockScreen
        onSignOut={handleSignOut}
        onUnlock={handleUnlockApp}
      />
    );
  }

  const mobileNavigationItems = navigation.filter(
    (item) =>
      item.id === 'learn' ||
      item.id === 'practice' ||
      item.id === 'labs' ||
      item.id === 'careers',
  );
  const mobileMoreActive =
    activeSection === 'atlas' ||
    activeSection === 'bank' ||
    activeSection === 'notebook' ||
    activePage === 'progress' ||
    activePage === 'insights';
  const recommendedAction =
    isSprintActive && sprintState
      ? {
          buttonLabel: 'Resume session',
          description: 'Finish the active run while its question pattern is still fresh.',
          eyebrow: 'In progress',
          icon: Zap,
          run: handleStartLesson,
          signal: `${sprintAnswered}/${sprintTarget}`,
          signalLabel: 'answered',
          title: sprintState.label,
          tone: 'active',
        }
      : focusSession && focusSession.endedAt === null
        ? {
            buttonLabel:
              focusSession.pausedAt === null ? 'Return to focus' : 'Resume focus',
            description:
              focusSession.pausedAt === null
                ? 'Your protected study block is still running.'
                : 'Your focus objective is paused and ready when you are.',
            eyebrow: focusSession.pausedAt === null ? 'Focus active' : 'Focus paused',
            icon: focusSession.pausedAt === null ? Clock3 : Pause,
            run: handleOpenFocusRoom,
            signal: formatFocusTimer(focusRemainingMs),
            signalLabel: 'remaining',
            title: focusSession.objectiveTitle,
            tone: 'focus',
          }
        : checkpointExam && checkpointExam.completedAt === null
          ? {
              buttonLabel: 'Resume checkpoint',
              description:
                'Close the open checkpoint before starting another study thread.',
              eyebrow: 'Continue',
              icon: ShieldCheck,
              run: handleOpenCheckpointExam,
              signal: `${checkpointAnsweredCount}/${checkpointExam.questionIds.length}`,
              signalLabel: 'answered',
              title: 'Finish your checkpoint',
              tone: 'checkpoint',
            }
          : studyRoute && studyRoute.completedAt === null
            ? {
                buttonLabel: 'Resume route',
                description:
                  'Continue the focused sequence you already planned for this session.',
                eyebrow: 'Continue',
                icon: Route,
                run: handleOpenStudyRoute,
                signal: `${studyRoute.completedStepIds.length}/${studyRoute.steps.length}`,
                signalLabel: 'steps',
                title: 'Move your Study Route forward',
                tone: 'route',
              }
            : reviewQuestionIds.length > 0
              ? {
                  buttonLabel: 'Open review',
                  description:
                    'Scheduled retrieval is the strongest next move for durable recall.',
                  eyebrow: 'Due now',
                  icon: RotateCcw,
                  run: handleOpenReviewPlan,
                  signal: `${reviewQuestionIds.length}`,
                  signalLabel:
                    reviewQuestionIds.length === 1 ? 'review' : 'reviews',
                  title: 'Clear your review queue',
                  tone: 'review',
                }
              : {
                  buttonLabel: 'Practice skill',
                  description:
                    'Your lowest active mastery signal is ready for a short practice set.',
                  eyebrow: 'Adaptive focus',
                  icon: BrainCircuit,
                  run: handleStartAdaptivePractice,
                  signal: `${Math.round(adaptiveSkillProgress)}%`,
                  signalLabel: 'mastery',
                  title: `Strengthen ${adaptiveSkill.title}`,
                  tone: 'adaptive',
                };
  const RecommendedActionIcon = recommendedAction.icon;
  const overviewPrimaryAction =
    activeSection === 'labs'
      ? {
          label: 'Open Lab',
          run: () => handleLabSelect(activeLab.id),
        }
        : activeSection === 'careers'
        ? {
            label: 'Open Path',
            run: () => handleCareerSelect(tunedCareer.role),
          }
        : activeSection === 'atlas'
          ? {
              label: 'Play a Game',
              run: () => handleAtlasGameSelect(engineeringGames[0].id),
            }
        : activeSection === 'bank'
          ? {
              label: 'Start Diagnostic',
              run: () => handleStartBankDiagnostic(BANK_COLLECTIONS[0].id),
            }
          : activeSection === 'notebook'
            ? {
                label: 'New Note',
                run: () =>
                  handleOpenFieldJournal({
                    category: 'idea',
                    title: 'New engineering note',
                  }),
              }
            : activeSection === 'practice'
              ? reviewQuestionIds.length > 0
                ? {
                    label: 'Start Review',
                    run: handleStartSmartReview,
                  }
                : {
                    label: 'Practice Skill',
                    run: handleStartAdaptivePractice,
                  }
              : {
                  label: recommendedAction.buttonLabel,
                  run: recommendedAction.run,
                };
  const detailPrimaryAction: {
    complete?: boolean;
    disabled?: boolean;
    label: string;
    run: () => void;
  } | null = (() => {
    switch (activePage) {
      case 'lesson':
        return {
          complete: true,
          disabled: true,
          label: 'Lesson Active',
          run: handleStartLesson,
        };
      case 'review-plan':
        return {
          disabled: reviewPlanQuestionIndices.length === 0,
          label:
            reviewPlanQuestionIndices.length === 0
              ? 'Review Clear'
              : 'Start Review',
          run: handleStartSmartReview,
        };
      case 'mistake-lab':
        return {
          disabled: activeMistakeItems.length === 0,
          label:
            activeMistakeItems.length === 0
              ? 'Queue Clear'
              : 'Start Recovery',
          run: handleStartMistakeRecovery,
        };
      case 'skill-map':
        return {
          disabled: activeSkillMapNode.status === 'Locked',
          label:
            activeSkillMapNode.status === 'Locked'
              ? 'Skill Locked'
              : 'Practice Skill',
          run: () => handleSkillMapPractice(activeSkillMapNode.id),
        };
      case 'lab':
        return {
          label: 'Practice Topic',
          run: handleStartLabPractice,
        };
      case 'workbench':
        return {
          label: 'Open Lab',
          run: () => handleLabSelect(activeLab.id),
        };
      case 'career':
        return {
          label: 'Start Career Sprint',
          run: handleStartCareerSprint,
        };
      case 'career-project':
        return activeCareerProjectRecord?.completedAt
          ? {
              label: 'Open Portfolio',
              run: handleOpenPortfolio,
            }
          : {
              label: 'Submit Project',
              run: handleSubmitCareerProject,
            };
      case 'portfolio':
        return portfolioHeadline.trim().length >= 8 &&
          activePortfolioFeaturedIds.length === 3
          ? {
              label: 'Publish Portfolio',
              run: handlePublishPortfolio,
            }
          : null;
      case 'progress':
        return {
          label: 'View Insights',
          run: handleOpenInsights,
        };
      case 'insights':
        return {
          label: 'Open Skill Map',
          run: () => handleOpenInsightSkill(activeSkill.id),
        };
      case 'focus-room':
        return focusSession?.endedAt === null &&
          focusSession.pausedAt !== null
          ? {
              label: 'Resume Focus',
              run: handleResumeFocusSession,
            }
          : null;
      case 'weekly-plan':
        return currentWeeklyPlan &&
          weeklyPlanComplete &&
          currentWeeklyPlan.rewardClaimedAt === null
          ? {
              label: 'Claim Reward',
              run: handleClaimWeeklyPlanReward,
            }
          : null;
      case 'study-route': {
        if (!studyRoute || studyRoute.completedAt !== null) {
          return null;
        }

        const nextStep = studyRoute.steps.find(
          (step) => !studyRoute.completedStepIds.includes(step.id),
        );

        return nextStep
          ? {
              label: 'Open Next Step',
              run: () => handleOpenStudyRouteStep(nextStep),
            }
          : {
              label: 'Finish Route',
              run: handleFinishStudyRoute,
            };
      }
      case 'checkpoint-exam':
        return checkpointExam?.completedAt
          ? {
              label: 'Review Mistakes',
              run: handleOpenCheckpointMistakes,
            }
          : null;
      case 'sprint-summary':
        return {
          label: 'Try Again',
          run: handleRestartSprint,
        };
      case 'concept':
      case 'game':
      case 'overview':
        return null;
    }
  })();
  const topbarPrimaryAction: {
    complete?: boolean;
    disabled?: boolean;
    label: string;
    run: () => void;
  } | null =
    isSprintActive && activePage !== 'lesson'
      ? {
          label: 'Resume Session',
          run: handleStartLesson,
        }
      : activePage === 'overview'
        ? overviewPrimaryAction
        : detailPrimaryAction;

  return (
    <ZyTutorLaunchContext.Provider value={handleOpenTutor}>
      <div
        className="appShell"
        data-contrast={highContrastEnabled ? 'strong' : 'soft'}
        data-focus-view={focusViewActive ? 'active' : 'inactive'}
        data-motion={reducedMotionEnabled ? 'reduced' : 'full'}
        data-section={activeSection}
      >
      <a
        className="skipLink"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          const mainContent =
            event.currentTarget.ownerDocument.getElementById('main-content');
          window.setTimeout(() => {
            mainContent?.focus();
          }, 0);
        }}
      >
        Skip to main content
      </a>
      <span aria-atomic="true" aria-live="polite" className="srOnly" role="status">
        {activeViewLabel} loaded
      </span>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brandLockup">
          <div className="brandMark">
            <BatteryCharging size={20} strokeWidth={2.4} />
          </div>
          <div>
            <strong>ZyloXP</strong>
            <span>Tech career academy</span>
          </div>
        </div>

        <nav className="navList">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              activePage !== 'progress' &&
              activePage !== 'insights' &&
              activeSection === item.id;

            return (
              <button
                aria-current={isActive ? 'page' : undefined}
                className={`navButton ${isActive ? 'active' : ''}`}
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                onFocus={() => preloadAppSection(item.id)}
                onPointerEnter={() => preloadAppSection(item.id)}
                title={item.label}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          aria-label={`Open ${learnerDisplayName} profile and progress`}
          aria-current={
            activePage === 'progress' || activePage === 'insights'
              ? 'page'
              : undefined
          }
          className={`profilePanel ${
            activePage === 'progress' || activePage === 'insights'
              ? 'active'
              : ''
          }`}
          onClick={handleOpenProgress}
          title="Profile and progress"
          type="button"
        >
          <div className="avatar" aria-hidden="true">
            {learnerInitials}
          </div>
          <div>
            <strong title={learnerDisplayName}>{learnerDisplayName}</strong>
            <span>
              Level {currentLevel}
              {practiceAccuracy === null
                ? ' · Core Foundations'
                : ` · ${practiceAccuracy}% accuracy`}
            </span>
          </div>
        </button>

        <div className="sidebarFooter">
          <button
            className="iconButton ghost"
            onClick={() => setOverlay('help')}
            title="Help"
            type="button"
          >
            <CircleHelp size={18} />
          </button>
          <button
            className="iconButton ghost"
            onClick={() => setOverlay('settings')}
            title="Settings"
            type="button"
          >
            <Settings size={18} />
          </button>
        </div>
      </aside>

      <main
        aria-label={activeViewLabel}
        className="workspace"
        id="main-content"
        ref={mainContentRef}
        tabIndex={-1}
      >
        <header
          className={`topbar ${activePage !== 'overview' ? 'hasContext' : ''}`}
        >
          <button
            className="iconButton mobileOnly"
            onClick={() => setOverlay('menu')}
            title="Open menu"
            type="button"
          >
            <Menu size={20} />
          </button>

          {activePage !== 'overview' && (
            <div className="topbarContext">
              <button
                aria-label={`Back from ${activeViewLabel}`}
                className="iconButton topbarBackButton"
                onClick={handleTopbarBack}
                title="Back"
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={19} />
              </button>
              <span aria-hidden="true" className="topbarContextCopy">
                <small>{SECTION_VIEW_LABELS[activeSection]}</small>
                <strong title={activeViewLabel}>{activeViewLabel}</strong>
              </span>
            </div>
          )}

          <div
            className="searchArea"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setSearchOpen(false);
                setSearchActiveIndex(-1);
              }
            }}
            onFocus={() => setSearchOpen(true)}
          >
            <label className="searchBox">
              <Search size={18} />
              <input
                aria-activedescendant={
                  searchActiveIndex >= 0
                    ? `zylo-search-result-${searchActiveIndex}`
                    : undefined
                }
                aria-autocomplete="list"
                aria-controls="zylo-search-results"
                aria-expanded={searchOpen}
                aria-haspopup="listbox"
                aria-keyshortcuts="Meta+K Control+K /"
                aria-label="Search ZyloXP"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchKindFilter('All');
                  setSearchOpen(true);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search ZyloXP"
                ref={searchInputRef}
                role="combobox"
                type="search"
                value={query}
              />
            </label>

            {searchOpen && (
              <div
                className={`searchResults ${
                  isSearchQueryActive ? '' : 'quick'
                }`.trim()}
              >
                {isSearchQueryActive ? (
                  <>
                    <div className="searchResultsMeta" role="status">
                      <strong>
                        {activeSearchResultCount}{' '}
                        {activeSearchResultCount === 1
                          ? 'match'
                          : 'matches'}
                      </strong>
                      <span>
                        {availableSearchKindFilters.length}{' '}
                        {availableSearchKindFilters.length === 1
                          ? 'result type'
                          : 'result types'}
                      </span>
                    </div>
                    {availableSearchKindFilters.length > 1 && (
                      <div
                        aria-label="Filter search results"
                        className="searchKindFilters"
                        role="toolbar"
                      >
                        {(
                          ['All', ...availableSearchKindFilters] as const
                        ).map((kind) => {
                          const count =
                            kind === 'All'
                              ? rankedSearchResults.length
                              : searchKindCounts[kind];

                          return (
                            <button
                              aria-label={`${kind}, ${count} ${
                                count === 1 ? 'result' : 'results'
                              }`}
                              aria-pressed={searchKindFilter === kind}
                              key={kind}
                              onClick={() => {
                                setSearchKindFilter(kind);
                                setSearchActiveIndex(-1);
                                searchInputRef.current?.focus();
                              }}
                              type="button"
                            >
                              {kind}
                              <span aria-hidden="true">{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="searchResultsMeta" role="presentation">
                    <strong>Quick access</strong>
                    <span>{quickSearchSummary}</span>
                  </div>
                )}
                <div
                  aria-label={
                    isSearchQueryActive
                      ? 'Search results'
                      : 'Quick access results'
                  }
                  className="searchResultList"
                  id="zylo-search-results"
                  role="listbox"
                >
                  {visibleSearchResults.length > 0 ? (
                    visibleSearchResults.map((result, resultIndex) => (
                      <button
                        aria-selected={searchActiveIndex === resultIndex}
                        className={
                          searchActiveIndex === resultIndex ? 'active' : ''
                        }
                        data-kind={result.kind.toLowerCase()}
                        id={`zylo-search-result-${resultIndex}`}
                        key={`${result.kind}-${result.id}`}
                        onFocus={() => {
                          setSearchActiveIndex(resultIndex);
                          preloadSearchResult(result);
                        }}
                        onMouseEnter={() => {
                          setSearchActiveIndex(resultIndex);
                          preloadSearchResult(result);
                        }}
                        onClick={() => handleSearchResultSelect(result)}
                        role="option"
                        type="button"
                      >
                        <span>{result.kind}</span>
                        <strong>{result.title}</strong>
                        <small>{result.subtitle}</small>
                      </button>
                    ))
                  ) : (
                      <div className="searchEmpty">
                        <strong>No matches yet</strong>
                        <span>
                          Try a topic, note, bench run, lab, role, or formula.
                        </span>
                      </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="topbarActions">
            <span
              aria-atomic="true"
              aria-hidden={saveStatus === 'idle' ? true : undefined}
              aria-live={saveStatus === 'idle' ? undefined : 'polite'}
              className={`saveStatusChip ${saveStatus}`}
              role={saveStatus === 'idle' ? undefined : 'status'}
              title={
                saveStatus === 'saving'
                  ? 'Saving progress'
                  : saveStatus === 'saved'
                    ? formatSavedAt(lastSavedAt)
                    : saveStatus === 'error'
                      ? 'Progress could not be saved locally'
                      : undefined
              }
            >
              {saveStatus === 'saving' ? (
                <RefreshCw size={15} />
              ) : saveStatus === 'error' ? (
                <TriangleAlert size={15} />
              ) : (
                <CheckCircle2 size={15} />
              )}
              <span>
                {saveStatus === 'saving'
                  ? 'Saving'
                  : saveStatus === 'error'
                    ? 'Save unavailable'
                    : 'Saved'}
              </span>
            </span>
            {focusSession && (
              <button
                className={`focusSessionChip ${
                  focusSession.endedAt !== null
                    ? 'complete'
                    : focusSession.pausedAt !== null
                      ? 'paused'
                      : ''
                }`}
                onClick={handleOpenFocusRoom}
                aria-label={
                  focusSession.endedAt !== null
                    ? 'Open focus session debrief'
                    : focusSession.pausedAt !== null
                      ? 'Resume paused focus session'
                      : `Open focus session with ${formatFocusTimer(
                          focusRemainingMs,
                        )} remaining`
                }
                type="button"
              >
                {focusSession.endedAt !== null ? (
                  <CheckCircle2 size={17} />
                ) : focusSession.pausedAt !== null ? (
                  <Pause size={17} />
                ) : (
                  <Clock3 size={17} />
                )}
                <span>
                  <small>Focus</small>
                  <strong>
                    {focusSession.endedAt !== null
                      ? 'Debrief'
                      : focusSession.pausedAt !== null
                        ? 'Paused'
                        : formatFocusTimer(focusRemainingMs)}
                  </strong>
                </span>
              </button>
            )}
            <button
              aria-label="Open Engineering Toolkit"
              className="iconButton toolkitLaunchButton"
              onClick={() => setOverlay('toolkit')}
              onFocus={() =>
                void preloadEngineeringToolkit().catch(() => undefined)
              }
              onPointerEnter={() =>
                void preloadEngineeringToolkit().catch(() => undefined)
              }
              title="Engineering Toolkit"
              type="button"
            >
              <Calculator size={19} />
            </button>
            <button
              aria-label="Open Zy Tutor"
              className="iconButton tutorLaunchButton"
              onClick={handleOpenTutor}
              onFocus={() => void preloadZyTutor().catch(() => undefined)}
              onPointerEnter={() =>
                void preloadZyTutor().catch(() => undefined)
              }
              title="Ask Zy"
              type="button"
            >
              <MessageCircleQuestion size={19} />
            </button>
            {focusViewAvailable && (
              <button
                aria-label={
                  focusViewActive ? 'Exit focus view' : 'Enter focus view'
                }
                aria-pressed={focusViewActive}
                className={`iconButton focusViewButton ${
                  focusViewActive ? 'active' : ''
                }`}
                onClick={() => setFocusViewEnabled((enabled) => !enabled)}
                title={focusViewActive ? 'Exit focus view' : 'Focus view'}
                type="button"
              >
                {focusViewActive ? (
                  <Minimize2 size={19} />
                ) : (
                  <Maximize2 size={19} />
                )}
              </button>
            )}
            <button
              className={`heartGroup ${heartsRemaining === 0 ? 'empty' : ''}`}
              onClick={() => setOverlay('hearts')}
              aria-label={`${heartsRemaining} of ${MAX_HEARTS} hearts remaining`}
              type="button"
            >
              <Heart fill={heartsRemaining > 0 ? 'currentColor' : 'none'} size={18} />
              <strong>{heartsRemaining}</strong>
              <span>/ {MAX_HEARTS}</span>
            </button>
            <button
              aria-label={`Open activity${
                activeSessionResults.length > 0
                  ? `, ${activeSessionResults.length} active learning ${
                      activeSessionResults.length === 1 ? 'thread' : 'threads'
                    }`
                  : ''
              }${
                unreadNotificationCount > 0
                  ? `, ${unreadNotificationCount} unread updates`
                  : ''
              }`}
              className={`iconButton notificationButton ${
                activityIndicatorCount > 0 ? 'hasItems' : ''
              }`}
              onClick={() => setOverlay('notifications')}
              title="Activity"
              type="button"
            >
              <Bell size={18} />
              {activityIndicatorCount > 0 && (
                <span
                  aria-hidden="true"
                  className={`notificationBadge ${
                    activityIndicatorIsQueue ? 'queue' : ''
                  }`}
                >
                  {Math.min(9, activityIndicatorCount)}
                </span>
              )}
            </button>
            {topbarPrimaryAction && (
              <button
                className="primaryButton"
                disabled={topbarPrimaryAction.disabled}
                onClick={topbarPrimaryAction.run}
                type="button"
              >
                {topbarPrimaryAction.label}
                {topbarPrimaryAction.complete ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <ArrowRight size={18} />
                )}
              </button>
            )}
          </div>
          <span aria-hidden="true" className="pageScrollProgress">
            <span
              style={{ transform: `scaleX(${scrollProgress / 100})` }}
            />
          </span>
        </header>

        {currentStudyListResource && (
          <section
            aria-label="Current learning item"
            className={`learningContextBar ${
              currentStudyListItem?.completedAt ? 'complete' : ''
            }`}
          >
            <div className="learningContextCopy">
              <span>{currentStudyListResource.kind}</span>
              <div>
                <strong title={currentStudyListResource.title}>
                  {currentStudyListResource.title}
                </strong>
                <small title={currentStudyListResource.subtitle}>
                  {currentStudyListResource.subtitle}
                </small>
              </div>
            </div>
            <div className="learningContextActions">
              <span
                aria-live="polite"
                className="learningContextStatus"
                data-state={
                  currentStudyListItem?.completedAt
                    ? 'complete'
                    : currentStudyListItem
                      ? 'queued'
                      : 'available'
                }
              >
                {currentStudyListItem?.completedAt ? (
                  <CheckCircle2 aria-hidden="true" size={15} />
                ) : currentStudyListItem ? (
                  <BookmarkCheck aria-hidden="true" size={15} />
                ) : (
                  <Bookmark aria-hidden="true" size={15} />
                )}
                <span>
                  {currentStudyListItem?.completedAt
                    ? 'Completed'
                    : currentStudyListQueueIndex >= 0
                      ? `Queued ${currentStudyListQueueIndex + 1} of ${
                          activeStudyListItems.length
                        }`
                      : `${activeStudyListItems.length} queued`}
                </span>
              </span>
              <button
                aria-label={`${
                  currentStudyListItem ? 'Remove' : 'Add'
                } ${currentStudyListResource.title} ${
                  currentStudyListItem ? 'from' : 'to'
                } Study List`}
                aria-pressed={Boolean(currentStudyListItem)}
                className={`secondaryButton learningContextSave ${
                  currentStudyListItem ? 'saved' : ''
                }`}
                onClick={handleToggleCurrentStudyListItem}
                type="button"
              >
                {currentStudyListItem ? (
                  <BookmarkCheck aria-hidden="true" size={16} />
                ) : (
                  <Bookmark aria-hidden="true" size={16} />
                )}
                <span>
                  {currentStudyListItem ? 'Remove' : 'Add to Study List'}
                </span>
              </button>
              {nextStudyListItem && (
                <button
                  aria-label={`Open next queued item: ${nextStudyListItem.title}`}
                  className="iconButton learningContextNext"
                  onClick={() => handleOpenStudyListItem(nextStudyListItem)}
                  title={`Next: ${nextStudyListItem.title}`}
                  type="button"
                >
                  <ArrowRight aria-hidden="true" size={17} />
                </button>
              )}
            </div>
          </section>
        )}

        {!isOnline && (
          <div aria-live="polite" className="connectionBanner" role="status">
            <WifiOff aria-hidden="true" size={18} />
            <div>
              <strong>Offline mode</strong>
              <span>Changes continue saving on this device.</span>
            </div>
          </div>
        )}

        {hasExternalProgressUpdate && (
          <aside
            aria-atomic="true"
            aria-live="assertive"
            className="toast progressSyncToast"
            role="alert"
          >
            <span>
              <strong>Newer progress is ready</strong>
              <small>
                Another ZyloXP tab saved changes. Refresh before continuing.
              </small>
            </span>
            <button
              className="toastAction"
              onClick={() => window.location.reload()}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Refresh
            </button>
          </aside>
        )}

        {toast && !hasExternalProgressUpdate && (
          <aside
            aria-atomic="true"
            aria-live="polite"
            className="toast"
            data-actionable={toast.action ? 'true' : 'false'}
            data-paused={toastAutoDismissPaused ? 'true' : 'false'}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setToastAutoDismissPaused(false);
              }
            }}
            onFocusCapture={() => setToastAutoDismissPaused(true)}
            onPointerEnter={() => setToastAutoDismissPaused(true)}
            onPointerLeave={() => setToastAutoDismissPaused(false)}
            role="status"
          >
            <span>{toast.message}</span>
            <div className="toastActions">
              {toast.action && (
                <button
                  aria-keyshortcuts={
                    toast.action.label === 'Undo'
                      ? 'Control+Z Meta+Z'
                      : undefined
                  }
                  className="toastAction"
                  onClick={() => {
                    const action = toast.action;
                    setToast(null);
                    action?.run();
                  }}
                  title={
                    toast.action.label === 'Undo'
                      ? 'Undo last change'
                      : toast.action.label
                  }
                  type="button"
                >
                  {toast.action.label === 'Undo' ? (
                    <RotateCcw aria-hidden="true" size={15} />
                  ) : toast.action.label === 'Refresh' ? (
                    <RefreshCw aria-hidden="true" size={15} />
                  ) : null}
                  <span>{toast.action.label}</span>
                </button>
              )}
              <button
                aria-label="Dismiss notification"
                className="toastDismiss"
                onClick={() => setToast(null)}
                title="Dismiss"
                type="button"
              >
                <XCircle size={18} />
              </button>
            </div>
          </aside>
        )}

        {showBackToTop &&
          !toast &&
          !hasExternalProgressUpdate &&
          !tutorOpen &&
          overlay === null &&
          saveStatus === 'idle' && (
            <button
              aria-label={`Back to top, ${scrollProgress}% through this page`}
              className="backToTopButton"
              onClick={() =>
                window.scrollTo({
                  behavior: reducedMotionEnabled ? 'auto' : 'smooth',
                  left: 0,
                  top: 0,
                })
              }
              title="Back to top"
              type="button"
            >
              <ArrowUp size={19} />
            </button>
          )}

        <Suspense fallback={<WorkspacePageFallback label={activeViewLabel} />}>
          {activePage === 'concept' ||
          activePage === 'game' ||
          (activePage === 'overview' && activeSection === 'atlas') ? (
            <ElectricalAtlas
              activeId={activeAtlasId}
              onBack={handleBackToAtlas}
              onCompleteConcept={(conceptId) =>
                markStudyListResourceComplete('Concept', conceptId)
              }
              onCompleteGame={(gameId, score) => {
                if (score >= 80) {
                  markStudyListResourceComplete('Game', gameId);
                }
              }}
              onOpenConcept={handleAtlasConceptSelect}
              onOpenGame={handleAtlasGameSelect}
              onOpenLab={handleLabSelect}
              view={
                activePage === 'concept'
                  ? 'concept'
                  : activePage === 'game'
                    ? 'game'
                    : 'overview'
              }
            />
          ) : activePage === 'sprint-summary' && sprintState ? (
            <SprintSummaryPage
              adaptiveSkill={activeSkill}
              onBack={handleBackFromSprintSummary}
              onNewSprint={handleRestartSprint}
              onReviewMisses={handleReviewSprintMistakes}
              onStrengthenSkill={handleStrengthenSprintSkill}
              sprint={sprintState}
            />
          ) : activePage === 'focus-room' ? (
            <FocusRoom
            clock={focusClock}
            coach={
              <ZyGuide
                compact
                label="Zy / Focus coach"
                messages={
                  focusSession && focusSession.endedAt !== null
                    ? [
                        'Capture one useful result and one honest blocker. Both make the next session easier to start.',
                        'A partial outcome still counts as evidence when the debrief says what remains.',
                      ]
                    : focusSession
                      ? focusSession.pausedAt !== null
                        ? [
                            'The timer is paused. Resume only when you can return to the same objective.',
                            'Use the live notes to park a thought without opening another task.',
                          ]
                        : [
                            `${formatFocusTimer(
                              focusRemainingMs,
                            )} remains. Stay with ${focusSession.objectiveTitle}.`,
                            'Log a distraction, then return to the next visible step.',
                          ]
                      : [
                          'Choose one finish line and the shortest duration you can protect.',
                          'The timer will keep running while you move through ZyloXP.',
                        ]
                }
                mood={
                  focusSession && focusSession.endedAt !== null
                    ? 'celebrate'
                    : focusSession
                      ? 'focus'
                      : 'idle'
                }
              />
            }
            history={focusSessionHistory}
            objectives={focusObjectives}
            onAddDistraction={handleFocusDistraction}
            onBack={handleBackFromFocusRoom}
            onDiscardDebrief={handleDiscardFocusDebrief}
            onEnd={handleEndFocusSession}
            onNotesChange={handleFocusNotesChange}
            onOpenObjective={handleOpenFocusObjective}
            onPause={handlePauseFocusSession}
            onResume={handleResumeFocusSession}
            onSaveDebrief={handleSaveFocusDebrief}
            onStart={handleStartFocusSession}
            session={focusSession}
          />
        ) : activePage === 'weekly-plan' ? (
          <WeeklyPlanner
            backLabel={
              learningToolOrigin === 'insights'
                ? 'Back to insights'
                : 'Back to dashboard'
            }
            careerRole={tunedCareer.role}
            coach={
              <ZyGuide
                compact
                label="Zy / Week coach"
                messages={
                  !currentWeeklyPlan
                    ? [
                        'Choose the smallest workload you can repeat. Consistency makes the targets useful.',
                        'Pick real study days first, then let the workload fit those boundaries.',
                      ]
                    : weeklyPlanComplete
                      ? [
                          currentWeeklyPlan.rewardClaimedAt
                            ? 'This week is secured. The plan can stay visible without asking for extra work.'
                            : 'Every weekly target is complete. Claim the milestone when you are ready.',
                          'A finished week is evidence. Next week can be adjusted without erasing this progress.',
                        ]
                      : [
                          `${weeklyPlanProgress.questions}/${currentWeeklyPlan.targetQuestions} questions and ${weeklyPlanProgress.challenges}/${currentWeeklyPlan.targetChallenges} applied sessions are logged.`,
                          'The next-move panel follows the largest remaining gap in the plan.',
                        ]
                }
                mood={weeklyPlanComplete ? 'celebrate' : 'focus'}
              />
            }
            days={plannerWeekActivity}
            onBack={handleBackFromWeeklyPlan}
            onClaimReward={handleClaimWeeklyPlanReward}
            onCreate={handleCreateWeeklyPlan}
            onOpenAction={handleWeeklyPlanAction}
            onReset={handleResetWeeklyPlan}
            plan={currentWeeklyPlan}
            rewardXp={WEEKLY_PLAN_REWARD_XP}
            weekLabel={plannerWeekLabel}
          />
        ) : activePage === 'study-route' ? (
          <StudyRoutePlanner
            coach={
              <ZyGuide
                compact
                label="Zy / Route coach"
                messages={
                  studyRoute?.completedAt
                    ? [
                        'Route complete. You connected memory, practice, and evidence in one focused pass.',
                        'Your next route can change the goal or pace without losing today’s progress.',
                      ]
                    : studyRoute
                      ? studyRoute.steps.length === studyRoute.completedStepIds.length
                        ? [
                            'Every route step is complete. Finish the route to record today’s progress.',
                            'Your route is ready to close out, and every checked step is already saved.',
                          ]
                        : [
                            `${studyRoute.steps.length - studyRoute.completedStepIds.length} ${
                              studyRoute.steps.length - studyRoute.completedStepIds.length === 1
                                ? 'route step remains'
                                : 'route steps remain'
                            }. Open the next activity, then return to check it off.`,
                            'The route is saved across every page, so you can move through the app without losing your place.',
                          ]
                      : [
                          'Choose the outcome and the time you have. I’ll connect the strongest next activities.',
                          'A short route should still mix recall with something you can apply or show.',
                        ]
                }
                mood={studyRoute?.completedAt ? 'celebrate' : 'focus'}
              />
            }
            completionCount={studyRouteCompletionCount}
            onBack={handleBackFromStudyRoute}
            onFinish={handleFinishStudyRoute}
            onGenerate={handleGenerateStudyRoute}
            onOpenStep={handleOpenStudyRouteStep}
            onReset={handleResetStudyRoute}
            onToggleStep={handleToggleStudyRouteStep}
            rewardXp={STUDY_ROUTE_XP}
            route={studyRoute}
          />
        ) : activePage === 'skill-map' ? (
          <SkillMap
            averageProgress={averageSkillProgress}
            backLabel={
              learningToolOrigin === 'insights'
                ? 'Back to insights'
                : 'Back to dashboard'
            }
            careerReadiness={tunedCareerReadiness.score}
            careerRole={tunedCareer.role}
            coach={
              <ZyGuide
                compact
                label="Zy / Map coach"
                messages={
                  activeSkillMapNode.status === 'Locked'
                    ? [
                        `${activeSkillMapNode.title} is visible now, but its prerequisite still needs more charge.`,
                        'Use the connecting line to work backward to the unit that unlocks this node.',
                      ]
                    : activeSkillMapNode.dueCount > 0
                      ? [
                          `${activeSkillMapNode.dueCount} ${
                            activeSkillMapNode.dueCount === 1
                              ? 'review is'
                              : 'reviews are'
                          } due in ${activeSkillMapNode.title}. Clear that signal before adding more.`,
                          'Switch lenses to compare review pressure with career value before you choose the next move.',
                        ]
                      : [
                          `${activeSkillMapNode.title} is ready to extend through practice, a lab, or its question-bank domain.`,
                          'The career lens shows which units contribute most to your active role signal.',
                        ]
                }
                mood={
                  activeSkillMapNode.progress >= 70 ? 'celebrate' : 'focus'
                }
              />
            }
            nodes={skillMapNodes}
            onBack={handleBackFromSkillMap}
            onOpenBank={handleSkillMapBank}
            onOpenLab={handleLabSelect}
            onPractice={handleSkillMapPractice}
            onSelectSkill={handleSkillMapSelect}
            selectedSkillId={activeSkillId}
          />
        ) : activePage === 'checkpoint-exam' ? (
          <CheckpointExam
            bestScore={checkpointBestScore}
            bonusXp={CHECKPOINT_FIRST_BONUS_XP}
            coach={
              <ZyGuide
                compact
                label="Zy / Exam coach"
                messages={
                  checkpointExam?.completedAt
                    ? [
                        `${checkpointExam.score ?? 0}% is now your latest calibrated checkpoint. Use the misses, not just the score.`,
                        'Confidence alignment shows where certainty and accuracy agree—or where they need another check.',
                      ]
                    : [
                        'Choose one domain for depth or all domains for a broader signal.',
                        'During the checkpoint, flag uncertainty and rate confidence before you submit.',
                      ]
                }
                mood={
                  checkpointExam?.completedAt
                    ? (checkpointExam.score ?? 0) >= 70
                      ? 'celebrate'
                      : 'focus'
                    : 'focus'
                }
              />
            }
            completionCount={checkpointExamCompletionCount}
            domains={checkpointDomains}
            exam={checkpointExam}
            onAnswerPatch={handleCheckpointAnswerPatch}
            onBack={handleBackFromCheckpointExam}
            onCreate={handleCreateCheckpointExam}
            onNavigate={handleCheckpointNavigate}
            onOpenMistakeLab={handleOpenCheckpointMistakes}
            onReset={handleResetCheckpointExam}
            onSubmit={handleSubmitCheckpoint}
            questions={checkpointQuestions}
          />
        ) : activePage === 'mistake-lab' ? (
          <MistakeLab
            coach={
              <ZyGuide
                compact
                label="Zy / Recovery coach"
                messages={
                  activeMistakeItems.length > 0
                    ? [
                        `${activeMistakeItems.length} active ${
                          activeMistakeItems.length === 1 ? 'miss is' : 'misses are'
                        } ready to repair. Start by naming what changed the result.`,
                        `${reflectedMistakeCount} mistakes have a reflection. A short repair note makes the next attempt more deliberate.`,
                        'Recovery works best when you test the exact prompt after choosing a cause.',
                      ]
                    : [
                        'Your active mistake queue is clear. Recovered questions remain here as proof of progress.',
                        'New misses will appear automatically, along with the topic pattern they belong to.',
                      ]
                }
                mood={activeMistakeItems.length > 0 ? 'focus' : 'celebrate'}
              />
            }
            items={mistakeLabItems}
            onBack={handleBackFromMistakeLab}
            onPracticeQuestion={handlePracticeMistakeQuestion}
            onSaveReflection={handleSaveMistakeReflection}
            onStartRecovery={handleStartMistakeRecovery}
            recoveryActive={
              isSprintActive && sprintState?.source === 'recovery'
            }
            recoveryCompletionCount={mistakeRecoveryCompletions}
            reflections={mistakeReflections}
          />
        ) : activePage === 'insights' ? (
          <LearningInsights
            accuracy={practiceAccuracy}
            activityDays={learningInsightActivity}
            careerReadiness={tunedCareerReadiness.score}
            careerRole={tunedCareer.role}
            coach={
              <ZyGuide
                compact
                label="Zy / Insight coach"
                messages={
                  reviewQuestionIds.length > 0
                    ? [
                        `${reviewQuestionIds.length} ${
                          reviewQuestionIds.length === 1
                            ? 'review is'
                            : 'reviews are'
                        } due. Clear that pressure before adding more new material.`,
                        'Change the chart lens to compare recall work with focus time and applied sessions.',
                      ]
                    : currentStreak > 1
                      ? [
                          `${currentStreak} active days are building a useful rhythm. Keep the next session repeatable.`,
                          'Use the skill signals below to choose depth without losing your weekly pace.',
                        ]
                      : [
                          'This view becomes more useful after every session. Start small and let the pattern emerge.',
                          'The next-move panel uses your current mastery and review schedule, even with limited history.',
                        ]
                }
                mood={
                  reviewQuestionIds.length > 0
                    ? 'focus'
                    : currentStreak > 1
                      ? 'celebrate'
                      : 'idle'
                }
              />
            }
            currentLevel={currentLevel}
            currentStreak={currentStreak}
            dailyGoalMinutes={dailyGoal}
            onBack={handleBackFromInsights}
            onOpenReview={handleOpenInsightsReview}
            onOpenSkillMap={handleOpenInsightSkill}
            onOpenWeeklyPlan={handleOpenInsightsWeeklyPlan}
            onPracticeSkill={handleSkillMapPractice}
            reviewDueCount={reviewQuestionIds.length}
            skillSignals={learningSkillSignals}
            strongReviewCount={reviewStatusCounts.strong}
            weeklyPlanComplete={weeklyPlanComplete}
            weeklyPlanTargetXp={currentWeeklyPlan?.targetXp ?? null}
            weeklyPlanXp={weeklyPlanProgress.xp}
            xpToNextLevel={xpToNextLevel}
          />
        ) : activePage === 'progress' ? (
          <ProgressCenterPage
            achievements={achievements}
            averageSkillProgress={averageSkillProgress}
            bookmarkedCount={bookmarkedQuestionIds.length}
            currentStreak={currentStreak}
            currentLevel={currentLevel}
            dailyMissionCompletedCount={dailyMissionCompletedCount}
            dailyXp={dailyXp}
            earnedXp={earnedXp}
            learnerInitials={learnerInitials}
            learnerName={learnerDisplayName}
            levelProgress={levelProgress}
            onBack={handleBackFromProgress}
            onOpenInsights={handleOpenInsights}
            onOpenPracticeMode={handlePracticeModeChange}
            onStartSprint={handleStartSprint}
            practiceAccuracy={practiceAccuracy}
            reviewCount={reviewQuestionIds.length}
            skillProgress={skillProgress}
            totalAttempts={totalAttempts}
            tunedCareerRole={tunedCareer.role}
            unlockedAchievementCount={unlockedAchievementCount}
            xpToNextLevel={xpToNextLevel}
          />
        ) : activePage === 'review-plan' ? (
          <ReviewPlanPage
            backLabel={
              learningToolOrigin === 'insights'
                ? 'Back to insights'
                : 'Back to practice'
            }
            includeNew={reviewIncludeNew}
            items={reviewPlanItems}
            length={reviewPlanLength}
            onBack={handleBackFromReviewPlan}
            onIncludeNewChange={setReviewIncludeNew}
            onLengthChange={setReviewPlanLength}
            onOpenQuestion={handleOpenReviewQuestion}
            onStart={handleStartSmartReview}
            statusCounts={reviewStatusCounts}
            totalQuestions={lessonQuestions.length}
          />
        ) : activePage === 'lesson' ? (
          <LessonFocusPage
            backLabel={
              activeBankDiagnosticId
                ? 'Back to bank'
                : sprintState?.source === 'custom'
                  ? 'Back to builder'
                  : sprintState?.source === 'recovery'
                    ? 'Back to Mistake Lab'
                  : sprintState?.source === 'review'
                    ? 'Back to review'
                  : 'Back to path'
            }
            answerConfidence={answerConfidence}
            bookmarkedCount={bookmarkedQuestionIds.length}
            currentQuestion={currentQuestion}
            currentQuestionIndex={currentQuestionIndex}
            currentQuestionMastery={currentQuestionMastery}
            heartsEnabled={practiceWithHearts}
            heartsRemaining={heartsRemaining}
            isBookmarked={isCurrentQuestionBookmarked}
            isCorrect={isCorrect}
            isFormulaSaved={isCurrentQuestionFormulaSaved}
            isSprintActive={isSprintActive}
            isSprintReadyForSummary={
              isSprintActive && sprintAnswered >= sprintTarget
            }
            maxHearts={MAX_HEARTS}
            nextHeartInMs={nextHeartInMs}
            onAnswer={handleAnswer}
            onBack={
              activeBankDiagnosticId ? handleBackFromDiagnostic : handleBackToPath
            }
            onCancelSprint={handleCancelSprint}
            onConfidenceChange={setAnswerConfidence}
            onNextPrompt={handleNextPrompt}
            onOpenAtlasConcept={handleAtlasConceptSelect}
            onOpenAtlasGame={handleAtlasGameSelect}
            onOpenJournal={(scratchpad) =>
              handleOpenFieldJournal({
                body: `${currentQuestion.formula}\nReasoning: ${scratchpad?.trim() ?? ''}`,
                category: 'formula',
                title: `${currentQuestion.subtopic} reasoning`,
              })
            }
            onOpenHearts={() => setOverlay('hearts')}
            onPracticeModeChange={handlePracticeModeChange}
            onToggleBookmark={handleToggleQuestionBookmark}
            onToggleFormula={() =>
              handleToggleFormula(currentQuestionFormulaId)
            }
            practiceMode={practiceMode}
            questProgress={questProgress}
            reviewCount={reviewQuestionIds.length}
            selectedOption={selectedOption}
            sprintAnswered={sprintAnswered}
            sprintLabel={sprintState?.label ?? 'Power Sprint'}
            sprintPosition={sprintState ? sprintState.position + 1 : 0}
            sprintTarget={sprintTarget}
            skillTitle={activeSkill.title}
            totalQuestions={lessonQuestions.length}
          />
        ) : activePage === 'portfolio' ? (
          <EvidencePortfolio
            evidence={portfolioEvidence}
            featuredIds={activePortfolioFeaturedIds}
            headline={portfolioHeadline}
            notes={portfolioNotes}
            onBack={handleBackFromPortfolio}
            onHeadlineChange={setPortfolioHeadline}
            onNoteChange={handlePortfolioNoteChange}
            onOpenSource={handleOpenPortfolioEvidence}
            onPublish={handlePublishPortfolio}
            onToggleFeatured={handleTogglePortfolioFeatured}
            publishCount={portfolioPublishCount}
            readiness={selectedCareerReadiness.score}
            rewardXp={PORTFOLIO_READY_XP}
            role={selectedCareer.role}
          />
        ) : activePage === 'workbench' ? (
          <CircuitWorkbench
            initialDesign={savedCircuitDesigns[0]}
            onBack={handleBackToLabs}
            onDelete={handleDeleteCircuitDesign}
            onSave={handleSaveCircuitDesign}
            savedDesigns={savedCircuitDesigns}
          />
        ) : activePage === 'lab' ? (
          <LabFocusPage
            activeLab={activeLab}
            activeMission={activeLabMission}
            activeMissionComplete={activeLabMissionComplete}
            adcAliased={adcAliased}
            adcClipped={adcClipped}
            adcDisplayedFrequency={adcDisplayedFrequency}
            adcEffectiveSnr={adcEffectiveSnr}
            adcFilterGain={adcFilterGain}
            adcFilteredAmplitude={adcFilteredAmplitude}
            adcLsbMillivolts={adcLsbMillivolts}
            adcNyquistFrequency={adcNyquistFrequency}
            adcPeakCode={adcPeakCode}
            adcSamplesPerCycle={adcSamplesPerCycle}
            bjtAdjustedBeta={bjtAdjustedBeta}
            bjtBaseEmitterVoltage={bjtBaseEmitterVoltage}
            bjtCollectorCurrent={bjtCollectorCurrent}
            bjtCollectorPower={bjtCollectorPower}
            bjtCollectorResistorPower={bjtCollectorResistorPower}
            bjtCollectorVoltage={bjtCollectorVoltage}
            bjtCutoff={bjtCutoff}
            bjtForcedBeta={bjtForcedBeta}
            bjtIdealCollectorCurrent={bjtIdealCollectorCurrent}
            bjtJunctionTemperature={bjtJunctionTemperature}
            bjtLoadLineCurrent={bjtLoadLineCurrent}
            bjtSaturated={bjtSaturated}
            bjtSaturationMargin={bjtSaturationMargin}
            bjtTransconductance={bjtTransconductance}
            completedFaultCaseIds={completedFaultCaseIds}
            completedFaultCount={activeLabCompletedFaultCount}
            completedMissionCount={activeLabCompletedMissionCount}
            completedMissionIds={completedLabMissionIds}
            current={current}
            digitalMaxClock={digitalMaxClock}
            digitalPeriod={digitalPeriod}
            digitalTimingMargin={digitalTimingMargin}
            digitalTimingUtilization={digitalTimingUtilization}
            faultCases={activeLabFaultCases}
            filterGainDb={filterGainDb}
            filterOutput={filterOutput}
            filterPhase={filterPhase}
            labRunHistory={activeLabRunHistory}
            labValues={labValues}
            missionFeedback={labMissionFeedback}
            missionValue={activeLabMetric}
            missions={activeLabMissions}
            mosfetConductionLoss={mosfetConductionLoss}
            mosfetDrainCurrent={mosfetDrainCurrent}
            mosfetDrainVoltage={mosfetDrainVoltage}
            mosfetEfficiency={mosfetEfficiency}
            mosfetGateDriveLoss={mosfetGateDriveLoss}
            mosfetJunctionTemperature={mosfetJunctionTemperature}
            mosfetLoadPower={mosfetLoadPower}
            mosfetOn={mosfetOn}
            mosfetOnResistance={mosfetOnResistance}
            mosfetSwitchingLoss={mosfetSwitchingLoss}
            mosfetTotalLoss={mosfetTotalLoss}
            mosfetTransitionTime={mosfetTransitionTime}
            isFormulaSaved={isActiveLabFormulaSaved}
            onBack={handleBackToLabs}
            onCheckMission={handleCheckLabMission}
            onDeleteRun={handleDeleteLabRun}
            onLabValueChange={handleLabValueChange}
            onMissionSelect={handleLabMissionSelect}
            onOpenJournal={() =>
              handleOpenFieldJournal({
                body: `Live output: ${formatLabRunOutput(
                  activeLab.id,
                  labValues,
                )}\nObservation: `,
                category: 'lab',
                title: `${activeLab.title} observation`,
              })
            }
            onOpenPractice={handleStartLabPractice}
            onRestoreRun={handleRestoreLabRun}
            onSave={handleSaveLab}
            onSolveFault={handleSolveLabFault}
            onToggleFormula={() => handleToggleFormula(activeLabFormulaId)}
            opAmpClipped={opAmpClipped}
            opAmpGain={opAmpGain}
            opAmpHeadroom={opAmpHeadroom}
            opAmpInputCurrent={opAmpInputCurrent}
            opAmpMaxSwing={opAmpMaxSwing}
            opAmpOutput={opAmpOutput}
            pidControlEffort={pidControlEffort}
            pidDampingRatio={pidDampingRatio}
            pidFinalValue={pidFinalValue}
            pidNaturalFrequency={pidNaturalFrequency}
            pidOvershoot={pidOvershoot}
            pidRiseTime={pidRiseTime}
            pidSettlingTime={pidSettlingTime}
            pidSteadyStateError={pidSteadyStateError}
            rcCutoff={rcCutoff}
            rcTimeConstant={rcTimeConstant}
            resonanceBandwidth={resonanceBandwidth}
            resonanceCapacitiveReactance={resonanceCapacitiveReactance}
            resonanceCapacitorVoltage={resonanceCapacitorVoltage}
            resonanceCurrent={resonanceCurrent}
            resonanceFrequency={resonanceFrequency}
            resonanceImpedance={resonanceImpedance}
            resonanceInductiveReactance={resonanceInductiveReactance}
            resonanceInductorVoltage={resonanceInductorVoltage}
            resonanceLowerCutoff={resonanceLowerCutoff}
            resonanceNearPeak={resonanceNearPeak}
            resonancePhase={resonancePhase}
            resonanceQualityFactor={resonanceQualityFactor}
            resonanceResistorPower={resonanceResistorPower}
            resonanceUpperCutoff={resonanceUpperCutoff}
            threePhasePower={threePhasePower}
            transmissionDeliveredPower={transmissionDeliveredPower}
            transmissionReflectedVoltage={transmissionReflectedVoltage}
            transmissionReflectionCoefficient={transmissionReflectionCoefficient}
            transmissionReflectionMagnitude={transmissionReflectionMagnitude}
            transmissionReflectionPhase={transmissionReflectionPhase}
            transmissionReturnLoss={transmissionReturnLoss}
            transmissionVswr={transmissionVswr}
            transformerCoreLoss={transformerCoreLoss}
            transformerCopperLoss={transformerCopperLoss}
            transformerEfficiency={transformerEfficiency}
            transformerFluxDensity={transformerFluxDensity}
            transformerIdealSecondaryVoltage={transformerIdealSecondaryVoltage}
            transformerLoadPercent={transformerLoadPercent}
            transformerMagnetizingCurrent={transformerMagnetizingCurrent}
            transformerOutputPower={transformerOutputPower}
            transformerPrimaryCurrent={transformerPrimaryCurrent}
            transformerRegulation={transformerRegulation}
            transformerSaturated={transformerSaturated}
            transformerSecondaryCurrent={transformerSecondaryCurrent}
            transformerSecondaryVoltage={transformerSecondaryVoltage}
            transformerTemperatureRise={transformerTemperatureRise}
            transformerTotalLoss={transformerTotalLoss}
            transformerTurnsRatio={transformerTurnsRatio}
          />
        ) : activePage === 'career-project' ? (
          <CareerProjectPage
            lab={activeCareerProjectLab}
            onAnswer={handleCareerProjectAnswer}
            onBack={() => setActivePage('career')}
            onSubmit={handleSubmitCareerProject}
            project={activeCareerProject}
            record={activeCareerProjectRecord}
            readiness={selectedCareerReadiness}
          />
        ) : activePage === 'career' ? (
          <CareerFocusPage
            careerOptions={careerReadiness}
            comparisonReadiness={comparisonCareerReadiness}
            isTuned={selectedCareer.role === tunedCareerRole}
            onBack={handleBackToCareers}
            onCompare={handleCareerComparisonChange}
            onOpenLab={handleLabSelect}
            onOpenJournal={() =>
              handleOpenFieldJournal({
                body: `Readiness: ${selectedCareerReadiness.score}%\nNext evidence: `,
                category: 'career',
                title: `${selectedCareer.role} pathway note`,
              })
            }
            onOpenPortfolio={handleOpenPortfolio}
            onOpenProject={handleOpenCareerProject}
            onOpenSkill={handleOpenCareerSkill}
            onStartSprint={handleStartCareerSprint}
            onTunePath={handleTunePathFromCareer}
            readiness={selectedCareerReadiness}
            selectedCareer={selectedCareer}
          />
        ) : (
          <>
        <section
          className={`heroBand ${
            activeSection === 'learn' ? '' : 'sectionHeroCompact'
          }`}
          aria-labelledby="page-title"
        >
          <div>
            <p className="eyebrow">{sectionEyebrows[activeSection]}</p>
            <h1 id="page-title">{sectionTitles[activeSection]}</h1>
            <p>{sectionDescriptions[activeSection]}</p>
          </div>

          <div className="heroSide">
            <ZyGuide
              compact
              label={guideContent.label}
              messages={guideContent.messages}
              mood={guideContent.mood}
            />

            <button
              aria-label={`Open weekly plan. Daily Charge: ${currentStreak} ${
                currentStreak === 1 ? 'day' : 'days'
              }, ${todayActivity.focusMinutes} focus minutes today.`}
              className="streakCard streakCardButton"
              onClick={handleOpenWeeklyPlan}
              type="button"
            >
              <span className="streakCardLabel">
                Daily Charge
                <ChevronRight aria-hidden="true" size={16} />
              </span>
              <strong>
                {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
              </strong>
              <small>{todayActivity.focusMinutes} focus min today</small>
              <div className="miniProgress">
                <span
                  style={{
                    width: `${Math.min(
                      100,
                      (todayActivity.focusMinutes / dailyGoal) * 100,
                    )}%`,
                  }}
                />
              </div>
            </button>
          </div>

          <div aria-hidden="true" className="heroSignalRail">
            <span className="heroSignalTrace" />
            <span className="heroSignalNode heroSignalNodeStart" />
            <span className="heroSignalNode heroSignalNodeQuarter" />
            <span className="heroSignalNode heroSignalNodeMid" />
            <span className="heroSignalNode heroSignalNodeEnd" />
            <span className="heroSignalPulse" />
            <span className="heroSignalTerminal" />
          </div>
        </section>

        <nav className="sectionTabs" aria-label="Workspace sections">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                aria-current={isActive ? 'page' : undefined}
                className={isActive ? 'active' : ''}
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                onFocus={() => preloadAppSection(item.id)}
                onPointerEnter={() => preloadAppSection(item.id)}
                type="button"
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {activeSection === 'learn' && (
          <>
        <section className="statGrid" aria-label="Learner stats">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const statValue =
              stat.label === 'XP'
                ? earnedXp.toLocaleString()
                : stat.label === 'Streak'
                  ? `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`
                : stat.label === 'Career Signal'
                  ? tunedCareer.role.replace(' Engineer', '').replace(' Systems', '')
                  : stat.value;
            const statNote =
              stat.label === 'XP'
                ? `+${dailyXp} today`
                : stat.label === 'Streak'
                  ? `${todayActivity.focusMinutes} focus min today`
                : stat.label === 'Career Signal'
                  ? `${tunedCareerReadiness.score}% readiness`
                  : stat.note;
            const actionLabel =
              stat.label === 'XP'
                ? 'View progress'
                : stat.label === 'Streak'
                  ? 'Plan this week'
                  : stat.label === 'Question Bank'
                    ? 'Browse questions'
                    : 'View pathway';

            const handleStatOpen = () => {
              if (stat.label === 'XP') {
                handleOpenProgress();
                return;
              }

              if (stat.label === 'Streak') {
                handleOpenWeeklyPlan();
                return;
              }

              if (stat.label === 'Question Bank') {
                handleSectionChange('bank');
                return;
              }

              handleCareerSelect(tunedCareer.role);
            };

            return (
              <button
                aria-label={`${stat.label}: ${statValue}. ${statNote}. ${actionLabel}.`}
                className={`statCard statCardButton ${stat.accent}`}
                key={stat.label}
                onClick={handleStatOpen}
                type="button"
              >
                <div className="statIcon">
                  <Icon size={19} />
                </div>
                <span>{stat.label}</span>
                <strong>{statValue}</strong>
                <small>{statNote}</small>
                <span className="statCardAction">
                  {actionLabel}
                  <ChevronRight aria-hidden="true" size={15} />
                </span>
              </button>
            );
          })}
        </section>

        {recommendedAction.tone !== 'adaptive' && (
          <section
            className={`recommendedActionBand ${recommendedAction.tone}`}
            aria-labelledby="recommended-action-title"
          >
            <span className="recommendedActionIcon">
              <RecommendedActionIcon size={24} />
            </span>
            <div className="recommendedActionCopy">
              <p className="eyebrow">{recommendedAction.eyebrow}</p>
              <h2 id="recommended-action-title">{recommendedAction.title}</h2>
              <p>{recommendedAction.description}</p>
            </div>
            <div className="recommendedActionSignal">
              <strong>{recommendedAction.signal}</strong>
              <span>{recommendedAction.signalLabel}</span>
            </div>
            <button
              className="primaryButton"
              onClick={recommendedAction.run}
              type="button"
            >
              {recommendedAction.buttonLabel}
              <ArrowRight size={17} />
            </button>
          </section>
        )}

        <RecentLearning
          items={recentLearningItems}
          onClear={handleClearRecentLearning}
          onOpen={handleOpenRecentLearning}
        />

        <div className="studyToolShelf">
          <button
            aria-controls="study-tools-panel"
            aria-expanded={studyToolsExpanded}
            className="studyToolToggle"
            onClick={() => setStudyToolsExpanded((expanded) => !expanded)}
            type="button"
          >
            <span className="studyToolToggleLabel">
              <SlidersHorizontal size={20} />
              <span>
                <strong>Study tools</strong>
                <small>Focus · Routes · Recovery · Checkpoints · Practice</small>
              </span>
            </span>
            <span aria-hidden="true" className="studyToolSignal">
              <i />
              <i />
              <i />
            </span>
            <span className="studyToolToggleMeta">
              <small>{studyToolsExpanded ? 'Hide' : '9 activities'}</small>
              <ChevronRight
                className={studyToolsExpanded ? 'expanded' : ''}
                size={18}
              />
            </span>
          </button>

          {studyToolsExpanded && (
        <section
          className="studyHub"
          id="study-tools-panel"
          aria-label="Personal study tools"
        >
          <header>
            <div>
              <p className="eyebrow">Toolkit</p>
              <h2>Choose another activity</h2>
            </div>
            <div className="studyHubQuest">
              <span>{dailyMissionCompletedCount}/3 daily missions</span>
              <div className="questMeter" aria-label="Daily mission progress">
                <span style={{ width: `${dailyMissionProgress}%` }} />
              </div>
            </div>
          </header>

          <button
            className={`focusRoomBanner ${
              focusSession
                ? focusSession.endedAt !== null
                  ? 'complete'
                  : focusSession.pausedAt !== null
                    ? 'paused'
                    : 'active'
                : ''
            }`}
            onClick={handleOpenFocusRoom}
            type="button"
          >
            <span className="focusRoomBannerIcon">
              {focusSession?.endedAt !== null && focusSession ? (
                <CheckCircle2 size={21} />
              ) : focusSession?.pausedAt !== null && focusSession ? (
                <Pause size={21} />
              ) : (
                <Clock3 size={21} />
              )}
            </span>
            <span>
              <small>Focus Room</small>
              <strong>
                {focusSession
                  ? focusSession.endedAt !== null
                    ? 'Debrief is ready'
                    : focusSession.pausedAt !== null
                      ? 'Session paused'
                      : focusSession.objectiveTitle
                  : 'Start a protected study block'}
              </strong>
              <em>
                {focusSession
                  ? focusSession.endedAt !== null
                    ? 'Capture the outcome and update your focus history'
                    : focusSession.pausedAt !== null
                      ? `${focusSession.objectiveTitle} / resume when ready`
                      : 'Timer follows you across questions, labs, and review'
                  : 'One objective, a persistent timer, and a short debrief'}
              </em>
            </span>
            <span className="focusRoomBannerSignal">
              <strong>
                {focusSession
                  ? focusSession.endedAt !== null
                    ? 'Save'
                    : focusSession.pausedAt !== null
                      ? 'Paused'
                      : formatFocusTimer(focusRemainingMs)
                  : `${focusHistoryMinutes} min`}
              </strong>
              <small>
                {focusSession
                  ? focusSession.endedAt !== null
                    ? 'debrief'
                    : 'remaining'
                  : `${focusSessionHistory.length} sessions`}
              </small>
            </span>
            <ChevronRight size={18} />
          </button>

          <div className="studyPriorityGrid">
            <button
              className={`studyRouteBanner ${
                studyRoute?.completedAt
                  ? 'complete'
                  : studyRoute
                    ? 'active'
                    : ''
              }`}
              onClick={handleOpenStudyRoute}
              type="button"
            >
              <span className="studyRouteBannerIcon">
                <Route size={21} />
              </span>
              <span>
                <small>Zy Study Route</small>
                <strong>
                  {studyRoute?.completedAt
                    ? 'Route complete'
                    : studyRoute
                      ? 'Resume your route'
                      : 'Build a focused route'}
                </strong>
                <em>
                  {studyRoute
                    ? `${studyRoute.completedStepIds.length}/${studyRoute.steps.length} steps · ${studyRoute.config.duration} min`
                    : 'Connect review, practice, labs, and career work'}
                </em>
              </span>
              <span className="studyRouteBannerProgress" aria-hidden="true">
                <i
                  style={{
                    width: `${
                      studyRoute
                        ? (studyRoute.completedStepIds.length /
                            Math.max(1, studyRoute.steps.length)) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </span>
              <ChevronRight size={18} />
            </button>

            <button
              className={`mistakeLabBanner ${
                activeMistakeItems.length === 0 ? 'clear' : ''
              }`}
              onClick={handleOpenMistakeLab}
              type="button"
            >
              <span className="mistakeLabBannerIcon">
                <BrainCircuit size={21} />
              </span>
              <span>
                <small>Mistake Lab</small>
                <strong>
                  {isSprintActive && sprintState?.source === 'recovery'
                    ? 'Resume your recovery'
                    : activeMistakeItems.length === 0
                      ? 'Queue is clear'
                      : `${activeMistakeItems.length} active ${
                          activeMistakeItems.length === 1 ? 'repair' : 'repairs'
                        }`}
                </strong>
                <em>
                  {reflectedMistakeCount} reflected · {recoveredMistakeCount}{' '}
                  recovered
                </em>
              </span>
              <span className="mistakeLabBannerSignal">
                <strong>
                  {mistakeLabItems.length === 0
                    ? 100
                    : Math.round(
                        (reflectedMistakeCount / mistakeLabItems.length) * 100,
                      )}
                  %
                </strong>
                <small>reflected</small>
              </span>
              <ChevronRight size={18} />
            </button>

            <button
              className={`checkpointBanner ${
                checkpointExam?.completedAt
                  ? 'complete'
                  : checkpointExam
                    ? 'active'
                    : ''
              }`}
              onClick={handleOpenCheckpointExam}
              type="button"
            >
              <span className="checkpointBannerIcon">
                <ShieldCheck size={21} />
              </span>
              <span>
                <small>Checkpoint Exam</small>
                <strong>
                  {checkpointExam?.completedAt
                    ? `${checkpointExam.score ?? 0}% checkpoint`
                    : checkpointExam
                      ? 'Resume checkpoint'
                      : 'Build a checkpoint'}
                </strong>
                <em>
                  {checkpointExam
                    ? checkpointExam.completedAt
                      ? `Best ${checkpointBestScore}% · ${checkpointExam.questionIds.length} questions`
                      : `${checkpointAnsweredCount}/${checkpointExam.questionIds.length} answered · autosaved`
                    : 'Timed, flagged, and confidence-rated'}
                </em>
              </span>
              <span className="checkpointBannerSignal">
                <strong>
                  {checkpointExam?.completedAt
                    ? `${checkpointExam.score ?? 0}%`
                    : checkpointExam
                      ? `${checkpointAnsweredCount}/${checkpointExam.questionIds.length}`
                      : `${checkpointDomains[0].questionCount}`}
                </strong>
                <small>
                  {checkpointExam?.completedAt
                    ? 'latest'
                    : checkpointExam
                      ? 'answered'
                      : 'available'}
                </small>
              </span>
              <ChevronRight size={18} />
            </button>

            <button
              className="skillMapBanner"
              onClick={handleOpenSkillMap}
              type="button"
            >
              <span className="skillMapBannerIcon">
                <GitBranch size={21} />
              </span>
              <span>
                <small>Skill Map</small>
                <strong>
                  {skillMapAvailableCount}/{skillMapNodes.length} units connected
                </strong>
                <em>
                  {skillMapDueCount} due · mastery, review, and career lenses
                </em>
              </span>
              <span className="skillMapBannerSignal">
                <strong>{averageSkillProgress}%</strong>
                <small>mastery</small>
              </span>
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="studyHubActions">
            <button className="resume" onClick={handleStartLesson} type="button">
              <span className="studyHubIcon">
                <Zap size={20} />
              </span>
              <span>
                <small>Resume practice</small>
                <strong>{currentQuestion.topic}</strong>
                <em>
                  Prompt {currentQuestionIndex + 1} · {practiceModeLabel} mode
                </em>
              </span>
              <ChevronRight size={18} />
            </button>

            <button onClick={handleOpenReviewPlan} type="button">
              <span className="studyHubIcon review">
                <RotateCcw size={20} />
              </span>
              <span>
                <small>Smart review</small>
                <strong>
                  {reviewQuestionIds.length === 0
                    ? 'Plan is ready'
                    : `${reviewQuestionIds.length} due now`}
                </strong>
                <em>
                  {reviewStatusCounts.learning} learning ·{' '}
                  {reviewStatusCounts.strong} strong
                </em>
              </span>
              <ChevronRight size={18} />
            </button>

            <button onClick={() => handlePracticeModeChange('saved')} type="button">
              <span className="studyHubIcon saved">
                <Bookmark size={20} />
              </span>
              <span>
                <small>Saved questions</small>
                <strong>
                  {bookmarkedQuestionIds.length === 0
                    ? 'Build a set'
                    : `${bookmarkedQuestionIds.length} saved`}
                </strong>
                <em>Focused practice stack</em>
              </span>
              <ChevronRight size={18} />
            </button>

            <button className="sprint" onClick={handleStartSprint} type="button">
              <span className="studyHubIcon sprint">
                <Trophy size={20} />
              </span>
              <span>
                <small>Power Sprint</small>
                <strong>
                  {isSprintActive ? 'Resume session' : '5-question challenge'}
                </strong>
                <em>
                  {isSprintActive
                    ? `${sprintAnswered}/${sprintTarget} answered`
                    : lastSprintSummary
                      ? `Last score ${lastSprintSummary.correct}/${lastSprintSummary.total}`
                      : 'Adaptive mixed set'}
                </em>
              </span>
              <ChevronRight size={18} />
            </button>
          </div>
        </section>
          )}
        </div>

        <Suspense fallback={<DailyMissionBoardFallback />}>
          <DailyMissionBoard
            completedCount={dailyMissionCompletedCount}
            currentStreak={currentStreak}
            dailyGoal={dailyGoal}
            hasWeeklyPlan={currentWeeklyPlan !== null}
            missions={dailyMissions}
            onClaimReward={handleClaimDailyMissionReward}
            onOpenMission={handleOpenDailyMission}
            onOpenWeeklyPlan={handleOpenWeeklyPlan}
            rewardClaimed={dailyMissionRewardClaimed}
            rewardXp={DAILY_MISSION_REWARD_XP}
            weeklyActivity={weeklyActivity}
            weeklyPlanComplete={weeklyPlanComplete}
          />
        </Suspense>

        <section className="adaptiveFocusBand" aria-label="Adaptive focus recommendation">
          <span className="adaptiveFocusIcon">
            <BrainCircuit size={25} />
          </span>
          <div className="adaptiveFocusCopy">
            <p className="eyebrow">Adaptive focus</p>
            <h2>Strengthen {adaptiveSkill.title}</h2>
            <p>
              This is your lowest active skill at {Math.round(adaptiveSkillProgress)}%
              mastery.
            </p>
          </div>
          <div className="adaptiveFocusMeter">
            <span>
              <strong>{Math.round(adaptiveSkillProgress)}%</strong>
              Current mastery
            </span>
            <div aria-label={`${Math.round(adaptiveSkillProgress)}% mastery`}>
              <span style={{ width: `${adaptiveSkillProgress}%` }} />
            </div>
          </div>
          <button className="secondaryButton" onClick={handleStartAdaptivePractice} type="button">
            Practice this skill
            <ArrowRight size={17} />
          </button>
        </section>
          </>
        )}

        {activeSection !== 'learn' && (
          <div className="contentGrid overviewGrid">
          <section className="mainColumn" aria-label="Primary content">
            {activeSection === 'practice' && (
              <section
                className="reviewPlannerBand"
                aria-labelledby="review-planner-title"
              >
                <header>
                  <span className="reviewPlannerIcon">
                    <BrainCircuit size={23} />
                  </span>
                  <div>
                    <p className="eyebrow">Review Radar</p>
                    <h2 id="review-planner-title">
                      {reviewStatusCounts.due > 0
                        ? `${reviewStatusCounts.due} ${
                            reviewStatusCounts.due === 1 ? 'check is' : 'checks are'
                          } due`
                        : 'Your next review is mapped'}
                    </h2>
                  </div>
                  <button
                    className="secondaryButton"
                    onClick={handleOpenReviewPlan}
                    type="button"
                  >
                    Open plan
                    <ArrowRight size={16} />
                  </button>
                </header>

                <div className="reviewPlannerSummary" aria-label="Review status">
                  {(
                    [
                      ['due', 'Due now'],
                      ['learning', 'Learning'],
                      ['strong', 'Strong'],
                      ['new', 'New'],
                    ] as Array<[ReviewStatus, string]>
                  ).map(([status, label]) => (
                    <div className={status} key={status}>
                      <strong>{reviewStatusCounts[status]}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                <div className="reviewPlannerPreview">
                  {reviewPlanItems.slice(0, 3).map((item, index) => (
                    <button
                      key={item.question.id}
                      onClick={() => handleOpenReviewQuestion(item.questionIndex)}
                      type="button"
                    >
                      <span>{index + 1}</span>
                      <div>
                        <strong>{item.question.subtopic}</strong>
                        <small>
                          {item.reason} · {item.dueLabel}
                        </small>
                      </div>
                      <em className={item.status}>{item.status}</em>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {activeSection === 'practice' && (
              <section
                className="customSessionBuilder"
                aria-labelledby="custom-session-title"
              >
                <header>
                  <span className="customSessionHeaderIcon">
                    <SlidersHorizontal size={23} />
                  </span>
                  <div>
                    <p className="eyebrow">Session Builder</p>
                    <h2 id="custom-session-title">Shape your next practice run</h2>
                  </div>
                  <button
                    className="secondaryButton"
                    onClick={handleResetCustomSession}
                    type="button"
                  >
                    <RotateCcw size={16} />
                    Reset
                  </button>
                </header>

                <div className="customSessionLayout">
                  <div className="customSessionControls">
                    <label className="customSessionSelect">
                      <span>Domain</span>
                      <select
                        aria-label="Practice domain"
                        onChange={(event) =>
                          handleCustomSessionConfigChange({
                            collectionId: event.currentTarget.value as
                              | BankCollectionId
                              | 'all',
                          })
                        }
                        value={customSessionConfig.collectionId}
                      >
                        <option value="all">All engineering domains</option>
                        {BANK_COLLECTIONS.map((collection) => (
                          <option key={collection.id} value={collection.id}>
                            {collection.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <fieldset className="customSessionDifficulty">
                      <legend>Level band</legend>
                      <div>
                        {CUSTOM_SESSION_DIFFICULTIES.map((difficulty) => (
                          <button
                            aria-pressed={
                              customSessionConfig.difficulty === difficulty.id
                            }
                            className={
                              customSessionConfig.difficulty === difficulty.id
                                ? 'active'
                                : ''
                            }
                            key={difficulty.id}
                            onClick={() =>
                              handleCustomSessionConfigChange({
                                difficulty: difficulty.id,
                              })
                            }
                            type="button"
                          >
                            <strong>{difficulty.label}</strong>
                            <span>{difficulty.detail}</span>
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <div className="customSessionOptionRow">
                      <fieldset className="customSessionLength">
                        <legend>Session length</legend>
                        <div>
                          {([5, 10] as CustomSessionLength[]).map((length) => (
                            <button
                              aria-pressed={customSessionConfig.length === length}
                              className={
                                customSessionConfig.length === length
                                  ? 'active'
                                  : ''
                              }
                              key={length}
                              onClick={() =>
                                handleCustomSessionConfigChange({ length })
                              }
                              type="button"
                            >
                              {length}
                              <span>questions</span>
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      <label className="customSessionToggle">
                        <input
                          checked={customSessionConfig.prioritizeReview}
                          onChange={(event) =>
                            handleCustomSessionConfigChange({
                              prioritizeReview: event.currentTarget.checked,
                            })
                          }
                          type="checkbox"
                        />
                        <span>
                          <strong>Review first</strong>
                          <small>Put recent misses at the front</small>
                        </span>
                      </label>
                    </div>
                  </div>

                  <aside className="customSessionPreview" aria-label="Session blueprint">
                    <header>
                      <span>
                        {isSprintActive ? <Pause size={19} /> : <Target size={19} />}
                      </span>
                      <div>
                        <p className="eyebrow">
                          {isSprintActive ? 'Session in progress' : 'Blueprint ready'}
                        </p>
                        <h3>
                          {isSprintActive
                            ? sprintState?.label
                            : customSessionCollection?.label ??
                              customSessionDifficulty.label}
                        </h3>
                      </div>
                    </header>

                    <div className="customSessionMetrics">
                      <div>
                        <span>Run</span>
                        <strong>
                          {isSprintActive
                            ? `${sprintAnswered}/${sprintTarget}`
                            : customSessionQuestionCount}
                        </strong>
                        <small>questions</small>
                      </div>
                      <div>
                        <span>Available</span>
                        <strong>{customSessionQuestionIndices.length}</strong>
                        <small>matches</small>
                      </div>
                      <div>
                        <span>Potential</span>
                        <strong>+{customSessionEstimatedXp}</strong>
                        <small>XP</small>
                      </div>
                    </div>

                    <div className="customSessionBlueprint">
                      <span>
                        {customSessionCollection?.label ?? 'All domains'}
                      </span>
                      <span>{customSessionDifficulty.detail}</span>
                      <span>
                        {customSessionConfig.prioritizeReview
                          ? 'Review prioritized'
                          : 'Level ordered'}
                      </span>
                    </div>

                    <p>
                      {customSessionCompletions === 0
                        ? 'Your first completed custom run unlocks Session Architect.'
                        : `${customSessionCompletions} custom ${
                            customSessionCompletions === 1 ? 'session' : 'sessions'
                          } completed.`}
                    </p>

                    <button
                      className="primaryButton fullWidth"
                      disabled={!isSprintActive && customSessionQuestionCount === 0}
                      onClick={
                        isSprintActive
                          ? handleStartSprint
                          : handleStartCustomSession
                      }
                      type="button"
                    >
                      {isSprintActive ? (
                        <>
                          <Play size={17} />
                          Resume {sprintAnswered}/{sprintTarget}
                        </>
                      ) : (
                        <>
                          <Play size={17} />
                          Start {customSessionQuestionCount}-question session
                        </>
                      )}
                    </button>
                  </aside>
                </div>
              </section>
            )}

            {activeSection === 'practice' && (
              <section
                aria-labelledby="practice-path-title"
                className="practicePathSection"
              >
                <div className="sectionHeader">
                  <div>
                    <p className="eyebrow">Skill Path</p>
                    <h2 id="practice-path-title">Or choose a learning unit</h2>
                  </div>
                  <span className="bankBadge">
                    {filteredSkills.length}/{skillNodes.length} units
                  </span>
                </div>

                <div className="practicePathToolbar">
                  <label className="practicePathSearch">
                    <Search aria-hidden="true" size={17} />
                    <input
                      aria-label="Search learning units"
                      onChange={(event) =>
                        setPracticePathQuery(event.currentTarget.value)
                      }
                      placeholder="Search units, careers, or levels"
                      type="search"
                      value={practicePathQuery}
                    />
                    {practicePathQuery && (
                      <button
                        aria-label="Clear learning unit search"
                        onClick={() => setPracticePathQuery('')}
                        title="Clear search"
                        type="button"
                      >
                        <XCircle aria-hidden="true" size={17} />
                      </button>
                    )}
                  </label>

                  <div
                    aria-label="Filter learning units by progress"
                    className="practicePathFilters"
                    role="group"
                  >
                    {PRACTICE_PATH_FILTERS.map((filter) => {
                      const count =
                        filter.id === 'all'
                          ? skillNodes.length
                          : practicePathStateCounts[filter.id];

                      return (
                        <button
                          aria-pressed={practicePathFilter === filter.id}
                          className={
                            practicePathFilter === filter.id ? 'active' : ''
                          }
                          key={filter.id}
                          onClick={() => setPracticePathFilter(filter.id)}
                          type="button"
                        >
                          {filter.label}
                          <span>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pathList">
                  {filteredSkills.length === 0 && (
                    <div className="pathEmpty">
                      <Search size={22} />
                      <strong>No learning units match</strong>
                      <span>Try another term or reset the progress filter.</span>
                      <button
                        onClick={() => {
                          setPracticePathFilter('all');
                          setPracticePathQuery('');
                        }}
                        type="button"
                      >
                        Reset path filters
                      </button>
                    </div>
                  )}

                  {filteredSkills.map((skill, skillIndex) => {
                    const Icon = skill.icon;
                    const isActive = activeSkill.id === skill.id;
                    const isLocked = skill.status === 'Locked';
                    const visibleProgress = skillProgress[skill.id] ?? skill.progress;
                    const isComplete = visibleProgress >= 70;

                    return (
                      <div
                        className={`pathNode ${skillIndex % 2 === 0 ? 'leftStep' : 'rightStep'}`}
                        key={skill.id}
                      >
                        <span className="pathConnector" />
                        <button
                          className={`skillRow ${isActive ? 'selected' : ''} ${
                            isLocked ? 'locked' : ''
                          }`}
                          onClick={() => handleSkillSelect(skill)}
                          type="button"
                        >
                          <div className={`lessonOrb ${isComplete ? 'complete' : ''}`}>
                            <Icon size={24} />
                          </div>
                          <div className="skillBody">
                            <div className="skillTitleLine">
                              <span>{skill.unit}</span>
                              <strong>{skill.title}</strong>
                              <em className={skillStatusClass[skill.status]}>{skill.status}</em>
                            </div>
                            <p>{skill.careerSignal}</p>
                            <div className="progressLine">
                              <span style={{ width: `${visibleProgress}%` }} />
                            </div>
                          </div>
                          <div className="skillMeta">
                            <strong>{visibleProgress}%</strong>
                            <span>Level {skill.difficulty}</span>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {activeSection === 'labs' && (
              <section className="labPanel" aria-label="Interactive lab preview">
                <div className="sectionHeader">
                  <div>
                    <p className="eyebrow">
                      {activeLabCompletedMissionCount > 0
                        ? 'Continue lab'
                        : 'Ready bench'}
                    </p>
                    <h2>{activeLab.title}</h2>
                  </div>
                  <span className="bankBadge">
                    {activeLabCompletedMissionCount}/{activeLabMissions.length} missions
                  </span>
                </div>

                <div className="labGrid">
                  <LabSchematic compact lab={activeLab} values={labValues} />
                  <div className="labControls">
                    {activeLab.id === 'lab-ohms' ? (
                      <>
                        <label>
                          <span>Voltage</span>
                          <strong>{labValues.voltage} V</strong>
                          <input
                            max="24"
                            min="1"
                            onInput={(event) =>
                              handleLabValueChange('voltage', Number(event.currentTarget.value))
                            }
                            type="range"
                            value={labValues.voltage}
                          />
                        </label>
                        <label>
                          <span>Resistance</span>
                          <strong>{labValues.resistance} Ω</strong>
                          <input
                            max="48"
                            min="1"
                            onInput={(event) =>
                              handleLabValueChange('resistance', Number(event.currentTarget.value))
                            }
                            type="range"
                            value={labValues.resistance}
                          />
                        </label>
                        <div className="resultBox">
                          <span>Current</span>
                          <strong>{current.toFixed(2)} A</strong>
                          <small>I = V / R</small>
                        </div>
                      </>
                    ) : (
                      <div className="resultBox tall">
                        <span>{activeLab.metric}</span>
                        <strong>
                          {activeLab.id === 'lab-rc'
                            ? `${rcTimeConstant.toFixed(0)} ms`
                            : activeLab.id === 'lab-resonance'
                              ? `${resonanceFrequency.toFixed(0)} Hz f₀`
                            : activeLab.id === 'lab-filter'
                              ? `${filterOutput.toFixed(2)} V RMS`
                              : activeLab.id === 'lab-digital'
                                ? `${digitalTimingMargin.toFixed(1)} ns`
                                : activeLab.id === 'lab-opamp'
                                  ? `${Math.abs(opAmpOutput).toFixed(2)} Vpk`
                                  : activeLab.id === 'lab-bjt'
                                    ? `${bjtCollectorCurrent.toFixed(2)} mA IC`
                                  : activeLab.id === 'lab-mosfet'
                                    ? `${mosfetTotalLoss.toFixed(2)} W loss`
                                    : activeLab.id === 'lab-pid'
                                      ? `${pidSettlingTime.toFixed(2)} s settle`
                                      : activeLab.id === 'lab-adc'
                                        ? `${adcDisplayedFrequency.toFixed(2)} kHz`
                                      : activeLab.id === 'lab-transmission'
                                        ? `${transmissionVswr.toFixed(2)}:1 VSWR`
                                        : activeLab.id === 'lab-transformer'
                                          ? `${transformerSecondaryVoltage.toFixed(1)} V RMS`
                                        : `${threePhasePower.toFixed(2)} kW`}
                        </strong>
                        <small>{activeLab.assumptions}</small>
                      </div>
                    )}
                    <button
                      className="secondaryButton"
                      onClick={() => handleLabSelect(activeLab.id)}
                      type="button"
                    >
                      <Play size={16} />
                      {activeLabCompletedMissionCount > 0
                        ? 'Continue Interactive Lab'
                        : 'Open Interactive Lab'}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'labs' && (
              <section className="overviewCatalog" aria-labelledby="lab-catalog-title">
                <div className="sectionHeader">
                  <div>
                    <p className="eyebrow">Explore</p>
                    <h2 id="lab-catalog-title">Choose another bench</h2>
                  </div>
                  <span className="bankBadge">
                    {visibleLabCatalogCount}/{labCatalogTotalCount} benches
                  </span>
                </div>

                <div className="labCatalogToolbar">
                  <label className="labCatalogSearch">
                    <Search aria-hidden="true" size={17} />
                    <input
                      aria-label="Search labs"
                      onChange={(event) =>
                        setLabCatalogQuery(event.currentTarget.value)
                      }
                      placeholder="Search benches, topics, or formulas"
                      type="search"
                      value={labCatalogQuery}
                    />
                    {labCatalogQuery && (
                      <button
                        aria-label="Clear lab search"
                        onClick={() => setLabCatalogQuery('')}
                        title="Clear search"
                        type="button"
                      >
                        <XCircle aria-hidden="true" size={17} />
                      </button>
                    )}
                  </label>

                  <div
                    aria-label="Filter labs by progress"
                    className="labCatalogFilters"
                    role="group"
                  >
                    {LAB_CATALOG_FILTERS.map((filter) => {
                      const count =
                        filter.id === 'all'
                          ? labCatalogTotalCount
                          : labCatalogProgressCounts[filter.id];

                      return (
                        <button
                          aria-pressed={labCatalogFilter === filter.id}
                          className={
                            labCatalogFilter === filter.id ? 'active' : ''
                          }
                          key={filter.id}
                          onClick={() => setLabCatalogFilter(filter.id)}
                          type="button"
                        >
                          {filter.label}
                          <span>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="labCards" aria-label="Other labs and build tools">
                  {visibleLabCatalogEntries.map((entry) => (
                    <button
                      aria-label={`Open ${entry.lab.title}. ${entry.completedMissions} of ${entry.totalMissions} missions and ${entry.completedFaults} of ${entry.totalFaults} faults complete.`}
                      className="labCard"
                      data-progress={entry.progress}
                      key={entry.lab.id}
                      onClick={() => handleLabSelect(entry.lab.id)}
                      type="button"
                    >
                      <div className="labCardVisual" aria-hidden="true">
                        <LabSchematic compact lab={entry.lab} values={labValues} />
                        <span className="labCardLiveBadge">
                          <Activity size={13} />
                          Live
                        </span>
                      </div>
                      <div>
                        <span>{entry.lab.topic}</span>
                        <h3>{entry.lab.title}</h3>
                        <p>
                          {entry.lab.metric}: {entry.lab.result}
                        </p>
                      </div>
                      <em data-progress={entry.progress}>
                        {entry.completedMissions}/{entry.totalMissions} missions ·{' '}
                        {entry.completedFaults}/{entry.totalFaults} faults
                      </em>
                      <span
                        aria-hidden="true"
                        className="labCardSignalBus"
                        data-progress={entry.progress}
                      />
                    </button>
                  ))}
                  {showWorkbenchCatalogEntry && (
                    <button
                      aria-label={`Open Circuit Workbench. ${savedCircuitDesigns.length} of 6 designs saved.`}
                      className="labCard workbenchCard"
                      data-progress={workbenchCatalogProgress}
                      onClick={handleOpenCircuitWorkbench}
                      type="button"
                    >
                      <div className="labCardVisual workbench" aria-hidden="true">
                        <LabSchematic
                          compact
                          lab={labScenarios[0]}
                          values={labValues}
                        />
                        <span className="labCardLiveBadge build">
                          <Wrench size={13} />
                          Build
                        </span>
                      </div>
                      <div>
                        <span>Build Mode</span>
                        <h3>Circuit Workbench</h3>
                        <p>Series and parallel DC networks</p>
                      </div>
                      <em data-progress={workbenchCatalogProgress}>
                        {savedCircuitDesigns.length}/6 saved · live power check
                      </em>
                      <span
                        aria-hidden="true"
                        className="labCardSignalBus"
                        data-progress={workbenchCatalogProgress}
                      />
                    </button>
                  )}
                  {visibleLabCatalogCount === 0 && (
                    <div className="labCatalogEmpty" role="status">
                      <Search aria-hidden="true" size={24} />
                      <strong>No matching benches</strong>
                      <p>Try another topic or reset the progress filter.</p>
                      <button
                        onClick={() => {
                          setLabCatalogFilter('all');
                          setLabCatalogQuery('');
                        }}
                        type="button"
                      >
                        Reset filters
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeSection === 'careers' && (
              <>
                <section
                  className="careerSignalBand"
                  aria-labelledby="career-signal-title"
                >
                  <span className="careerSignalScore">
                    <GraduationCap size={22} />
                    <strong>{selectedCareerReadiness.score}%</strong>
                    <small>readiness</small>
                  </span>
                  <div className="careerSignalCopy">
                    <p className="eyebrow">
                      {selectedCareer.role === tunedCareerRole
                        ? 'Active career signal'
                        : 'Selected career signal'}
                    </p>
                    <h2 id="career-signal-title">{selectedCareer.role}</h2>
                    <p>{selectedCareer.focus}</p>
                  </div>
                  <div className="careerSignalActions">
                    {selectedCareer.role !== tunedCareerRole && (
                      <button
                        className="secondaryButton"
                        onClick={handleTunePathFromCareer}
                        type="button"
                      >
                        <Target size={16} />
                        Make active
                      </button>
                    )}
                    <button
                      className="primaryButton"
                      onClick={() => handleCareerSelect(selectedCareer.role)}
                      type="button"
                    >
                      Open path
                      <ArrowRight size={16} />
                    </button>
                    <button
                      className="secondaryButton"
                      onClick={handleOpenPortfolio}
                      type="button"
                    >
                      <Award size={16} />
                      Open Portfolio
                    </button>
                  </div>
                </section>

                <section
                  className="overviewCatalog"
                  aria-labelledby="career-catalog-title"
                >
                  <div className="sectionHeader">
                    <div>
                      <p className="eyebrow">Compare</p>
                      <h2 id="career-catalog-title">Explore other paths</h2>
                    </div>
                    <span className="bankBadge">
                      {visibleCareerTracks.length}/{careerTracks.length - 1} paths
                    </span>
                  </div>

                  <div className="careerCatalogToolbar">
                    <label className="careerCatalogSearch">
                      <Search aria-hidden="true" size={17} />
                      <input
                        aria-label="Search career paths"
                        onChange={(event) =>
                          setCareerCatalogQuery(event.currentTarget.value)
                        }
                        placeholder="Search roles, skills, or project work"
                        type="search"
                        value={careerCatalogQuery}
                      />
                      {careerCatalogQuery && (
                        <button
                          aria-label="Clear career search"
                          onClick={() => setCareerCatalogQuery('')}
                          title="Clear search"
                          type="button"
                        >
                          <XCircle aria-hidden="true" size={17} />
                        </button>
                      )}
                    </label>

                    <label className="careerCatalogSort">
                      <SlidersHorizontal aria-hidden="true" size={17} />
                      <span>Sort</span>
                      <select
                        aria-label="Sort career paths"
                        onChange={(event) =>
                          setCareerCatalogSort(
                            event.currentTarget.value as CareerCatalogSort,
                          )
                        }
                        value={careerCatalogSort}
                      >
                        <option value="match">Closest match</option>
                        <option value="growth">Growth opportunity</option>
                        <option value="name">Name A-Z</option>
                      </select>
                    </label>
                  </div>

                  <div className="careerGrid" aria-label="Other career tracks">
                    {visibleCareerTracks.map((track) => (
                        <button
                          aria-label={`Open ${track.role}, ${careerReadinessByRole[track.role]?.score ?? 0}% readiness`}
                          className="careerCard"
                          key={track.role}
                          onClick={() => handleCareerSelect(track.role)}
                          type="button"
                        >
                          <div className="matchDial">
                            <GraduationCap size={20} />
                            <strong>
                              {careerReadinessByRole[track.role]?.score ?? 0}%
                            </strong>
                            <span>readiness</span>
                          </div>
                          <div>
                            <h3>{track.role}</h3>
                            <p>{track.focus}</p>
                          </div>
                          <div className="chipRow">
                            {track.skills.map((skill) => (
                              <span key={skill}>{skill}</span>
                            ))}
                          </div>
                          <footer>
                            {track.role === tunedCareerRole
                              ? 'Active path'
                              : track.nextStep}
                            <ChevronRight size={16} />
                          </footer>
                        </button>
                      ))}
                    {visibleCareerTracks.length === 0 && (
                      <div className="careerCatalogEmpty" role="status">
                        <Search aria-hidden="true" size={24} />
                        <strong>No matching career paths</strong>
                        <p>Try a broader skill, role, or project term.</p>
                        <button
                          onClick={() => {
                            setCareerCatalogQuery('');
                            setCareerCatalogSort('match');
                          }}
                          type="button"
                        >
                          Reset career search
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            {activeSection === 'notebook' && (
              <>
                <NotebookLibraryTabs
                  activeView={notebookLibraryView}
                  benchRunCount={labRunHistory.length}
                  formulaCount={savedFormulaIds.length}
                  noteCount={fieldNoteCount}
                  onChange={(view) => {
                    setNotebookLibraryView(view);
                    if (view !== 'notes') {
                      setFocusedFieldNoteId(null);
                    }
                  }}
                  questionCount={savedQuestionLibraryItems.length}
                  studyListCount={studyListItems.length}
                />
                {notebookLibraryView === 'study-list' && (
                  <StudyListWorkspace
                    catalog={studyListCatalog}
                    items={studyListItems}
                    onAdd={handleAddStudyListItem}
                    onClearCompleted={handleClearCompletedStudyListItems}
                    onMove={handleMoveStudyListItem}
                    onOpen={handleOpenStudyListItem}
                    onRemove={handleRemoveStudyListItem}
                    onToggleComplete={handleToggleStudyListItemComplete}
                  />
                )}
                {notebookLibraryView === 'notes' && (
                  <FieldJournal
                    draftSeed={pendingFieldJournalDraft}
                    focusedNoteId={focusedFieldNoteId}
                    onDraftConsumed={() => setPendingFieldJournalDraft(null)}
                    onNotesChange={setFieldNotes}
                  />
                )}
                {notebookLibraryView === 'formulas' && (
                  <FormulaNotebookWorkspace
                    domainCount={notebookDomainCount}
                    entries={filteredFormulaEntries}
                    filter={notebookFilter}
                    formulaConfidence={formulaConfidence}
                    formulaReviewCompletions={formulaReviewCompletions}
                    learningCount={learningFormulaCount}
                    library={FORMULA_LIBRARY}
                    onEndReview={handleEndFormulaReview}
                    onFilterChange={setNotebookFilter}
                    onOpenSource={handleOpenFormulaSource}
                    onQueryChange={setNotebookQuery}
                    onRate={handleRateFormula}
                    onReveal={handleRevealFormula}
                    onStartReview={handleStartFormulaReview}
                    onToggleSaved={handleToggleFormula}
                    query={notebookQuery}
                    readyCount={readyFormulaCount}
                    recallXp={FORMULA_RECALL_XP}
                    reviewState={formulaReviewState}
                    rewardedFormulaIds={formulaReadyRewardedIds}
                    savedFormulaIds={savedFormulaIds}
                  />
                )}
                {notebookLibraryView === 'questions' && (
                  <SavedQuestionLibrary
                    items={savedQuestionLibraryItems}
                    onBrowse={() => handleSectionChange('bank')}
                    onOpen={(questionIndex) =>
                      handleOpenReviewQuestion(
                        questionIndex,
                        'Saved Questions',
                      )
                    }
                    onRemove={handleRemoveSavedQuestion}
                  />
                )}
                {notebookLibraryView === 'bench' && (
                  <BenchRunLibrary
                    getLabTitle={(labId) =>
                      labScenarios.find((lab) => lab.id === labId)?.title ??
                      'Saved lab'
                    }
                    onDelete={handleDeleteLabRun}
                    onOpen={handleOpenNotebookLabRun}
                    onOpenLabs={() => handleSectionChange('labs')}
                    runs={labRunHistory}
                  />
                )}
              </>
            )}

            {activeSection === 'bank' && (
              <section className="bankPanel bankWorkspace" aria-label="Question bank explorer">
                <div className="sectionHeader">
                  <div>
                    <p className="eyebrow">Mastery Explorer</p>
                    <h2>Question Bank</h2>
                  </div>
                  <span className="bankBadge">
                    {completedBankDiagnosticIds.length}/{BANK_COLLECTIONS.length} diagnostics
                  </span>
                </div>

                <section className="bankDiagnosticBand" aria-label="Recommended diagnostic">
                  <span className="bankDiagnosticIcon">
                    <RecommendedBankIcon size={26} />
                  </span>
                  <div>
                    <p className="eyebrow">Recommended diagnostic</p>
                    <h3>{recommendedBankCollection.label}</h3>
                    <p>{recommendedBankCollection.description}</p>
                  </div>
                  <div className="bankDiagnosticProgress">
                    <span>
                      <strong>{recommendedBankCollection.attempted}/5</strong>
                      topics explored
                    </span>
                    <div aria-label={`${recommendedBankCollection.attempted} of 5 topics explored`}>
                      <span
                        style={{
                          width: `${(recommendedBankCollection.attempted / 5) * 100}%`,
                        }}
                      />
                    </div>
                    <small>
                      {completedBankDiagnosticIds.includes(recommendedBankCollection.id)
                        ? 'Diagnostic complete'
                        : `First completion earns +${BANK_DIAGNOSTIC_BONUS_XP} XP`}
                    </small>
                  </div>
                  <button
                    className="primaryButton"
                    onClick={() =>
                      handleStartBankDiagnostic(recommendedBankCollection.id)
                    }
                    type="button"
                  >
                    {completedBankDiagnosticIds.includes(recommendedBankCollection.id)
                      ? 'Run again'
                      : 'Start diagnostic'}
                    <ArrowRight size={17} />
                  </button>
                </section>

                <section className="bankStateStrip" aria-label="Topic mastery summary">
                  <div>
                    <Sparkles size={18} />
                    <span>New</span>
                    <strong>{bankTopicStateCounts.new}</strong>
                  </div>
                  <div>
                    <CircleGauge size={18} />
                    <span>Practiced</span>
                    <strong>{bankTopicStateCounts.practiced}</strong>
                  </div>
                  <div className="review">
                    <RotateCcw size={18} />
                    <span>Review</span>
                    <strong>{bankTopicStateCounts.review}</strong>
                  </div>
                  <div className="mastered">
                    <CheckCircle2 size={18} />
                    <span>Mastered</span>
                    <strong>{bankTopicStateCounts.mastered}</strong>
                  </div>
                </section>

                <section className="bankCollectionSection" aria-label="Domain collections">
                  <header className="bankTopicHeader">
                    <div>
                      <p className="eyebrow">Domain diagnostics</p>
                      <h3>Choose a five-topic collection</h3>
                    </div>
                    <span>4 collections</span>
                  </header>

                  <div className="bankCollectionGrid">
                    {bankCollectionProgress.map((collection) => {
                      const Icon = collection.icon;
                      const isComplete = completedBankDiagnosticIds.includes(
                        collection.id,
                      );

                      return (
                        <article
                          className={
                            bankCollectionId === collection.id ? 'selected' : ''
                          }
                          key={collection.id}
                        >
                          <header>
                            <span>
                              <Icon size={20} />
                            </span>
                            <div>
                              <h4>{collection.label}</h4>
                              <p>{collection.description}</p>
                            </div>
                            {isComplete && (
                              <em>
                                <CheckCircle2 size={14} />
                                Complete
                              </em>
                            )}
                          </header>
                          <div className="bankCollectionMeter">
                            <span style={{ width: `${(collection.mastered / 5) * 100}%` }} />
                          </div>
                          <footer>
                            <small>
                              {collection.mastered}/5 mastered
                              {collection.review > 0
                                ? ` · ${collection.review} review`
                                : ''}
                            </small>
                            <button
                              onClick={() => {
                                setBankCollectionId(collection.id);
                                setBankTopicFilter('all');
                              }}
                              type="button"
                            >
                              View topics
                            </button>
                            <button
                              onClick={() => handleStartBankDiagnostic(collection.id)}
                              type="button"
                            >
                              {isComplete ? 'Run again' : 'Diagnose'}
                              <ArrowRight size={15} />
                            </button>
                          </footer>
                        </article>
                      );
                    })}
                  </div>
                </section>

                <section className="bankTopicSection" aria-label="Question bank topics">
                  <div className="bankTopicHeader">
                    <div>
                      <p className="eyebrow">Topic library</p>
                      <h3>Find your next verified check</h3>
                    </div>
                    <span>
                      {filteredBankTopics.length}/{topicSignals.length} topics
                    </span>
                  </div>

                  <div className="bankExplorerToolbar">
                    <label className="bankTopicSearch">
                      <Search size={17} />
                      <input
                        aria-label="Search Question Bank topics"
                        onChange={(event) => setBankTopicQuery(event.currentTarget.value)}
                        placeholder="Search topics"
                        type="search"
                        value={bankTopicQuery}
                      />
                    </label>

                    <div className="bankCollectionFilter" aria-label="Filter by collection">
                      <button
                        aria-pressed={bankCollectionId === 'all'}
                        className={bankCollectionId === 'all' ? 'active' : ''}
                        onClick={() => setBankCollectionId('all')}
                        type="button"
                      >
                        All domains
                      </button>
                      {BANK_COLLECTIONS.map((collection) => (
                        <button
                          aria-pressed={bankCollectionId === collection.id}
                          className={
                            bankCollectionId === collection.id ? 'active' : ''
                          }
                          key={collection.id}
                          onClick={() => setBankCollectionId(collection.id)}
                          type="button"
                        >
                          {collection.label.replace(' and ', ' + ')}
                        </button>
                      ))}
                    </div>

                    <div className="bankStatusFilter" aria-label="Filter by mastery">
                      {BANK_TOPIC_FILTERS.map((filter) => {
                        const filterCount =
                          filter.id === 'all'
                            ? bankTopicMastery.length
                            : bankTopicStateCounts[filter.id];

                        return (
                          <button
                            aria-pressed={bankTopicFilter === filter.id}
                            className={bankTopicFilter === filter.id ? 'active' : ''}
                            key={filter.id}
                            onClick={() => setBankTopicFilter(filter.id)}
                            type="button"
                          >
                            {filter.label}
                            <span>{filterCount}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bankExplorerGrid">
                    <div className="bankTopicGrid">
                      {filteredBankTopics.map((topic) => {
                        const StateIcon =
                          topic.state === 'mastered'
                            ? CheckCircle2
                            : topic.state === 'review'
                              ? RotateCcw
                              : topic.state === 'practiced'
                                ? CircleGauge
                                : Sparkles;
                        const stateLabel =
                          topic.state.charAt(0).toUpperCase() + topic.state.slice(1);

                        return (
                      <button
                        className={`bankTopicCard ${topic.state}`}
                        key={topic.id}
                        onClick={() => handleOpenTopicSample(topic.topic)}
                        type="button"
                      >
                        <header>
                          <span>
                            <StateIcon size={14} />
                            {stateLabel}
                          </span>
                          <small>
                            {BANK_COLLECTIONS.find(
                              (collection) => collection.id === topic.collectionId,
                            )?.label ?? 'Technical'}
                          </small>
                        </header>
                        <strong>{topic.topic}</strong>
                        <p>
                          {topic.questions.toLocaleString()} questions ·{' '}
                          {topic.imageCount.toLocaleString()} diagrams
                        </p>
                        <div className="bankTopicMeter">
                          <span
                            style={{
                              width: `${topic.attempts === 0 ? 0 : Math.max(8, topic.accuracy)}%`,
                            }}
                          />
                        </div>
                        <footer>
                          <span>
                            {topic.attempts === 0
                              ? `Levels ${topic.minLevel}-${topic.maxLevel}`
                              : `${topic.accuracy}% · ${topic.attempts} ${
                                  topic.attempts === 1 ? 'attempt' : 'attempts'
                                }`}
                          </span>
                          <ChevronRight size={16} />
                        </footer>
                      </button>
                        );
                      })}

                      {filteredBankTopics.length === 0 && (
                        <div className="bankTopicEmpty">
                          <Search size={22} />
                          <strong>No topics match these filters</strong>
                          <span>Try another mastery state, collection, or search.</span>
                          <button
                            onClick={() => {
                              setBankCollectionId('all');
                              setBankTopicFilter('all');
                              setBankTopicQuery('');
                            }}
                            type="button"
                          >
                            Clear filters
                          </button>
                        </div>
                      )}
                    </div>

                    <aside className="bankSmartQueue" aria-label="Recommended topic queue">
                      <header>
                        <span>
                          <Target size={19} />
                        </span>
                        <div>
                          <p className="eyebrow">Smart queue</p>
                          <h4>Three useful next checks</h4>
                        </div>
                      </header>
                      <p>
                        Missed topics come first, followed by practiced and untouched
                        areas.
                      </p>

                      <div>
                        {recommendedBankTopics.map((topic, index) => (
                          <button
                            key={topic.id}
                            onClick={() => handleOpenTopicSample(topic.topic)}
                            type="button"
                          >
                            <span>{index + 1}</span>
                            <div>
                              <strong>{topic.topic}</strong>
                              <small>
                                {topic.state === 'new'
                                  ? 'New topic'
                                  : topic.state === 'review'
                                    ? 'Review last miss'
                                    : `${topic.accuracy}% across ${topic.attempts} ${
                                        topic.attempts === 1 ? 'attempt' : 'attempts'
                                      }`}
                              </small>
                            </div>
                            <ChevronRight size={16} />
                          </button>
                        ))}
                      </div>

                      <button
                        className="secondaryButton fullWidth"
                        onClick={() => handleStartBankDiagnostic(recommendedBankCollection.id)}
                        type="button"
                      >
                        Start recommended diagnostic
                        <ArrowRight size={16} />
                      </button>
                    </aside>
                  </div>
                </section>

                <div className="bankTrustStrip" aria-label="Question Bank verification">
                  {bankSignals.map((signal) => (
                    <div key={signal.label}>
                      <span>{signal.label}</span>
                      <strong>{signal.value}</strong>
                      <small>{signal.detail}</small>
                    </div>
                  ))}
                  <button onClick={handlePreviewBank} type="button">
                    Open verified sample
                    <ArrowRight size={16} />
                  </button>
                </div>
              </section>
            )}
          </section>

          </div>
        )}
            </>
          )}
        </Suspense>
      </main>

      <nav className="mobileDock" aria-label="Mobile navigation">
        {mobileNavigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = !mobileMoreActive && activeSection === item.id;

          return (
            <button
              aria-current={isActive ? 'page' : undefined}
              className={isActive ? 'active' : ''}
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              onFocus={() => preloadAppSection(item.id)}
              onPointerEnter={() => preloadAppSection(item.id)}
              type="button"
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          aria-current={mobileMoreActive ? 'page' : undefined}
          aria-expanded={overlay === 'menu'}
          className={mobileMoreActive ? 'active' : ''}
          onClick={() => setOverlay('menu')}
          type="button"
        >
          <Menu size={19} />
          <span>More</span>
        </button>
      </nav>

      {overlay && (
        <OverlayPanel
          activeSection={activeSection}
          activeSessionCount={activeSessionResults.length}
          activityResults={quickSearchResults}
          appLockConfig={appLockConfig}
          dailyMissionCompletedCount={dailyMissionCompletedCount}
          dailyMissionTotal={dailyMissions.length}
          dailyGoal={dailyGoal}
          deviceAlertPermission={deviceAlertPermission}
          deviceAlertsEnabled={deviceAlertsEnabled}
          fullHeartRechargeMs={fullHeartRechargeMs}
          heartsRemaining={heartsRemaining}
          highContrastEnabled={highContrastEnabled}
          isAppInstalled={isAppInstalled}
          lastSavedAt={lastSavedAt}
          learnerInitials={learnerInitials}
          learnerProfile={learnerProfile}
          maxHearts={MAX_HEARTS}
          nextHeartInMs={nextHeartInMs}
          notificationReadKeys={readNotificationKeys}
          notifications={liveNotifications}
          onActivityResultSelect={handleSearchResultSelect}
          onAppLockDisable={handleDisableAppLock}
          onAppLockEnable={handleEnableAppLock}
          onAppLockHiddenChange={handleAppLockHiddenChange}
          onAppLockPinChange={handleChangeAppLockPin}
          onAppLockTimeoutChange={handleAppLockTimeoutChange}
          onClose={() => setOverlay(null)}
          onDailyGoalChange={setDailyGoal}
          onDeviceAlertsEnabledChange={handleDeviceAlertsEnabledChange}
          onHighContrastEnabledChange={setHighContrastEnabled}
          onInstallApp={handleInstallApp}
          onLearnerProfileChange={setLearnerProfile}
          onLockAppNow={handleLockAppNow}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onNotificationAction={handleNotificationAction}
          onNotificationReadChange={handleNotificationReadChange}
          onOpenProgress={handleOpenProgress}
          onOverlayChange={setOverlay}
          onPracticeWithHeartsChange={setPracticeWithHearts}
          onReadingSizeChange={setReadingSize}
          onReducedMotionEnabledChange={setReducedMotionEnabled}
          onSaveToolkitCalculation={handleOpenFieldJournal}
          onSectionChange={handleSectionChange}
          onSignOut={handleSignOut}
          onSoundEnabledChange={setSoundEnabled}
          overlay={overlay}
          practiceWithHearts={practiceWithHearts}
          readingSize={readingSize}
          reducedMotionEnabled={reducedMotionEnabled}
          reviewDueCount={reviewQuestionIds.length}
          saveStatus={saveStatus}
          soundEnabled={soundEnabled}
          supportsAppInstall={installPrompt !== null}
        />
      )}
      <Suspense fallback={null}>
        <ZyTutor
          coach={
            <ZyGuide
              compact
              label="Zy / Tutor"
              messages={[
                `I am following ${tutorContext.title}, so every answer stays connected to what you are doing now.`,
                'Ask for a hint when you want structure without losing the chance to solve it yourself.',
                'Use the action rail to move straight from an explanation into deliberate practice.',
              ]}
              mood={
                tutorContext.kind === 'career'
                  ? 'celebrate'
                  : tutorContext.kind === 'question'
                    ? 'focus'
                    : 'idle'
              }
              showTutorShortcut={false}
            />
          }
          context={tutorContext}
          onAction={handleTutorAction}
          onClose={() => setTutorOpen(false)}
          open={tutorOpen}
        />
      </Suspense>
      </div>
    </ZyTutorLaunchContext.Provider>
  );
}

type ReviewPlanPageProps = {
  backLabel: string;
  includeNew: boolean;
  items: ReviewPlanItem[];
  length: CustomSessionLength;
  onBack: () => void;
  onIncludeNewChange: (includeNew: boolean) => void;
  onLengthChange: (length: CustomSessionLength) => void;
  onOpenQuestion: (questionIndex: number) => void;
  onStart: () => void;
  statusCounts: Record<ReviewStatus, number>;
  totalQuestions: number;
};

function ReviewPlanPage({
  backLabel,
  includeNew,
  items,
  length,
  onBack,
  onIncludeNewChange,
  onLengthChange,
  onOpenQuestion,
  onStart,
  statusCounts,
  totalQuestions,
}: ReviewPlanPageProps) {
  const potentialXp = items.reduce(
    (total, item) => total + item.question.xp,
    0,
  );
  const statusLabels: Record<ReviewStatus, string> = {
    due: 'Due now',
    learning: 'Learning',
    new: 'New',
    strong: 'Strong',
  };
  const reviewGuideMessages = [
    statusCounts.due > 0
      ? `${statusCounts.due} scheduled checks are ready. Start with the due items while recall still takes effort.`
      : 'Your scheduled checks are clear. A small mixed set will keep recall active.',
    'Keep the session short enough to finish, then let the intervals do the spacing work.',
  ];
  const reviewGuideMood: ZyGuideMood =
    statusCounts.due > 0 ? 'focus' : 'celebrate';

  return (
    <section className="reviewPlanPage" aria-label="Smart review plan">
      <header className="reviewPlanHeader">
        <button
          className="secondaryButton compactHeaderBack"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          {backLabel}
        </button>

        <div>
          <p className="eyebrow">Review Radar</p>
          <h1>Review Plan</h1>
          <p>Turn weak signals into stable recall.</p>
        </div>

        <button className="primaryButton" onClick={onStart} type="button">
          <Play size={17} />
          Start {items.length}-question review
        </button>
      </header>

      <section className="reviewStatusBand" aria-label="Memory status summary">
        {(
          [
            ['due', 'Due now', RotateCcw],
            ['learning', 'Learning', BrainCircuit],
            ['strong', 'Strong', CheckCircle2],
            ['new', 'New', Sparkles],
          ] as Array<[ReviewStatus, string, typeof RotateCcw]>
        ).map(([status, label, Icon]) => (
          <div className={status} key={status}>
            <span>
              <Icon size={19} />
            </span>
            <div>
              <strong>{statusCounts[status]}</strong>
              <small>{label}</small>
            </div>
          </div>
        ))}
      </section>

      <ZyGuide
        className="reviewMobileCoach"
        compact
        label="Zy / Review coach"
        messages={reviewGuideMessages}
        mood={reviewGuideMood}
      />

      <div className="reviewPlanLayout">
        <section className="reviewQueue" aria-labelledby="review-queue-title">
          <header>
            <div>
              <p className="eyebrow">Next checks</p>
              <h2 id="review-queue-title">Ranked review queue</h2>
            </div>
            <span>{items.length}/{totalQuestions} selected</span>
          </header>

          <div className="reviewQueueList">
            {items.map((item, index) => (
              <article className={`reviewQueueItem ${item.status}`} key={item.question.id}>
                <span className="reviewQueueIndex">{index + 1}</span>

                <div className="reviewQueueCopy">
                  <div>
                    <span className={`reviewStatusTag ${item.status}`}>
                      {statusLabels[item.status]}
                    </span>
                    <small>
                      Level {item.question.difficulty} · {item.question.difficultyLabel}
                    </small>
                  </div>
                  <strong>{item.question.subtopic}</strong>
                  <span>{item.question.topic}</span>
                </div>

                <div className="reviewQueueReason">
                  <span>Priority</span>
                  <strong>{item.reason}</strong>
                  <small>{item.dueLabel}</small>
                </div>

                <div className="reviewQueueStrength">
                  <span>
                    <small>Memory</small>
                    <strong>{item.strength}%</strong>
                  </span>
                  <div aria-label={`${item.strength}% memory strength`}>
                    <span style={{ width: `${item.strength}%` }} />
                  </div>
                  <small>
                    {item.accuracy === null
                      ? 'No attempts'
                      : `${item.accuracy}% accuracy`}
                  </small>
                </div>

                <button
                  aria-label={`Open ${item.question.subtopic}`}
                  className="reviewQueueOpen"
                  onClick={() => onOpenQuestion(item.questionIndex)}
                  title={`Open ${item.question.subtopic}`}
                  type="button"
                >
                  <ChevronRight size={18} />
                </button>
              </article>
            ))}
          </div>
        </section>

        <aside className="reviewPlanControls" aria-label="Review session controls">
          <header>
            <span>
              <SlidersHorizontal size={20} />
            </span>
            <div>
              <p className="eyebrow">Session</p>
              <h2>Review setup</h2>
            </div>
          </header>

          <ZyGuide
            className="reviewPlanCoach"
            compact
            label="Zy / Review coach"
            messages={reviewGuideMessages}
            mood={reviewGuideMood}
          />

          <fieldset className="reviewLengthControl">
            <legend>Session size</legend>
            <div>
              {([5, 10] as CustomSessionLength[]).map((option) => (
                <button
                  aria-pressed={length === option}
                  className={length === option ? 'active' : ''}
                  key={option}
                  onClick={() => onLengthChange(option)}
                  type="button"
                >
                  <strong>{option}</strong>
                  <span>questions</span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className="reviewNewToggle">
            <input
              checked={includeNew}
              onChange={(event) =>
                onIncludeNewChange(event.currentTarget.checked)
              }
              type="checkbox"
            />
            <span>
              <strong>Include new topics</strong>
              <small>Fill open slots with fresh material</small>
            </span>
          </label>

          <div className="reviewSessionMetrics">
            <div>
              <span>Due first</span>
              <strong>{Math.min(statusCounts.due, items.length)}</strong>
            </div>
            <div>
              <span>Potential</span>
              <strong>+{potentialXp} XP</strong>
            </div>
          </div>

          <div className="reviewIntervalLadder">
            <span>Recall intervals</span>
            <div>
              {['10m', '1d', '3d', '7d', '14d'].map((interval, index) => (
                <span key={interval}>
                  <strong>{index + 1}</strong>
                  <small>{interval}</small>
                </span>
              ))}
            </div>
          </div>

          <button className="primaryButton fullWidth" onClick={onStart} type="button">
            <Play size={17} />
            Start Smart Review
          </button>
        </aside>
      </div>
    </section>
  );
}

type LessonFocusPageProps = {
  answerConfidence: AnswerConfidence | null;
  backLabel: string;
  bookmarkedCount: number;
  currentQuestion: LessonQuestion;
  currentQuestionIndex: number;
  currentQuestionMastery?: QuestionMasteryRecord;
  heartsEnabled: boolean;
  heartsRemaining: number;
  isBookmarked: boolean;
  isCorrect: boolean;
  isFormulaSaved: boolean;
  isSprintActive: boolean;
  isSprintReadyForSummary: boolean;
  maxHearts: number;
  nextHeartInMs: number;
  onAnswer: (optionIndex: number) => void;
  onBack: () => void;
  onCancelSprint: () => void;
  onConfidenceChange: (confidence: AnswerConfidence) => void;
  onNextPrompt: () => void;
  onOpenAtlasConcept: (conceptId: string) => void;
  onOpenAtlasGame: (gameId: string) => void;
  onOpenJournal: (scratchpad?: string) => void;
  onOpenHearts: () => void;
  onPracticeModeChange: (mode: PracticeMode) => void;
  onToggleBookmark: () => void;
  onToggleFormula: () => void;
  practiceMode: PracticeMode;
  questProgress: number;
  reviewCount: number;
  selectedOption: number | null;
  sprintAnswered: number;
  sprintLabel: string;
  sprintPosition: number;
  sprintTarget: number;
  skillTitle: string;
  totalQuestions: number;
};

function LessonFocusPage({
  answerConfidence,
  backLabel,
  bookmarkedCount,
  currentQuestion,
  currentQuestionIndex,
  currentQuestionMastery,
  heartsEnabled,
  heartsRemaining,
  isBookmarked,
  isCorrect,
  isFormulaSaved,
  isSprintActive,
  isSprintReadyForSummary,
  maxHearts,
  nextHeartInMs,
  onAnswer,
  onBack,
  onCancelSprint,
  onConfidenceChange,
  onNextPrompt,
  onOpenAtlasConcept,
  onOpenAtlasGame,
  onOpenJournal,
  onOpenHearts,
  onPracticeModeChange,
  onToggleBookmark,
  onToggleFormula,
  practiceMode,
  questProgress,
  reviewCount,
  selectedOption,
  sprintAnswered,
  sprintLabel,
  sprintPosition,
  sprintTarget,
  skillTitle,
  totalQuestions,
}: LessonFocusPageProps) {
  const [hintStep, setHintStep] = useState(0);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [scratchpad, setScratchpad] = useState(() =>
    readQuestionScratchpad(currentQuestion.id),
  );
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const nextPromptButtonRef = useRef<HTMLButtonElement>(null);
  const isOutOfHearts = heartsEnabled && heartsRemaining === 0;
  const heartCountdown = formatHeartCountdown(nextHeartInMs);
  const heartMeterLabel = heartsEnabled
    ? heartsRemaining < maxHearts
      ? `${heartsRemaining}/${maxHearts} · ${heartCountdown}`
      : `${heartsRemaining}/${maxHearts}`
    : 'Unlimited';
  const atlasConcept = getQuestionAtlasConcept(currentQuestion.topic);
  const atlasGame = getQuestionAtlasGame(currentQuestion.topic);
  const guideMood: ZyGuideMood =
    selectedOption === null ? 'focus' : isCorrect ? 'celebrate' : 'retry';
  const guideLabel =
    selectedOption === null ? 'Zy / Question coach' : isCorrect ? 'Zy / Nice work' : 'Zy / Recheck';
  const guideMessages =
    selectedOption === null
      ? [
          `This is a level ${currentQuestion.difficulty} ${currentQuestion.subtopic} check. Start with the governing relationship.`,
          'Read every unit, estimate the result, then compare it with the choices.',
        ]
      : isCorrect
        ? [
            `Correct. You earned ${currentQuestion.xp} XP and strengthened ${currentQuestion.subtopic}.`,
            'Keep the relationship in mind as the next prompt changes the numbers.',
          ]
        : [
            'Use the verified explanation below to find the step that changed the result.',
            'Rebuild the relationship from the known values before moving on.',
          ];
  const currentAccuracy =
    currentQuestionMastery && currentQuestionMastery.attempts > 0
      ? Math.round(
          (currentQuestionMastery.correct / currentQuestionMastery.attempts) * 100,
        )
      : null;
  const currentReviewStatus = getReviewStatus(
    currentQuestionMastery,
    Date.now(),
  );
  const currentReviewTiming = currentQuestionMastery
    ? formatReviewTiming(currentQuestionMastery.nextReviewAt, Date.now())
    : 'Not scheduled';
  const currentReviewLabel: Record<ReviewStatus, string> = {
    due: 'Due now',
    learning: 'Learning',
    new: 'New',
    strong: 'Strong',
  };
  const confidenceFeedback =
    selectedOption !== null && answerConfidence
      ? getConfidenceFeedback(
          answerConfidence,
          isCorrect ? 'correct' : 'wrong',
        )
      : null;
  const previousConfidenceLabel = currentQuestionMastery?.lastConfidence
    ? ANSWER_CONFIDENCE_OPTIONS.find(
        (option) => option.id === currentQuestionMastery.lastConfidence,
      )?.label
    : null;

  useEffect(() => {
    setHintStep(0);
    setEliminatedOptions([]);
    setScratchpad(readQuestionScratchpad(currentQuestion.id));
    setScratchpadOpen(false);
  }, [currentQuestion.id]);

  function handleScratchpadChange(value: string) {
    const nextScratchpad = value.slice(0, QUESTION_SCRATCHPAD_LIMIT);
    setScratchpad(nextScratchpad);
    saveQuestionScratchpad(currentQuestion.id, nextScratchpad);
  }

  function handleToggleEliminatedOption(optionIndex: number) {
    setEliminatedOptions((currentOptions) =>
      currentOptions.includes(optionIndex)
        ? currentOptions.filter((index) => index !== optionIndex)
        : [...currentOptions, optionIndex],
    );
  }

  useEffect(() => {
    function handleLessonKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          'input, textarea, select, [contenteditable="true"], [role="dialog"], [role="combobox"]',
        )
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const shouldAdvance =
        key === 'enter' &&
        selectedOption !== null &&
        (target === nextPromptButtonRef.current ||
          target === document.body ||
          target === document.documentElement ||
          target?.tagName === 'MAIN');

      if (shouldAdvance) {
        event.preventDefault();
        onNextPrompt();
        return;
      }

      if (key === 'h' && selectedOption === null && hintStep < 2) {
        event.preventDefault();
        setHintStep((step) => Math.min(2, step + 1));
        return;
      }

      const letterIndex =
        key.length === 1 && key >= 'a' && key <= 'f'
          ? key.charCodeAt(0) - 97
          : -1;
      const numberIndex =
        key.length === 1 && key >= '1' && key <= '6'
          ? Number(key) - 1
          : -1;
      const optionIndex = letterIndex >= 0 ? letterIndex : numberIndex;

      if (
        selectedOption === null &&
        !isOutOfHearts &&
        !eliminatedOptions.includes(optionIndex) &&
        optionIndex >= 0 &&
        optionIndex < currentQuestion.options.length
      ) {
        event.preventDefault();
        onAnswer(optionIndex);
      }
    }

    window.addEventListener('keydown', handleLessonKeyDown);
    return () => window.removeEventListener('keydown', handleLessonKeyDown);
  }, [
    currentQuestion.options.length,
    eliminatedOptions,
    hintStep,
    isOutOfHearts,
    onAnswer,
    onNextPrompt,
    selectedOption,
  ]);

  useEffect(() => {
    if (
      selectedOption === null ||
      (isOutOfHearts && !isSprintReadyForSummary)
    ) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      nextPromptButtonRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [isOutOfHearts, isSprintReadyForSummary, selectedOption]);

  return (
    <section className="lessonFocusPage" aria-label="Lesson question page">
      <header className="lessonPageHeader">
        <button
          className="secondaryButton lessonBackButton compactHeaderBack"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          {backLabel}
        </button>

        <div>
          <p className="eyebrow">
            Practice / {isSprintActive ? sprintLabel : skillTitle}
          </p>
          <h1>{currentQuestion.topic}</h1>
          <p>
            {currentQuestion.subtopic} · Level {currentQuestion.difficulty}/{bankSummary.levels} ·{' '}
            {currentQuestion.difficultyLabel}
          </p>
        </div>

        <div className="lessonPageStats" aria-label="Prompt progress">
          <span>
            {isSprintActive
              ? `Sprint ${sprintPosition}/${sprintTarget}`
              : `Prompt ${currentQuestionIndex + 1}/${totalQuestions}`}
          </span>
          <strong>+{currentQuestion.xp} XP</strong>
          <button
            className={`lessonHeartMeter ${isOutOfHearts ? 'empty' : ''}`}
            onClick={onOpenHearts}
            type="button"
          >
            <Heart fill={heartsEnabled && heartsRemaining > 0 ? 'currentColor' : 'none'} size={16} />
            <span>{heartMeterLabel}</span>
          </button>
          <button
            aria-pressed={isBookmarked}
            className={`bookmarkQuestionButton ${isBookmarked ? 'saved' : ''}`}
            onClick={onToggleBookmark}
            type="button"
          >
            {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            <span>{isBookmarked ? 'Saved' : 'Save question'}</span>
          </button>
          <button
            aria-pressed={isFormulaSaved}
            className={`notebookFormulaButton ${
              isFormulaSaved ? 'saved' : ''
            }`}
            onClick={onToggleFormula}
            type="button"
          >
            <NotebookTabs size={16} />
            <span>{isFormulaSaved ? 'In notebook' : 'Save formula'}</span>
          </button>
        </div>
      </header>

      {isSprintActive ? (
        <section className="sprintProgressBar" aria-label={`${sprintLabel} progress`}>
          <span className="sprintProgressIcon">
            <Trophy size={19} />
          </span>
          <div>
            <span>{sprintLabel}</span>
            <strong>
              {sprintAnswered}/{sprintTarget} answered
            </strong>
          </div>
          <div
            className="sprintProgressMeter"
            aria-label={`${Math.round((sprintAnswered / sprintTarget) * 100)}% complete`}
          >
            <span style={{ width: `${(sprintAnswered / sprintTarget) * 100}%` }} />
          </div>
          <button onClick={onCancelSprint} type="button">
            <XCircle size={16} />
            Exit sprint
          </button>
        </section>
      ) : (
        <nav className="practiceModeBar" aria-label="Practice mode">
          {PRACTICE_MODES.map((mode) => {
            const Icon = mode.icon;
            const count =
              mode.id === 'review'
                ? reviewCount
                : mode.id === 'saved'
                  ? bookmarkedCount
                  : null;

            return (
              <button
                aria-pressed={practiceMode === mode.id}
                className={practiceMode === mode.id ? 'active' : ''}
                key={mode.id}
                onClick={() => onPracticeModeChange(mode.id)}
                type="button"
              >
                <Icon size={17} />
                <span>{mode.label}</span>
                {count !== null && <em>{count}</em>}
              </button>
            );
          })}
        </nav>
      )}

      <ZyGuide
        className="practiceMobileCoach"
        compact
        label={guideLabel}
        messages={guideMessages}
        mood={guideMood}
      />

      <div className="lessonFocusGrid">
        <article className="lessonQuestionCard">
          <div className="questionBlock lessonQuestionBlock">
            <div className="questionMetaLine">
              <span>
                Level {currentQuestion.difficulty}/{bankSummary.levels} ·{' '}
                {currentQuestion.difficultyLabel}
              </span>
              <strong className="verifiedBadge">
                <CheckCircle2 size={15} />
                Verified v{currentQuestion.contentVersion}
              </strong>
            </div>
            <h2>{currentQuestion.prompt}</h2>
            {currentQuestion.visualValues.length > 0 && (
              <div className="questionGivenRow" aria-label="Given values">
                <span>Given</span>
                {currentQuestion.visualValues.map((value) => (
                  <strong key={value}>{value}</strong>
                ))}
              </div>
            )}
          </div>

          <div className="questionWorkTools">
            <button
              aria-expanded={scratchpadOpen}
              className={scratchpadOpen ? 'active' : ''}
              onClick={() => setScratchpadOpen((isOpen) => !isOpen)}
              type="button"
            >
              <NotebookPen size={17} />
              <span>Scratchpad</span>
              {scratchpad.trim() && <em>Saved</em>}
            </button>
            {selectedOption === null && eliminatedOptions.length > 0 && (
              <button
                onClick={() => setEliminatedOptions([])}
                type="button"
              >
                <RotateCcw size={16} />
                <span>Restore {eliminatedOptions.length}</span>
              </button>
            )}
          </div>

          {scratchpadOpen && (
            <section className="questionScratchpad" aria-label="Question scratchpad">
              <header>
                <span>
                  <NotebookPen size={17} />
                  <strong>Scratchpad</strong>
                </span>
                <button
                  aria-label="Clear scratchpad"
                  disabled={!scratchpad}
                  onClick={() => handleScratchpadChange('')}
                  title="Clear scratchpad"
                  type="button"
                >
                  <XCircle size={16} />
                </button>
              </header>
              <textarea
                aria-label="Scratchpad notes"
                maxLength={QUESTION_SCRATCHPAD_LIMIT}
                onChange={(event) =>
                  handleScratchpadChange(event.currentTarget.value)
                }
                placeholder="Equations and reasoning"
                rows={4}
                value={scratchpad}
              />
              <footer>
                <span>
                  {scratchpad.length}/{QUESTION_SCRATCHPAD_LIMIT}
                </span>
                <button
                  disabled={!scratchpad.trim()}
                  onClick={() => onOpenJournal(scratchpad)}
                  type="button"
                >
                  <NotebookTabs size={16} />
                  Save as field note
                </button>
              </footer>
            </section>
          )}

          {selectedOption === null && (
            <div className={`hintRail ${hintStep > 0 ? 'open' : ''}`}>
              <div className="hintRailHeader">
                <span>
                  <Lightbulb size={18} />
                  <strong>{hintStep === 0 ? 'Need a nudge?' : 'Guided hint'}</strong>
                </span>
                <button
                  aria-keyshortcuts="H"
                  aria-expanded={hintStep > 0}
                  disabled={hintStep >= 2}
                  onClick={() => setHintStep((step) => Math.min(2, step + 1))}
                  type="button"
                >
                  {hintStep === 0
                    ? 'Show hint'
                    : hintStep === 1
                      ? 'Next hint'
                      : 'Hints shown'}
                  {hintStep < 2 && <ChevronRight size={16} />}
                </button>
              </div>

              {hintStep >= 1 && (
                <div className="hintStep">
                  <span>1</span>
                  <p>
                    Start with <strong>{currentQuestion.formula}</strong>. Match each given
                    value to a symbol before calculating.
                  </p>
                </div>
              )}

              {hintStep >= 2 && (
                <div className="hintStep">
                  <span>2</span>
                  <p>
                    Use <strong>{currentQuestion.assumptions}</strong>, then estimate the
                    result and eliminate choices with the wrong scale or unit.
                  </p>
                </div>
              )}
            </div>
          )}

          {isOutOfHearts && (
            <button className="heartLockBanner" onClick={onOpenHearts} type="button">
              <Heart size={20} />
              <span>
                <strong>Out of hearts</strong>
                <small>Next heart in {heartCountdown}.</small>
              </span>
              <ChevronRight size={18} />
            </button>
          )}

          <div
            className={`confidenceCheck ${
              selectedOption !== null ? 'answered' : ''
            }`}
          >
            <span className="confidencePrompt">
              <CircleGauge size={18} />
              <strong>Confidence</strong>
              {selectedOption === null && previousConfidenceLabel && (
                <small>Last: {previousConfidenceLabel}</small>
              )}
            </span>
            <div
              aria-label="Answer confidence"
              className="confidenceOptions"
              role="group"
            >
              {ANSWER_CONFIDENCE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = answerConfidence === option.id;

                return (
                  <button
                    aria-pressed={isActive}
                    className={isActive ? 'active' : ''}
                    disabled={selectedOption !== null}
                    key={option.id}
                    onClick={() => onConfidenceChange(option.id)}
                    type="button"
                  >
                    <Icon size={15} />
                    {option.label}
                  </button>
                );
              })}
            </div>
            {confidenceFeedback && (
              <span
                className={`confidenceOutcome ${confidenceFeedback.tone}`}
                role="status"
              >
                {confidenceFeedback.tone === 'aligned' ? (
                  <CheckCircle2 size={16} />
                ) : confidenceFeedback.tone === 'caution' ? (
                  <TriangleAlert size={16} />
                ) : (
                  <BrainCircuit size={16} />
                )}
                {confidenceFeedback.label}
              </span>
            )}
          </div>

          <div className="optionGrid lessonOptionGrid">
            {currentQuestion.options.map((option, optionIndex) => {
              const wasSelected = selectedOption === optionIndex;
              const isAnswer = optionIndex === currentQuestion.correctIndex;
              const showCorrect = selectedOption !== null && isAnswer;
              const showWrong = wasSelected && !isAnswer;
              const isEliminated = eliminatedOptions.includes(optionIndex);

              return (
                <div
                  className={`answerChoiceRow ${isEliminated ? 'eliminated' : ''}`}
                  key={option}
                >
                  <button
                    aria-keyshortcuts={`${String.fromCharCode(65 + optionIndex)} ${
                      optionIndex + 1
                    }`}
                    aria-label={`Option ${String.fromCharCode(65 + optionIndex)}: ${option}`}
                    className={`answerButton ${showCorrect ? 'correct' : ''} ${showWrong ? 'wrong' : ''}`}
                    disabled={isOutOfHearts || selectedOption !== null || isEliminated}
                    onClick={() => onAnswer(optionIndex)}
                    type="button"
                  >
                    <span>{String.fromCharCode(65 + optionIndex)}</span>
                    {option}
                  </button>
                  <button
                    aria-label={`${isEliminated ? 'Restore' : 'Eliminate'} option ${String.fromCharCode(65 + optionIndex)}`}
                    aria-pressed={isEliminated}
                    className="optionEliminateButton"
                    disabled={selectedOption !== null}
                    onClick={() => handleToggleEliminatedOption(optionIndex)}
                    title={`${isEliminated ? 'Restore' : 'Eliminate'} option ${String.fromCharCode(65 + optionIndex)}`}
                    type="button"
                  >
                    {isEliminated ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              );
            })}
          </div>

          {selectedOption !== null && (
            <div
              aria-live="polite"
              className={`feedbackBox ${isCorrect ? 'success' : 'error'}`}
              role="status"
            >
              {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <div>
                <strong>{isCorrect ? 'Correct' : 'Review the relationship'}</strong>
                <em className={`reviewQueueNote ${isCorrect ? 'scheduled' : ''}`}>
                  {isCorrect
                    ? `Next review: ${currentReviewTiming.toLowerCase()}`
                    : 'Added to your review queue'}
                </em>
                <p className="solutionLead">{currentQuestion.solution}</p>
                <div className="solutionDetails">
                  <div>
                    <span>Relation</span>
                    <strong>{currentQuestion.formula}</strong>
                  </div>
                  <div>
                    <span>Assumptions</span>
                    <strong>{currentQuestion.assumptions}</strong>
                  </div>
                </div>
                <small>{currentQuestion.careerContext}</small>
              </div>
            </div>
          )}

          {selectedOption !== null && atlasConcept && (
            <section
              aria-label="Related interactive learning"
              className="questionAtlasActions"
            >
              <div>
                <span>
                  <Atom size={18} />
                </span>
                <div>
                  <small>Related Atlas concept</small>
                  <strong>{atlasConcept.title}</strong>
                </div>
              </div>
              <div>
                <button
                  onClick={() => onOpenAtlasConcept(atlasConcept.id)}
                  type="button"
                >
                  Explore model
                  <ArrowRight size={16} />
                </button>
                {atlasGame && (
                  <button
                    onClick={() => onOpenAtlasGame(atlasGame.id)}
                    type="button"
                  >
                    <Gamepad2 size={16} />
                    Play {atlasGame.title}
                  </button>
                )}
              </div>
            </section>
          )}

          <button
            aria-keyshortcuts={selectedOption !== null ? 'Enter' : undefined}
            className="primaryButton fullWidth"
            onClick={
              isOutOfHearts && !isSprintReadyForSummary ? onOpenHearts : onNextPrompt
            }
            ref={nextPromptButtonRef}
            type="button"
          >
            {isSprintReadyForSummary
              ? 'View Sprint Results'
              : isOutOfHearts
                ? `Next heart in ${heartCountdown}`
              : selectedOption === null
                ? 'Skip Prompt'
                : 'Next Prompt'}
            <ArrowRight size={18} />
          </button>
        </article>

        <aside className="lessonSupportPanel" aria-label="Lesson diagram and quest">
          <ZyGuide
            className="practiceInlineCoach"
            compact
            label={guideLabel}
            messages={guideMessages}
            mood={guideMood}
          />

          <Suspense
            fallback={
              <QuestionVisualStageFallback label={currentQuestion.visualLabel} />
            }
          >
            <QuestionVisualStage
              key={currentQuestion.id}
              onOpenAtlasConcept={onOpenAtlasConcept}
              onOpenAtlasGame={onOpenAtlasGame}
              question={currentQuestion}
              revealed={selectedOption !== null}
            />
          </Suspense>

          <div className="questStrip">
            <div>
              <strong>Daily quest</strong>
              <span>Work through 3 prompts</span>
            </div>
            <div className="questMeter" aria-label="Daily quest progress">
              <span style={{ width: `${questProgress}%` }} />
            </div>
          </div>

          <div className="lessonPageMeta">
            <span>Question skill</span>
            <strong>{currentQuestion.subtopic}</strong>
            <p>
              Level {currentQuestion.difficulty} of {bankSummary.levels} ·{' '}
              {currentQuestion.difficultyLabel}
            </p>
            <div className="questionHistory">
              <span>YOUR HISTORY</span>
              <strong>
                {currentAccuracy === null
                  ? 'First attempt'
                  : `${currentAccuracy}% across ${currentQuestionMastery?.attempts ?? 0} ${
                      currentQuestionMastery?.attempts === 1 ? 'attempt' : 'attempts'
                    }`}
              </strong>
              <div className={`questionReviewSchedule ${currentReviewStatus}`}>
                <span>{currentReviewLabel[currentReviewStatus]}</span>
                <strong>
                  {currentQuestionMastery
                    ? `Stage ${currentQuestionMastery.reviewStage} · ${currentReviewTiming}`
                    : 'First check'}
                </strong>
              </div>
            </div>
          </div>

          <button
            className="secondaryButton fullWidth journalCaptureButton"
            onClick={() => onOpenJournal(scratchpad)}
            type="button"
          >
            <NotebookPen size={18} />
            Add field note
          </button>
        </aside>
      </div>
    </section>
  );
}

type SprintSummaryPageProps = {
  adaptiveSkill: SkillNode;
  onBack: () => void;
  onNewSprint: () => void;
  onReviewMisses: () => void;
  onStrengthenSkill: () => void;
  sprint: SprintState;
};

function SprintSummaryPage({
  adaptiveSkill,
  onBack,
  onNewSprint,
  onReviewMisses,
  onStrengthenSkill,
  sprint,
}: SprintSummaryPageProps) {
  const total = sprint.questionIndices.length;
  const correct = sprint.results.filter((result) => result.result === 'correct').length;
  const missed = total - correct;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
  const completedAt = sprint.completedAt ?? Date.now();
  const elapsedSeconds = Math.max(
    1,
    Math.round((completedAt - sprint.startedAt) / 1000),
  );
  const elapsedLabel =
    elapsedSeconds >= 60
      ? `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`
      : `${elapsedSeconds}s`;
  const resultHeadline =
    accuracy === 100
      ? 'Perfect circuit'
      : accuracy >= 80
        ? 'Strong signal'
        : accuracy >= 60
          ? 'Good momentum'
          : 'Useful diagnostic';

  return (
    <section className="sprintSummaryPage" aria-label={`${sprint.label} results`}>
      <header className="sprintSummaryHeader">
        <button
          className="secondaryButton compactHeaderBack"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          {sprint.source === 'diagnostic'
            ? 'Back to bank'
            : sprint.source === 'custom'
              ? 'Back to builder'
              : sprint.source === 'recovery'
                ? 'Back to Mistake Lab'
              : sprint.source === 'review'
                ? 'Back to review plan'
              : 'Back to path'}
        </button>
        <div>
          <p className="eyebrow">{sprint.label} complete</p>
          <h1>{resultHeadline}</h1>
          <p>Your results are ready, along with the next best move.</p>
        </div>
        <button className="primaryButton" onClick={onNewSprint} type="button">
          {sprint.source === 'diagnostic'
            ? 'Run again'
            : sprint.source === 'custom'
              ? 'New session'
              : sprint.source === 'recovery'
                ? 'Run recovery again'
              : sprint.source === 'review'
                ? 'Review again'
              : 'New sprint'}
          <RefreshCw size={17} />
        </button>
      </header>

      <section className="sprintScoreBand" aria-label="Sprint score">
        <div className="sprintScoreMark">
          <Trophy size={28} />
          <strong>{accuracy}%</strong>
          <span>Accuracy</span>
        </div>
        <div>
          <CheckCircle2 size={20} />
          <span>Correct</span>
          <strong>
            {correct}/{total}
          </strong>
        </div>
        <div>
          <Zap size={20} />
          <span>XP earned</span>
          <strong>+{sprint.earnedXp}</strong>
        </div>
        <div>
          <Clock3 size={20} />
          <span>Time</span>
          <strong>{elapsedLabel}</strong>
        </div>
      </section>

      <div className="sprintSummaryGrid">
        <section className="sprintBreakdown" aria-label="Sprint answer breakdown">
          <header>
            <div>
              <p className="eyebrow">Answer breakdown</p>
              <h2>
                {total} focused {total === 1 ? 'check' : 'checks'}
              </h2>
            </div>
            <span>{missed} to review</span>
          </header>

          <div>
            {sprint.results.map((result, index) => {
              const question = lessonQuestions.find(
                (item) => item.id === result.questionId,
              );
              const isCorrectResult = result.result === 'correct';

              return (
                <article
                  className={isCorrectResult ? 'correct' : 'missed'}
                  key={`${result.questionId}-${index}`}
                >
                  <span>{index + 1}</span>
                  <div>
                    <strong>{question?.topic ?? 'Practice prompt'}</strong>
                    <small>{question?.subtopic ?? result.questionId}</small>
                  </div>
                  <em>
                    {isCorrectResult
                      ? 'Correct'
                      : result.result === 'skipped'
                        ? 'Skipped'
                        : 'Review'}
                  </em>
                  {isCorrectResult ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <RotateCcw size={18} />
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <aside className="sprintNextStep" aria-label="Recommended next step">
          <span className="sprintNextIcon">
            <BrainCircuit size={25} />
          </span>
          <p className="eyebrow">Recommended next</p>
          <h2>{adaptiveSkill.title}</h2>
          <p>
            {sprint.diagnosticId
              ? 'Revisit the first missed domain check and turn the diagnostic into practice.'
              : sprint.source === 'recovery'
                ? 'Return to the Mistake Lab, reflect on the result, and update the repair pattern before another check.'
              : sprint.source === 'review'
                ? 'Your recall schedule now reflects this result. Check the next queue before another round.'
              : 'A short focused set here will strengthen the lowest active part of your skill map.'}
          </p>
          <button className="secondaryButton" onClick={onStrengthenSkill} type="button">
            {sprint.diagnosticId
              ? 'Practice domain skill'
              : sprint.source === 'recovery'
                ? 'Open Mistake Lab'
              : sprint.source === 'review'
                ? 'Open review plan'
                : 'Practice this skill'}
            <ArrowRight size={17} />
          </button>
        </aside>
      </div>

      <footer className="sprintSummaryActions">
        <button
          className="secondaryButton"
          disabled={missed === 0}
          onClick={onReviewMisses}
          type="button"
        >
          <RotateCcw size={17} />
          {missed === 0
            ? 'No misses to review'
            : sprint.source === 'recovery'
              ? `Reflect on ${missed} ${missed === 1 ? 'miss' : 'misses'}`
              : `Review ${missed} misses`}
        </button>
        <button className="primaryButton" onClick={onNewSprint} type="button">
          {sprint.source === 'diagnostic'
            ? 'Run diagnostic again'
            : sprint.source === 'custom'
              ? 'Build another session'
              : sprint.source === 'recovery'
                ? 'Run another recovery'
              : sprint.source === 'review'
                ? 'Start another review'
              : 'Start another sprint'}
          <ArrowRight size={17} />
        </button>
      </footer>
    </section>
  );
}

type ProgressCenterPageProps = {
  achievements: Achievement[];
  averageSkillProgress: number;
  bookmarkedCount: number;
  currentStreak: number;
  currentLevel: number;
  dailyMissionCompletedCount: number;
  dailyXp: number;
  earnedXp: number;
  learnerInitials: string;
  learnerName: string;
  levelProgress: number;
  onBack: () => void;
  onOpenInsights: () => void;
  onOpenPracticeMode: (mode: PracticeMode) => void;
  onStartSprint: () => void;
  practiceAccuracy: number | null;
  reviewCount: number;
  skillProgress: Record<string, number>;
  totalAttempts: number;
  tunedCareerRole: string;
  unlockedAchievementCount: number;
  xpToNextLevel: number;
};

function ProgressCenterPage({
  achievements,
  averageSkillProgress,
  bookmarkedCount,
  currentStreak,
  currentLevel,
  dailyMissionCompletedCount,
  dailyXp,
  earnedXp,
  learnerInitials,
  learnerName,
  levelProgress,
  onBack,
  onOpenInsights,
  onOpenPracticeMode,
  onStartSprint,
  practiceAccuracy,
  reviewCount,
  skillProgress,
  totalAttempts,
  tunedCareerRole,
  unlockedAchievementCount,
  xpToNextLevel,
}: ProgressCenterPageProps) {
  return (
    <section className="progressCenterPage" aria-label="Learning progress page">
      <header className="progressPageHeader">
        <button
          className="secondaryButton compactHeaderBack"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          Back to path
        </button>
        <div>
          <p className="eyebrow">Learning Profile</p>
          <h1>Your progress</h1>
          <p>Practice history, skill strength, and earned milestones.</p>
        </div>
        <div className="progressPageActions">
          <button
            className="secondaryButton"
            onClick={onOpenInsights}
            type="button"
          >
            <BarChart3 size={17} />
            Open insights
          </button>
          <button
            className="primaryButton"
            onClick={() => onOpenPracticeMode('path')}
            type="button"
          >
            Continue practice
            <ArrowRight size={18} />
          </button>
        </div>
      </header>

      <section
        className="levelHeroBand"
        aria-label={`${learnerName}, Level ${currentLevel} progress`}
      >
        <div className="levelHeroIdentity">
          <span className="levelAvatar" aria-hidden="true">
            {learnerInitials}
          </span>
          <div>
            <span>{learnerName}</span>
            <strong>Level {currentLevel}</strong>
            <small>{tunedCareerRole}</small>
          </div>
        </div>

        <div className="levelHeroProgress">
          <div>
            <span>Total XP</span>
            <strong>{earnedXp.toLocaleString()}</strong>
          </div>
          <div>
            <span>Next level</span>
            <strong>{xpToNextLevel} XP</strong>
          </div>
          <div className="levelMeter" aria-label={`${Math.round(levelProgress)}% to next level`}>
            <span style={{ width: `${levelProgress}%` }} />
          </div>
        </div>

        <div className="levelHeroBadge">
          <Award size={28} />
          <span>Achievements</span>
          <strong>
            {unlockedAchievementCount}/{achievements.length}
          </strong>
        </div>
      </section>

      <section className="progressMetricGrid" aria-label="Practice metrics">
        <article>
          <Activity size={20} />
          <span>Accuracy</span>
          <strong>{practiceAccuracy === null ? 'New' : `${practiceAccuracy}%`}</strong>
          <small>{totalAttempts} total attempts</small>
        </article>
        <article>
          <Zap size={20} />
          <span>Today</span>
          <strong>+{dailyXp} XP</strong>
          <small>
            {dailyMissionCompletedCount}/3 missions · {currentStreak} day streak
          </small>
        </article>
        <article>
          <Target size={20} />
          <span>Skill mastery</span>
          <strong>{averageSkillProgress}%</strong>
          <small>Across {skillNodes.length} learning units</small>
        </article>
        <article>
          <Bookmark size={20} />
          <span>Study stack</span>
          <strong>{bookmarkedCount + reviewCount}</strong>
          <small>{bookmarkedCount} saved · {reviewCount} review</small>
        </article>
      </section>

      <div className="progressDetailGrid">
        <section className="masterySection" aria-label="Skill mastery">
          <header>
            <div>
              <p className="eyebrow">Skill map</p>
              <h2>Mastery by unit</h2>
            </div>
            <span>{averageSkillProgress}% average</span>
          </header>

          <div className="masteryList">
            {skillNodes.map((skill) => {
              const Icon = skill.icon;
              const progress = skillProgress[skill.id] ?? skill.progress;

              return (
                <article key={skill.id}>
                  <span className="masteryIcon">
                    <Icon size={19} />
                  </span>
                  <div>
                    <span>{skill.unit}</span>
                    <strong>{skill.title}</strong>
                    <div className="masteryMeter">
                      <span style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <strong>{Math.round(progress)}%</strong>
                </article>
              );
            })}
          </div>
        </section>

        <section className="achievementSection" aria-label="Achievements">
          <header>
            <div>
              <p className="eyebrow">Milestones</p>
              <h2>Achievements</h2>
            </div>
            <span>{unlockedAchievementCount} unlocked</span>
          </header>

          <div className="achievementGrid">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;

              return (
                <article
                  className={achievement.unlocked ? 'unlocked' : 'locked'}
                  key={achievement.id}
                >
                  <span className="achievementIcon">
                    <Icon size={21} />
                  </span>
                  <div>
                    <strong>{achievement.title}</strong>
                    <p>{achievement.description}</p>
                    <small>{achievement.progress}</small>
                  </div>
                  {achievement.unlocked ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Lock size={17} />
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <section className="progressQuickActions" aria-label="Progress actions">
        <div>
          <p className="eyebrow">Keep moving</p>
          <h2>Choose the next set</h2>
        </div>
        <button onClick={() => onOpenPracticeMode('review')} type="button">
          <RotateCcw size={18} />
          Review queue
          <span>{reviewCount}</span>
        </button>
        <button onClick={() => onOpenPracticeMode('saved')} type="button">
          <Bookmark size={18} />
          Saved set
          <span>{bookmarkedCount}</span>
        </button>
        <button onClick={() => onOpenPracticeMode('mixed')} type="button">
          <Shuffle size={18} />
          Mixed practice
          <ChevronRight size={17} />
        </button>
        <button onClick={onStartSprint} type="button">
          <Trophy size={18} />
          Power Sprint
          <ChevronRight size={17} />
        </button>
      </section>
    </section>
  );
}

type LabFocusPageProps = {
  activeLab: LabScenario;
  activeMission: LabMission;
  activeMissionComplete: boolean;
  adcAliased: boolean;
  adcClipped: boolean;
  adcDisplayedFrequency: number;
  adcEffectiveSnr: number;
  adcFilterGain: number;
  adcFilteredAmplitude: number;
  adcLsbMillivolts: number;
  adcNyquistFrequency: number;
  adcPeakCode: number;
  adcSamplesPerCycle: number;
  bjtAdjustedBeta: number;
  bjtBaseEmitterVoltage: number;
  bjtCollectorCurrent: number;
  bjtCollectorPower: number;
  bjtCollectorResistorPower: number;
  bjtCollectorVoltage: number;
  bjtCutoff: boolean;
  bjtForcedBeta: number;
  bjtIdealCollectorCurrent: number;
  bjtJunctionTemperature: number;
  bjtLoadLineCurrent: number;
  bjtSaturated: boolean;
  bjtSaturationMargin: number;
  bjtTransconductance: number;
  completedFaultCaseIds: string[];
  completedFaultCount: number;
  completedMissionCount: number;
  completedMissionIds: string[];
  current: number;
  digitalMaxClock: number;
  digitalPeriod: number;
  digitalTimingMargin: number;
  digitalTimingUtilization: number;
  faultCases: LabFaultCase[];
  filterGainDb: number;
  filterOutput: number;
  filterPhase: number;
  isFormulaSaved: boolean;
  labRunHistory: LabRunSnapshot[];
  labValues: LabSimulationValues;
  missionFeedback: LabMissionFeedback;
  missions: LabMission[];
  missionValue: number;
  mosfetConductionLoss: number;
  mosfetDrainCurrent: number;
  mosfetDrainVoltage: number;
  mosfetEfficiency: number;
  mosfetGateDriveLoss: number;
  mosfetJunctionTemperature: number;
  mosfetLoadPower: number;
  mosfetOn: boolean;
  mosfetOnResistance: number;
  mosfetSwitchingLoss: number;
  mosfetTotalLoss: number;
  mosfetTransitionTime: number;
  onBack: () => void;
  onCheckMission: () => void;
  onDeleteRun: (runId: string) => void;
  onLabValueChange: (key: LabValueKey, value: number) => void;
  onMissionSelect: (missionId: string) => void;
  onOpenJournal: () => void;
  onOpenPractice: () => void;
  onRestoreRun: (run: LabRunSnapshot) => void;
  onSave: () => void;
  onSolveFault: (faultCaseId: string) => void;
  onToggleFormula: () => void;
  opAmpClipped: boolean;
  opAmpGain: number;
  opAmpHeadroom: number;
  opAmpInputCurrent: number;
  opAmpMaxSwing: number;
  opAmpOutput: number;
  pidControlEffort: number;
  pidDampingRatio: number;
  pidFinalValue: number;
  pidNaturalFrequency: number;
  pidOvershoot: number;
  pidRiseTime: number;
  pidSettlingTime: number;
  pidSteadyStateError: number;
  rcCutoff: number;
  rcTimeConstant: number;
  resonanceBandwidth: number;
  resonanceCapacitiveReactance: number;
  resonanceCapacitorVoltage: number;
  resonanceCurrent: number;
  resonanceFrequency: number;
  resonanceImpedance: number;
  resonanceInductiveReactance: number;
  resonanceInductorVoltage: number;
  resonanceLowerCutoff: number;
  resonanceNearPeak: boolean;
  resonancePhase: number;
  resonanceQualityFactor: number;
  resonanceResistorPower: number;
  resonanceUpperCutoff: number;
  threePhasePower: number;
  transmissionDeliveredPower: number;
  transmissionReflectedVoltage: number;
  transmissionReflectionCoefficient: number;
  transmissionReflectionMagnitude: number;
  transmissionReflectionPhase: number;
  transmissionReturnLoss: number;
  transmissionVswr: number;
  transformerCoreLoss: number;
  transformerCopperLoss: number;
  transformerEfficiency: number;
  transformerFluxDensity: number;
  transformerIdealSecondaryVoltage: number;
  transformerLoadPercent: number;
  transformerMagnetizingCurrent: number;
  transformerOutputPower: number;
  transformerPrimaryCurrent: number;
  transformerRegulation: number;
  transformerSaturated: boolean;
  transformerSecondaryCurrent: number;
  transformerSecondaryVoltage: number;
  transformerTemperatureRise: number;
  transformerTotalLoss: number;
  transformerTurnsRatio: number;
};

function LabFocusPage({
  activeLab,
  activeMission,
  activeMissionComplete,
  adcAliased,
  adcClipped,
  adcDisplayedFrequency,
  adcEffectiveSnr,
  adcFilterGain,
  adcFilteredAmplitude,
  adcLsbMillivolts,
  adcNyquistFrequency,
  adcPeakCode,
  adcSamplesPerCycle,
  bjtAdjustedBeta,
  bjtBaseEmitterVoltage,
  bjtCollectorCurrent,
  bjtCollectorPower,
  bjtCollectorResistorPower,
  bjtCollectorVoltage,
  bjtCutoff,
  bjtForcedBeta,
  bjtIdealCollectorCurrent,
  bjtJunctionTemperature,
  bjtLoadLineCurrent,
  bjtSaturated,
  bjtSaturationMargin,
  bjtTransconductance,
  completedFaultCaseIds,
  completedFaultCount,
  completedMissionCount,
  completedMissionIds,
  current,
  digitalMaxClock,
  digitalPeriod,
  digitalTimingMargin,
  digitalTimingUtilization,
  faultCases,
  filterGainDb,
  filterOutput,
  filterPhase,
  isFormulaSaved,
  labRunHistory,
  labValues,
  missionFeedback,
  missions,
  missionValue,
  mosfetConductionLoss,
  mosfetDrainCurrent,
  mosfetDrainVoltage,
  mosfetEfficiency,
  mosfetGateDriveLoss,
  mosfetJunctionTemperature,
  mosfetLoadPower,
  mosfetOn,
  mosfetOnResistance,
  mosfetSwitchingLoss,
  mosfetTotalLoss,
  mosfetTransitionTime,
  onBack,
  onCheckMission,
  onDeleteRun,
  onLabValueChange,
  onMissionSelect,
  onOpenJournal,
  onOpenPractice,
  onRestoreRun,
  onSave,
  onSolveFault,
  onToggleFormula,
  opAmpClipped,
  opAmpGain,
  opAmpHeadroom,
  opAmpInputCurrent,
  opAmpMaxSwing,
  opAmpOutput,
  pidControlEffort,
  pidDampingRatio,
  pidFinalValue,
  pidNaturalFrequency,
  pidOvershoot,
  pidRiseTime,
  pidSettlingTime,
  pidSteadyStateError,
  rcCutoff,
  rcTimeConstant,
  resonanceBandwidth,
  resonanceCapacitiveReactance,
  resonanceCapacitorVoltage,
  resonanceCurrent,
  resonanceFrequency,
  resonanceImpedance,
  resonanceInductiveReactance,
  resonanceInductorVoltage,
  resonanceLowerCutoff,
  resonanceNearPeak,
  resonancePhase,
  resonanceQualityFactor,
  resonanceResistorPower,
  resonanceUpperCutoff,
  threePhasePower,
  transmissionDeliveredPower,
  transmissionReflectedVoltage,
  transmissionReflectionCoefficient,
  transmissionReflectionMagnitude,
  transmissionReflectionPhase,
  transmissionReturnLoss,
  transmissionVswr,
  transformerCoreLoss,
  transformerCopperLoss,
  transformerEfficiency,
  transformerFluxDensity,
  transformerIdealSecondaryVoltage,
  transformerLoadPercent,
  transformerMagnetizingCurrent,
  transformerOutputPower,
  transformerPrimaryCurrent,
  transformerRegulation,
  transformerSaturated,
  transformerSecondaryCurrent,
  transformerSecondaryVoltage,
  transformerTemperatureRise,
  transformerTotalLoss,
  transformerTurnsRatio,
}: LabFocusPageProps) {
  const [labMode, setLabMode] = useState<LabMode>('calibration');
  const [benchLogOpen, setBenchLogOpen] = useState(false);
  const [activeFaultCaseId, setActiveFaultCaseId] = useState(
    faultCases.find(
      (faultCase) => !completedFaultCaseIds.includes(faultCase.id),
    )?.id ??
      faultCases[0]?.id ??
      '',
  );
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<
    string | null
  >(null);
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState<string | null>(
    null,
  );
  const [faultFeedback, setFaultFeedback] =
    useState<LabFaultFeedback>(null);
  const output =
    activeLab.id === 'lab-ohms'
      ? `${current.toFixed(2)} A`
      : activeLab.id === 'lab-bjt'
        ? `${bjtCollectorCurrent.toFixed(2)} mA IC`
      : activeLab.id === 'lab-rc'
        ? `${rcTimeConstant.toFixed(0)} ms`
      : activeLab.id === 'lab-resonance'
        ? `${resonanceFrequency.toFixed(0)} Hz f₀`
      : activeLab.id === 'lab-filter'
          ? `${filterOutput.toFixed(2)} V RMS`
          : activeLab.id === 'lab-digital'
            ? `${digitalTimingMargin.toFixed(1)} ns`
            : activeLab.id === 'lab-opamp'
              ? `${Math.abs(opAmpOutput).toFixed(2)} Vpk`
              : activeLab.id === 'lab-mosfet'
                ? `${mosfetTotalLoss.toFixed(2)} W loss`
                : activeLab.id === 'lab-pid'
                  ? `${pidSettlingTime.toFixed(2)} s settle`
                  : activeLab.id === 'lab-adc'
                    ? `${adcDisplayedFrequency.toFixed(2)} kHz displayed`
                  : activeLab.id === 'lab-transmission'
                    ? `${transmissionVswr.toFixed(2)}:1 VSWR`
                    : activeLab.id === 'lab-transformer'
                      ? `${transformerSecondaryVoltage.toFixed(1)} V RMS`
                    : `${threePhasePower.toFixed(2)} kW`;
  const outputDescription = activeLab.assumptions;
  const activeFaultCase =
    faultCases.find((faultCase) => faultCase.id === activeFaultCaseId) ??
    faultCases[0] ??
    LAB_FAULT_CASES[0];
  const selectedFaultMeasurement =
    activeFaultCase.measurements.find(
      (measurement) => measurement.id === selectedMeasurementId,
    ) ?? null;
  const activeFaultComplete = completedFaultCaseIds.includes(
    activeFaultCase.id,
  );
  const missionDelta = missionValue - activeMission.target;
  const absoluteMissionDelta = Math.abs(missionDelta);
  const missionReadingInRange =
    absoluteMissionDelta <= activeMission.tolerance;
  const missionOperatingPointValid =
    activeLab.id !== 'lab-bjt' ||
    (!bjtCutoff && !bjtSaturated && bjtJunctionTemperature < 85);
  const missionInRange =
    missionReadingInRange && missionOperatingPointValid;
  const missionScaleMaximum = activeMission.target * 1.5;
  const missionReadingProgress = Math.min(
    100,
    Math.max(0, (missionValue / missionScaleMaximum) * 100),
  );
  const missionTargetProgress = (activeMission.target / missionScaleMaximum) * 100;
  const formattedMissionValue = missionValue.toFixed(activeMission.decimals);
  const formattedMissionTarget = activeMission.target.toFixed(
    activeMission.decimals,
  );
  const formattedMissionDelta = absoluteMissionDelta.toFixed(
    activeMission.decimals,
  );
  const liveGuidance =
    missionReadingInRange && !missionOperatingPointValid
      ? bjtSaturated
        ? 'Current is on target, but the transistor is saturated. Increase VCE headroom.'
        : bjtCutoff
          ? 'Current is on target, but the transistor is in cutoff. Restore base drive.'
          : 'Current is on target, but junction temperature is above the calibration limit.'
      : missionInRange
        ? 'Reading is inside tolerance. Check the calibration to lock it in.'
        : missionDelta < 0
          ? `Reading is low by ${formattedMissionDelta} ${activeMission.unit}.`
          : `Reading is high by ${formattedMissionDelta} ${activeMission.unit}.`;
  const labGuideMood: ZyGuideMood =
    labMode === 'fault'
      ? faultFeedback?.kind === 'success'
        ? 'celebrate'
        : faultFeedback?.kind === 'wrong'
          ? 'retry'
          : 'focus'
      : missionFeedback?.kind === 'success' || activeMissionComplete
        ? 'celebrate'
        : missionInRange
          ? 'celebrate'
          : 'focus';
  const labGuideLabel =
    labMode === 'fault'
      ? faultFeedback?.kind === 'success'
        ? 'Zy / Case closed'
        : 'Zy / Fault coach'
      : missionFeedback?.kind === 'success' || activeMissionComplete
        ? 'Zy / Calibration locked'
        : 'Zy / Lab coach';
  const labGuideMessages =
    labMode === 'fault'
      ? faultFeedback?.kind === 'success'
        ? [
            `${activeFaultCase.title} is solved. The readings now support one consistent cause.`,
            'Replay the case when you want to practice the measurement order again.',
          ]
        : faultFeedback?.kind === 'wrong'
          ? [
              'That diagnosis leaves at least one reading unexplained. Compare the normal point with the first abnormal one.',
              activeFaultCase.safetyNote,
            ]
          : selectedFaultMeasurement
            ? [
                `${selectedFaultMeasurement.label} reads ${selectedFaultMeasurement.reading}. Use that evidence before choosing a cause.`,
                activeFaultCase.safetyNote,
              ]
            : [
                'Choose a safe measurement point first, then diagnose from the evidence instead of the symptom alone.',
                activeFaultCase.safetyNote,
              ]
      : missionFeedback?.kind === 'success' || activeMissionComplete
        ? [
            `${activeMission.title} is calibrated inside tolerance. The result is ready to save.`,
            `Your live output is ${formattedMissionValue} ${activeMission.unit}.`,
          ]
        : missionInRange
          ? [
              'You are inside tolerance. Check the calibration now to lock in the mission.',
              `Hold the reading near ${formattedMissionTarget} ${activeMission.unit}.`,
            ]
          : [
              liveGuidance,
              'Change one control at a time so you can see which variable moves the output.',
            ];

  useEffect(() => {
    setLabMode('calibration');
    setBenchLogOpen(false);
    setActiveFaultCaseId(
      faultCases.find(
        (faultCase) => !completedFaultCaseIds.includes(faultCase.id),
      )?.id ??
        faultCases[0]?.id ??
        '',
    );
    setSelectedMeasurementId(null);
    setSelectedDiagnosisId(null);
    setFaultFeedback(null);
  }, [activeLab.id]);

  function handleLabModeChange(mode: LabMode) {
    setLabMode(mode);
    setFaultFeedback(null);
  }

  function handleFaultCaseSelect(faultCaseId: string) {
    setActiveFaultCaseId(faultCaseId);
    setSelectedMeasurementId(null);
    setSelectedDiagnosisId(null);
    setFaultFeedback(null);
  }

  function handleFaultDiagnosisCheck() {
    if (!selectedDiagnosisId || !selectedMeasurementId) {
      return;
    }

    if (selectedDiagnosisId !== activeFaultCase.correctDiagnosisId) {
      setFaultFeedback({
        kind: 'wrong',
        message:
          'That diagnosis does not explain every reading. Compare the normal measurement with the one that breaks the pattern.',
      });
      return;
    }

    const wasAlreadyComplete = completedFaultCaseIds.includes(
      activeFaultCase.id,
    );
    onSolveFault(activeFaultCase.id);
    setFaultFeedback({
      kind: 'success',
      message: wasAlreadyComplete
        ? 'Diagnosis confirmed again. This replay did not add duplicate XP.'
        : `Diagnosis confirmed. +${activeFaultCase.xp} XP added to your progress.`,
    });
  }

  return (
    <section className="lessonFocusPage" aria-label="Lab page">
      <header className="lessonPageHeader">
        <button
          className="secondaryButton lessonBackButton compactHeaderBack"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          Back to labs
        </button>

        <div>
          <p className="eyebrow">Interactive Lab</p>
          <h1>{activeLab.title}</h1>
          <p>{activeLab.topic}</p>
        </div>

        <div className="lessonPageStats" aria-label="Lab status">
          <span>Lab progress</span>
          <strong>
            {completedMissionCount}/{missions.length} missions
          </strong>
          <small>
            {completedFaultCount}/{faultCases.length} faults solved
          </small>
        </div>
      </header>

      <ZyGuide
        className="labMobileCoach"
        compact
        label={labGuideLabel}
        messages={labGuideMessages}
        mood={labGuideMood}
      />

      <div className="lessonFocusGrid labFocusGrid">
        <article className="lessonQuestionCard labStage">
          <LabVisualStage
            baseline={labMode === 'fault'}
            lab={activeLab}
            values={labValues}
          />

          {labMode === 'fault' && (
            <div className="labFaultScene" aria-live="polite">
              <span>
                <TriangleAlert size={18} />
                Fault injected
              </span>
              <strong>{activeFaultCase.title}</strong>
              <p>{activeFaultCase.symptom}</p>
              {selectedFaultMeasurement && (
                <div>
                  <small>{selectedFaultMeasurement.label}</small>
                  <strong>{selectedFaultMeasurement.reading}</strong>
                </div>
              )}
            </div>
          )}

          <div className="lessonPageMeta">
            <span>{labMode === 'fault' ? 'Observed fault output' : 'Lab output'}</span>
            <strong>
              {labMode === 'fault' ? activeFaultCase.observedOutput : output}
            </strong>
            <p>
              {labMode === 'fault' ? activeFaultCase.symptom : outputDescription}
            </p>
          </div>
        </article>

        <aside className="lessonSupportPanel labControlPanel" aria-label="Lab controls">
          <nav className="labModeSwitch" aria-label="Lab mode">
            <button
              aria-pressed={labMode === 'calibration'}
              className={labMode === 'calibration' ? 'active' : ''}
              onClick={() => handleLabModeChange('calibration')}
              type="button"
            >
              <SlidersHorizontal size={17} />
              Calibration
              <span>
                {completedMissionCount}/{missions.length}
              </span>
            </button>
            <button
              aria-pressed={labMode === 'fault'}
              className={labMode === 'fault' ? 'active' : ''}
              onClick={() => handleLabModeChange('fault')}
              type="button"
            >
              <Wrench size={17} />
              Fault Hunt
              <span>
                {completedFaultCount}/{faultCases.length}
              </span>
            </button>
          </nav>

          <ZyGuide
            className="labInlineCoach"
            compact
            label={labGuideLabel}
            messages={labGuideMessages}
            mood={labGuideMood}
          />

          {labMode === 'calibration' ? (
            <>
          <section className="labMissionPanel" aria-label="Calibration mission">
            <header>
              <div>
                <p className="eyebrow">Calibration challenge</p>
                <h2>{activeMission.title}</h2>
              </div>
              <span>+{activeMission.xp} XP</span>
            </header>

            <nav className="labMissionTabs" aria-label="Lab missions">
              {missions.map((mission, index) => {
                const isComplete = completedMissionIds.includes(mission.id);

                return (
                  <button
                    aria-label={`Mission ${index + 1}: ${mission.title}${
                      isComplete ? ', complete' : ''
                    }`}
                    aria-pressed={mission.id === activeMission.id}
                    className={isComplete ? 'complete' : ''}
                    key={mission.id}
                    onClick={() => onMissionSelect(mission.id)}
                    type="button"
                  >
                    {isComplete ? <Check size={16} /> : <span>{index + 1}</span>}
                  </button>
                );
              })}
            </nav>

            <p className="labMissionBrief">{activeMission.brief}</p>

            <div className="labMissionReadings">
              <div>
                <span>Target</span>
                <strong>
                  {formattedMissionTarget} {activeMission.unit}
                </strong>
              </div>
              <div>
                <span>Live reading</span>
                <strong>
                  {formattedMissionValue} {activeMission.unit}
                </strong>
              </div>
              <div>
                <span>Tolerance</span>
                <strong>
                  ±{activeMission.tolerance.toFixed(activeMission.decimals)}{' '}
                  {activeMission.unit}
                </strong>
              </div>
            </div>

            <div className="labCalibrationScale" aria-label={liveGuidance}>
              <span
                className="labCalibrationTarget"
                style={{ left: `${missionTargetProgress}%` }}
              />
              <span
                className={`labCalibrationReading ${missionInRange ? 'inRange' : ''}`}
                style={{ left: `${missionReadingProgress}%` }}
              />
            </div>

            <div
              className={`labMissionGuidance ${
                missionFeedback?.kind ?? (missionInRange ? 'ready' : '')
              }`}
              aria-live="polite"
            >
              {missionFeedback?.kind === 'success' ? (
                <CheckCircle2 size={18} />
              ) : (
                <CircleGauge size={18} />
              )}
              <span>
                <strong>
                  {missionFeedback?.kind === 'success'
                    ? 'Calibration complete'
                    : missionInRange
                      ? 'Target range reached'
                      : 'Keep tuning'}
                </strong>
                <small>{missionFeedback?.message ?? liveGuidance}</small>
              </span>
            </div>

            <button
              className="primaryButton fullWidth"
              onClick={onCheckMission}
              type="button"
            >
              {activeMissionComplete ? 'Verify Calibration' : 'Check Calibration'}
              <Target size={18} />
            </button>
          </section>

          {activeLab.id === 'lab-ohms' ? (
            <>
              <label className="labControl">
                <span>Voltage</span>
                <strong>{labValues.voltage} V</strong>
                <input
                  aria-label="Voltage"
                  max="24"
                  min="1"
                  onInput={(event) =>
                    onLabValueChange('voltage', Number(event.currentTarget.value))
                  }
                  type="range"
                  value={labValues.voltage}
                />
              </label>
              <label className="labControl">
                <span>Resistance</span>
                <strong>{labValues.resistance} Ω</strong>
                <input
                  aria-label="Resistance"
                  max="48"
                  min="1"
                  onInput={(event) =>
                    onLabValueChange('resistance', Number(event.currentTarget.value))
                  }
                  type="range"
                  value={labValues.resistance}
                />
              </label>
              <div className="resultBox">
                <span>Formula</span>
                <strong>I = V / R</strong>
                <small>
                  {labValues.voltage} / {labValues.resistance} = {current.toFixed(2)} A
                </small>
              </div>
            </>
          ) : activeLab.id === 'lab-rc' ? (
            <>
              <label className="labControl">
                <span>Resistance</span>
                <strong>{labValues.rcResistance} kΩ</strong>
                <input
                  aria-label="RC resistance"
                  max="100"
                  min="1"
                  onInput={(event) =>
                    onLabValueChange('rcResistance', Number(event.currentTarget.value))
                  }
                  type="range"
                  value={labValues.rcResistance}
                />
              </label>
              <label className="labControl">
                <span>Capacitance</span>
                <strong>{labValues.capacitance} µF</strong>
                <input
                  aria-label="Capacitance"
                  max="220"
                  min="1"
                  onInput={(event) =>
                    onLabValueChange('capacitance', Number(event.currentTarget.value))
                  }
                  type="range"
                  value={labValues.capacitance}
                />
              </label>
              <div className="resultBox">
                <span>Formula</span>
                <strong>τ = R × C</strong>
                <small>
                  {labValues.rcResistance} kΩ × {labValues.capacitance} µF ={' '}
                  {rcTimeConstant.toFixed(0)} ms
                </small>
              </div>
            </>
          ) : activeLab.id === 'lab-resonance' ? (
            <>
              <label className="labControl">
                <span>Sweep frequency</span>
                <strong>{labValues.resonanceFrequency.toFixed(0)} Hz</strong>
                <input
                  aria-label="RLC sweep frequency"
                  max="5000"
                  min="100"
                  onInput={(event) =>
                    onLabValueChange(
                      'resonanceFrequency',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="10"
                  type="range"
                  value={labValues.resonanceFrequency}
                />
              </label>
              <label className="labControl">
                <span>Inductance</span>
                <strong>{labValues.resonanceInductance.toFixed(0)} mH</strong>
                <input
                  aria-label="RLC inductance"
                  max="100"
                  min="1"
                  onInput={(event) =>
                    onLabValueChange(
                      'resonanceInductance',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="1"
                  type="range"
                  value={labValues.resonanceInductance}
                />
              </label>
              <label className="labControl">
                <span>Capacitance</span>
                <strong>{labValues.resonanceCapacitance.toFixed(2)} µF</strong>
                <input
                  aria-label="RLC capacitance"
                  max="20"
                  min="0.2"
                  onInput={(event) =>
                    onLabValueChange(
                      'resonanceCapacitance',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="0.1"
                  type="range"
                  value={labValues.resonanceCapacitance}
                />
              </label>
              <label className="labControl">
                <span>Series damping</span>
                <strong>{labValues.resonanceResistance.toFixed(0)} Ω</strong>
                <input
                  aria-label="RLC series resistance"
                  max="100"
                  min="2"
                  onInput={(event) =>
                    onLabValueChange(
                      'resonanceResistance',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="1"
                  type="range"
                  value={labValues.resonanceResistance}
                />
              </label>
              <label className="labControl">
                <span>Source level</span>
                <strong>{labValues.resonanceSourceVoltage.toFixed(1)} V RMS</strong>
                <input
                  aria-label="RLC source voltage"
                  max="12"
                  min="1"
                  onInput={(event) =>
                    onLabValueChange(
                      'resonanceSourceVoltage',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="0.5"
                  type="range"
                  value={labValues.resonanceSourceVoltage}
                />
              </label>
              <div
                className={`resultBox resonanceResult ${
                  resonanceNearPeak ? 'nearPeak' : ''
                }`}
              >
                <span>
                  {Math.abs(resonancePhase) <= 3
                    ? 'At resonance'
                    : resonancePhase < 0
                      ? 'Capacitive operating point'
                      : 'Inductive operating point'}
                </span>
                <strong>{resonanceFrequency.toFixed(0)} Hz center</strong>
                <small>
                  I {resonanceCurrent.toFixed(3)} A · Z{' '}
                  {resonanceImpedance.toFixed(1)} Ω · phase{' '}
                  {resonancePhase.toFixed(1)}°
                </small>
                <small>
                  Q {resonanceQualityFactor.toFixed(2)} · BW{' '}
                  {resonanceBandwidth.toFixed(0)} Hz · -3 dB{' '}
                  {resonanceLowerCutoff.toFixed(0)}–
                  {resonanceUpperCutoff.toFixed(0)} Hz
                </small>
                <small>
                  XL {resonanceInductiveReactance.toFixed(1)} Ω · XC{' '}
                  {resonanceCapacitiveReactance.toFixed(1)} Ω · VL/VC{' '}
                  {Math.max(
                    resonanceInductorVoltage,
                    resonanceCapacitorVoltage,
                  ).toFixed(1)}{' '}
                  V · PR {resonanceResistorPower.toFixed(2)} W
                </small>
              </div>
            </>
          ) : activeLab.id === 'lab-filter' ? (
            <>
              <label className="labControl">
                <span>Resistance</span>
                <strong>{labValues.rcResistance} kΩ</strong>
                <input
                  aria-label="Filter resistance"
                  max="100"
                  min="1"
                  onInput={(event) =>
                    onLabValueChange(
                      'rcResistance',
                      Number(event.currentTarget.value),
                    )
                  }
                  type="range"
                  value={labValues.rcResistance}
                />
              </label>
              <label className="labControl">
                <span>Capacitance</span>
                <strong>{labValues.capacitance} µF</strong>
                <input
                  aria-label="Filter capacitance"
                  max="220"
                  min="1"
                  onInput={(event) =>
                    onLabValueChange(
                      'capacitance',
                      Number(event.currentTarget.value),
                    )
                  }
                  type="range"
                  value={labValues.capacitance}
                />
              </label>
              <label className="labControl">
                <span>Source frequency</span>
                <strong>{labValues.filterFrequency} Hz</strong>
                <input
                  aria-label="Filter source frequency"
                  max="5000"
                  min="1"
                  onInput={(event) =>
                    onLabValueChange(
                      'filterFrequency',
                      Number(event.currentTarget.value),
                    )
                  }
                  type="range"
                  value={labValues.filterFrequency}
                />
              </label>
              <div className="resultBox filterResultBox">
                <span>Frequency response</span>
                <strong>{filterOutput.toFixed(2)} V RMS</strong>
                <small>
                  fc = {rcCutoff.toFixed(2)} Hz · {filterGainDb.toFixed(1)} dB ·{' '}
                  {filterPhase.toFixed(1)}°
                </small>
              </div>
            </>
          ) : activeLab.id === 'lab-digital' ? (
            <>
              <label className="labControl">
                <span>Clock frequency</span>
                <strong>{labValues.digitalClockFrequency} MHz</strong>
                <input
                  aria-label="Digital clock frequency"
                  max="100"
                  min="5"
                  onInput={(event) =>
                    onLabValueChange(
                      'digitalClockFrequency',
                      Number(event.currentTarget.value),
                    )
                  }
                  type="range"
                  value={labValues.digitalClockFrequency}
                />
              </label>
              <label className="labControl">
                <span>Propagation delay</span>
                <strong>{labValues.digitalPropagationDelay} ns</strong>
                <input
                  aria-label="Digital propagation delay"
                  max="30"
                  min="1"
                  onInput={(event) =>
                    onLabValueChange(
                      'digitalPropagationDelay',
                      Number(event.currentTarget.value),
                    )
                  }
                  type="range"
                  value={labValues.digitalPropagationDelay}
                />
              </label>
              <label className="labControl">
                <span>Receiver setup time</span>
                <strong>{labValues.digitalSetupTime} ns</strong>
                <input
                  aria-label="Digital receiver setup time"
                  max="20"
                  min="1"
                  onInput={(event) =>
                    onLabValueChange(
                      'digitalSetupTime',
                      Number(event.currentTarget.value),
                    )
                  }
                  type="range"
                  value={labValues.digitalSetupTime}
                />
              </label>
              <div
                className={`resultBox digitalTimingResult ${
                  digitalTimingMargin < 0 ? 'violation' : ''
                }`}
              >
                <span>Setup margin</span>
                <strong>{digitalTimingMargin.toFixed(1)} ns</strong>
                <small>
                  TCLK {digitalPeriod.toFixed(1)} ns · {digitalTimingUtilization.toFixed(0)}%
                  used · fmax {digitalMaxClock.toFixed(1)} MHz
                </small>
              </div>
            </>
          ) : activeLab.id === 'lab-opamp' ? (
            <>
              <label className="labControl">
                <span>Input amplitude</span>
                <strong>{labValues.opAmpInputVoltage.toFixed(2)} Vpk</strong>
                <input
                  aria-label="Op-amp input amplitude"
                  max="2"
                  min="0.05"
                  onInput={(event) =>
                    onLabValueChange(
                      'opAmpInputVoltage',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="0.05"
                  type="range"
                  value={labValues.opAmpInputVoltage}
                />
              </label>
              <label className="labControl">
                <span>Input resistance</span>
                <strong>{labValues.opAmpInputResistance} kΩ</strong>
                <input
                  aria-label="Op-amp input resistance"
                  max="20"
                  min="1"
                  onInput={(event) =>
                    onLabValueChange(
                      'opAmpInputResistance',
                      Number(event.currentTarget.value),
                    )
                  }
                  type="range"
                  value={labValues.opAmpInputResistance}
                />
              </label>
              <label className="labControl">
                <span>Feedback resistance</span>
                <strong>{labValues.opAmpFeedbackResistance} kΩ</strong>
                <input
                  aria-label="Op-amp feedback resistance"
                  max="100"
                  min="1"
                  onInput={(event) =>
                    onLabValueChange(
                      'opAmpFeedbackResistance',
                      Number(event.currentTarget.value),
                    )
                  }
                  type="range"
                  value={labValues.opAmpFeedbackResistance}
                />
              </label>
              <label className="labControl">
                <span>Supply rails</span>
                <strong>±{labValues.opAmpSupplyVoltage} V</strong>
                <input
                  aria-label="Op-amp supply voltage"
                  max="15"
                  min="5"
                  onInput={(event) =>
                    onLabValueChange(
                      'opAmpSupplyVoltage',
                      Number(event.currentTarget.value),
                    )
                  }
                  type="range"
                  value={labValues.opAmpSupplyVoltage}
                />
              </label>
              <div
                className={`resultBox opAmpResult ${
                  opAmpClipped ? 'clipped' : ''
                }`}
              >
                <span>{opAmpClipped ? 'Output clipping' : 'Inverting gain'}</span>
                <strong>{opAmpGain.toFixed(2)} V/V</strong>
                <small>
                  {Math.abs(opAmpOutput).toFixed(2)} Vpk output ·{' '}
                  {opAmpClipped
                    ? `limited to ±${opAmpMaxSwing.toFixed(1)} V`
                    : `${opAmpHeadroom.toFixed(2)} V headroom`}{' '}
                  · {(opAmpInputCurrent * 1000).toFixed(1)} µA
                </small>
              </div>
            </>
          ) : activeLab.id === 'lab-bjt' ? (
            <>
              <label className="labControl">
                <span>Base current</span>
                <strong>{labValues.bjtBaseCurrent.toFixed(0)} µA</strong>
                <input
                  aria-label="BJT base current"
                  max="120"
                  min="0"
                  onInput={(event) =>
                    onLabValueChange(
                      'bjtBaseCurrent',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="1"
                  type="range"
                  value={labValues.bjtBaseCurrent}
                />
              </label>
              <label className="labControl">
                <span>Device current gain</span>
                <strong>β {labValues.bjtCurrentGain.toFixed(0)}</strong>
                <input
                  aria-label="BJT device current gain"
                  max="200"
                  min="40"
                  onInput={(event) =>
                    onLabValueChange(
                      'bjtCurrentGain',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="5"
                  type="range"
                  value={labValues.bjtCurrentGain}
                />
              </label>
              <label className="labControl">
                <span>Collector resistance</span>
                <strong>{labValues.bjtCollectorResistance.toFixed(1)} kΩ</strong>
                <input
                  aria-label="BJT collector resistance"
                  max="10"
                  min="0.5"
                  onInput={(event) =>
                    onLabValueChange(
                      'bjtCollectorResistance',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="0.1"
                  type="range"
                  value={labValues.bjtCollectorResistance}
                />
              </label>
              <label className="labControl">
                <span>Collector supply</span>
                <strong>{labValues.bjtSupplyVoltage.toFixed(1)} V</strong>
                <input
                  aria-label="BJT collector supply voltage"
                  max="24"
                  min="3"
                  onInput={(event) =>
                    onLabValueChange(
                      'bjtSupplyVoltage',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="0.5"
                  type="range"
                  value={labValues.bjtSupplyVoltage}
                />
              </label>
              <label className="labControl">
                <span>Ambient temperature</span>
                <strong>{labValues.bjtTemperature.toFixed(0)} °C</strong>
                <input
                  aria-label="BJT ambient temperature"
                  max="100"
                  min="-20"
                  onInput={(event) =>
                    onLabValueChange(
                      'bjtTemperature',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="5"
                  type="range"
                  value={labValues.bjtTemperature}
                />
              </label>
              <div
                className={`resultBox bjtResult ${
                  bjtCutoff ||
                  bjtSaturated ||
                  bjtJunctionTemperature >= 85
                    ? 'warning'
                    : 'active'
                }`}
              >
                <span>
                  {bjtCutoff
                    ? 'Cutoff region'
                    : bjtSaturated
                      ? 'Collector saturation'
                      : bjtJunctionTemperature >= 85
                        ? 'Thermal margin low'
                        : 'Forward-active bias'}
                </span>
                <strong>{bjtCollectorCurrent.toFixed(2)} mA IC</strong>
                <small>
                  VCE {bjtCollectorVoltage.toFixed(2)} V · VBE{' '}
                  {bjtBaseEmitterVoltage.toFixed(2)} V · headroom{' '}
                  {bjtSaturationMargin.toFixed(2)} V
                </small>
                <small>
                  β(T) {bjtAdjustedBeta.toFixed(0)} · βforced{' '}
                  {bjtForcedBeta.toFixed(0)} · ideal{' '}
                  {bjtIdealCollectorCurrent.toFixed(2)} mA · load-line max{' '}
                  {bjtLoadLineCurrent.toFixed(2)} mA
                </small>
                <small>
                  gm {bjtTransconductance.toFixed(1)} mS · PD{' '}
                  {bjtCollectorPower.toFixed(1)} mW · PRC{' '}
                  {bjtCollectorResistorPower.toFixed(1)} mW · TJ{' '}
                  {bjtJunctionTemperature.toFixed(0)} °C
                </small>
              </div>
            </>
          ) : activeLab.id === 'lab-mosfet' ? (
            <>
              <label className="labControl">
                <span>Gate voltage</span>
                <strong>{labValues.mosfetGateVoltage.toFixed(1)} V</strong>
                <input
                  aria-label="MOSFET gate voltage"
                  max="12"
                  min="0"
                  onInput={(event) =>
                    onLabValueChange(
                      'mosfetGateVoltage',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="0.5"
                  type="range"
                  value={labValues.mosfetGateVoltage}
                />
              </label>
              <label className="labControl">
                <span>Gate resistance</span>
                <strong>{labValues.mosfetGateResistance} Ω</strong>
                <input
                  aria-label="MOSFET gate resistance"
                  max="50"
                  min="2"
                  onInput={(event) =>
                    onLabValueChange(
                      'mosfetGateResistance',
                      Number(event.currentTarget.value),
                    )
                  }
                  type="range"
                  value={labValues.mosfetGateResistance}
                />
              </label>
              <label className="labControl">
                <span>Switching frequency</span>
                <strong>{labValues.mosfetSwitchingFrequency} kHz</strong>
                <input
                  aria-label="MOSFET switching frequency"
                  max="250"
                  min="5"
                  onInput={(event) =>
                    onLabValueChange(
                      'mosfetSwitchingFrequency',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="5"
                  type="range"
                  value={labValues.mosfetSwitchingFrequency}
                />
              </label>
              <label className="labControl">
                <span>DC bus</span>
                <strong>{labValues.mosfetBusVoltage} V</strong>
                <input
                  aria-label="MOSFET DC bus voltage"
                  max="60"
                  min="6"
                  onInput={(event) =>
                    onLabValueChange(
                      'mosfetBusVoltage',
                      Number(event.currentTarget.value),
                    )
                  }
                  type="range"
                  value={labValues.mosfetBusVoltage}
                />
              </label>
              <label className="labControl">
                <span>Load resistance</span>
                <strong>{labValues.mosfetLoadResistance} Ω</strong>
                <input
                  aria-label="MOSFET load resistance"
                  max="30"
                  min="2"
                  onInput={(event) =>
                    onLabValueChange(
                      'mosfetLoadResistance',
                      Number(event.currentTarget.value),
                    )
                  }
                  type="range"
                  value={labValues.mosfetLoadResistance}
                />
              </label>
              <label className="labControl">
                <span>PWM duty cycle</span>
                <strong>{labValues.mosfetDutyCycle}%</strong>
                <input
                  aria-label="MOSFET PWM duty cycle"
                  max="95"
                  min="10"
                  onInput={(event) =>
                    onLabValueChange(
                      'mosfetDutyCycle',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="5"
                  type="range"
                  value={labValues.mosfetDutyCycle}
                />
              </label>
              <div
                className={`resultBox mosfetResult ${
                  !mosfetOn ||
                  (labValues.mosfetGateVoltage < 6 && mosfetOn) ||
                  mosfetJunctionTemperature > 125
                    ? 'warning'
                    : ''
                }`}
              >
                <span>
                  {!mosfetOn
                    ? 'Channel off'
                    : labValues.mosfetGateVoltage < 6
                      ? 'Under-driven channel'
                      : mosfetJunctionTemperature > 125
                        ? 'Thermal limit'
                        : 'Switching loss'}
                </span>
                <strong>{mosfetTotalLoss.toFixed(2)} W total</strong>
                <small>
                  PCOND {mosfetConductionLoss.toFixed(2)} W · PSW{' '}
                  {mosfetSwitchingLoss.toFixed(2)} W · PGATE{' '}
                  {mosfetGateDriveLoss.toFixed(3)} W
                </small>
                <small>
                  ID {mosfetDrainCurrent.toFixed(2)} A · VDS{' '}
                  {mosfetDrainVoltage.toFixed(2)} V · RDS{' '}
                  {mosfetOn ? (mosfetOnResistance * 1000).toFixed(1) : '—'} mΩ
                </small>
                <small>
                  {mosfetTransitionTime.toFixed(0)} ns edges ·{' '}
                  {mosfetLoadPower.toFixed(1)} W load ·{' '}
                  {mosfetEfficiency.toFixed(1)}% efficient · Tj{' '}
                  {mosfetJunctionTemperature.toFixed(0)} °C
                </small>
              </div>
            </>
          ) : activeLab.id === 'lab-pid' ? (
            <>
              <label className="labControl">
                <span>Proportional gain</span>
                <strong>{labValues.pidProportionalGain.toFixed(2)}</strong>
                <input
                  aria-label="PID proportional gain"
                  max="4"
                  min="0.2"
                  onInput={(event) =>
                    onLabValueChange(
                      'pidProportionalGain',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="0.05"
                  type="range"
                  value={labValues.pidProportionalGain}
                />
              </label>
              <label className="labControl">
                <span>Integral gain</span>
                <strong>{labValues.pidIntegralGain.toFixed(2)} s⁻¹</strong>
                <input
                  aria-label="PID integral gain"
                  max="2"
                  min="0"
                  onInput={(event) =>
                    onLabValueChange(
                      'pidIntegralGain',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="0.05"
                  type="range"
                  value={labValues.pidIntegralGain}
                />
              </label>
              <label className="labControl">
                <span>Derivative gain</span>
                <strong>{labValues.pidDerivativeGain.toFixed(2)} s</strong>
                <input
                  aria-label="PID derivative gain"
                  max="1.2"
                  min="0"
                  onInput={(event) =>
                    onLabValueChange(
                      'pidDerivativeGain',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="0.05"
                  type="range"
                  value={labValues.pidDerivativeGain}
                />
              </label>
              <label className="labControl">
                <span>Plant time constant</span>
                <strong>{labValues.pidPlantTimeConstant.toFixed(1)} s</strong>
                <input
                  aria-label="PID plant time constant"
                  max="3"
                  min="0.5"
                  onInput={(event) =>
                    onLabValueChange(
                      'pidPlantTimeConstant',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="0.1"
                  type="range"
                  value={labValues.pidPlantTimeConstant}
                />
              </label>
              <label className="labControl">
                <span>Position command</span>
                <strong>{labValues.pidSetpoint.toFixed(0)}°</strong>
                <input
                  aria-label="PID position command"
                  max="90"
                  min="20"
                  onInput={(event) =>
                    onLabValueChange(
                      'pidSetpoint',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="5"
                  type="range"
                  value={labValues.pidSetpoint}
                />
              </label>
              <div
                className={`resultBox pidResult ${
                  pidControlEffort >= 95 ||
                  pidOvershoot > 20 ||
                  pidDampingRatio < 0.35
                    ? 'warning'
                    : ''
                }`}
              >
                <span>
                  {pidControlEffort >= 95
                    ? 'Actuator saturated'
                    : pidOvershoot > 20 || pidDampingRatio < 0.35
                      ? 'Underdamped loop'
                      : pidDampingRatio >= 0.65 && pidOvershoot <= 10
                        ? 'Well-damped response'
                        : 'Tuning in progress'}
                </span>
                <strong>{pidSettlingTime.toFixed(2)} s settling</strong>
                <small>
                  ζ {pidDampingRatio.toFixed(2)} · {pidOvershoot.toFixed(1)}%
                  overshoot · {pidRiseTime.toFixed(2)} s rise
                </small>
                <small>
                  Final {pidFinalValue.toFixed(1)}° · error{' '}
                  {pidSteadyStateError.toFixed(2)}° · drive{' '}
                  {pidControlEffort.toFixed(0)}%
                </small>
                <small>Estimated bandwidth {pidNaturalFrequency.toFixed(2)} rad/s</small>
              </div>
            </>
          ) : activeLab.id === 'lab-adc' ? (
            <>
              <label className="labControl">
                <span>Analog input tone</span>
                <strong>{labValues.adcInputFrequency.toFixed(1)} kHz</strong>
                <input
                  aria-label="ADC analog input frequency"
                  max="12"
                  min="0.1"
                  onInput={(event) =>
                    onLabValueChange(
                      'adcInputFrequency',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="0.1"
                  type="range"
                  value={labValues.adcInputFrequency}
                />
              </label>
              <label className="labControl">
                <span>Sample rate</span>
                <strong>{labValues.adcSampleRate.toFixed(1)} kS/s</strong>
                <input
                  aria-label="ADC sample rate"
                  max="24"
                  min="1"
                  onInput={(event) =>
                    onLabValueChange(
                      'adcSampleRate',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="0.5"
                  type="range"
                  value={labValues.adcSampleRate}
                />
              </label>
              <label className="labControl">
                <span>Converter resolution</span>
                <strong>{labValues.adcBitDepth.toFixed(0)} bit</strong>
                <input
                  aria-label="ADC converter resolution"
                  max="16"
                  min="4"
                  onInput={(event) =>
                    onLabValueChange(
                      'adcBitDepth',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="1"
                  type="range"
                  value={labValues.adcBitDepth}
                />
              </label>
              <label className="labControl">
                <span>Reference voltage</span>
                <strong>{labValues.adcReferenceVoltage.toFixed(1)} V</strong>
                <input
                  aria-label="ADC reference voltage"
                  max="5"
                  min="1"
                  onInput={(event) =>
                    onLabValueChange(
                      'adcReferenceVoltage',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="0.1"
                  type="range"
                  value={labValues.adcReferenceVoltage}
                />
              </label>
              <label className="labControl">
                <span>Input amplitude</span>
                <strong>{labValues.adcInputAmplitude.toFixed(2)} Vpk</strong>
                <input
                  aria-label="ADC input amplitude"
                  max="2.5"
                  min="0.1"
                  onInput={(event) =>
                    onLabValueChange(
                      'adcInputAmplitude',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="0.05"
                  type="range"
                  value={labValues.adcInputAmplitude}
                />
              </label>
              <label className="labControl">
                <span>Anti-alias cutoff</span>
                <strong>{labValues.adcFilterCutoff.toFixed(1)} kHz</strong>
                <input
                  aria-label="ADC anti-alias filter cutoff"
                  max="12"
                  min="0.2"
                  onInput={(event) =>
                    onLabValueChange(
                      'adcFilterCutoff',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="0.1"
                  type="range"
                  value={labValues.adcFilterCutoff}
                />
              </label>
              <div
                className={`resultBox adcResult ${
                  adcClipped || adcAliased || adcSamplesPerCycle < 4
                    ? 'warning'
                    : ''
                }`}
              >
                <span>
                  {adcClipped
                    ? 'Input over-range'
                    : adcAliased
                      ? 'Aliased spectrum'
                      : adcSamplesPerCycle < 4
                        ? 'Low sample density'
                        : 'Nyquist-safe capture'}
                </span>
                <strong>{adcDisplayedFrequency.toFixed(2)} kHz displayed</strong>
                <small>
                  Nyquist {adcNyquistFrequency.toFixed(2)} kHz ·{' '}
                  {adcSamplesPerCycle.toFixed(1)} samples/cycle · filter{' '}
                  {(20 * Math.log10(adcFilterGain)).toFixed(1)} dB
                </small>
                <small>
                  ΔV {adcLsbMillivolts.toFixed(2)} mV · peak code{' '}
                  {adcPeakCode.toFixed(0)} · SNR {adcEffectiveSnr.toFixed(1)} dB
                </small>
                <small>
                  Conditioned amplitude {adcFilteredAmplitude.toFixed(2)} Vpk
                </small>
              </div>
            </>
          ) : activeLab.id === 'lab-transformer' ? (
            <>
              <label className="labControl">
                <span>Primary voltage</span>
                <strong>{labValues.transformerPrimaryVoltage.toFixed(0)} V RMS</strong>
                <input
                  aria-label="Transformer primary voltage"
                  max="480"
                  min="24"
                  onInput={(event) =>
                    onLabValueChange(
                      'transformerPrimaryVoltage',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="12"
                  type="range"
                  value={labValues.transformerPrimaryVoltage}
                />
              </label>
              <label className="labControl">
                <span>Source frequency</span>
                <strong>{labValues.transformerFrequency.toFixed(0)} Hz</strong>
                <input
                  aria-label="Transformer source frequency"
                  max="400"
                  min="20"
                  onInput={(event) =>
                    onLabValueChange(
                      'transformerFrequency',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="10"
                  type="range"
                  value={labValues.transformerFrequency}
                />
              </label>
              <label className="labControl">
                <span>Primary winding</span>
                <strong>{labValues.transformerPrimaryTurns.toFixed(0)} turns</strong>
                <input
                  aria-label="Transformer primary turns"
                  max="1200"
                  min="100"
                  onInput={(event) =>
                    onLabValueChange(
                      'transformerPrimaryTurns',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="25"
                  type="range"
                  value={labValues.transformerPrimaryTurns}
                />
              </label>
              <label className="labControl">
                <span>Secondary winding</span>
                <strong>{labValues.transformerSecondaryTurns.toFixed(0)} turns</strong>
                <input
                  aria-label="Transformer secondary turns"
                  max="1000"
                  min="20"
                  onInput={(event) =>
                    onLabValueChange(
                      'transformerSecondaryTurns',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="5"
                  type="range"
                  value={labValues.transformerSecondaryTurns}
                />
              </label>
              <label className="labControl">
                <span>Core cross-section</span>
                <strong>{labValues.transformerCoreArea.toFixed(1)} cm²</strong>
                <input
                  aria-label="Transformer core area"
                  max="30"
                  min="4"
                  onInput={(event) =>
                    onLabValueChange(
                      'transformerCoreArea',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="1"
                  type="range"
                  value={labValues.transformerCoreArea}
                />
              </label>
              <label className="labControl">
                <span>Secondary load</span>
                <strong>{labValues.transformerLoadResistance.toFixed(1)} Ω</strong>
                <input
                  aria-label="Transformer load resistance"
                  max="100"
                  min="2"
                  onInput={(event) =>
                    onLabValueChange(
                      'transformerLoadResistance',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="1"
                  type="range"
                  value={labValues.transformerLoadResistance}
                />
              </label>
              <label className="labControl">
                <span>Equivalent winding resistance</span>
                <strong>{labValues.transformerWindingResistance.toFixed(2)} Ω</strong>
                <input
                  aria-label="Transformer winding resistance"
                  max="5"
                  min="0.05"
                  onInput={(event) =>
                    onLabValueChange(
                      'transformerWindingResistance',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="0.05"
                  type="range"
                  value={labValues.transformerWindingResistance}
                />
              </label>
              <div
                className={`resultBox transformerResult ${
                  transformerSaturated ||
                  transformerLoadPercent > 100 ||
                  transformerTemperatureRise > 55
                    ? 'warning'
                    : ''
                }`}
              >
                <span>
                  {transformerSaturated
                    ? 'Core saturation'
                    : transformerLoadPercent > 100
                      ? 'Secondary overloaded'
                      : transformerTemperatureRise > 55
                        ? 'Thermal margin low'
                        : transformerRegulation > 10
                          ? 'High voltage regulation'
                          : 'Magnetic operating point healthy'}
                </span>
                <strong>{transformerSecondaryVoltage.toFixed(1)} V RMS loaded</strong>
                <small>
                  Ideal {transformerIdealSecondaryVoltage.toFixed(1)} V · ratio{' '}
                  {transformerTurnsRatio.toFixed(3)} · regulation{' '}
                  {transformerRegulation.toFixed(1)}%
                </small>
                <small>
                  I₂ {transformerSecondaryCurrent.toFixed(2)} A · I₁{' '}
                  {transformerPrimaryCurrent.toFixed(2)} A · output{' '}
                  {transformerOutputPower.toFixed(1)} W · load{' '}
                  {transformerLoadPercent.toFixed(0)}%
                </small>
                <small>
                  BMAX {transformerFluxDensity.toFixed(2)} T · IMAG{' '}
                  {transformerMagnetizingCurrent.toFixed(3)} A · efficiency{' '}
                  {transformerEfficiency.toFixed(1)}%
                </small>
                <small>
                  PCU {transformerCopperLoss.toFixed(2)} W · PCORE{' '}
                  {transformerCoreLoss.toFixed(2)} W · total{' '}
                  {transformerTotalLoss.toFixed(2)} W · ΔT{' '}
                  {transformerTemperatureRise.toFixed(0)} °C
                </small>
              </div>
            </>
          ) : activeLab.id === 'lab-transmission' ? (
            <>
              <label className="labControl">
                <span>Line impedance</span>
                <strong>
                  {labValues.transmissionCharacteristicImpedance} Ω
                </strong>
                <input
                  aria-label="Transmission line characteristic impedance"
                  max="100"
                  min="25"
                  onInput={(event) =>
                    onLabValueChange(
                      'transmissionCharacteristicImpedance',
                      Number(event.currentTarget.value),
                    )
                  }
                  type="range"
                  value={labValues.transmissionCharacteristicImpedance}
                />
              </label>
              <label className="labControl">
                <span>Load impedance</span>
                <strong>{labValues.transmissionLoadImpedance} Ω</strong>
                <input
                  aria-label="Transmission line load impedance"
                  max="200"
                  min="1"
                  onInput={(event) =>
                    onLabValueChange(
                      'transmissionLoadImpedance',
                      Number(event.currentTarget.value),
                    )
                  }
                  type="range"
                  value={labValues.transmissionLoadImpedance}
                />
              </label>
              <label className="labControl">
                <span>Electrical length</span>
                <strong>{labValues.transmissionElectricalLength}°</strong>
                <input
                  aria-label="Transmission line electrical length"
                  max="360"
                  min="0"
                  onInput={(event) =>
                    onLabValueChange(
                      'transmissionElectricalLength',
                      Number(event.currentTarget.value),
                    )
                  }
                  step="5"
                  type="range"
                  value={labValues.transmissionElectricalLength}
                />
              </label>
              <div
                className={`resultBox transmissionResult ${
                  transmissionVswr > 1.22 ? 'mismatch' : ''
                }`}
              >
                <span>
                  {transmissionVswr <= 1.22
                    ? 'Matched link'
                    : 'Reflected energy'}
                </span>
                <strong>{transmissionVswr.toFixed(2)}:1 VSWR</strong>
                <small>
                  Γ {transmissionReflectionCoefficient.toFixed(3)} · RL{' '}
                  {transmissionReturnLoss.toFixed(1)} dB · phase{' '}
                  {transmissionReflectionMagnitude < 0.001
                    ? '—'
                    : `${transmissionReflectionPhase.toFixed(0)}°`}
                </small>
                <small>
                  {transmissionReflectedVoltage.toFixed(3)} V reflected ·{' '}
                  {transmissionDeliveredPower.toFixed(1)}% power delivered
                </small>
              </div>
            </>
          ) : (
            <>
              <label className="labControl">
                <span>Line voltage</span>
                <strong>{labValues.lineVoltage} V</strong>
                <input
                  aria-label="Line voltage"
                  max="600"
                  min="120"
                  onInput={(event) =>
                    onLabValueChange('lineVoltage', Number(event.currentTarget.value))
                  }
                  step="10"
                  type="range"
                  value={labValues.lineVoltage}
                />
              </label>
              <label className="labControl">
                <span>Line current</span>
                <strong>{labValues.lineCurrent} A</strong>
                <input
                  aria-label="Line current"
                  max="50"
                  min="1"
                  onInput={(event) =>
                    onLabValueChange('lineCurrent', Number(event.currentTarget.value))
                  }
                  type="range"
                  value={labValues.lineCurrent}
                />
              </label>
              <label className="labControl">
                <span>Power factor</span>
                <strong>{labValues.powerFactor.toFixed(2)}</strong>
                <input
                  aria-label="Power factor"
                  max="1"
                  min="0.5"
                  onInput={(event) =>
                    onLabValueChange('powerFactor', Number(event.currentTarget.value))
                  }
                  step="0.01"
                  type="range"
                  value={labValues.powerFactor}
                />
              </label>
              <div className="resultBox">
                <span>Formula</span>
                <strong>P = √3 VLL IL pf</strong>
                <small>{threePhasePower.toFixed(2)} kW real power</small>
              </div>
            </>
          )}
            </>
          ) : (
            <section className="labFaultPanel" aria-label="Fault diagnosis case">
              <header>
                <div>
                  <p className="eyebrow">Fault Hunt</p>
                  <h2>{activeFaultCase.title}</h2>
                </div>
                <span>+{activeFaultCase.xp} XP</span>
              </header>

              <nav className="labFaultTabs" aria-label="Fault cases">
                {faultCases.map((faultCase, index) => {
                  const isComplete = completedFaultCaseIds.includes(
                    faultCase.id,
                  );

                  return (
                    <button
                      aria-label={`Fault case ${index + 1}: ${faultCase.title}${
                        isComplete ? ', solved' : ''
                      }`}
                      aria-pressed={faultCase.id === activeFaultCase.id}
                      className={isComplete ? 'complete' : ''}
                      key={faultCase.id}
                      onClick={() => handleFaultCaseSelect(faultCase.id)}
                      type="button"
                    >
                      {isComplete ? <Check size={16} /> : <span>{index + 1}</span>}
                      <strong>{faultCase.title}</strong>
                    </button>
                  );
                })}
              </nav>

              <div className="labFaultSymptom">
                <TriangleAlert size={19} />
                <span>
                  <strong>Reported symptom</strong>
                  <small>{activeFaultCase.symptom}</small>
                </span>
              </div>

              <section className="labMeasurementBench" aria-label="Meter tests">
                <header>
                  <span>Meter tests</span>
                  <small>Choose a safe measurement point</small>
                </header>
                <div className="labMeasurementChoices">
                  {activeFaultCase.measurements.map((measurement) => (
                    <button
                      aria-pressed={measurement.id === selectedMeasurementId}
                      className={
                        measurement.id === selectedMeasurementId ? 'active' : ''
                      }
                      key={measurement.id}
                      onClick={() => {
                        setSelectedMeasurementId(measurement.id);
                        setFaultFeedback(null);
                      }}
                      type="button"
                    >
                      <CircleGauge size={15} />
                      <span>{measurement.label}</span>
                    </button>
                  ))}
                </div>

                <div
                  className={`labMeterReadout ${
                    selectedFaultMeasurement ? 'active' : ''
                  }`}
                  aria-live="polite"
                >
                  <header>
                    <span>
                      {selectedFaultMeasurement?.mode ?? 'SELECT TEST'}
                    </span>
                    <em>CAT III</em>
                  </header>
                  <strong>
                    {selectedFaultMeasurement?.reading ?? '— — — —'}
                  </strong>
                  <small>
                    {selectedFaultMeasurement?.note ??
                      'Select a measurement above to place the virtual probes.'}
                  </small>
                </div>
              </section>

              <fieldset className="labDiagnosisChoices">
                <legend>Choose the diagnosis</legend>
                {activeFaultCase.diagnoses.map((diagnosis) => (
                  <label
                    className={
                      selectedDiagnosisId === diagnosis.id ? 'selected' : ''
                    }
                    key={diagnosis.id}
                  >
                    <input
                      checked={selectedDiagnosisId === diagnosis.id}
                      name={`diagnosis-${activeFaultCase.id}`}
                      onChange={() => {
                        setSelectedDiagnosisId(diagnosis.id);
                        setFaultFeedback(null);
                      }}
                      type="radio"
                      value={diagnosis.id}
                    />
                    <span>
                      <strong>{diagnosis.label}</strong>
                      <small>{diagnosis.detail}</small>
                    </span>
                  </label>
                ))}
              </fieldset>

              <div className="labSafetyNote">
                <TriangleAlert size={17} />
                <span>
                  <strong>Safe test order</strong>
                  <small>{activeFaultCase.safetyNote}</small>
                </span>
              </div>

              {faultFeedback && (
                <div
                  className={`labFaultFeedback ${faultFeedback.kind}`}
                  aria-live="polite"
                >
                  {faultFeedback.kind === 'success' ? (
                    <CheckCircle2 size={19} />
                  ) : (
                    <RotateCcw size={19} />
                  )}
                  <span>
                    <strong>
                      {faultFeedback.kind === 'success'
                        ? 'Case closed'
                        : 'Evidence mismatch'}
                    </strong>
                    <small>{faultFeedback.message}</small>
                    {faultFeedback.kind === 'success' && (
                      <p>{activeFaultCase.explanation}</p>
                    )}
                  </span>
                </div>
              )}

              <button
                className="primaryButton fullWidth"
                disabled={!selectedDiagnosisId || !selectedMeasurementId}
                onClick={handleFaultDiagnosisCheck}
                type="button"
              >
                {activeFaultComplete ? 'Verify Diagnosis' : 'Check Diagnosis'}
                <Wrench size={18} />
              </button>
            </section>
          )}

          <div className="focusActionStack">
            <button className="primaryButton fullWidth" onClick={onSave} type="button">
              Save Lab
              <CheckCircle2 size={18} />
            </button>
            <button
              className="secondaryButton fullWidth labBenchLogButton"
              onClick={() => setBenchLogOpen(true)}
              type="button"
            >
              <History size={18} />
              Bench Log
              <span>{labRunHistory.length}</span>
            </button>
            <button
              className="secondaryButton fullWidth journalCaptureButton"
              onClick={onOpenJournal}
              type="button"
            >
              <NotebookPen size={18} />
              Add field note
            </button>
            <button
              aria-pressed={isFormulaSaved}
              className={`secondaryButton fullWidth labFormulaButton ${
                isFormulaSaved ? 'saved' : ''
              }`}
              onClick={onToggleFormula}
              type="button"
            >
              <NotebookTabs size={18} />
              {isFormulaSaved ? 'Formula in notebook' : 'Save formula'}
            </button>
            <button className="secondaryButton fullWidth" onClick={onOpenPractice} type="button">
              Practice This Topic
              <ArrowRight size={18} />
            </button>
          </div>
        </aside>
      </div>

      {benchLogOpen && (
        <LabBenchLog
          currentOutput={output}
          currentValues={labValues}
          labId={activeLab.id}
          labTitle={activeLab.title}
          onClose={() => setBenchLogOpen(false)}
          onDelete={onDeleteRun}
          onRestore={onRestoreRun}
          runs={labRunHistory}
        />
      )}
    </section>
  );
}

type CareerProjectPageProps = {
  lab: LabScenario;
  onAnswer: (decisionId: string, optionId: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  project: CareerProject;
  readiness: CareerReadiness;
  record?: CareerProjectRecord;
};

function CareerProjectPage({
  lab,
  onAnswer,
  onBack,
  onSubmit,
  project,
  readiness,
  record,
}: CareerProjectPageProps) {
  const [activeDecisionIndex, setActiveDecisionIndex] = useState(0);
  const [reviewedDecisionIds, setReviewedDecisionIds] = useState<string[]>([]);
  const activeDecision =
    project.decisions[activeDecisionIndex] ?? project.decisions[0];
  const selectedOptionId = record?.answers[activeDecision.id] ?? null;
  const selectedOption = activeDecision.options.find(
    (option) => option.id === selectedOptionId,
  );
  const decisionReviewed = reviewedDecisionIds.includes(activeDecision.id);
  const selectedIsCorrect =
    selectedOptionId === activeDecision.correctOptionId;
  const answeredCount = project.decisions.filter(
    (decision) => record?.answers[decision.id],
  ).length;
  const allAnswered = answeredCount === project.decisions.length;
  const reviewedCount = project.decisions.filter((decision) =>
    reviewedDecisionIds.includes(decision.id),
  ).length;
  const currentMatchCount = project.decisions.filter(
    (decision) =>
      record?.answers[decision.id] === decision.correctOptionId,
  ).length;

  useEffect(() => {
    setActiveDecisionIndex(0);
    setReviewedDecisionIds([]);
  }, [project.role]);

  function handleSelectOption(optionId: string) {
    setReviewedDecisionIds((decisionIds) =>
      decisionIds.filter((decisionId) => decisionId !== activeDecision.id),
    );
    onAnswer(activeDecision.id, optionId);
  }

  function handleReviewDecision() {
    if (!selectedOptionId) {
      return;
    }

    setReviewedDecisionIds((decisionIds) =>
      decisionIds.includes(activeDecision.id)
        ? decisionIds
        : [...decisionIds, activeDecision.id],
    );
  }

  function handleNextDecision() {
    setActiveDecisionIndex(
      (activeDecisionIndex + 1) % project.decisions.length,
    );
  }

  return (
    <section className="careerProjectPage" aria-label="Career project studio">
      <header className="careerProjectHeader">
        <button
          className="secondaryButton compactHeaderBack"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          Back to career
        </button>

        <div>
          <p className="eyebrow">Project Studio · {project.role}</p>
          <h1>{project.title}</h1>
          <p>{project.deliverable}</p>
        </div>

        <div className="careerProjectHeaderScore" aria-label="Project progress">
          <span>{record?.completedAt ? 'Evidence score' : 'Decisions complete'}</span>
          <strong>
            {record?.completedAt
              ? `${record.score}%`
              : `${answeredCount}/${project.decisions.length}`}
          </strong>
        </div>
      </header>

      <section className="careerProjectBrief" aria-label="Project brief">
        <div className="careerProjectBriefCopy">
          <span className="careerProjectBriefIcon">
            <Target size={24} />
          </span>
          <div>
            <p className="eyebrow">Engineering brief</p>
            <h2>{project.brief}</h2>
          </div>
        </div>

        <div className="careerProjectVisual">
          <img
            src={resolvePublicAssetPath(lab.diagram)}
            alt={`${lab.title} verified project reference`}
          />
          <span>
            <CheckCircle2 size={14} />
            {lab.visualLabel}
          </span>
        </div>

        <div className="careerProjectConstraints">
          {project.constraints.map((constraint) => (
            <span key={constraint}>{constraint}</span>
          ))}
        </div>
      </section>

      <section className="careerProjectProgress" aria-label="Project status">
        <div>
          <BrainCircuit size={18} />
          <span>Role readiness</span>
          <strong>{readiness.score}%</strong>
        </div>
        <div>
          <CheckCircle2 size={18} />
          <span>Answered</span>
          <strong>{answeredCount}/{project.decisions.length}</strong>
        </div>
        <div>
          <Eye size={18} />
          <span>Reviewed</span>
          <strong>{reviewedCount}/{project.decisions.length}</strong>
        </div>
        <div>
          <Zap size={18} />
          <span>Completion reward</span>
          <strong>+{project.xp} XP</strong>
        </div>
      </section>

      <div className="careerProjectLayout">
        <article className="careerDecisionWorkspace">
          <nav className="careerDecisionTabs" aria-label="Project decisions">
            {project.decisions.map((decision, index) => {
              const hasAnswer = Boolean(record?.answers[decision.id]);
              const reviewed = reviewedDecisionIds.includes(decision.id);

              return (
                <button
                  aria-pressed={index === activeDecisionIndex}
                  className={index === activeDecisionIndex ? 'active' : ''}
                  key={decision.id}
                  onClick={() => setActiveDecisionIndex(index)}
                  type="button"
                >
                  <span>
                    {reviewed ? (
                      <Check size={15} />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div>
                    <small>Decision {index + 1}</small>
                    <strong>{decision.title}</strong>
                  </div>
                  {hasAnswer && <em>{reviewed ? 'Reviewed' : 'Selected'}</em>}
                </button>
              );
            })}
          </nav>

          <section className="careerDecisionPanel" aria-live="polite">
            <header>
              <div>
                <p className="eyebrow">
                  Decision {activeDecisionIndex + 1} of {project.decisions.length}
                </p>
                <h2>{activeDecision.title}</h2>
              </div>
              <span>{activeDecisionIndex + 1}</span>
            </header>

            <p className="careerDecisionPrompt">{activeDecision.prompt}</p>

            <div className="careerDecisionOptions">
              {activeDecision.options.map((option) => {
                const isSelected = option.id === selectedOptionId;

                return (
                  <button
                    aria-pressed={isSelected}
                    className={isSelected ? 'selected' : ''}
                    key={option.id}
                    onClick={() => handleSelectOption(option.id)}
                    type="button"
                  >
                    <span className="careerOptionRadio">
                      {isSelected && <Check size={14} />}
                    </span>
                    <div>
                      <strong>{option.label}</strong>
                      <small>{option.detail}</small>
                    </div>
                    <em>{option.signal}</em>
                  </button>
                );
              })}
            </div>

            {decisionReviewed && selectedOption && (
              <div
                className={`careerDecisionFeedback ${
                  selectedIsCorrect ? 'correct' : 'rethink'
                }`}
              >
                {selectedIsCorrect ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <TriangleAlert size={20} />
                )}
                <div>
                  <strong>
                    {selectedIsCorrect
                      ? 'Decision holds'
                      : 'Decision needs another pass'}
                  </strong>
                  <p>{activeDecision.explanation}</p>
                </div>
              </div>
            )}

            <footer>
              <button
                className="secondaryButton"
                disabled={!selectedOptionId}
                onClick={handleReviewDecision}
                type="button"
              >
                <Eye size={16} />
                {decisionReviewed ? 'Evidence reviewed' : 'Review decision'}
              </button>
              <button
                className="primaryButton"
                disabled={!decisionReviewed}
                onClick={handleNextDecision}
                type="button"
              >
                {activeDecisionIndex === project.decisions.length - 1
                  ? 'Return to first'
                  : 'Next decision'}
                <ArrowRight size={16} />
              </button>
            </footer>
          </section>
        </article>

        <aside className="careerEvidencePanel" aria-label="Project evidence report">
          <header>
            <span>
              <Award size={21} />
            </span>
            <div>
              <p className="eyebrow">Evidence report</p>
              <h2>
                {record?.completedAt
                  ? `${record.score}% submitted`
                  : 'Submission review'}
              </h2>
            </div>
          </header>

          <div className="careerEvidenceList">
            {project.decisions.map((decision, index) => {
              const answerId = record?.answers[decision.id];
              const answer = decision.options.find(
                (option) => option.id === answerId,
              );
              const answerMatches = answerId === decision.correctOptionId;

              return (
                <div
                  className={
                    record?.completedAt
                      ? answerMatches
                        ? 'matched'
                        : 'revisit'
                      : answer
                        ? 'answered'
                        : ''
                  }
                  key={decision.id}
                >
                  <span>
                    {record?.completedAt && answerMatches ? (
                      <Check size={15} />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div>
                    <strong>{decision.title}</strong>
                    <small>{answer?.label ?? 'Decision pending'}</small>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="careerEvidenceMeter">
            <span>
              <small>Decision match</small>
              <strong>
                {currentMatchCount}/{project.decisions.length}
              </strong>
            </span>
            <div>
              <span
                style={{
                  width: `${(currentMatchCount / project.decisions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {record?.completedAt && (
            <div className="careerEvidenceComplete">
              <CheckCircle2 size={19} />
              <div>
                <strong>Project evidence submitted</strong>
                <small>
                  Best score {record.score}% · readiness signal active
                </small>
              </div>
            </div>
          )}

          <button
            className="primaryButton fullWidth"
            disabled={!allAnswered}
            onClick={onSubmit}
            type="button"
          >
            <Award size={17} />
            {record?.completedAt ? 'Update evidence score' : 'Submit project review'}
          </button>

          {!allAnswered && (
            <small className="careerEvidenceHint">
              {project.decisions.length - answeredCount}{' '}
              {project.decisions.length - answeredCount === 1
                ? 'decision'
                : 'decisions'}{' '}
              remaining
            </small>
          )}
        </aside>
      </div>
    </section>
  );
}

type CareerFocusPageProps = {
  careerOptions: CareerReadiness[];
  comparisonReadiness: CareerReadiness;
  isTuned: boolean;
  onBack: () => void;
  onCompare: (role: string) => void;
  onOpenLab: (labId: string) => void;
  onOpenJournal: () => void;
  onOpenPortfolio: () => void;
  onOpenProject: () => void;
  onOpenSkill: (skillId: string) => void;
  onStartSprint: () => void;
  onTunePath: () => void;
  readiness: CareerReadiness;
  selectedCareer: CareerTrack;
};

function CareerFocusPage({
  careerOptions,
  comparisonReadiness,
  isTuned,
  onBack,
  onCompare,
  onOpenLab,
  onOpenJournal,
  onOpenPortfolio,
  onOpenProject,
  onOpenSkill,
  onStartSprint,
  onTunePath,
  readiness,
  selectedCareer,
}: CareerFocusPageProps) {
  const readinessLabel = getCareerReadinessLabel(readiness.score);
  const comparisonDelta = readiness.score - comparisonReadiness.score;
  const labStepComplete =
    readiness.labTotal > 0 && readiness.labCompleted >= readiness.labTotal;
  const skillStepComplete = readiness.focusSkill.progress >= 70;
  const completedRoadmapSteps = [
    skillStepComplete,
    labStepComplete,
    readiness.sprintCompleted,
    readiness.projectCompleted,
  ].filter(Boolean).length;
  const readinessSignals = [
    {
      detail: 'weighted role skills',
      label: 'Core skills',
      value: readiness.skillScore,
    },
    {
      detail: `${readiness.labCompleted}/${readiness.labTotal} calibrations`,
      label: 'Lab evidence',
      value: readiness.labScore,
    },
    {
      detail: 'all practice attempts',
      label: 'Practice',
      value: readiness.practiceScore,
    },
    {
      detail: readiness.sprintCompleted ? 'latest Power Sprint' : 'no sprint yet',
      label: 'Sprint',
      value: readiness.sprintScore,
    },
    {
      detail: readiness.projectCompleted
        ? 'submitted role evidence'
        : 'project not submitted',
      label: 'Project',
      value: readiness.projectScore,
    },
  ];

  return (
    <section className="lessonFocusPage" aria-label="Career page">
      <header className="lessonPageHeader">
        <button
          className="secondaryButton lessonBackButton compactHeaderBack"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          Back to careers
        </button>

        <div>
          <p className="eyebrow">Career Path</p>
          <h1>{selectedCareer.role}</h1>
          <p>{selectedCareer.focus}</p>
        </div>

        <div className="lessonPageStats" aria-label="Career match">
          <span>Readiness</span>
          <strong>{readiness.score}%</strong>
        </div>
      </header>

      <div className="lessonFocusGrid careerFocusGrid">
        <article className="lessonQuestionCard careerStage">
          <div className="careerReadinessLead">
            <div className="careerMatchHero">
              <GraduationCap size={28} />
              <strong>{readiness.score}%</strong>
              <span>{readinessLabel}</span>
            </div>

            <div>
              <p className="eyebrow">Role project</p>
              <h2>{readiness.profile.projectTitle}</h2>
              <p>{readiness.profile.projectDescription}</p>
              <button
                className="secondaryButton careerProjectLaunch"
                onClick={onOpenProject}
                type="button"
              >
                {readiness.projectCompleted
                  ? `Reopen project · ${readiness.projectScore}%`
                  : 'Open Project Studio'}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <section className="careerSignalMatrix" aria-label="Readiness signals">
            <header>
              <div>
                <p className="eyebrow">Live signals</p>
                <h2>What moves your readiness</h2>
              </div>
              <span>Updated from your work</span>
            </header>

            <div>
              {readinessSignals.map((signal) => (
                <div className="careerSignal" key={signal.label}>
                  <header>
                    <span>{signal.label}</span>
                    <strong>{signal.value}%</strong>
                  </header>
                  <div className="careerSignalMeter" aria-hidden="true">
                    <span style={{ width: `${signal.value}%` }} />
                  </div>
                  <small>{signal.detail}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="careerComparison" aria-label="Compare career readiness">
            <header>
              <span className="careerComparisonIcon">
                <BarChart3 size={20} />
              </span>
              <div>
                <p className="eyebrow">Role comparison</p>
                <h2>See where your skills travel</h2>
              </div>
            </header>

            <label>
              <span>Compare with</span>
              <select
                aria-label="Compare career role"
                onChange={(event) => onCompare(event.currentTarget.value)}
                value={comparisonReadiness.role}
              >
                {careerOptions
                  .filter((career) => career.role !== readiness.role)
                  .map((career) => (
                    <option key={career.role} value={career.role}>
                      {career.role}
                    </option>
                  ))}
              </select>
            </label>

            <div className="careerComparisonScores">
              <div className="selected">
                <span>{selectedCareer.role}</span>
                <strong>{readiness.score}%</strong>
              </div>
              <div>
                <span>{comparisonReadiness.role}</span>
                <strong>{comparisonReadiness.score}%</strong>
              </div>
            </div>

            <p>
              {comparisonDelta === 0
                ? 'Both roles are currently even. Your next completed step will separate them.'
                : `${selectedCareer.role} is ${Math.abs(comparisonDelta)} readiness points ${
                    comparisonDelta > 0 ? 'ahead' : 'behind'
                  } for your current skill mix.`}
            </p>
          </section>
        </article>

        <aside className="lessonSupportPanel careerSupportPanel" aria-label="Career actions">
          <div className="lessonPageMeta">
            <span>{isTuned ? 'Active career path' : 'Available career path'}</span>
            <strong>
              {isTuned
                ? `Adaptive practice follows ${readiness.focusSkill.title}`
                : 'Tune adaptive practice toward this role'}
            </strong>
            <p>
              Your tuned role chooses the lowest available role skill for daily practice
              and Power Sprints.
            </p>
          </div>

          <div className="careerSkillHeader">
            <div>
              <p className="eyebrow">Skill map</p>
              <h2>Role signals</h2>
            </div>
            <span>{readiness.skillScore}%</span>
          </div>

          <div className="careerSkillSignalList">
            {readiness.skills.map((skill) => (
              <div className={skill.status === 'Locked' ? 'locked' : ''} key={skill.id}>
                <header>
                  <span>
                    {skill.status === 'Locked' ? <Lock size={15} /> : <Check size={15} />}
                    {skill.label}
                  </span>
                  <strong>{skill.progress}%</strong>
                </header>
                <div className="careerSkillMeter" aria-hidden="true">
                  <span style={{ width: `${skill.progress}%` }} />
                </div>
                <small>
                  {skill.status === 'Locked'
                    ? `${skill.title} unlocks later in the path`
                    : skill.progress >= 70
                      ? 'Strong signal'
                      : 'Build next'}
                </small>
              </div>
            ))}
          </div>

          <div className="focusActionStack">
            <button
              className="primaryButton fullWidth"
              disabled={isTuned}
              onClick={onTunePath}
              type="button"
            >
              {isTuned ? 'Path Active' : 'Tune Path'}
              {isTuned ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
            </button>
            <button
              className="secondaryButton fullWidth"
              onClick={() => onOpenSkill(readiness.focusSkill.id)}
              type="button"
            >
              Practice {readiness.focusSkill.label}
              <ArrowRight size={18} />
            </button>
            <button
              className="secondaryButton fullWidth journalCaptureButton"
              onClick={onOpenJournal}
              type="button"
            >
              <NotebookPen size={18} />
              Add field note
            </button>
            <button
              className="secondaryButton fullWidth"
              onClick={onOpenPortfolio}
              type="button"
            >
              <Award size={18} />
              Open Evidence Portfolio
            </button>
          </div>
        </aside>
      </div>

      <section className="careerRoadmap" aria-label="Career action roadmap">
        <header>
          <div>
            <p className="eyebrow">Action roadmap</p>
            <h2>Build evidence for this role</h2>
            <p>Each step updates the readiness score above as soon as you complete it.</p>
          </div>
          <span>{completedRoadmapSteps}/4 steps complete</span>
        </header>

        <div className="careerRoadmapList">
          <article className={skillStepComplete ? 'complete' : ''}>
            <span className="careerRoadmapIcon">
              <BrainCircuit size={21} />
            </span>
            <div>
              <small>Step 1 · Core skill</small>
              <h3>Strengthen {readiness.focusSkill.label}</h3>
              <p>
                Bring {readiness.focusSkill.title} from {readiness.focusSkill.progress}%
                toward the 70% role-ready threshold.
              </p>
            </div>
            <span className="careerRoadmapStatus">
              {skillStepComplete ? <CheckCircle2 size={16} /> : <CircleGauge size={16} />}
              {skillStepComplete ? 'Complete' : `${readiness.focusSkill.progress}%`}
            </span>
            <button
              className="secondaryButton"
              onClick={() => onOpenSkill(readiness.focusSkill.id)}
              type="button"
            >
              {skillStepComplete ? 'Practice again' : 'Open practice'}
              <ArrowRight size={16} />
            </button>
          </article>

          <article className={labStepComplete ? 'complete' : ''}>
            <span className="careerRoadmapIcon lab">
              <FlaskConical size={21} />
            </span>
            <div>
              <small>Step 2 · Lab evidence</small>
              <h3>Calibrate {readiness.profile.labLabel}</h3>
              <p>
                Complete all bench targets to turn the role’s theory into measured
                evidence.
              </p>
            </div>
            <span className="careerRoadmapStatus">
              {labStepComplete ? <CheckCircle2 size={16} /> : <CircleGauge size={16} />}
              {readiness.labCompleted}/{readiness.labTotal}
            </span>
            <button
              className="secondaryButton"
              onClick={() => onOpenLab(readiness.profile.labId)}
              type="button"
            >
              {labStepComplete ? 'Reopen lab' : 'Open lab'}
              <ArrowRight size={16} />
            </button>
          </article>

          <article className={readiness.sprintCompleted ? 'complete' : ''}>
            <span className="careerRoadmapIcon sprint">
              <Zap size={21} />
            </span>
            <div>
              <small>Step 3 · Speed check</small>
              <h3>Run a role-focused Power Sprint</h3>
              <p>
                Answer five adaptive prompts centered on your weakest available role
                skill.
              </p>
            </div>
            <span className="careerRoadmapStatus">
              {readiness.sprintCompleted ? (
                <CheckCircle2 size={16} />
              ) : (
                <Clock3 size={16} />
              )}
              {readiness.sprintCompleted ? `${readiness.sprintScore}%` : 'Ready'}
            </span>
            <button className="secondaryButton" onClick={onStartSprint} type="button">
              {readiness.sprintCompleted ? 'Run another' : 'Start sprint'}
              <ArrowRight size={16} />
            </button>
          </article>

          <article className={readiness.projectCompleted ? 'complete' : ''}>
            <span className="careerRoadmapIcon project">
              <Target size={21} />
            </span>
            <div>
              <small>Step 4 · Project evidence</small>
              <h3>{readiness.profile.projectTitle}</h3>
              <p>
                Make three engineering decisions and submit a review-ready evidence
                score for this role.
              </p>
            </div>
            <span className="careerRoadmapStatus">
              {readiness.projectCompleted ? (
                <CheckCircle2 size={16} />
              ) : (
                <Target size={16} />
              )}
              {readiness.projectCompleted
                ? `${readiness.projectScore}%`
                : 'Ready'}
            </span>
            <button className="secondaryButton" onClick={onOpenProject} type="button">
              {readiness.projectCompleted ? 'Reopen project' : 'Start project'}
              <ArrowRight size={16} />
            </button>
          </article>
        </div>
      </section>
    </section>
  );
}

type ZyGuideProps = {
  className?: string;
  compact?: boolean;
  label: string;
  messages: string[];
  mood?: ZyGuideMood;
  showTutorShortcut?: boolean;
};

const ZY_REACTION_SEQUENCE: Exclude<ZyReaction, 'idle'>[] = [
  'wave',
  'wink',
  'curious',
  'think',
  'gasp',
  'boost',
  'celebrate',
  'dance',
];

const ZY_REACTION_MESSAGES: Record<Exclude<ZyReaction, 'idle'>, string> = {
  boost: 'Systems warm, flippers ready. One focused step will move this forward.',
  celebrate: 'That deserves a happy little waddle. Keep the momentum going.',
  curious: 'Interesting. What do you expect to change first?',
  dance: 'Tiny victory dance complete. Now let us turn that energy into progress.',
  gasp: 'Oh! That changes the signal. Let us look closely at what moved.',
  think: 'Let me think... start with what is known, then trace one connection at a time.',
  wave: 'Hey, I am right here. Let us take the next move together.',
  wink: 'You have this. I will keep one eye on the next step.',
};

function ZyGuide({
  className = '',
  compact = false,
  label,
  messages,
  mood = 'idle',
  showTutorShortcut = true,
}: ZyGuideProps) {
  const openTutor = useContext(ZyTutorLaunchContext);
  const [tipIndex, setTipIndex] = useState(0);
  const [reactionCount, setReactionCount] = useState(0);
  const [reaction, setReaction] = useState<ZyReaction>('idle');
  const [interactionMessage, setInteractionMessage] = useState('');
  const message =
    interactionMessage ||
    messages[tipIndex % Math.max(1, messages.length)] ||
    'Your next step is ready.';
  const reactionClass =
    reactionCount === 0 ? '' : reactionCount % 2 === 0 ? 'reactEven' : 'reactOdd';
  const canLaunchTutor = Boolean(openTutor && showTutorShortcut);

  useEffect(() => {
    if (reaction === 'idle') {
      return;
    }

    const reactionDuration =
      reaction === 'dance' ? 2300 : reaction === 'think' ? 2000 : 1700;
    const timeout = window.setTimeout(() => {
      setReaction('idle');
      setInteractionMessage('');
    }, reactionDuration);

    return () => window.clearTimeout(timeout);
  }, [reaction, reactionCount]);

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const normalizedX = Math.max(
      -1,
      Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2),
    );
    const normalizedY = Math.max(
      -1,
      Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2),
    );

    event.currentTarget.style.setProperty('--zy-look-x', `${normalizedX * 4}px`);
    event.currentTarget.style.setProperty('--zy-look-y', `${normalizedY * 3}px`);
    event.currentTarget.style.setProperty('--zy-tilt-x', `${normalizedY * -4}deg`);
    event.currentTarget.style.setProperty('--zy-tilt-y', `${normalizedX * 7}deg`);
    event.currentTarget.style.setProperty('--zy-shift-x', `${normalizedX * 2}px`);
  }

  function handlePointerLeave(event: ReactPointerEvent<HTMLButtonElement>) {
    event.currentTarget.style.setProperty('--zy-look-x', '0px');
    event.currentTarget.style.setProperty('--zy-look-y', '0px');
    event.currentTarget.style.setProperty('--zy-tilt-x', '0deg');
    event.currentTarget.style.setProperty('--zy-tilt-y', '0deg');
    event.currentTarget.style.setProperty('--zy-shift-x', '0px');
  }

  function handleNextTip() {
    setTipIndex((index) => (index + 1) % Math.max(1, messages.length));
    setReactionCount((count) => count + 1);
    setReaction('curious');
    setInteractionMessage('');
  }

  function handleCharacterInteract() {
    const nextCount = reactionCount + 1;
    const nextReaction =
      ZY_REACTION_SEQUENCE[(nextCount - 1) % ZY_REACTION_SEQUENCE.length];

    setReactionCount(nextCount);
    setReaction(nextReaction);
    setInteractionMessage(ZY_REACTION_MESSAGES[nextReaction]);
  }

  function handleTutorLaunch() {
    setReactionCount((count) => count + 1);
    setReaction('boost');
    openTutor?.();
  }

  return (
    <section
      className={`zyGuide mood-${mood} reaction-${reaction} ${
        compact ? 'compact' : ''
      } ${className}`.trim()}
      aria-label="Zy learning guide"
    >
      <div className={`zyCharacterStage ${canLaunchTutor ? 'hasTutor' : ''}`}>
        <button
          aria-label="Interact with Zy the penguin coach"
          className={`zyCharacter ${reactionClass} reaction-${reaction}`}
          onClick={handleCharacterInteract}
          onPointerLeave={handlePointerLeave}
          onPointerMove={handlePointerMove}
          title="Tap Zy the penguin coach"
          type="button"
        >
          <span className="zyModel" aria-hidden="true">
            <span className="zyShadow" />
            <span className="zyPulse" />
            <span className="zyPose">
              <span className="zyAntenna">
                <i />
              </span>
              <span className="zySidePod left" />
              <span className="zySidePod right" />
              <span className="zyHead">
                <span className="zyScreen">
                  <span className="zyBrow left" />
                  <span className="zyBrow right" />
                  <span className="zyEye left">
                    <i />
                  </span>
                  <span className="zyEye right">
                    <i />
                  </span>
                  <span className="zyCheek left" />
                  <span className="zyCheek right" />
                  <span className="zyConcernDrop" />
                  <span className="zyMouth">
                    <i />
                  </span>
                </span>
              </span>
              <span className="zyThoughtDots">
                <i />
                <i />
                <i />
              </span>
              <span className="zyNeck" />
              <span className="zyTorso">
                <span className="zyCore">
                  <Zap size={16} strokeWidth={3} />
                </span>
              </span>
              <span className="zyArm left" />
              <span className="zyArm right" />
              <span className="zyFoot left" />
              <span className="zyFoot right" />
              <span className="zySpark one" />
              <span className="zySpark two" />
              <span className="zySpark three" />
              <span className="zySpark four" />
            </span>
          </span>
        </button>
        {canLaunchTutor && (
          <button
            aria-label="Open Zy Tutor"
            className="zyCharacterChat"
            onClick={handleTutorLaunch}
            title="Open Zy Tutor"
            type="button"
          >
            <MessageCircleQuestion size={15} />
          </button>
        )}
      </div>

      <div className="zyGuideBubble">
        <div className="zyGuideMeta">
          <span>
            <Sparkles size={14} />
            {label}
          </span>
          <button
            aria-label="Show another tip"
            className="zyTipButton"
            onClick={handleNextTip}
            title="Another tip"
            type="button"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        <p key={`${tipIndex}-${reactionCount}-${message}`}>{message}</p>
        <span className="srOnly" aria-live="polite">
          {interactionMessage}
        </span>
      </div>
    </section>
  );
}

type GetStartedScreenProps = {
  onCreateAccount: () => void;
  onSignIn: () => void;
};

function GetStartedScreen({ onCreateAccount, onSignIn }: GetStartedScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = onboardingSteps[stepIndex];
  const isFinalStep = stepIndex === onboardingSteps.length - 1;

  function handleNext() {
    if (isFinalStep) {
      onCreateAccount();
      return;
    }

    setStepIndex((index) => index + 1);
  }

  return (
    <main className="startShell">
      <section className="startExperience" aria-label="ZyloXP overview">
        <header className="startHeader">
          <div className="authBrand">
            <div className="brandMark">
              <BatteryCharging size={20} strokeWidth={2.4} />
            </div>
            <div>
              <strong>ZyloXP</strong>
              <span>Tech career academy</span>
            </div>
          </div>
          <button className="textButton" onClick={onSignIn} type="button">
            Sign in
          </button>
        </header>

        <div className="startHero">
          <div className="startCopy">
            <p className="eyebrow">{step.eyebrow}</p>
            <h1>{step.title}</h1>
            <p>{step.description}</p>

            <div className="startPointList">
              {step.points.map((point) => (
                <span key={point}>
                  <CheckCircle2 size={18} />
                  {point}
                </span>
              ))}
            </div>
          </div>

          <div className="startVisual" aria-label={`${step.eyebrow} preview`}>
            <div className="startDiagramWindow">
              <img
                src={resolvePublicAssetPath(step.diagram)}
                alt={`${step.eyebrow} diagram preview`}
              />
              <div className="startMetric">
                <GraduationCap size={20} />
                <strong>{step.metric}</strong>
              </div>
            </div>

            <ZyGuide
              className="startGuide"
              compact
              key={step.eyebrow}
              label="Meet Zy"
              messages={step.guide}
              mood={step.mood}
            />
          </div>
        </div>

        <footer className="startFooter">
          <div className="startDots" aria-label="Overview progress">
            {onboardingSteps.map((item, index) => (
              <button
                aria-label={`Show ${item.eyebrow}`}
                className={index === stepIndex ? 'active' : ''}
                key={item.eyebrow}
                onClick={() => setStepIndex(index)}
                type="button"
              />
            ))}
          </div>

          <div className="startActions">
            {stepIndex > 0 && (
              <button
                className="secondaryButton"
                onClick={() => setStepIndex((index) => index - 1)}
                type="button"
              >
                Back
              </button>
            )}
            <button className="primaryButton" onClick={handleNext} type="button">
              {isFinalStep ? 'Get started' : 'Next'}
              <ArrowRight size={18} />
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}

type OverlayPanelProps = {
  activeSection: AppSection;
  activeSessionCount: number;
  activityResults: SearchResult[];
  appLockConfig: LocalAppLockConfig | null;
  dailyMissionCompletedCount: number;
  dailyMissionTotal: number;
  dailyGoal: number;
  deviceAlertPermission: DeviceAlertPermission;
  deviceAlertsEnabled: boolean;
  fullHeartRechargeMs: number;
  heartsRemaining: number;
  highContrastEnabled: boolean;
  isAppInstalled: boolean;
  lastSavedAt: number | null;
  learnerInitials: string;
  learnerProfile: LearnerProfile;
  maxHearts: number;
  nextHeartInMs: number;
  notificationReadKeys: string[];
  notifications: AppNotification[];
  onActivityResultSelect: (result: SearchResult) => void;
  onAppLockPinChange: (
    currentPin: string,
    nextPin: string,
  ) => Promise<{ message: string; ok: boolean }>;
  onAppLockDisable: (
    currentPin: string,
  ) => Promise<{ message: string; ok: boolean }>;
  onAppLockEnable: (
    pin: string,
    timeoutMinutes: number,
    lockOnHidden: boolean,
  ) => Promise<{ message: string; ok: boolean }>;
  onAppLockHiddenChange: (enabled: boolean) => void;
  onAppLockTimeoutChange: (timeoutMinutes: number) => void;
  onClose: () => void;
  onDailyGoalChange: (goal: number) => void;
  onDeviceAlertsEnabledChange: (enabled: boolean) => void;
  onHighContrastEnabledChange: (enabled: boolean) => void;
  onInstallApp: () => void;
  onLearnerProfileChange: (profile: LearnerProfile) => void;
  onLockAppNow: () => void;
  onMarkAllNotificationsRead: () => void;
  onNotificationAction: (notification: AppNotification) => void;
  onNotificationReadChange: (
    notification: AppNotification,
    isRead: boolean,
  ) => void;
  onOpenProgress: () => void;
  onOverlayChange: (overlay: OverlayType) => void;
  onPracticeWithHeartsChange: (enabled: boolean) => void;
  onReadingSizeChange: (size: ReadingSize) => void;
  onReducedMotionEnabledChange: (enabled: boolean) => void;
  onSaveToolkitCalculation: (seed: FieldJournalDraftSeed) => void;
  onSectionChange: (section: AppSection) => void;
  onSignOut: () => void;
  onSoundEnabledChange: (enabled: boolean) => void;
  overlay: Exclude<OverlayType, null>;
  practiceWithHearts: boolean;
  readingSize: ReadingSize;
  reducedMotionEnabled: boolean;
  reviewDueCount: number;
  saveStatus: SaveStatus;
  soundEnabled: boolean;
  supportsAppInstall: boolean;
};

function OverlayPanel({
  activeSection,
  activeSessionCount,
  activityResults,
  appLockConfig,
  dailyMissionCompletedCount,
  dailyMissionTotal,
  dailyGoal,
  deviceAlertPermission,
  deviceAlertsEnabled,
  fullHeartRechargeMs,
  heartsRemaining,
  highContrastEnabled,
  isAppInstalled,
  lastSavedAt,
  learnerInitials,
  learnerProfile,
  maxHearts,
  nextHeartInMs,
  notificationReadKeys,
  notifications,
  onActivityResultSelect,
  onAppLockPinChange,
  onAppLockDisable,
  onAppLockEnable,
  onAppLockHiddenChange,
  onAppLockTimeoutChange,
  onClose,
  onDailyGoalChange,
  onDeviceAlertsEnabledChange,
  onHighContrastEnabledChange,
  onInstallApp,
  onLearnerProfileChange,
  onLockAppNow,
  onMarkAllNotificationsRead,
  onNotificationAction,
  onNotificationReadChange,
  onOpenProgress,
  onOverlayChange,
  onPracticeWithHeartsChange,
  onReadingSizeChange,
  onReducedMotionEnabledChange,
  onSaveToolkitCalculation,
  onSectionChange,
  onSignOut,
  onSoundEnabledChange,
  overlay,
  practiceWithHearts,
  readingSize,
  reducedMotionEnabled,
  reviewDueCount,
  saveStatus,
  soundEnabled,
  supportsAppInstall,
}: OverlayPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const nextHeartCountdown = formatHeartCountdown(nextHeartInMs);
  const fullRechargeDuration = formatHeartDuration(fullHeartRechargeMs);
  const unreadNotificationCount = notifications.filter(
    (notification) =>
      !notificationReadKeys.includes(getNotificationReadKey(notification)),
  ).length;
  const dailyMissionPercent =
    dailyMissionTotal > 0
      ? Math.min(100, (dailyMissionCompletedCount / dailyMissionTotal) * 100)
      : 0;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    if (scrollbarWidth > 0) {
      const currentPaddingRight =
        Number.parseFloat(window.getComputedStyle(document.body).paddingRight) ||
        0;
      document.body.style.paddingRight = `${
        currentPaddingRight + scrollbarWidth
      }px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      const restoreTarget = restoreFocusRef.current;

      window.requestAnimationFrame(() => {
        if (restoreTarget && document.contains(restoreTarget)) {
          restoreTarget.focus({ preventScroll: true });
        }
      });
    };
  }, []);

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [overlay]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const panel = panelRef.current;
      if (!panel) {
        return;
      }

      const focusableElements = Array.from(
        panel.querySelectorAll<HTMLElement>(
          [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
          ].join(','),
        ),
      ).filter(
        (element) =>
          element.tabIndex >= 0 && element.getAttribute('aria-hidden') !== 'true',
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      const activeIndex = activeElement
        ? focusableElements.indexOf(activeElement)
        : -1;

      if (event.shiftKey && activeIndex <= 0) {
        event.preventDefault();
        lastElement.focus({ preventScroll: true });
      } else if (!event.shiftKey && activeIndex === focusableElements.length - 1) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
      } else if (activeIndex === -1) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus({
          preventScroll: true,
        });
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const title =
    overlay === 'notifications'
      ? 'Activity'
      : overlay === 'hearts'
        ? heartsRemaining === 0
          ? 'Out of hearts'
          : 'Hearts'
        : overlay === 'help'
          ? 'Help'
          : overlay === 'settings'
            ? 'Settings'
            : overlay === 'toolkit'
              ? 'Engineering Toolkit'
              : 'Menu';

  return (
    <div
      className="overlayBackdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-labelledby={`zyloxp-overlay-title-${overlay}`}
        aria-modal="true"
        className={`overlayPanel ${overlay === 'toolkit' ? 'toolkitOverlay' : ''}`}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <header>
          <h2 id={`zyloxp-overlay-title-${overlay}`}>{title}</h2>
          <button
            aria-label={`Close ${title}`}
            className="iconButton"
            onClick={onClose}
            ref={closeButtonRef}
            title="Close"
            type="button"
          >
            <XCircle size={18} />
          </button>
        </header>

        {overlay === 'notifications' && (
          <section
            className="notificationCenter"
            aria-label="Activity center"
          >
            <section className="activityQueue" aria-labelledby="activity-queue-title">
              <div className="activityQueueHeader">
                <span className="activityQueueHeaderIcon">
                  <Activity size={20} />
                </span>
                <div>
                  <span>Today</span>
                  <h3 id="activity-queue-title">Your learning queue</h3>
                </div>
                <div className="activityMissionProgress">
                  <strong>
                    {dailyMissionCompletedCount}/{dailyMissionTotal}
                  </strong>
                  <small>missions</small>
                </div>
              </div>

              <div
                aria-label={`${dailyMissionCompletedCount} of ${dailyMissionTotal} daily missions complete`}
                aria-valuemax={dailyMissionTotal}
                aria-valuemin={0}
                aria-valuenow={dailyMissionCompletedCount}
                className="activityProgressTrack"
                role="progressbar"
              >
                <span style={{ width: `${dailyMissionPercent}%` }} />
              </div>

              <div className="activitySignalRow">
                <div>
                  <Target size={16} />
                  <span>Daily missions</span>
                  <strong>
                    {dailyMissionCompletedCount}/{dailyMissionTotal}
                  </strong>
                </div>
                <div>
                  <RotateCcw size={16} />
                  <span>Reviews due</span>
                  <strong>{reviewDueCount}</strong>
                </div>
                <div>
                  <Heart
                    fill={heartsRemaining > 0 ? 'currentColor' : 'none'}
                    size={16}
                  />
                  <span>Hearts ready</span>
                  <strong>
                    {heartsRemaining}/{maxHearts}
                  </strong>
                </div>
              </div>

              <div className="activityQueueList">
                <span className="activitySectionLabel">
                  {activeSessionCount > 0 ? 'Continue' : 'Next up'}
                  {activeSessionCount > 0 && (
                    <em>{activeSessionCount} active</em>
                  )}
                </span>
                {activityResults
                  .slice(0, Math.max(4, activeSessionCount))
                  .map((result, index) => {
                    const ResultIcon = SEARCH_KIND_ICONS[result.kind];
                    const isActiveSession = index < activeSessionCount;

                    return (
                      <button
                        aria-label={`${
                          isActiveSession ? 'Active session. ' : ''
                        }${result.title}. ${result.subtitle}`}
                        className={index === 0 ? 'primary' : ''}
                        data-active={isActiveSession || undefined}
                        data-kind={result.kind.toLowerCase()}
                        key={`${result.kind}-${result.id}`}
                        onClick={() => onActivityResultSelect(result)}
                        type="button"
                      >
                        <span className="activityResultIcon">
                          <ResultIcon size={18} />
                        </span>
                        <span className="activityResultCopy">
                          <strong>{result.title}</strong>
                          <small>
                            {isActiveSession && (
                              <span className="activityActiveLabel">
                                Active
                              </span>
                            )}
                            <span>{result.subtitle}</span>
                          </small>
                        </span>
                        <ChevronRight size={18} />
                      </button>
                    );
                  })}
              </div>
            </section>

            <div className="activityUpdatesHeader">
              <div>
                <span>Updates</span>
                <strong>Signals from your workspace</strong>
              </div>
              {notifications.length > 0 && (
                <div className="activityUpdatesActions">
                  <span aria-live="polite">
                    {unreadNotificationCount} unread
                  </span>
                  <button
                    disabled={unreadNotificationCount === 0}
                    onClick={onMarkAllNotificationsRead}
                    type="button"
                  >
                    <Check size={15} />
                    Mark all read
                  </button>
                </div>
              )}
            </div>

            <div className="notificationList">
              {notifications.length > 0 ? (
                notifications.map((notification) => {
                  const Icon = notification.icon;
                  const isRead = notificationReadKeys.includes(
                    getNotificationReadKey(notification),
                  );

                  return (
                    <article
                      className={`notificationItem ${notification.tone} ${
                        isRead ? 'read' : 'unread'
                      }`}
                      key={getNotificationReadKey(notification)}
                    >
                      <span className="notificationItemIcon">
                        <Icon size={19} />
                      </span>
                      <div className="notificationItemCopy">
                        <div className="notificationTitleLine">
                          <strong>{notification.title}</strong>
                          <small>{isRead ? 'Read' : 'New'}</small>
                        </div>
                        <p>{notification.description}</p>
                      </div>
                      <div className="notificationItemActions">
                        {notification.action && notification.actionLabel && (
                          <button
                            className="notificationItemAction"
                            onClick={() => onNotificationAction(notification)}
                            type="button"
                          >
                            {notification.actionLabel}
                            <ChevronRight size={15} />
                          </button>
                        )}
                        <button
                          aria-label={`Mark ${notification.title} as ${
                            isRead ? 'unread' : 'read'
                          }`}
                          className="notificationReadToggle"
                          onClick={() =>
                            onNotificationReadChange(notification, !isRead)
                          }
                          title={isRead ? 'Mark unread' : 'Mark read'}
                          type="button"
                        >
                          {isRead ? <Mail size={16} /> : <Check size={16} />}
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="notificationEmpty">
                  <CheckCircle2 size={22} />
                  <strong>You are all caught up</strong>
                  <p>New review, reward, and progress signals will appear here.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {overlay === 'toolkit' && (
          <Suspense fallback={<DeferredPanelFallback />}>
            <EngineeringToolkit
              onSaveCalculation={onSaveToolkitCalculation}
            />
          </Suspense>
        )}

        {overlay === 'hearts' && (
          <div className={`heartsPanel ${heartsRemaining === 0 ? 'empty' : ''}`}>
            <div className="heartsPanelHero">
              <span className="heartsPanelIcon">
                <Heart fill={heartsRemaining > 0 ? 'currentColor' : 'none'} size={34} />
              </span>
              <div>
                <strong>
                  {heartsRemaining}/{maxHearts} hearts
                </strong>
                <p>
                  {heartsRemaining === 0
                    ? 'You used your last heart. One heart will return automatically every 10 minutes.'
                    : 'Each missing heart returns automatically after 10 minutes.'}
                </p>
              </div>
            </div>

            <div className="heartPips" aria-label={`${heartsRemaining} of ${maxHearts} hearts`}>
              {Array.from({ length: maxHearts }, (_, index) => (
                <Heart
                  fill={index < heartsRemaining ? 'currentColor' : 'none'}
                  key={index}
                  size={20}
                />
              ))}
            </div>

            {heartsRemaining < maxHearts ? (
              <div className="heartRechargeStatus">
                <RefreshCw size={20} />
                <div>
                  <span>Next heart</span>
                  <strong>{nextHeartCountdown}</strong>
                </div>
                <div>
                  <span>All {maxHearts} hearts</span>
                  <strong>{fullRechargeDuration}</strong>
                </div>
              </div>
            ) : (
              <div className="heartRechargeStatus full">
                <CheckCircle2 size={20} />
                <strong>All hearts are ready</strong>
              </div>
            )}

            <button className="secondaryButton fullWidth" onClick={onClose} type="button">
              {heartsRemaining === 0 ? 'Back to lesson' : 'Continue lesson'}
            </button>
          </div>
        )}

        {overlay === 'help' && (
          <div className="overlayStack">
            <article>
              <strong>How to use ZyloXP</strong>
              <p>Pick a node on the circuit path, answer the current prompt, then move to the next bite.</p>
            </article>
            <article>
              <strong>Labs</strong>
              <p>Open Labs to use circuit diagrams and sliders for quick engineering intuition.</p>
            </article>
            <article>
              <strong>Career map</strong>
              <p>Select a career card to tune the path toward the skills for that role.</p>
            </article>
          </div>
        )}

        {overlay === 'settings' && (
          <div className="overlayStack">
            <div
              aria-live="polite"
              className={`autosaveSummary ${saveStatus}`}
              role="status"
            >
              <span>
                {saveStatus === 'saving' ? (
                  <RefreshCw size={18} />
                ) : saveStatus === 'error' ? (
                  <TriangleAlert size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
              </span>
              <div>
                <strong>Progress autosave</strong>
                <small>
                  {saveStatus === 'saving'
                    ? 'Saving changes now'
                    : saveStatus === 'error'
                      ? 'Local saving is unavailable'
                      : formatSavedAt(lastSavedAt)}
                </small>
              </div>
            </div>
            <div className="settingsSectionHeader">
              <span>
                <User size={18} />
              </span>
              <div>
                <strong>Learner profile</strong>
                <small>Your identity across ZyloXP</small>
              </div>
            </div>
            <div className="settingsProfileCard">
              <span className="settingsProfileAvatar" aria-hidden="true">
                {learnerInitials}
              </span>
              <div className="settingsProfileFields">
                <label>
                  <span>Display name</span>
                  <input
                    autoComplete="name"
                    maxLength={60}
                    onChange={(event) =>
                      onLearnerProfileChange({
                        ...learnerProfile,
                        displayName: event.target.value,
                      })
                    }
                    type="text"
                    value={learnerProfile.displayName}
                  />
                </label>
                <label>
                  <span>Email</span>
                  <input
                    autoComplete="email"
                    maxLength={120}
                    onChange={(event) =>
                      onLearnerProfileChange({
                        ...learnerProfile,
                        email: event.target.value,
                      })
                    }
                    type="email"
                    value={learnerProfile.email}
                  />
                </label>
              </div>
            </div>
            <div className="settingsSectionHeader">
              <span>
                <Eye size={18} />
              </span>
              <div>
                <strong>Visual comfort</strong>
                <small>Display preferences for every workspace</small>
              </div>
            </div>
            <div className="settingRow readingSizeSetting">
              <span>
                <strong>Reading size</strong>
                <small>Increase text across lessons, labs, and references</small>
              </span>
              <div
                aria-label="Reading size"
                className="readingSizeControl"
                role="group"
              >
                {(['standard', 'large'] as const).map((size) => (
                  <button
                    aria-pressed={readingSize === size}
                    key={size}
                    onClick={() => onReadingSizeChange(size)}
                    type="button"
                  >
                    {size === 'standard' ? 'Standard' : 'Large'}
                  </button>
                ))}
              </div>
            </div>
            <label className="settingRow toggleSetting">
              <span>
                <strong>Reduce motion</strong>
                <small>Pause character, circuit, and interface animation</small>
              </span>
              <input
                checked={reducedMotionEnabled}
                onChange={(event) =>
                  onReducedMotionEnabledChange(event.target.checked)
                }
                type="checkbox"
              />
            </label>
            <label className="settingRow toggleSetting">
              <span>
                <strong>Stronger contrast</strong>
                <small>Sharpen text, borders, and control states</small>
              </span>
              <input
                checked={highContrastEnabled}
                onChange={(event) =>
                  onHighContrastEnabledChange(event.target.checked)
                }
                type="checkbox"
              />
            </label>
            <div className="settingsSectionHeader">
              <span>
                <SlidersHorizontal size={18} />
              </span>
              <div>
                <strong>Study preferences</strong>
                <small>Session goals and feedback</small>
              </div>
            </div>
            <label className="settingRow">
              <span>Daily goal</span>
              <select
                aria-label="Daily goal"
                onChange={(event) => onDailyGoalChange(Number(event.target.value))}
                value={dailyGoal}
              >
                <option value="10">10 min</option>
                <option value="20">20 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
              </select>
            </label>
            <label className="settingRow toggleSetting">
              <span>
                <strong>Sound effects</strong>
                <small>Answer and XP feedback</small>
              </span>
              <input
                checked={soundEnabled}
                onChange={(event) => onSoundEnabledChange(event.target.checked)}
                type="checkbox"
              />
            </label>
            <label className="settingRow toggleSetting">
              <span>
                <strong>Hearts mode</strong>
                <small>Wrong answers use a heart</small>
              </span>
              <input
                checked={practiceWithHearts}
                onChange={(event) => onPracticeWithHeartsChange(event.target.checked)}
                type="checkbox"
              />
            </label>
            <div className="settingsSectionHeader">
              <span>
                <ShieldCheck size={18} />
              </span>
              <div>
                <strong>Privacy and security</strong>
                <small>Protect this browser session when you step away</small>
              </div>
            </div>
            <LocalSecuritySettings
              config={appLockConfig}
              onChangePin={onAppLockPinChange}
              onDisable={onAppLockDisable}
              onEnable={onAppLockEnable}
              onLockOnHiddenChange={onAppLockHiddenChange}
              onLockNow={onLockAppNow}
              onTimeoutChange={onAppLockTimeoutChange}
            />
            {deviceAlertPermission !== 'unsupported' && (
              <>
                <div className="settingsSectionHeader">
                  <span>
                    <Bell size={18} />
                  </span>
                  <div>
                    <strong>Device alerts</strong>
                    <small>Background timer feedback</small>
                  </div>
                </div>
                <label
                  className={`settingRow toggleSetting ${
                    deviceAlertPermission === 'denied' ? 'disabled' : ''
                  }`}
                >
                  <span>
                    <strong>Focus and heart alerts</strong>
                    <small>
                      {deviceAlertPermission === 'denied'
                        ? 'Blocked in browser settings'
                        : deviceAlertsEnabled
                          ? 'Focus completion and recovered hearts'
                          : 'Off until you choose to enable them'}
                    </small>
                  </span>
                  <input
                    checked={
                      deviceAlertsEnabled &&
                      deviceAlertPermission === 'granted'
                    }
                    disabled={deviceAlertPermission === 'denied'}
                    onChange={(event) =>
                      onDeviceAlertsEnabledChange(event.target.checked)
                    }
                    type="checkbox"
                  />
                </label>
              </>
            )}
            {(supportsAppInstall || isAppInstalled) && (
              <>
                <div className="settingsSectionHeader">
                  <span>
                    <Download size={18} />
                  </span>
                  <div>
                    <strong>ZyloXP app</strong>
                    <small>
                      {isAppInstalled
                        ? 'Installed on this device'
                        : 'Ready to install on this device'}
                    </small>
                  </div>
                </div>
                <button
                  className="settingActionRow"
                  disabled={isAppInstalled}
                  onClick={onInstallApp}
                  type="button"
                >
                  {isAppInstalled ? (
                    <CheckCircle2 aria-hidden="true" size={19} />
                  ) : (
                    <Download aria-hidden="true" size={19} />
                  )}
                  <span>
                    <strong>
                      {isAppInstalled ? 'ZyloXP is installed' : 'Install ZyloXP'}
                    </strong>
                    <small>
                      {isAppInstalled
                        ? 'Open it from your device'
                        : 'Add ZyloXP as a standalone app'}
                    </small>
                  </span>
                </button>
              </>
            )}
            <Suspense fallback={<DeferredPanelFallback />}>
              <ProgressBackup />
            </Suspense>
            <button className="settingsSignOut" onClick={onSignOut} type="button">
              Sign out
            </button>
          </div>
        )}

        {overlay === 'menu' && (
          <div className="menuGrid">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  aria-current={isActive ? 'page' : undefined}
                  className={isActive ? 'active' : ''}
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  onFocus={() => preloadAppSection(item.id)}
                  onPointerEnter={() => preloadAppSection(item.id)}
                  type="button"
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
            <button onClick={onOpenProgress} type="button">
              <BarChart3 size={18} />
              Progress
            </button>
            <button
              onClick={() => onOverlayChange('toolkit')}
              onFocus={() =>
                void preloadEngineeringToolkit().catch(() => undefined)
              }
              onPointerEnter={() =>
                void preloadEngineeringToolkit().catch(() => undefined)
              }
              type="button"
            >
              <Calculator size={18} />
              Engineering Toolkit
            </button>
            <button onClick={() => onOverlayChange('hearts')} type="button">
              <Heart fill={heartsRemaining > 0 ? 'currentColor' : 'none'} size={18} />
              Hearts {heartsRemaining}/{maxHearts}
            </button>
            <button onClick={() => onOverlayChange('notifications')} type="button">
              <Bell size={18} />
              Activity
            </button>
            <button onClick={() => onOverlayChange('help')} type="button">
              <CircleHelp size={18} />
              Help
            </button>
            <button onClick={() => onOverlayChange('settings')} type="button">
              <Settings size={18} />
              Settings
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

type AuthScreenProps = {
  email: string;
  mode: AuthMode;
  name: string;
  notice: string;
  onBackToIntro: () => void;
  onEmailChange: (value: string) => void;
  onModeChange: (mode: AuthMode) => void;
  onNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberSessionChange: (remember: boolean) => void;
  onSocialAuth: (provider: SocialProvider) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  password: string;
  rememberSession: boolean;
};

function AuthScreen({
  email,
  mode,
  name,
  notice,
  onBackToIntro,
  onEmailChange,
  onModeChange,
  onNameChange,
  onPasswordChange,
  onRememberSessionChange,
  onSocialAuth,
  onSubmit,
  password,
  rememberSession,
}: AuthScreenProps) {
  const isCreateMode = mode === 'create';
  const isResetMode = mode === 'reset';
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setShowPassword(false);
  }, [mode]);
  const title = isResetMode
    ? 'Reset your password'
    : isCreateMode
      ? 'Create your ZyloXP account'
      : 'Log in to ZyloXP';
  const subtitle = isResetMode
    ? 'Enter the email on your account and we will send a reset link.'
    : isCreateMode
      ? 'Start your first technical path with a clean account setup.'
      : 'Continue your XP streak, labs, and career path.';

  return (
    <main className="authShell">
      <section className="authPanel" aria-label="ZyloXP account access">
        <div className="authBrand">
          <div className="brandMark">
            <BatteryCharging size={20} strokeWidth={2.4} />
          </div>
          <div>
            <strong>ZyloXP</strong>
            <span>Tech career academy</span>
          </div>
        </div>

        <div className="authIntro">
          <p className="eyebrow">Foundations</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        {notice && (
          <div className="authNotice" role="status">
            <CheckCircle2 size={18} />
            <span>{notice}</span>
          </div>
        )}

        {!isResetMode && (
          <>
            <div className="socialStack" aria-label="Social sign in">
              <button className="socialButton" onClick={() => onSocialAuth('Google')} type="button">
                <span className="googleMark">G</span>
                Continue with Google
              </button>
              <button className="socialButton dark" onClick={() => onSocialAuth('Apple')} type="button">
                <Apple fill="currentColor" size={18} />
                Continue with Apple
              </button>
            </div>

            <div className="authDivider">
              <span>or</span>
            </div>
          </>
        )}

        <form className="authForm" onSubmit={onSubmit}>
          {isCreateMode && (
            <label className="fieldGroup">
              <span>Full name</span>
              <div>
                <User size={18} />
                <input
                  autoComplete="name"
                  name="name"
                  onChange={(event) => onNameChange(event.target.value)}
                  placeholder="Your name"
                  required
                  type="text"
                  value={name}
                />
              </div>
            </label>
          )}

          <label className="fieldGroup">
            <span>Email</span>
            <div>
              <Mail size={18} />
              <input
                autoComplete="email"
                name="email"
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>
          </label>

          {!isResetMode && (
            <label className="fieldGroup">
              <span>Password</span>
              <div>
                <Lock size={18} />
                <input
                  autoComplete={isCreateMode ? 'new-password' : 'current-password'}
                  minLength={isCreateMode ? 8 : 1}
                  name="password"
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder={isCreateMode ? 'Create a password' : 'Enter your password'}
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  className="fieldIconButton"
                  onClick={() => setShowPassword((isVisible) => !isVisible)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  type="button"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          )}

          {!isCreateMode && !isResetMode && (
            <div className="authFormMeta">
              <label>
                <input
                  checked={rememberSession}
                  onChange={(event) =>
                    onRememberSessionChange(event.target.checked)
                  }
                  type="checkbox"
                />
                Remember me
              </label>
              <button className="textButton" onClick={() => onModeChange('reset')} type="button">
                Forgot password?
              </button>
            </div>
          )}

          {isCreateMode && (
            <div className="trackChoice" aria-label="Starting learning track">
              <span>Starting track</span>
              <strong>Engineering Foundations</strong>
              <small>Core concepts, practice labs, and career signals.</small>
            </div>
          )}

          <button className="primaryButton fullWidth" type="submit">
            {isResetMode ? 'Send reset link' : isCreateMode ? 'Create account' : 'Sign in'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="authFooter">
          {isResetMode ? (
            <>
              Remembered it?
              <button onClick={() => onModeChange('login')} type="button">
                Back to sign in
              </button>
            </>
          ) : isCreateMode ? (
            <>
              Already have an account?
              <button onClick={() => onModeChange('login')} type="button">
                Sign in
              </button>
            </>
          ) : (
            <>
              New to ZyloXP?
              <button onClick={() => onModeChange('create')} type="button">
                Create account
              </button>
            </>
          )}
        </div>

        <button className="authOverviewButton" onClick={onBackToIntro} type="button">
          Back to overview
        </button>
      </section>
    </main>
  );
}

function DatabaseIcon() {
  return (
    <div className="databaseIcon" aria-hidden="true">
      <span />
      <span />
      <span />
      <Check size={16} />
    </div>
  );
}

export default App;
