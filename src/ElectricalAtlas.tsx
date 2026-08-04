import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Atom,
  Binary,
  BookOpenCheck,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  CircuitBoard,
  Cpu,
  Gamepad2,
  Gauge,
  Lightbulb,
  Map,
  Minus,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Route,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Waves,
  XCircle,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  atlasDomains,
  atlasLearningPaths,
  electricalConcepts,
  engineeringGames,
  getElectricalConcept,
  getEngineeringGame,
} from './electricalAtlasData';
import type {
  AtlasDiagramKind,
  AtlasDomainId,
  ElectricalConcept,
  EngineeringGame,
} from './electricalAtlasData';
import './ElectricalAtlas.css';

type AtlasView = 'concept' | 'game' | 'overview';

type ElectricalAtlasProps = {
  activeId: string | null;
  onBack: () => void;
  onOpenConcept: (conceptId: string) => void;
  onOpenGame: (gameId: string) => void;
  onOpenLab: (labId: string) => void;
  view: AtlasView;
};

type AtlasBestScores = Record<string, number>;
type AtlasProgress = {
  bookmarkedIds: string[];
  completedIds: string[];
  recentIds: string[];
};

const ATLAS_SCORE_KEY = 'zyloxp-atlas-scores-v1';
const ATLAS_PROGRESS_KEY = 'zyloxp-atlas-progress-v1';
const EMPTY_ATLAS_PROGRESS: AtlasProgress = {
  bookmarkedIds: [],
  completedIds: [],
  recentIds: [],
};
const ATLAS_LAB_LINKS: Record<string, { id: string; label: string }> = {
  'adc-dac': { id: 'lab-adc', label: 'ADC Sampling Bench' },
  'digital-timing': { id: 'lab-digital', label: 'Digital Timing Bench' },
  'diodes-transistors': {
    id: 'lab-bjt',
    label: 'BJT Bias and Curve Tracer',
  },
  'electric-magnetic-fields': {
    id: 'lab-transformer',
    label: 'Transformer and Magnetic Core Bench',
  },
  'feedback-stability': { id: 'lab-pid', label: 'PID Servo Bench' },
  'filters-bode': { id: 'lab-filter', label: 'Low-Pass Filter Bench' },
  'laplace-transients': { id: 'lab-rc', label: 'RC Timing Lab' },
  instrumentation: { id: 'lab-adc', label: 'ADC Sampling Bench' },
  'mosfet-switching': { id: 'lab-mosfet', label: 'MOSFET Switching Bench' },
  'ohm-kirchhoff': { id: 'lab-ohms', label: "Ohm's Law Bench" },
  'op-amp-feedback': { id: 'lab-opamp', label: 'Op-Amp Signal Bench' },
  'pid-control': { id: 'lab-pid', label: 'PID Servo Bench' },
  'rlc-resonance': {
    id: 'lab-resonance',
    label: 'RLC Resonance and Network Analyzer',
  },
  'sampling-aliasing': { id: 'lab-adc', label: 'ADC Sampling Bench' },
  'three-phase-power': { id: 'lab-power', label: 'Three-Phase Power' },
  'transmission-lines': {
    id: 'lab-transmission',
    label: 'Transmission Line Bench',
  },
  'transformers-machines': {
    id: 'lab-transformer',
    label: 'Transformer and Magnetic Core Bench',
  },
  'uncertainty-calibration': {
    id: 'lab-adc',
    label: 'ADC Sampling Bench',
  },
};

const domainVisuals: Record<
  AtlasDomainId,
  { icon: LucideIcon; tone: string }
> = {
  analog: { icon: Activity, tone: 'coral' },
  circuits: { icon: CircuitBoard, tone: 'cyan' },
  controls: { icon: Target, tone: 'lime' },
  digital: { icon: Binary, tone: 'violet' },
  electromagnetics: { icon: Atom, tone: 'blue' },
  measurement: { icon: Gauge, tone: 'amber' },
  power: { icon: Zap, tone: 'yellow' },
  signals: { icon: Waves, tone: 'mint' },
};

function readBestScores(): AtlasBestScores {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const storedScores = JSON.parse(
      window.localStorage.getItem(ATLAS_SCORE_KEY) ?? '{}',
    ) as unknown;

    if (!storedScores || typeof storedScores !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(storedScores).flatMap(([gameId, score]) =>
        engineeringGames.some((game) => game.id === gameId) &&
        typeof score === 'number' &&
        Number.isFinite(score)
          ? [[gameId, Math.min(100, Math.max(0, Math.round(score)))]]
          : [],
      ),
    );
  } catch {
    return {};
  }
}

function normalizeConceptIds(value: unknown, limit = electricalConcepts.length) {
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (conceptId): conceptId is string =>
              typeof conceptId === 'string' &&
              electricalConcepts.some((concept) => concept.id === conceptId),
          ),
        ),
      ].slice(0, limit)
    : [];
}

function readAtlasProgress(): AtlasProgress {
  if (typeof window === 'undefined') {
    return EMPTY_ATLAS_PROGRESS;
  }

  try {
    const storedProgress = JSON.parse(
      window.localStorage.getItem(ATLAS_PROGRESS_KEY) ?? '{}',
    ) as Partial<AtlasProgress>;

    return {
      bookmarkedIds: normalizeConceptIds(storedProgress.bookmarkedIds),
      completedIds: normalizeConceptIds(storedProgress.completedIds),
      recentIds: normalizeConceptIds(storedProgress.recentIds, 6),
    };
  } catch {
    return EMPTY_ATLAS_PROGRESS;
  }
}

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: digits,
  }).format(value);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function calculatePidMetrics(
  proportional: number,
  integral: number,
  derivative: number,
  plantTimeConstant = 1.5,
) {
  const loopStrength = Math.max(0.15, proportional + integral * 0.8);
  const naturalFrequency =
    Math.sqrt(loopStrength / Math.max(0.35, plantTimeConstant)) * 1.25;
  const damping = clampNumber(
    (0.24 + derivative * 0.42 + proportional * 0.025) /
      (1 + integral * 0.16),
    0.08,
    1.35,
  );
  const stable = damping > 0.14 && loopStrength < 12;
  const overshoot =
    stable && damping < 1
      ? Math.exp(
          (-damping * Math.PI) / Math.sqrt(Math.max(0.001, 1 - damping ** 2)),
        ) * 100
      : stable
        ? 0
        : 100;
  const settlingTime = stable
    ? 4 / Math.max(0.08, damping * naturalFrequency)
    : 12;
  const steadyError =
    integral > 0.08
      ? 0.5 / (1 + integral * 5)
      : 100 / (1 + proportional * 1.8);

  return {
    damping,
    naturalFrequency,
    overshoot,
    settlingTime,
    stable,
    steadyError,
  };
}

function makeStepResponsePath({
  damping,
  naturalFrequency,
  samples = 100,
  width = 520,
  x = 55,
  y = 205,
}: {
  damping: number;
  naturalFrequency: number;
  samples?: number;
  width?: number;
  x?: number;
  y?: number;
}) {
  return Array.from({ length: samples + 1 }, (_, index) => {
    const progress = index / samples;
    const time = progress * 8;
    let response: number;

    if (damping < 1) {
      const dampedFrequency =
        naturalFrequency * Math.sqrt(Math.max(0.001, 1 - damping ** 2));
      response =
        1 -
        Math.exp(-damping * naturalFrequency * time) *
          (Math.cos(dampedFrequency * time) +
            (damping / Math.sqrt(Math.max(0.001, 1 - damping ** 2))) *
              Math.sin(dampedFrequency * time));
    } else {
      response = 1 - Math.exp(-naturalFrequency * time);
    }

    const pointX = x + progress * width;
    const pointY = y - clampNumber(response, -0.2, 1.55) * 120;
    return `${index === 0 ? 'M' : 'L'}${pointX.toFixed(2)} ${pointY.toFixed(2)}`;
  }).join(' ');
}

function calculateRelayTrip(
  faultCurrent: number,
  pickupCurrent: number,
  timeMultiplier: number,
) {
  const multiple = faultCurrent / Math.max(1, pickupCurrent);
  if (multiple <= 1) {
    return { multiple, tripTime: 99 };
  }
  return {
    multiple,
    tripTime:
      (timeMultiplier * 0.14) /
      Math.max(0.001, Math.pow(multiple, 0.02) - 1),
  };
}

function makeWavePath({
  amplitude,
  cycles,
  phase = 0,
  samples = 96,
  x = 20,
  y = 70,
  width = 520,
}: {
  amplitude: number;
  cycles: number;
  phase?: number;
  samples?: number;
  width?: number;
  x?: number;
  y?: number;
}) {
  return Array.from({ length: samples + 1 }, (_, index) => {
    const progress = index / samples;
    const pointX = x + progress * width;
    const pointY =
      y -
      Math.sin(progress * Math.PI * 2 * cycles + (phase * Math.PI) / 180) *
        amplitude;
    return `${index === 0 ? 'M' : 'L'}${pointX.toFixed(2)} ${pointY.toFixed(
      2,
    )}`;
  }).join(' ');
}

function makeRcChargePath({
  timeConstant,
  timeWindow,
  samples = 100,
  width = 620,
  x = 70,
  y = 230,
}: {
  timeConstant: number;
  timeWindow: number;
  samples?: number;
  width?: number;
  x?: number;
  y?: number;
}) {
  return Array.from({ length: samples + 1 }, (_, index) => {
    const progress = index / samples;
    const time = progress * timeWindow;
    const charge = 1 - Math.exp(-time / Math.max(1, timeConstant));
    const pointX = x + progress * width;
    const pointY = y - charge * 150;
    return `${index === 0 ? 'M' : 'L'}${pointX.toFixed(2)} ${pointY.toFixed(
      2,
    )}`;
  }).join(' ');
}

function RangeControl({
  label,
  max,
  min,
  onChange,
  showSteppers = false,
  step,
  value,
  valueLabel,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  showSteppers?: boolean;
  step: number;
  value: number;
  valueLabel: string;
}) {
  return (
    <label className="atlasRangeControl">
      <span>
        <strong>{label}</strong>
        <output>{valueLabel}</output>
      </span>
      <div className={`atlasRangeInput ${showSteppers ? 'withSteppers' : ''}`}>
        {showSteppers && (
          <button
            aria-label={`Decrease ${label}`}
            disabled={value <= min}
            onClick={() => onChange(clampNumber(value - step, min, max))}
            title={`Decrease ${label}`}
            type="button"
          >
            <Minus size={15} />
          </button>
        )}
        <input
          aria-label={label}
          max={max}
          min={min}
          onChange={(event) => onChange(Number(event.currentTarget.value))}
          step={step}
          type="range"
          value={value}
        />
        {showSteppers && (
          <button
            aria-label={`Increase ${label}`}
            disabled={value >= max}
            onClick={() => onChange(clampNumber(value + step, min, max))}
            title={`Increase ${label}`}
            type="button"
          >
            <Plus size={15} />
          </button>
        )}
      </div>
    </label>
  );
}

