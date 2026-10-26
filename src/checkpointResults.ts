import type { CheckpointConfidence, CheckpointExamState } from './CheckpointExam';
import type { LessonQuestion } from './data';

export type CheckpointResult = {
  question: LessonQuestion;
  number: number;
  optionIndex: number | null;
  confidence: CheckpointConfidence | null;
  flagged: boolean;
  correct: boolean;
};

export type CheckpointResultFilter = 'all' | 'missed' | 'unanswered' | 'flagged' | 'uncertain';

export function getCheckpointResults(
  exam: CheckpointExamState | null,
  questions: LessonQuestion[],
): CheckpointResult[] {
  if (!exam || exam.completedAt === null) return [];

  const byId = new Map(questions.map((question) => [question.id, question]));
  return exam.questionIds.flatMap((id, index) => {
    const question = byId.get(id);
    if (!question) return [];
    const answer = exam.answers[id];
    const selected = answer?.optionIndex;
    const optionIndex = typeof selected === 'number' && Number.isInteger(selected)
      && selected >= 0 && selected < question.options.length ? selected : null;
    const confidence = answer?.confidence === 'low' || answer?.confidence === 'medium'
      || answer?.confidence === 'high' ? answer.confidence : null;
    return [{
      question,
      number: index + 1,
      optionIndex,
      confidence,
      flagged: answer?.flagged === true,
      correct: optionIndex !== null && optionIndex === question.correctIndex,
    }];
  });
}

export function matchesCheckpointFilter(result: CheckpointResult, filter: CheckpointResultFilter) {
  switch (filter) {
    case 'missed': return !result.correct;
    case 'unanswered': return result.optionIndex === null;
    case 'flagged': return result.flagged;
    case 'uncertain': return result.optionIndex !== null
      && (result.confidence === 'low' || result.confidence === 'medium');
    default: return true;
  }
}

export function getConfidenceAlignment(results: CheckpointResult[]) {
  const expected = { low: 0.35, medium: 0.65, high: 0.85 };
  // A confidence rating without an answer is not a prediction to calibrate.
  const rated = results.filter((result) => result.optionIndex !== null && result.confidence !== null);
  if (rated.length === 0) return null;
  const error = rated.reduce((total, result) =>
    total + Math.abs(Number(result.correct) - expected[result.confidence!]), 0);
  return Math.round(100 - error / rated.length * 100);
}
