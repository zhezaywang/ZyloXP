import {
  Activity,
  ArrowLeftRight,
  Clock3,
  Download,
  History,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { LabSimulationValues } from './labMetrics';
import { formatBenchNumber } from './labRunHistory';
import { useModalFocus } from './useModalFocus';
import './LabBenchLog.css';

export type LabRunSnapshot = {
  id: string;
  labId: string;
  output: string;
  savedAt: number;
  values: LabSimulationValues;
};

type LabBenchLogProps = {
  currentOutput: string;
  currentValues: LabSimulationValues;
  labId: string;
  labTitle: string;
  onClose: () => void;
  onDelete: (runId: string) => void;
  onRestore: (run: LabRunSnapshot) => void;
  runs: LabRunSnapshot[];
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

type LabReading = {
  decimals: number;
  label: string;
  unit: string;
  value: number;
};

function getLabReadings(
  labId: string,
  values: LabSimulationValues,
): LabReading[] {
  if (labId === 'lab-ohms') {
    return [
      {
        decimals: 0,
        label: 'Voltage',
        unit: 'V',
        value: values.voltage,
      },
      {
        decimals: 0,
        label: 'Resistance',
        unit: 'Ω',
        value: values.resistance,
      },
    ];
  }

  if (labId === 'lab-rc') {
    return [
      {
        decimals: 0,
        label: 'Resistance',
        unit: 'kΩ',
        value: values.rcResistance,
      },
      {
        decimals: 0,
        label: 'Capacitance',
        unit: 'µF',
        value: values.capacitance,
      },
    ];
  }

  if (labId === 'lab-filter') {
    return [
      {
        decimals: 0,
        label: 'Resistance',
        unit: 'kΩ',
        value: values.rcResistance,
      },
      {
        decimals: 0,
        label: 'Capacitance',
        unit: 'µF',
        value: values.capacitance,
      },
      {
        decimals: 0,
        label: 'Frequency',
        unit: 'Hz',
        value: values.filterFrequency,
      },
    ];
  }

  if (labId === 'lab-resonance') {
    return [
      {
        decimals: 0,
        label: 'Sweep frequency',
        unit: 'Hz',
        value: values.resonanceFrequency,
      },
      {
        decimals: 0,
        label: 'Inductance',
        unit: 'mH',
        value: values.resonanceInductance,
      },
      {
        decimals: 2,
        label: 'Capacitance',
        unit: 'µF',
        value: values.resonanceCapacitance,
      },
      {
        decimals: 0,
        label: 'Series resistance',
        unit: 'Ω',
        value: values.resonanceResistance,
      },
      {
        decimals: 1,
        label: 'Source level',
        unit: 'V RMS',
        value: values.resonanceSourceVoltage,
      },
    ];
  }

  if (labId === 'lab-digital') {
    return [
      {
        decimals: 0,
        label: 'Clock frequency',
        unit: 'MHz',
        value: values.digitalClockFrequency,
      },
      {
        decimals: 0,
        label: 'Propagation delay',
        unit: 'ns',
        value: values.digitalPropagationDelay,
      },
      {
        decimals: 0,
        label: 'Setup time',
        unit: 'ns',
        value: values.digitalSetupTime,
      },
    ];
  }

  if (labId === 'lab-opamp') {
    return [
      {
        decimals: 2,
        label: 'Input amplitude',
        unit: 'Vpk',
        value: values.opAmpInputVoltage,
      },
      {
        decimals: 0,
        label: 'Input resistance',
        unit: 'kΩ',
        value: values.opAmpInputResistance,
      },
      {
        decimals: 0,
        label: 'Feedback resistance',
        unit: 'kΩ',
        value: values.opAmpFeedbackResistance,
      },
      {
        decimals: 0,
        label: 'Supply rails',
        unit: 'V',
        value: values.opAmpSupplyVoltage,
      },
    ];
  }

  if (labId === 'lab-bjt') {
    return [
      {
        decimals: 0,
        label: 'Base current',
        unit: 'µA',
        value: values.bjtBaseCurrent,
      },
      {
        decimals: 0,
        label: 'Device beta',
        unit: '',
        value: values.bjtCurrentGain,
      },
      {
        decimals: 1,
        label: 'Collector resistance',
        unit: 'kΩ',
        value: values.bjtCollectorResistance,
      },
      {
        decimals: 1,
        label: 'Collector supply',
        unit: 'V',
        value: values.bjtSupplyVoltage,
      },
      {
        decimals: 0,
        label: 'Ambient temperature',
        unit: '°C',
        value: values.bjtTemperature,
      },
    ];
  }

  if (labId === 'lab-mosfet') {
    return [
      {
        decimals: 1,
        label: 'Gate voltage',
        unit: 'V',
        value: values.mosfetGateVoltage,
      },
      {
        decimals: 0,
        label: 'Gate resistance',
        unit: 'Ω',
        value: values.mosfetGateResistance,
      },
      {
        decimals: 0,
        label: 'Switching frequency',
        unit: 'kHz',
        value: values.mosfetSwitchingFrequency,
      },
      {
        decimals: 0,
        label: 'DC bus',
        unit: 'V',
        value: values.mosfetBusVoltage,
      },
      {
        decimals: 0,
        label: 'Load resistance',
        unit: 'Ω',
        value: values.mosfetLoadResistance,
      },
      {
        decimals: 0,
        label: 'Duty cycle',
        unit: '%',
        value: values.mosfetDutyCycle,
      },
    ];
  }

  if (labId === 'lab-pid') {
    return [
      {
        decimals: 2,
        label: 'Proportional gain',
        unit: '',
        value: values.pidProportionalGain,
      },
      {
        decimals: 2,
        label: 'Integral gain',
        unit: 's⁻¹',
        value: values.pidIntegralGain,
      },
      {
        decimals: 2,
        label: 'Derivative gain',
        unit: 's',
        value: values.pidDerivativeGain,
      },
      {
        decimals: 1,
        label: 'Plant time constant',
        unit: 's',
        value: values.pidPlantTimeConstant,
      },
      {
        decimals: 0,
        label: 'Position command',
        unit: '°',
        value: values.pidSetpoint,
      },
    ];
  }

  if (labId === 'lab-adc') {
    return [
      {
        decimals: 1,
        label: 'Input frequency',
        unit: 'kHz',
        value: values.adcInputFrequency,
      },
      {
        decimals: 1,
        label: 'Sample rate',
        unit: 'kS/s',
        value: values.adcSampleRate,
      },
      {
        decimals: 0,
        label: 'Resolution',
        unit: 'bit',
        value: values.adcBitDepth,
      },
      {
        decimals: 1,
        label: 'Reference',
        unit: 'V',
        value: values.adcReferenceVoltage,
      },
      {
        decimals: 2,
        label: 'Input amplitude',
        unit: 'Vpk',
        value: values.adcInputAmplitude,
      },
      {
        decimals: 1,
        label: 'Filter cutoff',
        unit: 'kHz',
        value: values.adcFilterCutoff,
      },
    ];
  }

  if (labId === 'lab-transformer') {
    return [
      {
        decimals: 0,
        label: 'Primary voltage',
        unit: 'V',
        value: values.transformerPrimaryVoltage,
      },
      {
        decimals: 0,
        label: 'Frequency',
        unit: 'Hz',
        value: values.transformerFrequency,
      },
      {
        decimals: 0,
        label: 'Primary turns',
        unit: 'turns',
        value: values.transformerPrimaryTurns,
      },
      {
        decimals: 0,
        label: 'Secondary turns',
        unit: 'turns',
        value: values.transformerSecondaryTurns,
      },
      {
        decimals: 1,
        label: 'Core area',
        unit: 'cm²',
        value: values.transformerCoreArea,
      },
      {
        decimals: 1,
        label: 'Load resistance',
        unit: 'Ω',
        value: values.transformerLoadResistance,
      },
      {
        decimals: 2,
        label: 'Winding resistance',
        unit: 'Ω',
        value: values.transformerWindingResistance,
      },
    ];
  }

  if (labId === 'lab-transmission') {
    return [
      {
        decimals: 0,
        label: 'Line impedance',
        unit: 'Ω',
        value: values.transmissionCharacteristicImpedance,
      },
      {
        decimals: 0,
        label: 'Load impedance',
        unit: 'Ω',
        value: values.transmissionLoadImpedance,
      },
      {
        decimals: 0,
        label: 'Electrical length',
        unit: '°',
        value: values.transmissionElectricalLength,
      },
    ];
  }

  return [
    {
      decimals: 0,
      label: 'Line voltage',
      unit: 'V',
      value: values.lineVoltage,
    },
    {
      decimals: 0,
      label: 'Line current',
      unit: 'A',
      value: values.lineCurrent,
    },
    {
      decimals: 2,
      label: 'Power factor',
      unit: '',
      value: values.powerFactor,
    },
  ];
}

function formatReading(reading: LabReading) {
  return `${formatBenchNumber(reading.value, reading.decimals)}${
    reading.unit ? ` ${reading.unit}` : ''
  }`;
}

export function getComparisonRows(
  labId: string,
  baseline: LabSimulationValues,
  comparison: LabSimulationValues,
) {
  const baselineReadings = getLabReadings(labId, baseline);
  return getLabReadings(labId, comparison).map((reading, index) => {
    const before = baselineReadings[index].value;
    const delta = reading.value - before;
    const changed = Math.abs(delta) > Number.EPSILON * 8 * Math.max(1, Math.abs(reading.value), Math.abs(before));
    return { ...reading, baseline: before, delta: changed ? delta : 0, changed };
  });
}

type ComparisonSetup = {
  label: string;
  output: string;
  recordedAt: number | null;
  values: LabSimulationValues;
};

export function createLabComparisonCsv(
  labId: string,
  labTitle: string,
  baseline: ComparisonSetup,
  comparison: ComparisonSetup,
) {
  const rows: (string | number)[][] = [
    ['Lab', labTitle],
    ['Exported at', new Date().toISOString()],
    ['Baseline', baseline.label],
    ['Baseline recorded at', baseline.recordedAt === null ? 'Live at export' : new Date(baseline.recordedAt).toISOString()],
    ['Comparison', comparison.label],
    ['Comparison recorded at', comparison.recordedAt === null ? 'Live at export' : new Date(comparison.recordedAt).toISOString()],
    [],
    ['Setting', 'Unit', 'Baseline', 'Comparison', 'Change'],
    ...getComparisonRows(labId, baseline.values, comparison.values).map((row) =>
      [row.label, row.unit, row.baseline, row.value, Number(row.delta.toPrecision(15))]),
    ['Output', '', baseline.output, comparison.output, ''],
  ];
  return '\uFEFF' + rows.map((row) => row.map((cell) => {
    if (typeof cell === 'number') return String(cell);
    // Keep imported labels or output text from becoming spreadsheet formulas.
    const text = /^[\s]*[=+@-]/.test(cell) ? `'${cell}` : cell;
    return `"${text.replaceAll('"', '""')}"`;
  }).join(',')).join('\r\n') + '\r\n';
}

function formatRunTime(savedAt: number) {
  const savedDate = new Date(savedAt);
  const today = new Date();
  const isToday = savedDate.toDateString() === today.toDateString();
  const time = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(savedDate);

  if (isToday) {
    return `Today, ${time}`;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(savedDate);
}

export function getComparison(
  labId: string,
  currentValues: LabSimulationValues,
  savedValues: LabSimulationValues,
) {
  const changes = getComparisonRows(labId, savedValues, currentValues).flatMap((reading) => {
    if (!reading.changed) {
      return [];
    }

    const sign = reading.delta > 0 ? '+' : '−';
    return [
      `${reading.label} ${sign}${formatBenchNumber(Math.abs(reading.delta), reading.decimals)}${
        reading.unit ? ` ${reading.unit}` : ''
      }`,
    ];
  });

  return changes.length > 0
    ? changes.join(' · ')
    : 'Matches the latest saved run';
}

export function LabBenchLog({
  currentOutput,
  currentValues,
  labId,
  labTitle,
  onClose,
  onDelete,
  onRestore,
  runs,
  returnFocusRef,
}: LabBenchLogProps) {
  const currentReadings = getLabReadings(labId, currentValues);
  const latestRun = runs[0] ?? null;
  const [baselineKey, setBaselineKey] = useState(latestRun ? `saved:${latestRun.id}` : 'live');
  const [comparisonKey, setComparisonKey] = useState('live');
  const [changesOnly, setChangesOnly] = useState(false);
  const [exportError, setExportError] = useState('');
  const setups = [
    { key: 'live', label: 'Live setup', output: currentOutput, recordedAt: null, values: currentValues },
    ...runs.map((run, index) => ({
      key: `saved:${run.id}`,
      label: `Run ${runs.length - index} / ${formatRunTime(run.savedAt)}`,
      output: run.output,
      recordedAt: run.savedAt,
      values: run.values,
    })),
  ];
  // A deleted selection falls back to live values, never to a differently labelled run.
  const baseline = setups.find((setup) => setup.key === baselineKey) ?? setups[0];
  const comparison = setups.find((setup) => setup.key === comparisonKey) ?? setups[0];
  const rows = getComparisonRows(labId, baseline.values, comparison.values);
  const changedCount = rows.filter((row) => row.changed).length;
  const visibleRows = changesOnly ? rows.filter((row) => row.changed) : rows;
  const dialogRef = useRef<HTMLElement>(null);
  useModalFocus(dialogRef, true, onClose, returnFocusRef);

  function downloadComparison() {
    let url: string | null = null;
    const link = document.createElement('a');
    try {
      const csv = createLabComparisonCsv(labId, labTitle, baseline, comparison);
      url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      link.href = url;
      link.download = `zyloxp-${labId.replace(/[^a-z0-9-]/gi, '-')}-comparison.csv`;
      document.body.appendChild(link);
      link.click();
      setExportError('');
    } catch {
      setExportError('The comparison could not be downloaded. Try again.');
    } finally {
      link.remove();
      if (url) {
        const objectUrl = url;
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      }
    }
  }

  return (
    <div
      className="labBenchBackdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-labelledby="lab-bench-log-title"
        aria-modal="true"
        className="labBenchDialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="labBenchHeader">
          <span className="labBenchHeaderIcon">
            <History size={22} />
          </span>
          <div>
            <p>{labTitle}</p>
            <h2 id="lab-bench-log-title">Bench Log</h2>
          </div>
          <button
            aria-label="Close bench log"
            className="iconButton"
            onClick={onClose}
            title="Close"
            type="button"
          >
            <XCircle size={19} />
          </button>
        </header>

        <div className="labBenchBody">
          <section className="labBenchCurrent" aria-label="Current lab setup">
            <div className="labBenchCurrentOutput">
              <span>Live output</span>
              <strong>{currentOutput}</strong>
            </div>
            <dl className="labBenchValueList">
              {currentReadings.map((reading) => (
                <div key={reading.label}>
                  <dt>{reading.label}</dt>
                  <dd>{formatReading(reading)}</dd>
                </div>
              ))}
            </dl>
            <p className="labBenchComparison">
              <Activity size={16} />
              <span>
                {latestRun
                  ? `Live vs latest save: ${getComparison(labId, currentValues, latestRun.values)}`
                  : 'No saved comparison yet'}
              </span>
            </p>
          </section>

          {runs.length > 0 && (
            <section className="labRunComparison" aria-labelledby="lab-comparison-title">
              <header>
                <h3 id="lab-comparison-title">Compare setups</h3>
                <div className="labComparisonActions">
                  <button
                    aria-label="Swap baseline and comparison"
                    className="iconButton"
                    disabled={baseline.key === comparison.key}
                    onClick={() => {
                      setBaselineKey(comparison.key);
                      setComparisonKey(baseline.key);
                    }}
                    title="Swap baseline and comparison"
                    type="button"
                  >
                    <ArrowLeftRight size={17} />
                  </button>
                  <button
                    aria-label="Download comparison CSV"
                    className="iconButton"
                    onClick={downloadComparison}
                    title="Download comparison CSV"
                    type="button"
                  >
                    <Download size={17} />
                  </button>
                </div>
              </header>
              <div className="labComparisonSelectors">
                <label>
                  Baseline
                  <select value={baseline.key} onChange={(event) => setBaselineKey(event.target.value)}>
                    {setups.map((setup) => <option key={setup.key} value={setup.key}>{setup.label}</option>)}
                  </select>
                </label>
                <label>
                  Compare with
                  <select value={comparison.key} onChange={(event) => setComparisonKey(event.target.value)}>
                    {setups.map((setup) => <option key={setup.key} value={setup.key}>{setup.label}</option>)}
                  </select>
                </label>
              </div>
              <div className="labComparisonSummary">
                <span role="status">{changedCount} of {rows.length} settings changed</span>
                <label>
                  <input type="checkbox" checked={changesOnly} onChange={(event) => setChangesOnly(event.target.checked)} />
                  Changes only
                </label>
              </div>
              <table className="labComparisonTable" aria-label="Lab setup differences">
                <thead>
                  <tr><th scope="col">Setting</th><th scope="col">Baseline</th><th scope="col">Comparison</th><th scope="col">Change</th></tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.label} data-changed={row.changed}>
                      <th scope="row">{row.label}</th>
                      <td>{formatReading({ ...row, value: row.baseline })}</td>
                      <td>{formatReading(row)}</td>
                      <td>{row.changed
                        ? `${row.delta > 0 ? '+' : '−'}${formatReading({ ...row, value: Math.abs(row.delta) })}`
                        : 'No change'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleRows.length === 0 && <p className="labComparisonEmpty">No settings changed.</p>}
              <dl className="labComparisonOutputs">
                <div><dt>Baseline output</dt><dd>{baseline.output}</dd></div>
                <div><dt>Comparison output</dt><dd>{comparison.output}</dd></div>
              </dl>
              {exportError && <p className="labComparisonError" role="alert">{exportError}</p>}
            </section>
          )}

          <div className="labBenchListHeading">
            <div>
              <h3>Saved runs</h3>
              <span>{runs.length} recorded</span>
            </div>
          </div>

          <div className="labBenchRuns" aria-live="polite">
            {runs.length > 0 ? (
              runs.map((run, index) => {
                const readings = getLabReadings(labId, run.values);

                return (
                  <article className="labBenchRun" key={run.id}>
                    <div className="labBenchRunMain">
                      <span className="labBenchRunIndex">
                        {String(runs.length - index).padStart(2, '0')}
                      </span>
                      <div>
                        <time dateTime={new Date(run.savedAt).toISOString()}>
                          <Clock3 size={14} />
                          {formatRunTime(run.savedAt)}
                        </time>
                        <strong>{run.output}</strong>
                      </div>
                    </div>

                    <dl className="labBenchRunValues">
                      {readings.map((reading) => (
                        <div key={reading.label}>
                          <dt>{reading.label}</dt>
                          <dd>{formatReading(reading)}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="labBenchRunActions">
                      <button
                        className="secondaryButton"
                        onClick={() => {
                          onRestore(run);
                          onClose();
                        }}
                        type="button"
                      >
                        <RotateCcw size={16} />
                        Restore
                      </button>
                      <button
                        aria-label={`Delete run from ${formatRunTime(run.savedAt)}`}
                        className="labBenchDeleteButton"
                        onClick={() => onDelete(run.id)}
                        title="Delete run"
                        type="button"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="labBenchEmpty">
                <History size={24} />
                <strong>No saved runs</strong>
                <span>Save the live setup to create the first record.</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
