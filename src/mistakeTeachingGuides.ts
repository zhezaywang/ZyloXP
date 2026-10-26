import type { ReviewQuestion } from './sprintReviewModel';

type TeachingGuide = {
  formula: string;
  concept: string;
  setup: string;
  units: string;
  check: string;
  caution: string;
};

// Match the saved subtopic AND relationship, never a current bank record by ID.
// These checks are independent of the particular numbers in a question.
const guides: Record<string, TeachingGuide> = {
  "Ohm's law": {
    formula: 'I = V/R',
    concept: 'For an ideal resistor, current is the applied voltage divided by resistance. At fixed voltage, more resistance means less current.',
    setup: 'Use the voltage across the resistor as V and its resistance as R; divide V by R.',
    units: 'Volts divided by ohms gives amperes. Convert kilo-ohms to ohms first, or remember that V/kohm gives mA.',
    check: 'Multiply your chosen current by the resistance. The product must reproduce the applied voltage, allowing for final rounding.',
    caution: 'Adding voltage and resistance cannot give a current: the units do not match.',
  },
  'Sinusoid to RMS phasor': {
    formula: 'Vrms = Vpeak/sqrt(2)',
    concept: 'For a sinusoidal voltage, the RMS magnitude is the peak amplitude divided by sqrt(2). The phase angle does not change that magnitude.',
    setup: 'Take the coefficient in front of the cosine as Vpeak, then divide by sqrt(2).',
    units: 'Peak and RMS voltage use the same voltage unit. sqrt(2) is dimensionless; the phase in degrees is not a voltage multiplier.',
    check: 'Multiply your RMS result by sqrt(2). It should recover the peak amplitude in the question.',
    caution: 'Keep sqrt(2) at calculator precision until the final rounding; the RMS magnitude should be smaller than the positive peak amplitude.',
  },
  'Thevenin to Norton': {
    formula: 'IN = Vth/Rth',
    concept: 'The Norton current is the short-circuit current of the Thevenin equivalent. Shorting the output leaves Vth across Rth.',
    setup: 'Divide the Thevenin voltage Vth by the Thevenin resistance Rth. The equivalent resistance stays the same.',
    units: 'Use volts and ohms to obtain amperes. Convert any resistance prefix before dividing.',
    check: 'Multiply the chosen Norton current by Rth. It should recover Vth, within final rounding.',
    caution: 'A current magnitude is nonnegative. Do not invert the ratio: resistance divided by voltage does not have current units.',
  },
  'RC time constant': {
    formula: 'tau = RC',
    concept: 'The time constant sets the response speed of this first-order RC circuit. Increasing either R or C increases the time constant.',
    setup: 'Multiply resistance by capacitance. This gives the time constant, not a frequency or a time to reach exactly full charge.',
    units: 'Convert R to ohms and C to farads to obtain seconds. Alternatively, kohm multiplied by microfarads gives milliseconds.',
    check: 'Divide your time constant in seconds by the resistance in ohms. It should recover the capacitance in farads.',
    caution: 'Keep track of both prefixes: kilo is 1000 and micro is 0.000001.',
  },
  'Coulomb force': {
    formula: 'F = k |q1 q2|/r^2',
    concept: 'Force magnitude is proportional to the product of the charge magnitudes and inversely proportional to the square of their separation.',
    setup: 'Multiply k by the absolute value of q1 times q2, then divide by r squared, using the stated value of k.',
    units: 'Convert each microcoulomb value to coulombs by multiplying by 0.000001. Use metres for r; the result is in newtons.',
    check: 'Multiply the chosen force by r squared. It should equal k times the absolute charge product, within rounding.',
    caution: 'Both charge conversions matter. Square the distance, and keep the force magnitude nonnegative.',
  },
  'Lossless characteristic impedance': {
    formula: 'Z0 = sqrt(L/C)',
    concept: 'For a lossless transmission line, characteristic impedance depends on the ratio of inductance to capacitance per unit length.',
    setup: 'Divide the per-unit-length inductance by the per-unit-length capacitance, then take the square root.',
    units: 'Use H/m and F/m before dividing: nano means 0.000000001 and pico means 0.000000000001. The per-metre factors cancel and sqrt(H/F) has units of ohms.',
    check: 'Square your chosen impedance and multiply by the per-unit-length capacitance. This should recover the per-unit-length inductance.',
    caution: 'Take the square root after division. This is characteristic impedance, not the DC resistance of the wire.',
  },
  'Three-phase real power': {
    formula: 'P = sqrt(3) VL IL pf',
    concept: 'With RMS line voltage and line current, balanced three-phase real power includes both the sqrt(3) factor and the power factor.',
    setup: 'Multiply sqrt(3), line-to-line voltage VL, line current IL, and power factor pf.',
    units: 'Volts times amperes times power factor gives watts; kV times A times power factor gives kW. Power factor is dimensionless.',
    check: 'Divide your chosen power by sqrt(3) times VL times IL, keeping units consistent. You should recover the stated power factor.',
    caution: 'The formula already accounts for all three phases when using line quantities; do not multiply by three again.',
  },
  'Transformer voltage ratio': {
    formula: 'Vs/Vp = Ns/Np',
    concept: 'In an ideal transformer, the secondary-to-primary voltage ratio equals the secondary-to-primary turns ratio.',
    setup: 'Divide secondary turns Ns by primary turns Np, then multiply that ratio by the primary voltage Vp.',
    units: 'The turns ratio is dimensionless. Use the same voltage convention and unit for primary and secondary.',
    check: 'Divide your secondary voltage by the primary voltage. Compare that ratio with Ns/Np.',
    caution: 'Fewer secondary turns means lower secondary voltage; more secondary turns means higher voltage.',
  },
  'Buck converter output': {
    formula: 'Vo = D Vin',
    concept: 'For the stated ideal buck converter in continuous conduction at steady state, average output voltage is the duty-cycle fraction of input voltage.',
    setup: 'Express duty cycle D as a fraction between 0 and 1, then multiply by Vin.',
    units: 'Duty cycle has no unit. Multiplying it by input voltage keeps the same voltage unit; 75 percent would be entered as 0.75.',
    check: 'Divide your chosen output voltage by Vin. It should reproduce the duty cycle D.',
    caution: 'For positive Vin and a duty cycle between 0 and 1, ideal buck output lies between zero and Vin.',
  },
  'Inverting op-amp gain': {
    formula: 'Av = -Rf/Rin',
    concept: 'The inverting stage reverses signal polarity. The resistor ratio sets the gain magnitude, and the minus sign records the inversion.',
    setup: 'Divide feedback resistance Rf by input resistance Rin, then apply the minus sign.',
    units: 'Put both resistances in the same unit so their units cancel. Voltage gain is dimensionless, often written V/V, not volts.',
    check: 'Multiply the gain magnitude by Rin. It should recover Rf, and the signed gain must be negative for positive resistances.',
    caution: 'The 1 + Rf/Rin expression belongs to a non-inverting amplifier, not this inverting configuration.',
  },
  'BJT collector current': {
    formula: 'IC = beta IB',
    concept: 'In the stated forward-active model, beta is the ratio of collector current to base current.',
    setup: 'Multiply the base current IB by beta to get collector current IC.',
    units: 'Beta is dimensionless. If IB is in microamperes, the product is in microamperes; divide by 1000 to express it in milliamperes.',
    check: 'Divide collector current by base current in the same unit. It should recover beta.',
    caution: 'This calculation uses the forward-active assumption. It does not describe a transistor in saturation.',
  },
  'Binary state count': {
    formula: 'states = 2^n',
    concept: 'Each independent bit has two possible values. Every additional bit doubles the number of distinct bit patterns.',
    setup: 'Multiply two by itself n times, or calculate 2 raised to n. This counts all patterns, including the all-zero pattern.',
    units: 'This result is an exact whole-number count of states. It has no electrical unit and needs no rounding.',
    check: 'Starting from one empty pattern, double the count once for each bit. Compare that count with your choice.',
    caution: 'The largest unsigned value is 2^n - 1, but the number of states is 2^n because zero is also a state.',
  },
  'Nyquist sampling': {
    formula: 'Nyquist rate = 2 fmax',
    concept: 'The question asks for the theoretical Nyquist rate: twice the highest frequency in this baseband signal. That boundary is different from a practical sampling-rate choice.',
    setup: 'Identify fmax and multiply it by two. Do not add a practical sampling margin to the requested theoretical rate.',
    units: 'Doubling a frequency keeps its unit. If fmax is in kHz, the theoretical rate is also in kHz.',
    check: 'Divide your chosen theoretical rate by two. It should recover the highest signal frequency.',
    caution: 'For general reconstruction, sample above the boundary. A sinusoid exactly at half the sample rate can lose amplitude and phase information.',
  },
  'Unity-feedback closed-loop gain': {
    formula: 'T(0) = K/(1 + K)',
    concept: 'Negative unity feedback subtracts the output from the reference. Solving output = K times (reference - output) gives the stated closed-loop gain.',
    setup: 'Calculate 1 + K first, then divide K by that entire denominator.',
    units: 'K and the closed-loop gain are dimensionless here. Keep full precision until the final result.',
    check: 'Multiply your chosen gain by (1 + K). It should recover K.',
    caution: 'For positive K, this closed-loop gain lies between zero and one. A minus sign in the denominator would describe positive feedback instead.',
  },
  'AM bandwidth': {
    formula: 'BWAM = 2 fm,max',
    concept: 'Conventional double-sideband AM has an upper and a lower sideband, each extending by the highest modulating frequency from the carrier.',
    setup: 'Add the two sideband widths: bandwidth = fm,max + fm,max.',
    units: 'The factor of two has no unit. A modulating frequency in kHz gives a bandwidth in kHz.',
    check: 'Divide your bandwidth by two. It should recover the highest modulating frequency.',
    caution: 'Use the modulating frequency, not the carrier frequency. The factor of two applies to the stated double-sideband AM.',
  },
  'ADC LSB size': {
    formula: 'LSB = Vref/2^N',
    concept: 'Under the stated ideal unipolar convention, the reference-voltage span is divided into 2^N quantization steps.',
    setup: 'Calculate 2 raised to the number of bits N, then divide Vref by that number.',
    units: 'Dividing volts by the number of steps gives volts per step. Multiply by 1000 to express the LSB size in millivolts.',
    check: 'Multiply the LSB size in volts by 2^N. It should recover Vref, within final rounding.',
    caution: 'Use 2^N as the denominator, as requested. 2^N - 1 is the highest unsigned code, not the number of quantization steps.',
  },
  'Trace propagation delay': {
    formula: 'tpd = length x delay_per_length',
    concept: 'One-way propagation delay adds along a uniform trace. Each unit of length contributes the stated delay per unit length.',
    setup: 'Multiply trace length by delay per unit length. The question asks for one trip along the trace.',
    units: 'Match the length unit to the delay-per-length unit. For inches multiplied by ps/in, the inches cancel and the result is in picoseconds.',
    check: 'Divide your chosen delay by trace length. It should recover the given delay per unit length.',
    caution: 'Do not double the result: a round-trip delay would describe a different journey.',
  },
  'UART bit time': {
    formula: 'tbit = 1/baud',
    concept: 'With one symbol per UART bit, baud rate gives bits per second. A single bit lasts the reciprocal of that rate.',
    setup: 'Divide one second by the baud rate to find the duration of one bit.',
    units: 'The reciprocal of baud gives seconds per symbol. For this UART, convert seconds per bit to microseconds by multiplying by 1000000.',
    check: 'Multiply your bit time in seconds by the baud rate. The result should be one.',
    caution: 'Bit time is not frame time. Start, data, parity, and stop bits each take their own bit intervals.',
  },
  'Free-space wavelength': {
    formula: 'lambda = c/f',
    concept: 'Wavelength is the distance a wave travels in one cycle. At fixed wave speed, higher frequency means shorter wavelength.',
    setup: 'Divide the stated free-space wave speed c by frequency f; use the approximation for c given in the question.',
    units: 'With speed in m/s and frequency in Hz, the result is in metres. Mm/s divided by MHz also gives metres because the mega factors cancel.',
    check: 'Multiply your wavelength by frequency in compatible units. The product should recover the stated wave speed.',
    caution: 'Use free-space speed for this question, not a lower propagation speed from a cable or PCB dielectric.',
  },
  'CT secondary current': {
    formula: 'Is = Ip x Is,rated/Ip,rated',
    concept: 'The ideal current transformer scales actual primary current by the rated secondary-to-primary current ratio.',
    setup: 'Multiply actual primary current by rated secondary current divided by rated primary current.',
    units: 'Put the two rated currents in the same unit so the ratio cancels. The output then has the same current unit as the actual primary current.',
    check: 'Multiply your chosen secondary current by rated primary current divided by rated secondary current. It should recover the actual primary current.',
    caution: 'Use the rated current ratio in the stated order, and keep the ideal, unsaturated assumption.',
  },
};

function normalizeFormula(formula: string) {
  return formula.replaceAll('\u221a2', 'sqrt(2)').replaceAll('\u221a3', 'sqrt(3)')
    .replaceAll('\u03c4', 'tau').replaceAll('\u03b2', 'beta').replaceAll('\u03bb', 'lambda')
    .replaceAll('\u00b2', '^2').replaceAll('\u00d7', 'x').replaceAll('\u2212', '-')
    .replace(/\s+/g, '');
}

export function getMistakeTeachingGuide(question: ReviewQuestion): TeachingGuide | null {
  const guide = Object.hasOwn(guides, question.subtopic) ? guides[question.subtopic] : null;
  return guide && normalizeFormula(question.formula ?? '') === normalizeFormula(guide.formula) ? guide : null;
}
