import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ cacheDir: 'node_modules/.cache/mistake-explanation-tests', server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
after(() => server.close());
const { getMistakeAnswerLabel, getMistakeFeedback, getMistakeGuidance } = await server.ssrLoadModule('/src/mistakeExplanationModel.ts');
const { getMistakeTeachingGuide } = await server.ssrLoadModule('/src/mistakeTeachingGuides.ts');
const { getMistakeWorkedSteps } = await server.ssrLoadModule('/src/mistakeWorkedSteps.ts');
const { getMistakeQuickCheck, checkMistakeQuickAnswer } = await server.ssrLoadModule('/src/mistakeQuickChecks.ts');
const { lessonQuestions } = await server.ssrLoadModule('/src/data.ts');

const question = { id: 'original-question', prompt: 'Find current', options: ['1 A', '2 A', '3 A'],
  correctIndex: 0, formula: 'I = V/R', assumptions: 'Ideal resistor; DC steady state', solution: 'I = 8/8 = 1 A.' };

test('mistake explanation is offered only for a known incorrect choice', () => {
  assert.equal(getMistakeAnswerLabel(question, 1), 'B. 2 A');
  assert.equal(getMistakeAnswerLabel(question, 2), 'C. 3 A');
  for (const index of [0, null, undefined, -1, 3, 0.5, '1', NaN, Infinity]) {
    assert.equal(getMistakeAnswerLabel(question, index), null);
  }
  for (const correctIndex of [-1, 3, NaN, 0.5]) {
    assert.equal(getMistakeAnswerLabel({ ...question, correctIndex }, 1), null);
  }
});

test('guidance stays grounded in the given snapshot without diagnosing an unobserved cause', () => {
  const before = structuredClone(question);
  const concept = getMistakeGuidance(question, 'concept');
  assert.ok(concept.some((step) => step.includes(question.assumptions)));
  assert.ok(concept.some((step) => step.includes(question.formula)));
  assert.ok(getMistakeGuidance(question, 'formula')[0].includes(question.formula));
  assert.ok(getMistakeGuidance(question, 'units')[2].includes('1 A'));
  for (const focus of ['concept', 'formula', 'units', 'check']) {
    const guidance = getMistakeGuidance(question, focus);
    assert.equal(guidance.length, 3);
    assert.ok(guidance.every((step) => step.trim().length > 0));
    assert.doesNotMatch(guidance.join(' '), /you (forgot|confused|used the wrong|made)|undefined/i);
  }
  assert.deepEqual(question, before);
});

test('missing formula and assumption details use neutral guidance without invented math', () => {
  const legacy = { ...question, formula: '', assumptions: '' };
  for (const focus of ['concept', 'formula', 'units', 'check']) {
    assert.doesNotMatch(getMistakeGuidance(legacy, focus).join(' '), /undefined|I = V\/R|Ideal resistor/);
  }
});

test('archived explanations use their original choices and relationship after a bank update', () => {
  const archived = { ...question, options: ['Archived right', 'Archived choice'], formula: 'Original relationship' };
  assert.equal(getMistakeAnswerLabel(archived, 1), 'B. Archived choice');
  assert.ok(getMistakeGuidance(archived, 'formula').some((step) => step.includes('Original relationship')));
  assert.match(getMistakeGuidance(archived, 'check')[2], /Archived right/);
});

test('every shipped question has topic-specific teaching and all 100 distractors have choice-aware feedback', () => {
  assert.equal(lessonQuestions.length, 20);
  let wrongChoices = 0;
  const concepts = new Set();
  for (const q of lessonQuestions) {
    const before = structuredClone(q);
    assert.ok(getMistakeTeachingGuide(q), q.subtopic);
    const worked = getMistakeWorkedSteps(q);
    assert.equal(worked?.length, 3, q.subtopic);
    assert.equal(worked[2], q.solution, q.subtopic);
    assert.doesNotMatch(worked.join(' '), /undefined|\bNaN\b|Infinity/);
    concepts.add(getMistakeGuidance(q, 'concept')[0]);
    for (const focus of ['concept', 'formula', 'units', 'check']) {
      const steps = getMistakeGuidance(q, focus);
      assert.equal(steps.length, 3);
      assert.equal(new Set(steps).size, 3);
      assert.ok(steps.every((step) => step.length > 10 && step.length < 350), `${q.subtopic}: ${focus}`);
      assert.doesNotMatch(steps.join(' '), /undefined|\bNaN\b|you (forgot|confused|used the wrong|made)/i);
    }
    for (let i = 0; i < q.options.length; i++) {
      const feedback = getMistakeFeedback(q, i);
      if (i === q.correctIndex) { assert.equal(feedback, null); continue; }
      wrongChoices++;
      assert.ok(['value', 'sign'].includes(feedback.kind), `${q.subtopic}: ${q.options[i]}`);
      assert.ok(feedback.message.includes(q.options[i]));
      assert.ok(feedback.message.includes(q.options[q.correctIndex]));
      assert.doesNotMatch(feedback.message, /you (forgot|confused|used the wrong|made)|undefined|\bNaN\b/i);
    }
    assert.deepEqual(q, before);
  }
  assert.equal(wrongChoices, 100);
  assert.equal(concepts.size, 20);
});

