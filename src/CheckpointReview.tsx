import { ArrowRight, CheckCircle2, CircleMinus, Flag, XCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { AnswerSolution } from './AnswerSolution';
import { MistakeExplanation } from './MistakeExplanation';
import { matchesCheckpointFilter } from './checkpointResults';
import type { CheckpointResult, CheckpointResultFilter } from './checkpointResults';
import './CheckpointReview.css';

const FILTERS: { id: CheckpointResultFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'missed', label: 'Missed' },
  { id: 'unanswered', label: 'Unanswered' },
  { id: 'flagged', label: 'Flagged' },
  { id: 'uncertain', label: 'Uncertain' },
];

export function CheckpointReview({ results, onPractice }: {
  results: CheckpointResult[];
  onPractice: (questionId: string) => void;
}) {
  const [filter, setFilter] = useState<CheckpointResultFilter>('all');
  const allFilter = useRef<HTMLButtonElement>(null);
  const filtered = results.filter((result) => matchesCheckpointFilter(result, filter));

  return (
    <section className="checkpointReview" aria-label="Answer review">
      <header>
        <div>
          <p className="eyebrow">After the checkpoint</p>
          <h2>Review your answers</h2>
        </div>
        <p role="status">{filtered.length} of {results.length} questions</p>
      </header>
      <div className="checkpointReviewFilters" role="group" aria-label="Filter exam answers">
        {FILTERS.map(({ id, label }) => (
          <button
            type="button"
            key={id}
            ref={id === 'all' ? allFilter : undefined}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}<span>{results.filter((result) => matchesCheckpointFilter(result, id)).length}</span>
          </button>
        ))}
      </div>
      {filter === 'uncertain' && <p className="checkpointReviewHint">Answered with low or medium confidence.</p>}
      {filtered.length === 0 ? (
        <div className="checkpointReviewEmpty">
          <p>No {filter === 'all' ? '' : `${filter} `}questions in this checkpoint.</p>
          {filter !== 'all' && <button className="secondaryButton" type="button" onClick={() => {
            setFilter('all');
            allFilter.current?.focus();
          }}>Show all answers</button>}
        </div>
      ) : (
        <div className="checkpointReviewList">
          {filtered.map((result) => {
            const { question, number, optionIndex, confidence, flagged, correct } = result;
            const outcome = correct ? 'correct' : optionIndex === null ? 'unanswered' : 'incorrect';
            const StatusIcon = correct ? CheckCircle2 : optionIndex === null ? CircleMinus : XCircle;
            const titleId = `checkpoint-review-${question.id}`;
            return (
              <article className={`checkpointReviewItem ${outcome}`} key={question.id} aria-labelledby={titleId}>
                <header>
                  <span className="checkpointReviewNumber" aria-label={`Question ${number}`}>{number}</span>
                  <div>
                    <p>{question.topic}</p>
                    <h3 id={titleId}>{question.subtopic}</h3>
                  </div>
                  <span className="checkpointReviewOutcome"><StatusIcon size={16} aria-hidden="true" />
                    {correct ? 'Correct' : optionIndex === null ? 'Unanswered' : 'Incorrect'}
                  </span>
                </header>
                <p className="checkpointReviewPrompt">{question.prompt}</p>
                <div className="checkpointReviewSignals">
                  {flagged && <span><Flag size={14} aria-hidden="true" />Flagged</span>}
                  <span>{confidence ? `${confidence[0].toUpperCase()}${confidence.slice(1)} confidence` : 'Confidence not rated'}</span>
                </div>
                {!correct && <MistakeExplanation question={question} optionIndex={optionIndex} />}
                <details>
                  <summary>Review answer<span className="srOnly"> for question {number}</span></summary>
                  <AnswerSolution question={question}
                    answerLabel={optionIndex === null ? 'Not answered' : `${String.fromCharCode(65 + optionIndex)}. ${question.options[optionIndex]}`}>
                    <button className="secondaryButton" type="button" onClick={() => onPractice(question.id)}>
                      Practice this question<ArrowRight size={17} aria-hidden="true" />
                    </button>
                  </AnswerSolution>
                </details>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