function Stage({
  children,
  eyebrow,
  readouts,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  readouts: Array<{ label: string; value: string }>;
  title: string;
}) {
  return (
    <section className="atlasStage">
      <header>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <span className="atlasLiveBadge">
          <span />
          Live model
        </span>
      </header>
      <div className="atlasStageCanvas">{children}</div>
      <div className="atlasReadoutStrip">
        {readouts.map((readout) => (
          <div key={readout.label}>
            <span>{readout.label}</span>
            <strong>{readout.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function NetworkExplorer() {
  const [sourceVoltage, setSourceVoltage] = useState(12);
  const [seriesResistance, setSeriesResistance] = useState(8);
  const [loadResistance, setLoadResistance] = useState(16);
  const current = sourceVoltage / (seriesResistance + loadResistance);
  const loadVoltage = current * loadResistance;
  const loadPower = current * current * loadResistance;

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Terminal network"
        readouts={[
          { label: 'Loop current', value: `${formatNumber(current)} A` },
          { label: 'Load voltage', value: `${formatNumber(loadVoltage)} V` },
          { label: 'Load power', value: `${formatNumber(loadPower)} W` },
        ]}
        title="Source and load behavior"
      >
        <svg aria-label="Interactive source and resistor network" viewBox="0 0 620 250">
          <defs>
            <filter id="atlas-shadow">
              <feDropShadow dx="0" dy="3" floodOpacity=".18" stdDeviation="3" />
            </filter>
          </defs>
          <path className="atlasWire" d="M100 55H245M365 55H520V195H100V55" />
          <rect className="atlasSource" filter="url(#atlas-shadow)" height="104" rx="8" width="70" x="65" y="74" />
          <path className="atlasSourceMark" d="M84 107h32M91 126h18" />
          <text className="atlasSvgLabel" x="75" y="96">DC</text>
          <text className="atlasSvgValue" x="77" y="157">{sourceVoltage} V</text>
          <rect className="atlasComponent" filter="url(#atlas-shadow)" height="52" rx="7" width="120" x="245" y="29" />
          <path className="atlasResistorBands" d="M268 32v46M286 32v46M323 32v46M342 32v46" />
          <text className="atlasSvgValue" textAnchor="middle" x="305" y="103">RS = {seriesResistance} Ω</text>
          <rect className="atlasLoad" filter="url(#atlas-shadow)" height="96" rx="8" width="92" x="474" y="92" />
          <path className="atlasLoadCoil" d="M492 118h18l8 10 10-20 10 20 8-10h4" />
          <text className="atlasSvgLabel" textAnchor="middle" x="520" y="148">LOAD</text>
          <text className="atlasSvgValue" textAnchor="middle" x="520" y="169">{loadResistance} Ω</text>
          <g className="atlasFlowDots">
            <circle cx="170" cy="55" r="6" />
            <circle cx="415" cy="55" r="6" />
            <circle cx="520" cy="213" r="6" />
            <circle cx="260" cy="195" r="6" />
          </g>
          <text className="atlasSvgAccent" x="390" y="38">I = {formatNumber(current)} A</text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Network controls">
        <p className="eyebrow">Change one variable</p>
        <h3>Network controls</h3>
        <RangeControl label="Source voltage" max={24} min={3} onChange={setSourceVoltage} step={1} value={sourceVoltage} valueLabel={`${sourceVoltage} V`} />
        <RangeControl label="Series resistance" max={30} min={1} onChange={setSeriesResistance} step={1} value={seriesResistance} valueLabel={`${seriesResistance} Ω`} />
        <RangeControl label="Load resistance" max={50} min={2} onChange={setLoadResistance} step={1} value={loadResistance} valueLabel={`${loadResistance} Ω`} />
        <p className="atlasControlNote">
          Raising the load resistance lowers current but moves more of the source
          voltage onto the load.
        </p>
      </aside>
    </div>
  );
}

function PhasorExplorer() {
  const [amplitude, setAmplitude] = useState(6);
  const [frequency, setFrequency] = useState(3);
  const [phase, setPhase] = useState(35);
  const angle = (phase * Math.PI) / 180;
  const vectorX = 475 + Math.cos(angle) * amplitude * 12;
  const vectorY = 105 - Math.sin(angle) * amplitude * 12;

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Time + vector view"
        readouts={[
          { label: 'Peak', value: `${amplitude} V` },
          { label: 'Frequency', value: `${frequency} kHz` },
          { label: 'Phase', value: `${phase}°` },
        ]}
        title="Synchronized waveform and phasor"
      >
        <svg aria-label="Interactive waveform and phasor diagram" viewBox="0 0 620 250">
          <path className="atlasGridLine" d="M30 65H360M30 115H360M30 165H360M85 30V200M195 30V200M305 30V200" />
          <path className="atlasAxis" d="M30 115H365M420 105H585M505 25V190" />
          <path className="atlasWavePath" d={makeWavePath({ amplitude: amplitude * 8, cycles: frequency / 2, phase, width: 320, x: 35, y: 115 })} />
          <circle className="atlasPhasorRing" cx="505" cy="105" r="78" />
          <path className="atlasPhasorVector" d={`M505 105L${vectorX} ${vectorY}`} />
          <circle className="atlasPhasorTip" cx={vectorX} cy={vectorY} r="7" />
          <text className="atlasSvgLabel" x="38" y="222">TIME DOMAIN</text>
          <text className="atlasSvgLabel" x="455" y="222">PHASOR</text>
          <text className="atlasSvgAccent" x="510" y="47">{phase}°</text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Waveform controls">
        <p className="eyebrow">Signal generator</p>
        <h3>Waveform controls</h3>
        <RangeControl label="Amplitude" max={10} min={1} onChange={setAmplitude} step={1} value={amplitude} valueLabel={`${amplitude} V`} />
        <RangeControl label="Frequency" max={8} min={1} onChange={setFrequency} step={1} value={frequency} valueLabel={`${frequency} kHz`} />
        <RangeControl label="Phase angle" max={180} min={-180} onChange={setPhase} step={5} value={phase} valueLabel={`${phase}°`} />
        <p className="atlasControlNote">
          Phase rotates the vector and shifts the waveform without changing its
          frequency.
        </p>
      </aside>
    </div>
  );
}

function ResonanceExplorer() {
  const [resistance, setResistance] = useState(12);
  const [inductance, setInductance] = useState(80);
  const [capacitance, setCapacitance] = useState(8);
  const resonance =
    1 /
    (2 *
      Math.PI *
      Math.sqrt((inductance / 1000) * (capacitance / 1_000_000)));
  const q = Math.sqrt((inductance / 1000) / (capacitance / 1_000_000)) / resistance;
  const responsePath = Array.from({ length: 90 }, (_, index) => {
    const ratio = 0.25 + (index / 89) * 2.2;
    const magnitude =
      1 / Math.sqrt(1 + q * q * (ratio - 1 / ratio) ** 2);
    const x = 48 + (index / 89) * 515;
    const y = 190 - magnitude * 135;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Frequency sweep"
        readouts={[
          { label: 'Resonance', value: `${formatNumber(resonance, 0)} Hz` },
          { label: 'Quality factor', value: formatNumber(q) },
          { label: 'Bandwidth', value: `${formatNumber(resonance / Math.max(q, 0.1), 0)} Hz` },
        ]}
        title="RLC response curve"
      >
        <svg aria-label="Interactive resonance response curve" viewBox="0 0 620 250">
          <path className="atlasGridLine" d="M48 55H565M48 100H565M48 145H565M48 190H565M150 35V195M255 35V195M360 35V195M465 35V195" />
          <path className="atlasAxis" d="M48 30V195H578" />
          <path className="atlasResponseArea" d={`${responsePath}L563 190H48Z`} />
          <path className="atlasResponsePath" d={responsePath} />
          <path className="atlasMarkerLine" d="M282 35V195" />
          <circle className="atlasPhasorTip" cx="282" cy="55" r="7" />
          <text className="atlasSvgAccent" textAnchor="middle" x="282" y="24">f₀ {formatNumber(resonance, 0)} Hz</text>
          <text className="atlasSvgLabel" x="500" y="220">FREQUENCY</text>
          <text className="atlasSvgLabel" transform="rotate(-90 18 120)" x="18" y="120">GAIN</text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="RLC controls">
        <p className="eyebrow">Component values</p>
        <h3>Tune the network</h3>
        <RangeControl label="Resistance" max={40} min={2} onChange={setResistance} step={1} value={resistance} valueLabel={`${resistance} Ω`} />
        <RangeControl label="Inductance" max={200} min={10} onChange={setInductance} step={5} value={inductance} valueLabel={`${inductance} mH`} />
        <RangeControl label="Capacitance" max={40} min={1} onChange={setCapacitance} step={1} value={capacitance} valueLabel={`${capacitance} µF`} />
        <p className="atlasControlNote">
          Lower resistance raises Q, sharpening the peak and extending ringing.
        </p>
      </aside>
    </div>
  );
}

function DiodeExplorer() {
  const [junctionVoltage, setJunctionVoltage] = useState(0.65);
  const [seriesResistance, setSeriesResistance] = useState(330);
  const diodeCurrent = Math.min(
    60,
    0.08 * Math.exp((junctionVoltage - 0.45) / 0.055),
  );
  const sourceVoltage = junctionVoltage + (diodeCurrent / 1000) * seriesResistance;
  const brightness = Math.min(1, diodeCurrent / 20);
  const curvePath = Array.from({ length: 80 }, (_, index) => {
    const voltage = (index / 79) * 0.9;
    const current = Math.min(60, 0.08 * Math.exp((voltage - 0.45) / 0.055));
    return `${index === 0 ? 'M' : 'L'}${55 + voltage * 430} ${
      195 - current * 2.35
    }`;
  }).join(' ');

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Nonlinear device"
        readouts={[
          { label: 'Diode current', value: `${formatNumber(diodeCurrent)} mA` },
          { label: 'Source needed', value: `${formatNumber(sourceVoltage)} V` },
          { label: 'Resistor drop', value: `${formatNumber(sourceVoltage - junctionVoltage)} V` },
        ]}
        title="Junction operating point"
      >
        <svg aria-label="Interactive diode current voltage curve" viewBox="0 0 620 250">
          <path className="atlasGridLine" d="M55 55H490M55 100H490M55 145H490M55 190H490M160 35V200M270 35V200M380 35V200" />
          <path className="atlasAxis" d="M55 25V198H510" />
          <path className="atlasDiodeCurve" d={curvePath} />
          <circle className="atlasPhasorTip" cx={55 + junctionVoltage * 430} cy={195 - diodeCurrent * 2.35} r="8" />
          <g className="atlasLed" style={{ opacity: 0.35 + brightness * 0.65 }}>
            <circle cx="555" cy="100" r="31" />
            <path d="M535 100h40M555 80v40" />
          </g>
          <text className="atlasSvgValue" textAnchor="middle" x="555" y="153">LED</text>
          <text className="atlasSvgLabel" x="438" y="220">VOLTAGE</text>
          <text className="atlasSvgLabel" transform="rotate(-90 20 120)" x="20" y="120">CURRENT</text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Diode controls">
        <p className="eyebrow">Bias point</p>
        <h3>Trace the junction</h3>
        <RangeControl label="Junction voltage" max={0.85} min={0.3} onChange={setJunctionVoltage} step={0.01} value={junctionVoltage} valueLabel={`${junctionVoltage.toFixed(2)} V`} />
        <RangeControl label="Series resistor" max={1000} min={100} onChange={setSeriesResistance} step={10} value={seriesResistance} valueLabel={`${seriesResistance} Ω`} />
        <p className="atlasControlNote">
          A small voltage change near conduction produces a large current
          change, so the series resistor is essential.
        </p>
      </aside>
    </div>
  );
}

function OpAmpExplorer() {
  const [inputVoltage, setInputVoltage] = useState(0.4);
  const [gain, setGain] = useState(6);
  const [rail, setRail] = useState(12);
  const idealOutput = -inputVoltage * gain;
  const outputVoltage = Math.max(-rail + 0.6, Math.min(rail - 0.6, idealOutput));
  const saturated = Math.abs(idealOutput - outputVoltage) > 0.01;

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Closed-loop amplifier"
        readouts={[
          { label: 'Ideal output', value: `${formatNumber(idealOutput)} V` },
          { label: 'Actual output', value: `${formatNumber(outputVoltage)} V` },
          { label: 'State', value: saturated ? 'Saturated' : 'Linear' },
        ]}
        title="Inverting op-amp bench"
      >
        <svg aria-label="Interactive operational amplifier circuit" viewBox="0 0 620 250">
          <path className="atlasWire" d="M45 125H155M155 125H230M390 125H565M155 125V55H390V98" />
          <path className="atlasComponent" d="M245 55L245 195L390 125Z" />
          <text className="atlasSvgValue" x="267" y="112">−</text>
          <text className="atlasSvgValue" x="267" y="157">+</text>
          <text className="atlasSvgLabel" x="300" y="130">OP AMP</text>
          <rect className="atlasComponent" height="42" rx="6" width="75" x="155" y="104" />
          <text className="atlasSvgValue" textAnchor="middle" x="192" y="96">RIN</text>
          <rect className="atlasComponent" height="42" rx="6" width="92" x="250" y="34" />
          <text className="atlasSvgValue" textAnchor="middle" x="296" y="28">RF</text>
          <path className="atlasGround" d="M245 155V203M223 203H267M230 211H260M238 219H252" />
          <text className="atlasSvgAccent" x="45" y="108">VIN {formatNumber(inputVoltage)} V</text>
          <text className={saturated ? 'atlasSvgWarning' : 'atlasSvgAccent'} textAnchor="end" x="565" y="108">
            VOUT {formatNumber(outputVoltage)} V
          </text>
          <text className="atlasSvgLabel" x="420" y="155">GAIN = −{gain}</text>
          <path className={saturated ? 'atlasWarningLine' : 'atlasSignalLine'} d={`M405 190H${405 + ((outputVoltage + rail) / (rail * 2)) * 150}`} />
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Op amp controls">
        <p className="eyebrow">Amplifier settings</p>
        <h3>Test the feedback loop</h3>
        <RangeControl label="Input voltage" max={2} min={-2} onChange={setInputVoltage} step={0.1} value={inputVoltage} valueLabel={`${inputVoltage.toFixed(1)} V`} />
        <RangeControl label="Gain magnitude" max={12} min={1} onChange={setGain} step={1} value={gain} valueLabel={`−${gain} V/V`} />
        <RangeControl label="Supply rails" max={18} min={5} onChange={setRail} step={1} value={rail} valueLabel={`±${rail} V`} />
        <p className={`atlasControlNote ${saturated ? 'warning' : ''}`}>
          {saturated
            ? 'The requested output crosses the usable rail. Reduce input or gain.'
            : 'The amplifier is operating inside its linear output range.'}
        </p>
      </aside>
    </div>
  );
}

function FilterExplorer() {
  const [cutoff, setCutoff] = useState(1200);
  const [signalFrequency, setSignalFrequency] = useState(800);
  const gain = 1 / Math.sqrt(1 + (signalFrequency / cutoff) ** 2);
  const phase = -Math.atan(signalFrequency / cutoff) * (180 / Math.PI);
  const curvePath = Array.from({ length: 100 }, (_, index) => {
    const frequency = 20 * 10 ** ((index / 99) * 3);
    const magnitude = 1 / Math.sqrt(1 + (frequency / cutoff) ** 2);
    const db = 20 * Math.log10(magnitude);
    return `${index === 0 ? 'M' : 'L'}${50 + (index / 99) * 510} ${
      55 + Math.min(120, Math.abs(db) * 4)
    }`;
  }).join(' ');
  const markerX =
    50 + (Math.log10(signalFrequency / 20) / Math.log10(1000)) * 510;

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Frequency response"
        readouts={[
          { label: 'Gain', value: `${formatNumber(gain * 100, 0)}%` },
          { label: 'Attenuation', value: `${formatNumber(20 * Math.log10(gain))} dB` },
          { label: 'Phase', value: `${formatNumber(phase, 0)}°` },
        ]}
        title="Low-pass Bode response"
      >
        <svg aria-label="Interactive low pass filter Bode plot" viewBox="0 0 620 250">
          <path className="atlasGridLine" d="M50 55H560M50 95H560M50 135H560M50 175H560M155 35V190M260 35V190M365 35V190M470 35V190" />
          <path className="atlasAxis" d="M50 30V190H570" />
          <path className="atlasResponsePath" d={curvePath} />
          <path className="atlasMarkerLine" d={`M${markerX} 35V190`} />
          <circle className="atlasPhasorTip" cx={markerX} cy={55 + Math.abs(20 * Math.log10(gain)) * 4} r="7" />
          <text className="atlasSvgAccent" x={Math.min(510, markerX + 10)} y="30">{signalFrequency} Hz</text>
          <text className="atlasSvgLabel" x="470" y="218">LOG FREQUENCY</text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Filter controls">
        <p className="eyebrow">Pole response</p>
        <h3>Move frequency through cutoff</h3>
        <RangeControl label="Cutoff frequency" max={5000} min={100} onChange={setCutoff} step={100} value={cutoff} valueLabel={`${cutoff} Hz`} />
        <RangeControl label="Signal frequency" max={20000} min={20} onChange={setSignalFrequency} step={20} value={signalFrequency} valueLabel={`${signalFrequency} Hz`} />
        <p className="atlasControlNote">
          At cutoff, a first-order low-pass is about −3 dB and −45°.
        </p>
      </aside>
    </div>
  );
}

function DigitalTimingExplorer() {
  const [frequency, setFrequency] = useState(4);
  const [delay, setDelay] = useState(12);
  const periodNs = 1000 / frequency;
  const margin = Math.max(0, periodNs / 2 - delay);
  const shift = Math.min(115, (delay / (periodNs / 2)) * 90);
  const squarePath = (offset: number) =>
    `M35 ${75 + offset}H105V${35 + offset}H175V${75 + offset}H245V${
      35 + offset
    }H315V${75 + offset}H385V${35 + offset}H455V${75 + offset}H555`;

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Synchronous timing"
        readouts={[
          { label: 'Clock period', value: `${formatNumber(periodNs, 0)} ns` },
          { label: 'Logic delay', value: `${delay} ns` },
          { label: 'Half-cycle margin', value: `${formatNumber(margin, 0)} ns` },
        ]}
        title="Input and delayed output"
      >
        <svg aria-label="Interactive digital timing diagram" viewBox="0 0 620 250">
          <path className="atlasGridLine" d="M35 45H570M35 115H570M35 185H570M105 25V205M175 25V205M245 25V205M315 25V205M385 25V205M455 25V205M525 25V205" />
          <path className="atlasDigitalInput" d={squarePath(0)} />
          <path className="atlasDigitalOutput" transform={`translate(${shift} 80)`} d={squarePath(0)} />
          <text className="atlasSvgLabel" x="35" y="25">INPUT</text>
          <text className="atlasSvgLabel" x="35" y="105">OUTPUT</text>
          <path className="atlasDelayArrow" d={`M105 220H${105 + shift}`} />
          <text className="atlasSvgAccent" x={110 + shift / 2} y="240">{delay} ns</text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Digital timing controls">
        <p className="eyebrow">Timing budget</p>
        <h3>Race the clock</h3>
        <RangeControl label="Clock frequency" max={10} min={1} onChange={setFrequency} step={1} value={frequency} valueLabel={`${frequency} MHz`} />
        <RangeControl label="Propagation delay" max={120} min={2} onChange={setDelay} step={2} value={delay} valueLabel={`${delay} ns`} />
        <p className={`atlasControlNote ${margin < periodNs * 0.1 ? 'warning' : ''}`}>
          {margin < periodNs * 0.1
            ? 'Timing margin is nearly gone. The next register may capture unstable data.'
            : 'The delayed output settles before the next active half-cycle.'}
        </p>
      </aside>
    </div>
  );
}

function SamplingExplorer() {
  const [signalFrequency, setSignalFrequency] = useState(7);
  const [sampleRate, setSampleRate] = useState(20);
  const ratio = sampleRate / signalFrequency;
  const aliasFrequency =
    Math.abs(signalFrequency - Math.round(signalFrequency / sampleRate) * sampleRate);
  const sampleCount = Math.max(3, Math.round(sampleRate * 1.8));
  const samples = Array.from({ length: sampleCount }, (_, index) => {
    const progress = index / (sampleCount - 1);
    return {
      x: 35 + progress * 520,
      y: 115 - Math.sin(progress * Math.PI * 2 * signalFrequency * 0.34) * 65,
    };
  });

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Discrete-time capture"
        readouts={[
          { label: 'Samples / cycle', value: formatNumber(ratio) },
          { label: 'Nyquist status', value: ratio >= 2 ? 'Pass' : 'Aliased' },
          { label: 'Observed alias', value: `${formatNumber(aliasFrequency)} kHz` },
        ]}
        title="Analog waveform and sample points"
      >
        <svg aria-label="Interactive sampling and aliasing diagram" viewBox="0 0 620 250">
          <path className="atlasGridLine" d="M35 50H555M35 115H555M35 180H555M135 30V200M235 30V200M335 30V200M435 30V200M535 30V200" />
          <path className="atlasWaveReference" d={makeWavePath({ amplitude: 65, cycles: signalFrequency * 0.34, width: 520, x: 35, y: 115 })} />
          {samples.map((sample, index) => (
            <g key={`${sample.x}-${index}`}>
              <path className="atlasSampleStem" d={`M${sample.x} 190V${sample.y}`} />
              <circle className="atlasSampleDot" cx={sample.x} cy={sample.y} r="5" />
            </g>
          ))}
          <text className={ratio >= 2 ? 'atlasSvgAccent' : 'atlasSvgWarning'} x="35" y="225">
            {ratio >= 2 ? 'RECONSTRUCTION POSSIBLE' : 'ALIASING ACTIVE'}
          </text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Sampling controls">
        <p className="eyebrow">Sampling clock</p>
        <h3>Protect the waveform</h3>
        <RangeControl label="Signal frequency" max={20} min={1} onChange={setSignalFrequency} step={1} value={signalFrequency} valueLabel={`${signalFrequency} kHz`} />
        <RangeControl label="Sample rate" max={60} min={2} onChange={setSampleRate} step={1} value={sampleRate} valueLabel={`${sampleRate} kS/s`} />
        <p className={`atlasControlNote ${ratio < 2 ? 'warning' : ''}`}>
          {ratio < 2
            ? 'The samples can describe a false lower-frequency waveform.'
            : 'The rate clears Nyquist; real hardware still needs anti-alias margin.'}
        </p>
      </aside>
    </div>
  );
}

function ThreePhaseExplorer() {
  const [lineVoltage, setLineVoltage] = useState(400);
  const [lineCurrent, setLineCurrent] = useState(24);
  const [powerFactor, setPowerFactor] = useState(0.86);
  const realPower =
    (Math.sqrt(3) * lineVoltage * lineCurrent * powerFactor) / 1000;
  const apparentPower = (Math.sqrt(3) * lineVoltage * lineCurrent) / 1000;
  const reactivePower = Math.sqrt(
    Math.max(0, apparentPower ** 2 - realPower ** 2),
  );

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Balanced system"
        readouts={[
          { label: 'Real power', value: `${formatNumber(realPower)} kW` },
          { label: 'Apparent power', value: `${formatNumber(apparentPower)} kVA` },
          { label: 'Reactive power', value: `${formatNumber(reactivePower)} kvar` },
        ]}
        title="Three-phase phasors and power"
      >
        <svg aria-label="Interactive three phase power diagram" viewBox="0 0 620 250">
          <path className="atlasAxis" d="M145 125H345M245 25V225" />
          <circle className="atlasPhasorRing" cx="245" cy="125" r="92" />
          {[0, 120, 240].map((angle, index) => {
            const radians = (angle * Math.PI) / 180;
            const endX = 245 + Math.cos(radians) * 90;
            const endY = 125 - Math.sin(radians) * 90;
            return (
              <g className={`atlasPhase phase${index + 1}`} key={angle}>
                <path d={`M245 125L${endX} ${endY}`} />
                <circle cx={endX} cy={endY} r="7" />
                <text x={endX + (index === 0 ? 12 : -18)} y={endY - 10}>
                  {String.fromCharCode(65 + index)}
                </text>
              </g>
            );
          })}
          <g className="atlasPowerMeter">
            <rect height="142" rx="10" width="190" x="395" y="54" />
            <text className="atlasSvgLabel" x="418" y="86">POWER ANALYZER</text>
            <text className="atlasMeterValue" x="418" y="132">{formatNumber(realPower)} kW</text>
            <text className="atlasSvgValue" x="418" y="161">PF {powerFactor.toFixed(2)}</text>
            <circle cx="555" cy="79" r="8" />
          </g>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Three phase controls">
        <p className="eyebrow">Load conditions</p>
        <h3>Balance the feeder</h3>
        <RangeControl label="Line voltage" max={480} min={208} onChange={setLineVoltage} step={8} value={lineVoltage} valueLabel={`${lineVoltage} V`} />
        <RangeControl label="Line current" max={60} min={5} onChange={setLineCurrent} step={1} value={lineCurrent} valueLabel={`${lineCurrent} A`} />
        <RangeControl label="Power factor" max={1} min={0.5} onChange={setPowerFactor} step={0.01} value={powerFactor} valueLabel={powerFactor.toFixed(2)} />
        <p className="atlasControlNote">
          Raising power factor delivers more real power for the same conductor
          current.
        </p>
      </aside>
    </div>
  );
}

