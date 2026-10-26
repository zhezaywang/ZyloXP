import { ChevronDown, Lightbulb } from 'lucide-react';
import { useId, useState } from 'react';
import { AnswerSolution } from './AnswerSolution';
import { getMistakeAnswerLabel, getMistakeFeedback, getMistakeGuidance } from './mistakeExplanationModel';
import { getMistakeWorkedSteps } from './mistakeWorkedSteps';
import { MistakeQuickCheck } from './MistakeQuickCheck';
import type { MistakeFocus } from './mistakeExplanationModel';
import type { ReviewQuestion } from './sprintReviewModel';
import './MistakeExplanation.css';

const FOCUS_OPTIONS: { id: MistakeFocus; label: string }[] = [
  { id: 'concept', label: 'Concept' },
  { id: 'formula', label: 'Formula' },
  { id: 'units', label: 'Units' },
  { id: 'check', label: 'Final check' },
];

export function MistakeExplanation({ question, optionIndex }: {
  question: ReviewQuestion;
  optionIndex: number | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<MistakeFocus>('concept');
  const panelId = useId();
  const answerLabel = getMistakeAnswerLabel(question, optionIndex);
  const feedback = getMistakeFeedback(question, optionIndex);
  if (!answerLabel) return null;

  return <div className="mistakeExplanation">
    <button className="secondaryButton mistakeExplanationToggle" type="button"
      aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((value) => !value)}>
      <Lightbulb size={17} aria-hidden="true" />{open ? 'Hide explanation' : 'Explain my mistake'}
      <ChevronDown size={16} aria-hidden="true" />
    </button>
    <section id={panelId} className="mistakeExplanationBody" hidden={!open} aria-label="Mistake explanation">
      {open && <>
        <h3>{feedback?.kind === 'equivalent' ? 'Check this answer' : "Why this answer doesn't fit"}</h3>
        <p className="mistakeExplanationPrompt">{question.prompt}</p>
        <AnswerSolution question={question} answerLabel={answerLabel}
          workedSteps={getMistakeWorkedSteps(question)}
          answerKeyLabel={feedback?.kind === 'equivalent' ? 'Saved answer key' : 'Correct answer'}
          comparisonNote={feedback && <div className="mistakeExplanationReason">
            <h4>{feedback.kind === 'equivalent' ? 'Possible answer-choice issue' : 'Check your choice'}</h4>
            <p>{feedback.message}</p>
          </div>} />
        <div className="mistakeExplanationGuidance">
          <h4>Where would you like help?</h4>
          <div className="mistakeExplanationFocus" role="group" aria-label="Guidance focus">
            {FOCUS_OPTIONS.map((option) => <button type="button" key={option.id}
              aria-pressed={focus === option.id} onClick={() => setFocus(option.id)}>{option.label}</button>)}
          </div>
          <div role="status" aria-live="polite" aria-atomic="true">
            <ol>{getMistakeGuidance(question, focus).map((step) => <li key={step}>{step}</li>)}</ol>
          </div>
        </div>
      </>}
      {feedback?.kind !== 'equivalent' && <MistakeQuickCheck
        key={`${question.id}:${question.prompt}:${optionIndex}`} question={question} />}
    </section>
  </div>;
}
