import {
  Atom,
  BookOpen,
  Briefcase,
  Cpu,
  Database,
  FlaskConical,
  Flame,
  Gauge,
  GraduationCap,
  LucideIcon,
  NotebookTabs,
  Radio,
  Route,
  Trophy,
  Waves,
  Zap,
} from 'lucide-react';
import {
  generatedBankSignals,
  generatedBankSummary,
  generatedLessonQuestions,
  generatedTopicSignals,
} from './questionBank.generated';

export type AppSection =
  | 'learn'
  | 'practice'
  | 'labs'
  | 'atlas'
  | 'careers'
  | 'bank'
  | 'notebook';
export type QuestionVisualKind =
  | 'battery'
  | 'chip'
  | 'field'
  | 'instrument'
  | 'power'
  | 'scope';

export type NavItem = {
  id: AppSection;
  label: string;
  icon: LucideIcon;
};

export type Stat = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  accent: 'lime' | 'cyan' | 'amber' | 'coral';
};

export type SkillNode = {
  id: string;
  title: string;
  unit: string;
  status: 'Current' | 'Unlocked' | 'Locked';
  progress: number;
  difficulty: number;
  lessons: number;
  questionCount: number;
  careerSignal: string;
  icon: LucideIcon;
};

export type LessonQuestion = {
  id: string;
  topic: string;
  subtopic: string;
  prompt: string;
  diagram: string;
  diagramAlt: string;
  difficulty: number;
  difficultyLabel: string;
  xp: number;
  options: string[];
  correctIndex: number;
  explanation: string;
  careerContext: string;
  imageRole: string;
  verificationStatus: string;
  verificationMethod: string;
  factCheckedAt: string;
  contentVersion: string;
  difficultyCalibration: string;
  roundingPolicy: string;
  solution: string;
  formula: string;
  assumptions: string;
  visualKind: QuestionVisualKind;
  visualLabel: string;
  visualValues: string[];
};

export type LabScenario = {
  id: string;
  title: string;
  topic: string;
  diagram: string;
  metric: string;
  result: string;
  status: string;
  assumptions: string;
  formula: string;
  visualLabel: string;
};

export type CareerTrack = {
  role: string;
  match: number;
  focus: string;
  skills: string[];
  nextStep: string;
};

export type BankSignal = {
  label: string;
  value: string;
  detail: string;
};

export type TopicSignal = {
  id: string;
  topic: string;
  questions: number;
  imageCount: number;
  minLevel: number;
  maxLevel: number;
};

export const navigation: NavItem[] = [
  { id: 'learn', label: 'Learn', icon: Route },
  { id: 'practice', label: 'Practice', icon: BookOpen },
  { id: 'labs', label: 'Labs', icon: FlaskConical },
  { id: 'atlas', label: 'EE Atlas', icon: Atom },
  { id: 'careers', label: 'Careers', icon: Briefcase },
  { id: 'bank', label: 'Question Bank', icon: Database },
  { id: 'notebook', label: 'Notebook', icon: NotebookTabs },
];

export const stats: Stat[] = [
  {
    label: 'XP',
    value: '1,240',
    note: '+120 today',
    icon: Trophy,
    accent: 'lime',
  },
  {
    label: 'Streak',
    value: '5 days',
    note: 'Core foundations',
    icon: Flame,
    accent: 'amber',
  },
  {
    label: 'Question Bank',
    value: '250K',
    note: `${generatedBankSummary.topicCount} topics / ${generatedBankSummary.levels} levels`,
    icon: Database,
    accent: 'cyan',
  },
  {
    label: 'Career Signal',
    value: 'Embedded',
    note: 'Best current match',
    icon: GraduationCap,
    accent: 'coral',
  },
];

