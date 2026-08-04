export type LabSimulationValues = {
  adcBitDepth: number;
  adcFilterCutoff: number;
  adcInputAmplitude: number;
  adcInputFrequency: number;
  adcReferenceVoltage: number;
  adcSampleRate: number;
  bjtBaseCurrent: number;
  bjtCollectorResistance: number;
  bjtCurrentGain: number;
  bjtSupplyVoltage: number;
  bjtTemperature: number;
  capacitance: number;
  digitalClockFrequency: number;
  digitalPropagationDelay: number;
  digitalSetupTime: number;
  filterFrequency: number;
  lineCurrent: number;
  lineVoltage: number;
  mosfetBusVoltage: number;
  mosfetDutyCycle: number;
  mosfetGateResistance: number;
  mosfetGateVoltage: number;
  mosfetLoadResistance: number;
  mosfetSwitchingFrequency: number;
  opAmpFeedbackResistance: number;
  opAmpInputResistance: number;
  opAmpInputVoltage: number;
  opAmpSupplyVoltage: number;
  pidDerivativeGain: number;
  pidIntegralGain: number;
  pidPlantTimeConstant: number;
  pidProportionalGain: number;
  pidSetpoint: number;
  powerFactor: number;
  rcResistance: number;
  resistance: number;
  resonanceCapacitance: number;
  resonanceFrequency: number;
  resonanceInductance: number;
  resonanceResistance: number;
  resonanceSourceVoltage: number;
  transmissionCharacteristicImpedance: number;
  transmissionElectricalLength: number;
  transmissionLoadImpedance: number;
  transformerCoreArea: number;
  transformerFrequency: number;
  transformerLoadResistance: number;
  transformerPrimaryTurns: number;
  transformerPrimaryVoltage: number;
  transformerSecondaryTurns: number;
  transformerWindingResistance: number;
  voltage: number;
};

export type LabMetrics = {
  adcAliased: boolean;
  adcClipped: boolean;
  adcDisplayedFrequency: number;
  adcEffectiveSnr: number;
  adcFilterGain: number;
  adcFilteredAmplitude: number;
  adcLsbMillivolts: number;
  adcNyquistFrequency: number;
  adcPeakCode: number;
  adcSamplesPerCycle: number;
  apparentPower: number;
  bjtAdjustedBeta: number;
  bjtBaseEmitterVoltage: number;
  bjtCollectorCurrent: number;
  bjtCollectorPower: number;
  bjtCollectorResistorPower: number;
  bjtCollectorVoltage: number;
  bjtCutoff: boolean;
  bjtForcedBeta: number;
  bjtIdealCollectorCurrent: number;
  bjtJunctionTemperature: number;
  bjtLoadLineCurrent: number;
  bjtSaturated: boolean;
  bjtSaturationMargin: number;
  bjtTransconductance: number;
  current: number;
  digitalMaxClock: number;
  digitalPeriod: number;
  digitalTimingMargin: number;
  digitalTimingUtilization: number;
  filterGain: number;
  filterGainDb: number;
  filterOutput: number;
  filterPhase: number;
  mosfetConductionLoss: number;
  mosfetDrainCurrent: number;
  mosfetDrainVoltage: number;
  mosfetEfficiency: number;
  mosfetGateDriveLoss: number;
  mosfetJunctionTemperature: number;
  mosfetLoadPower: number;
  mosfetOn: boolean;
  mosfetOnResistance: number;
  mosfetSwitchingLoss: number;
  mosfetTotalLoss: number;
  mosfetTransitionTime: number;
  opAmpClipped: boolean;
  opAmpGain: number;
  opAmpHeadroom: number;
  opAmpIdealOutput: number;
  opAmpInputCurrent: number;
  opAmpMaxSwing: number;
  opAmpOutput: number;
  phaseAngle: number;
  pidControlEffort: number;
  pidDampingRatio: number;
  pidFinalValue: number;
  pidNaturalFrequency: number;
  pidOvershoot: number;
  pidRiseTime: number;
  pidSettlingTime: number;
  pidSteadyStateError: number;
  rcCutoff: number;
  rcSettlingTime: number;
  rcTimeConstant: number;
  reactivePower: number;
  resonanceBandwidth: number;
  resonanceCapacitiveReactance: number;
  resonanceCapacitorVoltage: number;
  resonanceCurrent: number;
  resonanceCurrentRatio: number;
  resonanceFrequency: number;
  resonanceImpedance: number;
  resonanceInductiveReactance: number;
  resonanceInductorVoltage: number;
  resonanceLowerCutoff: number;
  resonanceNearPeak: boolean;
  resonancePeakCurrent: number;
  resonancePhase: number;
  resonanceQualityFactor: number;
  resonanceReactiveDifference: number;
  resonanceResistorPower: number;
  resonanceUpperCutoff: number;
  resistorPower: number;
  threePhasePower: number;
  transmissionDeliveredPower: number;
  transmissionReflectedVoltage: number;
  transmissionReflectionCoefficient: number;
  transmissionReflectionMagnitude: number;
  transmissionReflectionPhase: number;
  transmissionReturnLoss: number;
  transmissionVswr: number;
  transformerCoreLoss: number;
  transformerCopperLoss: number;
  transformerEfficiency: number;
  transformerFluxDensity: number;
  transformerIdealSecondaryVoltage: number;
  transformerLoadPercent: number;
  transformerMagnetizingCurrent: number;
  transformerOutputPower: number;
  transformerPrimaryCurrent: number;
  transformerRegulation: number;
  transformerSaturated: boolean;
  transformerSecondaryCurrent: number;
  transformerSecondaryVoltage: number;
  transformerTemperatureRise: number;
  transformerTotalLoss: number;
  transformerTurnsRatio: number;
};

