import type { LabRunSnapshot } from './LabBenchLog';
import type { LabSimulationValues } from './labMetrics';

export const MAX_LAB_RUNS = 24;
export const MAX_RUNS_PER_LAB = 8;

export function getLabRunCapacityMessage(runs: LabRunSnapshot[], labId: string) {
  if (runs.filter((run) => run.labId === labId).length >= MAX_RUNS_PER_LAB) {
    return 'This lab has 8 saved runs. Delete a run from its Bench Log before saving another.';
  }
  if (runs.length >= MAX_LAB_RUNS) {
    return 'Bench storage is full (24 runs). Delete a run in Notebook > Bench Runs before saving another.';
  }
  return null;
}

export function insertLabRun(runs: LabRunSnapshot[], run: LabRunSnapshot) {
  if (runs.some((saved) => saved.id === run.id)) return runs;
  if (getLabRunCapacityMessage(runs, run.labId)) return null;
  return [run, ...runs].sort((a, b) => b.savedAt - a.savedAt);
}

const LAB_KEYS: Record<string, readonly (keyof LabSimulationValues)[]> = {
  'lab-ohms': ['voltage', 'resistance'],
  'lab-rc': ['rcResistance', 'capacitance'],
  'lab-filter': ['rcResistance', 'capacitance', 'filterFrequency'],
  'lab-resonance': ['resonanceFrequency', 'resonanceInductance', 'resonanceCapacitance', 'resonanceResistance', 'resonanceSourceVoltage'],
  'lab-digital': ['digitalClockFrequency', 'digitalPropagationDelay', 'digitalSetupTime'],
  'lab-adc': ['adcInputFrequency', 'adcSampleRate', 'adcBitDepth', 'adcReferenceVoltage', 'adcInputAmplitude', 'adcFilterCutoff'],
  'lab-opamp': ['opAmpInputVoltage', 'opAmpInputResistance', 'opAmpFeedbackResistance', 'opAmpSupplyVoltage'],
  'lab-bjt': ['bjtBaseCurrent', 'bjtCurrentGain', 'bjtCollectorResistance', 'bjtSupplyVoltage', 'bjtTemperature'],
  'lab-mosfet': ['mosfetGateVoltage', 'mosfetGateResistance', 'mosfetSwitchingFrequency', 'mosfetBusVoltage', 'mosfetLoadResistance', 'mosfetDutyCycle'],
  'lab-transmission': ['transmissionCharacteristicImpedance', 'transmissionLoadImpedance', 'transmissionElectricalLength'],
  'lab-pid': ['pidProportionalGain', 'pidIntegralGain', 'pidDerivativeGain', 'pidPlantTimeConstant', 'pidSetpoint'],
  'lab-transformer': ['transformerPrimaryVoltage', 'transformerFrequency', 'transformerPrimaryTurns', 'transformerSecondaryTurns', 'transformerCoreArea', 'transformerLoadResistance', 'transformerWindingResistance'],
  'lab-power': ['lineVoltage', 'lineCurrent', 'powerFactor'],
};

export function restoreLabValues(labId: string, current: LabSimulationValues, saved: LabSimulationValues) {
  const values = { ...current };
  for (const key of LAB_KEYS[labId] ?? []) values[key] = saved[key];
  return values;
}

export function formatBenchNumber(value: number, minimumDecimals = 0) {
  // Keep control precision without showing floating-point subtraction noise.
  if (value !== 0 && Math.abs(value) < 0.0001) return value.toExponential(3);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: minimumDecimals,
    maximumFractionDigits: Math.max(minimumDecimals, 4),
  }).format(value);
}