export const skillNodes: SkillNode[] = [
  {
    id: 'voltage-current-resistance',
    title: 'Voltage, Current, Resistance',
    unit: 'Unit 1',
    status: 'Current',
    progress: 72,
    difficulty: 2,
    lessons: 8,
    questionCount: generatedBankSummary.questionsPerTopic,
    careerSignal: 'Embedded systems, hardware debug',
    icon: Zap,
  },
  {
    id: 'circuit-reading',
    title: 'Circuit Reading',
    unit: 'Unit 2',
    status: 'Unlocked',
    progress: 38,
    difficulty: 3,
    lessons: 7,
    questionCount: generatedBankSummary.questionsPerTopic,
    careerSignal: 'Electronics design, test engineering',
    icon: Cpu,
  },
  {
    id: 'dc-analysis',
    title: 'DC Circuit Analysis',
    unit: 'Unit 3',
    status: 'Unlocked',
    progress: 24,
    difficulty: 4,
    lessons: 10,
    questionCount: generatedBankSummary.questionsPerTopic,
    careerSignal: 'Power electronics, board bring-up',
    icon: Gauge,
  },
  {
    id: 'transients',
    title: 'Capacitors and Inductors',
    unit: 'Unit 4',
    status: 'Unlocked',
    progress: 11,
    difficulty: 5,
    lessons: 9,
    questionCount: generatedBankSummary.questionsPerTopic,
    careerSignal: 'Signal integrity, analog systems',
    icon: Waves,
  },
  {
    id: 'signals-ac',
    title: 'Signals and AC',
    unit: 'Unit 5',
    status: 'Locked',
    progress: 0,
    difficulty: 6,
    lessons: 11,
    questionCount: generatedBankSummary.questionsPerTopic,
    careerSignal: 'RF, communications, controls',
    icon: Radio,
  },
  {
    id: 'digital-logic',
    title: 'Digital Logic',
    unit: 'Unit 6',
    status: 'Locked',
    progress: 0,
    difficulty: 4,
    lessons: 8,
    questionCount: generatedBankSummary.questionsPerTopic,
    careerSignal: 'FPGA, firmware, VLSI',
    icon: Cpu,
  },
];

export const bankSummary = generatedBankSummary;

const questionVisuals: Record<string, { kind: QuestionVisualKind; label: string }> = {
  'DC Circuit Analysis': { kind: 'battery', label: 'Series DC measurement loop' },
  'AC Phasors and Impedance': { kind: 'scope', label: 'Time-domain and RMS phasor' },
  'Network Theorems and Two-Port Networks': { kind: 'battery', label: 'Thevenin–Norton equivalents' },
  'Transient Circuit Analysis': { kind: 'battery', label: 'First-order RC charge circuit' },
  Electromagnetics: { kind: 'field', label: 'Point-charge force geometry' },
  'Transmission Lines': { kind: 'field', label: 'Distributed LC line model' },
  'Power Systems': { kind: 'power', label: 'Balanced three-phase load' },
  'Transformers and Electrical Machines': { kind: 'power', label: 'Ideal transformer and load' },
  'Power Electronics': { kind: 'power', label: 'Buck converter power stage' },
  'Analog Electronics and Op-Amps': { kind: 'chip', label: 'Inverting op-amp topology' },
  'Semiconductor Devices': { kind: 'chip', label: 'Forward-active NPN circuit' },
  'Digital Logic': { kind: 'chip', label: 'Binary state register' },
  'Signals and Systems': { kind: 'scope', label: 'Baseband sampling model' },
  'Control Systems': { kind: 'scope', label: 'Negative unity-feedback loop' },
  Communications: { kind: 'scope', label: 'AM envelope and spectrum' },
  'Measurement and Instrumentation': { kind: 'instrument', label: 'Ideal unipolar ADC' },
  'PCB Design and Signal Integrity': { kind: 'chip', label: 'Trace over reference plane' },
  'Embedded Systems': { kind: 'chip', label: 'UART frame timing' },
  'RF and Antennas': { kind: 'field', label: 'Free-space wavelength' },
  'Electrical Safety and Protection': { kind: 'instrument', label: 'CT and protective relay loop' },
};

