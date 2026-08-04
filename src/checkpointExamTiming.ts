type CheckpointTimingConfig = {
  length: number;
  timing: 'deep' | 'standard' | 'untimed';
};

export function getCheckpointDurationMinutes(config: CheckpointTimingConfig) {
  if (config.timing === 'untimed') {
    return 0;
  }

  const secondsPerQuestion = config.timing === 'deep' ? 120 : 90;
  return Math.ceil((config.length * secondsPerQuestion) / 60);
}
