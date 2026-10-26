import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LAB_VALUE_LIMITS } from '../src/labValueLimits.ts';
import { labControls, labExtremeCases, labRanges } from './fixtures/labExtremes.mjs';
import { labValues } from './fixtures/labValues.mjs';

test('lab boundary fixtures share the app limits without a compiler API dependency', () => {
  assert.equal(labRanges, LAB_VALUE_LIMITS);
  assert.deepEqual(Object.keys(labRanges).sort(), Object.keys(labValues).sort());
  assert.deepEqual(new Set(Object.values(labControls).flat()), new Set(Object.keys(labRanges)));
  for (const [key, range] of Object.entries(labRanges)) {
    assert.equal(range.length, 2, key);
    const [minimum, maximum] = range;
    assert.ok(Number.isFinite(minimum) && Number.isFinite(maximum) && minimum < maximum, key);
    assert.ok(labValues[key] >= minimum && labValues[key] <= maximum, key);
  }
});

test('lab extremes preserve negative, zero, and fractional slider bounds', () => {
  for (const [labId, key, value] of [
    ['lab-bjt', 'bjtTemperature', -20],
    ['lab-pid', 'pidDerivativeGain', 0],
    ['lab-transformer', 'transformerWindingResistance', 0.05],
  ]) {
    const fixture = labExtremeCases.find((entry) => entry.id === `${labId}-${key}-min`);
    assert.equal(fixture?.values[key], value, key);
  }
});
