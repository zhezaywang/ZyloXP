export function plotPath(sample: (progress: number) => number, x: number, width: number, samples = 160) {
  return Array.from({ length: samples + 1 }, (_, index) => {
    const progress = index / samples;
    return `${index ? 'L' : 'M'}${(x + progress * width).toFixed(3)} ${sample(progress).toFixed(3)}`;
  }).join(' ');
}

export function phasorPoint(x: number, y: number, radius: number, degrees: number) {
  const angle = degrees * Math.PI / 180;
  return { x: x + radius * Math.cos(angle), y: y - radius * Math.sin(angle) };
}

// Both the curve and the one-time-constant guide use a 0..5 tau time axis.
export function rcChargePlot(x: number, baseline: number, width: number, height: number) {
  return {
    path: plotPath((t) => baseline - height * (1 - Math.exp(-5 * t)), x, width),
    tauX: x + width / 5,
    tauY: baseline - height * (1 - Math.exp(-1)),
  };
}

export function amWaveform(progress: number, modulation = 0.5) {
  const envelope = 1 + modulation * Math.cos(2 * Math.PI * progress);
  return { envelope, carrier: envelope * Math.cos(32 * Math.PI * progress) };
}

// Frequency and sample rate use the reciprocal unit of duration (e.g. kHz and ms).
export function sampleSineWave({ frequency, sampleRate, duration, x, y, width, amplitude }: {
  frequency: number; sampleRate: number; duration: number;
  x: number; y: number; width: number; amplitude: number;
}) {
  return Array.from({ length: Math.floor(sampleRate * duration) + 1 }, (_, index) => {
    const time = index / sampleRate;
    return {
      time,
      x: x + time / duration * width,
      y: y - amplitude * Math.sin(2 * Math.PI * frequency * time),
    };
  });
}

export function secondOrderStep(time: number, damping: number, naturalFrequency: number) {
  const t = Math.max(0, time) * naturalFrequency;
  if (Math.abs(damping - 1) < 1e-7) return 1 - (1 + t) * Math.exp(-t);
  if (damping < 1) {
    const frequency = Math.sqrt(1 - damping * damping);
    return 1 - Math.exp(-damping * t) * (Math.cos(frequency * t) + damping / frequency * Math.sin(frequency * t));
  }
  const root = Math.sqrt(damping * damping - 1);
  const slow = damping - root;
  const fast = damping + root;
  return 1 - (fast * Math.exp(-slow * t) - slow * Math.exp(-fast * t)) / (fast - slow);
}

export function secondOrderSettlingTime(damping: number, naturalFrequency: number, tolerance = 0.02) {
  let low = 0;
  let high = 1;
  if (damping < 1) {
    const halfPeriod = Math.PI / Math.sqrt(1 - damping * damping);
    const lastPeak = Math.floor(-Math.log(tolerance) / (damping * halfPeriod));
    low = lastPeak * halfPeriod;
    high = low + halfPeriod;
  } else {
    while (1 - secondOrderStep(high, damping, 1) > tolerance) high *= 2;
  }
  for (let i = 0; i < 50; i++) {
    const middle = (low + high) / 2;
    if (Math.abs(1 - secondOrderStep(middle, damping, 1)) > tolerance) low = middle;
    else high = middle;
  }
  return high / naturalFrequency;
}

export function pwmTransitions(duty: number, cycles = 2) {
  const ratio = Math.max(0, Math.min(1, duty));
  if (ratio === 0 || ratio === 1) return [];
  return Array.from({ length: cycles }, (_, index) => [(index + ratio) / cycles, (index + 1) / cycles]).flat().filter((point) => point < 1);
}

export function transmissionVoltage(position: number, lengthWavelengths: number, reflection: number, timePhase = Math.PI / 4) {
  const distancePhase = 2 * Math.PI * lengthWavelengths * (1 - position);
  return Math.cos(timePhase + distancePhase) + reflection * Math.cos(timePhase - distancePhase);
}

export const resistorDigitColors = [
  '#161c1f', '#7a3f1d', '#d94747', '#e98120', '#e5bf32',
  '#2e9d62', '#3478c8', '#7650a8', '#77848b', '#f5f1df',
];

export function getResistorBandColors(ohms: number): string[] {
  if (!Number.isFinite(ohms) || ohms <= 0) return [];
  let multiplier = Math.floor(Math.log10(ohms)) - 1;
  let digits = Math.round(ohms / 10 ** multiplier);
  if (digits === 100) { digits = 10; multiplier += 1; }
  // Non-representable values use the printed value, never a contradictory code.
  if (multiplier < -2 || multiplier > 9 || Math.abs(digits * 10 ** multiplier - ohms) > ohms * 1e-8) return [];
  const multiplierColor = multiplier === -2 ? '#b8b8b8' : multiplier === -1 ? '#d4af37' : resistorDigitColors[multiplier];
  return [resistorDigitColors[Math.floor(digits / 10)], resistorDigitColors[digits % 10], multiplierColor, '#d4af37'];
}
