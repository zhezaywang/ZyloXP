import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import { labValues } from './fixtures/labValues.mjs';
import { restoreLabValues } from '../src/labRunHistory.ts';

const server = await createServer({ cacheDir: 'node_modules/.cache/lab-comparison-tests', server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
after(() => server.close());
const { getComparisonRows, createLabComparisonCsv } = await server.ssrLoadModule('/src/LabBenchLog.tsx');
const { labScenarios } = await server.ssrLoadModule('/src/data.ts');

test('comparison rows cover every setting in every lab without changing input objects', () => {
  const before = structuredClone(labValues);
  const candidate = Object.fromEntries(Object.entries(labValues).map(([key, value]) => [key, value + 0.25]));
  const snapshot = structuredClone(candidate);
  for (const lab of labScenarios) {
    const rows = getComparisonRows(lab.id, before, candidate);
    const restored = restoreLabValues(lab.id, before, candidate);
    assert.equal(rows.length, Object.keys(before).filter((key) => restored[key] !== before[key]).length, lab.id);
    assert.equal(new Set(rows.map((row) => row.label)).size, rows.length, lab.id);
    for (const row of rows) {
      assert.ok(row.changed, `${lab.id}: ${row.label}`);
      assert.ok(Math.abs(row.delta - 0.25) < 1e-12);
      assert.equal(typeof row.unit, 'string');
      assert.ok(Number.isFinite(row.baseline) && Number.isFinite(row.value));
    }
    assert.ok(getComparisonRows(lab.id, before, before).every((row) => !row.changed && row.delta === 0));
  }
  assert.deepEqual(before, labValues);
  assert.deepEqual(candidate, snapshot);
});

test('comparison direction, fractional values and floating-point noise are handled consistently', () => {
  const baseline = { ...labValues, voltage: 5, resistance: 10 };
  const candidate = { ...baseline, voltage: 8.25 };
  assert.equal(getComparisonRows('lab-ohms', baseline, candidate)[0].delta, 3.25);
  assert.equal(getComparisonRows('lab-ohms', candidate, baseline)[0].delta, -3.25);
  assert.equal(getComparisonRows('lab-ohms', baseline, candidate)[1].changed, false);
  const tiny = getComparisonRows('lab-pid', { ...labValues, pidDerivativeGain: 0 }, { ...labValues, pidDerivativeGain: 0.000005 });
  assert.equal(tiny.find((row) => row.label === 'Derivative gain').delta, 0.000005);
  const noise = getComparisonRows('lab-ohms', { ...baseline, voltage: 0.3 }, { ...baseline, voltage: 0.1 + 0.2 });
  assert.equal(noise[0].changed, false);
  assert.equal(Object.is(noise[0].delta, -0), false);
});

test('CSV includes all settings, numeric deltas, units, outputs and identifiable setups', () => {
  const before = { label: 'Run 1 / Yesterday', output: '0.50 A', recordedAt: Date.UTC(2026, 9, 9), values: { ...labValues, voltage: 5, resistance: 10 } };
  const after = { label: 'Live setup', output: '0.825 A', recordedAt: null, values: { ...before.values, voltage: 8.25 } };
  const csv = createLabComparisonCsv('lab-ohms', "Ohm's Law Bench", before, after);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"Baseline","Run 1 / Yesterday"\r\n'));
  assert.ok(csv.includes('"Comparison","Live setup"\r\n'));
  assert.ok(csv.includes('"Baseline recorded at","2026-10-09T00:00:00.000Z"\r\n'));
  assert.ok(csv.includes('"Comparison recorded at","Live at export"\r\n'));
  assert.ok(csv.includes('"Voltage","V",5,8.25,3.25\r\n'));
  assert.ok(csv.includes('"Resistance","Ω",10,10,0\r\n'));
  assert.ok(csv.includes('"Output","","0.50 A","0.825 A",""\r\n'));
  const reverse = createLabComparisonCsv('lab-ohms', 'Bench', after, before);
  assert.ok(reverse.includes('"Voltage","V",8.25,5,-3.25\r\n'));
});

test('CSV quotes delimiters and blocks formula-like text without changing numeric negatives', () => {
  const setup = { label: 'Run "one", baseline', output: '=HYPERLINK("https://example.invalid")', recordedAt: null, values: labValues };
  const csv = createLabComparisonCsv('lab-ohms', '\n@bad', setup, { ...setup, label: '+calculation' });
  assert.ok(csv.includes('"Run ""one"", baseline"'));
  assert.ok(csv.includes('"\'\n@bad"'));
  assert.ok(csv.includes('"\'+calculation"'));
  assert.ok(csv.includes('"\'=HYPERLINK(""https://example.invalid"")"'));
});
