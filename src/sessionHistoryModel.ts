import type { LessonQuestion } from './data';
import { getSearchResultScore } from './searchRanking';
import { getSprintReview, normalizeSprintAnswer } from './sprintReviewModel';
import type { ReviewQuestion, SprintAnswer, SprintReviewItem } from './sprintReviewModel';

export const SESSION_HISTORY_LIMIT = 20;
const MAX_SESSION_QUESTIONS = 10;
const SOURCES = ['career', 'custom', 'diagnostic', 'power', 'recovery', 'review', 'saved'] as const;
export type SessionSource = typeof SOURCES[number];
export type SessionHistoryRecord = {
  id: string;
  label: string;
  source: SessionSource;
  startedAt: number;
  completedAt: number;
  earnedXp: number;
  items: SprintReviewItem[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readQuestion(value: unknown): ReviewQuestion | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !/^[\w-]{1,100}$/.test(value.id)) return null;
  const limits = { topic: 160, subtopic: 240, prompt: 4000, formula: 2000, solution: 8000, explanation: 8000, assumptions: 2000 };
  for (const [key, limit] of Object.entries(limits)) {
    if (typeof value[key] !== 'string' || value[key].length > limit) return null;
  }
  if (!value.prompt || !Array.isArray(value.options) || value.options.length < 2 || value.options.length > 8
    || !value.options.every((option) => typeof option === 'string' && option.length <= 1000)
    || typeof value.correctIndex !== 'number' || !Number.isInteger(value.correctIndex)
    || value.correctIndex < 0 || value.correctIndex >= value.options.length) return null;
  return {
    id: value.id, topic: value.topic as string, subtopic: value.subtopic as string,
    prompt: value.prompt as string, formula: value.formula as string, solution: value.solution as string,
    explanation: value.explanation as string, assumptions: value.assumptions as string,
    options: [...value.options] as string[], correctIndex: value.correctIndex,
  };
}

export function normalizeSessionHistory(value: unknown): SessionHistoryRecord[] {
  if (!Array.isArray(value)) return [];
  const byId = new Map<string, SessionHistoryRecord>();
  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.id !== 'string' || !/^[\w-]{1,120}$/.test(entry.id)
      || typeof entry.label !== 'string' || !entry.label.trim() || entry.label.length > 80
      || !SOURCES.includes(entry.source as SessionSource)
      || typeof entry.startedAt !== 'number' || !Number.isSafeInteger(entry.startedAt) || entry.startedAt < 0
      || typeof entry.completedAt !== 'number' || !Number.isSafeInteger(entry.completedAt)
      || entry.completedAt < entry.startedAt || entry.completedAt > Date.now() + 86_400_000
      || typeof entry.earnedXp !== 'number' || !Number.isSafeInteger(entry.earnedXp) || entry.earnedXp < 0 || entry.earnedXp > 100_000
      || !Array.isArray(entry.items) || entry.items.length === 0 || entry.items.length > MAX_SESSION_QUESTIONS) continue;
    const items: SprintReviewItem[] = [];
    const questionIds = new Set<string>();
    for (const [index, item] of entry.items.entries()) {
      if (!isRecord(item)) break;
      const question = readQuestion(item.question);
      const answer = question ? normalizeSprintAnswer(item.answer, question) : null;
      if (!question || !answer || questionIds.has(question.id)) break;
      questionIds.add(question.id);
      items.push({ number: index + 1, question, answer });
    }
    // Never silently turn a damaged record into a shorter, higher-scoring session.
    if (items.length !== entry.items.length || byId.has(entry.id)) continue;
    byId.set(entry.id, {
      id: entry.id, label: entry.label.trim(), source: entry.source as SessionSource,
      startedAt: entry.startedAt, completedAt: entry.completedAt, earnedXp: entry.earnedXp, items,
    });
  }
  return [...byId.values()].sort((a, b) => b.completedAt - a.completedAt || a.id.localeCompare(b.id)).slice(0, SESSION_HISTORY_LIMIT);
}

export function createSessionHistoryRecord(session: {
  startedAt: number; completedAt: number | null; earnedXp: number; label: string; source: SessionSource;
  questionIndices: number[]; results: SprintAnswer[];
}, questions: LessonQuestion[]): SessionHistoryRecord | null {
  const items = getSprintReview(session, questions);
  if (items.length !== session.questionIndices.length || !items.length) return null;
  return normalizeSessionHistory([{
    id: `session-${session.startedAt}-${session.completedAt}`,
    label: session.label, source: session.source, startedAt: session.startedAt,
    completedAt: session.completedAt, earnedXp: session.earnedXp,
    items: items.map((item) => ({ ...item, question: {
      ...item.question, formula: item.question.formula ?? '', solution: item.question.solution ?? '',
      explanation: item.question.explanation ?? '', assumptions: item.question.assumptions ?? '',
    } })),
  }])[0] ?? null;
}

export function addSessionToHistory(history: SessionHistoryRecord[], record: SessionHistoryRecord) {
  return normalizeSessionHistory([...history, record]);
}

export function filterSessionHistory(history: SessionHistoryRecord[], query: string, onlyMisses: boolean) {
  return history.filter((record) => (!onlyMisses || record.items.some((item) => item.answer.result !== 'correct'))
    && (!query.trim() || getSearchResultScore({
      kind: 'Session',
      title: record.label,
      subtitle: record.items.map((item) => `${item.question.topic} ${item.question.subtopic}`).join(' '),
      keywords: record.items.map((item) => item.question.prompt).join(' '),
    }, query) !== null));
}

export function getSessionReplayIndices(record: SessionHistoryRecord, questions: LessonQuestion[], onlyMisses: boolean) {
  return record.items.filter((item) => !onlyMisses || item.answer.result !== 'correct').flatMap(({ question }) => {
    const index = questions.findIndex((current) => current.id === question.id);
    const current = questions[index];
    // A historical choice index has meaning only for the exact question it answered.
    const unchanged = current && (['topic', 'subtopic', 'prompt', 'formula', 'solution', 'explanation', 'assumptions'] as const)
      .every((key) => (current[key] ?? '') === (question[key] ?? '')) && current.correctIndex === question.correctIndex
      && current.options.length === question.options.length && current.options.every((option, i) => option === question.options[i]);
    return unchanged ? [index] : [];
  });
}
