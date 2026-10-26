import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import { arePositiveFinite, calculateDivider, convertUnits, parseFiniteValue, parsePositiveValue } from '../src/engineeringToolkitMath.ts';
import { formatBenchNumber, getLabRunCapacityMessage, insertLabRun, restoreLabValues } from '../src/labRunHistory.ts';
import { labValues } from './fixtures/labValues.mjs';

const server = await createServer({ cacheDir: 'node_modules/.cache/refinement-tests', server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
after(() => server.close());
const { normalizeRecentLearningItems, mergeRecentLearningItems } = await server.ssrLoadModule('/src/RecentLearning.tsx');
const { getWeeklyNextAction } = await server.ssrLoadModule('/src/WeeklyPlanner.tsx');
const { filterSavedQuestions } = await server.ssrLoadModule('/src/NotebookLibrary.tsx');
const { getComparison } = await server.ssrLoadModule('/src/LabBenchLog.tsx');
const { labScenarios } = await server.ssrLoadModule('/src/data.ts');

test('C01: blank and malformed numeric input is not a zero measurement', () => {
  for (const value of ['', '   ', 'NaN', 'Infinity', '1e999']) assert.equal(parseFiniteValue(value), null);
  assert.equal(parseFiniteValue('0'), 0);
  assert.equal(parseFiniteValue('-12.5'), -12.5);
  assert.equal(parsePositiveValue('0'), null);
  assert.equal(parsePositiveValue('0.001'), 0.001);
});

test('C02: arithmetic guards reject overflow and underflow, retaining real zero conversions', () => {
  assert.equal(arePositiveFinite(Infinity), false);
  assert.equal(arePositiveFinite(1, NaN), false);
  assert.equal(arePositiveFinite(1e-300 * 1e-300), false);
  assert.equal(convertUnits(1e308, 1000, 0.001), null);
  assert.equal(convertUnits(1e-320, 1e-9, 1), null);
  assert.equal(convertUnits(0, 1e-9, 1e9), 0);
  assert.equal(convertUnits(1e308, 1000, 1000), 1e308);
});

test('C03: loaded dividers agree with circuit equations without overflowing intermediates', () => {
  const ordinary = calculateDivider(12, 10, 10, 10);
  assert.equal(ordinary.outputVoltage, 4);
  assert.equal(ordinary.effectiveLowerResistance, 5);
  assert.ok(Math.abs(ordinary.sourceCurrent - 0.0008) < 1e-15);
  assert.equal(calculateDivider(12, 10, 10, null).outputVoltage, 6);
  const large = calculateDivider(12, 1e308, 1e308, 1e308);
  assert.equal(large.outputVoltage, 4);
  assert.ok(large.sourceCurrent > 0 && Number.isFinite(large.sourceCurrent));
  assert.equal(calculateDivider(12, 0, 10, null), null);
  assert.equal(calculateDivider(12, 10, 10, NaN), null);
});

test('C04: conversion reversals preserve signed quantities', () => {
  for (const value of [0, -12, 0.0001, 12]) {
    const converted = convertUnits(value, 1, 0.001);
    assert.ok(Math.abs(convertUnits(converted, 0.001, 1) - value) < 1e-12);
  }
});

test('C08: every lab restores its own values only, including intentionally shared RC controls', () => {
  const saved = Object.fromEntries(Object.entries(labValues).map(([key, value]) => [key, value + 1]));
  const coveredKeys = new Set();
  for (const lab of labScenarios) {
    const restored = restoreLabValues(lab.id, labValues, saved);
    const changed = Object.keys(labValues).filter((key) => restored[key] !== labValues[key]);
    assert.ok(changed.length >= 2 && changed.length <= 7, lab.id);
    changed.forEach((key) => coveredKeys.add(key));
    if (lab.id !== 'lab-pid') assert.equal(restored.pidSetpoint, labValues.pidSetpoint);
    if (lab.id !== 'lab-ohms') assert.equal(restored.voltage, labValues.voltage);
  }
  assert.equal(coveredKeys.size, Object.keys(labValues).length);
  assert.deepEqual(restoreLabValues('missing', labValues, saved), labValues);
  assert.equal(restoreLabValues('lab-filter', labValues, saved).rcResistance, saved.rcResistance);
});

const run = (id, labId = 'lab-ohms') => ({ id, labId, savedAt: 1000, output: '0.5 A', values: labValues });
test('C09: bench saves and undo respect both limits without evicting other records', () => {
  const fullLab = Array.from({ length: 8 }, (_, i) => run(`run-${i}`));
  assert.match(getLabRunCapacityMessage(fullLab, 'lab-ohms'), /8 saved runs/);
  assert.equal(insertLabRun(fullLab, run('extra')), null);
  assert.equal(insertLabRun(fullLab, fullLab[0]), fullLab);
  assert.equal(insertLabRun(fullLab, run('other', 'lab-pid')).length, 9);
  const full = ['lab-ohms', 'lab-pid', 'lab-rc'].flatMap((lab) => fullLab.map((entry) => ({ ...entry, id: lab + entry.id, labId: lab })));
  assert.equal(insertLabRun(full, run('extra', 'lab-adc')), null);
  const restored = insertLabRun(full.slice(1), full[0]);
  assert.equal(restored.length, 24);
  assert.deepEqual(new Set(restored.map((entry) => entry.id)), new Set(full.map((entry) => entry.id)));
});

test('C11: fractional settings and small deltas remain visible', () => {
  assert.equal(formatBenchNumber(2.25), '2.25');
  assert.equal(formatBenchNumber(0.005, 2), '0.005');
  assert.match(getComparison('lab-ohms', { ...labValues, voltage: labValues.voltage + 0.25 }, labValues), /Voltage \+0.25 V/);
  assert.match(getComparison('lab-pid', { ...labValues, pidDerivativeGain: labValues.pidDerivativeGain + 0.005 }, labValues), /Derivative gain \+0.005 s/);
  assert.match(getComparison('lab-pid', labValues, labValues), /Matches/);
});

const questions = [
  { id: 'strong', subtopic: 'Op-amp gain', topic: 'Analog Electronics', prompt: 'Find voltage gain', accuracy: 90, attempts: 10 },
  { id: 'new', subtopic: 'Capacitor', topic: 'DC Circuits', prompt: 'Stored charge', accuracy: null, attempts: 0 },
  { id: 'weak', subtopic: 'Op-amp output', topic: 'Analog Electronics', prompt: 'Find output voltage', accuracy: 25, attempts: 4 },
];
test('C13: saved-question search uses engineering aliases and topic filters together', () => {
  assert.deepEqual(filterSavedQuestions(questions, 'operational amplifier', '', 'saved').map((q) => q.id), ['strong', 'weak']);
  assert.deepEqual(filterSavedQuestions(questions, 'operational amplifier', 'DC Circuits', 'saved'), []);
  assert.equal(filterSavedQuestions(questions, '', 'DC Circuits', 'saved')[0].id, 'new');
});
test('C14: question prioritization distinguishes unknown accuracy from poor accuracy', () => {
  assert.deepEqual(filterSavedQuestions(questions, '', '', 'unattempted').map((q) => q.id), ['new', 'strong', 'weak']);
  assert.deepEqual(filterSavedQuestions(questions, '', '', 'weakest').map((q) => q.id), ['weak', 'strong', 'new']);
  assert.deepEqual(questions.map((q) => q.id), ['strong', 'new', 'weak']);
});

const recent = (lab, time = 1000) => ({ id: 'duplicated-id', kind: 'Lab', title: lab, subtitle: 'A lab', viewedAt: time, routeHash: `#/labs/${lab}` });
test('C15: recent history normalizes routes, timestamps, duplicates and keys', () => {
  const values = [recent('lab-ohms'), recent('lab-ohms', 2000), recent('lab-pid'), { ...recent('lab-adc'), kind: 'Career' }, recent('lab-bjt', 1e100), { ...recent('lab-rc'), routeHash: 'javascript:alert(1)' }];
  const normalized = normalizeRecentLearningItems(values, 3000);
  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].viewedAt, 2000);
  assert.equal(new Set(normalized.map((item) => item.id)).size, 2);
  assert.deepEqual(normalizeRecentLearningItems(normalized, 3000), normalized);
  const longRoute = normalizeRecentLearningItems([{ ...recent(`lab-${'x'.repeat(240)}`), title: 'Long resource identifier' }], 3000);
  assert.equal(longRoute.length, 1);
  assert.deepEqual(normalizeRecentLearningItems(longRoute, 3000), longRoute);
  assert.deepEqual(normalizeRecentLearningItems(null), []);
});
test('C16: history undo merges new visits and keeps the newest copy of each route', () => {
  const merged = mergeRecentLearningItems([recent('lab-pid', 3000), recent('lab-ohms', 2000)], [recent('lab-ohms'), recent('lab-rc')]);
  assert.deepEqual(merged.map((item) => item.title), ['lab-pid', 'lab-ohms', 'lab-rc']);
  assert.equal(merged[1].viewedAt, 2000);
  assert.equal(normalizeRecentLearningItems(Array.from({ length: 10 }, (_, i) => recent(`lab-${i}`))).length, 6);
});

test('C18: weekly recommendations use proportional gaps and handle completion and ties', () => {
  const plan = { targetXp: 100, targetQuestions: 20, targetChallenges: 4 };
  assert.equal(getWeeklyNextAction(plan, { xp: 100, questions: 0, challenges: 3 }), 'practice');
  assert.equal(getWeeklyNextAction(plan, { xp: 10, questions: 20, challenges: 3 }), 'route');
  assert.equal(getWeeklyNextAction(plan, { xp: 100, questions: 20, challenges: 0 }), 'lab');
  assert.equal(getWeeklyNextAction(plan, { xp: 100, questions: 20, challenges: 4 }), 'route');
  assert.equal(getWeeklyNextAction(plan, { xp: 0, questions: 0, challenges: 0 }), 'lab');
  assert.equal(getWeeklyNextAction(null, { xp: 0, questions: 0, challenges: 0 }), 'route');
});
