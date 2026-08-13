import {
  Activity,
  ArrowLeftRight,
  Calculator,
  Check,
  CircleGauge,
  CircuitBoard,
  Copy,
  GitBranch,
  Lightbulb,
  NotebookPen,
  Palette,
  RefreshCw,
  Timer,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FieldJournalDraftSeed } from './fieldJournalDraft';

type ToolkitMode = 'ac' | 'design' | 'ohm' | 'power' | 'resistor' | 'units';
type DesignTool = 'led' | 'rc';
type ElectricalVariable = 'current' | 'resistance' | 'voltage';
type ReactiveComponent = 'capacitor' | 'inductor';
type ResistorBandCount = 4 | 5;
type ResistorBandKey =
  | 'digit1'
  | 'digit2'
  | 'digit3'
  | 'multiplier'
  | 'tolerance';
type ResistorColor =
  | 'black'
  | 'blue'
  | 'brown'
  | 'gold'
  | 'gray'
  | 'green'
  | 'orange'
  | 'red'
  | 'silver'
  | 'violet'
  | 'white'
  | 'yellow';
type ResistorColorDefinition = {
  digit?: number;
  hex: string;
  label: string;
  multiplier?: number;
  text: string;
  tolerance?: number;
};
type ResistorTool = 'bands' | 'divider';
type UnitQuantity =
  | 'capacitance'
  | 'current'
  | 'frequency'
  | 'inductance'
  | 'power'
  | 'resistance'
  | 'voltage';

type UnitOption = {
  factor: number;
  label: string;
};

type UnitDefinition = {
  defaultFrom: string;
  defaultTo: string;
  label: string;
  units: UnitOption[];
};

const RESISTOR_COLOR_META: Record<ResistorColor, ResistorColorDefinition> = {
  black: { digit: 0, hex: '#1b2429', label: 'Black', multiplier: 1, text: '#ffffff' },
  brown: { digit: 1, hex: '#76452d', label: 'Brown', multiplier: 10, text: '#ffffff', tolerance: 1 },
  red: { digit: 2, hex: '#d63a3a', label: 'Red', multiplier: 100, text: '#ffffff', tolerance: 2 },
  orange: { digit: 3, hex: '#e88422', label: 'Orange', multiplier: 1000, text: '#172b35' },
  yellow: { digit: 4, hex: '#f0ca35', label: 'Yellow', multiplier: 10000, text: '#172b35' },
  green: { digit: 5, hex: '#258f62', label: 'Green', multiplier: 100000, text: '#ffffff', tolerance: 0.5 },
  blue: { digit: 6, hex: '#2477bd', label: 'Blue', multiplier: 1000000, text: '#ffffff', tolerance: 0.25 },
  violet: { digit: 7, hex: '#7b4bb3', label: 'Violet', multiplier: 10000000, text: '#ffffff', tolerance: 0.1 },
  gray: { digit: 8, hex: '#77858d', label: 'Gray', multiplier: 100000000, text: '#ffffff', tolerance: 0.05 },
  white: { digit: 9, hex: '#f4f5f2', label: 'White', multiplier: 1000000000, text: '#172b35' },
  gold: { hex: '#cda434', label: 'Gold', multiplier: 0.1, text: '#172b35', tolerance: 5 },
  silver: { hex: '#aeb7bd', label: 'Silver', multiplier: 0.01, text: '#172b35', tolerance: 10 },
};

type ResistorBandSelection = Record<ResistorBandKey, ResistorColor>;

const RESISTOR_DIGIT_COLORS: ResistorColor[] = [
  'black',
  'brown',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'violet',
  'gray',
  'white',
];
const RESISTOR_MULTIPLIER_COLORS: ResistorColor[] = [
  ...RESISTOR_DIGIT_COLORS,
  'gold',
  'silver',
];
const RESISTOR_TOLERANCE_COLORS: ResistorColor[] = [
  'brown',
  'red',
  'green',
  'blue',
  'violet',
  'gray',
  'gold',
  'silver',
];
const DEFAULT_FOUR_BAND_RESISTOR: ResistorBandSelection = {
  digit1: 'brown',
  digit2: 'black',
  digit3: 'black',
  multiplier: 'red',
  tolerance: 'gold',
};
const DEFAULT_FIVE_BAND_RESISTOR: ResistorBandSelection = {
  digit1: 'brown',
  digit2: 'black',
  digit3: 'black',
  multiplier: 'brown',
  tolerance: 'brown',
};

const VARIABLE_META: Record<
  ElectricalVariable,
  { label: string; symbol: string; unit: string }
> = {
  current: { label: 'Current', symbol: 'I', unit: 'A' },
  resistance: { label: 'Resistance', symbol: 'R', unit: 'Ohm' },
  voltage: { label: 'Voltage', symbol: 'V', unit: 'V' },
};

const UNIT_DEFINITIONS: Record<UnitQuantity, UnitDefinition> = {
  capacitance: {
    defaultFrom: 'uF',
    defaultTo: 'nF',
    label: 'Capacitance',
    units: [
      { factor: 0.000000000001, label: 'pF' },
      { factor: 0.000000001, label: 'nF' },
      { factor: 0.000001, label: 'uF' },
      { factor: 0.001, label: 'mF' },
      { factor: 1, label: 'F' },
    ],
  },
  current: {
    defaultFrom: 'A',
    defaultTo: 'mA',
    label: 'Current',
    units: [
      { factor: 0.000001, label: 'uA' },
      { factor: 0.001, label: 'mA' },
      { factor: 1, label: 'A' },
    ],
  },
  frequency: {
    defaultFrom: 'kHz',
    defaultTo: 'Hz',
    label: 'Frequency',
    units: [
      { factor: 1, label: 'Hz' },
      { factor: 1000, label: 'kHz' },
      { factor: 1000000, label: 'MHz' },
      { factor: 1000000000, label: 'GHz' },
    ],
  },
  inductance: {
    defaultFrom: 'mH',
    defaultTo: 'uH',
    label: 'Inductance',
    units: [
      { factor: 0.000001, label: 'uH' },
      { factor: 0.001, label: 'mH' },
      { factor: 1, label: 'H' },
    ],
  },
  power: {
    defaultFrom: 'W',
    defaultTo: 'mW',
    label: 'Power',
    units: [
      { factor: 0.001, label: 'mW' },
      { factor: 1, label: 'W' },
      { factor: 1000, label: 'kW' },
    ],
  },
  resistance: {
    defaultFrom: 'kOhm',
    defaultTo: 'Ohm',
    label: 'Resistance',
    units: [
      { factor: 1, label: 'Ohm' },
      { factor: 1000, label: 'kOhm' },
      { factor: 1000000, label: 'MOhm' },
    ],
  },
  voltage: {
    defaultFrom: 'V',
    defaultTo: 'mV',
    label: 'Voltage',
    units: [
      { factor: 0.001, label: 'mV' },
      { factor: 1, label: 'V' },
      { factor: 1000, label: 'kV' },
    ],
  },
};

