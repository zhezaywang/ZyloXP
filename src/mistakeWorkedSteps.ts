import type { ReviewQuestion } from './sprintReviewModel';
import { getMistakeTeachingGuide } from './mistakeTeachingGuides';

type Calculation = { result: number; unit: string; steps: string[] };
type WorkedRule = { prompt: string; calculate: (values: number[]) => Calculation };
const show = (value: number) => Number.isSafeInteger(value) ? value.toString() : Number(value.toPrecision(12)).toString();

// This is a small grammar for the shipped question templates, not a free-text
// equation evaluator. Units and all non-numeric wording must match as well.
const rules: Record<string, WorkedRule> = {
  "Ohm's law": {
    prompt: 'An {n} V source is applied across an {n} ohm resistor. What current flows?',
    calculate: ([v, r]) => ({ result: v / r, unit: 'A', steps: [
      `The given voltage is ${v} V and resistance is ${r} ohm. The unknown is current.`,
      `Divide voltage by resistance: ${v} / ${r} = ${show(v / r)} A. Check: ${show(v / r)} A times ${r} ohm gives ${show(v)} V.`,
    ] }),
  },
  'Sinusoid to RMS phasor': {
    prompt: 'A voltage is v(t) = {n} V cos(omega t + {n} deg). What is the RMS phasor magnitude?',
    calculate: ([v, phase]) => ({ result: v / Math.SQRT2, unit: 'V', steps: [
      `The cosine coefficient is the peak amplitude, ${v} V. The ${phase}-degree phase does not change the RMS magnitude.`,
      `Divide by sqrt(2): ${v} / sqrt(2) is approximately ${show(v / Math.SQRT2)} V before final rounding.`,
    ] }),
  },
  'Thevenin to Norton': {
    prompt: 'A Thevenin equivalent has Vth = {n} V and Rth = {n} ohm. What is the Norton current magnitude?',
    calculate: ([v, r]) => ({ result: v / r, unit: 'A', steps: [
      `Shorting the output puts ${v} V across the ${r} ohm equivalent resistance.`,
      `IN = ${v} / ${r}, approximately ${show(v / r)} A before final rounding.`,
    ] }),
  },
  'RC time constant': {
    prompt: 'An RC circuit has R = {n} kohm and C = {n} uF. What is the time constant?',
    calculate: ([r, c]) => ({ result: r * c, unit: 'ms', steps: [
      `Convert the inputs: ${r} kohm = ${show(r * 1000)} ohm; ${c} uF = ${show(c * 1e-6)} F.`,
      `R times C = ${show(r * 1000)} times ${show(c * 1e-6)} = ${show(r * c / 1000)} s = ${show(r * c)} ms.`,
    ] }),
  },
  'Coulomb force': {
    prompt: 'Two point charges, {n} uC and {n} uC, are separated by {n} m in air. Using k = {n} N m^2/C^2, what is the force magnitude?',
    calculate: ([q1, q2, r, k]) => ({ result: k * q1 * 1e-6 * q2 * 1e-6 / r ** 2, unit: 'N', steps: [
      `The charges are ${show(q1 * 1e-6)} C and ${show(q2 * 1e-6)} C. Square the distance: ${r}^2 = ${show(r ** 2)} m^2.`,
      `Using the stated k, the numerator is ${show(k * q1 * 1e-6 * q2 * 1e-6)} N m^2. Divide by ${show(r ** 2)} m^2 to get approximately ${show(k * q1 * 1e-6 * q2 * 1e-6 / r ** 2)} N.`,
    ] }),
  },
  'Lossless characteristic impedance': {
    prompt: "A lossless line has per-unit-length inductance L' = {n} nH/m and per-unit-length capacitance C' = {n} pF/m. What is Z0?",
    calculate: ([l, c]) => ({ result: Math.sqrt(l * 1e-9 / (c * 1e-12)), unit: 'ohm', steps: [
      `Convert to ${show(l * 1e-9)} H/m and ${show(c * 1e-12)} F/m. Their ratio is ${show(l * 1000 / c)} ohm^2.`,
      `Take the square root: sqrt(${show(l * 1000 / c)}) is approximately ${show(Math.sqrt(l * 1000 / c))} ohm.`,
    ] }),
  },
  'Three-phase real power': {
    prompt: 'A balanced three-phase load has line voltage {n} kV, line current {n} A, and power factor {n}. What real power is delivered?',
    calculate: ([v, i, pf]) => ({ result: pf <= 1 ? Math.sqrt(3) * v * i * pf : NaN, unit: 'kW', steps: [
      `Using RMS line quantities, total apparent power is sqrt(3) times ${v} kV times ${i} A, approximately ${show(Math.sqrt(3) * v * i)} kVA.`,
      `Multiply by power factor ${pf}: real power is approximately ${show(Math.sqrt(3) * v * i * pf)} kW before rounding.`,
    ] }),
  },
  'Transformer voltage ratio': {
    prompt: 'An ideal transformer has Np = {n}, Ns = {n}, and primary voltage {n} V. What is the secondary voltage?',
    calculate: ([np, ns, v]) => ({ result: v * ns / np, unit: 'V', steps: [
      `The secondary-to-primary turns ratio is ${ns}/${np}, approximately ${show(ns / np)}.`,
      `Secondary voltage = ${v} times (${ns}/${np}), approximately ${show(v * ns / np)} V. Keep the ratio unrounded while multiplying.`,
    ] }),
  },
  'Buck converter output': {
    prompt: 'An ideal buck converter operating in continuous-conduction mode at steady state has Vin = {n} V and duty cycle D = {n}. What is the output voltage?',
    calculate: ([v, d]) => ({ result: d <= 1 ? v * d : NaN, unit: 'V', steps: [
      `The duty-cycle fraction is ${d}, or ${show(d * 100)} percent, and the input is ${v} V.`,
      `Average output = ${d} times ${v} V = ${show(v * d)} V under the stated ideal continuous-conduction conditions.`,
    ] }),
  },
  'Inverting op-amp gain': {
    prompt: 'An ideal inverting amplifier has Rin = {n} kohm and Rf = {n} kohm. What is the voltage gain?',
    calculate: ([rin, rf]) => ({ result: -rf / rin, unit: 'V/V', steps: [
      `Both resistances are in kohm, so the units cancel: Rf/Rin = ${rf}/${rin} = ${show(rf / rin)}.`,
      `Apply the inversion sign: Av = -(${rf}/${rin}) = ${show(-rf / rin)} V/V.`,
    ] }),
  },
  'BJT collector current': {
    prompt: 'A BJT has beta = {n} and base current {n} uA in active region. What is collector current?',
    calculate: ([beta, ib]) => ({ result: beta * ib / 1000, unit: 'mA', steps: [
      `In forward-active operation, multiply base current by beta: ${beta} times ${ib} uA = ${show(beta * ib)} uA.`,
      `Convert microamperes to milliamperes: ${show(beta * ib)} / 1000 = ${show(beta * ib / 1000)} mA.`,
    ] }),
  },
  'Binary state count': {
    prompt: 'How many unique states can {n} binary bits represent?',
    calculate: ([bits]) => ({ result: Number.isInteger(bits) && bits <= 52 ? 2 ** bits : NaN, unit: 'states', steps: [
      `Each of the ${bits} independent bits has two values. Multiply two choices together once per bit: 2^${bits}.`,
      `That gives ${show(2 ** bits)} patterns in total, including zero; the highest unsigned value is ${show(2 ** bits - 1)}.`,
    ] }),
  },
  'Nyquist sampling': {
    prompt: 'A signal is band-limited to {n} kHz. What is the theoretical Nyquist rate? Practical sampling must be higher.',
    calculate: ([f]) => ({ result: 2 * f, unit: 'kHz', steps: [
      `The highest signal frequency is ${f} kHz. The theoretical Nyquist rate is twice that frequency.`,
      `2 times ${f} kHz = ${show(2 * f)} kHz. This calculates the boundary, not a recommended practical sampling rate.`,
    ] }),
  },
  'Unity-feedback closed-loop gain': {
    prompt: 'A stable negative-unity-feedback system has scalar DC forward gain K = {n}. What is the closed-loop DC gain?',
    calculate: ([k]) => ({ result: k / (1 + k), unit: '', steps: [
      `For negative unity feedback the denominator is 1 + K = 1 + ${k} = ${show(1 + k)}.`,
      `Divide K by the entire denominator: ${k}/${show(1 + k)} = ${show(k / (1 + k))}.`,
    ] }),
  },
  'AM bandwidth': {
    prompt: 'A conventional AM signal has highest modulating frequency {n} kHz. What transmission bandwidth is required?',
    calculate: ([f]) => ({ result: 2 * f, unit: 'kHz', steps: [
      `The lower and upper sidebands each extend ${f} kHz from the carrier.`,
      `The full span is ${f} + ${f} = ${show(2 * f)} kHz.`,
    ] }),
  },
  'ADC LSB size': {
    prompt: 'A {n}-bit ADC uses a {n} V reference. What is one LSB? Use the ideal unipolar convention LSB = Vref/2^N.',
    calculate: ([bits, v]) => ({ result: Number.isInteger(bits) && bits <= 52 ? v / 2 ** bits * 1000 : NaN, unit: 'mV', steps: [
      `First count the quantization steps: 2^${bits} = ${show(2 ** bits)}.`,
      `Divide the reference by that count: ${v}/${show(2 ** bits)} = ${show(v / 2 ** bits)} V, approximately ${show(v / 2 ** bits * 1000)} mV before final rounding.`,
    ] }),
  },
  'Trace propagation delay': {
    prompt: 'A PCB trace is {n} inch long with delay {n} ps/in. What is the one-way propagation delay?',
    calculate: ([length, delay]) => ({ result: length * delay, unit: 'ps', steps: [
      `Multiply ${length} inches by ${delay} ps per inch. The length units cancel.`,
      `One-way delay = ${length} times ${delay} = ${show(length * delay)} ps; no round-trip factor is needed.`,
    ] }),
  },
  'UART bit time': {
    prompt: 'What is the bit time for a UART baud rate of {n} baud?',
    calculate: ([baud]) => ({ result: 1e6 / baud, unit: 'us', steps: [
      `One bit lasts 1/${baud} seconds, approximately ${show(1 / baud)} s.`,
      `Multiply by 1000000 to convert seconds to microseconds: approximately ${show(1e6 / baud)} us before final rounding.`,
    ] }),
  },
  'Free-space wavelength': {
    prompt: 'Using c = {n} Mm/s, what is the approximate free-space wavelength at {n} MHz?',
    calculate: ([c, f]) => ({ result: c / f, unit: 'm', steps: [
      `The stated speed is ${show(c * 1e6)} m/s and frequency is ${show(f * 1e6)} Hz.`,
      `Divide speed by frequency; the mega factors cancel: ${c}/${f} = ${show(c / f)} m.`,
    ] }),
  },
  'CT secondary current': {
    prompt: 'A {n}:{n} ideal current transformer, with saturation and ratio error neglected, carries {n} A primary current. What secondary current flows ideally?',
    calculate: ([ipRated, isRated, ip]) => ({ result: ip * isRated / ipRated, unit: 'A', steps: [
      `The rated secondary-to-primary current ratio is ${isRated}/${ipRated} = ${show(isRated / ipRated)}.`,
      `Multiply actual primary current by that ratio: ${ip} times (${isRated}/${ipRated}) = ${show(ip * isRated / ipRated)} A.`,
    ] }),
  },
};

