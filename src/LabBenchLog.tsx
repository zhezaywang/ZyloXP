import {
  Activity,
  Clock3,
  History,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useEffect } from 'react';
import type { LabSimulationValues } from './labMetrics';

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
  return `${reading.value.toFixed(reading.decimals)}${
    reading.unit ? ` ${reading.unit}` : ''
  }`;
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

function getComparison(
  labId: string,
  currentValues: LabSimulationValues,
  savedValues: LabSimulationValues,
) {
  const currentReadings = getLabReadings(labId, currentValues);
  const savedReadings = getLabReadings(labId, savedValues);
  const changes = currentReadings.flatMap((reading, index) => {
    const delta = reading.value - savedReadings[index].value;

    if (Math.abs(delta) < 0.0001) {
      return [];
    }

    const sign = delta > 0 ? '+' : '−';
    return [
      `${reading.label} ${sign}${Math.abs(delta).toFixed(reading.decimals)}${
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
}: LabBenchLogProps) {
  const currentReadings = getLabReadings(labId, currentValues);
  const latestRun = runs[0] ?? null;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
        role="dialog"
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
                ? getComparison(labId, currentValues, latestRun.values)
                : 'No saved comparison yet'}
            </span>
          </p>
        </section>

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
      </section>
    </div>
  );
}
