import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { labValues } from './labValues.mjs';

// Read the app's actual slider bounds so this audit cannot drift from the UI.
const source = ts.createSourceFile('App.tsx', readFileSync(new URL('../../src/App.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let ranges;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'LAB_VALUE_LIMITS') {
    ranges = Object.fromEntries(node.initializer.properties.map((property) => [
      property.name.getText(source), property.initializer.elements.map((element) => Number(element.getText(source))),
    ]));
  }
  ts.forEachChild(node, visit);
}
visit(source);
if (!ranges || Object.values(ranges).some((range) => range.some((value) => !Number.isFinite(value)))) {
  throw new Error('Cannot read the lab slider bounds');
}
export const labRanges = ranges;
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