function broadenQuestionCopy(value: string) {
  return value
    .replace(/Electrical engineers/g, 'Engineers')
    .replace(/electrical engineers/g, 'engineers')
    .replace(/Electrical engineering/g, 'Technical')
    .replace(/electrical engineering/g, 'technical')
    .replace(/\bEE\b/g, 'technical');
}

function formatEngineeringNotation(value: string) {
  return value
    .replace(/\bsqrt\(2\)/gi, '√2')
    .replace(/\bsqrt\(3\)/gi, '√3')
    .replace(/\bkohm\b/gi, 'kΩ')
    .replace(/\bohm\b/gi, 'Ω')
    .replace(/\buF\b/g, 'µF')
    .replace(/\buA\b/g, 'µA')
    .replace(/\buC\b/g, 'µC')
    .replace(/\bus\b/g, 'µs')
    .replace(/\bomega\b/gi, 'ω')
    .replace(/\blambda\b/gi, 'λ')
    .replace(/\btau\b/gi, 'τ')
    .replace(/\bbeta\b/gi, 'β')
    .replace(/\bdeg\b/gi, '°')
    .replace(/\bapprox\b/gi, '≈')
    .replace(/>=/g, '≥')
    .replace(/<=/g, '≤')
    .replace(/\bm\^2\b/g, 'm²')
    .replace(/\bC\^2\b/g, 'C²')
    .replace(/\br\^2\b/g, 'r²')
    .replace(/\s+\*\s+/g, ' × ')
    .replace(/\s+x\s+/g, ' × ');
}

function polishQuestionCopy(value: string) {
  return formatEngineeringNotation(
    broadenQuestionCopy(value)
      .replace(/\bA 8\b/g, 'An 8')
      .replace(/\ba 8\b/g, 'an 8'),
  );
}

function getExplanationParts(explanation: string) {
  const [solution = explanation, detail = ''] = explanation.split('Governing relation:');
  const [formula = '', assumptionDetail = ''] = detail.split('Assumptions:');
  const [assumptions = 'Standard ideal conditions.'] = assumptionDetail.split(
    'Result is rounded to the precision shown in the choices.',
  );

  return {
    assumptions: formatEngineeringNotation(assumptions.trim().replace(/\.$/, '')),
    formula: formatEngineeringNotation(formula.trim().replace(/\.$/, '')),
    solution: formatEngineeringNotation(solution.trim()),
  };
}

function getVisualValues(prompt: string) {
  const formattedPrompt = formatEngineeringNotation(prompt);
  const matches =
    formattedPrompt.match(
      /(?:(?:power factor|[A-Za-zβλτ][A-Za-z0-9',]*)\s*=\s*)?-?\d+(?:\.\d+)?(?:e[+-]?\d+)?(?:\s*:\s*\d+(?:\.\d+)?)?\s*(?:nH\/m|pF\/m|ps\/in|kΩ|MΩ|Ω|kV|mV|V\/V|V|kA|mA|µA|A|kW|mW|W|MHz|kHz|Hz|µF|nF|pF|mH|H|ms|µs|ns|ps|µC|C|Mm\/s|m|N|baud|binary bits?|bits?|inch|%|°)(?![A-Za-z])|\bpower factor\s+(?:of\s+)?\d+(?:\.\d+)?|\b\d+\s*:\s*\d+\b|\b\d+-bit\b|(?:\b(?:power factor|[A-Za-z][A-Za-z0-9',]*)|[βλτ])\s*=\s*-?\d+(?:\.\d+)?/g,
    ) ?? [];

  return [...new Set(matches.map((match) => match.replace(/\s+/g, ' ').trim()))].slice(0, 4);
}

