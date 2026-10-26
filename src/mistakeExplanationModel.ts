import type { ReviewQuestion } from './sprintReviewModel';
import { getMistakeTeachingGuide } from './mistakeTeachingGuides';

export type MistakeFocus = 'concept' | 'formula' | 'units' | 'check';

type MistakeFeedback = { kind: 'choice' | 'value' | 'sign' | 'units' | 'equivalent'; message: string };

// Only compare plain scalar quantities with known units. Expressions, ranges,
// phasors, and unfamiliar units must not be treated as simple numbers.
function parseQuantity(answer: string) {
  const match = answer.trim().replaceAll('\u2212', '-').match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*([^\s\d]*)$/i);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || (value === 0 && /[1-9]/.test(match[1].split(/e/i)[0]))) return null;
  const unit = match[2].replace(/[\u00b5\u03bc]/g, 'u').replace(/^ohms?$/, '\u03a9');
  if (unit === '' || unit === 'V/V') return { value, dimension: 'ratio' };
  if (unit === 'states') return { value, dimension: 'count' };
  const scaled = unit.match(/^([pnumkMG]?)(V|A|\u03a9|F|H|s|Hz|W|m|N)$/);
  if (!scaled) return null;
  const prefixes: Record<string, number> = { '': 1, p: 1e-12, n: 1e-9, u: 1e-6, m: 1e-3, k: 1e3, M: 1e6, G: 1e9 };
  const baseValue = value * prefixes[scaled[1]];
  if (!Number.isFinite(baseValue) || (baseValue === 0 && value !== 0)) return null;
  return { value: baseValue, dimension: scaled[2] };
}

export function getMistakeAnswerLabel(question: ReviewQuestion, optionIndex: number | null | undefined) {
  if (typeof optionIndex !== 'number' || !Number.isInteger(optionIndex)
    || optionIndex < 0 || optionIndex >= question.options.length
    || !Number.isInteger(question.correctIndex) || question.correctIndex < 0
    || question.correctIndex >= question.options.length || optionIndex === question.correctIndex) return null;
  return `${String.fromCharCode(65 + optionIndex)}. ${question.options[optionIndex]}`;
}

export function getMistakeFeedback(question: ReviewQuestion, optionIndex: number | null | undefined): MistakeFeedback | null {
  if (!getMistakeAnswerLabel(question, optionIndex)) return null;
  const chosenText = question.options[optionIndex!];
  const correctText = question.options[question.correctIndex];
  if (!question.solution?.trim() && !question.explanation?.trim()) return {
    kind: 'choice',
    message: `Your choice was "${chosenText}"; the saved answer is "${correctText}". No worked reasoning was saved with this question, so the answer key alone cannot explain why your choice was marked incorrect.`,
  };
  const chosen = parseQuantity(chosenText);
  const correct = parseQuantity(correctText);
  if (!chosen || !correct) return {
    kind: 'choice',
    message: `Your choice, "${chosenText}", differs from the saved answer, "${correctText}". Compare the stated conditions with the worked reasoning below; the choice alone does not show which step went wrong.`,
  };
  if (chosen.dimension !== correct.dimension) return {
    kind: 'units',
    message: `${chosenText} and ${correctText} describe different kinds of quantities, not just different prefixes. Check what the question asks you to find before calculating.`,
  };
  const difference = Math.abs(chosen.value - correct.value);
  const tolerance = Number.EPSILON * 8 * Math.max(Math.abs(chosen.value), Math.abs(correct.value));
  if (difference <= tolerance) return {
    kind: 'equivalent',
    message: `${chosenText} and ${correctText} represent the same value after unit conversion. The saved answer key marks a different choice, so this may be an answer-choice issue rather than a mistake in your reasoning.`,
  };
  const guide = getMistakeTeachingGuide(question);
  if (chosen.value !== 0 && correct.value !== 0 && Math.sign(chosen.value) !== Math.sign(correct.value)) return {
    kind: 'sign',
    message: `${chosenText} has the opposite sign to ${correctText}.${guide && question.subtopic === 'Inverting op-amp gain'
      ? ' An inverting amplifier with positive resistances has negative gain: the minus sign indicates reversed signal polarity. Check the resistor ratio for the magnitude as well.'
      : ' Check the sign convention in the question and the sign at each step of the relationship.'}`,
  };
  if (guide && question.subtopic === 'Nyquist sampling' && chosen.value > correct.value && correct.value > 0) return {
    kind: 'value',
    message: `${chosenText} is above the theoretical Nyquist rate of ${correctText}. A higher rate can be used for sampling, but this question asks for the theoretical boundary, not a practical rate with extra margin.`,
  };
  const close = correct.value !== 0 && difference / Math.abs(correct.value) < 0.01;
  return {
    kind: 'value',
    message: close
      ? `${chosenText} is close to ${correctText}, but differs at the displayed precision. Compare the substitution and arithmetic below, keeping intermediate digits until the final rounding.`
      : `${chosenText} is ${chosen.value > correct.value ? 'greater' : 'less'} than the worked result, ${correctText}. Use the relationship below to check the operation and the given values.`,
  };
}

