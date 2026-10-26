import type { LessonQuestion } from './data';

export type ReviewQuestion = Pick<LessonQuestion,
  'id' | 'topic' | 'subtopic' | 'prompt' | 'options' | 'correctIndex'
  | 'formula' | 'solution' | 'explanation' | 'assumptions'>;

export type SprintAnswer = {
  questionId: string;
  result: 'correct' | 'wrong' | 'skipped';
  optionIndex?: number | null;
  confidence?: 'guess' | 'unsure' | 'sure' | null;
};

export type SprintReviewItem = {
  question: ReviewQuestion;
  number: number;
  answer: SprintAnswer;
};

export type SprintReviewFilter = 'all' | 'missed' | 'skipped' | 'uncertain';

export function normalizeSprintAnswer(value: unknown, question: ReviewQuestion): SprintAnswer | null {
  if (!value || typeof value !== 'object') return null;
  const answer = value as Partial<SprintAnswer>;
  if (answer.questionId !== question.id || !['correct', 'wrong', 'skipped'].includes(answer.result ?? '')) return null;
  const choice = answer.optionIndex;
  // Older sessions have an outcome but no answer snapshot. Never invent the choice.
  const optionIndex = answer.result !== 'skipped' && typeof choice === 'number'
    && Number.isInteger(choice) && choice >= 0 && choice < question.options.length
    && (choice === question.correctIndex) === (answer.result === 'correct') ? choice : null;
  const confidence = optionIndex !== null
    && (answer.confidence === 'guess' || answer.confidence === 'unsure' || answer.confidence === 'sure')
    ? answer.confidence : null;
  return { questionId: question.id, result: answer.result!, optionIndex, confidence };
}

export function getSprintReview(
  session: { completedAt: number | null; questionIndices: number[]; results: SprintAnswer[] } | null,
  questions: LessonQuestion[],
): SprintReviewItem[] {
  if (!session || session.completedAt === null || !Number.isFinite(session.completedAt)) return [];
  const seen = new Set<string>();
  return session.questionIndices.flatMap((index, position) => {
    const question = Number.isInteger(index) ? questions[index] : undefined;
    if (!question || seen.has(question.id)) return [];
    seen.add(question.id);
    const answer = normalizeSprintAnswer(session.results.find((item) => item.questionId === question.id), question);
    return answer ? [{ question, number: position + 1, answer }] : [];
  });
}

export function matchesSprintReviewFilter(item: SprintReviewItem, filter: SprintReviewFilter) {
  switch (filter) {
    case 'missed': return item.answer.result !== 'correct';
    case 'skipped': return item.answer.result === 'skipped';
    case 'uncertain': return item.answer.result !== 'skipped'
      && (item.answer.confidence === 'guess' || item.answer.confidence === 'unsure');
    default: return true;
  }
}
