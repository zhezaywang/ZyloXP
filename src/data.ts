import {
  BookOpen,
  Briefcase,
  Cpu,
  Database,
  FlaskConical,
  Flame,
  Gauge,
  GraduationCap,
  LucideIcon,
  Radio,
  Route,
  Trophy,
  Waves,
  Zap,
} from 'lucide-react';

export type AppSection = 'learn' | 'practice' | 'labs' | 'careers' | 'bank';

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
  prompt: string;
  diagram: string;
  difficulty: number;
  xp: number;
  options: string[];
  correctIndex: number;
  explanation: string;
  careerContext: string;
};

export type LabScenario = {
  id: string;
  title: string;
  topic: string;
  diagram: string;
  metric: string;
  result: string;
  status: string;
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

export const navigation: NavItem[] = [
  { id: 'learn', label: 'Learn', icon: Route },
  { id: 'practice', label: 'Practice', icon: BookOpen },
  { id: 'labs', label: 'Labs', icon: FlaskConical },
  { id: 'careers', label: 'Careers', icon: Briefcase },
  { id: 'bank', label: 'Question Bank', icon: Database },
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
    note: 'EE foundations',
    icon: Flame,
    accent: 'amber',
  },
  {
    label: 'Question Bank',
    value: '5,000',
    note: '20 EE topics',
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
    questionCount: 250,
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
    questionCount: 250,
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
    questionCount: 250,
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
    questionCount: 250,
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
    questionCount: 250,
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
    questionCount: 250,
    careerSignal: 'FPGA, firmware, VLSI',
    icon: Cpu,
  },
];

export const lessonQuestion: LessonQuestion = {
  id: 'EE-0001',
  topic: "Ohm's Law",
  prompt: 'A 1 V source is applied across a 2 ohm resistor. What current flows?',
  diagram: '/diagrams/ohms-law.svg',
  difficulty: 2,
  xp: 12,
  options: ['0.25 A', '0.50 A', '1.00 A', '1.50 A', '2.00 A', '4.00 A'],
  correctIndex: 1,
  explanation: 'I = V / R, so 1 V divided by 2 ohms equals 0.50 A.',
  careerContext:
    'This is the same quick sizing check used when choosing resistors for sensor boards and pull-up networks.',
};

export const labScenarios: LabScenario[] = [
  {
    id: 'lab-ohms',
    title: "Ohm's Law Bench",
    topic: 'Voltage, Current, Resistance',
    diagram: '/diagrams/ohms-law.svg',
    metric: 'Live current',
    result: 'V / R',
    status: 'Ready',
  },
  {
    id: 'lab-rc',
    title: 'RC Timing Lab',
    topic: 'Capacitors and Inductors',
    diagram: '/diagrams/rc-time-constant.svg',
    metric: 'Time constant',
    result: 'R x C',
    status: 'Queued',
  },
  {
    id: 'lab-power',
    title: 'Three-Phase Power',
    topic: 'Power Systems',
    diagram: '/diagrams/three-phase-power.svg',
    metric: 'Real power',
    result: 'sqrt(3) V I pf',
    status: 'Queued',
  },
];

export const careerTracks: CareerTrack[] = [
  {
    role: 'Embedded Systems Engineer',
    match: 86,
    focus: 'Turns circuit fundamentals into firmware decisions and board-level debugging.',
    skills: ['Ohm checks', 'Digital logic', 'Sensor interfaces'],
    nextStep: 'Finish Unit 1 and unlock GPIO timing drills.',
  },
  {
    role: 'Electronics Design Engineer',
    match: 78,
    focus: 'Uses schematics, component sizing, and lab measurements to ship hardware.',
    skills: ['Circuit reading', 'DC analysis', 'Transient response'],
    nextStep: 'Complete circuit-reading lessons and the RC Timing Lab.',
  },
  {
    role: 'Power Systems Engineer',
    match: 64,
    focus: 'Models loads, protection, and energy movement across larger systems.',
    skills: ['AC phasors', 'Three-phase power', 'Protection logic'],
    nextStep: 'Reach Unit 5 to unlock phasor practice.',
  },
];

export const bankSignals: BankSignal[] = [
  {
    label: 'Master rows',
    value: '5,000',
    detail: 'Multiple choice, six options per question',
  },
  {
    label: 'Topics',
    value: '20',
    detail: '250 questions per electrical engineering topic',
  },
  {
    label: 'Difficulty',
    value: '1-10',
    detail: 'Easy fundamentals through advanced review',
  },
  {
    label: 'Diagram assets',
    value: '250',
    detail: 'SVG circuit and concept images cross-referenced by ID',
  },
];
