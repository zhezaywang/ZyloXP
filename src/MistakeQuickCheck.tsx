import { CheckCircle2, ChevronDown, CircleHelp, Lightbulb } from 'lucide-react';
import { useId, useState } from 'react';
import { checkMistakeQuickAnswer, getMistakeQuickCheck } from './mistakeQuickChecks';
import type { ReviewQuestion } from './sprintReviewModel';

export function MistakeQuickCheck({ question }: { question: ReviewQuestion }) {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<number | null>(null);
  const id = useId();
  const check = getMistakeQuickCheck(question);
  if (!check) return null;
  const result = checkMistakeQuickAnswer(check, submitted);

  return <div className="mistakeQuickCheck">
    <button className="secondaryButton mistakeExplanationToggle" type="button"
      aria-expanded={open} aria-controls={`${id}-body`} onClick={() => setOpen((value) => !value)}>
      <CircleHelp size={17} aria-hidden="true" />{open ? 'Hide quick check' : 'Try a quick check'}
      <ChevronDown size={16} aria-hidden="true" />
    </button>
    <section id={`${id}-body`} hidden={!open} aria-label="Quick understanding check" className="mistakeQuickCheckBody">
      <header><h4>Quick check</h4><span>Ungraded</span></header>
      <form onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); setSubmitted(selected); }}>
        <fieldset>
          <legend>{check.prompt}</legend>
          <div className="mistakeQuickCheckOptions">
            {check.options.map((option, index) => <label key={option.label} className="mistakeQuickCheckOption">
              <input type="radio" name={`${id}-answer`} value={index} checked={selected === index}
                onChange={() => { setSelected(index); setSubmitted(null); }} />
              <span>{option.label}</span>
            </label>)}
          </div>
        </fieldset>
        <div className="mistakeQuickCheckActions">
          <button type="submit" className="secondaryButton" disabled={selected === null}>Check answer</button>
          <button type="button" className="secondaryButton" aria-expanded={showHint} aria-controls={`${id}-hint`}
            onClick={() => setShowHint((value) => !value)}><Lightbulb size={16} aria-hidden="true" />{showHint ? 'Hide hint' : 'Show hint'}</button>
        </div>
        <p id={`${id}-hint`} className="mistakeQuickCheckHint" hidden={!showHint}>{check.hint}</p>
        <div role="status" aria-label="Quick check feedback" aria-live="polite" aria-atomic="true"
          className={`mistakeQuickCheckResult ${result?.correct ? 'correct' : ''}`}>
          {result && <>
            <h5>{result.correct ? <CheckCircle2 size={17} aria-hidden="true" /> : <CircleHelp size={17} aria-hidden="true" />}
              {result.correct ? "That's right" : 'Not quite'}</h5>
            <p>{result.feedback}</p>
          </>}
        </div>
      </form>
    </section>
  </div>;
}