function TransformerExplorer() {
  const [primaryVoltage, setPrimaryVoltage] = useState(240);
  const [ratio, setRatio] = useState(0.5);
  const [load, setLoad] = useState(24);
  const secondaryVoltage = primaryVoltage * ratio;
  const secondaryCurrent = secondaryVoltage / load;
  const reflectedLoad = load / ratio ** 2;

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Magnetic coupling"
        readouts={[
          { label: 'Secondary voltage', value: `${formatNumber(secondaryVoltage)} V` },
          { label: 'Secondary current', value: `${formatNumber(secondaryCurrent)} A` },
          { label: 'Reflected load', value: `${formatNumber(reflectedLoad)} Ω` },
        ]}
        title="Ideal transformer and load"
      >
        <svg aria-label="Interactive transformer diagram" viewBox="0 0 620 250">
          <path className="atlasWire" d="M40 75H140M40 175H140M410 75H565V175H410" />
          <path className="atlasCoil primary" d="M140 55q30 20 0 40q30 20 0 40q30 20 0 40q30 20 0 40" />
          <path className="atlasCore" d="M260 45V205M282 45V205" />
          <path className="atlasCoil secondary" d="M410 55q-30 20 0 40q-30 20 0 40q-30 20 0 40q-30 20 0 40" />
          <rect className="atlasLoad" height="82" rx="8" width="82" x="500" y="84" />
          <text className="atlasSvgLabel" textAnchor="middle" x="541" y="116">LOAD</text>
          <text className="atlasSvgValue" textAnchor="middle" x="541" y="143">{load} Ω</text>
          <text className="atlasSvgAccent" x="40" y="58">{primaryVoltage} V</text>
          <text className="atlasSvgAccent" x="430" y="58">{formatNumber(secondaryVoltage)} V</text>
          <text className="atlasSvgValue" textAnchor="middle" x="275" y="232">NS/NP = {ratio.toFixed(2)}</text>
          <path className="atlasFluxArrow" d="M220 35H330" />
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Transformer controls">
        <p className="eyebrow">Turns and load</p>
        <h3>Transform the source</h3>
        <RangeControl label="Primary voltage" max={480} min={120} onChange={setPrimaryVoltage} step={10} value={primaryVoltage} valueLabel={`${primaryVoltage} V`} />
        <RangeControl label="Turns ratio" max={2} min={0.2} onChange={setRatio} step={0.05} value={ratio} valueLabel={ratio.toFixed(2)} />
        <RangeControl label="Secondary load" max={100} min={5} onChange={setLoad} step={1} value={load} valueLabel={`${load} Ω`} />
        <p className="atlasControlNote">
          Stepping voltage down steps ideal current capability up and reflects a
          larger load to the primary.
        </p>
      </aside>
    </div>
  );
}

function BuckExplorer() {
  const [inputVoltage, setInputVoltage] = useState(24);
  const [duty, setDuty] = useState(50);
  const [load, setLoad] = useState(6);
  const outputVoltage = inputVoltage * (duty / 100);
  const outputCurrent = outputVoltage / load;
  const outputPower = outputVoltage * outputCurrent;
  const ripple = Math.max(0.02, (inputVoltage - outputVoltage) * (duty / 100) * 0.035);

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="PWM energy transfer"
        readouts={[
          { label: 'Output voltage', value: `${formatNumber(outputVoltage)} V` },
          { label: 'Load current', value: `${formatNumber(outputCurrent)} A` },
          { label: 'Ripple estimate', value: `${formatNumber(ripple)} A` },
        ]}
        title="Buck converter power stage"
      >
        <svg aria-label="Interactive buck converter diagram" viewBox="0 0 620 250">
          <path className="atlasWire" d="M55 70H160M215 70H305M395 70H545V185H55V70" />
          <rect className="atlasSwitch" height="54" rx="7" width="55" x="160" y="43" />
          <path className="atlasSwitchBlade" d="M172 81L203 58" />
          <text className="atlasSvgLabel" textAnchor="middle" x="188" y="122">PWM</text>
          <path className="atlasInductor" d="M305 70q15-32 30 0q15-32 30 0q15-32 30 0" />
          <path className="atlasCapacitor" d="M440 70V115M420 115H460M420 132H460M440 132V185" />
          <rect className="atlasLoad" height="75" rx="8" width="70" x="510" y="91" />
          <text className="atlasSvgValue" textAnchor="middle" x="545" y="135">{load} Ω</text>
          <path className="atlasDiodeSymbol" d="M255 70V125M238 125H272M242 145H268M255 145V185" />
          <text className="atlasSvgAccent" x="55" y="55">{inputVoltage} V</text>
          <text className="atlasSvgAccent" x="470" y="55">{formatNumber(outputVoltage)} V</text>
          <g className="atlasFlowDots">
            <circle cx="115" cy="70" r="6" />
            <circle cx="280" cy="70" r="6" />
            <circle cx="430" cy="70" r="6" />
          </g>
          <text className="atlasSvgValue" x="305" y="225">POUT {formatNumber(outputPower)} W</text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Buck converter controls">
        <p className="eyebrow">Converter settings</p>
        <h3>Move energy in packets</h3>
        <RangeControl label="Input voltage" max={48} min={5} onChange={setInputVoltage} step={1} value={inputVoltage} valueLabel={`${inputVoltage} V`} />
        <RangeControl label="Duty cycle" max={90} min={10} onChange={setDuty} step={1} value={duty} valueLabel={`${duty}%`} />
        <RangeControl label="Load resistance" max={20} min={1} onChange={setLoad} step={1} value={load} valueLabel={`${load} Ω`} />
        <p className="atlasControlNote">
          The ideal average output follows duty cycle; current ripple remains a
          separate design constraint.
        </p>
      </aside>
    </div>
  );
}

function FieldExplorer() {
  const [chargeA, setChargeA] = useState(3);
  const [chargeB, setChargeB] = useState(-2);
  const [distance, setDistance] = useState(0.35);
  const force =
    (8.988e9 * Math.abs(chargeA * 1e-6 * chargeB * 1e-6)) /
    distance ** 2;
  const attracts = chargeA * chargeB < 0;

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Electrostatic field"
        readouts={[
          { label: 'Force magnitude', value: `${formatNumber(force, 3)} N` },
          { label: 'Interaction', value: attracts ? 'Attraction' : 'Repulsion' },
          { label: 'Separation', value: `${distance.toFixed(2)} m` },
        ]}
        title="Two-charge force map"
      >
        <svg aria-label="Interactive electric field diagram" viewBox="0 0 620 250">
          <defs>
            <marker id="atlas-arrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
              <path d="M0 0L8 4L0 8Z" />
            </marker>
          </defs>
          {[-70, -40, 0, 40, 70].map((offset) => (
            <path
              className="atlasFieldLine"
              d={`M175 125Q310 ${125 + offset} 445 125`}
              key={offset}
              markerEnd="url(#atlas-arrow)"
            />
          ))}
          <circle className={chargeA >= 0 ? 'atlasCharge positive' : 'atlasCharge negative'} cx="155" cy="125" r="48" />
          <circle className={chargeB >= 0 ? 'atlasCharge positive' : 'atlasCharge negative'} cx="465" cy="125" r="48" />
          <text className="atlasChargeLabel" textAnchor="middle" x="155" y="134">{chargeA >= 0 ? '+' : '−'}{Math.abs(chargeA)} µC</text>
          <text className="atlasChargeLabel" textAnchor="middle" x="465" y="134">{chargeB >= 0 ? '+' : '−'}{Math.abs(chargeB)} µC</text>
          <path className={attracts ? 'atlasForceArrow attract' : 'atlasForceArrow repel'} d={attracts ? 'M210 205H410' : 'M410 205H210'} />
          <text className="atlasSvgAccent" textAnchor="middle" x="310" y="235">{formatNumber(force, 3)} N</text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Electric field controls">
        <p className="eyebrow">Charge geometry</p>
        <h3>Change force and direction</h3>
        <RangeControl label="Charge A" max={5} min={-5} onChange={setChargeA} step={1} value={chargeA} valueLabel={`${chargeA} µC`} />
        <RangeControl label="Charge B" max={5} min={-5} onChange={setChargeB} step={1} value={chargeB} valueLabel={`${chargeB} µC`} />
        <RangeControl label="Distance" max={1} min={0.1} onChange={setDistance} step={0.05} value={distance} valueLabel={`${distance.toFixed(2)} m`} />
        <p className="atlasControlNote">
          Force follows the charge product and inverse square of distance.
        </p>
      </aside>
    </div>
  );
}

function TransmissionExplorer() {
  const [characteristicImpedance, setCharacteristicImpedance] = useState(50);
  const [loadImpedance, setLoadImpedance] = useState(75);
  const [electricalLength, setElectricalLength] = useState(1.5);
  const reflection =
    (loadImpedance - characteristicImpedance) /
    (loadImpedance + characteristicImpedance);
  const vswr = (1 + Math.abs(reflection)) / Math.max(0.001, 1 - Math.abs(reflection));
  const standingPath = Array.from({ length: 100 }, (_, index) => {
    const progress = index / 99;
    const envelope =
      1 + reflection * Math.cos(progress * Math.PI * 2 * electricalLength);
    return `${index === 0 ? 'M' : 'L'}${45 + progress * 510} ${
      125 - envelope * 48 * Math.sin(progress * Math.PI * 4)
    }`;
  }).join(' ');

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Distributed interconnect"
        readouts={[
          { label: 'Reflection Γ', value: reflection.toFixed(3) },
          { label: 'VSWR', value: formatNumber(vswr) },
          { label: 'Match', value: Math.abs(reflection) < 0.05 ? 'Excellent' : Math.abs(reflection) < 0.25 ? 'Usable' : 'Poor' },
        ]}
        title="Forward and reflected wave"
      >
        <svg aria-label="Interactive transmission line standing wave" viewBox="0 0 620 250">
          <path className="atlasGridLine" d="M45 65H555M45 125H555M45 185H555M145 35V205M245 35V205M345 35V205M445 35V205M545 35V205" />
          <path className="atlasTransmissionRail" d="M45 70H555M45 180H555" />
          <path className="atlasStandingWave" d={standingPath} />
          <rect className="atlasLoad" height="85" rx="8" width="72" x="525" y="83" />
          <text className="atlasSvgLabel" textAnchor="middle" x="561" y="115">LOAD</text>
          <text className="atlasSvgValue" textAnchor="middle" x="561" y="143">{loadImpedance} Ω</text>
          <text className="atlasSvgAccent" x="45" y="28">Z₀ {characteristicImpedance} Ω</text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Transmission line controls">
        <p className="eyebrow">Line termination</p>
        <h3>Control the reflection</h3>
        <RangeControl label="Characteristic Z₀" max={100} min={25} onChange={setCharacteristicImpedance} step={5} value={characteristicImpedance} valueLabel={`${characteristicImpedance} Ω`} />
        <RangeControl label="Load impedance" max={150} min={10} onChange={setLoadImpedance} step={5} value={loadImpedance} valueLabel={`${loadImpedance} Ω`} />
        <RangeControl label="Electrical length" max={3} min={0.5} onChange={setElectricalLength} step={0.1} value={electricalLength} valueLabel={`${electricalLength.toFixed(1)} λ`} />
        <p className="atlasControlNote">
          Set load equal to Z₀ to collapse the standing wave and remove the
          reflection.
        </p>
      </aside>
    </div>
  );
}

function ControlExplorer() {
  const [damping, setDamping] = useState(0.45);
  const [naturalFrequency, setNaturalFrequency] = useState(2.2);
  const [gain, setGain] = useState(1);
  const responsePath = Array.from({ length: 120 }, (_, index) => {
    const t = (index / 119) * 6;
    let response: number;
    if (damping < 1) {
      const wd = naturalFrequency * Math.sqrt(1 - damping ** 2);
      response =
        gain *
        (1 -
          (Math.exp(-damping * naturalFrequency * t) /
            Math.sqrt(1 - damping ** 2)) *
            Math.sin(wd * t + Math.acos(damping)));
    } else {
      response = gain * (1 - Math.exp(-naturalFrequency * t / damping));
    }
    return `${index === 0 ? 'M' : 'L'}${45 + (index / 119) * 520} ${
      190 - Math.min(1.8, Math.max(-0.2, response)) * 95
    }`;
  }).join(' ');
  const overshoot =
    damping < 1
      ? Math.exp(
          (-damping * Math.PI) / Math.sqrt(Math.max(0.001, 1 - damping ** 2)),
        ) * 100
      : 0;
  const settling = 4 / Math.max(0.1, damping * naturalFrequency);

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Closed-loop dynamics"
        readouts={[
          { label: 'Overshoot', value: `${formatNumber(overshoot, 0)}%` },
          { label: 'Settling estimate', value: `${formatNumber(settling)} s` },
          { label: 'Final value', value: gain.toFixed(1) },
        ]}
        title="Second-order step response"
      >
        <svg aria-label="Interactive control system step response" viewBox="0 0 620 250">
          <path className="atlasGridLine" d="M45 55H565M45 95H565M45 135H565M45 175H565M145 35V200M245 35V200M345 35V200M445 35V200M545 35V200" />
          <path className="atlasAxis" d="M45 25V195H575" />
          <path className="atlasSetpoint" d={`M45 ${190 - gain * 95}H565`} />
          <path className="atlasControlResponse" d={responsePath} />
          <text className="atlasSvgAccent" x="470" y={180 - gain * 95}>SETPOINT</text>
          <text className="atlasSvgLabel" x="520" y="222">TIME</text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Control response controls">
        <p className="eyebrow">Loop dynamics</p>
        <h3>Shape the response</h3>
        <RangeControl label="Damping ratio ζ" max={1.2} min={0.1} onChange={setDamping} step={0.05} value={damping} valueLabel={damping.toFixed(2)} />
        <RangeControl label="Natural frequency" max={5} min={0.5} onChange={setNaturalFrequency} step={0.1} value={naturalFrequency} valueLabel={`${naturalFrequency.toFixed(1)} rad/s`} />
        <RangeControl label="Command level" max={1.4} min={0.5} onChange={setGain} step={0.1} value={gain} valueLabel={gain.toFixed(1)} />
        <p className="atlasControlNote">
          More damping suppresses overshoot but can slow the path to the final
          value.
        </p>
      </aside>
    </div>
  );
}

function GroundExplorer() {
  const [returnImpedance, setReturnImpedance] = useState(45);
  const [noiseCurrent, setNoiseCurrent] = useState(1.8);
  const [loopArea, setLoopArea] = useState(35);
  const sharedNoise = (returnImpedance / 1000) * noiseCurrent;
  const couplingIndex = sharedNoise * (loopArea / 10);

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Real return path"
        readouts={[
          { label: 'Shared noise', value: `${formatNumber(sharedNoise * 1000)} mV` },
          { label: 'Coupling index', value: formatNumber(couplingIndex * 100) },
          { label: 'Loop area', value: `${loopArea} cm²` },
        ]}
        title="Signal and power return currents"
      >
        <svg aria-label="Interactive grounding and return current diagram" viewBox="0 0 620 250">
          <rect className="atlasBoard" height="170" rx="12" width="540" x="40" y="38" />
          <rect className="atlasChipBlock" height="72" rx="8" width="105" x="85" y="75" />
          <rect className="atlasChipBlock noisy" height="72" rx="8" width="105" x="420" y="75" />
          <text className="atlasSvgLabel" textAnchor="middle" x="138" y="105">SENSOR</text>
          <text className="atlasSvgValue" textAnchor="middle" x="138" y="132">QUIET</text>
          <text className="atlasSvgLabel" textAnchor="middle" x="472" y="105">SWITCHER</text>
          <text className="atlasSvgValue" textAnchor="middle" x="472" y="132">NOISY</text>
          <path className="atlasQuietTrace" d="M190 98H335V165H85" />
          <path className="atlasNoisyTrace" d="M420 122H330V183H525" />
          <path className="atlasGroundPlane" d="M65 180H555" />
          <g className="atlasFlowDots">
            <circle cx="376" cy="122" r="6" />
            <circle cx="330" cy="166" r="6" />
            <circle cx="246" cy="180" r="6" />
          </g>
          <text className="atlasSvgWarning" textAnchor="middle" x="305" y="65">{formatNumber(sharedNoise * 1000)} mV shared</text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Grounding controls">
        <p className="eyebrow">Return conditions</p>
        <h3>Reduce shared impedance</h3>
        <RangeControl label="Return impedance" max={200} min={1} onChange={setReturnImpedance} step={1} value={returnImpedance} valueLabel={`${returnImpedance} mΩ`} />
        <RangeControl label="Noise current" max={5} min={0.1} onChange={setNoiseCurrent} step={0.1} value={noiseCurrent} valueLabel={`${noiseCurrent.toFixed(1)} A`} />
        <RangeControl label="Loop area" max={100} min={5} onChange={setLoopArea} step={5} value={loopArea} valueLabel={`${loopArea} cm²`} />
        <p className={`atlasControlNote ${sharedNoise > 0.1 ? 'warning' : ''}`}>
          Shorter, wider return paths lower impedance and keep switching current
          out of the sensor reference.
        </p>
      </aside>
    </div>
  );
}

