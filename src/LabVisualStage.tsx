import {
  Activity,
  CheckCircle2,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Pause,
  Play,
} from 'lucide-react';
import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import type { LabScenario } from './data';
import { calculateLabMetrics } from './labMetrics';
import type { LabMetrics, LabSimulationValues } from './labMetrics';
import { resolvePublicAssetPath } from './publicAsset';
import { useVisualInspector } from './useVisualInspector';

type LabSchematicProps = {
  compact?: boolean;
  lab: LabScenario;
  running?: boolean;
  values: LabSimulationValues;
};

type LabVisualStageProps = {
  baseline?: boolean;
  lab: LabScenario;
  values: LabSimulationValues;
};

type LabVisualIds = {
  axial: string;
  backdrop: string;
  ceramic: string;
  glow: string;
  grid: string;
  lcd: string;
  metal: string;
  scope: string;
  shadow: string;
  source: string;
};

const resistorDigitColors = [
  '#161c1f',
  '#7a3f1d',
  '#d94747',
  '#e98120',
  '#e5bf32',
  '#2e9d62',
  '#3478c8',
  '#7650a8',
  '#77848b',
  '#f5f1df',
];

function getResistorBandColors(resistanceOhms: number) {
  const safeResistance = Math.max(1, Math.round(resistanceOhms));
  const multiplier = Math.max(
    0,
    Math.min(9, Math.floor(Math.log10(safeResistance)) - 1),
  );
  const significant = Math.max(
    10,
    Math.min(99, Math.round(safeResistance / 10 ** multiplier)),
  );

  return [
    resistorDigitColors[Math.floor(significant / 10)],
    resistorDigitColors[significant % 10],
    resistorDigitColors[multiplier],
    '#d4af37',
  ];
}

function makeScopeSinePath({
  amplitude,
  centerY = 110,
  cycles = 2.5,
  phase = 0,
  samples = 72,
  width = 194,
  x = 30,
}: {
  amplitude: number;
  centerY?: number;
  cycles?: number;
  phase?: number;
  samples?: number;
  width?: number;
  x?: number;
}) {
  return Array.from({ length: samples + 1 }, (_, index) => {
    const progress = index / samples;
    const pointX = x + progress * width;
    const pointY =
      centerY -
      Math.sin(
        progress * Math.PI * 2 * cycles + (phase * Math.PI) / 180,
      ) *
        amplitude;
    return `${index === 0 ? 'M' : 'L'}${pointX.toFixed(2)} ${pointY.toFixed(
      2,
    )}`;
  }).join(' ');
}

function makeClippedScopeSinePath({
  amplitude,
  centerY,
  clipRatio,
  cycles = 2.2,
  phase = 180,
  samples = 90,
  width = 190,
  x = 30,
}: {
  amplitude: number;
  centerY: number;
  clipRatio: number;
  cycles?: number;
  phase?: number;
  samples?: number;
  width?: number;
  x?: number;
}) {
  const safeClipRatio = Math.max(0.08, Math.min(1, clipRatio));

  return Array.from({ length: samples + 1 }, (_, index) => {
    const progress = index / samples;
    const sineValue = Math.sin(
      progress * Math.PI * 2 * cycles + (phase * Math.PI) / 180,
    );
    const clippedValue = Math.max(
      -safeClipRatio,
      Math.min(safeClipRatio, sineValue),
    );
    const pointX = x + progress * width;
    const pointY = centerY - clippedValue * amplitude;

    return `${index === 0 ? 'M' : 'L'}${pointX.toFixed(2)} ${pointY.toFixed(
      2,
    )}`;
  }).join(' ');
}

function makeLogicLevelPath({
  highY,
  lowY,
  startHigh = false,
  transitions,
  width = 170,
  x = 46,
}: {
  highY: number;
  lowY: number;
  startHigh?: boolean;
  transitions: number[];
  width?: number;
  x?: number;
}) {
  let isHigh = startHigh;
  let path = `M${x} ${isHigh ? highY : lowY}`;

  transitions
    .filter((transition) => transition > 0 && transition < 1)
    .sort((left, right) => left - right)
    .forEach((transition) => {
      const transitionX = x + transition * width;
      isHigh = !isHigh;
      path += ` H${transitionX.toFixed(2)} V${isHigh ? highY : lowY}`;
    });

  return `${path} H${x + width}`;
}

function finiteOr(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback;
}

function stabilizeLabValues(
  values: LabSimulationValues,
): LabSimulationValues {
  return {
    ...values,
    adcBitDepth: finiteOr(values.adcBitDepth, 10),
    adcFilterCutoff: finiteOr(values.adcFilterCutoff, 3),
    adcInputAmplitude: finiteOr(values.adcInputAmplitude, 1.2),
    adcInputFrequency: finiteOr(values.adcInputFrequency, 1),
    adcReferenceVoltage: finiteOr(values.adcReferenceVoltage, 3.3),
    adcSampleRate: finiteOr(values.adcSampleRate, 8),
    bjtBaseCurrent: finiteOr(values.bjtBaseCurrent, 20),
    bjtCollectorResistance: finiteOr(values.bjtCollectorResistance, 2.2),
    bjtCurrentGain: finiteOr(values.bjtCurrentGain, 90),
    bjtSupplyVoltage: finiteOr(values.bjtSupplyVoltage, 12),
    bjtTemperature: finiteOr(values.bjtTemperature, 25),
    mosfetBusVoltage: finiteOr(values.mosfetBusVoltage, 24),
    mosfetDutyCycle: finiteOr(values.mosfetDutyCycle, 50),
    mosfetGateResistance: finiteOr(values.mosfetGateResistance, 10),
    mosfetGateVoltage: finiteOr(values.mosfetGateVoltage, 8),
    mosfetLoadResistance: finiteOr(values.mosfetLoadResistance, 8),
    mosfetSwitchingFrequency: finiteOr(
      values.mosfetSwitchingFrequency,
      50,
    ),
    pidDerivativeGain: finiteOr(values.pidDerivativeGain, 0.35),
    pidIntegralGain: finiteOr(values.pidIntegralGain, 0.6),
    pidPlantTimeConstant: finiteOr(values.pidPlantTimeConstant, 1.5),
    pidProportionalGain: finiteOr(values.pidProportionalGain, 1.6),
    pidSetpoint: finiteOr(values.pidSetpoint, 60),
    resonanceCapacitance: finiteOr(values.resonanceCapacitance, 2.5),
    resonanceFrequency: finiteOr(values.resonanceFrequency, 1000),
    resonanceInductance: finiteOr(values.resonanceInductance, 10),
    resonanceResistance: finiteOr(values.resonanceResistance, 12),
    resonanceSourceVoltage: finiteOr(values.resonanceSourceVoltage, 5),
    transformerCoreArea: finiteOr(values.transformerCoreArea, 12),
    transformerFrequency: finiteOr(values.transformerFrequency, 60),
    transformerLoadResistance: finiteOr(
      values.transformerLoadResistance,
      10,
    ),
    transformerPrimaryTurns: finiteOr(values.transformerPrimaryTurns, 500),
    transformerPrimaryVoltage: finiteOr(
      values.transformerPrimaryVoltage,
      120,
    ),
    transformerSecondaryTurns: finiteOr(
      values.transformerSecondaryTurns,
      105,
    ),
    transformerWindingResistance: finiteOr(
      values.transformerWindingResistance,
      0.5,
    ),
  };
}

function stabilizeLabMetrics(metrics: LabMetrics): LabMetrics {
  return {
    ...metrics,
    adcAliased:
      typeof metrics.adcAliased === 'boolean' ? metrics.adcAliased : false,
    adcClipped:
      typeof metrics.adcClipped === 'boolean' ? metrics.adcClipped : false,
    adcDisplayedFrequency: finiteOr(metrics.adcDisplayedFrequency, 1),
    adcEffectiveSnr: finiteOr(metrics.adcEffectiveSnr, 58.7),
    adcFilterGain: finiteOr(metrics.adcFilterGain, 0.949),
    adcFilteredAmplitude: finiteOr(metrics.adcFilteredAmplitude, 1.14),
    adcLsbMillivolts: finiteOr(metrics.adcLsbMillivolts, 3.22),
    adcNyquistFrequency: finiteOr(metrics.adcNyquistFrequency, 4),
    adcPeakCode: finiteOr(metrics.adcPeakCode, 353),
    adcSamplesPerCycle: finiteOr(metrics.adcSamplesPerCycle, 8),
    bjtAdjustedBeta: finiteOr(metrics.bjtAdjustedBeta, 90),
    bjtBaseEmitterVoltage: finiteOr(metrics.bjtBaseEmitterVoltage, 0.67),
    bjtCollectorCurrent: finiteOr(metrics.bjtCollectorCurrent, 1.8),
    bjtCollectorPower: finiteOr(metrics.bjtCollectorPower, 14.47),
    bjtCollectorResistorPower: finiteOr(
      metrics.bjtCollectorResistorPower,
      7.13,
    ),
    bjtCollectorVoltage: finiteOr(metrics.bjtCollectorVoltage, 8.04),
    bjtCutoff:
      typeof metrics.bjtCutoff === 'boolean' ? metrics.bjtCutoff : false,
    bjtForcedBeta: finiteOr(metrics.bjtForcedBeta, 90),
    bjtIdealCollectorCurrent: finiteOr(
      metrics.bjtIdealCollectorCurrent,
      1.8,
    ),
    bjtJunctionTemperature: finiteOr(metrics.bjtJunctionTemperature, 27.2),
    bjtLoadLineCurrent: finiteOr(metrics.bjtLoadLineCurrent, 5.45),
    bjtSaturated:
      typeof metrics.bjtSaturated === 'boolean'
        ? metrics.bjtSaturated
        : false,
    bjtSaturationMargin: finiteOr(metrics.bjtSaturationMargin, 7.86),
    bjtTransconductance: finiteOr(metrics.bjtTransconductance, 69.6),
    mosfetConductionLoss: finiteOr(metrics.mosfetConductionLoss, 0.16),
    mosfetDrainCurrent: finiteOr(metrics.mosfetDrainCurrent, 2.99),
    mosfetDrainVoltage: finiteOr(metrics.mosfetDrainVoltage, 0.11),
    mosfetEfficiency: finiteOr(metrics.mosfetEfficiency, 99.1),
    mosfetGateDriveLoss: finiteOr(metrics.mosfetGateDriveLoss, 0.014),
    mosfetJunctionTemperature: finiteOr(
      metrics.mosfetJunctionTemperature,
      32,
    ),
    mosfetLoadPower: finiteOr(metrics.mosfetLoadPower, 35.7),
    mosfetOn:
      typeof metrics.mosfetOn === 'boolean' ? metrics.mosfetOn : true,
    mosfetOnResistance: finiteOr(metrics.mosfetOnResistance, 0.0352),
    mosfetSwitchingLoss: finiteOr(metrics.mosfetSwitchingLoss, 0.15),
    mosfetTotalLoss: finiteOr(metrics.mosfetTotalLoss, 0.32),
    mosfetTransitionTime: finiteOr(metrics.mosfetTransitionTime, 43),
    pidControlEffort: finiteOr(metrics.pidControlEffort, 33),
    pidDampingRatio: finiteOr(metrics.pidDampingRatio, 0.7),
    pidFinalValue: finiteOr(metrics.pidFinalValue, 59.3),
    pidNaturalFrequency: finiteOr(metrics.pidNaturalFrequency, 1.74),
    pidOvershoot: finiteOr(metrics.pidOvershoot, 4.5),
    pidRiseTime: finiteOr(metrics.pidRiseTime, 1.03),
    pidSettlingTime: finiteOr(metrics.pidSettlingTime, 3.27),
    pidSteadyStateError: finiteOr(metrics.pidSteadyStateError, 0.7),
    resonanceBandwidth: finiteOr(metrics.resonanceBandwidth, 191),
    resonanceCapacitiveReactance: finiteOr(
      metrics.resonanceCapacitiveReactance,
      63.7,
    ),
    resonanceCapacitorVoltage: finiteOr(
      metrics.resonanceCapacitorVoltage,
      26.5,
    ),
    resonanceCurrent: finiteOr(metrics.resonanceCurrent, 0.417),
    resonanceCurrentRatio: finiteOr(metrics.resonanceCurrentRatio, 1),
    resonanceFrequency: finiteOr(metrics.resonanceFrequency, 1007),
    resonanceImpedance: finiteOr(metrics.resonanceImpedance, 12),
    resonanceInductiveReactance: finiteOr(
      metrics.resonanceInductiveReactance,
      62.8,
    ),
    resonanceInductorVoltage: finiteOr(
      metrics.resonanceInductorVoltage,
      26.2,
    ),
    resonanceLowerCutoff: finiteOr(metrics.resonanceLowerCutoff, 916),
    resonanceNearPeak:
      typeof metrics.resonanceNearPeak === 'boolean'
        ? metrics.resonanceNearPeak
        : true,
    resonancePeakCurrent: finiteOr(metrics.resonancePeakCurrent, 0.417),
    resonancePhase: finiteOr(metrics.resonancePhase, -4.2),
    resonanceQualityFactor: finiteOr(metrics.resonanceQualityFactor, 5.27),
    resonanceReactiveDifference: finiteOr(
      metrics.resonanceReactiveDifference,
      -0.84,
    ),
    resonanceResistorPower: finiteOr(metrics.resonanceResistorPower, 2.08),
    resonanceUpperCutoff: finiteOr(metrics.resonanceUpperCutoff, 1107),
    transformerCoreLoss: finiteOr(metrics.transformerCoreLoss, 1.05),
    transformerCopperLoss: finiteOr(metrics.transformerCopperLoss, 2.88),
    transformerEfficiency: finiteOr(metrics.transformerEfficiency, 93.6),
    transformerFluxDensity: finiteOr(metrics.transformerFluxDensity, 0.75),
    transformerIdealSecondaryVoltage: finiteOr(
      metrics.transformerIdealSecondaryVoltage,
      25.2,
    ),
    transformerLoadPercent: finiteOr(metrics.transformerLoadPercent, 57),
    transformerMagnetizingCurrent: finiteOr(
      metrics.transformerMagnetizingCurrent,
      0.046,
    ),
    transformerOutputPower: finiteOr(metrics.transformerOutputPower, 57.6),
    transformerPrimaryCurrent: finiteOr(metrics.transformerPrimaryCurrent, 0.51),
    transformerRegulation: finiteOr(metrics.transformerRegulation, 5),
    transformerSaturated:
      typeof metrics.transformerSaturated === 'boolean'
        ? metrics.transformerSaturated
        : false,
    transformerSecondaryCurrent: finiteOr(
      metrics.transformerSecondaryCurrent,
      2.4,
    ),
    transformerSecondaryVoltage: finiteOr(
      metrics.transformerSecondaryVoltage,
      24,
    ),
    transformerTemperatureRise: finiteOr(
      metrics.transformerTemperatureRise,
      18,
    ),
    transformerTotalLoss: finiteOr(metrics.transformerTotalLoss, 3.93),
    transformerTurnsRatio: finiteOr(metrics.transformerTurnsRatio, 0.21),
  };
}

function makePidStepResponsePath({
  dampingRatio,
  duration = 8,
  finalValue,
  naturalFrequency,
  samples = 110,
  setpoint,
  width = 178,
  x = 24,
  yBase = 158,
  yTop = 50,
}: {
  dampingRatio: number;
  duration?: number;
  finalValue: number;
  naturalFrequency: number;
  samples?: number;
  setpoint: number;
  width?: number;
  x?: number;
  yBase?: number;
  yTop?: number;
}) {
  const safeSetpoint = Math.max(1, setpoint);
  const finalRatio = finalValue / safeSetpoint;

  return Array.from({ length: samples + 1 }, (_, index) => {
    const progress = index / samples;
    const time = progress * duration;
    let responseRatio: number;

    if (dampingRatio < 1) {
      const safeDamping = Math.max(0.05, dampingRatio);
      const dampedFrequency =
        naturalFrequency * Math.sqrt(1 - safeDamping ** 2);
      const phase = Math.acos(safeDamping);

      responseRatio =
        finalRatio *
        (1 -
          (Math.exp(-safeDamping * naturalFrequency * time) /
            Math.sqrt(1 - safeDamping ** 2)) *
            Math.sin(dampedFrequency * time + phase));
    } else {
      const responseRate =
        naturalFrequency / Math.max(1, 0.6 + dampingRatio * 0.55);
      responseRatio = finalRatio * (1 - Math.exp(-responseRate * time));
    }

    const clampedRatio = Math.max(-0.04, Math.min(1.35, responseRatio));
    const pointX = x + progress * width;
    const pointY = yBase - clampedRatio * (yBase - yTop);

    return `${index === 0 ? 'M' : 'L'}${pointX.toFixed(2)} ${pointY.toFixed(
      2,
    )}`;
  }).join(' ');
}

function makeResonanceResponsePath({
  capacitanceMicrofarads,
  centerFrequency,
  height,
  inductanceMillihenries,
  resistance,
  width,
  x,
  y,
}: {
  capacitanceMicrofarads: number;
  centerFrequency: number;
  height: number;
  inductanceMillihenries: number;
  resistance: number;
  width: number;
  x: number;
  y: number;
}) {
  const inductance = inductanceMillihenries / 1000;
  const capacitance = capacitanceMicrofarads * 1e-6;
  const minimumFrequency = centerFrequency / 4;
  const maximumFrequency = centerFrequency * 4;
  const logarithmicSpan = Math.log(maximumFrequency / minimumFrequency);

  return Array.from({ length: 101 }, (_, index) => {
    const progress = index / 100;
    const frequency =
      minimumFrequency * Math.exp(progress * logarithmicSpan);
    const angularFrequency = 2 * Math.PI * frequency;
    const reactance =
      angularFrequency * inductance -
      1 / (angularFrequency * capacitance);
    const normalizedCurrent =
      resistance / Math.sqrt(resistance ** 2 + reactance ** 2);
    const pointX = x + progress * width;
    const pointY = y + height - normalizedCurrent * height;

    return `${index === 0 ? 'M' : 'L'}${pointX.toFixed(2)} ${pointY.toFixed(
      2,
    )}`;
  }).join(' ');
}

function makeBjtOutputCurvePath({
  baseCurrentMicroamps,
  beta,
  height,
  maximumCurrent,
  supplyVoltage,
  width,
  x,
  y,
}: {
  baseCurrentMicroamps: number;
  beta: number;
  height: number;
  maximumCurrent: number;
  supplyVoltage: number;
  width: number;
  x: number;
  y: number;
}) {
  const targetCurrent =
    (baseCurrentMicroamps * beta) / 1000;

  return Array.from({ length: 61 }, (_, index) => {
    const progress = index / 60;
    const collectorVoltage = progress * supplyVoltage;
    const kneeResponse =
      1 - Math.exp(-collectorVoltage / 0.22);
    const earlyEffect =
      1 + 0.025 * (collectorVoltage / supplyVoltage);
    const collectorCurrent = Math.min(
      maximumCurrent,
      targetCurrent * kneeResponse * earlyEffect,
    );
    const pointX = x + progress * width;
    const pointY =
      y +
      height -
      Math.min(1, collectorCurrent / maximumCurrent) * height;

    return `${index === 0 ? 'M' : 'L'}${pointX.toFixed(2)} ${pointY.toFixed(
      2,
    )}`;
  }).join(' ');
}