function normalize(value: string) {
  return value.replaceAll('\u03a9', 'ohm')
    .replace(/[\u00b5\u03bc]/g, 'u').replaceAll('\u03c9', 'omega').replaceAll('\u03b2', 'beta')
    .replaceAll('\u00b0', 'deg').replaceAll('\u00b2', '^2')
    .replace(/\bAn\b/g, 'A').replace(/\ban\b/g, 'a').replace(/\s+/g, ' ').trim();
}

export function getMistakeWorkedSteps(question: ReviewQuestion): string[] | null {
  if (!getMistakeTeachingGuide(question) || !question.solution?.trim()) return null;
  const rule = Object.hasOwn(rules, question.subtopic) ? rules[question.subtopic] : null;
  if (!rule) return null;
  const number = '([+]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?)';
  const pattern = normalize(rule.prompt).split('{n}').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(number);
  const match = normalize(question.prompt).match(new RegExp(`^${pattern}$`));
  if (!match) return null;
  const values = match.slice(1).map(Number);
  if (values.some((value) => !Number.isFinite(value) || value <= 0 || value > 1e12)) return null;
  const calculation = rule.calculate(values);
  if (!Number.isFinite(calculation.result) || calculation.result === 0) return null;
  const answer = normalize(question.options[question.correctIndex] ?? '').match(/^([+-]?\d+(?:\.(\d+))?)\s*(.*)$/);
  if (!answer || answer[3] !== calculation.unit) return null;
  if (calculation.unit === 'states') {
    if (!/^\d+$/.test(answer[1]) || Number(answer[1]) !== calculation.result) return null;
  } else {
    const places = answer[2]?.length ?? 0;
    // Decline half-step boundaries instead of guessing a rounding convention.
    const margin = 0.5 * 10 ** -places - Number.EPSILON * Math.abs(calculation.result) * 8;
    if (margin <= 0 || Math.abs(Number(answer[1]) - calculation.result) >= margin) return null;
  }
  if (calculation.steps.some((step) => /NaN|Infinity/.test(step))) return null;
  return [...calculation.steps, question.solution];
}
