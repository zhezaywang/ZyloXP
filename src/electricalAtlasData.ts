export type AtlasDomainId =
  | 'analog'
  | 'circuits'
  | 'controls'
  | 'digital'
  | 'electromagnetics'
  | 'measurement'
  | 'power'
  | 'signals';

export type AtlasDiagramKind =
  | 'antenna'
  | 'buck'
  | 'control'
  | 'diode'
  | 'digital'
  | 'embedded'
  | 'field'
  | 'filter'
  | 'ground'
  | 'meter'
  | 'modulation'
  | 'mosfet'
  | 'network'
  | 'opamp'
  | 'phasor'
  | 'pid'
  | 'protection'
  | 'resonance'
  | 'sampling'
  | 'three-phase'
  | 'transient'
  | 'transmission'
  | 'transformer'
  | 'uncertainty';

export type ElectricalConcept = {
  applications: string[];
  diagramKind: AtlasDiagramKind;
  domain: AtlasDomainId;
  equation: string;
  id: string;
  interactiveLabel: string;
  keywords: string;
  level: 'Advanced' | 'Applied' | 'Foundation';
  principles: string[];
  summary: string;
  title: string;
  unit: string;
};

export type EngineeringGame = {
  conceptIds: string[];
  description: string;
  domain: AtlasDomainId;
  duration: string;
  id: string;
  skill: string;
  title: string;
};

export type AtlasLearningPath = {
  conceptIds: string[];
  description: string;
  duration: string;
  id: string;
  label: string;
};

export const atlasDomains: Array<{
  description: string;
  id: AtlasDomainId;
  label: string;
}> = [
  {
    id: 'circuits',
    label: 'Circuit Theory',
    description: 'Networks, transients, resonance, and equivalent models',
  },
  {
    id: 'analog',
    label: 'Analog Electronics',
    description: 'Semiconductors, amplifiers, filters, and feedback',
  },
  {
    id: 'digital',
    label: 'Digital + Embedded',
    description: 'Logic, timing, conversion, and hardware interfaces',
  },
  {
    id: 'signals',
    label: 'Signals + Communications',
    description: 'Waveforms, spectra, sampling, and information transfer',
  },
  {
    id: 'power',
    label: 'Power + Energy',
    description: 'Three-phase systems, machines, and conversion',
  },
  {
    id: 'electromagnetics',
    label: 'Fields + RF',
    description: 'Electric fields, magnetic fields, and transmission lines',
  },
  {
    id: 'controls',
    label: 'Control Systems',
    description: 'Feedback, stability, dynamics, and response shaping',
  },
  {
    id: 'measurement',
    label: 'Measurement + Safety',
    description: 'Instrumentation, grounding, noise, and trustworthy tests',
  },
];

