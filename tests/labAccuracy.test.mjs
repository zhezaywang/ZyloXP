import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { labValues } from './fixtures/labValues.mjs';
import { labExtremeCases, labControls } from './fixtures/labExtremes.mjs';
import { pwmTransitions, secondOrderSettlingTime, secondOrderStep } from '../src/visualMath.ts';

let server, labs, LabSchematic, metricsFor;
before(async () => {
  server = await createServer({ cacheDir: 'node_modules/.cache/zyloxp-lab-audit', server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
  ({ labScenarios: labs } = await server.ssrLoadModule('/src/data.ts'));
  ({ LabSchematic } = await server.ssrLoadModule('/src/LabVisualStage.tsx'));
  ({ calculateLabMetrics: metricsFor } = await server.ssrLoadModule('/src/labMetrics.ts'));
});
after(async () => { await server?.close(); });
const render = (id, changes = {}) => renderToStaticMarkup(createElement(LabSchematic, {
  lab: labs.find((lab) => lab.id === id), values: { ...labValues, ...changes }, running: false,
}));
const pathFor = (html, name) => html.match(new RegExp(`<path[^>]*class="${name}"[^>]*d="([^"]+)"`))?.[1];
const pointsFor = (path) => [...path.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map(([, x, y]) => [Number(x), Number(y)]);
const close = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test('every live lab renders at every slider endpoint and combined extremes', () => {
  assert.deepEqual(new Set(labs.map((lab) => lab.id)), new Set(Object.keys(labControls)));
  assert.equal(labExtremeCases.length, 134);
  for (const fixture of labExtremeCases) {
    const html = render(fixture.labId, fixture.values);
    assert.doesNotMatch(html, /(?:NaN|Infinity|undefined)/, fixture.id);
    assert.ok(Object.values(metricsFor(fixture.values)).every((value) => typeof value !== 'number' || Number.isFinite(value)), fixture.id);
  }
});

test('op-amp clipping stays at its supply swing even for gain -100', () => {
  const html = render('lab-opamp', { opAmpFeedbackResistance: 100, opAmpInputResistance: 1, opAmpInputVoltage: 2, opAmpSupplyVoltage: 5 });
  const points = pointsFor(pathFor(html, 'labOpAmpOutputTrace clipped'));
  assert.ok(points.length > 80);
  assert.ok(points.every(([, y]) => y >= 113 && y <= 173));
  assert.ok(points.some(([, y]) => y === 113));
  assert.ok(points.some(([, y]) => y === 173));
});

test('PWM has the requested high-time fraction and supports constant levels', () => {
  for (const duty of [0.1, 0.25, 0.5, 0.95]) {
    const transitions = [0, ...pwmTransitions(duty), 1];
    const highTime = transitions.slice(1).reduce((sum, end, index) => sum + (index % 2 === 0 ? end - transitions[index] : 0), 0);
    close(highTime, duty);
  }
  assert.deepEqual(pwmTransitions(0), []);
  assert.deepEqual(pwmTransitions(1), []);
  const off = render('lab-mosfet', { mosfetGateVoltage: 0 });
  assert.ok(pointsFor(pathFor(off, 'labMosfetGateWave')).every(([, y]) => y === 94));
  assert.equal(pathFor(off, 'labMosfetDrainWave off'), 'M28 128 H198');
  assert.doesNotMatch(off, /FLYBACK/);
  assert.match(off, /RESISTIVE LOAD/);
});

test('resistive MOSFET circuit obeys KVL at the former 20 A clamp', () => {
  const values = { ...labValues, mosfetBusVoltage: 60, mosfetLoadResistance: 2, mosfetGateVoltage: 12 };
  const metrics = metricsFor(values);
  assert.ok(metrics.mosfetDrainCurrent > 20);
  close(metrics.mosfetDrainCurrent * values.mosfetLoadResistance + metrics.mosfetDrainVoltage, values.mosfetBusVoltage);
});

test('digital capture uses a rising clock edge and shows unknown Q on setup violation', () => {
  const html = render('lab-digital', { digitalClockFrequency: 50, digitalPropagationDelay: 10, digitalSetupTime: 3 });
  assert.match(pathFor(html, 'labLogicWave clock'), /H131\.00 V58/);
  assert.equal(pathFor(html, 'labLogicWave data'), 'M46 118 H109.75 V100 H216');
  assert.match(pathFor(html, 'labLogicWave output pass'), /H131\.00 V142/);
  const violation = render('lab-digital', { digitalClockFrequency: 100, digitalPropagationDelay: 30, digitalSetupTime: 20 });
  assert.equal(pathFor(violation, 'labLogicWave output fail'), 'M46 160 H131');
  assert.match(violation, /class="labLogicUnknown"/);
});

test('PID response is unclipped and the reported 2% settling time matches the model', () => {
  close(secondOrderSettlingTime(1, 1), 5.83392170191739, 1e-10);
  for (const damping of [0.12, 0.5, 0.99, 1, 1.01, 1.4]) {
    const settle = secondOrderSettlingTime(damping, 2);
    close(Math.abs(1 - secondOrderStep(settle, damping, 2)), 0.02, 1e-9);
    for (let i = 1; i <= 500; i++) assert.ok(Math.abs(1 - secondOrderStep(settle + i * 0.03, damping, 2)) <= 0.020000001);
  }
  for (const fixture of labExtremeCases.filter((item) => item.labId === 'lab-pid')) {
    const html = render(fixture.labId, fixture.values);
    const points = pointsFor(pathFor(html, 'labPidResponseTrace'));
    assert.equal(points.length, 481);
    assert.ok(points.every(([, y]) => y >= 49.99 && y <= 158.01), fixture.id);
    assert.match(html, /d="M287 152 V170 M232 189 H166 V162"/);
    const metrics = metricsFor(fixture.values);
    const scale = Math.max(fixture.values.pidSetpoint, metrics.pidFinalValue * (1 + metrics.pidOvershoot / 100)) * 1.08;
    const band = html.match(/<rect class="labPidToleranceBand"[^>]*>/)[0];
    const height = Number(band.match(/height="([^"]+)"/)[1]);
    const y = Number(band.match(/ y="([^"]+)"/)[1]);
    close(y + height / 2, 158 - metrics.pidFinalValue / scale * 108);
    const marker = html.match(/class="labPidResponseMarker"[^>]*transform:translate\(202px, ([\d.]+)px\)/);
    close(Number(marker[1]), points.at(-1)[1], 0.0051);
  }
});

test('transmission snapshots obey the load reflection coefficient and electrical length', () => {
  for (const length of [0, 90, 180, 360]) {
    for (const load of [1, 50, 200]) {
      const html = render('lab-transmission', { transmissionElectricalLength: length, transmissionLoadImpedance: load, transmissionCharacteristicImpedance: 50 });
      const incident = pointsFor(pathFor(html, 'labTransmissionWave incident'));
      const reflected = pointsFor(pathFor(html, 'labTransmissionWave reflected'));
      const gamma = (load - 50) / (load + 50);
      close(198 - reflected.at(-1)[1], gamma * (174 - incident.at(-1)[1]), 0.002);
      if (length === 0) assert.ok(incident.every(([, y]) => y === incident[0][1]));
      if (load === 50) {
        assert.ok(reflected.every(([, y]) => y === 198));
        assert.match(html, /∞ dB/);
      }
    }
  }
});

test('ADC peak code includes the midscale bias used by its plotted samples', () => {
  for (const bits of [4, 10, 16]) {
    const values = { ...labValues, adcBitDepth: bits };
    const metrics = metricsFor(values);
    const expected = Math.min(2 ** bits - 1, Math.floor((values.adcReferenceVoltage / 2 + metrics.adcFilteredAmplitude) / (values.adcReferenceVoltage / 2 ** bits)));
    assert.equal(metrics.adcPeakCode, expected);
    const html = render('lab-adc', values);
    const leds = html.match(/class="labAdcCodeLeds"[^>]*>(.*?)<\/g>/)[1];
    const binary = [...leds.matchAll(/<circle class="([^"]*)"/g)].map(([, name]) => name === 'active' ? '1' : '0').join('');
    assert.equal(binary.length, bits);
    assert.equal(parseInt(binary, 2), expected);
  }
});

test('transformer scope shares a voltage scale and windings reach their terminal leads', () => {
  for (const transformerSecondaryTurns of [20, 105, 1000]) {
    const values = { ...labValues, transformerSecondaryTurns };
    const metrics = metricsFor(values);
    const html = render('lab-transformer', values);
    const amplitude = (name) => Math.max(...pointsFor(pathFor(html, name)).map(([, y]) => Math.abs(y - 76)));
    close(amplitude('labTransformerSecondaryWave') / amplitude('labTransformerPrimaryWave'), metrics.transformerSecondaryVoltage / values.transformerPrimaryVoltage, 0.002);
    assert.match(html, /d="M96 89 H108 V77 H153 M153 155 H108 V141 H96"/);
    assert.match(html, /d="M221 77 H260 V89 H270 M221 155 H260 V141 H270"/);
  }
});

test('RLC operating marker lies on the displayed curve even outside the old sweep range', () => {
  for (const fixture of labExtremeCases.filter((item) => item.labId === 'lab-resonance')) {
    const html = render(fixture.labId, fixture.values);
    const [, x, y] = html.match(/class="labResonanceMarker" cx="([^"]+)" cy="([^"]+)"/);
    const points = pointsFor(pathFor(html, 'labResonanceTrace'));
    assert.ok(points.some(([px, py]) => Math.abs(px - Number(x)) < 0.011 && Math.abs(py - Number(y)) < 0.011), fixture.id);
  }
});
