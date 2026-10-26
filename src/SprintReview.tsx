import { Bookmark, CheckCircle2, CircleMinus, XCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { AnswerSolution } from './AnswerSolution';
import { MistakeExplanation } from './MistakeExplanation';
import { matchesSprintReviewFilter } from './sprintReviewModel';
import type { SprintReviewFilter, SprintReviewItem } from './sprintReviewModel';
import './CheckpointReview.css';

const FILTERS: { id: SprintReviewFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'missed', label: 'Missed' },
  { id: 'skipped', label: 'Skipped' },
  { id: 'uncertain', label: 'Uncertain' },
];
const CONFIDENCE_LABELS = { guess: 'Guess', unsure: 'Unsure', sure: 'Sure' };

export function SprintReview({ items, bookmarkedIds, onToggleBookmark, availableQuestionIds }: {
  items: SprintReviewItem[];
  bookmarkedIds: string[];
  onToggleBookmark: (questionId: string) => void;
  availableQuestionIds?: string[];
}) {
  const [filter, setFilter] = useState<SprintReviewFilter>('all');
  const allFilter = useRef<HTMLButtonElement>(null);
  const filtered = items.filter((item) => matchesSprintReviewFilter(item, filter));

  return (
    <section className="checkpointReview" aria-label="Sprint answer breakdown">
      <header>
        <div><p className="eyebrow">Answer review</p><h2>Learn from this session</h2></div>
        <p role="status">{filtered.length} of {items.length} questions</p>
      </header>
      <div className="checkpointReviewFilters" role="group" aria-label="Filter session answers">
        {FILTERS.map(({ id, label }) => <button type="button" key={id}
          ref={id === 'all' ? allFilter : undefined} aria-pressed={filter === id} onClick={() => setFilter(id)}>
          {label}<span>{items.filter((item) => matchesSprintReviewFilter(item, id)).length}</span>
        </button>)}
      </div>
      {filter === 'uncertain' && <p className="checkpointReviewHint">Answered with Guess or Unsure confidence, including correct answers.</p>}
      {filtered.length === 0 ? <div className="checkpointReviewEmpty">
        <p>No {filter === 'all' ? '' : `${filter} `}questions in this session.</p>
        {filter !== 'all' && <button className="secondaryButton" type="button" onClick={() => {
          setFilter('all');
          allFilter.current?.focus();
        }}>Show all answers</button>}
      </div> : <div className="checkpointReviewList">
        {filtered.map(({ question, number, answer }) => {
          const skipped = answer.result === 'skipped';
          const correct = answer.result === 'correct';
          const StatusIcon = correct ? CheckCircle2 : skipped ? CircleMinus : XCircle;
          const saved = bookmarkedIds.includes(question.id);
          const available = !availableQuestionIds || availableQuestionIds.includes(question.id);
          const titleId = `sprint-review-${question.id}`;
          const answerLabel = skipped ? 'Skipped'
            : answer.optionIndex === null || answer.optionIndex === undefined ? 'Answer not recorded for this session'
              : `${String.fromCharCode(65 + answer.optionIndex)}. ${question.options[answer.optionIndex]}`;
          return <article className={`checkpointReviewItem ${correct ? 'correct' : skipped ? 'unanswered' : 'incorrect'}`}
            key={question.id} aria-labelledby={titleId}>
            <header>
              <span className="checkpointReviewNumber" aria-label={`Question ${number}`}>{number}</span>
              <div><p>{question.topic}</p><h3 id={titleId}>{question.subtopic}</h3></div>
              <span className="checkpointReviewOutcome"><StatusIcon size={16} aria-hidden="true" />{correct ? 'Correct' : skipped ? 'Skipped' : 'Incorrect'}</span>
            </header>
            {answer.result === 'wrong' && <MistakeExplanation question={question} optionIndex={answer.optionIndex} />}
            <details>
              <summary>Review answer<span className="srOnly"> for question {number}</span></summary>
              <p className="checkpointReviewPrompt">{question.prompt}</p>
              {!skipped && <div className="checkpointReviewSignals">
                <span>{answer.confidence ? `Confidence: ${CONFIDENCE_LABELS[answer.confidence]}` : 'Confidence not recorded'}</span>
              </div>}
              <AnswerSolution question={question} answerLabel={answerLabel}>
                <button className="secondaryButton" type="button" aria-pressed={saved}
                  disabled={!available}
                  onClick={() => onToggleBookmark(question.id)}>
                  <Bookmark size={17} aria-hidden="true" />{!available ? 'Question changed or unavailable' : saved ? 'Saved question' : 'Save question'}
                </button>
              </AnswerSolution>
            </details>
          </article>;
        })}
      </div>}
    </section>
  );
}