export const electricalConcepts: ElectricalConcept[] = [
  {
    id: 'ohm-kirchhoff',
    title: 'Ohm and Kirchhoff Laws',
    domain: 'circuits',
    unit: 'Core networks',
    level: 'Foundation',
    equation: 'V = IR · ΣI = 0 · ΣV = 0',
    summary:
      'Relate voltage, current, and resistance while conserving charge and energy at every node and loop.',
    interactiveLabel: 'Live source-load network',
    diagramKind: 'network',
    principles: [
      'V = IR describes an ideal linear resistor; current is conserved at a lumped-circuit node.',
      'Lumped-circuit voltage rises and drops sum to zero when all induced emfs are included.',
      'Sign convention is part of the model, not decoration.',
    ],
    applications: ['Bias networks', 'Sensor interfaces', 'Power distribution'],
    keywords: 'ohm kirchhoff kcl kvl node mesh resistor current voltage',
  },
  {
    id: 'thevenin-norton',
    title: 'Thevenin and Norton Equivalents',
    domain: 'circuits',
    unit: 'Network reduction',
    level: 'Applied',
    equation: 'VTH = INRN · RN = RTH',
    summary:
      'Replace a linear DC network with one source and one resistance at a terminal pair; sinusoidal AC equivalents use impedance.',
    interactiveLabel: 'Thevenin source and load',
    diagramKind: 'network',
    principles: [
      'The open-circuit voltage becomes the Thevenin voltage.',
      'The short-circuit current becomes the Norton current.',
      'With a finite, nonzero equivalent resistance, both forms have the same terminal behavior. Retain dependent sources when finding that resistance.',
    ],
    applications: ['Load matching', 'Battery models', 'Analog front ends'],
    keywords: 'thevenin norton equivalent source load resistance terminals',
  },
  {
    id: 'rlc-resonance',
    title: 'RLC Resonance and Damping',
    domain: 'circuits',
    unit: 'Energy storage',
    level: 'Applied',
    equation: 'f₀ = 1 / (2π√LC) · Q = √(L/C) / R',
    summary:
      'See how inductors and capacitors exchange energy while resistance controls bandwidth and ringing.',
    interactiveLabel: 'Resonance curve explorer',
    diagramKind: 'resonance',
    principles: [
      'In this ideal series RLC model, reactances cancel at resonance and Q = sqrt(L/C)/R. Parallel networks use a different Q relation.',
      'Higher Q narrows the response and increases ringing.',
      'Component tolerance shifts both center frequency and bandwidth.',
    ],
    applications: ['Tuned filters', 'Oscillators', 'Wireless power'],
    keywords: 'rlc resonance damping quality factor bandwidth inductor capacitor',
  },
  {
    id: 'laplace-transients',
    title: 'First-Order Transients and Laplace Models',
    domain: 'circuits',
    unit: 'Time-domain response',
    level: 'Applied',
    equation: 'vC(t) = VF + (V0 − VF)e^(−t/RC)',
    summary:
      'Connect stored energy, time constants, initial conditions, and Laplace-domain poles to real charging and decay waveforms.',
    interactiveLabel: 'RC transient scope',
    diagramKind: 'transient',
    principles: [
      'Capacitor voltage is continuous for finite current; inductor current is continuous for finite voltage. Ideal impulses are exceptions.',
      'One time constant completes about 63.2% of a first-order transition.',
      'Natural response is set by stored energy while forced response follows the source.',
    ],
    applications: ['Power-on reset', 'Sensor settling', 'Relay and motor transients'],
    keywords: 'laplace transient rc rl time constant initial condition step response',
  },
  {
    id: 'diodes-transistors',
    title: 'Diodes and Transistor Bias',
    domain: 'analog',
    unit: 'Semiconductor devices',
    level: 'Applied',
    equation: 'ID ≈ IS(e^(VD/nVT) − 1) · IC ≈ βIB',
    summary:
      'Explore nonlinear device behavior and the operating points that turn semiconductor physics into useful circuits.',
    interactiveLabel: 'Diode operating-point tracer',
    diagramKind: 'diode',
    principles: [
      'The Shockley diode approximation excludes breakdown and high-current series-resistance effects.',
      'IC ≈ βIB applies in the BJT forward-active region, not in saturation.',
      'Temperature and process variation move the operating point.',
    ],
    applications: ['Rectifiers', 'LED drivers', 'Amplifier biasing'],
    keywords: 'diode bjt mosfet transistor bias iv curve semiconductor junction',
  },
  {
    id: 'mosfet-switching',
    title: 'MOSFET Switching and Gate Drive',
    domain: 'analog',
    unit: 'Power semiconductor devices',
    level: 'Advanced',
    equation: 'PON = ID²RDS(on) · PSW ≈ ½VDSID(tr + tf)fS',
    summary:
      'Balance gate voltage, conduction loss, switching speed, and device stress in a practical low-side MOSFET stage.',
    interactiveLabel: 'MOSFET gate-drive bench',
    diagramKind: 'mosfet',
    principles: [
      'A MOSFET gate is voltage controlled but must still move charge.',
      'Low on-resistance reduces conduction loss only after sufficient gate drive.',
      'The displayed switching-loss estimate assumes hard switching at nearly constant load current; resistive loads have a different overlap loss. Faster edges can increase ringing and EMI.',
    ],
    applications: ['Motor drivers', 'Synchronous converters', 'Solenoid and LED control'],
    keywords: 'mosfet gate drive rds on switching loss body diode transistor power',
  },
  {
    id: 'op-amp-feedback',
    title: 'Operational Amplifiers and Feedback',
    domain: 'analog',
    unit: 'Linear amplification',
    level: 'Applied',
    equation: 'VOUT = A(V+ − V−) · ACL ≈ 1/β',
    summary:
      'Use negative feedback to trade raw gain for predictable closed-loop behavior while respecting real output limits.',
    interactiveLabel: 'Closed-loop amplifier bench',
    diagramKind: 'opamp',
    principles: [
      'Stable negative feedback with high loop gain and no saturation drives the input difference toward zero.',
      'ACL ≈ 1/β is the non-inverting gain approximation when |Aβ| is large; an inverting stage has signal gain −Rf/Rin.',
      'Supply rails, slew rate, and bandwidth limit ideal behavior.',
    ],
    applications: ['Signal conditioning', 'Active filters', 'Control loops'],
    keywords: 'op amp operational amplifier feedback gain saturation slew',
  },
  {
    id: 'filters-bode',
    title: 'Filters and Bode Plots',
    domain: 'analog',
    unit: 'Frequency response',
    level: 'Applied',
    equation: '|H(jω)| · ∠H(jω)',
    summary:
      'Connect poles and zeros to magnitude, phase, bandwidth, and the signals a circuit keeps or rejects.',
    interactiveLabel: 'Pole-and-cutoff response',
    diagramKind: 'filter',
    principles: [
      'Well above its corner frequency, a first-order pole contributes an asymptotic −20 dB/decade slope.',
      'Cutoff frequency marks a transition, not an ideal wall.',
      'Phase shift matters whenever stages or feedback loops interact.',
    ],
    applications: ['Audio', 'Sensor cleanup', 'Anti-alias filtering'],
    keywords: 'filter bode pole zero cutoff low pass high pass band pass',
  },
  {
    id: 'boolean-state-machines',
    title: 'Boolean Logic and State Machines',
    domain: 'digital',
    unit: 'Digital design',
    level: 'Foundation',
    equation: 'Y = f(A, B, state)',
    summary:
      'Move from truth tables to combinational logic and then to systems whose output depends on stored state.',
    interactiveLabel: 'Propagation-delay timing',
    diagramKind: 'digital',
    principles: [
      'Combinational outputs depend only on current inputs.',
      'Sequential logic adds memory; synchronous state machines update it on clock edges, while latches and asynchronous circuits differ.',
      'Setup, hold, and propagation delay bound reliable timing.',
    ],
    applications: ['FPGA logic', 'Protocol controllers', 'Digital safety interlocks'],
    keywords: 'boolean logic gate truth table state machine flip flop timing',
  },
  {
    id: 'adc-dac',
    title: 'ADC, DAC, and Quantization',
    domain: 'digital',
    unit: 'Mixed-signal interfaces',
    level: 'Applied',
    equation: 'LSB = VREF / 2ᴺ',
    summary:
      'Translate between continuous voltage and discrete codes while tracking resolution, range, and conversion error.',
    interactiveLabel: 'Sampling before quantization',
    diagramKind: 'sampling',
    principles: [
      'For an ideal unipolar range from 0 to VREF, the code width is VREF/2ᴺ. In general, use the full input span.',
      'Reference accuracy limits every converted value.',
      'Quantization, offset, and nonlinearity are different errors.',
    ],
    applications: ['Data acquisition', 'Motor control', 'Embedded audio'],
    keywords: 'adc dac quantization bits resolution reference lsb conversion',
  },
  {
    id: 'digital-timing',
    title: 'Clocking and Timing Closure',
    domain: 'digital',
    unit: 'Synchronous systems',
    level: 'Advanced',
    equation: 'TCLK ≥ TCQ,max + TLOGIC,max + TSETUP + TUNCERTAINTY − TSKEW',
    summary:
      'Budget the path between registers so logic settles before the next clock edge under every operating corner.',
    interactiveLabel: 'Propagation-delay race',
    diagramKind: 'digital',
    principles: [
      'The slowest register-to-register path limits clock frequency.',
      'Define skew as capture-clock arrival minus launch-clock arrival. Positive skew helps setup but can hurt hold; uncertainty reduces margin.',
      'Metastability requires probability management, not wishful thinking.',
    ],
    applications: ['FPGA timing', 'ASIC signoff', 'Clock-domain crossings'],
    keywords: 'clock timing setup hold propagation metastability fpga asic',
  },
  {
    id: 'microcontrollers-interrupts',
    title: 'Microcontrollers, Peripherals, and Interrupts',
    domain: 'digital',
    unit: 'Embedded systems',
    level: 'Applied',
    equation: 'CPU load = fIRQ · Cservice / fCPU',
    summary:
      'Budget processor time across interrupts, timers, converters, buses, and background work without losing real-time deadlines.',
    interactiveLabel: 'Interrupt-load timeline',
    diagramKind: 'embedded',
    principles: [
      'On one core, interrupt rate times service cycles divided by CPU frequency estimates utilization; include entry, exit, and preemption overhead.',
      'Priority controls latency but cannot create missing CPU time.',
      'Peripherals and DMA move repetitive work out of the instruction stream.',
    ],
    applications: ['Motor control firmware', 'Sensor acquisition', 'Real-time communications'],
    keywords: 'microcontroller mcu interrupt peripheral dma timer firmware latency cpu load',
  },
  {
    id: 'fourier-spectrum',
    title: 'Fourier Series and Spectra',
    domain: 'signals',
    unit: 'Signal representation',
    level: 'Applied',
    equation: 'x(t) ⇄ X(f)',
    summary:
      'Represent a waveform as frequency components so filtering, modulation, and bandwidth become visible.',
    interactiveLabel: 'Single Fourier component',
    diagramKind: 'phasor',
    principles: [
      'Time-domain shape and frequency-domain content describe the same signal.',
      'Sharp edges require higher-frequency harmonics.',
      'Amplitude and phase are both needed for reconstruction.',
    ],
    applications: ['Spectrum analysis', 'Audio synthesis', 'EMI diagnosis'],
    keywords: 'fourier spectrum harmonic frequency time domain transform',
  },
  {
    id: 'sampling-aliasing',
    title: 'Sampling and Aliasing',
    domain: 'signals',
    unit: 'Discrete-time signals',
    level: 'Applied',
    equation: 'fS > 2fMAX',
    summary:
      'Control when discrete samples preserve a waveform and when high-frequency content folds into a false lower frequency.',
    interactiveLabel: 'Live sampling scope',
    diagramKind: 'sampling',
    principles: [
      'A baseband signal with content through fMAX needs fS > 2fMAX for general reconstruction. A tone exactly at fS/2 can lose amplitude and phase information.',
      'Real systems need transition band for an anti-alias filter.',
      'Aliased samples can look internally consistent while being wrong.',
    ],
    applications: ['Audio capture', 'Oscilloscopes', 'Digital communications'],
    keywords: 'sampling aliasing nyquist sample rate anti alias waveform',
  },
  {
    id: 'ac-phasors',
    title: 'AC Phasors and Complex Impedance',
    domain: 'signals',
    unit: 'Sinusoidal steady state',
    level: 'Applied',
    equation: 'V̲ = I̲Z̲ · ZL = jωL · ZC = 1/(jωC)',
    summary:
      'Turn sinusoidal amplitude and phase into vectors that simplify steady-state AC network calculations.',
    interactiveLabel: 'Synchronized phasor scope',
    diagramKind: 'phasor',
    principles: [
      'A phasor stores magnitude and phase at one sinusoidal steady-state frequency; use peak or RMS consistently.',
      'Complex impedance unifies resistance and reactance.',
      'RMS values connect AC calculations to average power.',
    ],
    applications: ['AC circuits', 'Power factor', 'Frequency response'],
    keywords: 'ac phasor impedance complex rms phase reactance',
  },
  {
    id: 'digital-modulation',
    title: 'Digital Modulation and Noise',
    domain: 'signals',
    unit: 'Communication links',
    level: 'Advanced',
    equation: 'Rb = RS log₂M · Eb/N0 = SNR · B/Rb',
    summary:
      'Trade data rate, occupied bandwidth, constellation spacing, and noise margin across PSK and QAM links.',
    interactiveLabel: 'Live QAM constellation',
    diagramKind: 'modulation',
    principles: [
      'At fixed symbol rate and average energy, larger constellations carry more uncoded bits but reduce spacing. SNR and Eb/N0 in this equation are linear ratios, not dB.',
      'Symbol rate and pulse shaping set occupied bandwidth.',
      'Error probability depends on constellation distance and received SNR.',
    ],
    applications: ['Wi-Fi and cellular', 'Satellite links', 'Software-defined radio'],
    keywords: 'modulation qam psk constellation snr ber symbol rate communications',
  },
  {
    id: 'three-phase-power',
    title: 'Three-Phase Power',
    domain: 'power',
    unit: 'Power systems',
    level: 'Applied',
    equation: 'P = √3 VLIL cosφ',
    summary:
      'Explore balanced phase relationships, line and phase quantities, and how power factor changes useful power.',
    interactiveLabel: 'Three-phase power console',
    diagramKind: 'three-phase',
    principles: [
      'The power equation assumes balanced sinusoidal phases 120 degrees apart, RMS line-to-line voltage, and RMS line current.',
      'Line and phase values depend on wye or delta connection.',
      'Reactive current raises conductor loading without raising real power.',
    ],
    applications: ['Industrial loads', 'Grid distribution', 'Motor drives'],
    keywords: 'three phase wye delta line voltage current power factor',
  },
  {
    id: 'transformers-machines',
    title: 'Transformers and Electrical Machines',
    domain: 'power',
    unit: 'Electromechanical energy',
    level: 'Advanced',
    equation: 'V1/V2 = N1/N2 · Pmech = Tω',
    summary:
      'Connect magnetic flux, turns ratio, torque, speed, and losses across transformers, motors, and generators.',
    interactiveLabel: 'Turns-ratio and load bench',
    diagramKind: 'transformer',
    principles: [
      'The voltage ratio is ideal; current scales inversely and impedance by the square of turns ratio. Pmech = Tω uses torque in N·m and angular speed in rad/s.',
      'Air-gap flux links electrical excitation to torque.',
      'Copper, core, mechanical, and switching losses shape efficiency.',
    ],
    applications: ['Power supplies', 'Motors', 'Grid transformers'],
    keywords: 'transformer motor generator turns ratio flux torque machines',
  },
  {
    id: 'switching-converters',
    title: 'Switching Power Converters',
    domain: 'power',
    unit: 'Power electronics',
    level: 'Advanced',
    equation: 'VOUT ≈ DVIN',
    summary:
      'Control average voltage by switching energy through inductors and capacitors instead of burning excess power.',
    interactiveLabel: 'Buck converter dashboard',
    diagramKind: 'buck',
    principles: [
      'VOUT = DVIN applies to an ideal buck in continuous-conduction steady state. A boost instead gives VIN/(1−D); discontinuous conduction changes these relations.',
      'Inductor ripple links switching frequency, inductance, and load.',
      'Efficiency and transient response compete with size and cost.',
    ],
    applications: ['DC supplies', 'Battery systems', 'Processor voltage rails'],
    keywords: 'buck boost converter pwm duty cycle inductor ripple power electronics',
  },
  {
    id: 'power-protection',
    title: 'Fault Analysis and Protection Coordination',
    domain: 'power',
    unit: 'Protection systems',
    level: 'Advanced',
    equation: 'M = IFAULT / IPICKUP · t = TMS · 0.14/(M^0.02 − 1)',
    summary:
      'Set relay pickup and delay so normal load remains online while the nearest protective device clears a fault first.',
    interactiveLabel: 'Inverse-time relay coordinator',
    diagramKind: 'protection',
    principles: [
      'The displayed IEC standard-inverse curve applies only above pickup (M > 1); below pickup this element does not trip.',
      'Coordination must consider load, inrush, minimum and maximum faults, and breaker clearing time in addition to relay delay.',
      'Interrupting capacity must be at least the available fault current under the applicable ratings. This simulation does not establish safe protection settings.',
    ],
    applications: ['Industrial feeders', 'Substation protection', 'Arc-flash studies'],
    keywords: 'fault current relay breaker coordination pickup inverse time protection',
  },
  {
    id: 'electric-magnetic-fields',
    title: 'Electric and Magnetic Fields',
    domain: 'electromagnetics',
    unit: 'Field foundations',
    level: 'Applied',
    equation: 'F = q(E + v × B)',
    summary:
      'See how charges and currents create fields, store energy, and exert force across space and materials.',
    interactiveLabel: 'Charge and field-force map',
    diagramKind: 'field',
    principles: [
      'The electric force on a positive charge points along E; a moving charge also experiences the magnetic term q(v × B).',
      'Ampere-Maxwell law includes conduction and displacement current: time-varying electric flux also contributes to magnetic circulation.',
      'Material permittivity and permeability reshape field energy.',
    ],
    applications: ['Capacitors', 'Inductors', 'Sensors and actuators'],
    keywords: 'electric magnetic field charge force flux gauss ampere maxwell',
  },
  {
    id: 'transmission-lines',
    title: 'Transmission Lines and Reflections',
    domain: 'electromagnetics',
    unit: 'High-frequency interconnects',
    level: 'Advanced',
    equation: 'Γ = (ZL − Z0) / (ZL + Z0)',
    summary:
      'Treat long interconnects as distributed systems where impedance mismatch launches reflected waves.',
    interactiveLabel: 'Standing-wave line viewer',
    diagramKind: 'transmission',
    principles: [
      'An interconnect becomes a transmission line when delay matters.',
      'Matching the load to characteristic impedance removes reflection.',
      'Reflections alter edge shape, voltage stress, and data margin.',
    ],
    applications: ['PCB traces', 'Coaxial links', 'RF matching'],
    keywords: 'transmission line reflection coefficient impedance smith standing wave',
  },
  {
    id: 'antennas-link-budget',
    title: 'Antennas and RF Link Budgets',
    domain: 'electromagnetics',
    unit: 'Wireless propagation',
    level: 'Advanced',
    equation: 'PR = PT + GT + GR − FSPL · λ = c/f',
    summary:
      'Connect wavelength, antenna gain, free-space loss, receiver sensitivity, and fade margin in a wireless link.',
    interactiveLabel: 'RF path-loss planner',
    diagramKind: 'antenna',
    principles: [
      'In the far field with fixed isotropic antenna gains, free-space path loss increases with distance and frequency. Use dBm for power, dBi for gain, and dB for losses in this budget.',
      'Antenna gain redirects energy rather than creating power.',
      'A robust link budget reserves margin for fading, mismatch, and implementation loss.',
    ],
    applications: ['IoT radios', 'Microwave links', 'Telemetry and satellite systems'],
    keywords: 'antenna rf link budget path loss wavelength gain sensitivity wireless',
  },
  {
    id: 'feedback-stability',
    title: 'Feedback and Control Stability',
    domain: 'controls',
    unit: 'Dynamic systems',
    level: 'Advanced',
    equation: 'T(s) = G(s) / (1 + G(s)H(s))',
    summary:
      'Shape transient response and reject disturbance without giving away the phase margin that keeps a loop stable.',
    interactiveLabel: 'Closed-loop step response',
    diagramKind: 'control',
    principles: [
      'Feedback changes sensitivity, bandwidth, and disturbance rejection.',
      'Pole location controls speed, overshoot, and settling.',
      'Gain and phase margins characterize loop robustness, but do not alone prove stability for every loop. Check closed-loop poles or the full Nyquist criterion.',
    ],
    applications: ['Motor control', 'Power supplies', 'Autonomous systems'],
    keywords: 'control feedback stability pole zero phase margin step response',
  },
  {
    id: 'pid-control',
    title: 'PID Control and Practical Tuning',
    domain: 'controls',
    unit: 'Controller design',
    level: 'Applied',
    equation: 'u(t) = KPe(t) + KI∫e(t)dt + KD de(t)/dt',
    summary:
      'Tune proportional, integral, and derivative action while watching rise time, overshoot, steady-state error, and noise sensitivity.',
    interactiveLabel: 'Live PID tuning scope',
    diagramKind: 'pid',
    principles: [
      'Proportional gain increases response strength but can reduce stability margin.',
      'Integral action can remove constant steady-state error when the closed loop is stable and the actuator can reach the target; saturation can cause windup.',
      'Derivative action can add damping but is noise-sensitive; practical implementations filter it.',
    ],
    applications: ['Temperature control', 'Servo drives', 'Converter regulation'],
    keywords: 'pid proportional integral derivative tuning overshoot settling windup',
  },
  {
    id: 'grounding-emi',
    title: 'Grounding, Shielding, and EMI',
    domain: 'measurement',
    unit: 'Signal integrity',
    level: 'Applied',
    equation: 'VNOISE = INOISE ZRETURN',
    summary:
      'Follow real return-current paths and reduce the coupling mechanisms that turn shared impedance into unwanted voltage.',
    interactiveLabel: 'Return-path noise tracer',
    diagramKind: 'ground',
    principles: [
      'Ground is a network with impedance, not a magical zero.',
      'Return current divides among all available paths according to impedance; high-frequency return often concentrates near the signal path.',
      'Shield termination and loop area determine coupling effectiveness.',
    ],
    applications: ['PCB layout', 'EMC compliance', 'Precision sensors'],
    keywords: 'grounding shielding emi emc return current noise loop impedance',
  },
  {
    id: 'instrumentation',
    title: 'Measurement and Instrument Loading',
    domain: 'measurement',
    unit: 'Engineering instruments',
    level: 'Foundation',
    equation: 'ZLOADED = ZDUT ∥ ZPROBE',
    summary:
      'Predict when a meter, probe, or scope changes the circuit it is supposed to observe.',
    interactiveLabel: 'Probe-loading comparator',
    diagramKind: 'meter',
    principles: [
      'A voltage probe loads the node in parallel; a series ammeter instead adds burden impedance. The displayed parallel relation is not universal to all meters.',
      'Reference placement can dominate a small measured signal.',
      'Accuracy, precision, resolution, and bandwidth are separate properties.',
    ],
    applications: ['Oscilloscope probing', 'Current sensing', 'Lab debugging'],
    keywords: 'measurement instrument loading multimeter oscilloscope probe accuracy',
  },
  {
    id: 'uncertainty-calibration',
    title: 'Measurement Uncertainty and Calibration',
    domain: 'measurement',
    unit: 'Metrology',
    level: 'Applied',
    equation: 'uC² = Σ(ciui)² · umean = σ/√N',
    summary:
      'Separate bias, random noise, repeatability, calibration correction, and confidence when reporting a measured result.',
    interactiveLabel: 'Uncertainty budget analyzer',
    diagramKind: 'uncertainty',
    principles: [
      'For independent samples with the same finite variance, averaging reduces standard uncertainty by √N; it does not remove systematic bias.',
      'For uncorrelated inputs, combine sensitivity-weighted standard uncertainties ciui by root sum of squares. Correlated inputs also require covariance terms.',
      'Calibration establishes traceability and a correction with its own uncertainty.',
    ],
    applications: ['Production test', 'Sensor calibration', 'Standards laboratories'],
    keywords: 'measurement uncertainty calibration bias precision repeatability traceability',
  },
];

