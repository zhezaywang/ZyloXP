import assert from 'node:assert/strict';
import { test } from 'node:test';
import { digitalTiming, mosfetOperatingPoint, pidResponse, qamConstellation, relayTrip, uncertaintyModel, waveMatchScore } from '../src/atlasMath.ts';
import { secondOrderSettlingTime, secondOrderStep } from '../src/visualMath.ts';

const near = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test('digital propagation delay uses one physical time axis without capping or clipping', () => {
  for (const frequency of [1, 4, 10]) for (const delay of [2, 50, 120]) {
    const timing = digitalTiming(frequency, delay);
    near((timing.outputEdgeX - timing.inputEdgeX) / 520 * timing.durationNs, delay);
    near(timing.margin, 500 / frequency - delay);
    for (const path of [timing.inputPath, timing.outputPath]) {
      for (const [, x] of path.matchAll(/H([\d.]+)/g)) assert.ok(+x >= 35 && +x <= 555);
      assert.equal([...path.matchAll(/V/g)].length, 8);
    }
  }
  assert.equal(digitalTiming(10, 120).margin, -70);
});

test('relay trip is absent only at/below pickup and diverges continuously above it', () => {
  for (const multiple of [0.2, 1]) assert.equal(relayTrip(1000 * multiple, 1000, 1).tripTime, null);
  for (const multiple of [1.0001, 1.04, 1.5, 5, 48]) {
    const trip = relayTrip(1000 * multiple, 1000, 0.25).tripTime;
    near(trip, 0.25 * 0.14 / (multiple ** 0.02 - 1), trip * 1e-9);
  }
  assert.ok(relayTrip(5200, 5000, 1).tripTime > 178);
  near(relayTrip(6000, 1200, 0.5).tripTime, 2 * relayTrip(6000, 1200, 0.25).tripTime);
});

test('MOSFET illustrative switch conserves voltage and power throughout all allowed controls', () => {
  for (let gate = 0; gate <= 12; gate += 0.5) for (const supply of [6, 24, 48]) for (const load of [2, 8, 30]) {
    const point = mosfetOperatingPoint(gate, supply, load);
    near(supply, point.drainCurrent * load + point.drainVoltage);
    near(supply * point.drainCurrent, point.drainCurrent ** 2 * load + point.conductionLoss, 1e-8);
    assert.ok(point.drainVoltage >= 0 && point.drainVoltage <= supply);
    if (gate <= 3) assert.equal(point.drainCurrent, 0);
  }
  assert.ok(mosfetOperatingPoint(12, 48, 2).drainCurrent > 23);
});

test('uncertainty separates signed correction and bias from the standard error of the mean', () => {
  const corrected = uncertaintyModel(0.8, 0.3, 100, -0.8);
  near(corrected.mean, 10);
  near(corrected.standardUncertainty, 0.03);
  near(uncertaintyModel(2, 1, 1, 2).residualBias, 4);
  for (const bias of [-2, 0, 2]) for (const correction of [-2, 0, 2]) for (const sigma of [0.05, 1]) for (const count of [1, 100]) {
    const model = uncertaintyModel(bias, sigma, count, correction);
    near(model.standardUncertainty, sigma / Math.sqrt(count));
    assert.ok(model.meanX - model.bandWidth >= 85 && model.meanX + model.bandWidth <= 535);
    assert.ok(model.meanX - Math.SQRT2 * sigma * model.scale >= 85);
    assert.ok(model.meanX + Math.SQRT2 * sigma * model.scale <= 535);
  }
});

test('QAM energy is normalized across orders and noise amplitude scales with Es/N0', () => {
  for (const bits of [2, 4, 6]) {
    const low = qamConstellation(bits, 10);
    const high = qamConstellation(bits, 30);
    near(low.points.reduce((sum, p) => sum + p.i ** 2 + p.q ** 2, 0) / low.points.length, 1);
    near(low.sigma / high.sigma, 10);
    near(low.evmPercent / high.evmPercent, 10);
    low.points.forEach((point, index) => {
      near(point.receivedI - point.i, 10 * (high.points[index].receivedI - point.i));
      near(point.receivedQ - point.q, 10 * (high.points[index].receivedQ - point.q));
    });
    for (const snr of [5, 18, 30]) for (const point of qamConstellation(bits, snr).points) {
      const { scale } = qamConstellation(bits, snr);
      assert.ok(Math.abs(point.receivedI * scale) <= 82.00001);
      assert.ok(Math.abs(point.receivedQ * scale) <= 82.00001);
    }
  }
});