export function calculateLabMetrics(values: LabSimulationValues): LabMetrics {
  const adcNyquistFrequency = values.adcSampleRate / 2;
  const adcWrappedFrequency =
    ((values.adcInputFrequency % values.adcSampleRate) +
      values.adcSampleRate) %
    values.adcSampleRate;
  const adcDisplayedFrequency =
    adcWrappedFrequency > adcNyquistFrequency
      ? values.adcSampleRate - adcWrappedFrequency
      : adcWrappedFrequency;
  const adcFilterRatio =
    values.adcInputFrequency / values.adcFilterCutoff;
  const adcFilterGain = 1 / Math.sqrt(1 + adcFilterRatio ** 2);
  const adcFilteredAmplitude =
    values.adcInputAmplitude * adcFilterGain;
  const adcLsbVolts =
    values.adcReferenceVoltage / 2 ** values.adcBitDepth;
  const adcFullScalePeak = values.adcReferenceVoltage / 2;
  const adcAmplitudeRatio = Math.max(
    adcLsbVolts / adcFullScalePeak,
    Math.min(1, adcFilteredAmplitude / adcFullScalePeak),
  );
  const adcEffectiveSnr =
    6.02 * values.adcBitDepth +
    1.76 +
    20 * Math.log10(adcAmplitudeRatio);
  const bjtTemperatureKelvin = values.bjtTemperature + 273.15;
  const bjtThermalVoltage =
    0.02585 * (bjtTemperatureKelvin / 298.15);
  const bjtAdjustedBeta = Math.max(
    10,
    values.bjtCurrentGain *
      (1 + 0.0035 * (values.bjtTemperature - 25)),
  );
  const bjtBaseCurrentAmps = values.bjtBaseCurrent * 1e-6;
  const bjtIdealCollectorCurrent =
    bjtAdjustedBeta * bjtBaseCurrentAmps * 1000;
  const bjtSaturationVoltage = 0.18;
  const bjtLoadLineCurrent =
    values.bjtSupplyVoltage / values.bjtCollectorResistance;
  const bjtActiveCurrentLimit = Math.max(
    0,
    (values.bjtSupplyVoltage - bjtSaturationVoltage) /
      values.bjtCollectorResistance,
  );
  const bjtCutoff = values.bjtBaseCurrent < 0.5;
  const bjtCollectorCurrent = bjtCutoff
    ? 0
    : Math.min(bjtIdealCollectorCurrent, bjtActiveCurrentLimit);
  const bjtCollectorVoltage = Math.max(
    bjtSaturationVoltage,
    values.bjtSupplyVoltage -
      bjtCollectorCurrent * values.bjtCollectorResistance,
  );
  const bjtSaturated =
    !bjtCutoff &&
    bjtIdealCollectorCurrent >= bjtActiveCurrentLimit * 0.995;
  const bjtBaseEmitterVoltage = bjtCutoff
    ? 0
    : Math.max(
        0.48,
        Math.min(
          0.88,
          0.65 -
            0.002 * (values.bjtTemperature - 25) +
            bjtThermalVoltage *
              Math.log(Math.max(1, values.bjtBaseCurrent / 10)),
        ),
      );
  const bjtCollectorPower =
    bjtCollectorVoltage * bjtCollectorCurrent;
  const bjtCollectorResistorPower =
    bjtCollectorCurrent ** 2 * values.bjtCollectorResistance;
  const current = values.voltage / values.resistance;
  const digitalPeriod = 1000 / values.digitalClockFrequency;
  const digitalTimingRequirement =
    values.digitalPropagationDelay + values.digitalSetupTime;
  const digitalTimingMargin = digitalPeriod - digitalTimingRequirement;
  const rcTimeConstant = values.rcResistance * values.capacitance;
  const rcSeconds = rcTimeConstant / 1000;
  const rcCutoff = 1 / (2 * Math.PI * rcSeconds);
  const resonanceInductanceHenries =
    values.resonanceInductance / 1000;
  const resonanceCapacitanceFarads =
    values.resonanceCapacitance * 1e-6;
  const resonanceAngularFrequency =
    2 * Math.PI * values.resonanceFrequency;
  const resonanceFrequency =
    1 /
    (2 *
      Math.PI *
      Math.sqrt(
        resonanceInductanceHenries * resonanceCapacitanceFarads,
      ));
  const resonanceAngularCenter = 2 * Math.PI * resonanceFrequency;
  const resonanceInductiveReactance =
    resonanceAngularFrequency * resonanceInductanceHenries;
  const resonanceCapacitiveReactance =
    1 /
    (resonanceAngularFrequency * resonanceCapacitanceFarads);
  const resonanceReactiveDifference =
    resonanceInductiveReactance - resonanceCapacitiveReactance;
  const resonanceImpedance = Math.sqrt(
    values.resonanceResistance ** 2 +
      resonanceReactiveDifference ** 2,
  );
  const resonanceCurrent =
    values.resonanceSourceVoltage / resonanceImpedance;
  const resonancePeakCurrent =
    values.resonanceSourceVoltage / values.resonanceResistance;
  const resonanceCurrentRatio =
    resonanceCurrent / resonancePeakCurrent;
  const resonancePhase =
    (Math.atan2(
      resonanceReactiveDifference,
      values.resonanceResistance,
    ) *
      180) /
    Math.PI;
  const resonanceQualityFactor =
    (resonanceAngularCenter * resonanceInductanceHenries) /
    values.resonanceResistance;
  const resonanceBandwidth =
    resonanceFrequency / Math.max(0.01, resonanceQualityFactor);
  const resonanceCutoffRoot = Math.sqrt(
    values.resonanceResistance ** 2 +
      (4 * resonanceInductanceHenries) / resonanceCapacitanceFarads,
  );
  const resonanceLowerCutoff =
    (-values.resonanceResistance + resonanceCutoffRoot) /
    (4 * Math.PI * resonanceInductanceHenries);
  const resonanceUpperCutoff =
    (values.resonanceResistance + resonanceCutoffRoot) /
    (4 * Math.PI * resonanceInductanceHenries);
  const filterRatio = values.filterFrequency / rcCutoff;
  const filterGain = 1 / Math.sqrt(1 + filterRatio ** 2);
  const mosfetThresholdVoltage = 3;
  const mosfetOverdrive = Math.max(
    0,
    values.mosfetGateVoltage - mosfetThresholdVoltage,
  );
  const mosfetOn = mosfetOverdrive > 0;
  const mosfetOnResistance = mosfetOn
    ? 0.028 + 0.18 / Math.max(0.25, mosfetOverdrive ** 2)
    : 1_000_000;
  const mosfetDrainCurrent = mosfetOn
    ? Math.min(
        20,
        values.mosfetBusVoltage /
          (values.mosfetLoadResistance + mosfetOnResistance),
      )
    : 0;
  const mosfetDrainVoltage = mosfetOn
    ? mosfetDrainCurrent * mosfetOnResistance
    : values.mosfetBusVoltage;
  const mosfetDutyRatio = Math.max(
    0,
    Math.min(1, values.mosfetDutyCycle / 100),
  );
  const mosfetGateDriveCurrent = Math.max(
    0.002,
    Math.max(0, values.mosfetGateVoltage - 4.5) /
      values.mosfetGateResistance,
  );
  const mosfetTransitionTime = mosfetOn
    ? Math.min(5000, 15 / mosfetGateDriveCurrent)
    : 5000;
  const mosfetConductionLoss =
    mosfetDrainCurrent ** 2 * mosfetOnResistance * mosfetDutyRatio;
  const mosfetSwitchingLoss = mosfetOn
    ? values.mosfetBusVoltage *
      mosfetDrainCurrent *
      mosfetTransitionTime *
      1e-9 *
      values.mosfetSwitchingFrequency *
      1000
    : 0;
  const mosfetGateDriveLoss =
    35e-9 *
    values.mosfetGateVoltage *
    values.mosfetSwitchingFrequency *
    1000;
  const mosfetTotalLoss =
    mosfetConductionLoss + mosfetSwitchingLoss + mosfetGateDriveLoss;
  const mosfetLoadPower =
    mosfetDrainCurrent ** 2 *
    values.mosfetLoadResistance *
    mosfetDutyRatio;
  const opAmpGain =
    -values.opAmpFeedbackResistance / values.opAmpInputResistance;
  const opAmpIdealOutput = opAmpGain * values.opAmpInputVoltage;
  const opAmpMaxSwing = Math.max(0.5, values.opAmpSupplyVoltage - 1.5);
  const opAmpOutput = Math.max(
    -opAmpMaxSwing,
    Math.min(opAmpMaxSwing, opAmpIdealOutput),
  );
  const pidNaturalFrequency =
    (0.9 +
      0.85 * values.pidProportionalGain +
      0.45 * Math.sqrt(values.pidIntegralGain + 0.01)) /
    values.pidPlantTimeConstant;
  const pidDampingRatio = Math.max(
    0.12,
    Math.min(
      1.4,
      0.55 +
        0.9 * values.pidDerivativeGain -
        0.12 * values.pidProportionalGain -
        0.25 * values.pidIntegralGain +
        0.12 * values.pidPlantTimeConstant,
    ),
  );
  const pidSteadyStateErrorPercent =
    values.pidIntegralGain >= 0.05
      ? Math.min(12, 0.8 / (values.pidIntegralGain + 0.08))
      : 100 / (1 + 4 * values.pidProportionalGain);
  const pidSteadyStateError =
    values.pidSetpoint * (pidSteadyStateErrorPercent / 100);
  const pidFinalValue = values.pidSetpoint - pidSteadyStateError;
  const pidOvershoot =
    pidDampingRatio < 1
      ? Math.exp(
          (-pidDampingRatio * Math.PI) /
            Math.sqrt(1 - pidDampingRatio ** 2),
        ) * 100
      : 0;
  const pidSettlingTime =
    4 / Math.max(0.08, pidDampingRatio * pidNaturalFrequency);
  const pidRiseTime = 1.8 / Math.max(0.1, pidNaturalFrequency);
  const pidControlEffort = Math.min(
    100,
    Math.max(
      0,
      (values.pidProportionalGain * values.pidSetpoint * 26) / 90 +
        values.pidIntegralGain * 18 +
        (values.pidDerivativeGain * 30) / values.pidPlantTimeConstant,
    ),
  );
  const clampedPowerFactor = Math.max(0, Math.min(1, values.powerFactor));
  const apparentPower =
    (Math.sqrt(3) * values.lineVoltage * values.lineCurrent) / 1000;
  const threePhasePower = apparentPower * clampedPowerFactor;
  const transmissionReflectionCoefficient =
    (values.transmissionLoadImpedance -
      values.transmissionCharacteristicImpedance) /
    (values.transmissionLoadImpedance +
      values.transmissionCharacteristicImpedance);
  const transmissionReflectionMagnitude = Math.min(
    0.9999,
    Math.abs(transmissionReflectionCoefficient),
  );
  const transmissionReflectionPhase =
    ((transmissionReflectionCoefficient < 0 ? 180 : 0) -
      values.transmissionElectricalLength * 2 +
      720) %
    360;
  const transformerTurnsRatio =
    values.transformerSecondaryTurns / values.transformerPrimaryTurns;
  const transformerIdealSecondaryVoltage =
    values.transformerPrimaryVoltage * transformerTurnsRatio;
  const transformerSecondaryVoltage =
    (transformerIdealSecondaryVoltage *
      values.transformerLoadResistance) /
    (values.transformerLoadResistance +
      values.transformerWindingResistance);
  const transformerSecondaryCurrent =
    transformerSecondaryVoltage / values.transformerLoadResistance;
  const transformerCopperLoss =
    transformerSecondaryCurrent ** 2 *
    values.transformerWindingResistance;
  const transformerCoreAreaSquareMeters =
    values.transformerCoreArea / 10_000;
  const transformerFluxDensity =
    values.transformerPrimaryVoltage /
    (4.44 *
      values.transformerFrequency *
      values.transformerPrimaryTurns *
      transformerCoreAreaSquareMeters);
  const transformerSaturated = transformerFluxDensity > 1.45;
  const transformerCoreLoss =
    1.2 *
    (values.transformerFrequency / 60) ** 1.3 *
    (transformerFluxDensity / 0.8) ** 2 *
    (values.transformerCoreArea / 12) *
    (transformerSaturated
      ? 1 + (transformerFluxDensity - 1.45) * 12
      : 1);
  const transformerMagnetizingCurrent =
    (0.015 + 0.035 * (transformerFluxDensity / 0.8) ** 2) *
    (transformerSaturated
      ? 1 + (transformerFluxDensity - 1.45) * 10
      : 1);
  const transformerOutputPower =
    transformerSecondaryVoltage * transformerSecondaryCurrent;
  const transformerTotalLoss =
    transformerCopperLoss + transformerCoreLoss;
  const transformerRealInputCurrent =
    (transformerOutputPower + transformerTotalLoss) /
    values.transformerPrimaryVoltage;
  const transformerPrimaryCurrent = Math.sqrt(
    transformerRealInputCurrent ** 2 +
      transformerMagnetizingCurrent ** 2,
  );
  const transformerRatedSecondaryCurrent =
    values.transformerCoreArea * 0.35;

  return {
    adcAliased: values.adcInputFrequency > adcNyquistFrequency,
    adcClipped: adcFilteredAmplitude > adcFullScalePeak,
    adcDisplayedFrequency,
    adcEffectiveSnr,
    adcFilterGain,
    adcFilteredAmplitude,
    adcLsbMillivolts: adcLsbVolts * 1000,
    adcNyquistFrequency,
    adcPeakCode: Math.min(
      2 ** values.adcBitDepth - 1,
      adcFilteredAmplitude / adcLsbVolts,
    ),
    adcSamplesPerCycle:
      values.adcSampleRate / values.adcInputFrequency,
    apparentPower,
    bjtAdjustedBeta,
    bjtBaseEmitterVoltage,
    bjtCollectorCurrent,
    bjtCollectorPower,
    bjtCollectorResistorPower,
    bjtCollectorVoltage,
    bjtCutoff,
    bjtForcedBeta:
      bjtCutoff
        ? 0
        : bjtCollectorCurrent /
          Math.max(0.0001, values.bjtBaseCurrent / 1000),
    bjtIdealCollectorCurrent,
    bjtJunctionTemperature:
      values.bjtTemperature + (bjtCollectorPower / 1000) * 150,
    bjtLoadLineCurrent,
    bjtSaturated,
    bjtSaturationMargin:
      bjtCollectorVoltage - bjtSaturationVoltage,
    bjtTransconductance:
      bjtCollectorCurrent / bjtThermalVoltage,
    current,
    digitalMaxClock: 1000 / digitalTimingRequirement,
    digitalPeriod,
    digitalTimingMargin,
    digitalTimingUtilization:
      (digitalTimingRequirement / digitalPeriod) * 100,
    filterGain,
    filterGainDb: 20 * Math.log10(filterGain),
    filterOutput: 5 * filterGain,
    filterPhase: (-Math.atan(filterRatio) * 180) / Math.PI,
    mosfetConductionLoss,
    mosfetDrainCurrent,
    mosfetDrainVoltage,
    mosfetEfficiency:
      mosfetLoadPower > 0
        ? (mosfetLoadPower / (mosfetLoadPower + mosfetTotalLoss)) * 100
        : 0,
    mosfetGateDriveLoss,
    mosfetJunctionTemperature: 25 + mosfetTotalLoss * 22,
    mosfetLoadPower,
    mosfetOn,
    mosfetOnResistance,
    mosfetSwitchingLoss,
    mosfetTotalLoss,
    mosfetTransitionTime,
    opAmpClipped: Math.abs(opAmpIdealOutput) > opAmpMaxSwing,
    opAmpGain,
    opAmpHeadroom: opAmpMaxSwing - Math.abs(opAmpIdealOutput),
    opAmpIdealOutput,
    opAmpInputCurrent:
      values.opAmpInputVoltage / values.opAmpInputResistance,
    opAmpMaxSwing,
    opAmpOutput,
    phaseAngle: (Math.acos(clampedPowerFactor) * 180) / Math.PI,
    pidControlEffort,
    pidDampingRatio,
    pidFinalValue,
    pidNaturalFrequency,
    pidOvershoot,
    pidRiseTime,
    pidSettlingTime,
    pidSteadyStateError,
    rcCutoff,
    rcSettlingTime: rcTimeConstant * 5,
    rcTimeConstant,
    reactivePower: Math.sqrt(
      Math.max(0, apparentPower ** 2 - threePhasePower ** 2),
    ),
    resonanceBandwidth,
    resonanceCapacitiveReactance,
    resonanceCapacitorVoltage:
      resonanceCurrent * resonanceCapacitiveReactance,
    resonanceCurrent,
    resonanceCurrentRatio,
    resonanceFrequency,
    resonanceImpedance,
    resonanceInductiveReactance,
    resonanceInductorVoltage:
      resonanceCurrent * resonanceInductiveReactance,
    resonanceLowerCutoff,
    resonanceNearPeak:
      resonanceCurrentRatio >= 1 / Math.sqrt(2),
    resonancePeakCurrent,
    resonancePhase,
    resonanceQualityFactor,
    resonanceReactiveDifference,
    resonanceResistorPower:
      resonanceCurrent ** 2 * values.resonanceResistance,
    resonanceUpperCutoff,
    resistorPower: values.voltage * current,
    threePhasePower,
    transmissionDeliveredPower:
      (1 - transmissionReflectionMagnitude ** 2) * 100,
    transmissionReflectedVoltage: transmissionReflectionMagnitude,
    transmissionReflectionCoefficient,
    transmissionReflectionMagnitude,
    transmissionReflectionPhase,
    transmissionReturnLoss:
      transmissionReflectionMagnitude < 0.000001
        ? 80
        : -20 * Math.log10(transmissionReflectionMagnitude),
    transmissionVswr:
      (1 + transmissionReflectionMagnitude) /
      Math.max(0.0001, 1 - transmissionReflectionMagnitude),
    transformerCoreLoss,
    transformerCopperLoss,
    transformerEfficiency:
      transformerOutputPower > 0
        ? (transformerOutputPower /
            (transformerOutputPower + transformerTotalLoss)) *
          100
        : 0,
    transformerFluxDensity,
    transformerIdealSecondaryVoltage,
    transformerLoadPercent:
      (transformerSecondaryCurrent /
        transformerRatedSecondaryCurrent) *
      100,
    transformerMagnetizingCurrent,
    transformerOutputPower,
    transformerPrimaryCurrent,
    transformerRegulation:
      ((transformerIdealSecondaryVoltage -
        transformerSecondaryVoltage) /
        Math.max(0.01, transformerSecondaryVoltage)) *
      100,
    transformerSaturated,
    transformerSecondaryCurrent,
    transformerSecondaryVoltage,
    transformerTemperatureRise: transformerTotalLoss * 4.5,
    transformerTotalLoss,
    transformerTurnsRatio,
  };
}