export const lessonQuestions: LessonQuestion[] = generatedLessonQuestions.map((question) => {
  const explanation = polishQuestionCopy(question.explanation);
  const explanationParts = getExplanationParts(explanation);
  const visual = questionVisuals[question.topic] ?? {
    kind: 'instrument' as const,
    label: 'Engineering concept bench',
  };

  return {
    id: question.id,
    topic: broadenQuestionCopy(question.topic),
    subtopic: broadenQuestionCopy(question.subtopic),
    prompt: polishQuestionCopy(question.prompt),
    diagram: question.diagram,
    diagramAlt: question.diagramAlt,
    difficulty: question.difficulty,
    difficultyLabel: question.difficultyLabel,
    xp: question.xp,
    options: question.options.map((option) => formatEngineeringNotation(option)),
    correctIndex: question.correctIndex,
    explanation,
    careerContext: broadenQuestionCopy(question.careerContext),
    imageRole: question.imageRole,
    verificationStatus: question.verificationStatus,
    verificationMethod: question.verificationMethod,
    factCheckedAt: question.factCheckedAt,
    contentVersion: question.contentVersion,
    difficultyCalibration: question.difficultyCalibration,
    roundingPolicy: question.roundingPolicy,
    ...explanationParts,
    visualKind: visual.kind,
    visualLabel: visual.label,
    visualValues: getVisualValues(question.prompt),
  };
});

export const lessonQuestion = lessonQuestions[0];

