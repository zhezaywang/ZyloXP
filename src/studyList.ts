export const STUDY_LIST_STORAGE_KEY = 'zyloxp-study-list-v1';

export const STUDY_LIST_KINDS = [
  'Concept',
  'Game',
  'Skill',
  'Lab',
  'Career',
  'Question',
] as const;

export type StudyListKind = (typeof STUDY_LIST_KINDS)[number];

export type StudyListResource = {
  id: string;
  kind: StudyListKind;
  subtitle: string;
  title: string;
};

export type StudyListItem = StudyListResource & {
  addedAt: number;
  completedAt: number | null;
};

const MAX_STUDY_LIST_ITEMS = 60;
const MAX_TEXT_LENGTH = 280;
const STUDY_LIST_KIND_SET = new Set<string>(STUDY_LIST_KINDS);

export function isStudyListKind(value: string): value is StudyListKind {
  return STUDY_LIST_KIND_SET.has(value);
}

export function getStudyListItemKey(
  item: Pick<StudyListResource, 'id' | 'kind'>,
) {
  return `${item.kind}:${item.id}`;
}

function normalizeTimestamp(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : null;
}

function normalizeText(value: unknown, maxLength = MAX_TEXT_LENGTH) {
  return typeof value === 'string'
    ? value.trim().slice(0, maxLength)
    : '';
}

function normalizeStudyListItem(value: unknown): StudyListItem | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const item = value as Partial<StudyListItem>;
  const id = normalizeText(item.id, 120);
  const title = normalizeText(item.title);
  const subtitle = normalizeText(item.subtitle);
  const addedAt = normalizeTimestamp(item.addedAt);

  if (
    !id ||
    !title ||
    !subtitle ||
    !addedAt ||
    typeof item.kind !== 'string' ||
    !isStudyListKind(item.kind)
  ) {
    return null;
  }

  return {
    addedAt,
    completedAt:
      item.completedAt === null
        ? null
        : normalizeTimestamp(item.completedAt),
    id,
    kind: item.kind,
    subtitle,
    title,
  };
}

export function normalizeStudyListItems(value: unknown): StudyListItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenKeys = new Set<string>();

  return value
    .flatMap((item) => {
      const normalizedItem = normalizeStudyListItem(item);
      if (!normalizedItem) {
        return [];
      }

      const key = getStudyListItemKey(normalizedItem);
      if (seenKeys.has(key)) {
        return [];
      }

      seenKeys.add(key);
      return [normalizedItem];
    })
    .slice(0, MAX_STUDY_LIST_ITEMS);
}

export function readStudyListItems(): StudyListItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    return normalizeStudyListItems(
      JSON.parse(window.localStorage.getItem(STUDY_LIST_STORAGE_KEY) ?? '[]'),
    );
  } catch {
    return [];
  }
}

export function saveStudyListItems(items: StudyListItem[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    STUDY_LIST_STORAGE_KEY,
    JSON.stringify(normalizeStudyListItems(items)),
  );
}

export function addStudyListResource(
  items: StudyListItem[],
  resource: StudyListResource,
  now = Date.now(),
) {
  const resourceKey = getStudyListItemKey(resource);
  const existingItem = items.find(
    (item) => getStudyListItemKey(item) === resourceKey,
  );

  if (existingItem) {
    return items.map((item) =>
      getStudyListItemKey(item) === resourceKey
        ? {
            ...item,
            completedAt: null,
            subtitle: resource.subtitle,
            title: resource.title,
          }
        : item,
    );
  }

  return normalizeStudyListItems([
    ...items,
    {
      ...resource,
      addedAt: now,
      completedAt: null,
    },
  ]);
}
