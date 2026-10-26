import type { ReactNode } from 'react';
import type { ReviewQuestion } from './sprintReviewModel';
import './CheckpointReview.css';

export function AnswerSolution({ question, answerLabel, comparisonNote, workedSteps, answerKeyLabel = 'Correct answer', children }: {
  question: ReviewQuestion;
  answerLabel: string;
  comparisonNote?: ReactNode;
  answerKeyLabel?: string;
  workedSteps?: string[] | null;
  children?: ReactNode;
}) {
  return (
    <div className="checkpointReviewSolution">
      <dl className="checkpointAnswerComparison">
        <div><dt>Your answer</dt><dd>{answerLabel}</dd></div>
        <div><dt>{answerKeyLabel}</dt><dd>{String.fromCharCode(65 + question.correctIndex)}. {question.options[question.correctIndex]}</dd></div>
      </dl>
      {comparisonNote}
      {question.formula && <div className="checkpointReviewRelation">
        <h4>Relationship</h4><p>{question.formula}</p>
      </div>}
      <div><h4>Worked solution</h4>{workedSteps?.length
        ? <ol className="checkpointWorkedSteps">{workedSteps.map((step, index) => <li key={index}>{step}</li>)}</ol>
        : <p>{question.solution || question.explanation || 'A worked explanation was not saved with this question.'}</p>}</div>
      {question.assumptions && <div><h4>Assumptions</h4><p>{question.assumptions}</p></div>}
      {children}
    </div>
  );
}