export function getMistakeGuidance(question: ReviewQuestion, focus: MistakeFocus): string[] {
  const correctAnswer = question.options[question.correctIndex];
  const guide = getMistakeTeachingGuide(question);
  if (guide) {
    switch (focus) {
      case 'concept': return [guide.concept, guide.setup, guide.caution];
      case 'formula': return [`Start from ${question.formula}.`, guide.setup, guide.check];
      case 'units': return [guide.units, guide.setup, guide.caution];
      case 'check': return [guide.check, guide.caution, `Compare with ${correctAnswer} using the stated conditions${question.subtopic === 'Binary state count' ? '; this is an exact count.' : ' and final rounding.'}`];
    }
  }
  const scalar = parseQuantity(correctAnswer ?? '');
  if (!scalar) {
    const reference = question.formula ? `Compare your choice with ${question.formula}.` : 'Compare each claim in your choice with the saved reasoning, if available.';
    switch (focus) {
      case 'concept': return ['Identify the condition or relationship the question asks about.', reference, question.assumptions ? `Use the stated conditions: ${question.assumptions}.` : 'Avoid adding conditions that the question does not state.'];
      case 'formula': return [reference, 'Match the meaning of each term to the quantity or property being asked about.', 'A conceptual answer may not require a calculation; follow the saved reasoning rather than inventing a formula.'];
      case 'units': return ['First check whether the choice describes a quantity or a statement.', 'For quantities, check the units and prefixes; for statements, check the meaning of the terms.', 'Do not apply numerical rounding to a non-numerical answer.'];
      case 'check': return ['Read the question again, including any qualifier such as ideal, magnitude, or steady state.', reference, `The saved answer is "${correctAnswer ?? 'unavailable'}". A selected choice alone is not enough to identify your reasoning mistake.`];
    }
  }
  switch (focus) {
    case 'concept': return [
      'Name the quantity you need to find and separate it from the given quantities.',
      question.assumptions ? `Check the stated conditions: ${question.assumptions}.` : 'Check the conditions stated in the question before choosing a relationship.',
      question.formula ? `Explain what each symbol in ${question.formula} represents before using numbers.` : 'Describe how the given quantities relate to the quantity you need.',
    ];
    case 'formula': return [
      question.formula ? `Start from ${question.formula}.` : 'Write the relationship used in the worked solution.',
      'Match each given quantity to a symbol and isolate the quantity you need.',
      'Substitute the values, then compare each step with the worked solution to find the first difference.',
    ];
    case 'units': return [
      'Write a unit beside every given value, including any prefix.',
      'Convert quantities to compatible units before substituting them into the relationship.',
      `Check the final unit and displayed precision against ${correctAnswer}. Keep extra digits until the final result.`,
    ];
    case 'check': return [
      'Estimate the sign and approximate size of the result before calculating.',
      'Recalculate independently, keeping intermediate values unrounded.',
      `Compare your result with ${correctAnswer} and revisit the first step that differs from the worked solution.`,
    ];
  }
}