export const labScenarios: LabScenario[] = [
  {
    id: 'lab-ohms',
    title: "Ohm's Law Bench",
    topic: 'Voltage, Current, Resistance',
    diagram: '/question-bank/images/IMG-0001.svg',
    metric: 'Live current',
    result: 'I = V / R',
    status: 'Ready',
    assumptions: 'Ideal DC source and ammeter; resistor at steady state.',
    formula: 'I = V / R',
    visualLabel: 'Series ammeter and resistor load',
  },
  {
    id: 'lab-rc',
    title: 'RC Timing Lab',
    topic: 'Capacitors and Inductors',
    diagram: '/question-bank/images/IMG-1876.svg',
    metric: 'Time constant',
    result: 'τ = RC',
    status: 'Ready',
    assumptions: 'Ideal first-order RC circuit driven by a voltage step.',
    formula: 'τ = RC',
    visualLabel: 'RC circuit and oscilloscope response',
  },
  {
    id: 'lab-resonance',
    title: 'RLC Resonance and Network Analyzer',
    topic: 'AC Phasors and Impedance',
    diagram: '/lab-resonance-reference.svg',
    metric: 'Resonant frequency',
    result: 'f₀ = 1 / (2π√LC)',
    status: 'Ready',
    assumptions:
      'Ideal sinusoidal series RLC network with lumped components; the series resistance includes winding, source, and fixture loss.',
    formula: 'f₀ = 1/(2π√LC) · Q = (1/R)√(L/C) · BW = f₀/Q',
    visualLabel: 'Series RLC fixture and swept-frequency network analyzer',
  },
  {
    id: 'lab-filter',
    title: 'Low-Pass Filter Bench',
    topic: 'Signals and Systems',
    diagram: '/lab-low-pass-reference.svg',
    metric: 'Output RMS',
    result: 'VOUT = VIN |H(jω)|',
    status: 'Ready',
    assumptions:
      'Ideal first-order passive RC low-pass filter driven by a 5 V RMS sinusoidal source.',
    formula: '|H(jω)| = 1 / √(1 + (f/fc)²)',
    visualLabel: 'RC low-pass filter and dual-channel oscilloscope',
  },
  {
    id: 'lab-digital',
    title: 'Digital Timing Bench',
    topic: 'Digital Logic',
    diagram: '/lab-digital-timing-reference.svg',
    metric: 'Setup margin',
    result: 'tmargin = TCLK - tPD - tSU',
    status: 'Ready',
    assumptions:
      'Single-clock synchronous path with negligible clock skew and a stable receiver hold requirement.',
    formula: 'tmargin = TCLK - tPD - tSU',
    visualLabel: 'Flip-flop timing path and four-channel logic analyzer',
  },
  {
    id: 'lab-adc',
    title: 'ADC Sampling Bench',
    topic: 'Measurement and Instrumentation',
    diagram: '/lab-adc-reference.svg',
    metric: 'Displayed frequency',
    result: 'fDISPLAY = |fIN - kfS|',
    status: 'Ready',
    assumptions:
      'Ideal sinusoidal source, first-order anti-alias filter, uniform sampling, an unipolar ADC centered at midscale, and ideal digital reconstruction.',
    formula: 'fN = fS / 2 · ΔV = VREF / 2ᴺ',
    visualLabel:
      'Signal source, anti-alias filter, ADC, and mixed-domain analyzer',
  },
  {
    id: 'lab-opamp',
    title: 'Op-Amp Signal Bench',
    topic: 'Analog Electronics and Op-Amps',
    diagram: '/lab-opamp-reference.svg',
    metric: 'Output amplitude',
    result: 'VOUT = -(Rf / Rin) VIN',
    status: 'Ready',
    assumptions:
      'Ideal inverting closed-loop gain with a practical non-rail-to-rail output limited to approximately 1.5 V from each supply rail.',
    formula: 'VOUT = -(Rf / Rin) VIN',
    visualLabel: 'Inverting amplifier and dual-channel oscilloscope',
  },
  {
    id: 'lab-bjt',
    title: 'BJT Bias and Curve Tracer',
    topic: 'Semiconductor Devices',
    diagram: '/lab-bjt-reference.svg',
    metric: 'Collector current',
    result: 'IC ≈ βIB, limited by the collector load line',
    status: 'Ready',
    assumptions:
      'Silicon NPN common-emitter stage with a 0.18 V saturation voltage, resistive collector load, temperature-dependent current gain, and a 150 °C/W junction-to-ambient thermal path.',
    formula: 'IC ≈ βIB · VCE = VCC - ICRC · IC ≤ (VCC - VCE(sat))/RC',
    visualLabel:
      'NPN bias fixture, collector load, and semiconductor curve tracer',
  },
  {
    id: 'lab-mosfet',
    title: 'MOSFET Switching Bench',
    topic: 'Power Electronics',
    diagram: '/lab-mosfet-reference.svg',
    metric: 'Device loss',
    result: 'PLOSS = PCOND + PSW + PGATE',
    status: 'Ready',
    assumptions:
      'Low-side N-channel MOSFET with a resistive-equivalent load, 35 nC total gate charge, 15 nC transition charge, and 22 °C/W thermal path.',
    formula: 'PLOSS ≈ ID²RDS(on)D + VDS ID tsw fs + QG VGS fs',
    visualLabel: 'Low-side MOSFET, gate driver, load, and switching oscilloscope',
  },
  {
    id: 'lab-transmission',
    title: 'Transmission Line Bench',
    topic: 'Transmission Lines',
    diagram: '/lab-transmission-reference.svg',
    metric: 'Live VSWR',
    result: 'Γ = (ZL - Z0) / (ZL + Z0)',
    status: 'Ready',
    assumptions:
      'Lossless line with resistive source and load, a 1 V incident wave, and one-way electrical length.',
    formula: 'Γ = (ZL - Z0) / (ZL + Z0)',
    visualLabel: 'Coaxial line, termination load, and vector network analyzer',
  },
  {
    id: 'lab-pid',
    title: 'PID Servo Bench',
    topic: 'Control Systems',
    diagram: '/lab-pid-reference.svg',
    metric: 'Settling time',
    result: 'ts ≈ 4 / (ζωn)',
    status: 'Ready',
    assumptions:
      'Normalized second-order servo plant with bounded actuator effort, ideal position feedback, and a unit-step command.',
    formula: 'u(t) = Kp e(t) + Ki ∫e(t)dt + Kd de(t)/dt',
    visualLabel: 'PID controller, servo plant, encoder, and response analyzer',
  },
  {
    id: 'lab-transformer',
    title: 'Transformer and Magnetic Core Bench',
    topic: 'Transformers and Electrical Machines',
    diagram: '/lab-transformer-reference.svg',
    metric: 'Loaded secondary voltage',
    result: 'V₂ ≈ V₁(N₂/N₁) - I₂Req',
    status: 'Ready',
    assumptions:
      'Single-phase sinusoidal excitation, an ideal turns ratio with secondary-referred winding resistance, a resistive load, and a laminated core with a 1.45 T saturation threshold.',
    formula: 'V₂/V₁ = N₂/N₁ · BMAX = V₁/(4.44 f N₁ Ae)',
    visualLabel:
      'AC source, laminated-core transformer, load bank, and power analyzer',
  },
  {
    id: 'lab-power',
    title: 'Three-Phase Power',
    topic: 'Power Systems',
    diagram: '/question-bank/images/IMG-3751.svg',
    metric: 'Real power',
    result: 'P = √3 VLL IL pf',
    status: 'Ready',
    assumptions: 'Balanced sinusoidal load using RMS line quantities and lagging power factor.',
    formula: 'P = √3 VLL IL pf',
    visualLabel: 'Three-phase load and power analyzer',
  },
];