const REACTIVE_COMPONENT_UNITS: Record<
  ReactiveComponent,
  {
    defaultUnit: string;
    defaultValue: string;
    label: string;
    units: UnitOption[];
  }
> = {
  capacitor: {
    defaultUnit: 'uF',
    defaultValue: '0.1',
    label: 'Capacitance',
    units: UNIT_DEFINITIONS.capacitance.units,
  },
  inductor: {
    defaultUnit: 'mH',
    defaultValue: '10',
    label: 'Inductance',
    units: UNIT_DEFINITIONS.inductance.units,
  },
};

const DEFAULT_OHM_VALUES: Record<ElectricalVariable, string> = {
  current: '0.012',
  resistance: '1000',
  voltage: '12',
};

const E24_NORMALIZED_VALUES = [
  1,
  1.1,
  1.2,
  1.3,
  1.5,
  1.6,
  1.8,
  2,
  2.2,
  2.4,
  2.7,
  3,
  3.3,
  3.6,
  3.9,
  4.3,
  4.7,
  5.1,
  5.6,
  6.2,
  6.8,
  7.5,
  8.2,
  9.1,
] as const;

const COMMON_RESISTOR_POWER_RATINGS = [0.125, 0.25, 0.5, 1, 2, 3, 5, 10];

function parsePositiveValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseFiniteValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) {
    return '--';
  }

  return new Intl.NumberFormat('en-US', {
    maximumSignificantDigits: 5,
  }).format(value);
}

function getNextE24Resistance(targetResistance: number) {
  if (!Number.isFinite(targetResistance) || targetResistance <= 0) {
    return null;
  }

  const exponent = Math.floor(Math.log10(targetResistance));
  const magnitude = 10 ** exponent;
  const normalizedTarget = targetResistance / magnitude;
  const normalizedValue = E24_NORMALIZED_VALUES.find(
    (value) => value + Number.EPSILON >= normalizedTarget,
  );

  return normalizedValue
    ? normalizedValue * magnitude
    : E24_NORMALIZED_VALUES[0] * magnitude * 10;
}

function getRecommendedPowerRating(dissipation: number) {
  const deratedMinimum = dissipation * 2;
  return (
    COMMON_RESISTOR_POWER_RATINGS.find(
      (rating) => rating >= deratedMinimum,
    ) ?? Math.ceil(deratedMinimum)
  );
}

function formatDuration(seconds: number) {
  if (seconds < 0.000001) {
    return `${formatNumber(seconds * 1_000_000_000)} ns`;
  }
  if (seconds < 0.001) {
    return `${formatNumber(seconds * 1_000_000)} us`;
  }
  if (seconds < 1) {
    return `${formatNumber(seconds * 1000)} ms`;
  }
  if (seconds < 60) {
    return `${formatNumber(seconds)} s`;
  }

  return `${formatNumber(seconds / 60)} min`;
}

function formatMeasurement(value: number, variable: ElectricalVariable) {
  const absoluteValue = Math.abs(value);

  if (variable === 'current') {
    if (absoluteValue > 0 && absoluteValue < 0.001) {
      return `${formatNumber(value * 1000000)} uA`;
    }
    if (absoluteValue > 0 && absoluteValue < 1) {
      return `${formatNumber(value * 1000)} mA`;
    }
    return `${formatNumber(value)} A`;
  }

  if (variable === 'resistance') {
    if (absoluteValue >= 1000000) {
      return `${formatNumber(value / 1000000)} MOhm`;
    }
    if (absoluteValue >= 1000) {
      return `${formatNumber(value / 1000)} kOhm`;
    }
    return `${formatNumber(value)} Ohm`;
  }

  if (absoluteValue >= 1000) {
    return `${formatNumber(value / 1000)} kV`;
  }
  if (absoluteValue > 0 && absoluteValue < 1) {
    return `${formatNumber(value * 1000)} mV`;
  }
  return `${formatNumber(value)} V`;
}

function formatPower(value: number) {
  if (value > 0 && value < 1) {
    return `${formatNumber(value * 1000)} mW`;
  }
  if (value >= 1000) {
    return `${formatNumber(value / 1000)} kW`;
  }
  return `${formatNumber(value)} W`;
}

function getResistorBandLabel(
  band: ResistorBandKey,
  bandCount: ResistorBandCount,
) {
  if (band === 'multiplier') {
    return 'Multiplier';
  }
  if (band === 'tolerance') {
    return 'Tolerance';
  }

  const digitIndex = band === 'digit1' ? 1 : band === 'digit2' ? 2 : 3;
  return bandCount === 4 ? `Digit ${digitIndex}` : `Significant ${digitIndex}`;
}

function getResistorPalette(band: ResistorBandKey) {
  if (band === 'multiplier') {
    return RESISTOR_MULTIPLIER_COLORS;
  }
  if (band === 'tolerance') {
    return RESISTOR_TOLERANCE_COLORS;
  }
  return RESISTOR_DIGIT_COLORS;
}

function formatTolerance(tolerance: number) {
  return Number.isInteger(tolerance) ? String(tolerance) : formatNumber(tolerance);
}

type EngineeringToolkitProps = {
  onSaveCalculation?: (seed: FieldJournalDraftSeed) => void;
};

