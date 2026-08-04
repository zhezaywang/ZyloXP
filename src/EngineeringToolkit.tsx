import {
  Activity,
  ArrowLeftRight,
  Calculator,
  CircleGauge,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type ToolkitMode = 'ac' | 'ohm' | 'power' | 'units';
type ElectricalVariable = 'current' | 'resistance' | 'voltage';
type ReactiveComponent = 'capacitor' | 'inductor';
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

export function EngineeringToolkit() {
  const [mode, setMode] = useState<ToolkitMode>('ohm');
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
          aria-pressed={mode === 'units'}
          onClick={() => setMode('units')}
          type="button"
        >
          <ArrowLeftRight size={17} />
          Units
        </button>
        <button
          aria-pressed={mode === 'ac'}
          onClick={() => setMode('ac')}
          type="button"
        >
          <Activity size={17} />
          AC
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