function LabBattery({
  ids,
  label,
  x,
  y,
}: {
  ids: LabVisualIds;
  label: string;
  x: number;
  y: number;
}) {
  return (
    <g className="labSourceAssembly">
      <line className="labWire" x1={x} y1={y - 48} x2={x} y2={y - 42} />
      <line className="labWire" x1={x} y1={y + 42} x2={x} y2={y + 48} />
      <rect
        className="labSourceBody"
        filter={`url(#${ids.shadow})`}
        height={84}
        rx={9}
        style={{ fill: `url(#${ids.source})` }}
        width={78}
        x={x - 39}
        y={y - 42}
      />
      <rect
        className="labSourceInset"
        height={66}
        rx={6}
        width={62}
        x={x - 31}
        y={y - 33}
      />
      <circle className="labSourceTerminal positive" cx={x} cy={y - 42} r={5} />
      <circle className="labSourceTerminal" cx={x} cy={y + 42} r={5} />
      <text className="labSourceCaption" x={x} y={y - 21} textAnchor="middle">
        DC SOURCE
      </text>
      <line className="labAccent" x1={x - 22} y1={y - 7} x2={x + 22} y2={y - 7} />
      <line className="labAccent" x1={x - 12} y1={y + 7} x2={x + 12} y2={y + 7} />
      <text className="labPolarity" x={x + 25} y={y - 3}>
        +
      </text>
      <text className="labPolarity" x={x + 25} y={y + 17}>
        −
      </text>
      <text className="labSourceValue" x={x} y={y + 29} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

function LabResistor({
  bandColors = resistorDigitColors.slice(1, 5),
  ids,
  label,
  length = 120,
  variant = 'signal',
  x,
  y,
}: {
  bandColors?: string[];
  ids: LabVisualIds;
  label: string;
  length?: number;
  variant?: 'power' | 'signal';
  x: number;
  y: number;
}) {
  const bodyX = x + 22;
  const bodyWidth = length - 44;

  return (
    <g className={`labResistorAssembly ${variant}`}>
      <line className="labWire" x1={x} y1={y} x2={bodyX} y2={y} />
      {variant === 'power' && (
        <rect
          className="labHeatHalo"
          height={44}
          rx={18}
          width={bodyWidth + 14}
          x={bodyX - 7}
          y={y - 22}
        />
      )}
      <rect
        className="labResistorBody"
        filter={`url(#${ids.shadow})`}
        height={variant === 'power' ? 30 : 22}
        rx={variant === 'power' ? 4 : 10}
        style={{
          fill: `url(#${variant === 'power' ? ids.ceramic : ids.axial})`,
        }}
        width={bodyWidth}
        x={bodyX}
        y={y - (variant === 'power' ? 15 : 11)}
      />
      <rect
        className="labResistorEndCap left"
        height={variant === 'power' ? 24 : 17}
        rx={3}
        width={8}
        x={bodyX + 3}
        y={y - (variant === 'power' ? 12 : 8.5)}
      />
      <rect
        className="labResistorEndCap right"
        height={variant === 'power' ? 24 : 17}
        rx={3}
        width={8}
        x={bodyX + bodyWidth - 11}
        y={y - (variant === 'power' ? 12 : 8.5)}
      />
      {variant === 'signal' && (
        <>
          {bandColors.slice(0, 4).map((color, index) => (
            <rect
              className={`labResistorBand band${index + 1}`}
              height={22}
              key={`${color}-${index}`}
              style={{ fill: color }}
              width={index === 3 ? 3 : 5}
              x={bodyX + [22, 34, 48, 61][index]}
              y={y - 11}
            />
          ))}
        </>
      )}
      {variant === 'power' && (
        <text className="labComponentMark" x={x + length / 2} y={y + 4} textAnchor="middle">
          POWER LOAD
        </text>
      )}
      <line className="labWire" x1={bodyX + bodyWidth} y1={y} x2={x + length} y2={y} />
      <text className="labValue" x={x + length / 2} y={y - 22} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

function LabCapacitor({
  ids,
  label,
  x,
  y,
}: {
  ids: LabVisualIds;
  label: string;
  x: number;
  y: number;
}) {
  return (
    <g className="labCapacitorAssembly">
      <line className="labWire" x1={x} y1={y - 50} x2={x} y2={y - 13} />
      <rect
        className="labCapacitorBody"
        filter={`url(#${ids.shadow})`}
        height={38}
        rx={7}
        width={62}
        x={x - 31}
        y={y - 19}
      />
      <rect className="labCapacitorCharge" height={28} rx={8} width={52} x={x - 26} y={y - 14} />
      <line className="labAccent" x1={x - 25} y1={y - 10} x2={x + 25} y2={y - 10} />
      <line className="labAccent" x1={x - 25} y1={y + 10} x2={x + 25} y2={y + 10} />
      <line className="labWire" x1={x} y1={y + 13} x2={x} y2={y + 50} />
      <text className="labValue" x={x + 34} y={y + 5}>
        {label}
      </text>
    </g>
  );
}

function LabFlow({ d, className = '' }: { className?: string; d: string }) {
  return (
    <>
      <path className={`labFlowGlow ${className}`} d={d} />
      <path className={`labFlow ${className}`} d={d} />
    </>
  );
}

function LabInstrument({
  detail,
  ids,
  label,
  unit,
  value,
  x,
  y,
}: {
  detail: string;
  ids: LabVisualIds;
  label: string;
  unit: string;
  value: string;
  x: number;
  y: number;
}) {
  const dialTicks = [-120, -90, -60, -30, 0, 30, 60, 90, 120];

  return (
    <g className="labInstrument">
      <rect
        className="labInstrumentBody"
        filter={`url(#${ids.shadow})`}
        height={175}
        rx={11}
        style={{ fill: `url(#${ids.metal})` }}
        width={170}
        x={x}
        y={y}
      />
      <rect className="labInstrumentBezel" x={x + 7} y={y + 7} width={156} height={161} rx={8} />
      {[
        [x + 12, y + 12],
        [x + 158, y + 12],
        [x + 12, y + 163],
        [x + 158, y + 163],
      ].map(([screwX, screwY]) => (
        <g className="labInstrumentScrew" key={`${screwX}-${screwY}`}>
          <circle cx={screwX} cy={screwY} r={3.2} />
          <line x1={screwX - 1.7} x2={screwX + 1.7} y1={screwY} y2={screwY} />
        </g>
      ))}
      <text className="labInstrumentBrand" x={x + 16} y={y + 24}>
        {label}
      </text>
      <text className="labInstrumentCategory" x={x + 16} y={y + 34}>
        CAT III · TRUE RMS
      </text>
      <circle className="labInstrumentLedHalo" cx={x + 148} cy={y + 19} r={9} />
      <circle className="labInstrumentLed" cx={x + 148} cy={y + 19} r={5} />
      <rect
        className="labInstrumentScreen"
        height={70}
        rx={5}
        style={{ fill: `url(#${ids.lcd})` }}
        width={142}
        x={x + 14}
        y={y + 38}
      />
      <path className="labInstrumentGlare" d={`M${x + 20} ${y + 44} H${x + 92} L${x + 76} ${y + 53} H${x + 20} Z`} />
      <text className="labInstrumentMode" x={x + 24} y={y + 58}>
        {detail}
      </text>
      <text className="labInstrumentGhost" x={x + 146} y={y + 87} textAnchor="end">
        8.8.8.8
      </text>
      <text className="labInstrumentValue" x={x + 146} y={y + 87} textAnchor="end">
        {value}
      </text>
      <text className="labInstrumentUnit" x={x + 146} y={y + 104} textAnchor="end">
        {unit}
      </text>
      {dialTicks.map((angle) => (
        <line
          className="labInstrumentTick"
          key={angle}
          transform={`rotate(${angle} ${x + 62} ${y + 140})`}
          x1={x + 62}
          x2={x + 62}
          y1={y + 112}
          y2={y + 117}
        />
      ))}
      <circle className="labInstrumentDialRing" cx={x + 62} cy={y + 140} r={25} />
      <circle className="labInstrumentDial" cx={x + 62} cy={y + 140} r={21} />
      <circle className="labInstrumentDialCap" cx={x + 62} cy={y + 140} r={13} />
      <line className="labInstrumentPointer" x1={x + 62} y1={y + 140} x2={x + 74} y2={y + 123} />
      <circle className="labJackRing positive" cx={x + 124} cy={y + 138} r={12} />
      <circle className="labJackRing" cx={x + 148} cy={y + 138} r={12} />
      <circle className="labJack positive" cx={x + 124} cy={y + 138} r={10} />
      <circle className="labJack" cx={x + 148} cy={y + 138} r={10} />
      <circle className="labJackSocket" cx={x + 124} cy={y + 138} r={4} />
      <circle className="labJackSocket" cx={x + 148} cy={y + 138} r={4} />
      <text className="labJackLabel" x={x + 124} y={y + 160} textAnchor="middle">
        30A
      </text>
      <text className="labJackLabel" x={x + 148} y={y + 160} textAnchor="middle">
        COM
      </text>
    </g>
  );
}

function OhmsLab({
  ids,
  metrics,
  values,
}: {
  ids: LabVisualIds;
  metrics: LabMetrics;
  values: LabSimulationValues;
}) {
  return (
    <g className="labScene labOhmsScene">
      <text className="labSectionLabel" x={38} y={52}>
        SERIES DC CURRENT MEASUREMENT
      </text>
      <path className="labWire" d="M82 100 V132 M82 100 H152 M272 100 H326" />
      <LabResistor
        ids={ids}
        label={`R = ${values.resistance} Ω`}
        length={120}
        variant="power"
        x={152}
        y={100}
      />
      <circle className="labMeterBezel" cx={362} cy={100} r={40} />
      <circle className="labMeterSymbol" cx={362} cy={100} r={34} />
      <circle className="labMeterTerminal" cx={326} cy={100} r={5} />
      <circle className="labMeterTerminal" cx={398} cy={100} r={5} />
      <text className="labMeterLetter" x={362} y={108} textAnchor="middle">
        A
      </text>
      <text className="labMeterMode" x={362} y={125} textAnchor="middle">
        DC
      </text>
      <path className="labWire" d="M396 100 H414 V272 H82 V228" />
      <LabBattery ids={ids} label={`${values.voltage} V`} x={82} y={180} />
      <LabFlow d="M92 100 H322" />
      <LabFlow d="M402 100 H414 V272 H88" />
      <text className="labCurrentArrow" x={362} y={52} textAnchor="middle">
        I = {metrics.current.toFixed(2)} A
      </text>
      <path className="labSenseLead" d="M362 136 C385 180 408 205 432 205" />
      <LabInstrument
        detail="A DC · 30 A RANGE"
        ids={ids}
        label="IDEAL DC AMMETER"
        unit="A"
        value={metrics.current.toFixed(3)}
        x={432}
        y={70}
      />
      <g transform="translate(432 270)">
        <rect className="labMetricBand" width={170} height={52} rx={5} />
        <text className="labMetricLabel" x={12} y={20}>
          RESISTOR POWER
        </text>
        <text className="labMetricValue" x={158} y={38} textAnchor="end">
          {metrics.resistorPower.toFixed(2)} W
        </text>
      </g>
    </g>
  );
}

function RcLab({
  ids,
  metrics,
  values,
}: {
  ids: LabVisualIds;
  metrics: LabMetrics;
  values: LabSimulationValues;
}) {
  return (
    <g className="labScene labRcScene">
      <text className="labSectionLabel" x={34} y={50}>
        FIRST-ORDER RC STEP RESPONSE
      </text>
      <path className="labWire" d="M70 100 V132 M70 100 H112 M158 100 H178" />
      <circle className="labSwitchNode" cx={114} cy={100} r={5} />
      <circle className="labSwitchNode" cx={156} cy={100} r={5} />
      <line className="labSwitchBlade" x1={115} y1={99} x2={150} y2={81} />
      <text className="labTiny" x={135} y={70} textAnchor="middle">
        close at t = 0
      </text>
      <LabResistor
        bandColors={getResistorBandColors(values.rcResistance * 1000)}
        ids={ids}
        label={`R = ${values.rcResistance} kΩ`}
        length={118}
        variant="signal"
        x={178}
        y={100}
      />
      <path className="labWire" d="M296 100 H316 V272 H70 V228" />
      <LabCapacitor ids={ids} label={`C = ${values.capacitance} µF`} x={316} y={185} />
      <LabBattery ids={ids} label="STEP Vs" x={70} y={180} />
      <LabFlow d="M166 100 H304" />
      <text className="labValue" x={278} y={157}>
        vC(t)
      </text>
      <path className="labProbeLead channelOne" d="M316 135 C340 126 338 96 352 96" />
      <path className="labProbeLead ground" d="M316 235 C338 246 340 258 352 258" />

      <g transform="translate(352 65)">
        <rect
          className="labScopeBody"
          filter={`url(#${ids.shadow})`}
          height={226}
          rx={10}
          style={{ fill: `url(#${ids.metal})` }}
          width={252}
        />
        <rect className="labScopeBezel" x={7} y={7} width={238} height={212} rx={7} />
        <circle className="labInstrumentScrew" cx={12} cy={12} r={3} />
        <circle className="labInstrumentScrew" cx={240} cy={12} r={3} />
        <circle className="labInstrumentScrew" cx={12} cy={214} r={3} />
        <circle className="labInstrumentScrew" cx={240} cy={214} r={3} />
        <text className="labInstrumentBrand" x={16} y={25}>
          DIGITAL OSCILLOSCOPE · CH1
        </text>
        <circle className="labInstrumentLedHalo" cx={230} cy={20} r={9} />
        <circle className="labInstrumentLed" cx={230} cy={20} r={5} />
        <rect
          className="labScopeScreen"
          height={142}
          rx={5}
          style={{ fill: `url(#${ids.scope})` }}
          width={224}
          x={14}
          y={38}
        />
        <rect className="labScopeSweep" x={28} y={48} width={18} height={122} rx={8} />
        <path className="labScopeGrid" d="M30 58 V164 M72 58 V164 M114 58 V164 M156 58 V164 M198 58 V164 M30 84 H224 M30 111 H224 M30 138 H224 M30 164 H224" />
        <path className="labScopeAxis" d="M30 164 H224 M30 164 V58" />
        <path
          className="labChargeTraceGhost"
          d="M30 160 C52 116 78 87 115 72 C145 60 181 56 224 55"
        />
        <path
          className="labChargeTrace"
          d="M30 160 C52 116 78 87 115 72 C145 60 181 56 224 55"
        />
        <path className="labTauGuide" d="M30 97 H78 V164" />
        <text className="labScopeAnnotation" x={84} y={92}>
          63.2% Vs
        </text>
        <text className="labScopeAnnotation" x={78} y={177} textAnchor="middle">
          τ
        </text>
        <text className="labScopeReadout" x={16} y={204}>
          τ = {metrics.rcTimeConstant.toFixed(0)} ms
        </text>
        <text className="labScopeReadout secondary" x={236} y={204} textAnchor="end">
          fc = {metrics.rcCutoff.toFixed(2)} Hz
        </text>
        <circle className="labScopeKnob" cx={34} cy={207} r={7} />
        <circle className="labScopeKnob" cx={54} cy={207} r={7} />
        <rect className="labScopeSoftKey" x={70} y={200} width={20} height={13} rx={3} />
        <rect className="labScopeSoftKey" x={94} y={200} width={20} height={13} rx={3} />
        <circle className="labScopeJack channelOne" cx={130} cy={207} r={7} />
        <text className="labJackLabel" x={130} y={220} textAnchor="middle">
          CH1
        </text>
      </g>

      <g transform="translate(352 302)">
        <rect className="labMetricBand" width={252} height={42} rx={5} />
        <text className="labMetricLabel" x={12} y={18}>
          ≈99.3% SETTLING
        </text>
        <text className="labMetricValue" x={240} y={30} textAnchor="end">
          5τ = {metrics.rcSettlingTime.toFixed(0)} ms
        </text>
      </g>
    </g>
  );
}

function LowPassFilterLab({
  ids,
  metrics,
  values,
}: {
  ids: LabVisualIds;
  metrics: LabMetrics;
  values: LabSimulationValues;
}) {
  const outputTraceAmplitude = Math.max(2.5, 40 * metrics.filterGain);

  return (
    <g className="labScene labFilterScene">
      <text className="labSectionLabel" x={34} y={48}>
        PASSIVE RC LOW-PASS FREQUENCY RESPONSE
      </text>

      <g className="labGenerator" transform="translate(34 70)">
        <rect
          className="labGeneratorBody"
          filter={`url(#${ids.shadow})`}
          height={132}
          rx={10}
          style={{ fill: `url(#${ids.metal})` }}
          width={94}
        />
        <rect className="labGeneratorBezel" height={118} rx={7} width={80} x={7} y={7} />
        <text className="labInstrumentBrand" x={12} y={23}>
          FUNCTION GEN
        </text>
        <rect
          className="labGeneratorScreen"
          height={54}
          rx={4}
          style={{ fill: `url(#${ids.scope})` }}
          width={70}
          x={12}
          y={34}
        />
        <path
          className="labGeneratorWave"
          d={makeScopeSinePath({
            amplitude: 14,
            centerY: 61,
            cycles: 1.6,
            width: 58,
            x: 18,
          })}
        />
        <text className="labGeneratorReadout" x={47} y={103} textAnchor="middle">
          {values.filterFrequency} Hz
        </text>
        <circle className="labScopeKnob" cx={25} cy={116} r={8} />
        <circle className="labScopeKnob" cx={50} cy={116} r={8} />
        <circle className="labScopeJack channelOne" cx={75} cy={116} r={7} />
      </g>

      <path className="labWire" d="M109 186 H152 M270 186 H310" />
      <LabResistor
        bandColors={getResistorBandColors(values.rcResistance * 1000)}
        ids={ids}
        label={`R = ${values.rcResistance} kΩ`}
        length={118}
        variant="signal"
        x={152}
        y={186}
      />
      <circle className="labFilterNode" cx={310} cy={186} r={7} />
      <path className="labWire" d="M310 186 H348 M310 186 V192" />
      <LabCapacitor
        ids={ids}
        label={`C = ${values.capacitance} µF`}
        x={310}
        y={242}
      />
      <path className="labWire" d="M310 292 V316 H82 V214" />
      <LabFlow d="M114 186 H300 V308 H88" />
      <text className="labValue" x={310} y={164} textAnchor="middle">
        VOUT
      </text>
      <text className="labTiny" x={80} y={226} textAnchor="middle">
        5 V RMS
      </text>

      <path className="labProbeLead channelOne" d="M109 186 C228 78 316 74 366 96" />
      <path className="labProbeLead channelTwo" d="M310 186 C338 170 350 162 366 150" />
      <path className="labProbeLead ground" d="M310 316 C336 322 348 276 366 260" />

      <g transform="translate(366 64)">
        <rect
          className="labScopeBody"
          filter={`url(#${ids.shadow})`}
          height={232}
          rx={10}
          style={{ fill: `url(#${ids.metal})` }}
          width={242}
        />
        <rect className="labScopeBezel" x={7} y={7} width={228} height={218} rx={7} />
        <circle className="labInstrumentScrew" cx={12} cy={12} r={3} />
        <circle className="labInstrumentScrew" cx={230} cy={12} r={3} />
        <circle className="labInstrumentScrew" cx={12} cy={220} r={3} />
        <circle className="labInstrumentScrew" cx={230} cy={220} r={3} />
        <text className="labInstrumentBrand" x={16} y={25}>
          DUAL-CHANNEL OSCILLOSCOPE
        </text>
        <circle className="labInstrumentLedHalo" cx={220} cy={20} r={9} />
        <circle className="labInstrumentLed" cx={220} cy={20} r={5} />
        <rect
          className="labScopeScreen"
          height={142}
          rx={5}
          style={{ fill: `url(#${ids.scope})` }}
          width={214}
          x={14}
          y={38}
        />
        <rect className="labScopeSweep" x={24} y={48} width={18} height={122} rx={8} />
        <path className="labScopeGrid" d="M30 58 V164 M70 58 V164 M110 58 V164 M150 58 V164 M190 58 V164 M30 84 H214 M30 111 H214 M30 138 H214 M30 164 H214" />
        <path
          className="labFilterInputTrace"
          d={makeScopeSinePath({ amplitude: 40 })}
        />
        <path
          className="labFilterOutputTrace"
          d={makeScopeSinePath({
            amplitude: outputTraceAmplitude,
            phase: metrics.filterPhase,
          })}
        />
        <text className="labFilterLegend input" x={30} y={54}>
          CH1 INPUT
        </text>
        <text className="labFilterLegend output" x={146} y={54}>
          CH2 OUTPUT
        </text>
        <text className="labScopeReadout" x={16} y={202}>
          {metrics.filterOutput.toFixed(2)} V RMS
        </text>
        <text className="labScopeReadout secondary" x={226} y={202} textAnchor="end">
          {metrics.filterGainDb.toFixed(1)} dB
        </text>
        <circle className="labScopeKnob" cx={34} cy={214} r={7} />
        <circle className="labScopeKnob" cx={54} cy={214} r={7} />
        <circle className="labScopeJack channelOne" cx={124} cy={214} r={7} />
        <circle className="labScopeJack channelTwo" cx={148} cy={214} r={7} />
        <text className="labJackLabel" x={124} y={228} textAnchor="middle">
          CH1
        </text>
        <text className="labJackLabel" x={148} y={228} textAnchor="middle">
          CH2
        </text>
      </g>

      <g transform="translate(366 307)">
        <rect className="labMetricBand" width={242} height={38} rx={5} />
        <text className="labMetricLabel" x={12} y={16}>
          CUTOFF {metrics.rcCutoff.toFixed(2)} Hz
        </text>
        <text className="labMetricValue" x={230} y={27} textAnchor="end">
          PHASE {metrics.filterPhase.toFixed(1)}°
        </text>
      </g>
    </g>
  );
}

function DigitalTimingLab({
  ids,
  metrics,
  values,
}: {
  ids: LabVisualIds;
  metrics: LabMetrics;
  values: LabSimulationValues;
}) {
  const timingHealthy = metrics.digitalTimingMargin >= 0;
  const analyzerWidth = 170;
  const analyzerX = 46;
  const captureRatio = 0.5;
  const captureX = analyzerX + analyzerWidth * captureRatio;
  const setupWidth = Math.max(
    5,
    Math.min(
      34,
      (values.digitalSetupTime / metrics.digitalPeriod) *
        (analyzerWidth / 4),
    ),
  );
  const dataArrivalRatio = Math.max(
    0.22,
    Math.min(
      0.7,
      captureRatio -
        (metrics.digitalTimingMargin / metrics.digitalPeriod) * 0.25,
    ),
  );
  const qDelayRatio = Math.max(
    0.012,
    Math.min(
      0.16,
      (values.digitalPropagationDelay / metrics.digitalPeriod) * 0.25,
    ),
  );

  return (
    <g className="labScene labDigitalScene">
      <text className="labSectionLabel" x={34} y={48}>
        SYNCHRONOUS DIGITAL TIMING MEASUREMENT
      </text>

      <g className="labDigitalBoard" transform="translate(32 78)">
        <rect
          className="labDigitalBoardBody"
          filter={`url(#${ids.shadow})`}
          height={230}
          rx={10}
          width={292}
        />
        <rect className="labDigitalBoardInset" height={216} rx={7} width={278} x={7} y={7} />
        <circle className="labDigitalMount" cx={15} cy={15} r={5} />
        <circle className="labDigitalMount" cx={277} cy={15} r={5} />
        <circle className="labDigitalMount" cx={15} cy={215} r={5} />
        <circle className="labDigitalMount" cx={277} cy={215} r={5} />
        <text className="labDigitalBoardLabel" x={24} y={28}>
          3.3 V TIMING FIXTURE
        </text>

        <g transform="translate(22 50)">
          <rect className="labClockModule" height={72} rx={6} width={78} />
          <text className="labDigitalModuleLabel" x={39} y={18} textAnchor="middle">
            CLOCK GEN
          </text>
          <path
            className="labDigitalMiniWave"
            d="M12 46 H22 V32 H34 V46 H46 V32 H58 V46 H68"
          />
          <text className="labDigitalReadout" x={39} y={64} textAnchor="middle">
            {values.digitalClockFrequency} MHz
          </text>
        </g>

        <g transform="translate(22 148)">
          <rect className="labDataSwitchBody" height={44} rx={5} width={78} />
          <text className="labDigitalModuleLabel" x={39} y={16} textAnchor="middle">
            DATA
          </text>
          <rect className="labDataSwitchTrack" height={12} rx={6} width={44} x={17} y={23} />
          <circle className="labDataSwitchKnob" cx={49} cy={29} r={8} />
        </g>

        <path className="labDigitalTrace clock" d="M100 86 H138 V140 H166" />
        <path className="labDigitalTrace data" d="M100 170 H132 V92 H166" />
        <LabFlow className="digitalClockFlow" d="M104 86 H138 V140 H164" />

        <g className="labLogicChip" transform="translate(166 60)">
          <rect className="labLogicChipBody" height={118} rx={7} width={94} />
          <path className="labLogicChipNotch" d="M38 0 A9 9 0 0 0 56 0" />
          {Array.from({ length: 5 }, (_, index) => (
            <g key={index}>
              <rect className="labLogicPin" height={5} width={12} x={-12} y={17 + index * 19} />
              <rect className="labLogicPin" height={5} width={12} x={94} y={17 + index * 19} />
            </g>
          ))}
          <text className="labLogicChipName" x={47} y={46} textAnchor="middle">
            D FLIP-FLOP
          </text>
          <text className="labLogicChipPart" x={47} y={65} textAnchor="middle">
            74LVC74
          </text>
          <text className="labLogicPinLabel" x={8} y={35}>
            D
          </text>
          <text className="labLogicPinLabel" x={8} y={83}>
            CLK
          </text>
          <text className="labLogicPinLabel" x={77} y={35}>
            Q
          </text>
          <circle className={`labLogicStatus ${timingHealthy ? 'pass' : 'fail'}`} cx={47} cy={96} r={8} />
        </g>

        <path className="labDigitalTrace output" d="M260 92 H286" />
        <text className="labDigitalNetLabel" x={276} y={81} textAnchor="middle">
          Q
        </text>
        <text className="labDigitalNetLabel" x={126} y={77} textAnchor="middle">
          CLK
        </text>
        <text className="labDigitalNetLabel" x={126} y={164} textAnchor="middle">
          D
        </text>
        <circle className="labLogicProbe clock" cx={138} cy={86} r={6} />
        <circle className="labLogicProbe data" cx={132} cy={170} r={6} />
        <circle className="labLogicProbe output" cx={276} cy={92} r={6} />
      </g>

      <path className="labProbeLead logicClock" d="M170 164 C286 36 338 66 366 102" />
      <path className="labProbeLead logicData" d="M164 248 C282 302 326 190 366 166" />
      <path className="labProbeLead logicOutput" d="M308 170 C332 156 344 214 366 222" />

      <g className="labLogicAnalyzer" transform="translate(366 58)">
        <rect
          className="labAnalyzerBody"
          filter={`url(#${ids.shadow})`}
          height={244}
          rx={10}
          style={{ fill: `url(#${ids.metal})` }}
          width={244}
        />
        <rect className="labAnalyzerBezel" height={230} rx={7} width={230} x={7} y={7} />
        <circle className="labInstrumentScrew" cx={12} cy={12} r={3} />
        <circle className="labInstrumentScrew" cx={232} cy={12} r={3} />
        <text className="labInstrumentBrand" x={16} y={25}>
          4-CHANNEL LOGIC ANALYZER
        </text>
        <circle className="labInstrumentLedHalo" cx={222} cy={20} r={9} />
        <circle className="labInstrumentLed" cx={222} cy={20} r={5} />
        <rect
          className="labLogicScreen"
          height={158}
          rx={5}
          style={{ fill: `url(#${ids.scope})` }}
          width={220}
          x={12}
          y={38}
        />
        <path className="labLogicGrid" d="M46 52 V184 M88 52 V184 M131 52 V184 M173 52 V184 M216 52 V184 M24 86 H222 M24 128 H222 M24 170 H222" />
        <rect
          className={`labSetupWindow ${timingHealthy ? 'pass' : 'fail'}`}
          height={126}
          width={setupWidth}
          x={captureX - setupWidth}
          y={54}
        />
        <line className="labCaptureCursor" x1={captureX} x2={captureX} y1={50} y2={184} />
        <text className="labLogicChannelLabel clock" x={20} y={72}>
          CLK
        </text>
        <text className="labLogicChannelLabel data" x={20} y={114}>
          D
        </text>
        <text className="labLogicChannelLabel output" x={20} y={156}>
          Q
        </text>
        <path
          className="labLogicWave clock"
          d={makeLogicLevelPath({
            highY: 58,
            lowY: 76,
            transitions: [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875],
          })}
        />
        <path
          className="labLogicWave data"
          d={makeLogicLevelPath({
            highY: 100,
            lowY: 118,
            transitions: [0.16, dataArrivalRatio, 0.8],
          })}
        />
        <path
          className={`labLogicWave output ${timingHealthy ? 'pass' : 'fail'}`}
          d={makeLogicLevelPath({
            highY: 142,
            lowY: 160,
            transitions: [0.18, 0.5 + qDelayRatio, 0.82],
          })}
        />
        {!timingHealthy && (
          <text className="labLogicUnknown" x={captureX + 12} y={154}>
            X
          </text>
        )}
        <text className="labLogicCursorLabel" x={captureX} y={190} textAnchor="middle">
          CAPTURE
        </text>
        <text className="labAnalyzerPrimary" x={16} y={216}>
          {metrics.digitalTimingMargin.toFixed(1)} ns MARGIN
        </text>
        <text className="labAnalyzerSecondary" x={228} y={216} textAnchor="end">
          {timingHealthy ? 'PASS' : 'VIOLATION'}
        </text>
        <circle className="labScopeJack logicClock" cx={46} cy={232} r={6} />
        <circle className="labScopeJack logicData" cx={68} cy={232} r={6} />
        <circle className="labScopeJack logicOutput" cx={90} cy={232} r={6} />
      </g>

      <g transform="translate(366 312)">
        <rect
          className={`labMetricBand digital ${timingHealthy ? 'pass' : 'fail'}`}
          height={34}
          rx={5}
          width={244}
        />
        <text className="labMetricLabel" x={12} y={15}>
          TCLK {metrics.digitalPeriod.toFixed(1)} ns
        </text>
        <text className="labMetricValue" x={232} y={24} textAnchor="end">
          FMAX {metrics.digitalMaxClock.toFixed(1)} MHz
        </text>
      </g>
    </g>
  );
}

function OpAmpSignalLab({
  ids,
  metrics,
  values,
}: {
  ids: LabVisualIds;
  metrics: LabMetrics;
  values: LabSimulationValues;
}) {
  const outputAmplitude = Math.min(
    42,
    16 + Math.min(6.5, Math.abs(metrics.opAmpGain)) * 4,
  );
  const clipRatio =
    Math.abs(metrics.opAmpIdealOutput) > 0
      ? Math.min(
          1,
          metrics.opAmpMaxSwing / Math.abs(metrics.opAmpIdealOutput),
        )
      : 1;

  return (
    <g className="labScene labOpAmpScene">
      <text className="labSectionLabel" x={34} y={48}>
        INVERTING OP-AMP GAIN AND HEADROOM
      </text>

      <g className="labOpAmpBoard" transform="translate(30 76)">
        <rect
          className="labOpAmpBoardBody"
          filter={`url(#${ids.shadow})`}
          height={230}
          rx={10}
          width={322}
        />
        <rect className="labOpAmpBoardInset" height={216} rx={7} width={308} x={7} y={7} />
        <circle className="labOpAmpMount" cx={15} cy={15} r={5} />
        <circle className="labOpAmpMount" cx={307} cy={15} r={5} />
        <circle className="labOpAmpMount" cx={15} cy={215} r={5} />
        <circle className="labOpAmpMount" cx={307} cy={215} r={5} />
        <text className="labOpAmpBoardLabel" x={24} y={28}>
          DUAL-RAIL ANALOG FIXTURE
        </text>

        <g className="labOpAmpGenerator" transform="translate(18 52)">
          <rect className="labOpAmpModuleBody" height={118} rx={7} width={78} />
          <text className="labOpAmpModuleLabel" x={39} y={18} textAnchor="middle">
            SINE SOURCE
          </text>
          <rect
            className="labOpAmpModuleScreen"
            height={45}
            rx={4}
            style={{ fill: `url(#${ids.scope})` }}
            width={60}
            x={9}
            y={28}
          />
          <path
            className="labOpAmpMiniWave"
            d={makeScopeSinePath({
              amplitude: 11,
              centerY: 50,
              cycles: 1.5,
              width: 48,
              x: 15,
            })}
          />
          <text className="labOpAmpReadout" x={39} y={89} textAnchor="middle">
            {values.opAmpInputVoltage.toFixed(2)} Vpk
          </text>
          <circle className="labScopeKnob" cx={24} cy={104} r={7} />
          <circle className="labScopeJack channelOne" cx={58} cy={104} r={6} />
        </g>

        <path className="labWire" d="M96 156 H108" />
        <LabResistor
          bandColors={getResistorBandColors(values.opAmpInputResistance * 1000)}
          ids={ids}
          label={`RIN ${values.opAmpInputResistance} kΩ`}
          length={108}
          x={108}
          y={156}
        />
        <circle className="labOpAmpNode" cx={222} cy={156} r={6} />
        <path className="labWire" d="M216 156 H238" />

        <path className="labOpAmpSymbol" d="M238 104 V206 L316 156 Z" />
        <text className="labOpAmpPolarity" x={247} y={148}>
          −
        </text>
        <text className="labOpAmpPolarity" x={247} y={188}>
          +
        </text>
        <text className="labOpAmpPart" x={270} y={162} textAnchor="middle">
          OP AMP
        </text>
        <path className="labWire" d="M238 184 H220 V204" />
        <path className="labGround" d="M205 204 H235 M210 212 H230 M216 220 H224" />
        <path className="labWire" d="M316 156 H322" />
        <circle className="labOpAmpNode output" cx={316} cy={156} r={6} />

        <path className="labWire" d="M222 156 V74 H210 M316 156 V74 H318" />
        <LabResistor
          bandColors={getResistorBandColors(values.opAmpFeedbackResistance * 1000)}
          ids={ids}
          label={`RF ${values.opAmpFeedbackResistance} kΩ`}
          length={108}
          x={210}
          y={74}
        />

        <path className="labSupplyLead positive" d="M276 104 V86" />
        <path className="labSupplyLead negative" d="M276 206 V224" />
        <text className="labSupplyLabel positive" x={284} y={94}>
          +{values.opAmpSupplyVoltage} V
        </text>
        <text className="labSupplyLabel negative" x={284} y={220}>
          −{values.opAmpSupplyVoltage} V
        </text>
        <text className="labOpAmpNetLabel" x={112} y={144}>
          VIN
        </text>
        <text className="labOpAmpNetLabel output" x={312} y={144} textAnchor="end">
          VOUT
        </text>
        <LabFlow className="opAmpSignalFlow" d="M98 156 H214" />
      </g>

      <path className="labProbeLead channelOne" d="M126 232 C248 48 332 76 370 108" />
      <path className="labProbeLead channelTwo" d="M346 232 C358 212 362 194 370 172" />
      <path className="labProbeLead ground" d="M250 296 C324 332 350 272 370 252" />

      <g className="labOpAmpScope" transform="translate(370 58)">
        <rect
          className="labScopeBody"
          filter={`url(#${ids.shadow})`}
          height={242}
          rx={10}
          style={{ fill: `url(#${ids.metal})` }}
          width={240}
        />
        <rect className="labScopeBezel" height={228} rx={7} width={226} x={7} y={7} />
        <circle className="labInstrumentScrew" cx={12} cy={12} r={3} />
        <circle className="labInstrumentScrew" cx={228} cy={12} r={3} />
        <text className="labInstrumentBrand" x={16} y={25}>
          DUAL-CHANNEL OSCILLOSCOPE
        </text>
        <circle className="labInstrumentLedHalo" cx={218} cy={20} r={9} />
        <circle className="labInstrumentLed" cx={218} cy={20} r={5} />
        <rect
          className="labScopeScreen"
          height={150}
          rx={5}
          style={{ fill: `url(#${ids.scope})` }}
          width={212}
          x={14}
          y={38}
        />
        <rect className="labScopeSweep" x={24} y={48} width={18} height={130} rx={8} />
        <path className="labScopeGrid" d="M30 50 V178 M70 50 V178 M110 50 V178 M150 50 V178 M190 50 V178 M30 82 H214 M30 114 H214 M30 146 H214 M30 178 H214" />
        <path
          className="labOpAmpInputTrace"
          d={makeScopeSinePath({
            amplitude: 15,
            centerY: 79,
            cycles: 2.2,
            width: 190,
            x: 26,
          })}
        />
        <path
          className={`labOpAmpOutputTrace ${metrics.opAmpClipped ? 'clipped' : ''}`}
          d={makeClippedScopeSinePath({
            amplitude: outputAmplitude,
            centerY: 143,
            clipRatio,
            x: 26,
          })}
        />
        <text className="labFilterLegend input" x={28} y={52}>
          CH1 INPUT
        </text>
        <text className="labFilterLegend output" x={146} y={52}>
          CH2 INVERTED
        </text>
        <text className="labScopeReadout" x={16} y={208}>
          {Math.abs(metrics.opAmpOutput).toFixed(2)} Vpk
        </text>
        <text className="labScopeReadout secondary" x={224} y={208} textAnchor="end">
          AV {metrics.opAmpGain.toFixed(2)}
        </text>
        <circle className="labScopeKnob" cx={34} cy={224} r={7} />
        <circle className="labScopeKnob" cx={54} cy={224} r={7} />
        <circle className="labScopeJack channelOne" cx={122} cy={224} r={7} />
        <circle className="labScopeJack channelTwo" cx={146} cy={224} r={7} />
      </g>

      <g transform="translate(370 312)">
        <rect
          className={`labMetricBand opAmp ${metrics.opAmpClipped ? 'clipped' : ''}`}
          height={34}
          rx={5}
          width={240}
        />
        <text className="labMetricLabel" x={12} y={15}>
          {metrics.opAmpClipped
            ? `CLIPPED AT ±${metrics.opAmpMaxSwing.toFixed(1)} V`
            : `${metrics.opAmpHeadroom.toFixed(2)} V HEADROOM`}
        </text>
        <text className="labMetricValue" x={228} y={24} textAnchor="end">
          {Math.abs(metrics.opAmpOutput).toFixed(2)} Vpk
        </text>
      </g>
    </g>
  );
}

function BjtBiasLab({
  ids,
  metrics,
  values,
}: {
  ids: LabVisualIds;
  metrics: LabMetrics;
  values: LabSimulationValues;
}) {
  const maximumCurrent = Math.max(
    1,
    metrics.bjtLoadLineCurrent * 1.18,
    metrics.bjtIdealCollectorCurrent * 1.12,
  );
  const curveMultipliers = [0.25, 0.5, 0.75, 1, 1.25];
  const curvePaths = curveMultipliers.map((multiplier) =>
    makeBjtOutputCurvePath({
      baseCurrentMicroamps: values.bjtBaseCurrent * multiplier,
      beta: metrics.bjtAdjustedBeta,
      height: 75,
      maximumCurrent,
      supplyVoltage: values.bjtSupplyVoltage,
      width: 154,
      x: 22,
      y: 55,
    }),
  );
  const qPointX =
    22 +
    Math.max(
      0,
      Math.min(1, metrics.bjtCollectorVoltage / values.bjtSupplyVoltage),
    ) *
      154;
  const qPointY =
    130 -
    Math.max(
      0,
      Math.min(1, metrics.bjtCollectorCurrent / maximumCurrent),
    ) *
      75;
  const loadLineStartY =
    130 -
    Math.min(1, metrics.bjtLoadLineCurrent / maximumCurrent) * 75;
  const operatingState = metrics.bjtCutoff
    ? 'CUTOFF'
    : metrics.bjtSaturated
      ? 'SATURATION'
      : 'FORWARD ACTIVE';
  const operatingClass = metrics.bjtCutoff
    ? 'cutoff'
    : metrics.bjtSaturated
      ? 'saturated'
      : 'active';
  const transistorHot = metrics.bjtJunctionTemperature >= 85;

  return (
    <g className="labScene labBjtScene">
      <text className="labSectionLabel" x={34} y={43}>
        NPN COMMON-EMITTER BIAS AND LOAD-LINE ANALYSIS
      </text>

      <g className="labBjtBoard" transform="translate(22 62)">
        <rect
          className="labBjtBoardBody"
          filter={`url(#${ids.shadow})`}
          height={232}
          rx={10}
          width={380}
        />
        <rect
          className="labBjtBoardInset"
          height={218}
          rx={7}
          width={366}
          x={7}
          y={7}
        />
        <circle className="labInstrumentScrew" cx={13} cy={13} r={3} />
        <circle className="labInstrumentScrew" cx={367} cy={13} r={3} />
        <text className="labInstrumentBrand" x={18} y={27}>
          TRANSISTOR BIAS FIXTURE
        </text>
        <text className={`labBjtBoardState ${operatingClass}`} x={360} y={27} textAnchor="end">
          {operatingState}
        </text>

        <g className="labBjtSupply" transform="translate(18 48)">
          <rect
            className="labBjtModuleBody"
            filter={`url(#${ids.shadow})`}
            height={78}
            rx={7}
            style={{ fill: `url(#${ids.metal})` }}
            width={82}
          />
          <text className="labBjtModuleLabel" x={41} y={17} textAnchor="middle">
            COLLECTOR SUPPLY
          </text>
          <rect
            className="labBjtModuleScreen"
            height={31}
            rx={4}
            style={{ fill: `url(#${ids.lcd})` }}
            width={62}
            x={10}
            y={25}
          />
          <text className="labBjtModuleValue" x={41} y={46} textAnchor="middle">
            {values.bjtSupplyVoltage.toFixed(1)} V
          </text>
          <circle className="labJack positive" cx={24} cy={67} r={6} />
          <circle className="labJack" cx={58} cy={67} r={6} />
        </g>

        <g className="labBjtBiasSource" transform="translate(18 143)">
          <rect
            className="labBjtBiasBody"
            filter={`url(#${ids.shadow})`}
            height={68}
            rx={7}
            width={112}
          />
          <text className="labBjtModuleLabel light" x={56} y={17} textAnchor="middle">
            PRECISION BASE DRIVE
          </text>
          <rect className="labBjtBiasScreen" height={27} rx={4} width={88} x={12} y={25} />
          <text className="labBjtBiasValue" x={56} y={44} textAnchor="middle">
            {values.bjtBaseCurrent.toFixed(0)} µA
          </text>
          <circle className="labScopeJack channelOne" cx={23} cy={60} r={5} />
          <circle className="labScopeKnob" cx={88} cy={60} r={6} />
        </g>

        <path className="labBjtPowerWire" d="M100 82 H250 V54" />
        <rect
          className="labBjtCollectorResistorHalo"
          height={80}
          rx={18}
          width={44}
          x={228}
          y={43}
        />
        <line className="labBjtLead" x1={250} x2={250} y1={45} y2={54} />
        <rect
          className="labBjtCollectorResistor"
          filter={`url(#${ids.shadow})`}
          height={62}
          rx={14}
          style={{ fill: `url(#${ids.axial})` }}
          width={28}
          x={236}
          y={54}
        />
        <line className="labBjtResistorBand brown" x1={237} x2={263} y1={68} y2={68} />
        <line className="labBjtResistorBand red" x1={237} x2={263} y1={82} y2={82} />
        <line className="labBjtResistorBand black" x1={237} x2={263} y1={96} y2={96} />
        <line className="labBjtResistorBand gold" x1={239} x2={261} y1={107} y2={107} />
        <text className="labBjtComponentLabel" x={283} y={78}>
          RC
        </text>
        <text className="labBjtComponentValue" x={283} y={94}>
          {values.bjtCollectorResistance.toFixed(1)} kΩ
        </text>

        <path className="labBjtCollectorWire" d="M250 116 V132" />
        <circle
          className={`labBjtHeatHalo ${transistorHot ? 'hot' : ''}`}
          cx={250}
          cy={161}
          r={45}
        />
        <path
          className="labBjtPackage"
          d="M220 143 Q220 123 240 120 H260 Q280 123 280 143 V174 Q280 188 266 191 H234 Q220 188 220 174 Z"
          filter={`url(#${ids.shadow})`}
        />
        <path className="labBjtPackageHighlight" d="M230 137 Q235 128 248 127" />
        <text className="labBjtPart" x={250} y={151} textAnchor="middle">
          NPN
        </text>
        <text className="labBjtPartNumber" x={250} y={165} textAnchor="middle">
          2N3904
        </text>
        <text className="labBjtBetaLabel" x={250} y={178} textAnchor="middle">
          β {metrics.bjtAdjustedBeta.toFixed(0)}
        </text>
        <line className="labBjtPin collector" x1={238} x2={238} y1={190} y2={209} />
        <line className="labBjtPin base" x1={250} x2={250} y1={191} y2={209} />
        <line className="labBjtPin emitter" x1={262} x2={262} y1={190} y2={209} />
        <text className="labBjtPinLabel" x={238} y={219} textAnchor="middle">
          C
        </text>
        <text className="labBjtPinLabel" x={250} y={219} textAnchor="middle">
          B
        </text>
        <text className="labBjtPinLabel" x={262} y={219} textAnchor="middle">
          E
        </text>

        <path className="labBjtBiasWire" d="M130 177 H196 V160 H220" />
        <path className="labBjtReturnWire" d="M262 209 V221 H100 V116" />
        <path className="labGround" d="M247 220 H277 M252 226 H272 M258 231 H266" />
        <LabFlow className={`bjtCollectorFlow ${operatingClass}`} d="M101 82 H250 V120" />
        <LabFlow className={`bjtBaseFlow ${operatingClass}`} d="M132 177 H196 V160 H216" />
        <LabFlow className={`bjtEmitterFlow ${operatingClass}`} d="M262 194 V216" />

        <circle className="labBjtTestPoint collector" cx={250} cy={129} r={5} />
        <circle className="labBjtTestPoint base" cx={205} cy={160} r={5} />
        <text className="labBjtNetLabel" x={313} y={132}>
          VCE {metrics.bjtCollectorVoltage.toFixed(2)} V
        </text>
        <text className="labBjtNetLabel base" x={145} y={153}>
          VBE {metrics.bjtBaseEmitterVoltage.toFixed(2)} V
        </text>
        <text className="labBjtTemperature" x={313} y={213}>
          TJ {metrics.bjtJunctionTemperature.toFixed(0)} °C
        </text>
      </g>

      <path className="labBjtProbeLead collector" d="M272 191 C338 38 380 58 432 95" />
      <path className="labBjtProbeLead base" d="M228 222 C344 238 382 206 432 182" />

      <g className="labBjtTracer" transform="translate(420 62)">
        <rect
          className="labBjtTracerBody"
          filter={`url(#${ids.shadow})`}
          height={232}
          rx={10}
          style={{ fill: `url(#${ids.metal})` }}
          width={198}
        />
        <rect className="labBjtTracerBezel" height={218} rx={7} width={184} x={7} y={7} />
        <circle className="labInstrumentScrew" cx={12} cy={12} r={3} />
        <circle className="labInstrumentScrew" cx={186} cy={12} r={3} />
        <text className="labInstrumentBrand" x={14} y={24}>
          SEMICONDUCTOR CURVE TRACER
        </text>
        <circle className="labInstrumentLedHalo" cx={177} cy={19} r={9} />
        <circle
          className={`labInstrumentLed ${operatingClass}`}
          cx={177}
          cy={19}
          r={5}
        />
        <rect
          className="labBjtTracerScreen"
          height={126}
          rx={5}
          style={{ fill: `url(#${ids.scope})` }}
          width={174}
          x={12}
          y={36}
        />
        <path
          className="labBjtTracerGrid"
          d="M22 55 V140 M60 55 V140 M99 55 V140 M137 55 V140 M176 55 V140 M22 70 H176 M22 100 H176 M22 130 H176"
        />
        {curvePaths.map((path, index) => (
          <path
            className={`labBjtCurve curve${index + 1}`}
            d={path}
            key={curveMultipliers[index]}
          />
        ))}
        <line
          className="labBjtLoadLine"
          x1={22}
          x2={176}
          y1={loadLineStartY}
          y2={130}
        />
        <line className="labBjtQCursor vertical" x1={qPointX} x2={qPointX} y1={qPointY} y2={140} />
        <line className="labBjtQCursor" x1={22} x2={qPointX} y1={qPointY} y2={qPointY} />
        <circle
          className={`labBjtQPoint ${operatingClass}`}
          cx={qPointX}
          cy={qPointY}
          r={5}
        />
        <text className="labBjtScreenLabel" x={22} y={49}>
          IC / VCE · BASE-CURRENT STEPS
        </text>
        <text className="labBjtAxisLabel" x={22} y={151}>
          0 V
        </text>
        <text className="labBjtAxisLabel" x={176} y={151} textAnchor="end">
          {values.bjtSupplyVoltage.toFixed(0)} V
        </text>
        <text className="labBjtLoadLineLabel" x={166} y={122} textAnchor="end">
          LOAD LINE
        </text>
        <text className="labBjtTracerReadout" x={16} y={180}>
          IC {metrics.bjtCollectorCurrent.toFixed(2)} mA
        </text>
        <text className="labBjtTracerSecondary" x={184} y={180} textAnchor="end">
          VCE {metrics.bjtCollectorVoltage.toFixed(2)} V
        </text>
        <rect className={`labBjtRegionBadge ${operatingClass}`} height={24} rx={5} width={166} x={16} y={190} />
        <text className="labBjtRegionText" x={99} y={206} textAnchor="middle">
          {operatingState}
        </text>
        <circle className="labScopeKnob" cx={27} cy={223} r={6} />
        <circle className="labScopeKnob" cx={46} cy={223} r={6} />
        <circle className="labScopeJack channelOne" cx={150} cy={223} r={6} />
        <circle className="labScopeJack channelTwo" cx={171} cy={223} r={6} />
      </g>

      <g className="labBjtMetricBand" transform="translate(24 306)">
        <rect
          className={`labMetricBand bjt ${operatingClass}`}
          height={38}
          rx={6}
          width={592}
        />
        <line x1={148} x2={148} y1={6} y2={32} />
        <line x1={296} x2={296} y1={6} y2={32} />
        <line x1={444} x2={444} y1={6} y2={32} />
        <text className="labBjtMetricLabel" x={12} y={15}>
          COLLECTOR
        </text>
        <text className="labBjtMetricValue" x={136} y={27} textAnchor="end">
          {metrics.bjtCollectorCurrent.toFixed(2)} mA
        </text>
        <text className="labBjtMetricLabel" x={160} y={15}>
          HEADROOM
        </text>
        <text className="labBjtMetricValue" x={284} y={27} textAnchor="end">
          {metrics.bjtSaturationMargin.toFixed(2)} V
        </text>
        <text className="labBjtMetricLabel" x={308} y={15}>
          CURRENT GAIN
        </text>
        <text className="labBjtMetricValue" x={432} y={27} textAnchor="end">
          βF {metrics.bjtForcedBeta.toFixed(0)}
        </text>
        <text className="labBjtMetricLabel" x={456} y={15}>
          DEVICE POWER
        </text>
        <text className="labBjtMetricValue" x={580} y={27} textAnchor="end">
          {metrics.bjtCollectorPower.toFixed(1)} mW
        </text>
      </g>
    </g>
  );
}

function MosfetSwitchingLab({
  ids,
  metrics,
  values,
}: {
  ids: LabVisualIds;
  metrics: LabMetrics;
  values: LabSimulationValues;
}) {
  const dutyRatio = values.mosfetDutyCycle / 100;
  const gateTransitions = [
    0.05,
    0.05 + dutyRatio * 0.4,
    0.5,
    0.5 + dutyRatio * 0.4,
    0.95,
  ];
  const drainTransitions = metrics.mosfetOn ? gateTransitions : [];
  const hot = metrics.mosfetJunctionTemperature > 125;
  const fullyDriven = metrics.mosfetOn && values.mosfetGateVoltage >= 6;

  return (
    <g className="labScene labMosfetScene">
      <text className="labSectionLabel" x={34} y={43}>
        LOW-SIDE MOSFET SWITCHING AND LOSS
      </text>

      <g className="labMosfetBoard" transform="translate(24 62)">
        <rect
          className="labMosfetBoardBody"
          filter={`url(#${ids.shadow})`}
          height={232}
          rx={10}
          width={348}
        />
        <rect className="labMosfetBoardInset" height={218} rx={7} width={334} x={7} y={7} />
        <circle className="labMosfetMount" cx={16} cy={16} r={5} />
        <circle className="labMosfetMount" cx={332} cy={16} r={5} />
        <circle className="labMosfetMount" cx={16} cy={216} r={5} />
        <circle className="labMosfetMount" cx={332} cy={216} r={5} />
        <text className="labMosfetBoardLabel" x={26} y={28}>
          POWER SWITCHING FIXTURE
        </text>

        <g className="labMosfetSource" transform="translate(20 53)">
          <rect className="labMosfetModuleBody" height={112} rx={7} width={66} />
          <text className="labMosfetModuleLabel" x={33} y={18} textAnchor="middle">
            DC BUS
          </text>
          <rect className="labMosfetSourceScreen" height={42} rx={4} width={48} x={9} y={29} />
          <text className="labMosfetSourceValue" x={33} y={56} textAnchor="middle">
            {values.mosfetBusVoltage} V
          </text>
          <line className="labAccent" x1={18} x2={48} y1={84} y2={84} />
          <line className="labAccent" x1={24} x2={42} y1={96} y2={96} />
        </g>

        <path className="labWire labMosfetPowerWire" d="M86 72 H117" />
        <g className="labMosfetLoad" transform="translate(117 48)">
          <rect className="labMosfetLoadBody" height={48} rx={7} width={116} />
          <path className="labMosfetLoadCoil" d="M14 24 H28 C32 8 42 8 46 24 C50 40 60 40 64 24 C68 8 78 8 82 24 H102" />
          <text className="labMosfetLoadLabel" x={58} y={62} textAnchor="middle">
            {values.mosfetLoadResistance} Ω LOAD
          </text>
        </g>
        <path className="labWire labMosfetPowerWire" d="M233 72 H287 V115" />

        <g className="labMosfetFlyback">
          <path className="labMosfetClampWire" d="M124 45 V35 H278 V45" />
          <path className="labMosfetDiode" d="M188 35 L202 25 V45 Z M207 24 V46" />
          <text className="labMosfetClampLabel" x={232} y={29}>
            FLYBACK
          </text>
        </g>

        <circle
          className={`labMosfetHeat ${hot ? 'hot' : ''}`}
          cx={287}
          cy={156}
          r={45}
        />
        <g className="labMosfetPackage">
          <rect className="labMosfetTab" height={22} rx={5} width={50} x={262} y={104} />
          <circle className="labMosfetTabHole" cx={287} cy={115} r={6} />
          <rect className="labMosfetBody" height={76} rx={7} width={72} x={251} y={119} />
          <text className="labMosfetPart" x={287} y={143} textAnchor="middle">
            N-MOSFET
          </text>
          <text className="labMosfetPartValue" x={287} y={162} textAnchor="middle">
            {metrics.mosfetOn
              ? `${(metrics.mosfetOnResistance * 1000).toFixed(1)} mΩ`
              : 'OFF'}
          </text>
          <circle
            className={`labMosfetStatus ${fullyDriven ? 'ready' : ''} ${
              hot ? 'hot' : ''
            }`}
            cx={287}
            cy={181}
            r={5}
          />
          <line className="labMosfetPin" x1={266} x2={266} y1={195} y2={218} />
          <line className="labMosfetPin" x1={287} x2={287} y1={195} y2={218} />
          <line className="labMosfetPin" x1={308} x2={308} y1={195} y2={218} />
          <text className="labMosfetPinLabel" x={266} y={229} textAnchor="middle">
            G
          </text>
          <text className="labMosfetPinLabel" x={287} y={229} textAnchor="middle">
            D
          </text>
          <text className="labMosfetPinLabel" x={308} y={229} textAnchor="middle">
            S
          </text>
        </g>

        <g className="labMosfetDriver" transform="translate(91 128)">
          <rect className="labMosfetModuleBody" height={70} rx={7} width={102} />
          <text className="labMosfetModuleLabel" x={51} y={16} textAnchor="middle">
            GATE DRIVER
          </text>
          <rect
            className="labMosfetDriverScreen"
            height={28}
            rx={3}
            style={{ fill: `url(#${ids.scope})` }}
            width={48}
            x={10}
            y={27}
          />
          <path
            className="labMosfetMiniGate"
            d={makeLogicLevelPath({
              highY: 35,
              lowY: 48,
              transitions: [0.12, 0.55, 0.82],
              width: 36,
              x: 16,
            })}
          />
          <text className="labMosfetDriverValue" x={80} y={39} textAnchor="middle">
            {values.mosfetGateVoltage.toFixed(1)} V
          </text>
          <text className="labMosfetDriverMeta" x={80} y={53} textAnchor="middle">
            {values.mosfetSwitchingFrequency} kHz
          </text>
        </g>

        <path className="labMosfetGateTrace" d="M193 163 H204" />
        <rect className="labMosfetGateResistor" height={18} rx={4} width={39} x={204} y={154} />
        <path className="labMosfetGateZigzag" d="M210 163 L215 158 L221 168 L227 158 L233 168 L238 163" />
        <text className="labMosfetGateLabel" x={223.5} y={149} textAnchor="middle">
          RG {values.mosfetGateResistance} Ω
        </text>
        <path className="labMosfetGateTrace" d="M243 163 H251" />
        <path className="labWire labMosfetReturn" d="M308 218 H53 V165" />

        <LabFlow
          className={`mosfetPowerFlow ${metrics.mosfetOn ? '' : 'off'}`}
          d="M88 72 H278 V112 M308 199 V218 H58 V168"
        />
        <LabFlow className="mosfetGateFlow" d="M194 163 H248" />
      </g>

      <path className="labProbeLead channelOne" d="M178 226 C310 44 348 82 392 108" />
      <path className="labProbeLead channelTwo" d="M311 184 C348 186 358 176 392 174" />
      <path className="labProbeLead ground" d="M332 280 C360 300 376 270 392 252" />

      <g className="labMosfetScope" transform="translate(392 62)">
        <rect
          className="labScopeBody"
          filter={`url(#${ids.shadow})`}
          height={232}
          rx={10}
          style={{ fill: `url(#${ids.metal})` }}
          width={224}
        />
        <rect className="labScopeBezel" height={218} rx={7} width={210} x={7} y={7} />
        <circle className="labInstrumentScrew" cx={12} cy={12} r={3} />
        <circle className="labInstrumentScrew" cx={212} cy={12} r={3} />
        <text className="labInstrumentBrand" x={15} y={24}>
          SWITCHING OSCILLOSCOPE
        </text>
        <circle className="labInstrumentLedHalo" cx={202} cy={19} r={9} />
        <circle className="labInstrumentLed" cx={202} cy={19} r={5} />
        <rect
          className="labScopeScreen"
          height={140}
          rx={5}
          style={{ fill: `url(#${ids.scope})` }}
          width={196}
          x={14}
          y={36}
        />
        <rect className="labScopeSweep" x={22} y={45} width={16} height={122} rx={7} />
        <path className="labScopeGrid" d="M24 48 V166 M62 48 V166 M100 48 V166 M138 48 V166 M176 48 V166 M24 78 H200 M24 108 H200 M24 138 H200 M24 166 H200" />
        <text className="labMosfetScopeLabel gate" x={25} y={54}>
          VGS
        </text>
        <text className="labMosfetScopeLabel drain" x={25} y={119}>
          VDS
        </text>
        <path
          className="labMosfetGateWave"
          d={makeLogicLevelPath({
            highY: 64,
            lowY: 94,
            transitions: gateTransitions,
            width: 170,
            x: 28,
          })}
        />
        <path
          className={`labMosfetDrainWave ${metrics.mosfetOn ? '' : 'off'}`}
          d={makeLogicLevelPath({
            highY: 128,
            lowY: 158,
            startHigh: true,
            transitions: drainTransitions,
            width: 170,
            x: 28,
          })}
        />
        <text className="labScopeReadout" x={16} y={196}>
          {metrics.mosfetTotalLoss.toFixed(2)} W LOSS
        </text>
        <text className="labScopeReadout secondary" x={208} y={196} textAnchor="end">
          {metrics.mosfetTransitionTime.toFixed(0)} ns
        </text>
        <circle className="labScopeKnob" cx={32} cy={215} r={7} />
        <circle className="labScopeKnob" cx={52} cy={215} r={7} />
        <circle className="labScopeJack channelOne" cx={116} cy={215} r={7} />
        <circle className="labScopeJack channelTwo" cx={140} cy={215} r={7} />
      </g>

      <g className="labMosfetMetricBand" transform="translate(24 306)">
        <rect
          className={`labMetricBand mosfet ${hot ? 'hot' : ''}`}
          height={38}
          rx={6}
          width={592}
        />
        <line x1={148} x2={148} y1={6} y2={32} />
        <line x1={296} x2={296} y1={6} y2={32} />
        <line x1={444} x2={444} y1={6} y2={32} />
        <text className="labMosfetMetricLabel" x={12} y={15}>
          DRAIN CURRENT
        </text>
        <text className="labMosfetMetricValue" x={136} y={27} textAnchor="end">
          {metrics.mosfetDrainCurrent.toFixed(2)} A
        </text>
        <text className="labMosfetMetricLabel" x={160} y={15}>
          DEVICE LOSS
        </text>
        <text className="labMosfetMetricValue" x={284} y={27} textAnchor="end">
          {metrics.mosfetTotalLoss.toFixed(2)} W
        </text>
        <text className="labMosfetMetricLabel" x={308} y={15}>
          EFFICIENCY
        </text>
        <text className="labMosfetMetricValue" x={432} y={27} textAnchor="end">
          {metrics.mosfetEfficiency.toFixed(1)}%
        </text>
        <text className="labMosfetMetricLabel" x={456} y={15}>
          JUNCTION
        </text>
        <text className="labMosfetMetricValue" x={580} y={27} textAnchor="end">
          {metrics.mosfetJunctionTemperature.toFixed(0)} °C
        </text>
      </g>
    </g>
  );
}

function AdcSamplingLab({
  ids,
  metrics,
  values,
}: {
  ids: LabVisualIds;
  metrics: LabMetrics;
  values: LabSimulationValues;
}) {
  const sampleCount = Math.max(
    5,
    Math.min(18, Math.round(metrics.adcSamplesPerCycle * 2)),
  );
  const analogCycles = Math.max(
    1.2,
    Math.min(4.2, values.adcInputFrequency * 0.7),
  );
  const displayedCycles = Math.max(
    0.8,
    Math.min(3.4, metrics.adcDisplayedFrequency * 0.9),
  );
  const analogPath = makeScopeSinePath({
    amplitude: 20,
    centerY: 80,
    cycles: analogCycles,
    samples: 100,
    width: 176,
    x: 18,
  });
  const reconstructedPath = makeScopeSinePath({
    amplitude: 17,
    centerY: 80,
    cycles: displayedCycles,
    samples: 100,
    width: 176,
    x: 18,
  });
  const sourcePath = makeScopeSinePath({
    amplitude: 9,
    centerY: 42,
    cycles: 1.6,
    samples: 42,
    width: 54,
    x: 12,
  });
  const samplePoints = Array.from({ length: sampleCount }, (_, index) => {
    const progress = sampleCount === 1 ? 0 : index / (sampleCount - 1);
    return {
      x: 18 + progress * 176,
      y:
        80 -
        Math.sin(progress * Math.PI * 2 * analogCycles) * 20,
    };
  });
  const sampleHoldPath = samplePoints
    .map((point, index) =>
      index === 0
        ? `M${point.x.toFixed(2)} ${point.y.toFixed(2)}`
        : `H${point.x.toFixed(2)} V${point.y.toFixed(2)}`,
    )
    .join(' ');
  const spectrumX =
    22 +
    Math.min(
      1,
      metrics.adcDisplayedFrequency /
        Math.max(0.05, metrics.adcNyquistFrequency),
    ) *
      172;
  const codeLeds = Math.min(12, Math.max(4, Math.round(values.adcBitDepth)));
  const healthy =
    !metrics.adcAliased &&
    !metrics.adcClipped &&
    metrics.adcSamplesPerCycle >= 4;
  const captureStatus = metrics.adcClipped
    ? 'OVER RANGE'
    : metrics.adcAliased
      ? 'ALIAS DETECTED'
      : metrics.adcSamplesPerCycle < 4
        ? 'SPARSE DATA'
        : 'VALID CAPTURE';

  return (
    <g className="labScene labAdcScene">
      <text className="labSectionLabel" x={34} y={43}>
        MIXED-SIGNAL ACQUISITION AND SPECTRUM ANALYSIS
      </text>

      <g className="labAdcBoard" transform="translate(24 62)">
        <rect
          className="labAdcBoardBody"
          filter={`url(#${ids.shadow})`}
          height={232}
          rx={10}
          width={354}
        />
        <rect className="labAdcBoardInset" height={218} rx={7} width={340} x={7} y={7} />
        <circle className="labAdcMount" cx={16} cy={16} r={5} />
        <circle className="labAdcMount" cx={338} cy={16} r={5} />
        <circle className="labAdcMount" cx={16} cy={216} r={5} />
        <circle className="labAdcMount" cx={338} cy={216} r={5} />
        <text className="labAdcBoardLabel" x={25} y={28}>
          PRECISION DATA ACQUISITION FIXTURE
        </text>

        <g className="labAdcSource" transform="translate(14 48)">
          <rect className="labAdcModule" height={92} rx={7} width={78} />
          <text className="labAdcModuleLabel" x={39} y={17} textAnchor="middle">
            SIGNAL SOURCE
          </text>
          <rect className="labAdcMiniScreen" height={38} rx={4} width={62} x={8} y={23} />
          <path className="labAdcSourceWave" d={sourcePath} />
          <text className="labAdcSourceValue" x={39} y={75} textAnchor="middle">
            {values.adcInputFrequency.toFixed(1)} kHz
          </text>
          <text className="labAdcSourceMeta" x={39} y={86} textAnchor="middle">
            {values.adcInputAmplitude.toFixed(2)} Vpk
          </text>
        </g>

        <path className="labAdcSignalTrace analog" d="M92 94 H108" />
        <LabFlow className="adcAnalogFlow" d="M94 94 H106" />

        <g className="labAdcFilter" transform="translate(108 48)">
          <rect className="labAdcModule filter" height={92} rx={7} width={98} />
          <text className="labAdcModuleLabel" x={49} y={17} textAnchor="middle">
            ANTI-ALIAS LPF
          </text>
          <path className="labAdcFilterTrace" d="M12 48 H27 L32 39 L42 57 L52 39 L62 57 L67 48 H84" />
          <line className="labAdcCapacitor" x1={70} x2={70} y1={38} y2={58} />
          <line className="labAdcCapacitor" x1={76} x2={76} y1={38} y2={58} />
          <text className="labAdcFilterValue" x={49} y={75} textAnchor="middle">
            fc {values.adcFilterCutoff.toFixed(1)} kHz
          </text>
          <text className="labAdcFilterMeta" x={49} y={86} textAnchor="middle">
            {(20 * Math.log10(metrics.adcFilterGain)).toFixed(1)} dB AT fIN
          </text>
        </g>

        <path className="labAdcSignalTrace filtered" d="M206 94 H220" />
        <LabFlow className="adcFilteredFlow" d="M208 94 H218" />

        <g className="labAdcConverter" transform="translate(220 38)">
          <rect className="labAdcConverterBody" height={122} rx={8} width={120} />
          <text className="labAdcModuleLabel" x={60} y={18} textAnchor="middle">
            SUCCESSIVE APPROX ADC
          </text>
          <rect className="labAdcConverterScreen" height={56} rx={5} width={96} x={12} y={27} />
          <text className="labAdcConverterValue" x={22} y={45}>
            {values.adcBitDepth.toFixed(0)} BIT
          </text>
          <text className="labAdcConverterValue" x={22} y={61}>
            {values.adcSampleRate.toFixed(1)} kS/s
          </text>
          <text className="labAdcConverterMeta" x={22} y={76}>
            VREF {values.adcReferenceVoltage.toFixed(1)} V
          </text>
          <g className="labAdcCodeLeds" transform="translate(13 96)">
            {Array.from({ length: codeLeds }, (_, index) => (
              <circle
                className={index % 3 === 0 ? 'active' : ''}
                cx={4 + index * (92 / Math.max(1, codeLeds - 1))}
                cy={0}
                key={`adc-bit-${index}`}
                r={3}
              />
            ))}
          </g>
          <text className="labAdcCodeLabel" x={60} y={114} textAnchor="middle">
            PEAK CODE {metrics.adcPeakCode.toFixed(0)}
          </text>
          <circle
            className={`labAdcStatus ${healthy ? 'healthy' : 'warning'}`}
            cx={108}
            cy={12}
            r={5}
          />
        </g>

        <path className="labAdcClockTrace" d="M280 160 V181 H116" />
        <g className="labAdcClock" transform="translate(36 170)">
          <rect className="labAdcClockBody" height={38} rx={6} width={120} />
          <path className="labAdcClockWave" d="M10 23 H20 V12 H31 V23 H42 V12 H53 V23 H64 V12 H75 V23" />
          <text className="labAdcClockLabel" x={84} y={16}>
            SAMPLE
          </text>
          <text className="labAdcClockValue" x={84} y={28}>
            {values.adcSampleRate.toFixed(1)}k
          </text>
        </g>
        <LabFlow className="adcClockFlow" d="M272 181 H159" />

        <g className="labAdcReference" transform="translate(176 174)">
          <rect className="labAdcReferenceBody" height={34} rx={6} width={150} />
          <text className="labAdcReferenceLabel" x={12} y={14}>
            LOW-NOISE REFERENCE
          </text>
          <text className="labAdcReferenceValue" x={138} y={24} textAnchor="end">
            ΔV {metrics.adcLsbMillivolts.toFixed(2)} mV
          </text>
        </g>
      </g>

      <path className="labProbeLead channelOne" d="M330 150 C370 58 380 85 398 104" />
      <path className="labProbeLead channelTwo" d="M364 156 C383 172 390 168 398 168" />
      <path className="labProbeLead ground" d="M344 268 C374 294 386 260 398 248" />

      <g className="labAdcAnalyzer" transform="translate(398 62)">
        <rect
          className="labScopeBody"
          filter={`url(#${ids.shadow})`}
          height={232}
          rx={10}
          style={{ fill: `url(#${ids.metal})` }}
          width={218}
        />
        <rect className="labScopeBezel" height={218} rx={7} width={204} x={7} y={7} />
        <circle className="labInstrumentScrew" cx={12} cy={12} r={3} />
        <circle className="labInstrumentScrew" cx={206} cy={12} r={3} />
        <text className="labInstrumentBrand" x={15} y={24}>
          MIXED-DOMAIN ANALYZER
        </text>
        <circle className="labInstrumentLedHalo" cx={196} cy={19} r={9} />
        <circle
          className={`labInstrumentLed ${healthy ? '' : 'warning'}`}
          cx={196}
          cy={19}
          r={5}
        />
        <rect
          className="labScopeScreen"
          height={146}
          rx={5}
          style={{ fill: `url(#${ids.scope})` }}
          width={190}
          x={14}
          y={36}
        />
        <path className="labAdcScopeGrid" d="M32 46 V174 M68 46 V174 M104 46 V174 M140 46 V174 M176 46 V174 M18 64 H200 M18 96 H200 M18 118 H200 M18 144 H200 M18 172 H200" />
        <g transform="translate(0 0)">
          <path className="labAdcAnalogTrace" d={analogPath} />
          <path className="labAdcReconstructedTrace" d={reconstructedPath} />
          <path className="labAdcSampleHold" d={sampleHoldPath} />
          {samplePoints.map((point, index) => (
            <circle
              className="labAdcSamplePoint"
              cx={point.x}
              cy={point.y}
              key={`adc-sample-${index}`}
              r={2.8}
            />
          ))}
        </g>
        <line className="labAdcSpectrumBaseline" x1={22} x2={194} y1={169} y2={169} />
        <line
          className={`labAdcSpectrumPeak ${metrics.adcAliased ? 'aliased' : ''}`}
          x1={spectrumX}
          x2={spectrumX}
          y1={169}
          y2={126}
        />
        <circle
          className={`labAdcSpectrumDot ${metrics.adcAliased ? 'aliased' : ''}`}
          cx={spectrumX}
          cy={126}
          r={3.5}
        />
        <text className="labAdcScopeLabel analog" x={20} y={54}>
          ANALOG + SAMPLES
        </text>
        <text className="labAdcScopeLabel spectrum" x={20} y={128}>
          FFT
        </text>
        <text className="labAdcScopeStatus" x={16} y={198}>
          {captureStatus}
        </text>
        <text className="labScopeReadout secondary" x={202} y={198} textAnchor="end">
          {metrics.adcDisplayedFrequency.toFixed(2)} kHz
        </text>
        <circle className="labScopeKnob" cx={32} cy={215} r={7} />
        <circle className="labScopeKnob" cx={52} cy={215} r={7} />
        <circle className="labScopeJack channelOne" cx={112} cy={215} r={7} />
        <circle className="labScopeJack channelTwo" cx={136} cy={215} r={7} />
      </g>

      <g className="labAdcMetricBand" transform="translate(24 306)">
        <rect
          className={`labMetricBand adc ${healthy ? 'healthy' : 'warning'}`}
          height={38}
          rx={6}
          width={592}
        />
        <line x1={148} x2={148} y1={6} y2={32} />
        <line x1={296} x2={296} y1={6} y2={32} />
        <line x1={444} x2={444} y1={6} y2={32} />
        <text className="labAdcMetricLabel" x={12} y={15}>
          DISPLAY FREQ
        </text>
        <text className="labAdcMetricValue" x={136} y={27} textAnchor="end">
          {metrics.adcDisplayedFrequency.toFixed(2)} kHz
        </text>
        <text className="labAdcMetricLabel" x={160} y={15}>
          NYQUIST
        </text>
        <text className="labAdcMetricValue" x={284} y={27} textAnchor="end">
          {metrics.adcNyquistFrequency.toFixed(2)} kHz
        </text>
        <text className="labAdcMetricLabel" x={308} y={15}>
          RESOLUTION
        </text>
        <text className="labAdcMetricValue" x={432} y={27} textAnchor="end">
          {metrics.adcLsbMillivolts.toFixed(2)} mV
        </text>
        <text className="labAdcMetricLabel" x={456} y={15}>
          EFFECTIVE SNR
        </text>
        <text className="labAdcMetricValue" x={580} y={27} textAnchor="end">
          {metrics.adcEffectiveSnr.toFixed(1)} dB
        </text>
      </g>
    </g>
  );
}

function ResonanceLab({
  ids,
  metrics,
  values,
}: {
  ids: LabVisualIds;
  metrics: LabMetrics;
  values: LabSimulationValues;
}) {
  const minimumFrequency = metrics.resonanceFrequency / 4;
  const maximumFrequency = metrics.resonanceFrequency * 4;
  const logarithmicSpan = Math.log(maximumFrequency / minimumFrequency);
  const frequencyToScreenX = (frequency: number) =>
    22 +
    Math.max(
      0,
      Math.min(
        1,
        Math.log(frequency / minimumFrequency) / logarithmicSpan,
      ),
    ) *
      154;
  const markerX = frequencyToScreenX(values.resonanceFrequency);
  const markerY = 130 - metrics.resonanceCurrentRatio * 75;
  const lowerCutoffX = frequencyToScreenX(metrics.resonanceLowerCutoff);
  const upperCutoffX = frequencyToScreenX(metrics.resonanceUpperCutoff);
  const responsePath = makeResonanceResponsePath({
    capacitanceMicrofarads: values.resonanceCapacitance,
    centerFrequency: metrics.resonanceFrequency,
    height: 75,
    inductanceMillihenries: values.resonanceInductance,
    resistance: values.resonanceResistance,
    width: 154,
    x: 22,
    y: 55,
  });
  const phaseNeedleX =
    99 + Math.sin((metrics.resonancePhase * Math.PI) / 180) * 36;
  const phaseNeedleY =
    205 - Math.cos((metrics.resonancePhase * Math.PI) / 180) * 24;
  const resonanceState =
    Math.abs(metrics.resonancePhase) <= 3
      ? 'AT RESONANCE'
      : metrics.resonancePhase < 0
        ? 'CAPACITIVE'
        : 'INDUCTIVE';
  const stressWarning =
    Math.max(
      metrics.resonanceCapacitorVoltage,
      metrics.resonanceInductorVoltage,
    ) >
    values.resonanceSourceVoltage * 8;

  return (
    <g className="labScene labResonanceScene">
      <text className="labSectionLabel" x={34} y={43}>
        SERIES RLC IMPEDANCE AND FREQUENCY RESPONSE
      </text>

      <g className="labResonanceBoard" transform="translate(22 62)">
        <rect
          className="labResonanceBoardBody"
          filter={`url(#${ids.shadow})`}
          height={232}
          rx={10}
          width={380}
        />
        <rect
          className="labResonanceBoardInset"
          height={218}
          rx={7}
          width={366}
          x={7}
          y={7}
        />
        <circle className="labInstrumentScrew" cx={13} cy={13} r={3} />
        <circle className="labInstrumentScrew" cx={367} cy={13} r={3} />
        <text className="labInstrumentBrand" x={18} y={27}>
          SERIES RLC TEST FIXTURE
        </text>
        <text className="labResonanceSweepReadout" x={360} y={27} textAnchor="end">
          {values.resonanceFrequency.toFixed(0)} Hz
        </text>

        <circle
          className="labResonanceSource"
          cx={54}
          cy={139}
          filter={`url(#${ids.shadow})`}
          r={31}
          style={{ fill: `url(#${ids.source})` }}
        />
        <circle className="labResonanceSourceInset" cx={54} cy={139} r={24} />
        <path
          className="labResonanceSourceWave"
          d="M35 139 C40 126 47 126 53 139 S66 152 73 139"
        />
        <text className="labResonanceSourceLabel" x={54} y={183} textAnchor="middle">
          {values.resonanceSourceVoltage.toFixed(1)} V RMS
        </text>

        <path
          className="labResonanceWire"
          d="M54 108 V92 H112 M180 92 H202 M286 92 H313 M327 92 H350 V195 H54 V170"
        />
        <rect
          className="labResonanceResistorHalo"
          height={42}
          rx={18}
          width={82}
          x={105}
          y={71}
        />
        <rect
          className="labResonanceResistor"
          filter={`url(#${ids.shadow})`}
          height={28}
          rx={13}
          style={{ fill: `url(#${ids.axial})` }}
          width={68}
          x={112}
          y={78}
        />
        <line className="labResonanceBand brown" x1={128} x2={128} y1={79} y2={105} />
        <line className="labResonanceBand red" x1={143} x2={143} y1={79} y2={105} />
        <line className="labResonanceBand black" x1={158} x2={158} y1={79} y2={105} />
        <line className="labResonanceBand gold" x1={170} x2={170} y1={79} y2={105} />
        <text className="labResonanceComponentLabel" x={146} y={126} textAnchor="middle">
          R {values.resonanceResistance.toFixed(0)} Ω
        </text>

        <ellipse
          className="labResonanceEnergyHalo inductor"
          cx={244}
          cy={92}
          rx={51}
          ry={34}
        />
        <path
          className="labResonanceInductor"
          d="M202 92 C207 72 219 72 224 92 C229 72 241 72 246 92 C251 72 263 72 268 92 C273 72 281 72 286 92"
        />
        <path
          className="labResonanceInductorHighlight"
          d="M205 87 C211 73 218 75 222 87 M228 87 C234 73 241 75 244 87 M250 87 C256 73 263 75 266 87"
        />
        <text className="labResonanceComponentLabel" x={244} y={126} textAnchor="middle">
          L {values.resonanceInductance.toFixed(0)} mH
        </text>

        <ellipse
          className={`labResonanceEnergyHalo capacitor ${
            stressWarning ? 'warning' : ''
          }`}
          cx={320}
          cy={92}
          rx={30}
          ry={38}
        />
        <rect className="labResonanceCapacitorFilm" height={54} rx={4} width={25} x={307} y={65} />
        <line className="labResonanceCapacitorPlate" x1={313} x2={313} y1={70} y2={114} />
        <line className="labResonanceCapacitorPlate" x1={327} x2={327} y1={70} y2={114} />
        <text className="labResonanceComponentLabel" x={320} y={143} textAnchor="middle">
          C {values.resonanceCapacitance.toFixed(2)} µF
        </text>

        <LabFlow
          className="resonance"
          d="M54 108 V92 H350 V195 H54 V170"
        />
        <circle className="labResonanceNode" cx={202} cy={92} r={4} />
        <circle className="labResonanceNode" cx={350} cy={92} r={4} />
        <text className="labResonanceState" x={211} y={179} textAnchor="middle">
          {resonanceState}
        </text>
        <text className="labResonanceStateMeta" x={211} y={199} textAnchor="middle">
          XL {metrics.resonanceInductiveReactance.toFixed(1)} Ω · XC{' '}
          {metrics.resonanceCapacitiveReactance.toFixed(1)} Ω
        </text>
        <text className="labResonanceVoltageMeta" x={211} y={217} textAnchor="middle">
          VL {metrics.resonanceInductorVoltage.toFixed(1)} V · VC{' '}
          {metrics.resonanceCapacitorVoltage.toFixed(1)} V
        </text>
      </g>

      <path className="labResonanceSenseLead" d="M224 154 C330 28 374 54 432 92" />
      <path className="labResonanceSenseLead secondary" d="M372 154 C406 164 414 176 432 188" />

      <g className="labResonanceAnalyzer" transform="translate(420 62)">
        <rect
          className="labResonanceAnalyzerBody"
          filter={`url(#${ids.shadow})`}
          height={232}
          rx={10}
          style={{ fill: `url(#${ids.metal})` }}
          width={198}
        />
        <rect className="labResonanceAnalyzerBezel" height={218} rx={7} width={184} x={7} y={7} />
        <circle className="labInstrumentScrew" cx={12} cy={12} r={3} />
        <circle className="labInstrumentScrew" cx={186} cy={12} r={3} />
        <text className="labInstrumentBrand" x={14} y={24}>
          NETWORK ANALYZER
        </text>
        <circle className="labInstrumentLedHalo" cx={177} cy={19} r={9} />
        <circle
          className={`labInstrumentLed ${
            metrics.resonanceNearPeak ? '' : 'warning'
          }`}
          cx={177}
          cy={19}
          r={5}
        />
        <rect
          className="labResonanceScreen"
          height={126}
          rx={5}
          style={{ fill: `url(#${ids.scope})` }}
          width={174}
          x={12}
          y={36}
        />
        <path
          className="labResonanceGrid"
          d="M22 55 V140 M60 55 V140 M99 55 V140 M137 55 V140 M176 55 V140 M22 70 H176 M22 100 H176 M22 130 H176"
        />
        <rect
          className="labResonanceBandwidth"
          height={75}
          width={Math.max(2, upperCutoffX - lowerCutoffX)}
          x={lowerCutoffX}
          y={55}
        />
        <line
          className="labResonanceCenterLine"
          x1={99}
          x2={99}
          y1={50}
          y2={140}
        />
        <path className="labResonanceTraceGlow" d={responsePath} />
        <path className="labResonanceTrace" d={responsePath} />
        <line
          className="labResonanceMarkerStem"
          x1={markerX}
          x2={markerX}
          y1={markerY}
          y2={140}
        />
        <circle
          className="labResonanceMarker"
          cx={markerX}
          cy={markerY}
          r={4.5}
        />
        <text className="labResonanceAxisLabel" x={22} y={151}>
          f₀/4
        </text>
        <text className="labResonanceAxisLabel" x={176} y={151} textAnchor="end">
          4f₀
        </text>
        <text className="labResonanceScreenMode" x={23} y={49}>
          SERIES CURRENT · LOG SWEEP
        </text>
        <text className="labResonanceAnalyzerReadout" x={18} y={180}>
          {metrics.resonanceCurrent.toFixed(3)} A
        </text>
        <text className="labResonanceAnalyzerSecondary" x={184} y={180} textAnchor="end">
          Z {metrics.resonanceImpedance.toFixed(1)} Ω
        </text>
        <path className="labResonancePhaseArc" d="M62 211 A37 37 0 0 1 136 211" />
        <line
          className="labResonancePhaseNeedle"
          x1={99}
          x2={phaseNeedleX}
          y1={205}
          y2={phaseNeedleY}
        />
        <circle className="labResonancePhaseHub" cx={99} cy={205} r={4} />
        <text className="labResonancePhaseLabel" x={99} y={225} textAnchor="middle">
          PHASE {metrics.resonancePhase.toFixed(1)}°
        </text>
      </g>

      <g className="labResonanceMetricBand" transform="translate(24 306)">
        <rect
          className={`labMetricBand resonance ${
            metrics.resonanceNearPeak ? 'nearPeak' : ''
          }`}
          height={38}
          rx={6}
          width={592}
        />
        <line x1={148} x2={148} y1={6} y2={32} />
        <line x1={296} x2={296} y1={6} y2={32} />
        <line x1={444} x2={444} y1={6} y2={32} />
        <text className="labResonanceMetricLabel" x={12} y={15}>
          CENTER FREQ
        </text>
        <text className="labResonanceMetricValue" x={136} y={27} textAnchor="end">
          {metrics.resonanceFrequency.toFixed(0)} Hz
        </text>
        <text className="labResonanceMetricLabel" x={160} y={15}>
          QUALITY
        </text>
        <text className="labResonanceMetricValue" x={284} y={27} textAnchor="end">
          Q {metrics.resonanceQualityFactor.toFixed(2)}
        </text>
        <text className="labResonanceMetricLabel" x={308} y={15}>
          BANDWIDTH
        </text>
        <text className="labResonanceMetricValue" x={432} y={27} textAnchor="end">
          {metrics.resonanceBandwidth.toFixed(0)} Hz
        </text>
        <text className="labResonanceMetricLabel" x={456} y={15}>
          RESISTOR
        </text>
        <text className="labResonanceMetricValue" x={580} y={27} textAnchor="end">
          {metrics.resonanceResistorPower.toFixed(2)} W
        </text>
      </g>
    </g>
  );
}

function TransformerLab({
  ids,
  metrics,
  values,
}: {
  ids: LabVisualIds;
  metrics: LabMetrics;
  values: LabSimulationValues;
}) {
  const healthy =
    !metrics.transformerSaturated &&
    metrics.transformerLoadPercent <= 100 &&
    metrics.transformerTemperatureRise <= 55;
  const primaryWave = makeScopeSinePath({
    amplitude: 17,
    centerY: 76,
    cycles: 2.4,
    samples: 90,
    width: 168,
    x: 22,
  });
  const secondaryAmplitude = Math.max(
    8,
    Math.min(
      19,
      8 + metrics.transformerSecondaryVoltage / 15,
    ),
  );
  const secondaryWave = makeScopeSinePath({
    amplitude: secondaryAmplitude,
    centerY: 76,
    cycles: 2.4,
    samples: 90,
    width: 168,
    x: 22,
  });
  const sourceWave = makeScopeSinePath({
    amplitude: 10,
    centerY: 42,
    cycles: 1.5,
    samples: 46,
    width: 54,
    x: 12,
  });
  const fluxBarWidth = Math.min(
    74,
    Math.max(4, (metrics.transformerFluxDensity / 1.6) * 74),
  );
  const heatOpacity = Math.min(
    0.72,
    0.08 + metrics.transformerTemperatureRise / 110,
  );
  const operatingState = metrics.transformerSaturated
    ? 'CORE SATURATED'
    : metrics.transformerLoadPercent > 100
      ? 'OUTPUT OVERLOAD'
      : metrics.transformerTemperatureRise > 55
        ? 'THERMAL WARNING'
        : 'MAGNETICS HEALTHY';

  return (
    <g className="labScene labTransformerScene">
      <text className="labSectionLabel" x={34} y={43}>
        SINGLE-PHASE TRANSFORMER AND MAGNETIC CORE ANALYSIS
      </text>

      <g className="labTransformerBoard" transform="translate(24 62)">
        <rect
          className="labTransformerBoardBody"
          filter={`url(#${ids.shadow})`}
          height={232}
          rx={10}
          width={366}
        />
        <rect
          className="labTransformerBoardInset"
          height={218}
          rx={7}
          width={352}
          x={7}
          y={7}
        />
        <circle className="labTransformerMount" cx={16} cy={16} r={5} />
        <circle className="labTransformerMount" cx={350} cy={16} r={5} />
        <circle className="labTransformerMount" cx={16} cy={216} r={5} />
        <circle className="labTransformerMount" cx={350} cy={216} r={5} />
        <text className="labTransformerBoardLabel" x={25} y={28}>
          MAGNETIC COMPONENT TEST FIXTURE
        </text>

        <g className="labTransformerSource" transform="translate(14 53)">
          <rect className="labTransformerModule" height={112} rx={7} width={82} />
          <text
            className="labTransformerModuleLabel"
            x={41}
            y={17}
            textAnchor="middle"
          >
            AC SOURCE
          </text>
          <rect
            className="labTransformerMiniScreen"
            height={38}
            rx={4}
            width={62}
            x={10}
            y={23}
          />
          <path className="labTransformerSourceWave" d={sourceWave} />
          <text
            className="labTransformerSourceValue"
            x={41}
            y={77}
            textAnchor="middle"
          >
            {values.transformerPrimaryVoltage.toFixed(0)} V RMS
          </text>
          <text
            className="labTransformerSourceMeta"
            x={41}
            y={92}
            textAnchor="middle"
          >
            {values.transformerFrequency.toFixed(0)} Hz
          </text>
          <circle
            className={`labTransformerSourceLed ${
              metrics.transformerSaturated ? 'warning' : ''
            }`}
            cx={41}
            cy={103}
            r={4}
          />
        </g>

        <path className="labTransformerPrimaryWire" d="M96 89 H119 M96 141 H119" />
        <LabFlow className="transformerPrimaryFlow" d="M98 89 H116" />
        <LabFlow className="transformerPrimaryFlow return" d="M116 141 H98" />

        <g className="labTransformerAssembly" transform="translate(118 42)">
          <circle
            className={`labTransformerHeat ${
              metrics.transformerSaturated ? 'saturated' : ''
            }`}
            cx={69}
            cy={73}
            r={70}
            style={{ opacity: heatOpacity }}
          />
          <rect
            className="labTransformerCore"
            filter={`url(#${ids.shadow})`}
            height={146}
            rx={8}
            width={138}
          />
          <rect
            className="labTransformerCoreWindow"
            height={92}
            rx={5}
            width={58}
            x={40}
            y={27}
          />
          {Array.from({ length: 7 }, (_, index) => (
            <path
              className="labTransformerLamination"
              d={`M${9 + index * 4} 8 V138 M${129 - index * 4} 8 V138`}
              key={`transformer-lamination-${index}`}
            />
          ))}
          <path
            className={`labTransformerFlux ${
              metrics.transformerSaturated ? 'saturated' : ''
            }`}
            d="M26 17 H112 Q124 17 124 29 V117 Q124 129 112 129 H26 Q14 129 14 117 V29 Q14 17 26 17"
          />

          <g className="labTransformerPrimaryCoil">
            {Array.from({ length: 6 }, (_, index) => (
              <path
                d={`M35 ${35 + index * 13} C17 ${35 + index * 13} 17 ${
                  45 + index * 13
                } 35 ${45 + index * 13}`}
                key={`transformer-primary-coil-${index}`}
              />
            ))}
          </g>
          <g className="labTransformerSecondaryCoil">
            {Array.from({ length: 6 }, (_, index) => (
              <path
                d={`M103 ${35 + index * 13} C121 ${35 + index * 13} 121 ${
                  45 + index * 13
                } 103 ${45 + index * 13}`}
                key={`transformer-secondary-coil-${index}`}
              />
            ))}
          </g>
          <text className="labTransformerWindingLabel primary" x={18} y={142}>
            N₁ {values.transformerPrimaryTurns.toFixed(0)}
          </text>
          <text
            className="labTransformerWindingLabel secondary"
            x={120}
            y={142}
            textAnchor="end"
          >
            N₂ {values.transformerSecondaryTurns.toFixed(0)}
          </text>
          <text
            className="labTransformerCoreLabel"
            x={69}
            y={69}
            textAnchor="middle"
          >
            LAMINATED
          </text>
          <text
            className="labTransformerCoreLabel"
            x={69}
            y={81}
            textAnchor="middle"
          >
            STEEL CORE
          </text>
          <text
            className={`labTransformerFluxValue ${
              metrics.transformerSaturated ? 'saturated' : ''
            }`}
            x={69}
            y={99}
            textAnchor="middle"
          >
            {metrics.transformerFluxDensity.toFixed(2)} T
          </text>
        </g>

        <path className="labTransformerSecondaryWire" d="M256 89 H270 M256 141 H270" />
        <LabFlow className="transformerSecondaryFlow" d="M258 89 H268" />
        <LabFlow className="transformerSecondaryFlow return" d="M268 141 H258" />

        <g className="labTransformerLoad" transform="translate(270 53)">
          <rect className="labTransformerLoadBody" height={112} rx={7} width={80} />
          <text
            className="labTransformerModuleLabel"
            x={40}
            y={17}
            textAnchor="middle"
          >
            LOAD BANK
          </text>
          <rect
            className="labTransformerLoadScreen"
            height={36}
            rx={4}
            width={60}
            x={10}
            y={25}
          />
          <text
            className="labTransformerLoadValue"
            x={40}
            y={47}
            textAnchor="middle"
          >
            {metrics.transformerSecondaryVoltage.toFixed(1)} V
          </text>
          <path
            className="labTransformerResistor"
            d="M14 78 H23 L28 69 L38 87 L48 69 L58 87 L63 78 H68"
          />
          <text
            className="labTransformerLoadMeta"
            x={40}
            y={101}
            textAnchor="middle"
          >
            {metrics.transformerSecondaryCurrent.toFixed(2)} A ·{' '}
            {values.transformerLoadResistance.toFixed(0)} Ω
          </text>
          <circle
            className={`labTransformerLoadLed ${healthy ? 'healthy' : 'warning'}`}
            cx={68}
            cy={12}
            r={4}
          />
        </g>

        <g className="labTransformerNameplate" transform="translate(105 196)">
          <rect height={25} rx={5} width={244} />
          <text x={10} y={11}>
            RATIO {metrics.transformerTurnsRatio.toFixed(3)}
          </text>
          <text x={10} y={20}>
            Ae {values.transformerCoreArea.toFixed(1)} cm²
          </text>
          <text x={232} y={11} textAnchor="end">
            REG {metrics.transformerRegulation.toFixed(1)}%
          </text>
          <text x={232} y={20} textAnchor="end">
            ΔT {metrics.transformerTemperatureRise.toFixed(0)} °C
          </text>
        </g>
      </g>

      <path
        className="labProbeLead channelOne"
        d="M345 151 C382 65 394 85 404 104"
      />
      <path
        className="labProbeLead channelTwo"
        d="M374 154 C394 174 398 166 404 164"
      />
      <path
        className="labProbeLead ground"
        d="M348 270 C378 294 393 260 404 248"
      />

      <g className="labTransformerAnalyzer" transform="translate(404 62)">
        <rect
          className="labScopeBody"
          filter={`url(#${ids.shadow})`}
          height={232}
          rx={10}
          style={{ fill: `url(#${ids.metal})` }}
          width={212}
        />
        <rect className="labScopeBezel" height={218} rx={7} width={198} x={7} y={7} />
        <circle className="labInstrumentScrew" cx={12} cy={12} r={3} />
        <circle className="labInstrumentScrew" cx={200} cy={12} r={3} />
        <text className="labInstrumentBrand" x={15} y={24}>
          MAGNETICS POWER ANALYZER
        </text>
        <circle className="labInstrumentLedHalo" cx={190} cy={19} r={9} />
        <circle
          className={`labInstrumentLed ${healthy ? '' : 'warning'}`}
          cx={190}
          cy={19}
          r={5}
        />
        <rect
          className="labScopeScreen"
          height={146}
          rx={5}
          style={{ fill: `url(#${ids.scope})` }}
          width={184}
          x={14}
          y={36}
        />
        <path
          className="labTransformerScopeGrid"
          d="M32 46 V174 M68 46 V174 M104 46 V174 M140 46 V174 M176 46 V174 M18 62 H194 M18 90 H194 M18 112 H194 M18 140 H194 M18 172 H194"
        />
        <path className="labTransformerPrimaryWave" d={primaryWave} />
        <path className="labTransformerSecondaryWave" d={secondaryWave} />
        <text className="labTransformerScopeLabel primary" x={20} y={54}>
          V₁
        </text>
        <text className="labTransformerScopeLabel secondary" x={38} y={54}>
          V₂
        </text>
        <text className="labTransformerFluxLabel" x={20} y={126}>
          CORE FLUX
        </text>
        <rect className="labTransformerFluxGauge" height={12} rx={4} width={76} x={20} y={134} />
        <rect
          className={`labTransformerFluxGaugeFill ${
            metrics.transformerSaturated ? 'saturated' : ''
          }`}
          height={8}
          rx={3}
          width={fluxBarWidth}
          x={22}
          y={136}
        />
        <text className="labTransformerAnalyzerValue" x={105} y={144}>
          {metrics.transformerFluxDensity.toFixed(2)} T
        </text>
        <text className="labTransformerAnalyzerLabel" x={20} y={164}>
          EFF {metrics.transformerEfficiency.toFixed(1)}%
        </text>
        <text
          className="labTransformerAnalyzerLabel"
          x={190}
          y={164}
          textAnchor="end"
        >
          LOSS {metrics.transformerTotalLoss.toFixed(2)} W
        </text>
        <text
          className={`labTransformerAnalyzerStatus ${healthy ? 'healthy' : 'warning'}`}
          x={16}
          y={198}
        >
          {operatingState}
        </text>
        <text
          className="labScopeReadout secondary"
          x={196}
          y={198}
          textAnchor="end"
        >
          {metrics.transformerSecondaryVoltage.toFixed(1)} V
        </text>
        <circle className="labScopeKnob" cx={32} cy={215} r={7} />
        <circle className="labScopeKnob" cx={52} cy={215} r={7} />
        <circle className="labScopeJack channelOne" cx={108} cy={215} r={7} />
        <circle className="labScopeJack channelTwo" cx={132} cy={215} r={7} />
      </g>

      <g className="labTransformerMetricBand" transform="translate(24 306)">
        <rect
          className={`labMetricBand transformer ${
            healthy ? 'healthy' : 'warning'
          }`}
          height={38}
          rx={6}
          width={592}
        />
        <line x1={148} x2={148} y1={6} y2={32} />
        <line x1={296} x2={296} y1={6} y2={32} />
        <line x1={444} x2={444} y1={6} y2={32} />
        <text className="labTransformerMetricLabel" x={12} y={15}>
          SECONDARY
        </text>
        <text
          className="labTransformerMetricValue"
          x={136}
          y={27}
          textAnchor="end"
        >
          {metrics.transformerSecondaryVoltage.toFixed(1)} V
        </text>
        <text className="labTransformerMetricLabel" x={160} y={15}>
          CORE FLUX
        </text>
        <text
          className="labTransformerMetricValue"
          x={284}
          y={27}
          textAnchor="end"
        >
          {metrics.transformerFluxDensity.toFixed(2)} T
        </text>
        <text className="labTransformerMetricLabel" x={308} y={15}>
          EFFICIENCY
        </text>
        <text
          className="labTransformerMetricValue"
          x={432}
          y={27}
          textAnchor="end"
        >
          {metrics.transformerEfficiency.toFixed(1)}%
        </text>
        <text className="labTransformerMetricLabel" x={456} y={15}>
          LOAD
        </text>
        <text
          className="labTransformerMetricValue"
          x={580}
          y={27}
          textAnchor="end"
        >
          {metrics.transformerLoadPercent.toFixed(0)}%
        </text>
      </g>
    </g>
  );
}

function PidServoLab({
  ids,
  metrics,
  values,
}: {
  ids: LabVisualIds;
  metrics: LabMetrics;
  values: LabSimulationValues;
}) {
  const stable =
    metrics.pidDampingRatio >= 0.55 &&
    metrics.pidOvershoot <= 15 &&
    metrics.pidControlEffort < 95;
  const saturated = metrics.pidControlEffort >= 95;
  const responsePath = makePidStepResponsePath({
    dampingRatio: metrics.pidDampingRatio,
    finalValue: metrics.pidFinalValue,
    naturalFrequency: metrics.pidNaturalFrequency,
    setpoint: values.pidSetpoint,
  });
  const rotorAngle = Math.min(90, Math.max(20, values.pidSetpoint));

  return (
    <g className="labScene labPidScene">
      <text className="labSectionLabel" x={34} y={43}>
        CLOSED-LOOP POSITION CONTROL AND STEP RESPONSE
      </text>

      <g className="labPidBoard" transform="translate(24 62)">
        <rect
          className="labPidBoardBody"
          filter={`url(#${ids.shadow})`}
          height={232}
          rx={10}
          width={348}
        />
        <rect className="labPidBoardInset" height={218} rx={7} width={334} x={7} y={7} />
        <circle className="labPidMount" cx={16} cy={16} r={5} />
        <circle className="labPidMount" cx={332} cy={16} r={5} />
        <circle className="labPidMount" cx={16} cy={216} r={5} />
        <circle className="labPidMount" cx={332} cy={216} r={5} />
        <text className="labPidBoardLabel" x={25} y={28}>
          SERVO CONTROL FIXTURE
        </text>

        <g className="labPidCommand" transform="translate(18 58)">
          <rect className="labPidModule" height={76} rx={7} width={70} />
          <text className="labPidModuleLabel" x={35} y={17} textAnchor="middle">
            COMMAND
          </text>
          <circle className="labPidCommandDial" cx={35} cy={45} r={18} />
          <g
            className="labPidCommandNeedle"
            style={
              {
                '--pid-command-angle': `${rotorAngle - 45}deg`,
              } as CSSProperties
            }
          >
            <line x1={35} x2={35} y1={45} y2={30} />
          </g>
          <text className="labPidCommandValue" x={35} y={71} textAnchor="middle">
            {values.pidSetpoint.toFixed(0)}°
          </text>
        </g>

        <path className="labPidSignalTrace" d="M88 96 H106" />

        <g className="labPidController" transform="translate(106 42)">
          <rect className="labPidControllerBody" height={120} rx={8} width={120} />
          <text className="labPidModuleLabel" x={60} y={19} textAnchor="middle">
            DIGITAL PID
          </text>
          <rect className="labPidControllerScreen" height={78} rx={5} width={96} x={12} y={29} />
          <text className="labPidGainLabel" x={24} y={47}>
            KP
          </text>
          <text className="labPidGainValue" x={96} y={47} textAnchor="end">
            {values.pidProportionalGain.toFixed(2)}
          </text>
          <text className="labPidGainLabel" x={24} y={68}>
            KI
          </text>
          <text className="labPidGainValue" x={96} y={68} textAnchor="end">
            {values.pidIntegralGain.toFixed(2)}
          </text>
          <text className="labPidGainLabel" x={24} y={89}>
            KD
          </text>
          <text className="labPidGainValue" x={96} y={89} textAnchor="end">
            {values.pidDerivativeGain.toFixed(2)}
          </text>
          <circle
            className={`labPidStatus ${stable ? 'stable' : ''} ${
              saturated ? 'saturated' : ''
            }`}
            cx={106}
            cy={12}
            r={5}
          />
        </g>

        <path className="labPidDriveTrace" d="M226 96 H245" />
        <g className="labPidServo" transform="translate(245 46)">
          <rect className="labPidServoMount" height={106} rx={9} width={84} />
          <circle className="labPidServoBody" cx={42} cy={50} r={34} />
          <circle className="labPidServoHub" cx={42} cy={50} r={8} />
          <g
            className={`labPidRotor ${stable ? 'stable' : 'ringing'}`}
            style={
              {
                '--pid-angle': `${rotorAngle}deg`,
              } as CSSProperties
            }
          >
            <line x1={42} x2={42} y1={50} y2={21} />
            <circle cx={42} cy={20} r={4} />
          </g>
          <text className="labPidServoLabel" x={42} y={96} textAnchor="middle">
            SERVO PLANT
          </text>
        </g>

        <g className="labPidEncoder" transform="translate(232 170)">
          <rect className="labPidEncoderBody" height={38} rx={6} width={98} />
          <circle className="labPidEncoderDisc" cx={18} cy={19} r={10} />
          <path className="labPidEncoderTicks" d="M18 6 V11 M18 27 V32 M5 19 H10 M26 19 H31" />
          <text className="labPidEncoderLabel" x={38} y={17}>
            ENCODER
          </text>
          <text className="labPidEncoderValue" x={38} y={30}>
            {metrics.pidFinalValue.toFixed(1)}°
          </text>
        </g>

        <path className="labPidFeedbackTrace" d="M232 189 H52 V134" />
        <text className="labPidFeedbackLabel" x={58} y={181}>
          POSITION FEEDBACK
        </text>
        <LabFlow className="pidCommandFlow" d="M90 96 H103" />
        <LabFlow
          className={`pidDriveFlow ${saturated ? 'saturated' : ''}`}
          d="M228 96 H242"
        />
        <LabFlow className="pidFeedbackFlow" d="M228 189 H55 V138" />
      </g>

      <path className="labProbeLead channelOne" d="M178 220 C318 46 350 75 392 104" />
      <path className="labProbeLead channelTwo" d="M310 188 C352 196 362 174 392 168" />
      <path className="labProbeLead ground" d="M330 270 C360 296 378 266 392 252" />

      <g className="labPidAnalyzer" transform="translate(392 62)">
        <rect
          className="labScopeBody"
          filter={`url(#${ids.shadow})`}
          height={232}
          rx={10}
          style={{ fill: `url(#${ids.metal})` }}
          width={224}
        />
        <rect className="labScopeBezel" height={218} rx={7} width={210} x={7} y={7} />
        <circle className="labInstrumentScrew" cx={12} cy={12} r={3} />
        <circle className="labInstrumentScrew" cx={212} cy={12} r={3} />
        <text className="labInstrumentBrand" x={15} y={24}>
          STEP RESPONSE ANALYZER
        </text>
        <circle className="labInstrumentLedHalo" cx={202} cy={19} r={9} />
        <circle
          className={`labInstrumentLed ${stable ? '' : 'warning'}`}
          cx={202}
          cy={19}
          r={5}
        />
        <rect
          className="labScopeScreen"
          height={140}
          rx={5}
          style={{ fill: `url(#${ids.scope})` }}
          width={196}
          x={14}
          y={36}
        />
        <path className="labScopeGrid" d="M24 48 V166 M62 48 V166 M100 48 V166 M138 48 V166 M176 48 V166 M24 78 H200 M24 108 H200 M24 138 H200 M24 166 H200" />
        <rect className="labPidToleranceBand" height={12} rx={3} width={178} x={24} y={44} />
        <path className="labPidSetpointLine" d="M24 50 H202" />
        <path className="labPidResponseTrace" d={responsePath} />
        <text className="labPidScopeLabel command" x={26} y={62}>
          COMMAND
        </text>
        <text className="labPidScopeLabel response" x={26} y={151}>
          RESPONSE
        </text>
        <text className="labScopeReadout" x={16} y={196}>
          {metrics.pidSettlingTime.toFixed(2)} s SETTLE
        </text>
        <text className="labScopeReadout secondary" x={208} y={196} textAnchor="end">
          {metrics.pidOvershoot.toFixed(1)}% OS
        </text>
        <circle className="labScopeKnob" cx={32} cy={215} r={7} />
        <circle className="labScopeKnob" cx={52} cy={215} r={7} />
        <circle className="labScopeJack channelOne" cx={116} cy={215} r={7} />
        <circle className="labScopeJack channelTwo" cx={140} cy={215} r={7} />
      </g>

      <g className="labPidMetricBand" transform="translate(24 306)">
        <rect
          className={`labMetricBand pid ${stable ? 'stable' : ''} ${
            saturated ? 'saturated' : ''
          }`}
          height={38}
          rx={6}
          width={592}
        />
        <line x1={148} x2={148} y1={6} y2={32} />
        <line x1={296} x2={296} y1={6} y2={32} />
        <line x1={444} x2={444} y1={6} y2={32} />
        <text className="labPidMetricLabel" x={12} y={15}>
          SETTLING
        </text>
        <text className="labPidMetricValue" x={136} y={27} textAnchor="end">
          {metrics.pidSettlingTime.toFixed(2)} s
        </text>
        <text className="labPidMetricLabel" x={160} y={15}>
          OVERSHOOT
        </text>
        <text className="labPidMetricValue" x={284} y={27} textAnchor="end">
          {metrics.pidOvershoot.toFixed(1)}%
        </text>
        <text className="labPidMetricLabel" x={308} y={15}>
          DAMPING
        </text>
        <text className="labPidMetricValue" x={432} y={27} textAnchor="end">
          ζ {metrics.pidDampingRatio.toFixed(2)}
        </text>
        <text className="labPidMetricLabel" x={456} y={15}>
          DRIVE
        </text>
        <text className="labPidMetricValue" x={580} y={27} textAnchor="end">
          {metrics.pidControlEffort.toFixed(0)}%
        </text>
      </g>
    </g>
  );
}

function TransmissionLineLab({
  ids,
  metrics,
  values,
}: {
  ids: LabVisualIds;
  metrics: LabMetrics;
  values: LabSimulationValues;
}) {
  const phaseRadians =
    (metrics.transmissionReflectionPhase * Math.PI) / 180;
  const vectorRadius = 39 * metrics.transmissionReflectionMagnitude;
  const vectorX = 62 + Math.cos(phaseRadians) * vectorRadius;
  const vectorY = 100 - Math.sin(phaseRadians) * vectorRadius;
  const isMatched = metrics.transmissionVswr <= 1.22;
  const reflectedAmplitude =
    11 * metrics.transmissionReflectionMagnitude;

  return (
    <g className="labScene labTransmissionScene">
      <text className="labSectionLabel" x={34} y={43}>
        50 Ω TRANSMISSION LINE REFLECTION MEASUREMENT
      </text>

      <g className="labTransmissionVna" transform="translate(18 62)">
        <rect
          className="labTransmissionVnaBody"
          filter={`url(#${ids.shadow})`}
          height={232}
          rx={10}
          style={{ fill: `url(#${ids.metal})` }}
          width={186}
        />
        <rect className="labTransmissionVnaBezel" height={218} rx={7} width={172} x={7} y={7} />
        <circle className="labInstrumentScrew" cx={12} cy={12} r={3} />
        <circle className="labInstrumentScrew" cx={174} cy={12} r={3} />
        <text className="labInstrumentBrand" x={15} y={24}>
          VECTOR NETWORK ANALYZER
        </text>
        <circle className="labInstrumentLedHalo" cx={168} cy={19} r={9} />
        <circle className="labInstrumentLed" cx={168} cy={19} r={5} />

        <rect
          className="labTransmissionVnaScreen"
          height={126}
          rx={5}
          style={{ fill: `url(#${ids.scope})` }}
          width={158}
          x={14}
          y={36}
        />
        <circle className="labTransmissionPolarGrid" cx={62} cy={100} r={43} />
        <circle className="labTransmissionPolarGrid inner" cx={62} cy={100} r={22} />
        <path className="labTransmissionPolarAxis" d="M19 100 H105 M62 57 V143" />
        <circle className="labTransmissionPolarArc" cx={40.5} cy={100} r={21.5} />
        <circle className="labTransmissionPolarArc" cx={83.5} cy={100} r={21.5} />
        <path
          className="labTransmissionVector"
          d={`M62 100 L${vectorX.toFixed(2)} ${vectorY.toFixed(2)}`}
        />
        <circle
          className={`labTransmissionVectorDot ${isMatched ? 'matched' : ''}`}
          cx={vectorX}
          cy={vectorY}
          r={4}
        />
        <line className="labTransmissionScreenDivider" x1={111} x2={111} y1={50} y2={148} />
        <text className="labTransmissionScreenLabel" x={118} y={62}>
          S11
        </text>
        <text className="labTransmissionScreenValue" x={118} y={78}>
          {metrics.transmissionReflectionMagnitude.toFixed(3)}
        </text>
        <text className="labTransmissionScreenLabel" x={118} y={96}>
          PHASE
        </text>
        <text className="labTransmissionScreenValue small" x={118} y={112}>
          {metrics.transmissionReflectionMagnitude < 0.001
            ? '—'
            : `${metrics.transmissionReflectionPhase.toFixed(0)}°`}
        </text>
        <text className="labTransmissionScreenLabel" x={118} y={130}>
          RL
        </text>
        <text className="labTransmissionScreenValue small" x={118} y={146}>
          {metrics.transmissionReturnLoss.toFixed(1)} dB
        </text>

        <circle className="labScopeKnob" cx={38} cy={190} r={14} />
        <line className="labInstrumentPointer" x1={38} x2={47} y1={190} y2={179} />
        <rect className="labAnalyzerSoftKey" x={67} y={178} width={24} height={9} rx={3} />
        <rect className="labAnalyzerSoftKey" x={96} y={178} width={24} height={9} rx={3} />
        <rect className="labAnalyzerSoftKey" x={125} y={178} width={24} height={9} rx={3} />
        <circle className="labTransmissionPortRing" cx={174} cy={205} r={13} />
        <circle className="labTransmissionPort" cx={174} cy={205} r={7} />
        <text className="labTransmissionPortLabel" x={151} y={226}>
          PORT 1
        </text>
      </g>

      <path className="labTransmissionLead" d="M192 267 C208 267 208 183 220 183" />

      <g className="labTransmissionCable">
        <rect
          className="labTransmissionJacket"
          filter={`url(#${ids.shadow})`}
          height={98}
          rx={14}
          width={304}
          x={214}
          y={134}
        />
        <rect className="labTransmissionShield" height={78} rx={10} width={286} x={223} y={144} />
        <rect className="labTransmissionDielectric" height={62} rx={7} width={270} x={231} y={152} />
        <line className="labTransmissionConductor" x1={221} x2={520} y1={183} y2={183} />
        <circle className="labTransmissionConnector" cx={217} cy={183} r={12} />
        <circle className="labTransmissionConnectorCore" cx={217} cy={183} r={5} />

        <text className="labTransmissionWaveLabel incident" x={238} y={164}>
          INCIDENT →
        </text>
        <path
          className="labTransmissionWave incident"
          d={makeScopeSinePath({
            amplitude: 10,
            centerY: 174,
            cycles: 3.2,
            width: 250,
            x: 244,
          })}
        />
        <text className="labTransmissionWaveLabel reflected" x={419} y={211}>
          ← REFLECTED
        </text>
        <path
          className="labTransmissionWave reflected"
          d={makeScopeSinePath({
            amplitude: reflectedAmplitude,
            centerY: 198,
            cycles: 3.2,
            phase: metrics.transmissionReflectionPhase,
            width: 250,
            x: 244,
          })}
        />

        <rect className="labTransmissionImpedanceTag" height={25} rx={4} width={82} x={228} y={112} />
        <text className="labTransmissionImpedanceText" x={269} y={129} textAnchor="middle">
          Z0 {values.transmissionCharacteristicImpedance} Ω
        </text>
        <rect className="labTransmissionLengthTag" height={25} rx={4} width={106} x={316} y={112} />
        <text className="labTransmissionImpedanceText" x={369} y={129} textAnchor="middle">
          LENGTH {values.transmissionElectricalLength}°
        </text>
      </g>

      <g className="labTransmissionLoad" transform="translate(516 127)">
        <rect
          className="labTransmissionLoadBody"
          filter={`url(#${ids.shadow})`}
          height={112}
          rx={9}
          width={98}
        />
        <rect className="labTransmissionLoadInset" height={98} rx={6} width={84} x={7} y={7} />
        <rect className="labTransmissionLoadConnector" height={34} rx={5} width={20} x={-10} y={39} />
        <line className="labTransmissionLoadFin" x1={24} x2={24} y1={26} y2={84} />
        <line className="labTransmissionLoadFin" x1={34} x2={34} y1={26} y2={84} />
        <line className="labTransmissionLoadFin" x1={44} x2={44} y1={26} y2={84} />
        <text className="labTransmissionLoadLabel" x={64} y={27} textAnchor="middle">
          RF LOAD
        </text>
        <text className="labTransmissionLoadValue" x={64} y={56} textAnchor="middle">
          {values.transmissionLoadImpedance} Ω
        </text>
        <text className="labTransmissionLoadMeta" x={64} y={76} textAnchor="middle">
          TERMINATION
        </text>
        <circle
          className={`labTransmissionMatchLed ${isMatched ? 'matched' : ''}`}
          cx={64}
          cy={94}
          r={5}
        />
      </g>

      <g className="labTransmissionMetricBand" transform="translate(214 252)">
        <rect
          className={`labMetricBand transmission ${isMatched ? 'matched' : 'mismatch'}`}
          height={76}
          rx={6}
          width={400}
        />
        <line x1={100} x2={100} y1={8} y2={68} />
        <line x1={200} x2={200} y1={8} y2={68} />
        <line x1={300} x2={300} y1={8} y2={68} />
        <text className="labTransmissionMetricLabel" x={12} y={22}>
          Γ
        </text>
        <text className="labTransmissionMetricValue" x={12} y={51}>
          {metrics.transmissionReflectionCoefficient.toFixed(3)}
        </text>
        <text className="labTransmissionMetricLabel" x={112} y={22}>
          VSWR
        </text>
        <text className="labTransmissionMetricValue" x={112} y={51}>
          {metrics.transmissionVswr.toFixed(2)}:1
        </text>
        <text className="labTransmissionMetricLabel" x={212} y={22}>
          RETURN LOSS
        </text>
        <text className="labTransmissionMetricValue" x={212} y={51}>
          {metrics.transmissionReturnLoss.toFixed(1)} dB
        </text>
        <text className="labTransmissionMetricLabel" x={312} y={22}>
          DELIVERED
        </text>
        <text className="labTransmissionMetricValue" x={312} y={51}>
          {metrics.transmissionDeliveredPower.toFixed(1)}%
        </text>
      </g>
    </g>
  );
}

function ThreePhaseLab({
  ids,
  metrics,
  values,
}: {
  ids: LabVisualIds;
  metrics: LabMetrics;
  values: LabSimulationValues;
}) {
  const powerFactorLabel =
    values.powerFactor >= 0.999
      ? 'unity'
      : `${values.powerFactor.toFixed(2)} lagging`;
  const phases = [
    { className: 'phaseA', label: 'A', y: 92 },
    { className: 'phaseB', label: 'B', y: 162 },
    { className: 'phaseC', label: 'C', y: 232 },
  ];

  return (
    <g className="labScene labThreePhaseScene">
      <text className="labSectionLabel" x={34} y={46}>
        BALANCED THREE-PHASE RMS MEASUREMENT
      </text>
      {phases.map((phase, index) => (
        <g key={phase.label}>
          <circle
            className={`labPhaseSource ${phase.className}`}
            cx={64}
            cy={phase.y}
            r={24}
            style={{ fill: `url(#${ids.source})` }}
          />
          <path
            className={`labPhaseWave ${phase.className}`}
            d={`M48 ${phase.y} C53 ${phase.y - 10} 58 ${phase.y - 10} 64 ${phase.y} S75 ${phase.y + 10} 80 ${phase.y}`}
          />
          <text className="labPhaseText" x={64} y={phase.y + 6} textAnchor="middle">
            {phase.label}
          </text>
          <path
            className={`labPhaseLine ${phase.className}`}
            d={`M88 ${phase.y} H${phase.label === 'B' ? 390 : 330}`}
          />
          <circle className="labCtSensorOuter" cx={180} cy={phase.y} r={16} />
          <circle className="labCtSensor" cx={180} cy={phase.y} r={10} />
          <path className="labCtLead" d={`M180 ${phase.y - 16} V${phase.y - 27} H194`} />
          <LabFlow
            className={phase.className}
            d={`M96 ${phase.y} H${phase.label === 'B' ? 380 : 322}`}
          />
          <text className="labTiny" x={180} y={phase.y - 20} textAnchor="middle">
            I{index + 1}
          </text>
        </g>
      ))}
      <path className="labDeltaLoad" d="M330 92 L390 162 L330 232 Z" />
      <path className="labDeltaLoadInner" d="M337 108 L378 162 L337 216 Z" />
      <circle className="labNode" cx={330} cy={92} r={5} />
      <circle className="labNode" cx={390} cy={162} r={5} />
      <circle className="labNode" cx={330} cy={232} r={5} />
      <text className="labValue" x={352} y={270} textAnchor="middle">
        balanced Δ load
      </text>
      <text className="labValue" x={112} y={286}>
        VLL = {values.lineVoltage} V
      </text>
      <text className="labValue" x={112} y={308}>
        IL = {values.lineCurrent} A
      </text>
      <text className="labValue" x={112} y={330}>
        pf = {powerFactorLabel}
      </text>

      <path className="labSenseLead" d="M193 92 C310 62 360 62 438 92" />
      <path className="labSenseLead" d="M193 162 C315 145 360 145 438 150" />
      <path className="labSenseLead" d="M193 232 C315 245 360 245 438 208" />
      <g transform="translate(438 66)">
        <rect
          className="labAnalyzerBody"
          filter={`url(#${ids.shadow})`}
          height={222}
          rx={10}
          style={{ fill: `url(#${ids.metal})` }}
          width={168}
        />
        <rect className="labAnalyzerBezel" x={7} y={7} width={154} height={208} rx={7} />
        <circle className="labInstrumentScrew" cx={12} cy={12} r={3} />
        <circle className="labInstrumentScrew" cx={156} cy={12} r={3} />
        <circle className="labInstrumentScrew" cx={12} cy={210} r={3} />
        <circle className="labInstrumentScrew" cx={156} cy={210} r={3} />
        <text className="labInstrumentBrand" x={14} y={24}>
          3φ POWER ANALYZER
        </text>
        <circle className="labInstrumentLedHalo" cx={148} cy={19} r={9} />
        <circle className="labInstrumentLed" cx={148} cy={19} r={5} />
        <rect
          className="labAnalyzerScreen"
          height={108}
          rx={5}
          style={{ fill: `url(#${ids.lcd})` }}
          width={142}
          x={13}
          y={38}
        />
        <path className="labAnalyzerGrid" d="M22 69 H146 M22 96 H146 M55 47 V137 M101 47 V137" />
        <path className="labAnalyzerWave phaseA" d="M24 121 C34 107 44 107 54 121 S74 135 84 121" />
        <path className="labAnalyzerWave phaseB" d="M54 121 C64 107 74 107 84 121 S104 135 114 121" />
        <path className="labAnalyzerWave phaseC" d="M84 121 C94 107 104 107 114 121 S134 135 144 121" />
        <rect className="labAnalyzerSweep" x={18} y={44} width={14} height={96} rx={7} />
        <text className="labInstrumentMode" x={22} y={58}>
          3V / 3I · RMS
        </text>
        <text className="labAnalyzerPrimary" x={146} y={91} textAnchor="end">
          {metrics.threePhasePower.toFixed(2)}
        </text>
        <text className="labInstrumentUnit" x={146} y={107} textAnchor="end">
          kW
        </text>
        <text className="labAnalyzerSecondary" x={22} y={132}>
          φ = {metrics.phaseAngle.toFixed(1)}°
        </text>
        <text className="labMetricLabel" x={16} y={170}>
          APPARENT
        </text>
        <text className="labAnalyzerMetric" x={152} y={170} textAnchor="end">
          {metrics.apparentPower.toFixed(2)} kVA
        </text>
        <text className="labMetricLabel" x={16} y={198}>
          REACTIVE
        </text>
        <text className="labAnalyzerMetric" x={152} y={198} textAnchor="end">
          {metrics.reactivePower.toFixed(2)} kVAr
        </text>
        <rect className="labAnalyzerSoftKey" x={16} y={205} width={24} height={9} rx={3} />
        <rect className="labAnalyzerSoftKey" x={45} y={205} width={24} height={9} rx={3} />
        <rect className="labAnalyzerSoftKey" x={74} y={205} width={24} height={9} rx={3} />
      </g>

      <g className="labPhasorGauge">
        <circle cx={354} cy={313} r={25} />
        <circle className="labPhasorHub" cx={354} cy={313} r={4} />
        <g className="labPhasorRotor">
          <line className="phaseA" x1={354} y1={313} x2={354} y2={293} />
          <line className="phaseB" x1={354} y1={313} x2={337} y2={323} />
          <line className="phaseC" x1={354} y1={313} x2={371} y2={323} />
        </g>
        <text className="labTiny" x={354} y={348} textAnchor="middle">
          LIVE PHASOR
        </text>
      </g>
    </g>
  );
}

export function LabSchematic({
  compact = false,
  lab,
  running = true,
  values,
}: LabSchematicProps) {
  const instanceId = useId().replace(/:/g, '');
  const safeValues = stabilizeLabValues(values);
  const metrics = stabilizeLabMetrics(calculateLabMetrics(safeValues));
  const visualPrefix = `lab-visual-${lab.id}-${instanceId}`;
  const ids: LabVisualIds = {
    axial: `${visualPrefix}-axial`,
    backdrop: `${visualPrefix}-backdrop`,
    ceramic: `${visualPrefix}-ceramic`,
    glow: `${visualPrefix}-glow`,
    grid: `${visualPrefix}-grid`,
    lcd: `${visualPrefix}-lcd`,
    metal: `${visualPrefix}-metal`,
    scope: `${visualPrefix}-scope`,
    shadow: `${visualPrefix}-shadow`,
    source: `${visualPrefix}-source`,
  };
  const activityLevel =
    lab.id === 'lab-ohms'
      ? Math.min(1, metrics.current / 3)
      : lab.id === 'lab-rc'
        ? Math.min(1, 480 / Math.max(80, metrics.rcTimeConstant))
        : lab.id === 'lab-resonance'
          ? Math.min(
              1,
              Math.max(
                0.18,
                metrics.resonanceCurrentRatio,
                metrics.resonanceQualityFactor / 30,
              ),
            )
        : lab.id === 'lab-filter'
          ? Math.min(1, Math.max(0.15, metrics.filterGain))
          : lab.id === 'lab-digital'
            ? Math.min(1, safeValues.digitalClockFrequency / 100)
            : lab.id === 'lab-opamp'
              ? Math.min(
                  1,
                  Math.max(
                    0.15,
                    Math.abs(metrics.opAmpOutput) / metrics.opAmpMaxSwing,
                  ),
                )
              : lab.id === 'lab-bjt'
                ? Math.min(
                    1,
                    Math.max(
                      0.12,
                      metrics.bjtCollectorCurrent /
                        Math.max(0.1, metrics.bjtLoadLineCurrent),
                    ),
                  )
              : lab.id === 'lab-adc'
                ? Math.min(
                    1,
                    Math.max(0.18, safeValues.adcSampleRate / 24),
                  )
              : lab.id === 'lab-transformer'
                ? Math.min(
                    1,
                    Math.max(
                      0.18,
                      Math.max(
                        metrics.transformerLoadPercent / 100,
                        metrics.transformerFluxDensity / 1.45,
                      ),
                    ),
                  )
              : lab.id === 'lab-mosfet'
                ? Math.min(1, Math.max(0.15, metrics.mosfetTotalLoss / 4))
                : lab.id === 'lab-pid'
                  ? Math.min(
                      1,
                      Math.max(0.2, metrics.pidNaturalFrequency / 4),
                    )
                : lab.id === 'lab-transmission'
                  ? Math.min(
                      1,
                      Math.max(0.18, metrics.transmissionReflectionMagnitude),
                    )
                  : Math.min(1, safeValues.lineCurrent / 40);
  const flowDuration = 2.15 - activityLevel * 1.15;
  const visualStyle = {
    '--lab-energy': activityLevel.toFixed(3),
    '--lab-flow-duration': `${flowDuration.toFixed(2)}s`,
  } as CSSProperties;
  const schematic =
    lab.id === 'lab-ohms' ? (
      <OhmsLab ids={ids} metrics={metrics} values={safeValues} />
    ) : lab.id === 'lab-rc' ? (
      <RcLab ids={ids} metrics={metrics} values={safeValues} />
    ) : lab.id === 'lab-resonance' ? (
      <ResonanceLab ids={ids} metrics={metrics} values={safeValues} />
    ) : lab.id === 'lab-filter' ? (
      <LowPassFilterLab ids={ids} metrics={metrics} values={safeValues} />
    ) : lab.id === 'lab-digital' ? (
      <DigitalTimingLab ids={ids} metrics={metrics} values={safeValues} />
    ) : lab.id === 'lab-opamp' ? (
      <OpAmpSignalLab ids={ids} metrics={metrics} values={safeValues} />
    ) : lab.id === 'lab-bjt' ? (
      <BjtBiasLab ids={ids} metrics={metrics} values={safeValues} />
    ) : lab.id === 'lab-adc' ? (
      <AdcSamplingLab ids={ids} metrics={metrics} values={safeValues} />
    ) : lab.id === 'lab-transformer' ? (
      <TransformerLab ids={ids} metrics={metrics} values={safeValues} />
    ) : lab.id === 'lab-mosfet' ? (
      <MosfetSwitchingLab ids={ids} metrics={metrics} values={safeValues} />
    ) : lab.id === 'lab-pid' ? (
      <PidServoLab ids={ids} metrics={metrics} values={safeValues} />
    ) : lab.id === 'lab-transmission' ? (
      <TransmissionLineLab ids={ids} metrics={metrics} values={safeValues} />
    ) : (
      <ThreePhaseLab ids={ids} metrics={metrics} values={safeValues} />
    );

  return (
    <div
      className={`labSchematic ${running ? 'running' : 'paused'} ${
        compact ? 'compact' : ''
      }`}
      data-lab={lab.id}
      style={visualStyle}
    >
      <svg
        aria-label={`${lab.title} live engineering schematic`}
        className="labSchematicSvg"
        role="img"
        viewBox="0 0 640 360"
      >
        <title>{`${lab.title} live engineering schematic`}</title>
        <desc>{lab.assumptions}</desc>
        <defs>
          <linearGradient id={ids.backdrop} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fafdff" />
            <stop offset="0.58" stopColor="#f3f9fc" />
            <stop offset="1" stopColor="#e9f3f8" />
          </linearGradient>
          <linearGradient id={ids.metal} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#eef4f6" />
            <stop offset="0.38" stopColor="#d9e4e8" />
            <stop offset="0.74" stopColor="#b9cbd2" />
            <stop offset="1" stopColor="#91a9b3" />
          </linearGradient>
          <linearGradient id={ids.lcd} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#dbe9c6" />
            <stop offset="0.5" stopColor="#c1d8ae" />
            <stop offset="1" stopColor="#a9c296" />
          </linearGradient>
          <linearGradient id={ids.scope} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#123d3f" />
            <stop offset="0.48" stopColor="#082f35" />
            <stop offset="1" stopColor="#031e25" />
          </linearGradient>
          <linearGradient id={ids.ceramic} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.46" stopColor="#e8ecea" />
            <stop offset="1" stopColor="#bbc6c6" />
          </linearGradient>
          <linearGradient id={ids.axial} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#e9c58f" />
            <stop offset="0.48" stopColor="#c99555" />
            <stop offset="1" stopColor="#8a5c30" />
          </linearGradient>
          <linearGradient id={ids.source} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#f2f6f7" />
            <stop offset="0.5" stopColor="#cad9df" />
            <stop offset="1" stopColor="#8ea5af" />
          </linearGradient>
          <filter id={ids.shadow} height="150%" width="150%" x="-25%" y="-25%">
            <feDropShadow
              dx="0"
              dy="3"
              floodColor="#0a2938"
              floodOpacity="0.24"
              stdDeviation="2.2"
            />
          </filter>
          <filter id={ids.glow} height="180%" width="180%" x="-40%" y="-40%">
            <feGaussianBlur result="blur" stdDeviation="3.5" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id={ids.grid} width="24" height="24" patternUnits="userSpaceOnUse">
            <path className="labGridLine" d="M24 0 H0 V24" />
          </pattern>
        </defs>
        <rect
          className="labBackdrop"
          height="360"
          rx="6"
          style={{ fill: `url(#${ids.backdrop})` }}
          width="640"
        />
        <rect
          className="labGridPattern"
          width="640"
          height="360"
          rx="6"
          fill={`url(#${ids.grid})`}
        />
        <path className="labBenchEdge" d="M0 346 H640" />
        {schematic}
        {!compact && (
          <g className="labRunState" transform="translate(527 18)">
            <circle cx="7" cy="7" r="5" />
            <text x="19" y="11">
              {running ? 'LIVE' : 'PAUSED'}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export function LabVisualStage({
  baseline = false,
  lab,
  values,
}: LabVisualStageProps) {
  const [mode, setMode] = useState<'live' | 'reference'>('live');
  const [running, setRunning] = useState(true);
  const { expanded, toggleExpanded } = useVisualInspector(lab.id);
  const safeValues = stabilizeLabValues(values);
  const metrics = stabilizeLabMetrics(calculateLabMetrics(safeValues));
  const output =
    lab.id === 'lab-ohms'
      ? `${metrics.current.toFixed(2)} A`
      : lab.id === 'lab-rc'
        ? `${metrics.rcTimeConstant.toFixed(0)} ms`
        : lab.id === 'lab-resonance'
          ? `${metrics.resonanceFrequency.toFixed(0)} Hz f₀`
        : lab.id === 'lab-filter'
          ? `${metrics.filterOutput.toFixed(2)} V RMS`
          : lab.id === 'lab-digital'
            ? `${metrics.digitalTimingMargin.toFixed(1)} ns`
            : lab.id === 'lab-opamp'
              ? `${Math.abs(metrics.opAmpOutput).toFixed(2)} Vpk`
              : lab.id === 'lab-bjt'
                ? `${metrics.bjtCollectorCurrent.toFixed(2)} mA IC`
              : lab.id === 'lab-adc'
                ? `${metrics.adcDisplayedFrequency.toFixed(2)} kHz displayed`
              : lab.id === 'lab-transformer'
                ? `${metrics.transformerSecondaryVoltage.toFixed(1)} V RMS`
              : lab.id === 'lab-mosfet'
                ? `${metrics.mosfetTotalLoss.toFixed(2)} W loss`
                : lab.id === 'lab-pid'
                  ? `${metrics.pidSettlingTime.toFixed(2)} s settle`
                  : lab.id === 'lab-transmission'
                    ? `${metrics.transmissionVswr.toFixed(2)}:1 VSWR`
                    : `${metrics.threePhasePower.toFixed(2)} kW`;

  return (
    <section
      aria-label={
        expanded
          ? `${lab.title} expanded live instrument visual`
          : 'Interactive lab visual'
      }
      aria-modal={expanded ? true : undefined}
      className={`questionVisualStage labVisualStage ${
        expanded ? 'visualStageExpanded' : ''
      }`}
      role={expanded ? 'dialog' : undefined}
    >
      <header className="visualStageHeader">
        <div>
          <span>
            {baseline ? 'Baseline wiring reference' : 'Live instrument view'}
          </span>
          <strong>{lab.visualLabel}</strong>
        </div>

        <div className="visualStageActions">
          <div className="visualModeSwitch" aria-label="Lab visual mode">
            <button
              className={mode === 'live' ? 'active' : ''}
              onClick={() => setMode('live')}
              type="button"
            >
              <Activity size={14} />
              {baseline ? 'Baseline' : 'Live'}
            </button>
            <button
              className={mode === 'reference' ? 'active' : ''}
              onClick={() => setMode('reference')}
              type="button"
            >
              <ImageIcon size={14} />
              Reference
            </button>
          </div>

          <button
            aria-label={
              baseline
                ? 'Baseline animation locked'
                : running
                  ? 'Pause lab animation'
                  : 'Play lab animation'
            }
            aria-pressed={baseline ? false : running}
            className={`visualPowerButton ${
              !baseline && running ? 'active' : ''
            }`}
            disabled={mode === 'reference' || baseline}
            onClick={() => setRunning((isRunning) => !isRunning)}
            title={
              baseline
                ? 'Baseline animation is paused'
                : running
                  ? 'Pause lab animation'
                  : 'Play lab animation'
            }
            type="button"
          >
            {running ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            aria-expanded={expanded}
            aria-label={
              expanded ? 'Close expanded lab visual' : 'Expand lab visual'
            }
            className={`visualInspectButton ${expanded ? 'active' : ''}`}
            onClick={toggleExpanded}
            title={expanded ? 'Close expanded visual' : 'Inspect visual'}
            type="button"
          >
            {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </header>

      <div className="visualInspectViewport">
        {mode === 'live' ? (
          <div className="labVisualCanvas">
            <LabSchematic
              lab={lab}
              running={baseline ? false : running}
              values={safeValues}
            />
            <div
              className={`visualMeterReadout ${
                !baseline && running ? 'running' : 'paused'
              }`}
              aria-live="polite"
            >
              <span>
                <i aria-hidden="true" />
                {baseline ? 'Nominal output' : lab.metric}
              </span>
              <strong>{output}</strong>
            </div>
          </div>
        ) : (
          <div className="verifiedDiagramView labReferenceView">
            <img
              src={resolvePublicAssetPath(lab.diagram)}
              alt={`${lab.title} engineering reference diagram`}
            />
            <span>
              <CheckCircle2 size={14} />
              Verified engineering diagram
            </span>
          </div>
        )}
      </div>

      <footer className="visualFormulaBar">
        <span>
          <Activity size={14} />
          Governing relation
        </span>
        <strong>{lab.formula}</strong>
      </footer>
    </section>
  );
}