export function EngineeringToolkit({
  onSaveCalculation,
}: EngineeringToolkitProps = {}) {
  const [mode, setMode] = useState<ToolkitMode>('ohm');
  const [designTool, setDesignTool] = useState<DesignTool>('led');
  const [solveFor, setSolveFor] = useState<ElectricalVariable>('current');
  const [ohmValues, setOhmValues] =
    useState<Record<ElectricalVariable, string>>(DEFAULT_OHM_VALUES);
  const [powerVoltage, setPowerVoltage] = useState('12');
  const [powerCurrent, setPowerCurrent] = useState('1.5');
  const [powerMinutes, setPowerMinutes] = useState('60');
  const [reactiveComponent, setReactiveComponent] =
    useState<ReactiveComponent>('capacitor');
  const [reactiveFrequency, setReactiveFrequency] = useState('1000');
  const [reactiveSourceVoltage, setReactiveSourceVoltage] = useState('5');
  const [reactiveUnit, setReactiveUnit] = useState('uF');
  const [reactiveValue, setReactiveValue] = useState('0.1');
  const [unitQuantity, setUnitQuantity] = useState<UnitQuantity>('voltage');
  const [unitValue, setUnitValue] = useState('12');
  const [fromUnit, setFromUnit] = useState('V');
  const [toUnit, setToUnit] = useState('mV');
  const [resistorTool, setResistorTool] = useState<ResistorTool>('bands');
  const [resistorBandCount, setResistorBandCount] =
    useState<ResistorBandCount>(4);
  const [resistorBands, setResistorBands] =
    useState<ResistorBandSelection>(DEFAULT_FOUR_BAND_RESISTOR);
  const [activeResistorBand, setActiveResistorBand] =
    useState<ResistorBandKey>('digit1');
  const [dividerVoltage, setDividerVoltage] = useState('12');
  const [dividerR1, setDividerR1] = useState('10');
  const [dividerR2, setDividerR2] = useState('10');
  const [dividerLoad, setDividerLoad] = useState('');
  const [ledSupplyVoltage, setLedSupplyVoltage] = useState('5');
  const [ledForwardVoltage, setLedForwardVoltage] = useState('2');
  const [ledCurrentMilliamps, setLedCurrentMilliamps] = useState('15');
  const [rcResistanceKohms, setRcResistanceKohms] = useState('10');
  const [rcCapacitanceMicrofarads, setRcCapacitanceMicrofarads] =
    useState('0.1');
  const [copiedDesignTool, setCopiedDesignTool] =
    useState<DesignTool | null>(null);

  const knownVariables = (
    ['voltage', 'current', 'resistance'] as ElectricalVariable[]
  ).filter((variable) => variable !== solveFor);

  const ohmResult = useMemo(() => {
    const voltage = parsePositiveValue(ohmValues.voltage);
    const current = parsePositiveValue(ohmValues.current);
    const resistance = parsePositiveValue(ohmValues.resistance);

    if (solveFor === 'voltage' && current !== null && resistance !== null) {
      return {
        formula: 'V = I x R',
        substituted: `${formatNumber(current)} A x ${formatNumber(resistance)} Ohm`,
        value: current * resistance,
      };
    }

    if (solveFor === 'current' && voltage !== null && resistance !== null) {
      return {
        formula: 'I = V / R',
        substituted: `${formatNumber(voltage)} V / ${formatNumber(resistance)} Ohm`,
        value: voltage / resistance,
      };
    }

    if (solveFor === 'resistance' && voltage !== null && current !== null) {
      return {
        formula: 'R = V / I',
        substituted: `${formatNumber(voltage)} V / ${formatNumber(current)} A`,
        value: voltage / current,
      };
    }

    return null;
  }, [ohmValues, solveFor]);

  useEffect(() => {
    if (!ohmResult) {
      return;
    }

    setOhmValues((values) => {
      const nextValue = String(ohmResult.value);
      return values[solveFor] === nextValue
        ? values
        : {
            ...values,
            [solveFor]: nextValue,
          };
    });
  }, [ohmResult, solveFor]);

  const powerResult = useMemo(() => {
    const voltage = parsePositiveValue(powerVoltage);
    const current = parsePositiveValue(powerCurrent);
    const minutes = parsePositiveValue(powerMinutes);

    if (voltage === null || current === null || minutes === null) {
      return null;
    }

    const watts = voltage * current;
    return {
      energyWh: watts * (minutes / 60),
      loadResistance: voltage / current,
      watts,
    };
  }, [powerCurrent, powerMinutes, powerVoltage]);

  const unitDefinition = UNIT_DEFINITIONS[unitQuantity];
  const reactiveDefinition = REACTIVE_COMPONENT_UNITS[reactiveComponent];
  const reactanceResult = useMemo(() => {
    const frequency = parsePositiveValue(reactiveFrequency);
    const sourceVoltage = parsePositiveValue(reactiveSourceVoltage);
    const componentValue = parsePositiveValue(reactiveValue);
    const selectedUnit = reactiveDefinition.units.find(
      (unit) => unit.label === reactiveUnit,
    );

    if (
      frequency === null ||
      sourceVoltage === null ||
      componentValue === null ||
      !selectedUnit
    ) {
      return null;
    }

    const baseValue = componentValue * selectedUnit.factor;
    const reactance =
      reactiveComponent === 'capacitor'
        ? 1 / (2 * Math.PI * frequency * baseValue)
        : 2 * Math.PI * frequency * baseValue;

    return {
      current: sourceVoltage / reactance,
      formula:
        reactiveComponent === 'capacitor'
          ? 'Xc = 1 / (2 x pi x f x C)'
          : 'Xl = 2 x pi x f x L',
      phase:
        reactiveComponent === 'capacitor'
          ? 'Current leads voltage by 90 degrees'
          : 'Current lags voltage by 90 degrees',
      reactance,
    };
  }, [
    reactiveComponent,
    reactiveDefinition,
    reactiveFrequency,
    reactiveSourceVoltage,
    reactiveUnit,
    reactiveValue,
  ]);
  const convertedValue = useMemo(() => {
    const value = parseFiniteValue(unitValue);
    const from = unitDefinition.units.find((unit) => unit.label === fromUnit);
    const to = unitDefinition.units.find((unit) => unit.label === toUnit);

    if (value === null || !from || !to) {
      return null;
    }

    return (value * from.factor) / to.factor;
  }, [fromUnit, toUnit, unitDefinition, unitValue]);
  const resistorBandOrder: ResistorBandKey[] =
    resistorBandCount === 4
      ? ['digit1', 'digit2', 'multiplier', 'tolerance']
      : ['digit1', 'digit2', 'digit3', 'multiplier', 'tolerance'];
  const activeResistorPalette = getResistorPalette(activeResistorBand);
  const resistorResult = useMemo(() => {
    const digitBands: ResistorBandKey[] =
      resistorBandCount === 4
        ? ['digit1', 'digit2']
        : ['digit1', 'digit2', 'digit3'];
    const significantValue = digitBands.reduce((value, band) => {
      const digit = RESISTOR_COLOR_META[resistorBands[band]].digit ?? 0;
      return value * 10 + digit;
    }, 0);
    const multiplier =
      RESISTOR_COLOR_META[resistorBands.multiplier].multiplier ?? 1;
    const tolerance =
      RESISTOR_COLOR_META[resistorBands.tolerance].tolerance ?? 20;
    const resistance = significantValue * multiplier;

    return {
      maximum: resistance * (1 + tolerance / 100),
      minimum: resistance * (1 - tolerance / 100),
      resistance,
      tolerance,
    };
  }, [resistorBandCount, resistorBands]);
  const dividerResult = useMemo(() => {
    const inputVoltage = parsePositiveValue(dividerVoltage);
    const upperResistance = parsePositiveValue(dividerR1);
    const lowerResistance = parsePositiveValue(dividerR2);
    const hasLoad = dividerLoad.trim() !== '';
    const loadResistance = hasLoad ? parsePositiveValue(dividerLoad) : null;

    if (
      inputVoltage === null ||
      upperResistance === null ||
      lowerResistance === null ||
      (hasLoad && loadResistance === null)
    ) {
      return null;
    }

    const effectiveLowerResistance = loadResistance
      ? (lowerResistance * loadResistance) /
        (lowerResistance + loadResistance)
      : lowerResistance;
    const ratio =
      effectiveLowerResistance /
      (upperResistance + effectiveLowerResistance);
    const outputVoltage = inputVoltage * ratio;
    const sourceCurrent =
      inputVoltage / ((upperResistance + effectiveLowerResistance) * 1000);

    return {
      effectiveLowerResistance,
      hasLoad,
      loadCurrent: loadResistance
        ? outputVoltage / (loadResistance * 1000)
        : null,
      outputVoltage,
      ratio,
      sourceCurrent,
    };
  }, [dividerLoad, dividerR1, dividerR2, dividerVoltage]);
  const ledResult = useMemo(() => {
    const supplyVoltage = parsePositiveValue(ledSupplyVoltage);
    const forwardVoltage = parsePositiveValue(ledForwardVoltage);
    const targetCurrentMilliamps = parsePositiveValue(ledCurrentMilliamps);

    if (
      supplyVoltage === null ||
      forwardVoltage === null ||
      targetCurrentMilliamps === null ||
      supplyVoltage <= forwardVoltage
    ) {
      return null;
    }

    const voltageDrop = supplyVoltage - forwardVoltage;
    const targetCurrent = targetCurrentMilliamps / 1000;
    const idealResistance = voltageDrop / targetCurrent;
    const recommendedResistance = getNextE24Resistance(idealResistance);

    if (recommendedResistance === null) {
      return null;
    }

    const actualCurrent = voltageDrop / recommendedResistance;
    const resistorPower = voltageDrop * actualCurrent;

    return {
      actualCurrent,
      forwardVoltage,
      idealResistance,
      recommendedPowerRating: getRecommendedPowerRating(resistorPower),
      recommendedResistance,
      resistorPower,
      supplyVoltage,
      targetCurrentMilliamps,
      voltageDrop,
    };
  }, [ledCurrentMilliamps, ledForwardVoltage, ledSupplyVoltage]);
  const rcResult = useMemo(() => {
    const resistanceKohms = parsePositiveValue(rcResistanceKohms);
    const capacitanceMicrofarads = parsePositiveValue(
      rcCapacitanceMicrofarads,
    );

    if (resistanceKohms === null || capacitanceMicrofarads === null) {
      return null;
    }

    const resistance = resistanceKohms * 1000;
    const capacitance = capacitanceMicrofarads * 0.000001;
    const timeConstant = resistance * capacitance;

    return {
      capacitanceMicrofarads,
      cutoffFrequency: 1 / (2 * Math.PI * timeConstant),
      resistanceKohms,
      settlingTime: timeConstant * 5,
      timeConstant,
    };
  }, [rcCapacitanceMicrofarads, rcResistanceKohms]);

  const ledResultSummary = ledResult
    ? `LED current limiter: ${formatNumber(
        ledResult.supplyVoltage,
      )} V supply, ${formatNumber(
        ledResult.forwardVoltage,
      )} V forward drop, ${formatNumber(
        ledResult.targetCurrentMilliamps,
      )} mA target. Use ${formatMeasurement(
        ledResult.recommendedResistance,
        'resistance',
      )}; estimated current ${formatMeasurement(
        ledResult.actualCurrent,
        'current',
      )}, resistor dissipation ${formatPower(
        ledResult.resistorPower,
      )}, minimum recommended rating ${formatNumber(
        ledResult.recommendedPowerRating,
      )} W.`
    : '';
  const rcResultSummary = rcResult
    ? `RC network: ${formatNumber(
        rcResult.resistanceKohms,
      )} kOhm and ${formatNumber(
        rcResult.capacitanceMicrofarads,
      )} uF. Time constant ${formatDuration(
        rcResult.timeConstant,
      )}, cutoff ${formatNumber(
        rcResult.cutoffFrequency,
      )} Hz, five-time-constant settling ${formatDuration(
        rcResult.settlingTime,
      )}.`
    : '';

  function handleQuantityChange(quantity: UnitQuantity) {
    const definition = UNIT_DEFINITIONS[quantity];
    setUnitQuantity(quantity);
    setFromUnit(definition.defaultFrom);
    setToUnit(definition.defaultTo);
  }

  function handleOhmReset() {
    setSolveFor('current');
    setOhmValues(DEFAULT_OHM_VALUES);
  }

  function handlePowerReset() {
    setPowerVoltage('12');
    setPowerCurrent('1.5');
    setPowerMinutes('60');
  }

  function handleReactiveComponentChange(component: ReactiveComponent) {
    const definition = REACTIVE_COMPONENT_UNITS[component];
    setReactiveComponent(component);
    setReactiveUnit(definition.defaultUnit);
    setReactiveValue(definition.defaultValue);
  }

  function handleReactanceReset() {
    setReactiveComponent('capacitor');
    setReactiveFrequency('1000');
    setReactiveSourceVoltage('5');
    setReactiveUnit('uF');
    setReactiveValue('0.1');
  }

  function handleResistorBandCountChange(count: ResistorBandCount) {
    setResistorBandCount(count);
    setResistorBands(
      count === 4 ? DEFAULT_FOUR_BAND_RESISTOR : DEFAULT_FIVE_BAND_RESISTOR,
    );
    setActiveResistorBand('digit1');
  }

  function handleResistorReset() {
    handleResistorBandCountChange(4);
  }

  function handleDividerReset() {
    setDividerVoltage('12');
    setDividerR1('10');
    setDividerR2('10');
    setDividerLoad('');
  }

  function handleDesignReset() {
    setCopiedDesignTool(null);

    if (designTool === 'led') {
      setLedSupplyVoltage('5');
      setLedForwardVoltage('2');
      setLedCurrentMilliamps('15');
      return;
    }

    setRcResistanceKohms('10');
    setRcCapacitanceMicrofarads('0.1');
  }

  async function handleCopyDesignResult() {
    const summary = designTool === 'led' ? ledResultSummary : rcResultSummary;
    if (!summary || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(summary);
      setCopiedDesignTool(designTool);
      window.setTimeout(() => {
        setCopiedDesignTool((copiedTool) =>
          copiedTool === designTool ? null : copiedTool,
        );
      }, 1800);
    } catch {
      setCopiedDesignTool(null);
    }
  }

  function handleSaveDesignResult() {
    if (!onSaveCalculation) {
      return;
    }

    if (designTool === 'led' && ledResult) {
      onSaveCalculation({
        body: `${ledResultSummary}\n\nRelationship: R = (Vs - Vf) / I. The recommended E24 value is rounded upward to keep LED current at or below the target.`,
        category: 'formula',
        title: 'LED current-limiter design',
      });
      return;
    }

    if (designTool === 'rc' && rcResult) {
      onSaveCalculation({
        body: `${rcResultSummary}\n\nRelationships: tau = R x C; fc = 1 / (2 x pi x R x C). A first-order response is effectively settled after about five time constants.`,
        category: 'formula',
        title: 'RC timing and cutoff design',
      });
    }
  }

  return (
    <section className="engineeringToolkit" aria-label="Engineering Toolkit">
      <nav className="toolkitModeControl" aria-label="Toolkit mode">
        <button
          aria-pressed={mode === 'ohm'}
          onClick={() => setMode('ohm')}
          type="button"
        >
          <Calculator size={17} />
          Ohm's law
        </button>
        <button
          aria-pressed={mode === 'power'}
          onClick={() => setMode('power')}
          type="button"
        >
          <Zap size={17} />
          Power
        </button>
        <button
          aria-pressed={mode === 'resistor'}
          onClick={() => setMode('resistor')}
          type="button"
        >
          <CircuitBoard size={17} />
          Resistors
        </button>
        <button
          aria-pressed={mode === 'design'}
          onClick={() => setMode('design')}
          type="button"
        >
          <Lightbulb size={17} />
          Design
        </button>
        <button
          aria-pressed={mode === 'ac'}
          onClick={() => setMode('ac')}
          type="button"
        >
          <Activity size={17} />
          AC
        </button>
        <button
          aria-pressed={mode === 'units'}
          onClick={() => setMode('units')}
          type="button"
        >
          <ArrowLeftRight size={17} />
          Units
        </button>
      </nav>

      {mode === 'ohm' && (
        <div className="toolkitWorkspace">
          <header className="toolkitSectionHeader">
            <div>
              <span>DC relationship</span>
              <h3>Solve Ohm's law</h3>
            </div>
            <button
              aria-label="Reset Ohm's law calculator"
              className="iconButton ghost"
              onClick={handleOhmReset}
              title="Reset values"
              type="button"
            >
              <RefreshCw size={16} />
            </button>
          </header>

          <fieldset className="toolkitSolveFor">
            <legend>Solve for</legend>
            {(['voltage', 'current', 'resistance'] as ElectricalVariable[]).map(
              (variable) => (
                <button
                  aria-pressed={solveFor === variable}
                  key={variable}
                  onClick={() => setSolveFor(variable)}
                  type="button"
                >
                  <strong>{VARIABLE_META[variable].symbol}</strong>
                  {VARIABLE_META[variable].label}
                </button>
              ),
            )}
          </fieldset>

          <div className="toolkitInputGrid">
            {knownVariables.map((variable) => (
              <label key={variable}>
                <span>
                  {VARIABLE_META[variable].label}
                  <small>{VARIABLE_META[variable].unit}</small>
                </span>
                <input
                  inputMode="decimal"
                  min="0"
                  onChange={(event) =>
                    setOhmValues((values) => ({
                      ...values,
                      [variable]: event.target.value,
                    }))
                  }
                  step="any"
                  type="number"
                  value={ohmValues[variable]}
                />
              </label>
            ))}
          </div>

          <output className={`toolkitResult ${ohmResult ? 'ready' : 'invalid'}`}>
            <span>{VARIABLE_META[solveFor].label}</span>
            <strong>
              {ohmResult
                ? formatMeasurement(ohmResult.value, solveFor)
                : 'Enter two positive values'}
            </strong>
            <small>
              {ohmResult
                ? `${ohmResult.formula} = ${ohmResult.substituted}`
                : 'Zero and negative values are not used in this quick solver.'}
            </small>
          </output>
        </div>
      )}

      {mode === 'power' && (
        <div className="toolkitWorkspace">
          <header className="toolkitSectionHeader">
            <div>
              <span>Power and energy</span>
              <h3>Estimate a DC load</h3>
            </div>
            <button
              aria-label="Reset power calculator"
              className="iconButton ghost"
              onClick={handlePowerReset}
              title="Reset values"
              type="button"
            >
              <RefreshCw size={16} />
            </button>
          </header>

          <div className="toolkitInputGrid three">
            <label>
              <span>
                Voltage
                <small>V</small>
              </span>
              <input
                inputMode="decimal"
                min="0"
                onChange={(event) => setPowerVoltage(event.target.value)}
                step="any"
                type="number"
                value={powerVoltage}
              />
            </label>
            <label>
              <span>
                Current
                <small>A</small>
              </span>
              <input
                inputMode="decimal"
                min="0"
                onChange={(event) => setPowerCurrent(event.target.value)}
                step="any"
                type="number"
                value={powerCurrent}
              />
            </label>
            <label>
              <span>
                Duration
                <small>min</small>
              </span>
              <input
                inputMode="decimal"
                min="0"
                onChange={(event) => setPowerMinutes(event.target.value)}
                step="any"
                type="number"
                value={powerMinutes}
              />
            </label>
          </div>

          <output className={`toolkitResult ${powerResult ? 'ready' : 'invalid'}`}>
            <span>Load power</span>
            <strong>{powerResult ? formatPower(powerResult.watts) : '--'}</strong>
            <small>
              {powerResult
                ? `P = V x I | ${formatNumber(powerResult.energyWh)} Wh | ${formatMeasurement(
                    powerResult.loadResistance,
                    'resistance',
                  )} equivalent load`
                : 'Enter positive voltage, current, and duration values.'}
            </small>
          </output>
        </div>
      )}

      {mode === 'resistor' && (
        <div className="toolkitWorkspace resistorToolkitWorkspace">
          <header className="toolkitSectionHeader">
            <div>
              <span>Bench essentials</span>
              <h3>Work with resistor values</h3>
            </div>
            <button
              aria-label={`Reset ${
                resistorTool === 'bands'
                  ? 'resistor band decoder'
                  : 'voltage divider calculator'
              }`}
              className="iconButton ghost"
              onClick={
                resistorTool === 'bands'
                  ? handleResistorReset
                  : handleDividerReset
              }
              title="Reset values"
              type="button"
            >
              <RefreshCw size={16} />
            </button>
          </header>

          <div
            aria-label="Resistor tool"
            className="resistorToolControl"
            role="group"
          >
            <button
              aria-pressed={resistorTool === 'bands'}
              onClick={() => setResistorTool('bands')}
              type="button"
            >
              <Palette size={17} />
              Color bands
            </button>
            <button
              aria-pressed={resistorTool === 'divider'}
              onClick={() => setResistorTool('divider')}
              type="button"
            >
              <GitBranch size={17} />
              Voltage divider
            </button>
          </div>

          {resistorTool === 'bands' && (
            <>
              <fieldset className="resistorBandCountControl">
                <legend>Band standard</legend>
                {([4, 5] as ResistorBandCount[]).map((count) => (
                  <button
                    aria-pressed={resistorBandCount === count}
                    key={count}
                    onClick={() => handleResistorBandCountChange(count)}
                    type="button"
                  >
                    {count}-band
                  </button>
                ))}
              </fieldset>

              <div
                aria-label={`${formatMeasurement(
                  resistorResult.resistance,
                  'resistance',
                )} resistor with ${formatTolerance(
                  resistorResult.tolerance,
                )} percent tolerance`}
                className="resistorVisual"
                role="group"
              >
                <span className="resistorLead" />
                <div className="resistorBody">
                  {resistorBandOrder.map((band) => {
                    const color = resistorBands[band];
                    const colorMeta = RESISTOR_COLOR_META[color];

                    return (
                      <button
                        aria-label={`${getResistorBandLabel(
                          band,
                          resistorBandCount,
                        )}: ${colorMeta.label}. Select band.`}
                        aria-pressed={activeResistorBand === band}
                        className={`resistorVisualBand ${
                          band === 'tolerance' ? 'tolerance' : ''
                        }`}
                        key={band}
                        onClick={() => setActiveResistorBand(band)}
                        style={{ backgroundColor: colorMeta.hex }}
                        title={`${getResistorBandLabel(
                          band,
                          resistorBandCount,
                        )}: ${colorMeta.label}`}
                        type="button"
                      />
                    );
                  })}
                </div>
                <span className="resistorLead" />
              </div>

              <div
                aria-label="Select resistor band"
                className={`resistorBandSelector ${
                  resistorBandCount === 5 ? 'five' : ''
                }`}
                role="group"
              >
                {resistorBandOrder.map((band) => {
                  const color = resistorBands[band];
                  const colorMeta = RESISTOR_COLOR_META[color];

                  return (
                    <button
                      aria-pressed={activeResistorBand === band}
                      key={band}
                      onClick={() => setActiveResistorBand(band)}
                      type="button"
                    >
                      <span style={{ backgroundColor: colorMeta.hex }} />
                      <span>
                        <strong>
                          {getResistorBandLabel(band, resistorBandCount)}
                        </strong>
                        <small>{colorMeta.label}</small>
                      </span>
                    </button>
                  );
                })}
              </div>

              <section
                aria-label={`${getResistorBandLabel(
                  activeResistorBand,
                  resistorBandCount,
                )} color palette`}
                className="resistorPalettePanel"
              >
                <header>
                  <div>
                    <span>
                      {getResistorBandLabel(
                        activeResistorBand,
                        resistorBandCount,
                      )}
                    </span>
                    <strong>
                      {RESISTOR_COLOR_META[resistorBands[activeResistorBand]].label}
                    </strong>
                  </div>
                  <small>
                    {activeResistorBand === 'multiplier'
                      ? `x ${formatNumber(
                          RESISTOR_COLOR_META[
                            resistorBands[activeResistorBand]
                          ].multiplier ?? 1,
                        )}`
                      : activeResistorBand === 'tolerance'
                        ? `+/- ${formatTolerance(
                            RESISTOR_COLOR_META[
                              resistorBands[activeResistorBand]
                            ].tolerance ?? 20,
                          )}%`
                        : `Digit ${
                            RESISTOR_COLOR_META[
                              resistorBands[activeResistorBand]
                            ].digit ?? 0
                          }`}
                  </small>
                </header>
                <div className="resistorColorPalette">
                  {activeResistorPalette.map((color) => {
                    const colorMeta = RESISTOR_COLOR_META[color];
                    const isSelected = resistorBands[activeResistorBand] === color;

                    return (
                      <button
                        aria-label={`Use ${colorMeta.label}`}
                        aria-pressed={isSelected}
                        key={color}
                        onClick={() =>
                          setResistorBands((bands) => ({
                            ...bands,
                            [activeResistorBand]: color,
                          }))
                        }
                        title={colorMeta.label}
                        type="button"
                      >
                        <span
                          style={{
                            backgroundColor: colorMeta.hex,
                            color: colorMeta.text,
                          }}
                        >
                          {isSelected && <Check size={15} strokeWidth={3} />}
                        </span>
                        <small>{colorMeta.label}</small>
                      </button>
                    );
                  })}
                </div>
              </section>

              <output className="toolkitResult ready resistorResult">
                <span>Decoded value</span>
                <strong>
                  {formatMeasurement(resistorResult.resistance, 'resistance')}{' '}
                  +/- {formatTolerance(resistorResult.tolerance)}%
                </strong>
                <small>
                  Nominal range {formatMeasurement(
                    resistorResult.minimum,
                    'resistance',
                  )} to {formatMeasurement(
                    resistorResult.maximum,
                    'resistance',
                  )}. Select a band, then choose its color.
                </small>
              </output>
            </>
          )}

          {resistorTool === 'divider' && (
            <>
              <div className="toolkitInputGrid four resistorDividerInputs">
                <label>
                  <span>
                    Input
                    <small>V</small>
                  </span>
                  <input
                    inputMode="decimal"
                    min="0"
                    onChange={(event) => setDividerVoltage(event.target.value)}
                    step="any"
                    type="number"
                    value={dividerVoltage}
                  />
                </label>
                <label>
                  <span>
                    R1 upper
                    <small>kOhm</small>
                  </span>
                  <input
                    inputMode="decimal"
                    min="0"
                    onChange={(event) => setDividerR1(event.target.value)}
                    step="any"
                    type="number"
                    value={dividerR1}
                  />
                </label>
                <label>
                  <span>
                    R2 lower
                    <small>kOhm</small>
                  </span>
                  <input
                    inputMode="decimal"
                    min="0"
                    onChange={(event) => setDividerR2(event.target.value)}
                    step="any"
                    type="number"
                    value={dividerR2}
                  />
                </label>
                <label>
                  <span>
                    Load
                    <small>kOhm optional</small>
                  </span>
                  <input
                    inputMode="decimal"
                    min="0"
                    onChange={(event) => setDividerLoad(event.target.value)}
                    placeholder="Open circuit"
                    step="any"
                    type="number"
                    value={dividerLoad}
                  />
                </label>
              </div>

              <section
                aria-label="Voltage divider preview"
                className="dividerPreview"
              >
                <div className="dividerPreviewLabels">
                  <span>0 V</span>
                  <strong>
                    {dividerResult
                      ? `${formatNumber(dividerResult.outputVoltage)} V out`
                      : 'Check values'}
                  </strong>
                  <span>{formatNumber(Number(dividerVoltage))} V in</span>
                </div>
                <div
                  aria-label={
                    dividerResult
                      ? `${formatNumber(dividerResult.ratio * 100)} percent of input voltage`
                      : 'Invalid divider ratio'
                  }
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={
                    dividerResult
                      ? Math.round(dividerResult.ratio * 100)
                      : undefined
                  }
                  className="dividerRatioTrack"
                  role="progressbar"
                >
                  <span
                    style={{
                      width: `${dividerResult ? dividerResult.ratio * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="dividerTopology" aria-hidden="true">
                  <span className="dividerTopologyNode">Vin</span>
                  <span className="dividerTopologyResistor">R1</span>
                  <span className="dividerTopologyTap">Vout</span>
                  <span className="dividerTopologyResistor">R2</span>
                  <span className="dividerTopologyNode">GND</span>
                  {dividerResult?.hasLoad && (
                    <span className="dividerTopologyLoad">RL</span>
                  )}
                </div>
              </section>

              <output
                className={`toolkitResult ${
                  dividerResult ? 'ready' : 'invalid'
                }`}
              >
                <span>Output voltage</span>
                <strong>
                  {dividerResult
                    ? `${formatNumber(dividerResult.outputVoltage)} V`
                    : 'Enter positive values'}
                </strong>
                <small>
                  {dividerResult
                    ? `${
                        dividerResult.hasLoad
                          ? `Loaded R2 = ${formatNumber(
                              dividerResult.effectiveLowerResistance,
                            )} kOhm | `
                          : 'Unloaded divider | '
                      }${formatMeasurement(
                        dividerResult.sourceCurrent,
                        'current',
                      )} source current${
                        dividerResult.loadCurrent === null
                          ? ''
                          : ` | ${formatMeasurement(
                              dividerResult.loadCurrent,
                              'current',
                            )} load current`
                      }`
                    : 'Input voltage, R1, R2, and any connected load must be positive.'}
                </small>
              </output>
            </>
          )}
        </div>
      )}

      {mode === 'design' && (
        <div className="toolkitWorkspace designToolkitWorkspace">
          <header className="toolkitSectionHeader">
            <div>
              <span>Component design</span>
              <h3>Size a practical network</h3>
            </div>
            <button
              aria-label={`Reset ${
                designTool === 'led'
                  ? 'LED current-limiter calculator'
                  : 'RC timing calculator'
              }`}
              className="iconButton ghost"
              onClick={handleDesignReset}
              title="Reset values"
              type="button"
            >
              <RefreshCw size={16} />
            </button>
          </header>

          <div
            aria-label="Component design tool"
            className="designToolControl"
            role="group"
          >
            <button
              aria-pressed={designTool === 'led'}
              onClick={() => {
                setDesignTool('led');
                setCopiedDesignTool(null);
              }}
              type="button"
            >
              <Lightbulb size={17} />
              LED limiter
            </button>
            <button
              aria-pressed={designTool === 'rc'}
              onClick={() => {
                setDesignTool('rc');
                setCopiedDesignTool(null);
              }}
              type="button"
            >
              <Timer size={17} />
              RC timing
            </button>
          </div>

          {designTool === 'led' && (
            <>
              <div className="toolkitInputGrid three">
                <label>
                  <span>
                    Supply
                    <small>V</small>
                  </span>
                  <input
                    inputMode="decimal"
                    min="0"
                    onChange={(event) =>
                      setLedSupplyVoltage(event.target.value)
                    }
                    step="any"
                    type="number"
                    value={ledSupplyVoltage}
                  />
                </label>
                <label>
                  <span>
                    LED forward drop
                    <small>V</small>
                  </span>
                  <input
                    inputMode="decimal"
                    min="0"
                    onChange={(event) =>
                      setLedForwardVoltage(event.target.value)
                    }
                    step="any"
                    type="number"
                    value={ledForwardVoltage}
                  />
                </label>
                <label>
                  <span>
                    Target current
                    <small>mA</small>
                  </span>
                  <input
                    inputMode="decimal"
                    min="0"
                    onChange={(event) =>
                      setLedCurrentMilliamps(event.target.value)
                    }
                    step="any"
                    type="number"
                    value={ledCurrentMilliamps}
                  />
                </label>
              </div>

              <section
                aria-label={
                  ledResult
                    ? `Series circuit with ${formatMeasurement(
                        ledResult.recommendedResistance,
                        'resistance',
                      )} resistor and ${formatMeasurement(
                        ledResult.actualCurrent,
                        'current',
                      )} LED current`
                    : 'LED series circuit preview. Supply voltage must exceed LED forward voltage.'
                }
                className={`ledDesignPreview ${ledResult ? 'active' : 'invalid'}`}
              >
                <div className="ledDesignCircuit">
                  <span className="ledDesignSupply">
                    <small>Supply</small>
                    <strong>
                      {ledResult ? `${formatNumber(ledResult.supplyVoltage)} V` : '--'}
                    </strong>
                  </span>
                  <span className="ledDesignWire first"><i /></span>
                  <span className="ledDesignResistor">
                    <i aria-hidden="true" />
                    <small>E24 series</small>
                    <strong>
                      {ledResult
                        ? formatMeasurement(
                            ledResult.recommendedResistance,
                            'resistance',
                          )
                        : '--'}
                    </strong>
                  </span>
                  <span className="ledDesignWire second"><i /></span>
                  <span className="ledDesignDevice">
                    <i aria-hidden="true" />
                    <small>LED current</small>
                    <strong>
                      {ledResult
                        ? formatMeasurement(ledResult.actualCurrent, 'current')
                        : '--'}
                    </strong>
                  </span>
                </div>
              </section>

              <output
                className={`toolkitResult ${ledResult ? 'ready' : 'invalid'}`}
              >
                <span>Recommended series resistor</span>
                <strong>
                  {ledResult
                    ? formatMeasurement(
                        ledResult.recommendedResistance,
                        'resistance',
                      )
                    : 'Check the voltage relationship'}
                </strong>
                <small>
                  {ledResult
                    ? `Ideal ${formatMeasurement(
                        ledResult.idealResistance,
                        'resistance',
                      )}; E24 rounded up | ${formatPower(
                        ledResult.resistorPower,
                      )} dissipated | use at least ${formatNumber(
                        ledResult.recommendedPowerRating,
                      )} W`
                    : 'Use positive values and keep the supply voltage above the LED forward drop.'}
                </small>
              </output>
            </>
          )}

          {designTool === 'rc' && (
            <>
              <div className="toolkitInputGrid">
                <label>
                  <span>
                    Resistance
                    <small>kOhm</small>
                  </span>
                  <input
                    inputMode="decimal"
                    min="0"
                    onChange={(event) =>
                      setRcResistanceKohms(event.target.value)
                    }
                    step="any"
                    type="number"
                    value={rcResistanceKohms}
                  />
                </label>
                <label>
                  <span>
                    Capacitance
                    <small>uF</small>
                  </span>
                  <input
                    inputMode="decimal"
                    min="0"
                    onChange={(event) =>
                      setRcCapacitanceMicrofarads(event.target.value)
                    }
                    step="any"
                    type="number"
                    value={rcCapacitanceMicrofarads}
                  />
                </label>
              </div>

              <section
                aria-label={
                  rcResult
                    ? `RC response with ${formatDuration(
                        rcResult.timeConstant,
                      )} time constant and ${formatNumber(
                        rcResult.cutoffFrequency,
                      )} hertz cutoff`
                    : 'RC response preview'
                }
                className={`rcDesignPreview ${rcResult ? 'active' : 'invalid'}`}
              >
                <div className="rcDesignCurve" aria-hidden="true">
                  <span className="rcAxis horizontal" />
                  <span className="rcAxis vertical" />
                  <svg preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path
                      d="M 0 94 C 8 58, 19 37, 30 24 C 45 8, 68 4, 100 3"
                      pathLength="1"
                    />
                  </svg>
                  <span className="rcTauMarker">
                    <i />
                    <small>1 tau · 63.2%</small>
                  </span>
                </div>
                <div className="rcDesignMetrics">
                  <span>
                    <small>Time constant</small>
                    <strong>
                      {rcResult ? formatDuration(rcResult.timeConstant) : '--'}
                    </strong>
                  </span>
                  <span>
                    <small>Cutoff</small>
                    <strong>
                      {rcResult
                        ? `${formatNumber(rcResult.cutoffFrequency)} Hz`
                        : '--'}
                    </strong>
                  </span>
                  <span>
                    <small>Settled</small>
                    <strong>
                      {rcResult ? formatDuration(rcResult.settlingTime) : '--'}
                    </strong>
                  </span>
                </div>
              </section>

              <output
                className={`toolkitResult ${rcResult ? 'ready' : 'invalid'}`}
              >
                <span>RC time constant</span>
                <strong>
                  {rcResult
                    ? formatDuration(rcResult.timeConstant)
                    : 'Enter positive values'}
                </strong>
                <small>
                  {rcResult
                    ? `tau = R x C | fc = ${formatNumber(
                        rcResult.cutoffFrequency,
                      )} Hz | about ${formatDuration(
                        rcResult.settlingTime,
                      )} to settle within 1%`
                    : 'Resistance and capacitance must both be positive.'}
                </small>
              </output>
            </>
          )}

          <div className="designResultActions">
            <button
              disabled={designTool === 'led' ? !ledResult : !rcResult}
              onClick={() => void handleCopyDesignResult()}
              type="button"
            >
              {copiedDesignTool === designTool ? (
                <Check size={16} />
              ) : (
                <Copy size={16} />
              )}
              {copiedDesignTool === designTool ? 'Copied' : 'Copy result'}
            </button>
            {onSaveCalculation && (
              <button
                disabled={designTool === 'led' ? !ledResult : !rcResult}
                onClick={handleSaveDesignResult}
                type="button"
              >
                <NotebookPen size={16} />
                Send to Field Journal
              </button>
            )}
          </div>
        </div>
      )}

      {mode === 'ac' && (
        <div className="toolkitWorkspace">
          <header className="toolkitSectionHeader">
            <div>
              <span>Frequency response</span>
              <h3>Solve AC reactance</h3>
            </div>
            <button
              aria-label="Reset AC reactance solver"
              className="iconButton ghost"
              onClick={handleReactanceReset}
              title="Reset values"
              type="button"
            >
              <RefreshCw size={16} />
            </button>
          </header>

          <fieldset className="toolkitReactiveControl">
            <legend>Component</legend>
            {(['capacitor', 'inductor'] as ReactiveComponent[]).map(
              (component) => (
                <button
                  aria-pressed={reactiveComponent === component}
                  key={component}
                  onClick={() => handleReactiveComponentChange(component)}
                  type="button"
                >
                  {component === 'capacitor' ? 'Capacitor' : 'Inductor'}
                </button>
              ),
            )}
          </fieldset>

          <div className="toolkitInputGrid four">
            <label>
              <span>
                Frequency
                <small>Hz</small>
              </span>
              <input
                inputMode="decimal"
                min="0"
                onChange={(event) => setReactiveFrequency(event.target.value)}
                step="any"
                type="number"
                value={reactiveFrequency}
              />
            </label>
            <label>
              <span>{reactiveDefinition.label}</span>
              <input
                inputMode="decimal"
                min="0"
                onChange={(event) => setReactiveValue(event.target.value)}
                step="any"
                type="number"
                value={reactiveValue}
              />
            </label>
            <label>
              <span>Unit</span>
              <select
                aria-label={`${reactiveDefinition.label} unit`}
                onChange={(event) => setReactiveUnit(event.target.value)}
                value={reactiveUnit}
              >
                {reactiveDefinition.units.map((unit) => (
                  <option key={unit.label} value={unit.label}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>
                Source
                <small>V RMS</small>
              </span>
              <input
                inputMode="decimal"
                min="0"
                onChange={(event) =>
                  setReactiveSourceVoltage(event.target.value)
                }
                step="any"
                type="number"
                value={reactiveSourceVoltage}
              />
            </label>
          </div>

          <output
            className={`toolkitResult ${
              reactanceResult ? 'ready' : 'invalid'
            }`}
          >
            <span>
              {reactiveComponent === 'capacitor'
                ? 'Capacitive reactance'
                : 'Inductive reactance'}
            </span>
            <strong>
              {reactanceResult
                ? formatMeasurement(reactanceResult.reactance, 'resistance')
                : 'Enter positive values'}
            </strong>
            <small>
              {reactanceResult
                ? `${reactanceResult.formula} | ${formatMeasurement(
                    reactanceResult.current,
                    'current',
                  )} at ${formatNumber(
                    Number(reactiveSourceVoltage),
                  )} V RMS | ${reactanceResult.phase}`
                : 'Frequency, component value, and source voltage must be positive.'}
            </small>
          </output>
        </div>
      )}

      {mode === 'units' && (
        <div className="toolkitWorkspace">
          <header className="toolkitSectionHeader">
            <div>
              <span>SI prefixes</span>
              <h3>Convert engineering units</h3>
            </div>
            <CircleGauge size={21} />
          </header>

          <fieldset className="toolkitQuantityControl">
            <legend>Quantity</legend>
            {(Object.keys(UNIT_DEFINITIONS) as UnitQuantity[]).map((quantity) => (
              <button
                aria-pressed={unitQuantity === quantity}
                key={quantity}
                onClick={() => handleQuantityChange(quantity)}
                type="button"
              >
                {UNIT_DEFINITIONS[quantity].label}
              </button>
            ))}
          </fieldset>

          <label className="toolkitUnitValue">
            <span>Value</span>
            <input
              inputMode="decimal"
              onChange={(event) => setUnitValue(event.target.value)}
              step="any"
              type="number"
              value={unitValue}
            />
          </label>

          <div className="toolkitUnitRow">
            <label>
              <span>From</span>
              <select
                aria-label="Convert from"
                onChange={(event) => setFromUnit(event.target.value)}
                value={fromUnit}
              >
                {unitDefinition.units.map((unit) => (
                  <option key={unit.label} value={unit.label}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              aria-label="Swap conversion units"
              className="toolkitSwapButton"
              onClick={() => {
                setFromUnit(toUnit);
                setToUnit(fromUnit);
              }}
              title="Swap units"
              type="button"
            >
              <ArrowLeftRight size={17} />
            </button>
            <label>
              <span>To</span>
              <select
                aria-label="Convert to"
                onChange={(event) => setToUnit(event.target.value)}
                value={toUnit}
              >
                {unitDefinition.units.map((unit) => (
                  <option key={unit.label} value={unit.label}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <output
            className={`toolkitResult ${convertedValue !== null ? 'ready' : 'invalid'}`}
          >
            <span>{unitDefinition.label}</span>
            <strong>
              {convertedValue !== null
                ? `${formatNumber(convertedValue)} ${toUnit}`
                : 'Enter a valid value'}
            </strong>
            <small>
              {convertedValue !== null
                ? `${formatNumber(Number(unitValue))} ${fromUnit} converted to ${toUnit}`
                : 'The converter accepts positive and negative finite values.'}
            </small>
          </output>
        </div>
      )}
    </section>
  );
}