function MeterExplorer() {
  const [sourceResistance, setSourceResistance] = useState(50);
  const [meterImpedance, setMeterImpedance] = useState(1000);
  const [sourceVoltage, setSourceVoltage] = useState(5);
  const measured =
    sourceVoltage * (meterImpedance / (sourceResistance + meterImpedance));
  const error = ((sourceVoltage - measured) / sourceVoltage) * 100;

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Instrument loading"
        readouts={[
          { label: 'True voltage', value: `${sourceVoltage.toFixed(1)} V` },
          { label: 'Meter reading', value: `${formatNumber(measured)} V` },
          { label: 'Loading error', value: `${formatNumber(error)}%` },
        ]}
        title="Source and meter impedance"
      >
        <svg aria-label="Interactive meter loading diagram" viewBox="0 0 620 250">
          <path className="atlasWire" d="M55 70H260M260 70H540V185H55V70" />
          <rect className="atlasSource" height="92" rx="8" width="68" x="55" y="82" />
          <text className="atlasSvgLabel" textAnchor="middle" x="89" y="115">SOURCE</text>
          <text className="atlasSvgValue" textAnchor="middle" x="89" y="145">{sourceVoltage} V</text>
          <rect className="atlasComponent" height="48" rx="7" width="112" x="165" y="46" />
          <text className="atlasSvgValue" textAnchor="middle" x="221" y="39">RS {sourceResistance} kΩ</text>
          <g className="atlasMeter">
            <rect height="145" rx="12" width="190" x="350" y="45" />
            <text className="atlasSvgLabel" x="375" y="78">DIGITAL VOLTMETER</text>
            <rect height="60" rx="5" width="140" x="375" y="91" />
            <text className="atlasMeterValue" textAnchor="middle" x="445" y="132">{formatNumber(measured)} V</text>
            <text className="atlasSvgValue" x="375" y="176">ZIN {meterImpedance} kΩ</text>
          </g>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Instrument controls">
        <p className="eyebrow">Measurement setup</p>
        <h3>Limit loading error</h3>
        <RangeControl label="Source resistance" max={200} min={1} onChange={setSourceResistance} step={1} value={sourceResistance} valueLabel={`${sourceResistance} kΩ`} />
        <RangeControl label="Meter impedance" max={10000} min={100} onChange={setMeterImpedance} step={100} value={meterImpedance} valueLabel={`${meterImpedance} kΩ`} />
        <RangeControl label="Source voltage" max={12} min={1} onChange={setSourceVoltage} step={0.5} value={sourceVoltage} valueLabel={`${sourceVoltage.toFixed(1)} V`} />
        <p className={`atlasControlNote ${error > 5 ? 'warning' : ''}`}>
          A meter impedance at least 100 times larger than the source usually
          keeps loading small.
        </p>
      </aside>
    </div>
  );
}

function TransientExplorer() {
  const [resistance, setResistance] = useState(4.7);
  const [capacitance, setCapacitance] = useState(22);
  const [elapsedTau, setElapsedTau] = useState(1);
  const sourceVoltage = 10;
  const timeConstant = resistance * capacitance;
  const capacitorVoltage = sourceVoltage * (1 - Math.exp(-elapsedTau));
  const settledPercent = (capacitorVoltage / sourceVoltage) * 100;
  const responsePath = Array.from({ length: 101 }, (_, index) => {
    const progress = index / 100;
    const value = 1 - Math.exp(-progress * 5);
    return `${index === 0 ? 'M' : 'L'}${(58 + progress * 510).toFixed(2)} ${(202 - value * 130).toFixed(2)}`;
  }).join(' ');
  const cursorX = 58 + (elapsedTau / 5) * 510;
  const cursorY = 202 - (1 - Math.exp(-elapsedTau)) * 130;

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="First-order response"
        readouts={[
          { label: 'Time constant', value: `${formatNumber(timeConstant)} ms` },
          { label: 'Capacitor voltage', value: `${formatNumber(capacitorVoltage)} V` },
          { label: 'Transition complete', value: `${formatNumber(settledPercent, 1)}%` },
        ]}
        title="RC charging and settling"
      >
        <svg aria-label="Interactive RC transient response" viewBox="0 0 620 250">
          <path className="atlasGridLine" d="M58 72H568M58 115H568M58 158H568M58 202H568M160 48V208M262 48V208M364 48V208M466 48V208M568 48V208" />
          <path className="atlasAxis" d="M58 48V208H578" />
          <path className="atlasResponsePath" d={responsePath} />
          <path className="atlasMarkerLine" d={`M${cursorX} 48V208`} />
          <circle className="atlasPhasorTip" cx={cursorX} cy={cursorY} r="7" />
          <text className="atlasSvgValue" x="68" y="65">{sourceVoltage} V</text>
          <text className="atlasSvgLabel" x="151" y="228">1τ</text>
          <text className="atlasSvgLabel" x="253" y="228">2τ</text>
          <text className="atlasSvgLabel" x="355" y="228">3τ</text>
          <text className="atlasSvgLabel" x="457" y="228">4τ</text>
          <text className="atlasSvgLabel" x="554" y="228">5τ</text>
          <text className="atlasSvgAccent" x={Math.min(cursorX + 10, 475)} y={Math.max(cursorY - 12, 58)}>
            {formatNumber(capacitorVoltage)} V
          </text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Transient controls">
        <p className="eyebrow">Stored energy</p>
        <h3>Change the settling rate</h3>
        <RangeControl label="Resistance" max={20} min={0.5} onChange={setResistance} step={0.1} value={resistance} valueLabel={`${resistance.toFixed(1)} kΩ`} />
        <RangeControl label="Capacitance" max={100} min={1} onChange={setCapacitance} step={1} value={capacitance} valueLabel={`${capacitance} µF`} />
        <RangeControl label="Elapsed time" max={5} min={0} onChange={setElapsedTau} step={0.1} value={elapsedTau} valueLabel={`${elapsedTau.toFixed(1)} τ`} />
        <p className="atlasControlNote">
          Resistance and capacitance stretch the time axis. The normalized
          waveform still reaches 63.2% at one time constant.
        </p>
      </aside>
    </div>
  );
}

function MosfetExplorer() {
  const [gateVoltage, setGateVoltage] = useState(8);
  const [supplyVoltage, setSupplyVoltage] = useState(24);
  const [loadResistance, setLoadResistance] = useState(8);
  const thresholdVoltage = 3;
  const on = gateVoltage > thresholdVoltage;
  const onResistance = on
    ? 0.035 + 0.32 / Math.max(0.2, (gateVoltage - thresholdVoltage) ** 2)
    : 1_000_000;
  const drainCurrent = on
    ? Math.min(20, supplyVoltage / (loadResistance + onResistance))
    : 0;
  const drainVoltage = on ? drainCurrent * onResistance : supplyVoltage;
  const conductionLoss = drainCurrent ** 2 * onResistance;

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Low-side switch"
        readouts={[
          { label: 'Drain current', value: `${formatNumber(drainCurrent)} A` },
          { label: 'Drain voltage', value: `${formatNumber(drainVoltage)} V` },
          { label: 'Conduction loss', value: `${formatNumber(conductionLoss)} W` },
        ]}
        title="MOSFET gate drive and load current"
      >
        <svg aria-label="Interactive MOSFET low-side switching circuit" viewBox="0 0 620 250">
          <path className="atlasWire" d="M95 55H495V92M495 158V205H95V55" />
          <rect className="atlasSource" height="100" rx="8" width="72" x="58" y="82" />
          <path className="atlasSourceMark" d="M78 112h32M85 132h18" />
          <text className="atlasSvgLabel" x="70" y="103">DC BUS</text>
          <text className="atlasSvgValue" x="72" y="160">{supplyVoltage} V</text>
          <rect className="atlasLoad" height="58" rx="8" width="130" x="290" y="27" />
          <path className="atlasLoadCoil" d="M310 55h16l8-12 12 24 12-24 12 24 10-12h20" />
          <text className="atlasSvgValue" textAnchor="middle" x="355" y="105">{loadResistance} Ω LOAD</text>
          <rect className={`atlasSwitch ${on ? 'conducting' : ''}`} height="78" rx="9" width="96" x="447" y="91" />
          <path className="atlasSwitchBlade" d={on ? 'M470 142L518 112' : 'M470 142L510 142'} />
          <text className="atlasSvgLabel" textAnchor="middle" x="495" y="187">N-MOSFET</text>
          <path className="atlasSignalLine" d="M195 145H440" />
          <text className="atlasSvgAccent" x="205" y="132">VG = {gateVoltage.toFixed(1)} V</text>
          {on && (
            <g className="atlasFlowDots">
              <circle cx="210" cy="55" r="6" />
              <circle cx="455" cy="55" r="6" />
              <circle cx="495" cy="188" r="6" />
              <circle cx="260" cy="205" r="6" />
            </g>
          )}
          <text className={on ? 'atlasSvgAccent' : 'atlasSvgWarning'} x="210" y="235">
            {on ? `CHANNEL ON · RDS ${formatNumber(onResistance * 1000)} mΩ` : 'BELOW THRESHOLD · LOAD OFF'}
          </text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="MOSFET controls">
        <p className="eyebrow">Gate-drive conditions</p>
        <h3>Balance drive and loss</h3>
        <RangeControl label="Gate voltage" max={12} min={0} onChange={setGateVoltage} step={0.5} value={gateVoltage} valueLabel={`${gateVoltage.toFixed(1)} V`} />
        <RangeControl label="DC bus" max={48} min={6} onChange={setSupplyVoltage} step={1} value={supplyVoltage} valueLabel={`${supplyVoltage} V`} />
        <RangeControl label="Load resistance" max={30} min={2} onChange={setLoadResistance} step={1} value={loadResistance} valueLabel={`${loadResistance} Ω`} />
        <p className={`atlasControlNote ${on && conductionLoss > 2 ? 'warning' : ''}`}>
          Threshold voltage only begins channel formation. A power MOSFET needs
          the specified gate drive to reach low on-resistance.
        </p>
      </aside>
    </div>
  );
}

function EmbeddedExplorer() {
  const [clockRate, setClockRate] = useState(80);
  const [interruptRate, setInterruptRate] = useState(10);
  const [serviceCycles, setServiceCycles] = useState(600);
  const utilization =
    ((interruptRate * 1000 * serviceCycles) / (clockRate * 1_000_000)) * 100;
  const latency = serviceCycles / clockRate;
  const available = Math.max(0, 100 - utilization);
  const slotWidth = 74;
  const busyWidth = Math.min(slotWidth - 8, (utilization / 100) * slotWidth);

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Real-time firmware"
        readouts={[
          { label: 'Interrupt load', value: `${formatNumber(utilization, 1)}%` },
          { label: 'Service latency', value: `${formatNumber(latency)} µs` },
          { label: 'Background time', value: `${formatNumber(available, 1)}%` },
        ]}
        title="Interrupt service and CPU budget"
      >
        <svg aria-label="Interactive microcontroller interrupt timeline" viewBox="0 0 620 250">
          <rect className="atlasBoard" height="174" rx="12" width="550" x="35" y="38" />
          <rect className="atlasChipBlock" height="92" rx="8" width="125" x="62" y="68" />
          <text className="atlasSvgLabel" textAnchor="middle" x="124" y="100">MCU CORE</text>
          <text className="atlasSvgValue" textAnchor="middle" x="124" y="129">{clockRate} MHz</text>
          <path className="atlasDigitalInput" d="M205 88h18v-20h18v20h18v-20h18v20h18" />
          <text className="atlasSvgLabel" x="206" y="113">IRQ EVENTS</text>
          <path className="atlasAxis" d="M205 176H560" />
          {Array.from({ length: 5 }, (_, index) => {
            const x = 218 + index * slotWidth;
            return (
              <g key={x}>
                <rect className="atlasCpuSlot" height="42" rx="4" width={slotWidth - 8} x={x} y="127" />
                <rect className={utilization > 90 ? 'atlasCpuBusy overloaded' : 'atlasCpuBusy'} height="42" rx="4" width={Math.max(3, busyWidth)} x={x} y="127" />
              </g>
            );
          })}
          <text className={utilization > 100 ? 'atlasSvgWarning' : 'atlasSvgAccent'} x="205" y="205">
            {utilization > 100 ? 'DEADLINE MISSED · ISR DEMAND EXCEEDS CPU' : `${formatNumber(available, 1)}% CPU REMAINS FOR TASKS`}
          </text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Microcontroller controls">
        <p className="eyebrow">Firmware workload</p>
        <h3>Protect the real-time budget</h3>
        <RangeControl label="CPU clock" max={240} min={8} onChange={setClockRate} step={4} value={clockRate} valueLabel={`${clockRate} MHz`} />
        <RangeControl label="Interrupt rate" max={100} min={1} onChange={setInterruptRate} step={1} value={interruptRate} valueLabel={`${interruptRate} kHz`} />
        <RangeControl label="Service cost" max={3000} min={50} onChange={setServiceCycles} step={50} value={serviceCycles} valueLabel={`${serviceCycles} cycles`} />
        <p className={`atlasControlNote ${utilization > 80 ? 'warning' : ''}`}>
          Keep interrupt handlers short. DMA and peripheral state machines can
          preserve CPU margin as event rate rises.
        </p>
      </aside>
    </div>
  );
}

function ModulationExplorer() {
  const [bitsPerSymbol, setBitsPerSymbol] = useState(4);
  const [symbolRate, setSymbolRate] = useState(500);
  const [snr, setSnr] = useState(18);
  const order = 2 ** bitsPerSymbol;
  const gridSize = Math.sqrt(order);
  const dataRate = (symbolRate * bitsPerSymbol) / 1000;
  const bandwidth = (symbolRate * 1.35) / 1000;
  const snrLinear = 10 ** (snr / 10);
  const bitErrorRate = Math.min(
    0.5,
    0.2 * Math.exp(-snrLinear / Math.max(2, order / 3)),
  );
  const noiseScale = Math.max(1.5, (30 - snr) * 0.65);
  const points = Array.from({ length: order }, (_, index) => {
    const column = index % gridSize;
    const row = Math.floor(index / gridSize);
    const spacing = gridSize === 1 ? 0 : 230 / (gridSize - 1);
    const idealX = 310 - 115 + column * spacing;
    const idealY = 126 - 115 + row * spacing;
    return {
      idealX,
      idealY,
      receivedX: idealX + Math.sin(index * 7.31) * noiseScale,
      receivedY: idealY + Math.cos(index * 4.73) * noiseScale,
    };
  });

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="I/Q signal space"
        readouts={[
          { label: 'Modulation', value: `${order}-QAM` },
          { label: 'Bit rate', value: `${formatNumber(dataRate)} Mb/s` },
          { label: 'Estimated BER', value: bitErrorRate < 0.0001 ? bitErrorRate.toExponential(1) : formatNumber(bitErrorRate, 4) },
        ]}
        title="Constellation spacing and channel noise"
      >
        <svg aria-label="Interactive QAM constellation" viewBox="0 0 620 250">
          <path className="atlasGridLine" d="M80 26H540M80 76H540M80 126H540M80 176H540M80 226H540M110 16V236M210 16V236M310 16V236M410 16V236M510 16V236" />
          <path className="atlasAxis" d="M70 126H550M310 16V236" />
          {points.map((point, index) => (
            <g key={index}>
              <circle className="atlasConstellationIdeal" cx={point.idealX} cy={point.idealY} r="8" />
              <circle className="atlasConstellationReceived" cx={point.receivedX} cy={point.receivedY} r="4" />
            </g>
          ))}
          <text className="atlasSvgLabel" x="545" y="118">I</text>
          <text className="atlasSvgLabel" x="320" y="25">Q</text>
          <text className="atlasSvgAccent" x="82" y="45">{snr} dB SNR · {formatNumber(bandwidth)} MHz occupied</text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Modulation controls">
        <p className="eyebrow">Link waveform</p>
        <h3>Trade rate for noise margin</h3>
        <RangeControl label="Bits per symbol" max={6} min={2} onChange={setBitsPerSymbol} step={2} value={bitsPerSymbol} valueLabel={`${bitsPerSymbol} bit (${order}-QAM)`} />
        <RangeControl label="Symbol rate" max={2000} min={100} onChange={setSymbolRate} step={100} value={symbolRate} valueLabel={`${symbolRate} ksym/s`} />
        <RangeControl label="Channel SNR" max={30} min={5} onChange={setSnr} step={1} value={snr} valueLabel={`${snr} dB`} />
        <p className={`atlasControlNote ${bitErrorRate > 0.01 ? 'warning' : ''}`}>
          Higher-order QAM moves more bits per symbol, but each decision region
          becomes smaller and needs more received SNR.
        </p>
      </aside>
    </div>
  );
}