test('intermediate calculations include the actual inputs and conversions, not just a repeated formula', () => {
  const steps = (subtopic) => getMistakeWorkedSteps(lessonQuestions.find((q) => q.subtopic === subtopic)).join(' ');
  assert.match(steps("Ohm's law"), /8 \/ 8 = 1 A.*1 A times 8 ohm gives 8 V/);
  assert.match(steps('RC time constant'), /7000 ohm.*0\.00003 F.*0\.21 s = 210 ms/);
  assert.match(steps('ADC LSB size'), /2\^12 = 4096.*10\/4096 = 0\.00244140625 V.*2\.44140625 mV/);
  assert.match(steps('Coulomb force'), /0\.000003 C.*0\.000004 C.*0\.04 m\^2.*2\.696265 N/);
  assert.match(steps('BJT collector current'), /90 times 20 uA = 1800 uA.*1\.8 mA/);
  assert.match(steps('CT secondary current'), /5\/400 = 0\.0125.*50 times \(5\/400\) = 0\.625 A/);
});

test('worked-step grammar rejects unfamiliar wording, inconsistent keys, unsupported units and nonphysical inputs', () => {
  const q = lessonQuestions[0];
  for (const changed of [
    { prompt: q.prompt + ' Use a different resistor.' }, { prompt: q.prompt.replace('8 V', '8 mV') },
    { prompt: q.prompt.replace('8 V', 'Infinity V') }, { prompt: q.prompt.replace('8 V', '-8 V') },
    { prompt: q.prompt.replace('8 V', '1e999 V') }, { prompt: q.prompt.replace('8 V', '1e-999 V') },
    { prompt: q.prompt.replace('8 V', '0 V') }, { solution: '' },
    { options: ['1 V', '2 V'], correctIndex: 0 }, { options: ['3 A', '4 A'], correctIndex: 0 },
    { formula: 'P = I^2 R' }, { subtopic: '__proto__' },
  ]) assert.equal(getMistakeWorkedSteps({ ...q, ...changed }), null, JSON.stringify(changed));
  const buck = lessonQuestions.find((q) => q.subtopic === 'Buck converter output');
  assert.equal(getMistakeWorkedSteps({ ...buck, prompt: buck.prompt.replace('D = 0.75', 'D = 1.25'), options: ['30 V', '18 V'], correctIndex: 0 }), null);
  const bits = lessonQuestions.find((q) => q.subtopic === 'Binary state count');
  assert.equal(getMistakeWorkedSteps({ ...bits, prompt: bits.prompt.replace('6 binary', '6.5 binary') }), null);
  const halfStep = { ...q, prompt: 'A 1 V source is applied across a 2 ohm resistor. What current flows?', options: ['1 A', '2 A'], correctIndex: 0 };
  assert.equal(getMistakeWorkedSteps(halfStep), null, 'Half-step rounding is left to the stored explanation');
});

test('recalculation handles changed numeric inputs without borrowing values from the current bank', () => {
  const q = { ...lessonQuestions[0], prompt: 'A 12 V source is applied across a 6 ohm resistor. What current flows?',
    options: ['2 A', '6 A'], correctIndex: 0, solution: 'I = 12/6 = 2 A.' };
  const steps = getMistakeWorkedSteps(q);
  assert.match(steps.join(' '), /12 \/ 6 = 2 A/);
  assert.doesNotMatch(steps.join(' '), /8 V|8 ohm|1 A/);
  assert.equal(steps[2], q.solution);
});