export const careerTracks: CareerTrack[] = [
  {
    role: 'Embedded Systems Engineer',
    match: 86,
    focus: 'Turns circuit fundamentals into firmware decisions and board-level debugging.',
    skills: ['Ohm checks', 'Digital logic', 'Sensor interfaces'],
    nextStep: 'Open the Digital Timing Bench and verify a GPIO capture margin.',
  },
  {
    role: 'Electronics Design Engineer',
    match: 78,
    focus: 'Uses schematics, component sizing, and lab measurements to ship hardware.',
    skills: ['Circuit reading', 'Analog gain', 'Transient response'],
    nextStep: 'Open the Op-Amp Signal Bench and verify output headroom.',
  },
  {
    role: 'Power Systems Engineer',
    match: 64,
    focus: 'Models loads, protection, and energy movement across larger systems.',
    skills: ['AC phasors', 'Three-phase power', 'Protection logic'],
    nextStep: 'Reach Unit 5 to unlock phasor practice.',
  },
  {
    role: 'Power Electronics Engineer',
    match: 69,
    focus:
      'Turns semiconductor behavior, gate-drive timing, and thermal limits into reliable switching power stages.',
    skills: ['Semiconductor switching', 'Gate-drive design', 'Thermal verification'],
    nextStep:
      'Open the MOSFET Switching Bench and keep the device below its loss budget.',
  },
  {
    role: 'RF Systems Engineer',
    match: 72,
    focus:
      'Designs impedance-controlled links, RF front ends, and measurement plans that preserve signal integrity.',
    skills: ['Transmission lines', 'Impedance matching', 'RF measurements'],
    nextStep:
      'Open the Transmission Line Bench and reduce the link reflection below 1.22 VSWR.',
  },
  {
    role: 'Controls Engineer',
    match: 67,
    focus:
      'Turns plant dynamics, feedback, and measured response into stable automation and motion systems.',
    skills: ['Feedback stability', 'PID tuning', 'Acceptance testing'],
    nextStep:
      'Open the PID Servo Bench and tune the loop for a fast, well-damped step response.',
  },
  {
    role: 'Instrumentation Engineer',
    match: 74,
    focus:
      'Turns sensors, signal conditioning, conversion limits, and calibration evidence into trustworthy measurements.',
    skills: ['Data acquisition', 'Anti-alias filtering', 'Calibration'],
    nextStep:
      'Open the ADC Sampling Bench and prove that the displayed spectrum represents the analog input.',
  },
  {
    role: 'Electrical Machines Engineer',
    match: 70,
    focus:
      'Turns magnetic circuits, winding ratios, losses, and thermal limits into reliable transformers, motors, and generators.',
    skills: ['Magnetic circuits', 'Machine commissioning', 'Thermal verification'],
    nextStep:
      'Open the Transformer and Magnetic Core Bench and commission a loaded control supply without saturating the core.',
  },
];

export const bankSignals: BankSignal[] = generatedBankSignals.map((signal) => ({ ...signal }));

export const topicSignals: TopicSignal[] = generatedTopicSignals.map((signal) => ({ ...signal }));
