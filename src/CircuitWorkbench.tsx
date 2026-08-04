import {
  Activity,
  ArrowLeft,
  BatteryCharging,
  CheckCircle2,
  CircleGauge,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';

export type CircuitMode = 'parallel' | 'series';

export type CircuitResistor = {
  id: string;
  rating: number;
  resistance: number;
};

export type CircuitDesign = {
  id: string;
  mode: CircuitMode;
  name: string;
  resistors: CircuitResistor[];
  savedAt: number;
  voltage: number;
};

type CircuitResult = {
  current: number;
  overloaded: boolean;
  power: number;
  resistor: CircuitResistor;
  voltage: number;
};

type CircuitWorkbenchProps = {
  initialDesign?: CircuitDesign;
  onBack: () => void;
  onDelete: (designId: string) => void;
  onSave: (design: CircuitDesign) => void;
  savedDesigns: CircuitDesign[];
};

const DEFAULT_DESIGN: CircuitDesign = {
  id: 'workbench-draft',
  mode: 'series',
  name: 'Bench circuit',
  resistors: [
    { id: 'r1', rating: 0.5, resistance: 100 },
    { id: 'r2', rating: 0.5, resistance: 220 },
  ],
  savedAt: 0,
  voltage: 9,
};

const RESISTOR_RATINGS = [0.25, 0.5, 1, 2, 5];

function cloneDesign(design: CircuitDesign): CircuitDesign {
  return {
    ...design,
    id: 'workbench-draft',
    resistors: design.resistors.map((resistor) => ({ ...resistor })),
    savedAt: 0,
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function formatResistance(value: number) {
  return value >= 1000
    ? `${(value / 1000).toFixed(value >= 10_000 ? 0 : 2)} kOhm`
    : `${value.toFixed(value >= 100 ? 0 : 1)} Ohm`;
}

function formatCurrent(value: number) {
  return value >= 1 ? `${value.toFixed(2)} A` : `${(value * 1000).toFixed(1)} mA`;
}

function formatPower(value: number) {
  return value >= 1 ? `${value.toFixed(2)} W` : `${(value * 1000).toFixed(1)} mW`;
}

function calculateCircuit(design: CircuitDesign) {
  const resistances = design.resistors.map((resistor) =>
    Math.max(1, resistor.resistance),
  );
  const totalResistance =
    design.mode === 'series'
      ? resistances.reduce((sum, resistance) => sum + resistance, 0)
      : 1 /
        resistances.reduce((sum, resistance) => sum + 1 / resistance, 0);
  const totalCurrent = design.voltage / totalResistance;
  const results: CircuitResult[] = design.resistors.map((resistor) => {
    const resistance = Math.max(1, resistor.resistance);
    const current =
      design.mode === 'series' ? totalCurrent : design.voltage / resistance;
    const voltage =
      design.mode === 'series' ? current * resistance : design.voltage;
    const power = current * current * resistance;

    return {
      current,
      overloaded: power > resistor.rating,
      power,
      resistor,
      voltage,
    };
  });

  return {
    overloadedCount: results.filter((result) => result.overloaded).length,
    results,
    totalCurrent,
    totalPower: design.voltage * totalCurrent,
    totalResistance,
  };
}

function CircuitWorkbenchSchematic({
  design,
  results,
  totalCurrent,
}: {
  design: CircuitDesign;
  results: CircuitResult[];
  totalCurrent: number;
}) {
  const positions = design.resistors.map((_, index) => {
    if (design.resistors.length === 1) {
      return 480;
    }

    return 250 + (index * 470) / (design.resistors.length - 1);
  });

  return (
    <svg
      aria-label={`${design.mode} resistor circuit schematic`}
      className="workbenchSchematic"
      role="img"
      viewBox="0 0 900 420"
    >
      <rect className="workbenchSchematicSurface" height="420" width="900" x="0" y="0" />
      <text className="workbenchSchematicTitle" x="34" y="38">
        {design.mode === 'series' ? 'SERIES DC NETWORK' : 'PARALLEL DC NETWORK'}
      </text>
      <text className="workbenchSchematicMeta" textAnchor="end" x="866" y="38">
        I(total) = {formatCurrent(totalCurrent)}
      </text>

      <line className="circuitWire" x1="90" x2="90" y1="80" y2="176" />
      <line className="circuitWire" x1="90" x2="90" y1="244" y2="340" />
      <line className="batteryPlate positive" x1="48" x2="132" y1="186" y2="186" />
      <line className="batteryPlate negative" x1="62" x2="118" y1="232" y2="232" />
      <text className="batteryPolarity" x="143" y="192">+</text>
      <text className="batteryPolarity" x="143" y="239">-</text>
      <text className="circuitComponentLabel" textAnchor="middle" x="90" y="286">
        {design.voltage.toFixed(1)} V DC
      </text>

      {design.mode === 'series' ? (
        <>
          <line className="circuitWire" x1="90" x2={positions[0] - 46} y1="80" y2="80" />
          {positions.map((position, index) => {
            const nextPosition = positions[index + 1];
            const result = results[index];

            return (
              <g key={result.resistor.id}>
                <rect
                  className={`circuitResistor ${result.overloaded ? 'overloaded' : ''}`}
                  height="46"
                  width="92"
                  x={position - 46}
                  y="57"
                />
                <text className="circuitResistorName" textAnchor="middle" x={position} y="50">
                  R{index + 1}
                </text>
                <text className="circuitResistorValue" textAnchor="middle" x={position} y="85">
                  {formatResistance(result.resistor.resistance)}
                </text>
                <text className="circuitReading" textAnchor="middle" x={position} y="126">
                  {result.voltage.toFixed(2)} V / {formatPower(result.power)}
                </text>
                <line
                  className="circuitWire"
                  x1={position + 46}
                  x2={nextPosition ? nextPosition - 46 : 810}
                  y1="80"
                  y2="80"
                />
              </g>
            );
          })}
          <line className="circuitWire" x1="810" x2="810" y1="80" y2="340" />
          <line className="circuitWire" x1="810" x2="90" y1="340" y2="340" />
          <path
            className="workbenchCurrentTrace"
            d="M 104 80 H 796 V 340 H 104"
            pathLength="100"
          />
        </>
      ) : (
        <>
          <line className="circuitWire" x1="90" x2="810" y1="80" y2="80" />
          <line className="circuitWire" x1="90" x2="810" y1="340" y2="340" />
          {positions.map((position, index) => {
            const result = results[index];

            return (
              <g key={result.resistor.id}>
                <line className="circuitWire" x1={position} x2={position} y1="80" y2="164" />
                <rect
                  className={`circuitResistor ${result.overloaded ? 'overloaded' : ''}`}
                  height="92"
                  width="52"
                  x={position - 26}
                  y="164"
                />
                <line className="circuitWire" x1={position} x2={position} y1="256" y2="340" />
                <text className="circuitResistorName" textAnchor="middle" x={position} y="148">
                  R{index + 1}
                </text>
                <text
                  className="circuitResistorValue vertical"
                  textAnchor="middle"
                  transform={`rotate(-90 ${position} 210)`}
                  x={position}
                  y="214"
                >
                  {formatResistance(result.resistor.resistance)}
                </text>
                <text className="circuitReading" textAnchor="middle" x={position} y="285">
                  {formatCurrent(result.current)}
                </text>
                <path
                  className="workbenchBranchTrace"
                  d={`M ${position} 92 V 328`}
                  pathLength="100"
                />
              </g>
            );
          })}
          <path
            className="workbenchCurrentTrace"
            d="M 104 80 H 796"
            pathLength="100"
          />
        </>
      )}

      <text className="workbenchSafetyLabel" x="34" y="392">
        COMPONENT POWER IS CHECKED AGAINST THE SELECTED WATTAGE RATING
      </text>
    </svg>
  );
}

export function CircuitWorkbench({
  initialDesign,
  onBack,
  onDelete,
  onSave,
  savedDesigns,
}: CircuitWorkbenchProps) {
  const [design, setDesign] = useState<CircuitDesign>(() =>
    cloneDesign(initialDesign ?? DEFAULT_DESIGN),
  );
  const [validation, setValidation] = useState<'idle' | 'overload' | 'safe'>('idle');
  const calculation = useMemo(() => calculateCircuit(design), [design]);

  function updateDesign(
    updater: (currentDesign: CircuitDesign) => CircuitDesign,
  ) {
    setValidation('idle');
    setDesign(updater);
  }

  function handleModeChange(mode: CircuitMode) {
    updateDesign((currentDesign) => ({ ...currentDesign, mode }));
  }

  function handleVoltageChange(voltage: number) {
    updateDesign((currentDesign) => ({
      ...currentDesign,
      voltage: clamp(Number.isFinite(voltage) ? voltage : 1, 1, 24),
    }));
  }

  function handleResistorChange(
    resistorId: string,
    patch: Partial<CircuitResistor>,
  ) {
    updateDesign((currentDesign) => ({
      ...currentDesign,
      resistors: currentDesign.resistors.map((resistor) =>
        resistor.id === resistorId
          ? {
              ...resistor,
              ...patch,
              resistance:
                patch.resistance === undefined
                  ? resistor.resistance
                  : clamp(
                      Number.isFinite(patch.resistance) ? patch.resistance : 1,
                      1,
                      10_000,
                    ),
            }
          : resistor,
      ),
    }));
  }

  function handleAddResistor() {
    if (design.resistors.length >= 4) {
      return;
    }

    updateDesign((currentDesign) => ({
      ...currentDesign,
      resistors: [
        ...currentDesign.resistors,
        {
          id: `r${Date.now()}`,
          rating: 0.5,
          resistance: 330,
        },
      ],
    }));
  }

  function handleRemoveResistor(resistorId: string) {
    if (design.resistors.length <= 1) {
      return;
    }

    updateDesign((currentDesign) => ({
      ...currentDesign,
      resistors: currentDesign.resistors.filter(
        (resistor) => resistor.id !== resistorId,
      ),
    }));
  }

  function handleReset() {
    setDesign(cloneDesign(DEFAULT_DESIGN));
    setValidation('idle');
  }

  function handleLoadDesign(savedDesign: CircuitDesign) {
    setDesign(cloneDesign(savedDesign));
    setValidation('idle');
  }

  function handleValidate() {
    setValidation(
      calculation.overloadedCount === 0 ? 'safe' : 'overload',
    );
  }

  return (
    <section className="circuitWorkbenchPage" aria-label="Circuit workbench">
      <header className="workbenchHeader">
        <button
          className="secondaryButton compactHeaderBack"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          Back to labs
        </button>
        <div>
          <p className="eyebrow">Build Mode</p>
          <h1>Circuit Workbench</h1>
          <p>Series and parallel DC network design.</p>
        </div>
        <div className={`workbenchHeaderStatus ${calculation.overloadedCount > 0 ? 'warning' : ''}`}>
          {calculation.overloadedCount > 0 ? (
            <TriangleAlert size={20} />
          ) : (
            <ShieldCheck size={20} />
          )}
          <span>
            <small>Live status</small>
            <strong>
              {calculation.overloadedCount > 0
                ? `${calculation.overloadedCount} overload`
                : 'Within ratings'}
            </strong>
          </span>
        </div>
      </header>

      <section className="workbenchMetricBand" aria-label="Circuit metrics">
        <div>
          <CircleGauge size={19} />
          <span>Total resistance</span>
          <strong>{formatResistance(calculation.totalResistance)}</strong>
        </div>
        <div>
          <Activity size={19} />
          <span>Source current</span>
          <strong>{formatCurrent(calculation.totalCurrent)}</strong>
        </div>
        <div>
          <Zap size={19} />
          <span>Total power</span>
          <strong>{formatPower(calculation.totalPower)}</strong>
        </div>
        <div>
          <BatteryCharging size={19} />
          <span>Source</span>
          <strong>{design.voltage.toFixed(1)} V DC</strong>
        </div>
      </section>

      <div className="workbenchLayout">
        <section className="workbenchStage" aria-label="Live circuit schematic and results">
          <header>
            <div>
              <p className="eyebrow">Live schematic</p>
              <h2>{design.name || 'Untitled circuit'}</h2>
            </div>
            <span>{design.mode} network</span>
          </header>

          <div className="workbenchSchematicFrame">
            <CircuitWorkbenchSchematic
              design={design}
              results={calculation.results}
              totalCurrent={calculation.totalCurrent}
            />
          </div>

          <section className="workbenchResultTable" aria-label="Component results">
            <header>
              <span>Component</span>
              <span>Voltage</span>
              <span>Current</span>
              <span>Power / rating</span>
              <span>Status</span>
            </header>
            {calculation.results.map((result, index) => (
              <div className={result.overloaded ? 'overloaded' : ''} key={result.resistor.id}>
                <strong>R{index + 1} · {formatResistance(result.resistor.resistance)}</strong>
                <span>{result.voltage.toFixed(2)} V</span>
                <span>{formatCurrent(result.current)}</span>
                <span>
                  {formatPower(result.power)} / {result.resistor.rating} W
                </span>
                <em>
                  {result.overloaded ? (
                    <>
                      <TriangleAlert size={14} />
                      Overload
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      Safe
                    </>
                  )}
                </em>
              </div>
            ))}
          </section>
        </section>

        <aside className="workbenchControls" aria-label="Circuit controls">
          <header>
            <span>
              <Activity size={21} />
            </span>
            <div>
              <p className="eyebrow">Design controls</p>
              <h2>Network setup</h2>
            </div>
            <button
              aria-label="Reset workbench"
              onClick={handleReset}
              title="Reset workbench"
              type="button"
            >
              <RotateCcw size={17} />
            </button>
          </header>

          <label className="workbenchNameField">
            <span>Design name</span>
            <input
              maxLength={42}
              onChange={(event) => {
                const name = event.currentTarget.value;
                updateDesign((currentDesign) => ({
                  ...currentDesign,
                  name,
                }));
              }}
              type="text"
              value={design.name}
            />
          </label>

          <fieldset className="workbenchModeSwitch">
            <legend>Topology</legend>
            <div>
              {(['series', 'parallel'] as CircuitMode[]).map((mode) => (
                <button
                  aria-pressed={design.mode === mode}
                  className={design.mode === mode ? 'active' : ''}
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  type="button"
                >
                  {mode}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="workbenchVoltageControl">
            <span>
              <strong>Source voltage</strong>
              <input
                aria-label="Source voltage value"
                max="24"
                min="1"
                onChange={(event) =>
                  handleVoltageChange(Number(event.currentTarget.value))
                }
                step="0.5"
                type="number"
                value={design.voltage}
              />
            </span>
            <input
              aria-label="Source voltage"
              max="24"
              min="1"
              onInput={(event) =>
                handleVoltageChange(Number(event.currentTarget.value))
              }
              step="0.5"
              type="range"
              value={design.voltage}
            />
          </label>

          <section className="workbenchResistorControls" aria-label="Resistor controls">
            <header>
              <span>Components</span>
              <button
                disabled={design.resistors.length >= 4}
                onClick={handleAddResistor}
                type="button"
              >
                <Plus size={15} />
                Add resistor
              </button>
            </header>

            <div>
              {design.resistors.map((resistor, index) => (
                <div className="workbenchResistorRow" key={resistor.id}>
                  <strong>R{index + 1}</strong>
                  <label>
                    <span>Resistance</span>
                    <input
                      aria-label={`R${index + 1} resistance`}
                      max="10000"
                      min="1"
                      onChange={(event) =>
                        handleResistorChange(resistor.id, {
                          resistance: Number(event.currentTarget.value),
                        })
                      }
                      step="1"
                      type="number"
                      value={resistor.resistance}
                    />
                  </label>
                  <label>
                    <span>Rating</span>
                    <select
                      aria-label={`R${index + 1} power rating`}
                      onChange={(event) =>
                        handleResistorChange(resistor.id, {
                          rating: Number(event.currentTarget.value),
                        })
                      }
                      value={resistor.rating}
                    >
                      {RESISTOR_RATINGS.map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} W
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    aria-label={`Remove R${index + 1}`}
                    disabled={design.resistors.length <= 1}
                    onClick={() => handleRemoveResistor(resistor.id)}
                    title={`Remove R${index + 1}`}
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {validation !== 'idle' && (
            <div className={`workbenchValidation ${validation}`}>
              {validation === 'safe' ? (
                <ShieldCheck size={19} />
              ) : (
                <TriangleAlert size={19} />
              )}
              <div>
                <strong>
                  {validation === 'safe'
                    ? 'Design passes rating check'
                    : 'Component rating exceeded'}
                </strong>
                <small>
                  {validation === 'safe'
                    ? 'Every resistor remains within its selected wattage.'
                    : 'Raise the resistance or wattage rating before saving.'}
                </small>
              </div>
            </div>
          )}

          <div className="workbenchActionRow">
            <button className="secondaryButton" onClick={handleValidate} type="button">
              <ShieldCheck size={16} />
              Validate
            </button>
            <button
              className="primaryButton"
              disabled={validation !== 'safe'}
              onClick={() => onSave(design)}
              type="button"
            >
              <Save size={16} />
              Save design
            </button>
          </div>

          <section className="savedCircuitShelf" aria-label="Saved circuit designs">
            <header>
              <span>Saved designs</span>
              <strong>{savedDesigns.length}/6</strong>
            </header>
            {savedDesigns.length === 0 ? (
              <p>No validated designs saved.</p>
            ) : (
              <div>
                {savedDesigns.map((savedDesign) => (
                  <div key={savedDesign.id}>
                    <button
                      onClick={() => handleLoadDesign(savedDesign)}
                      type="button"
                    >
                      <strong>{savedDesign.name}</strong>
                      <small>
                        {savedDesign.mode} · {savedDesign.voltage} V ·{' '}
                        {savedDesign.resistors.length}R
                      </small>
                    </button>
                    <button
                      aria-label={`Delete ${savedDesign.name}`}
                      onClick={() => onDelete(savedDesign.id)}
                      title={`Delete ${savedDesign.name}`}
                      type="button"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
