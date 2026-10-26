export function parseFiniteValue(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parsePositiveValue(value: string) {
  const parsed = parseFiniteValue(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

export function arePositiveFinite(...values: number[]) {
  return values.every((value) => Number.isFinite(value) && value > 0);
}

export function convertUnits(value: number, from: number, to: number) {
  const converted = value * (from / to);
  return Number.isFinite(converted) && (value === 0 || converted !== 0)
    ? converted
    : null;
}

export function calculateDivider(voltage: number, upper: number, lower: number, load: number | null) {
  if (!arePositiveFinite(voltage, upper, lower) || (load !== null && !arePositiveFinite(load))) return null;
  // Scaling avoids overflowing R1 * R2 or R1 + R2 for valid finite inputs.
  const effectiveLowerResistance = load === null
    ? lower
    : Math.min(lower, load) / (1 + Math.min(lower, load) / Math.max(lower, load));
  const scale = Math.max(upper, effectiveLowerResistance);
  const normalizedTotal = upper / scale + effectiveLowerResistance / scale;
  const ratio = (effectiveLowerResistance / scale) / normalizedTotal;
  const outputVoltage = voltage * ratio;
  const sourceCurrent = (voltage / scale) / normalizedTotal / 1000;
  const loadCurrent = load === null ? null : (outputVoltage / load) / 1000;
  if (!arePositiveFinite(effectiveLowerResistance, ratio, outputVoltage, sourceCurrent) ||
      (loadCurrent !== null && !arePositiveFinite(loadCurrent))) return null;
  return { effectiveLowerResistance, hasLoad: load !== null, loadCurrent, outputVoltage, ratio, sourceCurrent };
}