function ProtectionExplorer() {
  const [loadCurrent, setLoadCurrent] = useState(600);
  const [faultCurrent, setFaultCurrent] = useState(6000);
  const [pickupCurrent, setPickupCurrent] = useState(1200);
  const [timeMultiplier, setTimeMultiplier] = useState(0.25);
  const relay = calculateRelayTrip(
    faultCurrent,
    pickupCurrent,
    timeMultiplier,
  );
  const secureAboveLoad = pickupCurrent >= loadCurrent * 1.25;
  const sensitiveToFault = relay.multiple >= 1.5;
  const coordinated = secureAboveLoad && sensitiveToFault;

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Feeder protection"
        readouts={[
          { label: 'Fault multiple', value: `${formatNumber(relay.multiple)} × pickup` },
          { label: 'Relay trip time', value: relay.tripTime >= 90 ? 'No trip' : `${formatNumber(relay.tripTime)} s` },
          { label: 'Load margin', value: `${formatNumber(pickupCurrent / loadCurrent)} × load` },
        ]}
        title="Inverse-time overcurrent relay"
      >
        <svg aria-label="Interactive feeder protection diagram" viewBox="0 0 620 250">
          <circle className="atlasSource" cx="78" cy="125" r="42" />
          <text className="atlasSvgLabel" textAnchor="middle" x="78" y="120">SOURCE</text>
          <text className="atlasSvgValue" textAnchor="middle" x="78" y="142">BUS</text>
          <path className="atlasWire" d="M120 125H205M275 125H505" />
          <rect className={coordinated ? 'atlasBreaker coordinated' : 'atlasBreaker'} height="72" rx="8" width="70" x="205" y="89" />
          <path className="atlasSwitchBlade" d="M220 142L260 108" />
          <text className="atlasSvgLabel" textAnchor="middle" x="240" y="181">RELAY</text>
          <rect className="atlasLoad" height="90" rx="9" width="84" x="495" y="80" />
          <text className="atlasSvgLabel" textAnchor="middle" x="537" y="113">FEEDER</text>
          <text className="atlasSvgValue" textAnchor="middle" x="537" y="139">{formatNumber(faultCurrent / 1000)} kA</text>
          <path className={coordinated ? 'atlasProtectedLine' : 'atlasWarningLine'} d="M295 155H470" />
          {coordinated && (
            <g className="atlasFlowDots">
              <circle cx="150" cy="125" r="6" />
              <circle cx="330" cy="125" r="6" />
              <circle cx="440" cy="125" r="6" />
            </g>
          )}
          <text className={coordinated ? 'atlasSvgAccent' : 'atlasSvgWarning'} x="145" y="52">
            {coordinated ? 'LOAD SECURE · FAULT DETECTED' : 'PICKUP WINDOW INVALID'}
          </text>
          <text className="atlasSvgValue" x="145" y="218">IPICKUP {pickupCurrent} A · TMS {timeMultiplier.toFixed(2)}</text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Protection controls">
        <p className="eyebrow">Relay settings</p>
        <h3>Separate load from faults</h3>
        <RangeControl label="Maximum load" max={1200} min={100} onChange={setLoadCurrent} step={50} value={loadCurrent} valueLabel={`${loadCurrent} A`} />
        <RangeControl label="Fault current" max={12000} min={1000} onChange={setFaultCurrent} step={250} value={faultCurrent} valueLabel={`${formatNumber(faultCurrent / 1000)} kA`} />
        <RangeControl label="Relay pickup" max={5000} min={250} onChange={setPickupCurrent} step={250} value={pickupCurrent} valueLabel={`${pickupCurrent} A`} />
        <RangeControl label="Time multiplier" max={1} min={0.05} onChange={setTimeMultiplier} step={0.05} value={timeMultiplier} valueLabel={timeMultiplier.toFixed(2)} />
        <p className={`atlasControlNote ${coordinated ? '' : 'warning'}`}>
          Keep pickup above maximum expected load, then verify the minimum fault
          still produces a decisive operating multiple.
        </p>
      </aside>
    </div>
  );
}

function AntennaExplorer() {
  const [frequency, setFrequency] = useState(915);
  const [distance, setDistance] = useState(5);
  const [transmitPower, setTransmitPower] = useState(20);
  const [antennaGain, setAntennaGain] = useState(3);
  const pathLoss =
    32.44 + 20 * Math.log10(frequency) + 20 * Math.log10(distance);
  const receivedPower =
    transmitPower + antennaGain * 2 - pathLoss;
  const receiverSensitivity = -100;
  const fadeMargin = receivedPower - receiverSensitivity;
  const wavelength = 300 / frequency;

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Free-space radio path"
        readouts={[
          { label: 'Path loss', value: `${formatNumber(pathLoss, 1)} dB` },
          { label: 'Received power', value: `${formatNumber(receivedPower, 1)} dBm` },
          { label: 'Fade margin', value: `${formatNumber(fadeMargin, 1)} dB` },
        ]}
        title="Antenna gain and RF link margin"
      >
        <svg aria-label="Interactive wireless link budget diagram" viewBox="0 0 620 250">
          <path className="atlasGroundPlane" d="M45 210H575" />
          <path className="atlasWire" d="M95 205V72M70 105L95 72L120 105M500 205V88M478 116L500 88L522 116" />
          <path className="atlasAntennaArc" d="M130 94Q310 -15 470 105" />
          <path className="atlasAntennaArc secondary" d="M145 116Q310 35 455 124" />
          <path className="atlasAntennaArc tertiary" d="M165 138Q310 84 435 143" />
          <circle className="atlasPhasorTip" cx="310" cy="59" r="7" />
          <text className="atlasSvgLabel" textAnchor="middle" x="95" y="230">TX {transmitPower} dBm</text>
          <text className="atlasSvgLabel" textAnchor="middle" x="500" y="230">RX −100 dBm</text>
          <text className="atlasSvgAccent" textAnchor="middle" x="310" y="30">{distance} km · {frequency} MHz</text>
          <text className={fadeMargin >= 10 ? 'atlasSvgAccent' : 'atlasSvgWarning'} textAnchor="middle" x="310" y="191">
            {fadeMargin >= 10 ? `${formatNumber(fadeMargin, 1)} dB LINK MARGIN` : 'LINK AT RISK · ADD MARGIN'}
          </text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Antenna link controls">
        <p className="eyebrow">Wireless path</p>
        <h3>Close the link budget</h3>
        <RangeControl label="Carrier frequency" max={6000} min={100} onChange={setFrequency} step={25} value={frequency} valueLabel={`${frequency} MHz`} />
        <RangeControl label="Distance" max={100} min={1} onChange={setDistance} step={1} value={distance} valueLabel={`${distance} km`} />
        <RangeControl label="Transmit power" max={40} min={0} onChange={setTransmitPower} step={1} value={transmitPower} valueLabel={`${transmitPower} dBm`} />
        <RangeControl label="Gain per antenna" max={18} min={0} onChange={setAntennaGain} step={1} value={antennaGain} valueLabel={`${antennaGain} dBi`} />
        <p className={`atlasControlNote ${fadeMargin < 10 ? 'warning' : ''}`}>
          Wavelength is {formatNumber(wavelength, 3)} m. Real designs also
          subtract cable, mismatch, polarization, and fading losses.
        </p>
      </aside>
    </div>
  );
}

function PidExplorer() {
  const [proportional, setProportional] = useState(2.5);
  const [integral, setIntegral] = useState(0.8);
  const [derivative, setDerivative] = useState(0.7);
  const [plantTimeConstant, setPlantTimeConstant] = useState(1.5);
  const metrics = calculatePidMetrics(
    proportional,
    integral,
    derivative,
    plantTimeConstant,
  );
  const responsePath = makeStepResponsePath(metrics);

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Closed-loop response"
        readouts={[
          { label: 'Overshoot', value: `${formatNumber(metrics.overshoot, 1)}%` },
          { label: 'Settling time', value: `${formatNumber(metrics.settlingTime)} s` },
          { label: 'Steady error', value: `${formatNumber(metrics.steadyError, 1)}%` },
        ]}
        title="PID gains and step response"
      >
        <svg aria-label="Interactive PID step response" viewBox="0 0 620 250">
          <path className="atlasGridLine" d="M55 65H575M55 105H575M55 145H575M55 185H575M160 35V215M265 35V215M370 35V215M475 35V215M575 35V215" />
          <path className="atlasAxis" d="M55 35V215H580" />
          <path className="atlasSetpoint" d="M55 85H575" />
          <path className={metrics.stable ? 'atlasControlResponse' : 'atlasControlResponse unstable'} d={responsePath} />
          <text className="atlasSvgLabel" x="64" y="76">SETPOINT</text>
          <text className={metrics.stable ? 'atlasSvgAccent' : 'atlasSvgWarning'} x="365" y="228">
            {metrics.stable ? `ζ = ${formatNumber(metrics.damping)} · LOOP STABLE` : 'TUNING REGION UNSTABLE'}
          </text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="PID tuning controls">
        <p className="eyebrow">Controller gains</p>
        <h3>Shape the response</h3>
        <RangeControl label="Proportional Kp" max={8} min={0.2} onChange={setProportional} step={0.1} value={proportional} valueLabel={proportional.toFixed(1)} />
        <RangeControl label="Integral Ki" max={4} min={0} onChange={setIntegral} step={0.1} value={integral} valueLabel={integral.toFixed(1)} />
        <RangeControl label="Derivative Kd" max={3} min={0} onChange={setDerivative} step={0.1} value={derivative} valueLabel={derivative.toFixed(1)} />
        <RangeControl label="Plant time constant" max={4} min={0.5} onChange={setPlantTimeConstant} step={0.1} value={plantTimeConstant} valueLabel={`${plantTimeConstant.toFixed(1)} s`} />
        <p className={`atlasControlNote ${!metrics.stable || metrics.overshoot > 25 ? 'warning' : ''}`}>
          Increase Kp for authority, Ki for offset removal, and Kd for damping.
          A practical derivative term is filtered to limit noise gain.
        </p>
      </aside>
    </div>
  );
}

function UncertaintyExplorer() {
  const [sensorBias, setSensorBias] = useState(0.8);
  const [randomNoise, setRandomNoise] = useState(0.3);
  const [sampleCount, setSampleCount] = useState(10);
  const [calibrationCorrection, setCalibrationCorrection] = useState(0);
  const trueValue = 10;
  const residualBias = sensorBias - calibrationCorrection;
  const randomUncertainty = randomNoise / Math.sqrt(sampleCount);
  const combinedUncertainty = Math.sqrt(
    residualBias ** 2 + randomUncertainty ** 2,
  );
  const reportedValue = trueValue * (1 + residualBias / 100);
  const trueX = 310;
  const meanX = trueX + residualBias * 110;
  const bandWidth = Math.max(8, combinedUncertainty * 110);
  const sampleDots = Array.from(
    { length: Math.min(28, sampleCount) },
    (_, index) => ({
      x:
        meanX +
        Math.sin(index * 5.13) *
          randomNoise *
          115,
      y: 105 + (index % 5) * 15,
    }),
  );

  return (
    <div className="atlasInteractiveGrid">
      <Stage
        eyebrow="Metrology result"
        readouts={[
          { label: 'Reported mean', value: `${formatNumber(reportedValue, 4)} V` },
          { label: 'Combined uncertainty', value: `${formatNumber(combinedUncertainty, 3)}%` },
          { label: 'Residual bias', value: `${formatNumber(residualBias, 2)}%` },
        ]}
        title="Bias, averaging, and calibration"
      >
        <svg aria-label="Interactive measurement uncertainty plot" viewBox="0 0 620 250">
          <path className="atlasGridLine" d="M75 75H545M75 125H545M75 175H545M125 55V195M218 55V195M310 55V195M402 55V195M495 55V195" />
          <path className="atlasAxis" d="M65 175H555" />
          <rect className="atlasUncertaintyBand" height="112" rx="7" width={bandWidth * 2} x={meanX - bandWidth} y="67" />
          <path className="atlasMeanMarker" d={`M${meanX} 58V187`} />
          <path className="atlasMarkerLine" d={`M${trueX} 50V195`} />
          {sampleDots.map((dot, index) => (
            <circle className="atlasMeasurementDot" cx={dot.x} cy={dot.y} key={index} r="4" />
          ))}
          <text className="atlasSvgLabel" textAnchor="middle" x={trueX} y="218">TRUE 10.0000 V</text>
          <text className="atlasSvgAccent" textAnchor="middle" x={clampNumber(meanX, 130, 490)} y="42">
            MEAN {formatNumber(reportedValue, 4)} V
          </text>
        </svg>
      </Stage>
      <aside className="atlasControlPanel" aria-label="Uncertainty controls">
        <p className="eyebrow">Uncertainty budget</p>
        <h3>Separate bias from noise</h3>
        <RangeControl label="Sensor bias" max={2} min={-2} onChange={setSensorBias} step={0.1} value={sensorBias} valueLabel={`${sensorBias.toFixed(1)}%`} />
        <RangeControl label="Random noise" max={1} min={0.05} onChange={setRandomNoise} step={0.05} value={randomNoise} valueLabel={`${randomNoise.toFixed(2)}%`} />
        <RangeControl label="Sample count" max={100} min={1} onChange={setSampleCount} step={1} value={sampleCount} valueLabel={`${sampleCount}`} />
        <RangeControl label="Calibration correction" max={2} min={-2} onChange={setCalibrationCorrection} step={0.1} value={calibrationCorrection} valueLabel={`${calibrationCorrection.toFixed(1)}%`} />
        <p className={`atlasControlNote ${Math.abs(residualBias) > randomUncertainty * 2 ? 'warning' : ''}`}>
          More samples narrow random uncertainty. Only a traceable correction
          addresses systematic bias.
        </p>
      </aside>
    </div>
  );
}

export function InteractiveConceptDiagram({
  kind,
}: {
  kind: AtlasDiagramKind;
}) {
  switch (kind) {
    case 'antenna':
      return <AntennaExplorer />;
    case 'network':
      return <NetworkExplorer />;
    case 'phasor':
      return <PhasorExplorer />;
    case 'resonance':
      return <ResonanceExplorer />;
    case 'diode':
      return <DiodeExplorer />;
    case 'opamp':
      return <OpAmpExplorer />;
    case 'filter':
      return <FilterExplorer />;
    case 'digital':
      return <DigitalTimingExplorer />;
    case 'embedded':
      return <EmbeddedExplorer />;
    case 'sampling':
      return <SamplingExplorer />;
    case 'three-phase':
      return <ThreePhaseExplorer />;
    case 'transformer':
      return <TransformerExplorer />;
    case 'buck':
      return <BuckExplorer />;
    case 'field':
      return <FieldExplorer />;
    case 'transmission':
      return <TransmissionExplorer />;
    case 'control':
      return <ControlExplorer />;
    case 'ground':
      return <GroundExplorer />;
    case 'meter':
      return <MeterExplorer />;
    case 'modulation':
      return <ModulationExplorer />;
    case 'mosfet':
      return <MosfetExplorer />;
    case 'pid':
      return <PidExplorer />;
    case 'protection':
      return <ProtectionExplorer />;
    case 'transient':
      return <TransientExplorer />;
    case 'uncertainty':
      return <UncertaintyExplorer />;
  }
}

export function QuestionAtlasCompanion({
  conceptId,
  onOpenConcept,
  onOpenGame,
  revealed,
}: {
  conceptId: string;
  onOpenConcept: (conceptId: string) => void;
  onOpenGame: (gameId: string) => void;
  revealed: boolean;
}) {
  const concept = getElectricalConcept(conceptId);

  if (!concept) {
    return null;
  }

  const domain = atlasDomains.find((item) => item.id === concept.domain);
  const relatedGame = engineeringGames.find((game) =>
    game.conceptIds.includes(concept.id),
  );

  return (
    <section
      aria-label={`${concept.title} interactive concept model`}
      className="questionAtlasCompanion"
    >
      <header>
        <div>
          <p className="eyebrow">
            {domain?.label} / {concept.level}
          </p>
          <h3>{concept.title}</h3>
          <p>{concept.summary}</p>
        </div>
        <button
          aria-label={`Open ${concept.title} in the EE Atlas`}
          onClick={() => onOpenConcept(concept.id)}
          type="button"
        >
          Open Atlas
          <ArrowRight size={16} />
        </button>
      </header>

      <div className="questionAtlasModel">
        <InteractiveConceptDiagram kind={concept.diagramKind} />
      </div>

      <footer>
        <div>
          <span>Concept relationship</span>
          <strong>{concept.equation}</strong>
        </div>
        {revealed && relatedGame && (
          <button onClick={() => onOpenGame(relatedGame.id)} type="button">
            <Gamepad2 size={16} />
            Play {relatedGame.title}
          </button>
        )}
      </footer>
    </section>
  );
}

function AtlasProgressBand({
  onOpenConcept,
  progress,
}: {
  onOpenConcept: (conceptId: string) => void;
  progress: AtlasProgress;
}) {
  const continueConcept =
    getElectricalConcept(progress.recentIds[0] ?? null) ??
    electricalConcepts[0];
  const completionPercent = Math.round(
    (progress.completedIds.length / electricalConcepts.length) * 100,
  );

  return (
    <section className="atlasProgressBand" aria-label="Your Atlas progress">
      <div className="atlasProgressSummary">
        <span className="atlasProgressIcon">
          <Route size={22} />
        </span>
        <div>
          <p className="eyebrow">Your Atlas</p>
          <h2>Build a connected engineering foundation</h2>
          <p>
            Resume your last model, save useful references, and verify each
            concept with a short knowledge check.
          </p>
        </div>
      </div>
      <div className="atlasProgressMeter">
        <div>
          <span>Concept mastery</span>
          <strong>{completionPercent}%</strong>
        </div>
        <span className="atlasProgressTrack">
          <i style={{ width: `${completionPercent}%` }} />
        </span>
        <div className="atlasProgressMetrics">
          <span>
            <strong>{progress.completedIds.length}</strong>
            checked
          </span>
          <span>
            <strong>{progress.bookmarkedIds.length}</strong>
            saved
          </span>
          <span>
            <strong>{progress.recentIds.length}</strong>
            visited
          </span>
        </div>
      </div>
      <button
        className="atlasContinueButton"
        onClick={() => onOpenConcept(continueConcept.id)}
        type="button"
      >
        <span>
          <small>{progress.recentIds.length ? 'Continue exploring' : 'Start here'}</small>
          <strong>{continueConcept.title}</strong>
        </span>
        <ArrowRight size={19} />
      </button>
    </section>
  );
}

