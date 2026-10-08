// Atlas-only models. Units and idealizations are stated beside each explorer.
export function relayTrip(faultCurrent: number, pickupCurrent: number, timeMultiplier: number) {
  const multiple = faultCurrent / pickupCurrent;
  return {
    multiple,
    tripTime: multiple <= 1 ? null : timeMultiplier * 0.14 / Math.expm1(0.02 * Math.log(multiple)),
  };
}

export function digitalTiming(frequencyMHz: number, delayNs: number) {
  const periodNs = 1000 / frequencyMHz;
  const durationNs = periodNs * 4;
  const xAt = (time: number) => 35 + time / durationNs * 520;
  const path = (delay: number, low: number) => {
    const levelAt = (time: number) => ((Math.floor(2 * (time - delay) / periodNs) % 2 + 2) % 2 ? low - 40 : low);
    let result = `M35 ${levelAt(0)}`;
    for (let edge = Math.floor(-2 * delay / periodNs) + 1; ; edge++) {
      const time = delay + edge * periodNs / 2;
      if (time > durationNs) break;
      result += `H${xAt(time)}V${levelAt(time + periodNs * 1e-9)}`;
    }
    return `${result}H555`;
  };
  return {
    periodNs, durationNs,
    margin: periodNs / 2 - delayNs,
    inputPath: path(0, 75),
    outputPath: path(delayNs, 155),
    inputEdgeX: xAt(periodNs / 2),
    outputEdgeX: xAt(periodNs / 2 + delayNs),
  };
}

export function mosfetOperatingPoint(gateVoltage: number, supplyVoltage: number, loadResistance: number) {
  const on = gateVoltage > 3;
  const onResistance = on ? 0.035 + 0.32 / (gateVoltage - 3) ** 2 : 0;
  const drainCurrent = on ? supplyVoltage / (loadResistance + onResistance) : 0;
  const drainVoltage = supplyVoltage - drainCurrent * loadResistance;
  return { on, onResistance, drainCurrent, drainVoltage, conductionLoss: drainCurrent * drainVoltage };
}

export function uncertaintyModel(bias: number, noiseSigma: number, count: number, correction: number) {
  // A correction is ADDED to the indicated result (NIST TN 1297 D.1.1.7).
  const residualBias = bias + correction;
  const standardUncertainty = noiseSigma / Math.sqrt(count);
  const mean = 10 * (1 + residualBias / 100);
  const extent = Math.max(1, Math.abs(residualBias) + 2 * noiseSigma);
  const scale = 225 / extent;
  return { residualBias, standardUncertainty, mean, extent, scale,
    meanX: 310 + residualBias * scale, bandWidth: standardUncertainty * scale };
}

export function qamConstellation(bits: number, esN0Db: number) {
  const order = 2 ** bits;
  const side = Math.sqrt(order);
  const normalization = Math.sqrt(2 * (order - 1) / 3);
  const sigma = Math.sqrt(1 / (2 * 10 ** (esN0Db / 10)));
  let seed = 0x12345678;
  const uniform = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return (seed + 0.5) / 2 ** 32;
  };
  const points = Array.from({ length: order }, (_, index) => {
    const i = (2 * (index % side) - side + 1) / normalization;
    const q = (2 * Math.floor(index / side) - side + 1) / normalization;
    const radius = Math.sqrt(-2 * Math.log(uniform()));
    const angle = 2 * Math.PI * uniform();
    return { i, q, receivedI: i + sigma * radius * Math.cos(angle), receivedQ: q + sigma * radius * Math.sin(angle) };
  });
  const extent = Math.max(1.5, ...points.flatMap((point) => [Math.abs(point.receivedI), Math.abs(point.receivedQ)]));
  return { points, scale: 82 / extent, sigma, evmPercent: 100 / Math.sqrt(10 ** (esN0Db / 10)) };
}