test('the worked answer for every shipped question agrees with an independent numerical calculation', () => {
  // Values are in each question's displayed output unit, not inferred from its answer key.
  const expected = [
    [8 / 8, 0, 'A'], [18 / Math.SQRT2, 2, 'V'], [26 / 6, 2, 'A'],
    [7000 * 30e-6 * 1000, 0, 'ms'], [8.98755e9 * 3e-6 * 4e-6 / 0.2 ** 2, 3, 'N'],
    [Math.sqrt(250e-9 / 100e-12), 0, '\u03a9'], [Math.sqrt(3) * 6 * 200 * 0.85, 1, 'kW'],
    [480 * 80 / 140, 2, 'V'], [24 * 0.75, 0, 'V'], [-9 / 3, 0, 'V/V'],
    [90 * 20e-6 * 1000, 1, 'mA'], [2 ** 6, 0, 'states'], [2 * 2, 0, 'kHz'],
    [3 / (1 + 3), 2, ''], [2 * 2, 0, 'kHz'], [10 / 2 ** 12 * 1000, 4, 'mV'],
    [4 * 170, 0, 'ps'], [1 / 115200 * 1e6, 3, '\u00b5s'], [300e6 / 200e6, 1, 'm'],
    [50 * 5 / 400, 3, 'A'],
  ];
  lessonQuestions.forEach((q, index) => {
    const [value, places, unit] = expected[index];
    const rounded = `${value.toFixed(places)}${unit ? ` ${unit}` : ''}`;
    assert.equal(q.options[q.correctIndex], rounded, q.subtopic);
    assert.ok(q.solution.includes(value.toFixed(places)), q.subtopic);
  });
});

test('sign, precision, and theoretical-rate explanations avoid false diagnoses', () => {
  const amplifier = lessonQuestions.find((q) => q.subtopic === 'Inverting op-amp gain');
  assert.match(getMistakeFeedback(amplifier, 1).message, /opposite sign.*negative gain.*polarity/);
  assert.match(getMistakeGuidance(amplifier, 'concept').join(' '), /inversion/);
  const adc = lessonQuestions.find((q) => q.subtopic === 'ADC LSB size');
  assert.match(getMistakeFeedback(adc, 1).message, /displayed precision/);
  assert.match(getMistakeGuidance(adc, 'check').join(' '), /2\^N - 1.*highest unsigned code/);
  const nyquist = lessonQuestions.find((q) => q.subtopic === 'Nyquist sampling');
  assert.match(getMistakeFeedback(nyquist, 0).message, /higher rate can be used.*theoretical boundary/);
  assert.match(getMistakeGuidance(nyquist, 'check').join(' '), /above the boundary/);
  const binary = lessonQuestions.find((q) => q.subtopic === 'Binary state count');
  assert.match(getMistakeGuidance(binary, 'check').join(' '), /exact count/);
  assert.doesNotMatch(getMistakeGuidance(binary, 'units').join(' '), /final rounding|keep extra digits/i);
});

test('scalar comparisons respect prefixes, negative values, equivalence, and incompatible units', () => {
  const compare = (correct, chosen) => getMistakeFeedback({ ...question, options: [correct, chosen] }, 1);
  for (const [correct, chosen] of [['1 A', '1000 mA'], ['1 \u00b5s', '0.001 ms'], ['-3 V/V', '\u22123'], ['1000 V', '1e3 V'], ['1 \u03a9', '1 ohm'], ['0 V', '-0 mV']]) {
    assert.equal(compare(correct, chosen).kind, 'equivalent', `${correct}, ${chosen}`);
    assert.match(compare(correct, chosen).message, /answer-choice issue/);
  }
  assert.match(compare('1 A', '2 mA').message, /less/);
  assert.match(compare('1 V', '2 MV').message, /greater/);
  assert.match(compare('-3 V/V', '-7 V/V').message, /less/);
  assert.equal(compare('1 A', '1 V').kind, 'units');
  assert.equal(compare('1 ms', '1 m').kind, 'units');
  assert.equal(compare('1 A', '-1 A').kind, 'sign');
  assert.equal(compare('0 V', '0.001 V').kind, 'value');
  assert.equal(compare('1.0000000001 V', '1 V').kind, 'value');
});