export const engineeringGames: EngineeringGame[] = [
  {
    id: 'wave-match',
    title: 'Wave Match',
    domain: 'signals',
    skill: 'Amplitude, frequency, and phase',
    duration: '2–4 min',
    description:
      'Tune a live waveform until it overlays the target signal, then score the match.',
    conceptIds: ['ac-phasors', 'fourier-spectrum'],
  },
  {
    id: 'logic-lock',
    title: 'Logic Lock',
    domain: 'digital',
    skill: 'Truth tables and gate behavior',
    duration: '2–3 min',
    description:
      'Decode a target truth table and choose the gate that opens each hardware lock.',
    conceptIds: ['boolean-state-machines', 'digital-timing'],
  },
  {
    id: 'power-target',
    title: 'Power Target',
    domain: 'power',
    skill: 'Voltage, resistance, current, and power',
    duration: '2–4 min',
    description:
      'Adjust a source and load to hit the requested power without crossing the component limit.',
    conceptIds: ['ohm-kirchhoff', 'switching-converters'],
  },
  {
    id: 'transient-trace',
    title: 'Transient Trace',
    domain: 'circuits',
    skill: 'RC time constants and inrush current',
    duration: '3–4 min',
    description:
      'Tune resistance and capacitance to match a settling target without exceeding the source-current limit.',
    conceptIds: ['laplace-transients', 'ohm-kirchhoff'],
  },
  {
    id: 'alias-escape',
    title: 'Alias Escape',
    domain: 'signals',
    skill: 'Nyquist rate and sampling margin',
    duration: '2–3 min',
    description:
      'Choose the leanest safe sample rate and keep the reconstructed signal from folding.',
    conceptIds: ['sampling-aliasing', 'adc-dac'],
  },
  {
    id: 'pid-tune',
    title: 'PID Tuning Bay',
    domain: 'controls',
    skill: 'Rise time, overshoot, and settling',
    duration: '3–5 min',
    description:
      'Tune a controller into the target response window without driving the loop into oscillation.',
    conceptIds: ['pid-control', 'feedback-stability'],
  },
  {
    id: 'relay-coordination',
    title: 'Relay Coordination',
    domain: 'power',
    skill: 'Pickup margin and clearing time',
    duration: '3–4 min',
    description:
      'Protect a feeder by separating normal load, downstream faults, and upstream backup timing.',
    conceptIds: ['power-protection', 'three-phase-power'],
  },
];

