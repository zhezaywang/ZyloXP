import {
  ArrowRight,
  Atom,
  FlaskConical,
  Gamepad2,
  GraduationCap,
  History,
  Target,
} from 'lucide-react';
import type { AppPage } from './appRouting';
import { buildAppHash, parseAppHash } from './appRouting';

export type RecentLearningKind =
  | 'Career'
  | 'Concept'
  | 'Game'
  | 'Lab'
  | 'Question';

export type RecentLearningItem = {
  id: string;
  kind: RecentLearningKind;
  routeHash: string;
  subtitle: string;
  title: string;
  viewedAt: number;
};

const RECENT_LEARNING_STORAGE_KEY = 'zyloxp-recent-learning-v1';
const RECENT_LEARNING_LIMIT = 6;
const RECENT_LEARNING_PAGES = new Set<AppPage>([
  'career',
  'career-project',
  'concept',
  'game',
  'lab',
  'lesson',
  'portfolio',
  'workbench',
]);

const RECENT_LEARNING_ICONS = {
  Career: GraduationCap,
  Concept: Atom,
  Game: Gamepad2,
  Lab: FlaskConical,
  Question: Target,
} satisfies Record<RecentLearningKind, typeof History>;

function isCanonicalLearningRoute(routeHash: string) {
  if (!routeHash.startsWith('#/')) {
    return false;
  }

  const route = parseAppHash(routeHash);
  return (
    RECENT_LEARNING_PAGES.has(route.page) &&
    route.resourceId !== null &&
    buildAppHash(route) === routeHash
  );
}

function isRecentLearningItem(value: unknown): value is RecentLearningItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Partial<RecentLearningItem>;
  return (
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    item.id.length <= 220 &&
    typeof item.kind === 'string' &&
    Object.prototype.hasOwnProperty.call(RECENT_LEARNING_ICONS, item.kind) &&
    typeof item.routeHash === 'string' &&
    item.routeHash.length <= 300 &&
    isCanonicalLearningRoute(item.routeHash) &&
    typeof item.subtitle === 'string' &&
    item.subtitle.length <= 240 &&
    typeof item.title === 'string' &&
    item.title.length > 0 &&
    item.title.length <= 180 &&
    typeof item.viewedAt === 'number' &&
    Number.isFinite(item.viewedAt) &&
    item.viewedAt > 0
  );
}

export function readRecentLearningItems() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedItems = JSON.parse(
      window.localStorage.getItem(RECENT_LEARNING_STORAGE_KEY) ?? '[]',
    ) as unknown;

    return Array.isArray(storedItems)
      ? storedItems
          .filter(isRecentLearningItem)
          .sort((left, right) => right.viewedAt - left.viewedAt)
          .slice(0, RECENT_LEARNING_LIMIT)
      : [];
  } catch {
    return [];
  }
}

export function saveRecentLearningItems(items: RecentLearningItem[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    RECENT_LEARNING_STORAGE_KEY,
    JSON.stringify(items.slice(0, RECENT_LEARNING_LIMIT)),
  );
}

export function upsertRecentLearningItem(
  items: RecentLearningItem[],
  nextItem: RecentLearningItem,
) {
  return [
    nextItem,
    ...items.filter((item) => item.routeHash !== nextItem.routeHash),
  ].slice(0, RECENT_LEARNING_LIMIT);
}

function formatViewedAt(viewedAt: number) {
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - viewedAt) / 60_000),
  );

  if (elapsedMinutes < 1) {
    return 'Just now';
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return elapsedDays === 1 ? 'Yesterday' : `${Math.min(99, elapsedDays)}d ago`;
}

export function RecentLearning({
  items,
  onClear,
  onOpen,
}: {
  items: RecentLearningItem[];
  onClear: () => void;
  onOpen: (item: RecentLearningItem) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="recent-learning-title"
      className="recentLearningBand"
    >
      <header className="recentLearningHeader">
        <span className="recentLearningHeadingIcon" aria-hidden="true">
          <History size={19} />
        </span>
        <div>
          <p className="eyebrow">Pick up where you left off</p>
          <h2 id="recent-learning-title">Recent learning</h2>
        </div>
        <button className="recentLearningClear" onClick={onClear} type="button">
          Clear history
        </button>
      </header>

      <div className="recentLearningList">
        {items.slice(0, 3).map((item) => {
          const Icon = RECENT_LEARNING_ICONS[item.kind];

          return (
            <button
              className="recentLearningItem"
              data-kind={item.kind.toLowerCase()}
              key={item.id}
              onClick={() => onOpen(item)}
              type="button"
            >
              <span
                aria-hidden="true"
                className={`recentLearningItemIcon ${item.kind.toLowerCase()}`}
              >
                <Icon size={19} />
              </span>
              <span className="recentLearningItemCopy">
                <small>
                  {item.kind} · {formatViewedAt(item.viewedAt)}
                </small>
                <strong>{item.title}</strong>
                <em>{item.subtitle}</em>
              </span>
              <ArrowRight aria-hidden="true" size={18} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
