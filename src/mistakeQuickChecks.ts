import { getMistakeTeachingGuide } from './mistakeTeachingGuides';
import type { ReviewQuestion } from './sprintReviewModel';

export type MistakeQuickCheck = {
  prompt: string;
  hint: string;
  options: readonly { label: string; feedback: string }[];
  correctIndex: number;
};

// Standalone transfer questions: their inputs never depend on the original
// answer key or on a current-bank lookup for an archived question.
const checks: Record<string, MistakeQuickCheck> = {
  "Ohm's law": {
    prompt: 'An ideal resistor has a fixed, positive voltage across it. If its resistance doubles, what happens to the current?',
    hint: 'Use I = V/R. Only the denominator changes.',
    options: [
      { label: 'It doubles', feedback: 'Resistance is in the denominator. Doubling R gives V/(2R), which is half the original current.' },
      { label: 'It halves', feedback: 'Inew = V/(2R) = Iold/2. At the same voltage, doubling resistance halves current.' },
      { label: 'It stays the same', feedback: 'The voltage is unchanged, but the resistance is not. I = V/R therefore changes to half its original value.' },
    ], correctIndex: 1,
  },
  'Sinusoid to RMS phasor': {
    prompt: 'A sinusoidal voltage keeps the same peak amplitude, but its phase shifts from 0 to 90 degrees. What happens to its RMS magnitude?',
    hint: 'RMS magnitude is Vpeak/sqrt(2). Consider whether phase appears in that expression.',
    options: [
      { label: 'It stays the same', feedback: 'Changing phase shifts the waveform in time. Its RMS magnitude remains Vpeak/sqrt(2).' },
      { label: 'It becomes zero', feedback: 'The voltage may be zero at one instant, but RMS describes a full cycle. A phase shift does not change the RMS magnitude.' },
      { label: 'It doubles', feedback: 'Peak amplitude has not changed. Dividing the same peak by sqrt(2) gives the same RMS magnitude.' },
    ], correctIndex: 0,
  },
  'Thevenin to Norton': {
    prompt: 'A Thevenin equivalent has Vth = 10 V and Rth = 5 ohm. What is its Norton current magnitude?',
    hint: 'The Norton current equals the short-circuit current, Vth/Rth.',
    options: [
      { label: '50 A', feedback: '10 times 5 is 50, but V times ohm is not current. Divide voltage by resistance: 10/5 = 2 A.' },
      { label: '0.5 A', feedback: '5/10 reverses the ratio. Norton current is Vth/Rth = 10/5 = 2 A.' },
      { label: '2 A', feedback: 'IN = 10 V / 5 ohm = 2 A. Multiplying 2 A by 5 ohm recovers 10 V.' },
    ], correctIndex: 2,
  },
  'RC time constant': {
    prompt: 'An ideal first-order RC circuit has R = 2 kohm and C = 5 microfarads. What is its time constant?',
    hint: 'Convert to ohms and farads, then multiply R by C.',
    options: [
      { label: '0.01 ms', feedback: '2000 times 0.000005 gives 0.01 seconds, not milliseconds. That is 10 ms.' },
      { label: '10 ms', feedback: 'RC = 2000 ohm times 0.000005 F = 0.01 s = 10 ms.' },
      { label: '10 s', feedback: 'The prefixes matter: kohm times microfarads gives milliseconds. 2 times 5 therefore gives 10 ms, not 10 s.' },
    ], correctIndex: 1,
  },
  'Coulomb force': {
    prompt: 'Two nonzero point charges in the same medium keep their charge values. If their separation doubles, what happens to the force magnitude?',
    hint: 'The separation is squared in F = k |q1 q2|/r^2.',
    options: [
      { label: 'It becomes one quarter', feedback: 'Doubling r multiplies r squared by four. The unchanged numerator divided by four gives one quarter of the force.' },
      { label: 'It halves', feedback: 'The dependence is inverse-square, not inverse-distance. Doubling separation reduces force to one quarter.' },
      { label: 'It becomes four times larger', feedback: 'The distance-squared term is in the denominator. Increasing it by four reduces the force by four.' },
    ], correctIndex: 0,
  },
  'Lossless characteristic impedance': {
    prompt: 'For a lossless line, inductance per unit length becomes four times larger while capacitance per unit length stays fixed. What happens to characteristic impedance?',
    hint: 'Use Z0 = sqrt(L/C), including the square root.',
    options: [
      { label: 'It becomes four times larger', feedback: 'The L/C ratio grows by four, but impedance is its square root. sqrt(4) = 2, so impedance doubles.' },
      { label: 'It halves', feedback: 'Increasing the numerator raises the impedance. sqrt(4L/C) is twice sqrt(L/C).' },
      { label: 'It doubles', feedback: 'Znew = sqrt(4L/C) = 2 sqrt(L/C). The characteristic impedance doubles.' },
    ], correctIndex: 2,
  },
  'Three-phase real power': {
    prompt: 'A balanced three-phase load keeps the same RMS line voltage and line current. If its power factor rises from 0.5 to 1, what happens to real power?',
    hint: 'Real power is sqrt(3) times line voltage times line current times power factor.',
    options: [
      { label: 'It stays the same', feedback: 'The apparent power stays fixed, but real power includes the power factor. Changing 0.5 to 1 doubles real power.' },
      { label: 'It doubles', feedback: 'With voltage and current fixed, real power is proportional to power factor. The ratio 1/0.5 is two.' },
      { label: 'It halves', feedback: 'Power factor is a multiplier, not a divisor. Increasing it from 0.5 to 1 doubles real power.' },
    ], correctIndex: 1,
  },
  'Transformer voltage ratio': {
    prompt: 'An ideal transformer has half as many secondary turns as primary turns. If its primary voltage is 12 V RMS, what is its secondary voltage?',
    hint: 'Vs/Vp equals Ns/Np. Keep the secondary-to-primary order.',
    options: [
      { label: '6 V RMS', feedback: 'Vs = 12 times 1/2 = 6 V RMS. Fewer secondary turns means a lower secondary voltage.' },
      { label: '24 V RMS', feedback: '24 V would require twice as many secondary turns, not half as many. Here Vs = 12 times 1/2 = 6 V RMS.' },
      { label: '12 V RMS', feedback: 'Equal voltages would require equal turns. The one-half turns ratio gives 6 V RMS.' },
    ], correctIndex: 0,
  },
  'Buck converter output': {
    prompt: 'An ideal buck converter is in continuous conduction at steady state. With Vin = 12 V and duty cycle 25 percent, what is the average output voltage?',
    hint: 'Convert the duty cycle to a fraction before using Vo = D Vin.',
    options: [
      { label: '300 V', feedback: '25 percent is 0.25, not 25. The ideal buck output is 0.25 times 12 V = 3 V.' },
      { label: '48 V', feedback: 'Dividing by duty cycle gives 48, but a buck uses multiplication: 0.25 times 12 V = 3 V.' },
      { label: '3 V', feedback: 'D = 25/100 = 0.25. Vo = 0.25 times 12 V = 3 V under the stated conditions.' },
    ], correctIndex: 2,
  },
  'Inverting op-amp gain': {
    prompt: 'An ideal inverting amplifier has equal, positive input and feedback resistances. What is its voltage gain?',
    hint: 'Av = -Rf/Rin. Keep the sign as well as the resistor ratio.',
    options: [
      { label: '+1 V/V', feedback: 'The resistor ratio has magnitude one, but the stage is inverting. Its gain is -1 V/V.' },
      { label: '-1 V/V', feedback: 'Equal resistances give Rf/Rin = 1. The inversion supplies the minus sign, so Av = -1 V/V.' },
      { label: '0 V/V', feedback: 'Equal resistances give a ratio of one, not a difference of zero. Av = -Rf/Rin = -1 V/V.' },
    ], correctIndex: 1,
  },
  'BJT collector current': {
    prompt: 'A BJT is in forward-active operation with beta = 100 and base current 10 microamperes. What is its collector current?',
    hint: 'Multiply base current by beta, then convert microamperes to milliamperes.',
    options: [
      { label: '1 mA', feedback: 'IC = 100 times 10 microamperes = 1000 microamperes = 1 mA.' },
      { label: '1000 mA', feedback: 'The product 1000 is in microamperes. Dividing by 1000 converts it to 1 mA.' },
      { label: '0.1 mA', feedback: '100 times 10 gives 1000 microamperes, which is 1 mA. Recheck the multiplication and conversion together.' },
    ], correctIndex: 0,
  },
  'Binary state count': {
    prompt: 'How many distinct patterns can three independent binary bits represent, including the all-zero pattern?',
    hint: 'Each bit has two possible values. Count every combination.',
    options: [
      { label: '7 states', feedback: 'Seven is the largest unsigned value, but the values run from zero through seven. That makes eight states.' },
      { label: '6 states', feedback: 'The choices multiply: 2 times 2 times 2, not 2 times 3. There are eight states.' },
      { label: '8 states', feedback: '2^3 = 8 distinct patterns. Counting the all-zero pattern is essential.' },
    ], correctIndex: 2,
  },
  'Nyquist sampling': {
    prompt: 'A baseband signal is band-limited to 3 kHz. What is its theoretical Nyquist rate, before adding any practical sampling margin?',
    hint: 'The theoretical boundary is twice the highest signal frequency.',
    options: [
      { label: '3 kHz', feedback: '3 kHz is the highest signal frequency, not twice that frequency. The theoretical rate is 6 kHz.' },
      { label: '6 kHz', feedback: '2 times 3 kHz = 6 kHz. For general reconstruction, sampling should exceed this boundary; the question asks for the theoretical rate.' },
      { label: '8 kHz', feedback: '8 kHz is above the boundary and can be a sampling-rate choice. The theoretical Nyquist rate itself is 2 times 3 kHz = 6 kHz.' },
    ], correctIndex: 1,
  },
  'Unity-feedback closed-loop gain': {
    prompt: 'A stable negative-unity-feedback system has scalar DC forward gain K = 4. What is its closed-loop DC gain?',
    hint: 'Divide K by the entire denominator (1 + K).',
    options: [
      { label: '0.8', feedback: 'T(0) = 4/(1 + 4) = 4/5 = 0.8.' },
      { label: '4', feedback: 'Four is the forward gain before feedback. The closed-loop gain is 4/(1 + 4) = 0.8.' },
      { label: '1.25', feedback: '5/4 reverses the numerator and denominator. The required ratio is 4/5 = 0.8.' },
    ], correctIndex: 0,
  },
  'AM bandwidth': {
    prompt: 'Conventional double-sideband AM has a highest modulating frequency of 3 kHz. What transmission bandwidth does it require?',
    hint: 'Count the frequency span of both the lower and upper sidebands.',
    options: [
      { label: '3 kHz', feedback: '3 kHz accounts for one sideband. Conventional double-sideband AM occupies a total span of 6 kHz.' },
      { label: '9 kHz', feedback: 'The carrier does not add a third sideband width. The two spans add to 3 + 3 = 6 kHz.' },
      { label: '6 kHz', feedback: 'Each sideband extends 3 kHz from the carrier, so the full span is 3 + 3 = 6 kHz.' },
    ], correctIndex: 2,
  },
  'ADC LSB size': {
    prompt: 'An ideal 8-bit unipolar ADC has a 2.56 V reference. Using LSB = Vref/2^N, what is one LSB?',
    hint: 'Find 2^8 first, divide the reference by it, then convert volts to millivolts.',
    options: [
      { label: '10.04 mV', feedback: 'Dividing by 255 gives about 10.04 mV, but the stated convention uses 2^8 = 256 steps. The LSB is 10 mV.' },
      { label: '10 mV', feedback: '2^8 = 256. Then 2.56/256 = 0.01 V = 10 mV per step.' },
      { label: '320 mV', feedback: 'Dividing by eight uses the bit count instead of the step count. Divide by 2^8 = 256 to get 10 mV.' },
    ], correctIndex: 1,
  },
  'Trace propagation delay': {
    prompt: 'A uniform PCB trace is 3 inches long and has 150 ps/in propagation delay. What is its one-way delay?',
    hint: 'Multiply length by delay per unit length; the inches cancel.',
    options: [
      { label: '450 ps', feedback: '3 in times 150 ps/in = 450 ps for one trip along the trace.' },
      { label: '900 ps', feedback: '900 ps is twice the one-way delay. One trip takes 3 times 150 = 450 ps.' },
      { label: '50 ps', feedback: 'The delay adds along the trace, so multiply by length rather than divide: 3 times 150 = 450 ps.' },
    ], correctIndex: 0,
  },
  'UART bit time': {
    prompt: 'A UART sends one symbol per bit at 100000 baud. How long is one bit, rather than a whole frame?',
    hint: 'Take the reciprocal of baud rate to get seconds, then convert to microseconds.',
    options: [
      { label: '100 microseconds', feedback: '100 microseconds is ten bit intervals at this rate. One bit takes 1/100000 s = 10 microseconds.' },
      { label: '0.1 microseconds', feedback: '1/100000 s = 0.00001 s. Multiplying by 1000000 gives 10 microseconds.' },
      { label: '10 microseconds', feedback: 'Bit time = 1/100000 s = 0.00001 s = 10 microseconds.' },
    ], correctIndex: 2,
  },
  'Free-space wavelength': {
    prompt: 'Using c = 300 Mm/s, what is the free-space wavelength at 100 MHz?',
    hint: 'Use wavelength = c/f. The mega prefixes in Mm/s and MHz cancel.',
    options: [
      { label: '0.333 m', feedback: 'That is approximately 100/300, the inverted ratio. Wavelength is speed divided by frequency: 300/100 = 3 m.' },
      { label: '3 m', feedback: '300000000 m/s divided by 100000000 Hz gives 3 m.' },
      { label: '3000000 m', feedback: '100 MHz is 100000000 Hz, not 100 Hz. Using compatible units gives 3 m.' },
    ], correctIndex: 1,
  },
  'CT secondary current': {
    prompt: 'An ideal 200:5 current transformer carries 40 A primary current. With saturation and ratio error neglected, what is its secondary current?',
    hint: 'Multiply actual primary current by rated secondary current divided by rated primary current.',
    options: [
      { label: '1 A', feedback: 'Is = 40 times (5/200) = 1 A. The rated current ratio stays fixed.' },
      { label: '5 A', feedback: '5 A is the rated secondary current at 200 A primary. At 40 A primary, the ideal secondary current is 1 A.' },
      { label: '1600 A', feedback: 'Multiplying by 200/5 reverses the ratio. Use 5/200: 40 times (5/200) = 1 A.' },
    ], correctIndex: 0,
  },
};

export function getMistakeQuickCheck(question: ReviewQuestion): MistakeQuickCheck | null {
  if (!getMistakeTeachingGuide(question) || (!question.solution?.trim() && !question.explanation?.trim())) return null;
  return Object.hasOwn(checks, question.subtopic) ? checks[question.subtopic] : null;
}

export function checkMistakeQuickAnswer(check: MistakeQuickCheck, optionIndex: number | null) {
  if (typeof optionIndex !== 'number' || !Number.isInteger(optionIndex)
    || optionIndex < 0 || optionIndex >= check.options.length) return null;
  return { correct: optionIndex === check.correctIndex, feedback: check.options[optionIndex].feedback };
}