export const atlasLearningPaths: AtlasLearningPath[] = [
  {
    id: 'circuit-foundations',
    label: 'Circuit Foundations',
    description:
      'Move from conservation laws to equivalent networks, dynamics, amplification, and trustworthy measurement.',
    duration: '7 concepts',
    conceptIds: [
      'ohm-kirchhoff',
      'thevenin-norton',
      'laplace-transients',
      'rlc-resonance',
      'op-amp-feedback',
      'filters-bode',
      'instrumentation',
    ],
  },
  {
    id: 'digital-hardware',
    label: 'Digital Hardware',
    description:
      'Follow information from Boolean decisions through timing, conversion, interconnects, and board-level integrity.',
    duration: '6 concepts',
    conceptIds: [
      'boolean-state-machines',
      'microcontrollers-interrupts',
      'digital-timing',
      'adc-dac',
      'transmission-lines',
      'grounding-emi',
    ],
  },
  {
    id: 'signals-rf',
    label: 'Signals and RF',
    description:
      'Connect sinusoidal models, spectra, sampling, frequency response, fields, and high-frequency propagation.',
    duration: '8 concepts',
    conceptIds: [
      'ac-phasors',
      'fourier-spectrum',
      'sampling-aliasing',
      'digital-modulation',
      'filters-bode',
      'electric-magnetic-fields',
      'transmission-lines',
      'antennas-link-budget',
    ],
  },
  {
    id: 'power-control',
    label: 'Power and Control',
    description:
      'Trace energy through three-phase systems, machines, switching conversion, feedback, and safe return paths.',
    duration: '7 concepts',
    conceptIds: [
      'three-phase-power',
      'transformers-machines',
      'switching-converters',
      'power-protection',
      'feedback-stability',
      'pid-control',
      'grounding-emi',
    ],
  },
  {
    id: 'semiconductor-design',
    label: 'Semiconductors to Power Stages',
    description:
      'Move from junction behavior and bias into gate drive, analog feedback, filtering, and efficient switched conversion.',
    duration: '6 concepts',
    conceptIds: [
      'diodes-transistors',
      'mosfet-switching',
      'op-amp-feedback',
      'filters-bode',
      'switching-converters',
      'grounding-emi',
    ],
  },
  {
    id: 'measurement-practice',
    label: 'Measurement and Debugging',
    description:
      'Build trustworthy measurements from instrument loading, conversion, uncertainty, signal cleanup, and return-path control.',
    duration: '6 concepts',
    conceptIds: [
      'instrumentation',
      'uncertainty-calibration',
      'adc-dac',
      'filters-bode',
      'grounding-emi',
      'microcontrollers-interrupts',
    ],
  },
];

