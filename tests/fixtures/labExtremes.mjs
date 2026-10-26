import { LAB_VALUE_LIMITS as labRanges } from '../../src/labValueLimits.ts';
import { labValues } from './labValues.mjs';

export { labRanges };
export const labControls = {
  'lab-ohms': ['voltage', 'resistance'],
  'lab-rc': ['rcResistance', 'capacitance'],
  'lab-filter': ['rcResistance', 'capacitance', 'filterFrequency'],
  'lab-digital': ['digitalClockFrequency', 'digitalPropagationDelay', 'digitalSetupTime'],
  'lab-opamp': ['opAmpInputResistance', 'opAmpFeedbackResistance', 'opAmpInputVoltage', 'opAmpSupplyVoltage'],
  'lab-bjt': ['bjtBaseCurrent', 'bjtCollectorResistance', 'bjtCurrentGain', 'bjtSupplyVoltage', 'bjtTemperature'],
  'lab-mosfet': ['mosfetBusVoltage', 'mosfetDutyCycle', 'mosfetGateResistance', 'mosfetGateVoltage', 'mosfetLoadResistance', 'mosfetSwitchingFrequency'],
  'lab-adc': ['adcBitDepth', 'adcFilterCutoff', 'adcInputAmplitude', 'adcInputFrequency', 'adcReferenceVoltage', 'adcSampleRate'],
  'lab-resonance': ['resonanceCapacitance', 'resonanceFrequency', 'resonanceInductance', 'resonanceResistance', 'resonanceSourceVoltage'],
  'lab-transformer': ['transformerCoreArea', 'transformerFrequency', 'transformerLoadResistance', 'transformerPrimaryTurns', 'transformerPrimaryVoltage', 'transformerSecondaryTurns', 'transformerWindingResistance'],
  'lab-pid': ['pidDerivativeGain', 'pidIntegralGain', 'pidPlantTimeConstant', 'pidProportionalGain', 'pidSetpoint'],
  'lab-transmission': ['transmissionCharacteristicImpedance', 'transmissionElectricalLength', 'transmissionLoadImpedance'],
  'lab-power': ['lineVoltage', 'lineCurrent', 'powerFactor'],
};

export const labExtremeCases = Object.entries(labControls).flatMap(([labId, controls]) => [
  ...controls.flatMap((key) => labRanges[key].map((value, index) => ({
    id: `${labId}-${key}-${index ? 'max' : 'min'}`, labId, values: { ...labValues, [key]: value },
  }))),
  ...[0, 1].map((index) => ({
    id: `${labId}-all-${index ? 'max' : 'min'}`, labId,
    values: { ...labValues, ...Object.fromEntries(controls.map((key) => [key, labRanges[key][index]])) },
  })),
]);