test('ambiguous expressions, phasors, missing reasoning, and malformed choices get honest fallbacks', () => {
  for (const chosen of ['2 + 3 V', '1 to 2 V', '1,000 A', '3 V at 90 degrees', '3 widgets', '1e999 V', '1e-999 V', '1e-320 ps', 'NaN', 'Infinity']) {
    const feedback = getMistakeFeedback({ ...question, options: ['1 A', chosen] }, 1);
    assert.equal(feedback.kind, 'choice', chosen);
    assert.doesNotMatch(feedback.message, /greater than|less than|opposite sign/);
  }
  const missing = { ...question, solution: '', explanation: '' };
  assert.match(getMistakeFeedback(missing, 1).message, /No worked reasoning was saved/);
  for (const option of [null, undefined, -1, 99, 0, 0.5, '1', NaN, Infinity]) assert.equal(getMistakeFeedback(question, option), null);
  const conceptual = { ...question, formula: '', options: ['Negative feedback', 'Positive feedback'] };
  assert.match(getMistakeGuidance(conceptual, 'units').join(' '), /non-numerical answer/);
  assert.doesNotMatch(getMistakeGuidance(conceptual, 'concept').join(' '), /I = V\/R/);
});

test('teaching uses snapshot relationships, not IDs or a broad topic, and remains valid with changed inputs', () => {
  const ohm = lessonQuestions[0];
  assert.equal(getMistakeTeachingGuide({ ...ohm, formula: 'P = I^2 R' }), null);
  assert.equal(getMistakeTeachingGuide({ ...ohm, subtopic: 'Voltage divider' }), null);
  assert.equal(getMistakeTeachingGuide({ ...ohm, subtopic: '__proto__' }), null);
  const changed = { ...ohm, prompt: '12 V across 6 ohms. Find current.', options: ['2 A', '6 A'], correctIndex: 0,
    solution: 'I = 12/6 = 2 A.' };
  const text = [getMistakeFeedback(changed, 1).message, ...getMistakeGuidance(changed, 'check')].join(' ');
  assert.match(text, /6 A.*2 A/);
  assert.doesNotMatch(text, /8 V|8 ohm|1 A|18 A/);
  assert.ok(getMistakeTeachingGuide({ ...ohm, id: 'archived-different-id' }));
});

test('all 20 quick checks have unique choices, hints and specific feedback for all 60 answers', () => {
  const prompts = new Set();
  let choices = 0;
  for (const q of lessonQuestions) {
    const before = structuredClone(q);
    const check = getMistakeQuickCheck(q);
    assert.ok(check, q.subtopic);
    prompts.add(check.prompt);
    assert.equal(check.options.length, 3, q.subtopic);
    assert.equal(new Set(check.options.map((option) => option.label)).size, 3);
    assert.equal(new Set(check.options.map((option) => option.feedback)).size, 3);
    assert.ok(Number.isInteger(check.correctIndex) && check.correctIndex >= 0 && check.correctIndex < 3);
    assert.ok(check.hint.length > 20);
    check.options.forEach((option, index) => {
      const result = checkMistakeQuickAnswer(check, index);
      assert.equal(result.correct, index === check.correctIndex);
      assert.equal(result.feedback, option.feedback);
      assert.ok(result.feedback.length > 25 && result.feedback.length < 250);
      assert.doesNotMatch(result.feedback, /undefined|\bNaN\b|you (forgot|confused|made)|try again$/i);
      choices++;
    });
    assert.deepEqual(q, before);
  }
  assert.equal(choices, 60);
  assert.equal(prompts.size, 20);
});