test('wave-match score follows visible RMS trace error, including wrapped phase', () => {
  const target = { amplitude: 7, frequency: 3, phase: 45 };
  assert.equal(waveMatchScore(target, target), 100);
  assert.equal(waveMatchScore({ ...target, phase: 405 }, target), 100);
  assert.equal(waveMatchScore({ ...target, amplitude: 3.5 }, target), 50);
  assert.ok(waveMatchScore({ ...target, frequency: 4 }, target) < 80);
  assert.equal(waveMatchScore({ ...target, phase: -135 }, target), 0);
});

test('PID exact solution agrees with independent RK4 integration of the stated feedback loop', () => {
  for (const kp of [0.2, 2, 8]) for (const ki of [0, 0.1, 1, 4]) for (const kd of [0, 0.5, 3]) for (const tau of [0.5, 1.5, 4]) {
    const model = pidResponse(kp, ki, kd, tau);
    const a = tau + kd;
    let y = kd / a, integral = 0;
    const dt = 0.002;
    const rhs = (y, integral) => [(kp * (1 - y) + ki * integral - y) / a, 1 - y];
    for (let step = 1; step <= 4000; step++) {
      const k1 = rhs(y, integral);
      const k2 = rhs(y + dt / 2 * k1[0], integral + dt / 2 * k1[1]);
      const k3 = rhs(y + dt / 2 * k2[0], integral + dt / 2 * k2[1]);
      const k4 = rhs(y + dt * k3[0], integral + dt * k3[1]);
      y += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
      integral += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      if (step % 125 === 0) near(model.at(step * dt), y, 2e-8);
      assert.ok(y <= model.peak + 1e-8);
    }
    near(model.at(0), kd / a);
    near(model.finalValue, ki === 0 ? kp / (1 + kp) : 1);
    near(model.steadyError, (1 - model.finalValue) * 100);
    for (let i = 0; i < 100; i++) {
      const at = model.at(model.settlingTime + i * Math.max(0.01, model.settlingTime / 20));
      assert.ok(Math.abs(at - model.finalValue) <= model.finalValue * 0.02000001);
    }
    if (model.settlingTime > 1e-6) assert.ok(Math.abs(model.at(model.settlingTime - 1e-6) - model.finalValue) > model.finalValue * 0.02);
  }
});

test('PID handles critical poles, pure P offset and ideal derivative feedthrough', () => {
  const p = pidResponse(2, 0, 0, 1.5);
  near(p.at(1), 2 / 3 * (1 - Math.exp(-2)));
  near(p.settlingTime, -Math.log(0.02) / 2);
  near(pidResponse(1, 1, 0, 1).at(1), 1 - Math.exp(-1));
  near(pidResponse(0.2, 0, 3, 0.5).at(0), 3 / 3.5);
  assert.ok(pidResponse(0.2, 0, 3, 0.5).overshoot > 400);
});

test('all three PID challenges remain solvable with the physical model', () => {
  for (const [tau, maxOvershoot, maxSettling, kp, ki] of [[1.2, 10, 2.8, 4, 4], [0.8, 18, 1.8, 2, 3], [2.2, 6, 4, 8, 4]]) {
    const model = pidResponse(kp, ki, 0, tau);
    assert.ok(model.overshoot <= maxOvershoot);
    assert.ok(model.settlingTime <= maxSettling);
    assert.equal(model.steadyError, 0);
  }
});

test('shared settling helper matches the plotted second-order response over damping regimes', () => {
  for (const damping of [0.1, 0.45, 0.7, 0.99, 1, 1.01, 1.5]) for (const frequency of [0.5, 2.2, 5]) {
    const settling = secondOrderSettlingTime(damping, frequency);
    near(Math.abs(1 - secondOrderStep(settling, damping, frequency)), 0.02, 1e-9);
    for (let index = 0; index < 200; index++) assert.ok(Math.abs(1 - secondOrderStep(settling + index * 0.1 / frequency, damping, frequency)) <= 0.02000001);
  }
});