function AtlasConceptMap({
  onOpenConcept,
  progress,
}: {
  onOpenConcept: (conceptId: string) => void;
  progress: AtlasProgress;
}) {
  return (
    <section className="atlasMapView" aria-labelledby="atlas-map-title">
      <header className="atlasSectionHeader">
        <div>
          <p className="eyebrow">Concept map</p>
          <h2 id="atlas-map-title">See how the EE domains connect</h2>
          <p>
            Follow each lane from foundations toward applied systems. Shared
            concepts appear where disciplines begin to overlap.
          </p>
        </div>
        <span>
          <Map size={18} />
          {progress.completedIds.length} checked
        </span>
      </header>
      <div className="atlasMapLegend" aria-label="Concept status legend">
        <span><i className="complete" /> Checked</span>
        <span><i className="visited" /> Visited</span>
        <span><i /> Not started</span>
      </div>
      <div className="atlasMapGrid">
        {atlasDomains.map((domain) => {
          const visual = domainVisuals[domain.id];
          const DomainIcon = visual.icon;
          const domainConcepts = electricalConcepts.filter(
            (concept) => concept.domain === domain.id,
          );

          return (
            <section className={`atlasMapLane ${visual.tone}`} key={domain.id}>
              <header>
                <span><DomainIcon size={19} /></span>
                <div>
                  <h3>{domain.label}</h3>
                  <p>{domain.description}</p>
                </div>
              </header>
              <div className="atlasMapNodes">
                {domainConcepts.map((concept, index) => {
                  const completed = progress.completedIds.includes(concept.id);
                  const visited = progress.recentIds.includes(concept.id);
                  return (
                    <button
                      className={
                        completed ? 'complete' : visited ? 'visited' : ''
                      }
                      key={concept.id}
                      onClick={() => onOpenConcept(concept.id)}
                      type="button"
                    >
                      <span className="atlasMapNodeIndex">
                        {completed ? <CheckCircle2 size={16} /> : index + 1}
                      </span>
                      <span>
                        <small>{concept.unit}</small>
                        <strong>{concept.title}</strong>
                      </span>
                      <ArrowRight size={16} />
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function AtlasLearningPathView({
  onOpenConcept,
  progress,
}: {
  onOpenConcept: (conceptId: string) => void;
  progress: AtlasProgress;
}) {
  return (
    <section className="atlasPathView" aria-labelledby="atlas-paths-title">
      <header className="atlasSectionHeader">
        <div>
          <p className="eyebrow">Guided routes</p>
          <h2 id="atlas-paths-title">Learn in a useful order</h2>
          <p>
            Each path links theory to the next practical idea, while still
            letting you jump directly to any model.
          </p>
        </div>
        <span>
          <Route size={18} />
          {atlasLearningPaths.length} paths
        </span>
      </header>
      <div className="atlasPathList">
        {atlasLearningPaths.map((path) => {
          const concepts = path.conceptIds.flatMap((conceptId) => {
            const concept = getElectricalConcept(conceptId);
            return concept ? [concept] : [];
          });
          const completedCount = concepts.filter((concept) =>
            progress.completedIds.includes(concept.id),
          ).length;
          const nextConcept =
            concepts.find(
              (concept) => !progress.completedIds.includes(concept.id),
            ) ?? concepts[concepts.length - 1];
          const pathPercent = Math.round(
            (completedCount / Math.max(1, concepts.length)) * 100,
          );

          return (
            <article className="atlasPathLane" key={path.id}>
              <header>
                <div>
                  <p className="eyebrow">{path.duration}</p>
                  <h3>{path.label}</h3>
                  <p>{path.description}</p>
                </div>
                <div className="atlasPathProgress">
                  <span>{completedCount} / {concepts.length} checked</span>
                  <strong>{pathPercent}%</strong>
                  <i><b style={{ width: `${pathPercent}%` }} /></i>
                </div>
              </header>
              <div className="atlasPathSteps">
                {concepts.map((concept, index) => {
                  const completed = progress.completedIds.includes(concept.id);
                  const bookmarked = progress.bookmarkedIds.includes(concept.id);
                  return (
                    <button
                      className={completed ? 'complete' : ''}
                      key={concept.id}
                      onClick={() => onOpenConcept(concept.id)}
                      type="button"
                    >
                      <span>
                        {completed ? <CheckCircle2 size={16} /> : index + 1}
                      </span>
                      <small>Step {index + 1}</small>
                      <strong>{concept.title}</strong>
                      {bookmarked && <BookmarkCheck size={15} />}
                    </button>
                  );
                })}
              </div>
              <button
                className="atlasPathContinue"
                onClick={() => onOpenConcept(nextConcept.id)}
                type="button"
              >
                {completedCount === concepts.length ? 'Review path' : 'Continue path'}
                <ArrowRight size={17} />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ConceptCheck({
  completed,
  concept,
  onComplete,
}: {
  completed: boolean;
  concept: ElectricalConcept;
  onComplete: (conceptId: string) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { correctIndex, options } = useMemo(() => {
    const conceptIndex = electricalConcepts.findIndex(
      (candidate) => candidate.id === concept.id,
    );
    const correctAnswer = concept.principles[0];
    const answers = [
      correctAnswer,
      electricalConcepts[
        (conceptIndex + 7) % electricalConcepts.length
      ].principles[0],
      electricalConcepts[
        (conceptIndex + 13) % electricalConcepts.length
      ].principles[0],
    ];
    const rotation = conceptIndex % answers.length;
    const rotatedAnswers = [
      ...answers.slice(rotation),
      ...answers.slice(0, rotation),
    ];

    return {
      correctIndex: rotatedAnswers.indexOf(correctAnswer),
      options: rotatedAnswers,
    };
  }, [concept]);
  const answered = selectedIndex !== null;
  const correct = selectedIndex === correctIndex;

  function selectOption(index: number) {
    if (answered) {
      return;
    }
    setSelectedIndex(index);
    if (index === correctIndex) {
      onComplete(concept.id);
    }
  }

  return (
    <section className="atlasConceptCheck" aria-labelledby="atlas-check-title">
      <header>
        <span className={completed ? 'complete' : ''}>
          {completed ? <CheckCircle2 size={21} /> : <BookOpenCheck size={21} />}
        </span>
        <div>
          <p className="eyebrow">Knowledge check</p>
          <h2 id="atlas-check-title">Which statement belongs to this concept?</h2>
          <p>Choose the principle that best matches {concept.title}.</p>
        </div>
        {completed && <em>Concept checked</em>}
      </header>
      <div className="atlasCheckOptions">
        {options.map((option, index) => {
          const revealCorrect = answered && index === correctIndex;
          const selectedWrong =
            answered && index === selectedIndex && index !== correctIndex;
          return (
            <button
              className={
                revealCorrect ? 'correct' : selectedWrong ? 'wrong' : ''
              }
              disabled={answered}
              key={option}
              onClick={() => selectOption(index)}
              type="button"
            >
              <span>{String.fromCharCode(65 + index)}</span>
              <strong>{option}</strong>
              {revealCorrect && <CheckCircle2 size={19} />}
              {selectedWrong && <XCircle size={19} />}
            </button>
          );
        })}
      </div>
      {answered && (
        <footer className={correct ? 'correct' : 'wrong'} aria-live="polite">
          <span>
            {correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          </span>
          <div>
            <strong>{correct ? 'Concept connected' : 'Not quite yet'}</strong>
            <p>
              {correct
                ? 'This concept is now checked in your Atlas progress.'
                : 'Compare each statement with the model above, then try once more.'}
            </p>
          </div>
          {!correct && (
            <button onClick={() => setSelectedIndex(null)} type="button">
              <RotateCcw size={16} />
              Try again
            </button>
          )}
        </footer>
      )}
    </section>
  );
}

function AtlasOverview({
  bestScores,
  onOpenConcept,
  onOpenGame,
  progress,
}: {
  bestScores: AtlasBestScores;
  onOpenConcept: (conceptId: string) => void;
  onOpenGame: (gameId: string) => void;
  progress: AtlasProgress;
}) {
  const [domain, setDomain] = useState<AtlasDomainId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [workspaceView, setWorkspaceView] = useState<
    'explore' | 'map' | 'paths'
  >('explore');
  const filteredConcepts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return electricalConcepts.filter(
      (concept) =>
        (domain === 'all' || concept.domain === domain) &&
        (!showSavedOnly || progress.bookmarkedIds.includes(concept.id)) &&
        (!normalizedQuery ||
          [
            concept.title,
            concept.summary,
            concept.keywords,
            concept.unit,
            ...concept.applications,
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)),
    );
  }, [domain, progress.bookmarkedIds, query, showSavedOnly]);

  return (
    <section className="atlasOverview" aria-label="Electrical Engineering Atlas">
      <header className="atlasOverviewHeader">
        <div>
          <p className="eyebrow">ZyloXP / EE Atlas</p>
          <h1>Electrical Engineering Atlas</h1>
          <p>
            Explore connected concepts, tune live engineering models, and turn
            the theory into a scored challenge.
          </p>
        </div>
        <span>
          <Atom size={18} />
          {atlasDomains.length} connected domains
        </span>
      </header>

      <section className="atlasSignalBand" aria-label="Atlas coverage">
        <div>
          <Atom size={24} />
          <span>
            <small>Concept modules</small>
            <strong>{electricalConcepts.length}</strong>
          </span>
        </div>
        <div>
          <CircuitBoard size={24} />
          <span>
            <small>Interactive diagrams</small>
            <strong>{new Set(electricalConcepts.map((concept) => concept.diagramKind)).size}</strong>
          </span>
        </div>
        <div>
          <Gamepad2 size={24} />
          <span>
            <small>Playable challenges</small>
            <strong>{engineeringGames.length}</strong>
          </span>
        </div>
        <div>
          <BookOpenCheck size={24} />
          <span>
            <small>Engineering domains</small>
            <strong>{atlasDomains.length}</strong>
          </span>
        </div>
      </section>

      <AtlasProgressBand
        onOpenConcept={onOpenConcept}
        progress={progress}
      />

      <nav className="atlasWorkspaceTabs" aria-label="Atlas views">
        <button
          aria-pressed={workspaceView === 'explore'}
          className={workspaceView === 'explore' ? 'active' : ''}
          onClick={() => setWorkspaceView('explore')}
          type="button"
        >
          <BookOpenCheck size={18} />
          Explore
        </button>
        <button
          aria-pressed={workspaceView === 'map'}
          className={workspaceView === 'map' ? 'active' : ''}
          onClick={() => setWorkspaceView('map')}
          type="button"
        >
          <Map size={18} />
          Concept map
        </button>
        <button
          aria-pressed={workspaceView === 'paths'}
          className={workspaceView === 'paths' ? 'active' : ''}
          onClick={() => setWorkspaceView('paths')}
          type="button"
        >
          <Route size={18} />
          Learning paths
        </button>
      </nav>

      {workspaceView === 'explore' && (
        <>
      <section className="atlasGameShelf" aria-labelledby="atlas-games-title">
        <header className="atlasSectionHeader">
          <div>
            <p className="eyebrow">Playground</p>
            <h2 id="atlas-games-title">Learn by tuning the system</h2>
            <p>Short scored challenges turn equations into decisions.</p>
          </div>
          <span>
            <Gamepad2 size={18} />
            {engineeringGames.length} games
          </span>
        </header>
        <div className="atlasGameGrid">
          {engineeringGames.map((game) => {
            const visual = domainVisuals[game.domain];
            const GameIcon =
              game.id === 'wave-match'
                ? Waves
                : game.id === 'logic-lock'
                  ? Binary
                  : game.id === 'power-target'
                    ? Zap
                    : game.id === 'transient-trace'
                      ? Timer
                      : game.id === 'pid-tune'
                        ? Target
                        : game.id === 'relay-coordination'
                          ? ShieldCheck
                          : Radio;
            return (
              <article className={`atlasGameCard ${visual.tone}`} key={game.id}>
                <header>
                  <span>
                    <GameIcon size={22} />
                  </span>
                  <em>{game.duration}</em>
                </header>
                <div>
                  <small>{game.skill}</small>
                  <h3>{game.title}</h3>
                  <p>{game.description}</p>
                </div>
                <footer>
                  <span>
                    {bestScores[game.id] !== undefined ? (
                      <>
                        <Trophy size={15} />
                        Best {bestScores[game.id]}%
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        New challenge
                      </>
                    )}
                  </span>
                  <button onClick={() => onOpenGame(game.id)} type="button">
                    <Play size={16} />
                    Play
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      </section>

      <section className="atlasLibrary" aria-labelledby="atlas-library-title">
        <header className="atlasSectionHeader">
          <div>
            <p className="eyebrow">Concept database</p>
            <h2 id="atlas-library-title">Browse the concept library</h2>
            <p>Filter by domain or search for a component, equation, or application.</p>
          </div>
          <strong>{filteredConcepts.length} shown</strong>
        </header>

        <div className="atlasToolbar">
          <label className="atlasSearch">
            <Search size={18} />
            <input
              aria-label="Search electrical engineering concepts"
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search concepts, equations, or applications"
              type="search"
              value={query}
            />
          </label>
          <div className="atlasDomainFilters" aria-label="Filter Atlas by domain">
            <button
              aria-pressed={showSavedOnly}
              className={showSavedOnly ? 'active saved' : 'saved'}
              onClick={() => setShowSavedOnly((current) => !current)}
              type="button"
            >
              {showSavedOnly ? (
                <BookmarkCheck size={15} />
              ) : (
                <Bookmark size={15} />
              )}
              Saved
              <span>{progress.bookmarkedIds.length}</span>
            </button>
            <button
              aria-pressed={domain === 'all'}
              className={domain === 'all' ? 'active' : ''}
              onClick={() => setDomain('all')}
              type="button"
            >
              All domains
              <span>{electricalConcepts.length}</span>
            </button>
            {atlasDomains.map((domainItem) => {
              const Icon = domainVisuals[domainItem.id].icon;
              const count = electricalConcepts.filter(
                (concept) => concept.domain === domainItem.id,
              ).length;
              return (
                <button
                  aria-pressed={domain === domainItem.id}
                  className={domain === domainItem.id ? 'active' : ''}
                  key={domainItem.id}
                  onClick={() => setDomain(domainItem.id)}
                  type="button"
                >
                  <Icon size={15} />
                  {domainItem.label}
                  <span>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="atlasConceptGrid">
          {filteredConcepts.map((concept) => {
            const domainRecord = atlasDomains.find(
              (domainItem) => domainItem.id === concept.domain,
            );
            const visual = domainVisuals[concept.domain];
            const Icon = visual.icon;
            return (
              <button
                className={`atlasConceptCard ${visual.tone}`}
                key={concept.id}
                onClick={() => onOpenConcept(concept.id)}
                type="button"
              >
                <header>
                  <span>
                    <Icon size={18} />
                  </span>
                  <small>{domainRecord?.label}</small>
                  <em>{concept.level}</em>
                </header>
                <div>
                  <p>{concept.unit}</p>
                  <h3>{concept.title}</h3>
                  <span>{concept.summary}</span>
                </div>
                <footer>
                  <code>{concept.equation}</code>
                  <span>
                    {progress.completedIds.includes(concept.id) ? (
                      <>
                        <CheckCircle2 size={16} />
                        Checked
                      </>
                    ) : progress.bookmarkedIds.includes(concept.id) ? (
                      <>
                        <BookmarkCheck size={16} />
                        Saved
                      </>
                    ) : (
                      'Explore'
                    )}
                    <ArrowRight size={16} />
                  </span>
                </footer>
              </button>
            );
          })}
        </div>

        {filteredConcepts.length === 0 && (
          <div className="atlasEmpty">
            <Search size={24} />
            <strong>No concept matches that search</strong>
            <span>Clear the filter or try a component, law, or application.</span>
            <button
              onClick={() => {
                setDomain('all');
                setQuery('');
                setShowSavedOnly(false);
              }}
              type="button"
            >
              Reset Atlas
            </button>
          </div>
        )}
      </section>
        </>
      )}

      {workspaceView === 'map' && (
        <AtlasConceptMap
          onOpenConcept={onOpenConcept}
          progress={progress}
        />
      )}

      {workspaceView === 'paths' && (
        <AtlasLearningPathView
          onOpenConcept={onOpenConcept}
          progress={progress}
        />
      )}
    </section>
  );
}

function ConceptPage({
  bookmarked,
  completed,
  concept,
  onBack,
  onComplete,
  onOpenConcept,
  onOpenGame,
  onOpenLab,
  onToggleBookmark,
}: {
  bookmarked: boolean;
  completed: boolean;
  concept: ElectricalConcept;
  onBack: () => void;
  onComplete: (conceptId: string) => void;
  onOpenConcept: (conceptId: string) => void;
  onOpenGame: (gameId: string) => void;
  onOpenLab: (labId: string) => void;
  onToggleBookmark: (conceptId: string) => void;
}) {
  const domain = atlasDomains.find((item) => item.id === concept.domain);
  const visual = domainVisuals[concept.domain];
  const DomainIcon = visual.icon;
  const relatedConcepts = electricalConcepts
    .filter(
      (candidate) =>
        candidate.domain === concept.domain && candidate.id !== concept.id,
    )
    .slice(0, 3);
  const relatedGame = engineeringGames.find((game) =>
    game.conceptIds.includes(concept.id),
  );
  const relatedLab = ATLAS_LAB_LINKS[concept.id];

  return (
    <section className="atlasDetailPage" aria-label={concept.title}>
      <header className="atlasDetailHeader">
        <div className="atlasDetailActions">
          <button
            className="atlasBackButton compactHeaderBack"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft size={17} />
            Back to Atlas
          </button>
          <button
            aria-pressed={bookmarked}
            className={`atlasBookmarkButton ${bookmarked ? 'active' : ''}`}
            onClick={() => onToggleBookmark(concept.id)}
            type="button"
          >
            {bookmarked ? (
              <BookmarkCheck size={17} />
            ) : (
              <Bookmark size={17} />
            )}
            {bookmarked ? 'Saved' : 'Save concept'}
          </button>
        </div>
        <div className={`atlasDetailTitle ${visual.tone}`}>
          <span>
            <DomainIcon size={26} />
          </span>
          <div>
            <p className="eyebrow">{domain?.label} / {concept.unit}</p>
            <h1>{concept.title}</h1>
            <p>{concept.summary}</p>
          </div>
          <div className="atlasDetailBadges">
            {completed && (
              <span>
                <CheckCircle2 size={15} />
                Checked
              </span>
            )}
            <em>{concept.level}</em>
          </div>
        </div>
        <div className="atlasEquationBand">
          <span>Governing relationship</span>
          <strong>{concept.equation}</strong>
          <small>{concept.interactiveLabel}</small>
        </div>
      </header>

      <InteractiveConceptDiagram kind={concept.diagramKind} />

      {relatedLab && (
        <section className="atlasLabHandoff" aria-label="Related instrument lab">
          <span>
            <Gauge size={20} />
          </span>
          <div>
            <p className="eyebrow">Lab evidence</p>
            <h2>{relatedLab.label}</h2>
            <small>{concept.equation}</small>
          </div>
          <button onClick={() => onOpenLab(relatedLab.id)} type="button">
            Open lab
            <ArrowRight size={17} />
          </button>
        </section>
      )}

      <ConceptCheck
        completed={completed}
        concept={concept}
        key={concept.id}
        onComplete={onComplete}
      />

      <section className="atlasStudyGrid" aria-label="Concept study notes">
        <article>
          <span className="atlasStudyIcon">
            <Lightbulb size={20} />
          </span>
          <p className="eyebrow">Core reasoning</p>
          <h2>What to notice</h2>
          <ul>
            {concept.principles.map((principle) => (
              <li key={principle}>
                <CheckCircle2 size={17} />
                <span>{principle}</span>
              </li>
            ))}
          </ul>
        </article>
        <article>
          <span className="atlasStudyIcon application">
            <CircuitBoard size={20} />
          </span>
          <p className="eyebrow">Where it appears</p>
          <h2>Engineering applications</h2>
          <div className="atlasApplicationList">
            {concept.applications.map((application) => (
              <span key={application}>{application}</span>
            ))}
          </div>
          <p>
            Change the live controls above, predict the result first, and then
            compare the instrument readout with the governing relationship.
          </p>
        </article>
        {relatedGame && (
          <article className="atlasRelatedGame">
            <span className="atlasStudyIcon game">
              <Gamepad2 size={20} />
            </span>
            <p className="eyebrow">Practice by playing</p>
            <h2>{relatedGame.title}</h2>
            <p>{relatedGame.description}</p>
            <button onClick={() => onOpenGame(relatedGame.id)} type="button">
              <Play size={16} />
              Play challenge
            </button>
          </article>
        )}
      </section>

      <section className="atlasRelatedSection" aria-labelledby="related-concepts-title">
        <header>
          <div>
            <p className="eyebrow">Keep exploring</p>
            <h2 id="related-concepts-title">Related concepts</h2>
          </div>
        </header>
        <div>
          {relatedConcepts.map((related) => (
            <button key={related.id} onClick={() => onOpenConcept(related.id)} type="button">
              <span>{related.unit}</span>
              <strong>{related.title}</strong>
              <small>{related.equation}</small>
              <ArrowRight size={17} />
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}

function GameFrame({
  bestScore,
  children,
  game,
  onBack,
}: {
  bestScore: number | undefined;
  children: ReactNode;
  game: EngineeringGame;
  onBack: () => void;
}) {
  const domain = atlasDomains.find((item) => item.id === game.domain);
  const visual = domainVisuals[game.domain];
  const DomainIcon = visual.icon;

  return (
    <section className="atlasGamePage" aria-label={game.title}>
      <header className="atlasGameHeader">
        <button
          className="atlasBackButton compactHeaderBack"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          Back to Atlas
        </button>
        <div className={`atlasGameTitle ${visual.tone}`}>
          <span>
            <DomainIcon size={25} />
          </span>
          <div>
            <p className="eyebrow">{domain?.label} / Learning game</p>
            <h1>{game.title}</h1>
            <p>{game.description}</p>
          </div>
          <aside>
            <Timer size={17} />
            {game.duration}
            <strong>
              {bestScore === undefined ? 'No score yet' : `Best ${bestScore}%`}
            </strong>
          </aside>
        </div>
      </header>
      {children}
    </section>
  );
}

function ScorePanel({
  feedback,
  onNext,
  score,
}: {
  feedback: string;
  onNext: () => void;
  score: number | null;
}) {
  if (score === null) {
    return null;
  }

  return (
    <aside className={`atlasScorePanel ${score >= 80 ? 'strong' : score >= 55 ? 'close' : 'retry'}`} aria-live="polite">
      <span>
        {score >= 80 ? <Trophy size={22} /> : score >= 55 ? <Target size={22} /> : <RotateCcw size={22} />}
      </span>
      <div>
        <small>Round score</small>
        <strong>{score}%</strong>
        <p>{feedback}</p>
      </div>
      <button onClick={onNext} type="button">
        Next challenge
        <ArrowRight size={16} />
      </button>
    </aside>
  );
}

function WaveMatchGame({
  onScore,
}: {
  onScore: (score: number) => void;
}) {
  const targets = [
    { amplitude: 7, frequency: 3, phase: 45 },
    { amplitude: 4, frequency: 5, phase: -60 },
    { amplitude: 9, frequency: 2, phase: 120 },
  ];
  const [round, setRound] = useState(0);
  const [amplitude, setAmplitude] = useState(5);
  const [frequency, setFrequency] = useState(2);
  const [phase, setPhase] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const target = targets[round % targets.length];

  function checkMatch() {
    const amplitudeError = Math.abs(amplitude - target.amplitude) / 9;
    const frequencyError = Math.abs(frequency - target.frequency) / 6;
    const rawPhaseError = Math.abs(phase - target.phase) % 360;
    const phaseError = Math.min(rawPhaseError, 360 - rawPhaseError) / 180;
    const nextScore = Math.max(
      0,
      Math.round(
        100 -
          (amplitudeError * 0.34 +
            frequencyError * 0.36 +
            phaseError * 0.3) *
            100,
      ),
    );
    setScore(nextScore);
    onScore(nextScore);
  }

  function nextRound() {
    setRound((current) => (current + 1) % targets.length);
    setAmplitude(5);
    setFrequency(2);
    setPhase(0);
    setScore(null);
  }

  return (
    <div className="atlasGameWorkspace">
      <section className="atlasGameInstrument">
        <header>
          <span>Round {round + 1} / {targets.length}</span>
          <strong>Overlay your signal on the target</strong>
          <em>Solid = target · Dotted = yours</em>
        </header>
        <svg aria-label="Target and adjustable waveform" viewBox="0 0 760 280">
          <path className="atlasGridLine" d="M45 65H715M45 140H715M45 215H715M155 35V235M265 35V235M375 35V235M485 35V235M595 35V235M705 35V235" />
          <path className="atlasTargetWave" d={makeWavePath({ amplitude: target.amplitude * 9, cycles: target.frequency / 2, phase: target.phase, width: 660, x: 50, y: 140 })} />
          <path className="atlasPlayerWave" d={makeWavePath({ amplitude: amplitude * 9, cycles: frequency / 2, phase, width: 660, x: 50, y: 140 })} />
          <text className="atlasSvgLabel" x="50" y="260">ALIGN AMPLITUDE · FREQUENCY · PHASE</text>
        </svg>
      </section>
      <aside className="atlasGameControls">
        <p className="eyebrow">Signal generator</p>
        <h2>Tune your waveform</h2>
        <RangeControl label="Amplitude" max={10} min={1} onChange={(value) => { setAmplitude(value); setScore(null); }} step={1} value={amplitude} valueLabel={`${amplitude} V`} />
        <RangeControl label="Frequency" max={8} min={1} onChange={(value) => { setFrequency(value); setScore(null); }} step={1} value={frequency} valueLabel={`${frequency} kHz`} />
        <RangeControl label="Phase" max={180} min={-180} onChange={(value) => { setPhase(value); setScore(null); }} step={5} value={phase} valueLabel={`${phase}°`} />
        <button className="atlasCheckButton" onClick={checkMatch} type="button">
          <Target size={17} />
          Check match
        </button>
      </aside>
      <ScorePanel
        feedback={
          score !== null && score >= 80
            ? 'Strong match. The two traces describe nearly the same sinusoid.'
            : 'Use zero crossings for phase, peak height for amplitude, and cycle count for frequency.'
        }
        onNext={nextRound}
        score={score}
      />
    </div>
  );
}

const logicGates = {
  AND: [0, 0, 0, 1],
  NAND: [1, 1, 1, 0],
  NOR: [1, 0, 0, 0],
  OR: [0, 1, 1, 1],
  XNOR: [1, 0, 0, 1],
  XOR: [0, 1, 1, 0],
} as const;

function LogicLockGame({
  onScore,
}: {
  onScore: (score: number) => void;
}) {
  const gateNames = Object.keys(logicGates) as Array<keyof typeof logicGates>;
  const targets: Array<keyof typeof logicGates> = ['XOR', 'NAND', 'XNOR'];
  const [round, setRound] = useState(0);
  const [selectedGate, setSelectedGate] = useState<keyof typeof logicGates | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const targetGate = targets[round % targets.length];
  const targetPattern = logicGates[targetGate];

  function checkGate() {
    if (!selectedGate) {
      return;
    }
    const matches = logicGates[selectedGate].filter(
      (output, index) => output === targetPattern[index],
    ).length;
    const nextScore = Math.round((matches / 4) * 100);
    setScore(nextScore);
    onScore(nextScore);
  }

  function nextRound() {
    setRound((current) => (current + 1) % targets.length);
    setSelectedGate(null);
    setScore(null);
  }

  return (
    <div className="atlasGameWorkspace logic">
      <section className="logicChallenge">
        <header>
          <span>Hardware lock {round + 1} / {targets.length}</span>
          <strong>Match this target truth table</strong>
        </header>
        <table>
          <thead>
            <tr><th>A</th><th>B</th><th>Target Y</th><th>Your Y</th></tr>
          </thead>
          <tbody>
            {[[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b], index) => (
              <tr key={`${a}-${b}`}>
                <td>{a}</td>
                <td>{b}</td>
                <td><strong>{targetPattern[index]}</strong></td>
                <td className={selectedGate && logicGates[selectedGate][index] === targetPattern[index] ? 'match' : ''}>
                  {selectedGate ? logicGates[selectedGate][index] : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <aside className="logicGateRack">
        <p className="eyebrow">Gate rack</p>
        <h2>Choose the logic function</h2>
        <div>
          {gateNames.map((gateName) => (
            <button
              aria-pressed={selectedGate === gateName}
              className={selectedGate === gateName ? 'active' : ''}
              key={gateName}
              onClick={() => {
                setSelectedGate(gateName);
                setScore(null);
              }}
              type="button"
            >
              <span>{gateName}</span>
              <small>{logicGates[gateName].join('')}</small>
            </button>
          ))}
        </div>
        <button className="atlasCheckButton" disabled={!selectedGate} onClick={checkGate} type="button">
          <ShieldCheck size={17} />
          Test lock
        </button>
      </aside>
      <ScorePanel
        feedback={
          score === 100
            ? `${selectedGate} matches every row. Lock opened.`
            : 'Compare the rows where only one input is high; they separate several common gates.'
        }
        onNext={nextRound}
        score={score}
      />
    </div>
  );
}

function PowerTargetGame({
  onScore,
}: {
  onScore: (score: number) => void;
}) {
  const targets = [24, 36, 18];
  const [round, setRound] = useState(0);
  const [voltage, setVoltage] = useState(12);
  const [resistance, setResistance] = useState(8);
  const [score, setScore] = useState<number | null>(null);
  const targetPower = targets[round % targets.length];
  const current = voltage / resistance;
  const power = voltage * current;
  const safe = current <= 4 && power <= 60;

  function checkPower() {
    const relativeError = Math.abs(power - targetPower) / targetPower;
    const nextScore = Math.max(
      0,
      Math.round(100 - relativeError * 120 - (safe ? 0 : 35)),
    );
    setScore(nextScore);
    onScore(nextScore);
  }

  function nextRound() {
    setRound((current) => (current + 1) % targets.length);
    setVoltage(12);
    setResistance(8);
    setScore(null);
  }

  return (
    <div className="atlasGameWorkspace power">
      <section className="powerTargetBench">
        <header>
          <span>Target load power</span>
          <strong>{targetPower} W</strong>
          <em>Keep current at or below 4 A</em>
        </header>
        <div className="powerTargetMeter">
          <span style={{ width: `${Math.min(100, (power / 60) * 100)}%` }} />
          <i style={{ left: `${(targetPower / 60) * 100}%` }} />
        </div>
        <div className="powerTargetReadouts">
          <div><small>Voltage</small><strong>{voltage} V</strong></div>
          <div><small>Current</small><strong>{formatNumber(current)} A</strong></div>
          <div><small>Power</small><strong>{formatNumber(power)} W</strong></div>
          <div className={safe ? 'safe' : 'danger'}><small>Limit</small><strong>{safe ? 'Safe' : 'Exceeded'}</strong></div>
        </div>
      </section>
      <aside className="atlasGameControls">
        <p className="eyebrow">Source and load</p>
        <h2>Hit the power target</h2>
        <RangeControl label="Source voltage" max={24} min={3} onChange={(value) => { setVoltage(value); setScore(null); }} step={1} value={voltage} valueLabel={`${voltage} V`} />
        <RangeControl label="Load resistance" max={30} min={2} onChange={(value) => { setResistance(value); setScore(null); }} step={1} value={resistance} valueLabel={`${resistance} Ω`} />
        <button className="atlasCheckButton" onClick={checkPower} type="button">
          <Gauge size={17} />
          Test load
        </button>
      </aside>
      <ScorePanel
        feedback={
          score !== null && score >= 80
            ? 'The load is close to target and remains inside the current limit.'
            : 'Use P = V²/R. Voltage has a squared effect, while more resistance lowers power.'
        }
        onNext={nextRound}
        score={score}
      />
    </div>
  );
}

function TransientTraceGame({
  onScore,
}: {
  onScore: (score: number) => void;
}) {
  const scenarios = [
    {
      maxPeakCurrent: 2,
      sourceVoltage: 12,
      targetTimeConstant: 220,
      title: 'Sensor power-on filter',
    },
    {
      maxPeakCurrent: 1,
      sourceVoltage: 5,
      targetTimeConstant: 470,
      title: 'Reset-delay network',
    },
    {
      maxPeakCurrent: 1.2,
      sourceVoltage: 24,
      targetTimeConstant: 1000,
      title: 'Relay debounce stage',
    },
  ];
  const [round, setRound] = useState(0);
  const [resistance, setResistance] = useState(10);
  const [capacitance, setCapacitance] = useState(10);
  const [score, setScore] = useState<number | null>(null);
  const scenario = scenarios[round % scenarios.length];
  const timeConstant = resistance * capacitance;
  const peakCurrent = scenario.sourceVoltage / resistance;
  const timeWindow = scenario.targetTimeConstant * 5;
  const targetMarkerX =
    70 + (scenario.targetTimeConstant / timeWindow) * 620;
  const playerMarkerX =
    70 + Math.min(1, timeConstant / timeWindow) * 620;
  const playerMarkerY =
    230 -
    (1 - Math.exp(-Math.min(timeConstant, timeWindow) / timeConstant)) * 150;
  const timeError =
    Math.abs(timeConstant - scenario.targetTimeConstant) /
    scenario.targetTimeConstant;
  const currentSafe = peakCurrent <= scenario.maxPeakCurrent;

  function checkTrace() {
    const currentOverage = Math.max(
      0,
      (peakCurrent - scenario.maxPeakCurrent) / scenario.maxPeakCurrent,
    );
    const nextScore = Math.max(
      0,
      Math.round(100 - timeError * 150 - currentOverage * 45),
    );
    setScore(nextScore);
    onScore(nextScore);
  }

  function nextRound() {
    setRound((current) => (current + 1) % scenarios.length);
    setResistance(10);
    setCapacitance(10);
    setScore(null);
  }

  return (
    <div className="atlasGameWorkspace transient">
      <section className="atlasGameInstrument transientScope">
        <header>
          <span>
            Circuit {round + 1} / {scenarios.length} · {scenario.title}
          </span>
          <strong>Match the target 63.2% charge time</strong>
          <em>Solid = target · Dotted = your RC response</em>
        </header>
        <svg
          aria-label="Target and adjustable RC charging traces"
          viewBox="0 0 760 300"
        >
          <path
            className="atlasGridLine"
            d="M70 80H690M70 155H690M70 230H690M194 45V245M318 45V245M442 45V245M566 45V245M690 45V245"
          />
          <path className="atlasAxis" d="M70 45V230H710" />
          <path
            className="atlasTransientTarget"
            d={makeRcChargePath({
              timeConstant: scenario.targetTimeConstant,
              timeWindow,
            })}
          />
          <path
            className="atlasTransientPlayer"
            d={makeRcChargePath({ timeConstant, timeWindow })}
          />
          <path
            className="atlasTransientTargetMarker"
            d={`M${targetMarkerX.toFixed(2)} 58V230`}
          />
          <path
            className="atlasTransientPlayerMarker"
            d={`M${playerMarkerX.toFixed(2)} 58V230`}
          />
          <circle
            className="atlasTransientChargeDot"
            cx={playerMarkerX}
            cy={playerMarkerY}
            r="8"
          />
          <text className="atlasSvgLabel" x="18" y="84">
            V
          </text>
          <text className="atlasSvgLabel" x="672" y="265">
            TIME
          </text>
          <text className="atlasSvgAccent" x="82" y="66">
            100%
          </text>
          <text className="atlasSvgLabel" x="82" y="151">
            63.2%
          </text>
          <text
            className="atlasSvgAccent"
            textAnchor="middle"
            x={targetMarkerX}
            y="278"
          >
            TARGET {scenario.targetTimeConstant} ms
          </text>
          <text
            className={
              timeError <= 0.05 ? 'atlasSvgAccent' : 'atlasSvgWarning'
            }
            textAnchor="middle"
            x={playerMarkerX}
            y="36"
          >
            YOUR tau {timeConstant} ms
          </text>
        </svg>
        <div className="transientReadouts">
          <div>
            <small>Time constant</small>
            <strong>{timeConstant} ms</strong>
          </div>
          <div>
            <small>Peak current</small>
            <strong>{formatNumber(peakCurrent)} mA</strong>
          </div>
          <div className={currentSafe ? 'safe' : 'danger'}>
            <small>Source limit</small>
            <strong>{currentSafe ? 'Safe' : 'Exceeded'}</strong>
          </div>
        </div>
      </section>
      <aside className="atlasGameControls">
        <p className="eyebrow">RC component bench</p>
        <h2>Tune the charge curve</h2>
        <RangeControl
          label="Resistance"
          max={100}
          min={1}
          onChange={(value) => {
            setResistance(value);
            setScore(null);
          }}
          showSteppers
          step={1}
          value={resistance}
          valueLabel={`${resistance} kOhm`}
        />
        <RangeControl
          label="Capacitance"
          max={100}
          min={1}
          onChange={(value) => {
            setCapacitance(value);
            setScore(null);
          }}
          showSteppers
          step={1}
          value={capacitance}
          valueLabel={`${capacitance} uF`}
        />
        <div className="aliasRule">
          <span>Target tau</span>
          <strong>{scenario.targetTimeConstant} ms</strong>
          <small>
            Keep initial current at or below {scenario.maxPeakCurrent} mA.
            One time constant reaches 63.2% of the source voltage.
          </small>
        </div>
        <button className="atlasCheckButton" onClick={checkTrace} type="button">
          <Activity size={17} />
          Check transient
        </button>
      </aside>
      <ScorePanel
        feedback={
          score !== null && score >= 80
            ? 'The charge curve reaches 63.2% near the target time and the source current remains controlled.'
            : currentSafe
              ? 'Use tau = R x C. Adjust either component until the marker aligns with the target.'
              : 'Increase resistance to control inrush, then use capacitance to recover the target time constant.'
        }
        onNext={nextRound}
        score={score}
      />
    </div>
  );
}

function AliasEscapeGame({
  onScore,
}: {
  onScore: (score: number) => void;
}) {
  const signals = [6, 9, 13];
  const [round, setRound] = useState(0);
  const [sampleRate, setSampleRate] = useState(16);
  const [score, setScore] = useState<number | null>(null);
  const signalFrequency = signals[round % signals.length];
  const ratio = sampleRate / signalFrequency;
  const alias =
    Math.abs(signalFrequency - Math.round(signalFrequency / sampleRate) * sampleRate);
  const sampleCount = Math.max(4, Math.round(sampleRate * 1.25));
  const samples = Array.from(
    { length: sampleCount },
    (_, index) => {
      const progress = index / Math.max(1, sampleCount - 1);
      return {
        x: 45 + progress * 660,
        y:
          140 -
          Math.sin(progress * Math.PI * 2 * signalFrequency * 0.23) * 75,
      };
    },
  );

  function checkRate() {
    const safe = ratio >= 2.2;
    const efficiency = Math.max(0, 1 - Math.abs(ratio - 2.6) / 4);
    const nextScore = safe ? Math.round(70 + efficiency * 30) : Math.max(0, Math.round(ratio * 25));
    setScore(nextScore);
    onScore(nextScore);
  }

  function nextRound() {
    setRound((current) => (current + 1) % signals.length);
    setSampleRate(16);
    setScore(null);
  }

  return (
    <div className="atlasGameWorkspace alias">
      <section className="aliasScope">
        <header>
          <span>Unknown channel</span>
          <strong>{signalFrequency} kHz signal</strong>
          <em>Choose the leanest safe sample rate</em>
        </header>
        <svg aria-label="Signal and adjustable sample points" viewBox="0 0 760 280">
          <path className="atlasGridLine" d="M45 65H715M45 140H715M45 215H715M155 35V235M265 35V235M375 35V235M485 35V235M595 35V235M705 35V235" />
          <path className="atlasTargetWave" d={makeWavePath({ amplitude: 75, cycles: signalFrequency * 0.23, width: 660, x: 45, y: 140 })} />
          {samples.map((sample, index) => (
            <circle className="atlasSampleDot" cx={sample.x} cy={sample.y} key={`${sample.x}-${index}`} r="5" />
          ))}
          <text className={ratio >= 2.2 ? 'atlasSvgAccent' : 'atlasSvgWarning'} x="45" y="260">
            {ratio >= 2.2 ? `${ratio.toFixed(2)} SAMPLES / CYCLE` : `ALIAS MAY APPEAR AT ${alias.toFixed(1)} kHz`}
          </text>
        </svg>
      </section>
      <aside className="atlasGameControls">
        <p className="eyebrow">Acquisition clock</p>
        <h2>Escape aliasing</h2>
        <RangeControl label="Sample rate" max={60} min={4} onChange={(value) => { setSampleRate(value); setScore(null); }} step={1} value={sampleRate} valueLabel={`${sampleRate} kS/s`} />
        <div className="aliasRule">
          <span>Nyquist floor</span>
          <strong>{signalFrequency * 2} kS/s</strong>
          <small>Target useful margin: 2.2–3.2 samples per cycle</small>
        </div>
        <button className="atlasCheckButton" onClick={checkRate} type="button">
          <Radio size={17} />
          Capture signal
        </button>
      </aside>
      <ScorePanel
        feedback={
          score !== null && score >= 80
            ? 'Safe capture with practical margin and little wasted sample bandwidth.'
            : 'Clear twice the signal frequency, then add transition margin for a real anti-alias filter.'
        }
        onNext={nextRound}
        score={score}
      />
    </div>
  );
}

function PidTuneGame({
  onScore,
}: {
  onScore: (score: number) => void;
}) {
  const targets = [
    { maxOvershoot: 10, maxSettling: 2.8, plantTimeConstant: 1.2, title: 'Precision servo' },
    { maxOvershoot: 18, maxSettling: 1.8, plantTimeConstant: 0.8, title: 'Fast actuator' },
    { maxOvershoot: 6, maxSettling: 4, plantTimeConstant: 2.2, title: 'Thermal chamber' },
  ];
  const [round, setRound] = useState(0);
  const [proportional, setProportional] = useState(2);
  const [integral, setIntegral] = useState(0.6);
  const [derivative, setDerivative] = useState(0.5);
  const [score, setScore] = useState<number | null>(null);
  const target = targets[round % targets.length];
  const metrics = calculatePidMetrics(
    proportional,
    integral,
    derivative,
    target.plantTimeConstant,
  );
  const responsePath = makeStepResponsePath({
    ...metrics,
    width: 660,
    x: 50,
    y: 235,
  });

  function checkTuning() {
    const overshootPenalty =
      Math.max(0, metrics.overshoot - target.maxOvershoot) * 2.2;
    const settlingPenalty =
      Math.max(0, metrics.settlingTime - target.maxSettling) * 13;
    const errorPenalty = Math.max(0, metrics.steadyError - 1) * 2;
    const instabilityPenalty = metrics.stable ? 0 : 70;
    const nextScore = Math.max(
      0,
      Math.round(
        100 -
          overshootPenalty -
          settlingPenalty -
          errorPenalty -
          instabilityPenalty,
      ),
    );
    setScore(nextScore);
    onScore(nextScore);
  }

  function nextRound() {
    setRound((current) => (current + 1) % targets.length);
    setProportional(2);
    setIntegral(0.6);
    setDerivative(0.5);
    setScore(null);
  }

  return (
    <div className="atlasGameWorkspace">
      <section className="atlasGameInstrument">
        <header>
          <span>Plant {round + 1} / {targets.length} · {target.title}</span>
          <strong>Meet the response envelope</strong>
          <em>
            Overshoot ≤ {target.maxOvershoot}% · Settling ≤ {target.maxSettling} s
          </em>
        </header>
        <svg aria-label="PID tuning target and response" viewBox="0 0 760 280">
          <path className="atlasGridLine" d="M50 75H710M50 115H710M50 155H710M50 195H710M50 235H710M160 35V245M270 35V245M380 35V245M490 35V245M600 35V245M710 35V245" />
          <path className="atlasAxis" d="M50 35V245H715" />
          <path className="atlasSetpoint" d="M50 115H710" />
          <path className={metrics.stable ? 'atlasControlResponse' : 'atlasControlResponse unstable'} d={responsePath} />
          <text className="atlasSvgLabel" x="58" y="104">TARGET</text>
          <text className="atlasSvgAccent" x="430" y="260">
            {formatNumber(metrics.overshoot, 1)}% OS · {formatNumber(metrics.settlingTime)} s SETTLE
          </text>
        </svg>
      </section>
      <aside className="atlasGameControls">
        <p className="eyebrow">Controller rack</p>
        <h2>Tune Kp, Ki, and Kd</h2>
        <RangeControl label="Proportional Kp" max={8} min={0.2} onChange={(value) => { setProportional(value); setScore(null); }} step={0.1} value={proportional} valueLabel={proportional.toFixed(1)} />
        <RangeControl label="Integral Ki" max={4} min={0} onChange={(value) => { setIntegral(value); setScore(null); }} step={0.1} value={integral} valueLabel={integral.toFixed(1)} />
        <RangeControl label="Derivative Kd" max={3} min={0} onChange={(value) => { setDerivative(value); setScore(null); }} step={0.1} value={derivative} valueLabel={derivative.toFixed(1)} />
        <button className="atlasCheckButton" onClick={checkTuning} type="button">
          <Target size={17} />
          Test response
        </button>
      </aside>
      <ScorePanel
        feedback={
          score !== null && score >= 80
            ? 'The loop settles inside the target envelope with useful damping.'
            : 'Use Kp for speed, add Kd to control overshoot, then use enough Ki to remove offset.'
        }
        onNext={nextRound}
        score={score}
      />
    </div>
  );
}

function RelayCoordinationGame({
  onScore,
}: {
  onScore: (score: number) => void;
}) {
  const scenarios = [
    { backupTime: 1.4, maxLoad: 650, minFault: 5200, title: 'Motor feeder' },
    { backupTime: 1.1, maxLoad: 420, minFault: 3600, title: 'Panel branch' },
    { backupTime: 1.8, maxLoad: 900, minFault: 7800, title: 'Process bus' },
  ];
  const [round, setRound] = useState(0);
  const [pickupCurrent, setPickupCurrent] = useState(1200);
  const [timeMultiplier, setTimeMultiplier] = useState(0.25);
  const [score, setScore] = useState<number | null>(null);
  const scenario = scenarios[round % scenarios.length];
  const relay = calculateRelayTrip(
    scenario.minFault,
    pickupCurrent,
    timeMultiplier,
  );
  const loadMargin = pickupCurrent / scenario.maxLoad;
  const coordinationMargin = scenario.backupTime - relay.tripTime;
  const secure = loadMargin >= 1.25;
  const sensitive = relay.multiple >= 1.5;
  const selective = coordinationMargin >= 0.3 && relay.tripTime >= 0.12;

  function checkCoordination() {
    const loadPenalty = Math.max(0, 1.25 - loadMargin) * 90;
    const sensitivityPenalty = Math.max(0, 1.5 - relay.multiple) * 40;
    const selectivityPenalty =
      Math.max(0, 0.3 - coordinationMargin) * 300 +
      Math.max(0, 0.12 - relay.tripTime) * 100;
    const nextScore = Math.max(
      0,
      Math.round(100 - loadPenalty - sensitivityPenalty - selectivityPenalty),
    );
    setScore(nextScore);
    onScore(nextScore);
  }

  function nextRound() {
    setRound((current) => (current + 1) % scenarios.length);
    setPickupCurrent(1200);
    setTimeMultiplier(0.25);
    setScore(null);
  }

  return (
    <div className="atlasGameWorkspace">
      <section className="atlasGameInstrument">
        <header>
          <span>Feeder {round + 1} / {scenarios.length} · {scenario.title}</span>
          <strong>Coordinate the downstream relay</strong>
          <em>
            Load {scenario.maxLoad} A · Minimum fault {formatNumber(scenario.minFault / 1000)} kA · Backup {scenario.backupTime} s
          </em>
        </header>
        <svg aria-label="Relay coordination challenge" viewBox="0 0 760 280">
          <circle className="atlasSource" cx="82" cy="140" r="42" />
          <text className="atlasSvgLabel" textAnchor="middle" x="82" y="136">GRID</text>
          <path className="atlasWire" d="M124 140H215M285 140H465M535 140H680" />
          <rect className="atlasBreaker" height="78" rx="8" width="70" x="215" y="101" />
          <path className="atlasSwitchBlade" d="M230 154L270 120" />
          <rect className={secure && sensitive && selective ? 'atlasBreaker coordinated' : 'atlasBreaker'} height="78" rx="8" width="70" x="465" y="101" />
          <path className="atlasSwitchBlade" d="M480 154L520 120" />
          <rect className="atlasLoad" height="84" rx="8" width="70" x="660" y="98" />
          <text className="atlasSvgLabel" textAnchor="middle" x="250" y="202">BACKUP</text>
          <text className="atlasSvgLabel" textAnchor="middle" x="500" y="202">LOCAL</text>
          <text className="atlasSvgLabel" textAnchor="middle" x="695" y="216">FAULT</text>
          <text className={secure && sensitive ? 'atlasSvgAccent' : 'atlasSvgWarning'} x="170" y="58">
            PICKUP {pickupCurrent} A · M = {formatNumber(relay.multiple)}×
          </text>
          <text className={selective ? 'atlasSvgAccent' : 'atlasSvgWarning'} x="385" y="248">
            TRIP {relay.tripTime >= 90 ? 'BLOCKED' : `${formatNumber(relay.tripTime)} s`} · MARGIN {formatNumber(coordinationMargin)} s
          </text>
        </svg>
      </section>
      <aside className="atlasGameControls">
        <p className="eyebrow">Relay settings</p>
        <h2>Create a selective trip</h2>
        <RangeControl label="Pickup current" max={5000} min={250} onChange={(value) => { setPickupCurrent(value); setScore(null); }} step={250} value={pickupCurrent} valueLabel={`${pickupCurrent} A`} />
        <RangeControl label="Time multiplier" max={1} min={0.05} onChange={(value) => { setTimeMultiplier(value); setScore(null); }} step={0.05} value={timeMultiplier} valueLabel={timeMultiplier.toFixed(2)} />
        <div className="aliasRule">
          <span>Required backup margin</span>
          <strong>≥ 0.30 s</strong>
          <small>Pickup must also remain at least 1.25× above maximum load.</small>
        </div>
        <button className="atlasCheckButton" onClick={checkCoordination} type="button">
          <ShieldCheck size={17} />
          Test coordination
        </button>
      </aside>
      <ScorePanel
        feedback={
          score !== null && score >= 80
            ? 'The local relay is secure on load, sensitive to the fault, and clears before backup.'
            : 'Raise pickup above load, preserve at least 1.5× fault multiple, and leave 0.30 s for device selectivity.'
        }
        onNext={nextRound}
        score={score}
      />
    </div>
  );
}

function GamePage({
  bestScore,
  game,
  onBack,
  onScore,
}: {
  bestScore: number | undefined;
  game: EngineeringGame;
  onBack: () => void;
  onScore: (score: number) => void;
}) {
  return (
    <GameFrame bestScore={bestScore} game={game} onBack={onBack}>
      {game.id === 'wave-match' ? (
        <WaveMatchGame onScore={onScore} />
      ) : game.id === 'logic-lock' ? (
        <LogicLockGame onScore={onScore} />
      ) : game.id === 'power-target' ? (
        <PowerTargetGame onScore={onScore} />
      ) : game.id === 'transient-trace' ? (
        <TransientTraceGame onScore={onScore} />
      ) : game.id === 'pid-tune' ? (
        <PidTuneGame onScore={onScore} />
      ) : game.id === 'relay-coordination' ? (
        <RelayCoordinationGame onScore={onScore} />
      ) : (
        <AliasEscapeGame onScore={onScore} />
      )}
    </GameFrame>
  );
}

export function ElectricalAtlas({
  activeId,
  onBack,
  onOpenConcept,
  onOpenGame,
  onOpenLab,
  view,
}: ElectricalAtlasProps) {
  const [bestScores, setBestScores] = useState<AtlasBestScores>(readBestScores);
  const [progress, setProgress] = useState<AtlasProgress>(readAtlasProgress);
  const concept = getElectricalConcept(activeId);
  const game = getEngineeringGame(activeId);

  function commitProgress(nextProgress: AtlasProgress) {
    try {
      window.localStorage.setItem(
        ATLAS_PROGRESS_KEY,
        JSON.stringify(nextProgress),
      );
    } catch {
      // Progress still remains available for the current session.
    }
    return nextProgress;
  }

  useEffect(() => {
    if (view !== 'concept' || !concept) {
      return;
    }

    setProgress((currentProgress) => {
      if (currentProgress.recentIds[0] === concept.id) {
        return currentProgress;
      }
      return commitProgress({
        ...currentProgress,
        recentIds: [
          concept.id,
          ...currentProgress.recentIds.filter(
            (conceptId) => conceptId !== concept.id,
          ),
        ].slice(0, 6),
      });
    });
  }, [concept, view]);

  function toggleBookmark(conceptId: string) {
    setProgress((currentProgress) => {
      const bookmarked = currentProgress.bookmarkedIds.includes(conceptId);
      return commitProgress({
        ...currentProgress,
        bookmarkedIds: bookmarked
          ? currentProgress.bookmarkedIds.filter(
              (savedId) => savedId !== conceptId,
            )
          : [conceptId, ...currentProgress.bookmarkedIds],
      });
    });
  }

  function completeConcept(conceptId: string) {
    setProgress((currentProgress) => {
      if (currentProgress.completedIds.includes(conceptId)) {
        return currentProgress;
      }
      return commitProgress({
        ...currentProgress,
        completedIds: [conceptId, ...currentProgress.completedIds],
      });
    });
  }

  function recordScore(gameId: string, score: number) {
    setBestScores((currentScores) => {
      const nextScores = {
        ...currentScores,
        [gameId]: Math.max(currentScores[gameId] ?? 0, score),
      };
      try {
        window.localStorage.setItem(ATLAS_SCORE_KEY, JSON.stringify(nextScores));
      } catch {
        // Scores still remain available for the current session.
      }
      return nextScores;
    });
  }

  if (view === 'concept' && concept) {
    return (
      <ConceptPage
        bookmarked={progress.bookmarkedIds.includes(concept.id)}
        completed={progress.completedIds.includes(concept.id)}
        concept={concept}
        onBack={onBack}
        onComplete={completeConcept}
        onOpenConcept={onOpenConcept}
        onOpenGame={onOpenGame}
        onOpenLab={onOpenLab}
        onToggleBookmark={toggleBookmark}
      />
    );
  }

  if (view === 'game' && game) {
    return (
      <GamePage
        bestScore={bestScores[game.id]}
        game={game}
        onBack={onBack}
        onScore={(score) => recordScore(game.id, score)}
      />
    );
  }

  return (
    <AtlasOverview
      bestScores={bestScores}
      onOpenConcept={onOpenConcept}
      onOpenGame={onOpenGame}
      progress={progress}
    />
  );
}