export const questionTopicConceptIds: Record<string, string> = {
  'AC Phasors and Impedance': 'ac-phasors',
  'Analog Electronics and Op-Amps': 'op-amp-feedback',
  Communications: 'digital-modulation',
  'Control Systems': 'pid-control',
  'DC Circuit Analysis': 'ohm-kirchhoff',
  'Digital Logic': 'boolean-state-machines',
  'Electrical Safety and Protection': 'power-protection',
  Electromagnetics: 'electric-magnetic-fields',
  'Embedded Systems': 'microcontrollers-interrupts',
  'Measurement and Instrumentation': 'uncertainty-calibration',
  'Network Theorems and Two-Port Networks': 'thevenin-norton',
  'PCB Design and Signal Integrity': 'transmission-lines',
  'Power Electronics': 'switching-converters',
  'Power Systems': 'three-phase-power',
  'RF and Antennas': 'antennas-link-budget',
  'Semiconductor Devices': 'diodes-transistors',
  'Signals and Systems': 'sampling-aliasing',
  'Transient Circuit Analysis': 'laplace-transients',
  'Transformers and Electrical Machines': 'transformers-machines',
  'Transmission Lines': 'transmission-lines',
};

export function getElectricalConcept(conceptId: string | null) {
  return electricalConcepts.find((concept) => concept.id === conceptId) ?? null;
}

export function getEngineeringGame(gameId: string | null) {
  return engineeringGames.find((game) => game.id === gameId) ?? null;
}

export function getQuestionAtlasConcept(topic: string) {
  return getElectricalConcept(questionTopicConceptIds[topic] ?? null);
}

export function getQuestionAtlasGame(topic: string) {
  const concept = getQuestionAtlasConcept(topic);
  return concept
    ? engineeringGames.find((game) => game.conceptIds.includes(concept.id)) ?? null
    : null;
}
