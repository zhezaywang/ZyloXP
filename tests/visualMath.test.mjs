import assert from 'node:assert/strict';
import test from 'node:test';
import { amWaveform, getResistorBandColors, phasorPoint, plotPath, rcChargePlot, resistorDigitColors as colors, sampleSineWave, secondOrderStep, transmissionVoltage } from '../src/visualMath.ts';

test('phasors rotate about their plotted origin at positive and negative phases', () => {
  for (const angle of [-180, -90, 0, 35, 90, 180]) {
    const point = phasorPoint(505, 105, 70, angle);
    assert.ok(Math.abs(Math.hypot(point.x - 505, point.y - 105) - 70) < 1e-10);
    assert.ok(point.x >= 435 && point.x <= 575);
    assert.ok(point.y >= 35 && point.y <= 175);
  }
  assert.deepEqual(phasorPoint(505, 105, 70, 0), { x: 575, y: 105 });
  assert.deepEqual(phasorPoint(505, 105, 70, 90), { x: 505, y: 35 });
});

test('RC charging starts at zero, reaches 63.2% at tau and 99.3% at five tau', () => {
  const plot = rcChargePlot(30, 164, 194, 106);
  assert.equal(plot.tauX, 68.8);
  assert.ok(Math.abs((164 - plot.tauY) / 106 - (1 - Math.exp(-1))) < 1e-12);
  assert.ok(plot.path.startsWith('M30.000 164.000'));
  assert.ok(plot.path.endsWith(`L224.000 ${(164 - 106 * (1 - Math.exp(-5))).toFixed(3)}`));
  assert.ok(plot.path.includes(`L68.800 ${plot.tauY.toFixed(3)}`));
});

test('AM carrier stays inside a varying, nonnegative envelope', () => {
  for (let i = 0; i <= 640; i++) {
    const { carrier, envelope } = amWaveform(i / 640);
    assert.ok(Math.abs(carrier) <= envelope + 1e-12);
    assert.ok(envelope >= 0.5 && envelope <= 1.5);
  }
  assert.equal(amWaveform(0).envelope, 1.5);
  assert.equal(amWaveform(0.5).envelope, 0.5);
});

test('resistor bands encode fractional, integer and kilo-ohm values without rounding lies', () => {
  const gold = '#d4af37';
  assert.deepEqual(getResistorBandColors(1), [colors[1], colors[0], gold, gold]);
  assert.deepEqual(getResistorBandColors(4.7), [colors[4], colors[7], gold, gold]);
  assert.deepEqual(getResistorBandColors(0.1), [colors[1], colors[0], '#b8b8b8', gold]);
  assert.deepEqual(getResistorBandColors(12), [colors[1], colors[2], colors[0], gold]);
  assert.deepEqual(getResistorBandColors(2200), [colors[2], colors[2], colors[2], gold]);
  assert.deepEqual(getResistorBandColors(1000), [colors[1], colors[0], colors[2], gold]);
  for (const value of [0, -1, NaN, Infinity, 0.001, 1234, 999]) assert.deepEqual(getResistorBandColors(value), []);
});

test('sampled paths include both endpoints', () => {
  assert.equal(plotPath((t) => t * 10, 5, 20, 2), 'M5.000 0.000 L15.000 5.000 L25.000 10.000');
});

test('sampling dots use the stated clock interval, including aliasing and the Nyquist limit', () => {
  for (const [frequency, sampleRate, duration] of [[7, 20, 0.34], [6, 16, 0.23], [20, 2, 0.34], [20, 60, 0.34], [7, 14, 0.34]]) {
    const samples = sampleSineWave({ frequency, sampleRate, duration, x: 35, y: 115, width: 520, amplitude: 65 });
    assert.equal(samples.length, Math.floor(sampleRate * duration) + 1);
    samples.forEach((sample, index) => {
      assert.equal(sample.time, index / sampleRate);
      assert.ok(sample.x >= 35 && sample.x <= 555);
      assert.ok(Math.abs(sample.y - (115 - 65 * Math.sin(2 * Math.PI * frequency * index / sampleRate))) < 1e-10);
      if (sampleRate === 2 * frequency) assert.ok(Math.abs(sample.y - 115) < 1e-10);
    });
  }
});

test('second-order plots preserve critical and overdamped dynamics', () => {
  assert.ok(Math.abs(secondOrderStep(1, 1, 1) - (1 - 2 / Math.E)) < 1e-12);
  for (const damping of [0.1, 0.45, 0.99999, 1, 1.00001, 1.2]) {
    assert.ok(Math.abs(secondOrderStep(0, damping, 2)) < 1e-10);
    assert.ok(Math.abs(secondOrderStep(200, damping, 2) - 1) < 1e-8);
  }
  assert.ok(secondOrderStep(1, 1.2, 1) < secondOrderStep(1, 1, 1));
  assert.ok(Math.abs(secondOrderStep(1, 0.99999, 1) - secondOrderStep(1, 1.00001, 1)) < 1e-5);
});

test('transmission voltage obeys the load boundary and electrical length', () => {
  for (const phase of [0, Math.PI / 4, Math.PI / 2, Math.PI]) {
    assert.ok(Math.abs(transmissionVoltage(1, 1.5, -1, phase)) < 1e-12);
    assert.ok(Math.abs(transmissionVoltage(1, 1.5, 1, phase) - 2 * Math.cos(phase)) < 1e-12);
  }
  assert.equal(transmissionVoltage(0.3, 1, 0, 0), Math.cos(2 * Math.PI * 0.7));
  assert.notEqual(transmissionVoltage(0.3, 1, 0), transmissionVoltage(0.3, 1.5, 0));
});
