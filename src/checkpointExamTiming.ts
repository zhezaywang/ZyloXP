type CheckpointTimingConfig = {
  length: number;
  timing: 'deep' | 'standard' | 'untimed';
};

export function canAnswerCheckpoint(exam: { completedAt: number | null; expiresAt: number | null } | null, now = Date.now()) {
  return exam !== null && exam.completedAt === null &&
    (exam.expiresAt === null || now < exam.expiresAt);
}

export function getCheckpointDurationMinutes(config: CheckpointTimingConfig) {
  if (config.timing === 'untimed') {
    return 0;
  }

  const secondsPerQuestion = config.timing === 'deep' ? 120 : 90;
  return Math.ceil((config.length * secondsPerQuestion) / 60);
}