export function waveMatchScore(
  signal: { amplitude: number; frequency: number; phase: number },
  target: { amplitude: number; frequency: number; phase: number },
) {
  const value = (wave: typeof signal, time: number) => wave.amplitude * Math.cos(2 * Math.PI * wave.frequency * time + wave.phase * Math.PI / 180);
  let squaredError = 0;
  let targetEnergy = 0;
  for (let index = 0; index <= 512; index++) {
    const weight = index === 0 || index === 512 ? 0.5 : 1;
    const targetValue = value(target, index / 512 * 0.5);
    squaredError += weight * (value(signal, index / 512 * 0.5) - targetValue) ** 2;
    targetEnergy += weight * targetValue ** 2;
  }
  return Math.max(0, Math.round(100 * (1 - Math.sqrt(squaredError / targetEnergy))));
}

// Unity feedback, G(s)=1/(tau*s+1), C(s)=Kp+Ki/s+Kd*s (ideal, unfiltered).
// T(s)=(Kd*s^2+Kp*s+Ki)/((tau+Kd)*s^2+(1+Kp)*s+Ki).
export function pidResponse(kp: number, ki: number, kd: number, tau = 1.5) {
  const a = tau + kd;
  const initialValue = kd / a;
  const finalValue = ki === 0 ? kp / (1 + kp) : 1;
  const z0 = initialValue - finalValue;
  const velocity = (kp - (1 + kp) * initialValue) / a;
  const alpha = (1 + kp) / (2 * a);
  const discriminant = alpha ** 2 - ki / a;
  const extrema: number[] = [0];
  let at: (time: number) => number;
  let horizon: number;

  if (ki === 0) {
    const rate = (1 + kp) / a;
    at = (t) => finalValue + z0 * Math.exp(-rate * Math.max(0, t));
    horizon = 16 / rate;
  } else if (Math.abs(discriminant) < 1e-10) {
    const b = velocity + alpha * z0;
    at = (t) => 1 + (z0 + b * t) * Math.exp(-alpha * t);
    horizon = 24 / alpha;
    const extremum = velocity / (alpha * b);
    if (extremum > 0 && extremum < horizon) extrema.push(extremum);
  } else if (discriminant < 0) {
    const omega = Math.sqrt(-discriminant);
    const b = (velocity + alpha * z0) / omega;
    at = (t) => 1 + Math.exp(-alpha * t) * (z0 * Math.cos(omega * t) + b * Math.sin(omega * t));
    horizon = Math.log(Math.max(1, Math.hypot(z0, b)) / 1e-8) / alpha;
    const sineCoefficient = -alpha * b - omega * z0;
    const angle = (Math.atan2(-velocity, sineCoefficient) % Math.PI + Math.PI) % Math.PI;
    for (let t = angle / omega; t < horizon; t += Math.PI / omega) {
      if (t > 1e-10) extrema.push(t);
    }
  } else {
    const root = Math.sqrt(discriminant);
    const fast = alpha + root;
    const slow = (ki / a) / fast;
    const cSlow = (velocity + fast * z0) / (fast - slow);
    const cFast = z0 - cSlow;
    at = (t) => 1 + cSlow * Math.exp(-slow * t) + cFast * Math.exp(-fast * t);
    horizon = Math.log(Math.max(1, Math.abs(cSlow) + Math.abs(cFast)) / 1e-8) / slow;
    const extremum = Math.log(-fast * cFast / (slow * cSlow)) / (fast - slow);
    if (extremum > 0 && extremum < horizon) extrema.push(extremum);
  }

  // Between successive extrema the response is monotone. The last out-of-band
  // extremum brackets the final 2% crossing, even for long overdamped tails.
  const tolerance = 0.02 * finalValue;
  const knots = [...extrema, horizon];
  let settlingTime = 0;
  for (let index = knots.length - 2; index >= 0; index--) {
    if (Math.abs(at(knots[index]) - finalValue) <= tolerance) continue;
    let low = knots[index];
    let high = knots[index + 1];
    for (let iteration = 0; iteration < 60; iteration++) {
      const middle = (low + high) / 2;
      if (Math.abs(at(middle) - finalValue) > tolerance) low = middle;
      else high = middle;
    }
    settlingTime = high;
    break;
  }
  const peak = Math.max(finalValue, ...extrema.map(at));
  return { at, initialValue, finalValue, peak, settlingTime,
    overshoot: (peak / finalValue - 1) * 100,
    steadyError: (1 - finalValue) * 100,
    damping: ki > 0 ? alpha / Math.sqrt(ki / a) : null,
    stable: true };
}
