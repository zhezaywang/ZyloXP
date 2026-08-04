export type MistakeCause =
  | 'concept'
  | 'diagram'
  | 'formula'
  | 'rushed'
  | 'units';

export type MistakeReflection = {
  cause: MistakeCause;
  note: string;
  updatedAt: number;
};

export type MistakeLabItem = {
  accuracy: number;
  attempts: number;
  difficultyLabel: string;
  formula: string;
  id: string;
  lastAnsweredAt: number;
  mistakes: number;
  prompt: string;
  questionIndex: number;
  recovered: boolean;
  subtopic: string;
  topic: string;
};

export const MISTAKE_CAUSE_IDS: MistakeCause[] = [
  'concept',
  'formula',
  'units',
  'diagram',
  'rushed',
];