test('quick-check answer keys agree with independent arithmetic and stated physical relationships', () => {
  const expected = {
    "Ohm's law": 'It halves', // V/(2R) divided by V/R = 1/2.
    'Sinusoid to RMS phasor': 'It stays the same', // Phase does not affect full-cycle RMS.
    'Thevenin to Norton': `${10 / 5} A`,
    'RC time constant': `${2000 * 5e-6 * 1000} ms`,
    'Coulomb force': 'It becomes one quarter', // 1/(2r)^2 divided by 1/r^2 = 1/4.
    'Lossless characteristic impedance': 'It doubles', // sqrt(4L/C) = 2 sqrt(L/C).
    'Three-phase real power': 'It doubles', // 1/0.5 = 2 with fixed line voltage and current.
    'Transformer voltage ratio': `${12 * 0.5} V RMS`,
    'Buck converter output': `${12 * 25 / 100} V`,
    'Inverting op-amp gain': `${-10 / 10} V/V`,
    'BJT collector current': `${100 * 10e-6 * 1000} mA`,
    'Binary state count': `${2 ** 3} states`,
    'Nyquist sampling': `${2 * 3} kHz`,
    'Unity-feedback closed-loop gain': `${4 / (1 + 4)}`,
    'AM bandwidth': `${3 + 3} kHz`,
    'ADC LSB size': `${2.56 / 2 ** 8 * 1000} mV`,
    'Trace propagation delay': `${3 * 150} ps`,
    'UART bit time': `${1 / 100000 * 1e6} microseconds`,
    'Free-space wavelength': `${300e6 / 100e6} m`,
    'CT secondary current': `${40 * 5 / 200} A`,
  };
  for (const q of lessonQuestions) {
    const check = getMistakeQuickCheck(q);
    assert.equal(check.options[check.correctIndex].label, expected[q.subtopic], q.subtopic);
  }
});

test('quick checks decline unsupported relationships and missing reasoning without using a bank lookup', () => {
  const q = lessonQuestions[0];
  for (const changed of [{ subtopic: '__proto__' }, { subtopic: 'Unknown' }, { subtopic: undefined },
    { formula: '' }, { formula: 'P = I^2 R' }, { solution: ' ', explanation: '' }]) {
    assert.equal(getMistakeQuickCheck({ ...q, ...changed }), null);
  }
  const archived = { ...q, id: 'different-snapshot', prompt: '12 V across 6 ohm',
    solution: 'I = 12/6 = 2 A.', options: ['2 A', '6 A'], correctIndex: 0 };
  assert.deepEqual(getMistakeQuickCheck(archived), getMistakeQuickCheck(q));
  assert.doesNotMatch(JSON.stringify(getMistakeQuickCheck(archived)), /8 V|8 ohm|18 A|12 V|6 ohm/);
});

test('quick-check grading rejects invalid input and never mutates its exercise', () => {
  const check = getMistakeQuickCheck(lessonQuestions[0]);
  const before = structuredClone(check);
  for (const index of [null, undefined, -1, 3, 0.5, '1', NaN, Infinity]) {
    assert.equal(checkMistakeQuickAnswer(check, index), null);
  }
  for (const index of [0, 1, 2, 1, 1]) checkMistakeQuickAnswer(check, index);
  assert.deepEqual(check, before);
});

test('quick-check wording retains the assumptions needed for a unique answer', () => {
  const check = (subtopic) => getMistakeQuickCheck(lessonQuestions.find((q) => q.subtopic === subtopic));
  assert.match(check('Buck converter output').prompt, /ideal.*continuous conduction.*steady state/);
  assert.match(check('BJT collector current').prompt, /forward-active/);
  assert.match(check('ADC LSB size').prompt, /LSB = Vref\/2\^N/);
  assert.match(check('Nyquist sampling').options[2].feedback, /above the boundary.*can be/);
  assert.match(check('Nyquist sampling').options[1].feedback, /exceed this boundary/);
  assert.match(check('Three-phase real power').prompt, /balanced.*same RMS line voltage and line current/);
  assert.match(check('Trace propagation delay').prompt, /one-way/);
  assert.match(check('UART bit time').prompt, /one symbol per bit.*rather than a whole frame/);
});

test('large binary counts and maximum unsigned values remain exact in worked steps', () => {
  const q = lessonQuestions.find((q) => q.subtopic === 'Binary state count');
  for (const bits of [40, 52]) {
    const states = 2 ** bits;
    const changed = { ...q, prompt: `How many unique states can ${bits} binary bits represent?`,
      options: [`${states} states`, `${states - 1} states`], correctIndex: 0,
      solution: `${bits} bits represent exactly ${states} states.` };
    const steps = getMistakeWorkedSteps(changed);
    assert.ok(steps, `${bits} bits`);
    assert.ok(steps[1].includes(String(states)), steps[1]);
    assert.ok(steps[1].includes(String(states - 1)), steps[1]);
    for (const wrong of [`${states - 1} states`, `${states}.1 states`]) {
      assert.equal(getMistakeWorkedSteps({ ...changed, options: [wrong, `${states} states`] }), null);
    }
  }
});
