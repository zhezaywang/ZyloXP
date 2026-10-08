# Engineering Visual Review

Reviewed October 6, 2026, including a second boundary-condition pass. This is a source and rendered-output review of the app's
bundled learning visuals, not certification for construction or laboratory use.

## Coverage

- All 20 question schematic families and their 20 static references. The second
  pass exercises 895 distinct prompt/parameter variants representing the supported
  50,000-row bank snapshot, including concealed and revealed answer states.
- All 13 live lab diagrams, including the shared lab-preview renderer, at default
  values and 134 boundary cases derived from the actual UI control limits. These
  include each control's endpoints and each lab's combined minimum/maximum values.
  The 10 additional static lab references now come from the same live renderer.
- All 24 Atlas diagram families, with numerical and rendered checks for control
  endpoints; the browser sweep tests every min/max combination on two viewports.
  Together with the games this records 680 states. All 21 game rounds have a
  checked solution, and the PID solution is compared against independent RK4
  integration for 108 gain/plant combinations.
- Seven learning games, both resistor-workbench modes, the RC calculator plot,
  and all seven PCB teaching footprints at four rotations, with trace attachment,
  physical scale, layer order, copper contact and edge-placement checks.

The contact sheets contain 230 cases: 96 representative cases plus 134 lab
boundary cases. They do not cover every possible slider combination. The bank
audit checks image/question linkage and SVG structure across 12,500 source images;
this is not an independent circuit-topology review of all 12,500 drawings.
Decorative artwork, photographs and the mascot are not engineering schematics.

## Corrections

- Removed wires bypassing RC capacitors, joined disconnected component leads,
  and corrected Thevenin/Norton, op-amp, buck, transformer, meter and CT wiring.
- Connected workbench battery plates and made switch pictures consistent with
  the depicted conducting or before-trip state.
- Replaced ambiguous three-phase wire triangles with labeled balanced-load
  blocks; analyzer traces now differ by 120 degrees.
- Made RC curves and their one-time-constant markers use the same exponential.
  Corrected phasor origins, resonance markers, Bode marker scaling, AM envelopes,
  sampled ADC codes, transmission-line voltage snapshots and second-order
  critical/overdamped responses.
- Made sample-dot spacing match the stated acquisition rate and time window in
  the ADC lab, sampling explorer and game. ADC dots use quantized, range-limited
  values; the explorer's exact Nyquist limit no longer shows a pass.
- Removed artificial filter-wave amplitude floors and used consistent voltage
  scaling for the op-amp's two scope channels.
- Corrected resistor color codes, including gold/silver fractional multipliers.
  Values that a four-band code cannot represent use the printed value alone.
- Replaced a misleading LED illustration with a silicon diode; electrostatic
  force arrows now show attraction, repulsion, or zero force as appropriate.
- Removed unsupported CAT III, exact-part-number and QFN-32 claims. The PCB MCU
  symbol is an eight-pin teaching footprint, not a manufacturing land pattern.
- Removed the blanket "Verified engineering diagram" label. Reference views
  are labeled as references; unsupported questions no longer display Ohm's law.
- Moved obscured labels and increased instrument-readout contrast.

## Second-Pass Corrections

- Digital lab clock capture now occurs on a rising edge. Setup violations show an
  unknown output, rather than drawing a definite transition that cannot be inferred.
- PWM high time follows the selected duty cycle, including constant off/on states.
  The MOSFET drawing uses the resistive load assumed by its equations. Removing an
  artificial current cap restores agreement between current and voltage drops.
- High-gain op-amp traces clip at the stated supply swing. ADC peak codes include
  the plotted midscale bias; the displayed LEDs encode that actual integer code.
- BJT characteristic curves and the operating point share a stated piecewise DC
  model. Resonance sweeps include the selected operating frequency and the peak,
  even when the previous fixed sweep window would have excluded them.
- Transformer windings connect to their terminals. Primary and secondary scope
  traces use a common voltage scale, including step-up and extreme turns ratios.
- Servo plots handle underdamped, critically damped and overdamped cases without
  clipping. Settling time uses the final 2% crossing. The rotor animation follows
  the plotted model and reduced-motion settings suppress it.
- Transmission-line incident/reflected traces respect electrical length and the
  load reflection coefficient. Matched loads show infinite ideal return loss.
- Question diagrams retain both equal-valued charges, every register bit, the
  selected ADC resolution and correctly framed UART bits. Current-flow paths no
  longer suggest current entering an ideal op-amp input or bypassing a source.
- Atlas timing, QAM noise/energy, relay pickup/trip times and uncertainty bands
  use explicit models. Game scoring no longer awards passing results for violated
  current, timing, offset or protection constraints.
- PCB copper widths, grid spacing, route lengths and coordinates use one physical
  scale. The unchanged 900 x 540 model is correctly labeled 160 x 96 mm; saved
  coordinates are preserved. Courtyards enclose all pads through rotation.
- Removed decorative PCB ground-plane and mounting-hole claims absent from the
  model. Copper-contact checks now distinguish same-layer crossings from insulated
  opposite-layer crossings and account for the plated-pad connections.

## Verification

`pnpm verify` includes equation/geometry regression tests, rendering smoke tests,
SVG parsing and sync-preservation tests, TypeScript checks, a production build,
and Playwright tests at 1440 x 1000 and 390 x 844.

Final second-pass run: `ZYLOXP_FULL_QUESTION_AUDIT=1 pnpm verify` passed all 82
Node test cases, 2 Python reference checks and 56 production-browser tests, with
no failures, retries or skipped tests. Both TypeScript configurations and the
production build passed. PCB viewport containment was additionally checked at
320, 768 and 2560 px. Screenshots and audit reports are saved under
`~/Desktop/ZyloXP/visual-audit/second-pass`; the integrated browser artifacts are
under `~/Desktop/ZyloXP/qa-results/visual-accuracy-second-pass-final`.

`pnpm audit:visuals` writes PNG contact sheets, HTML and a fixture manifest to
`~/Desktop/ZyloXP/visual-audit`, or to `VISUAL_AUDIT_DIR` when provided. Screenshots
are review evidence, not mathematical proofs. Critical graph relationships also
have numerical assertions and circuit corrections have targeted topology checks.

Set `VISUAL_AUDIT_EXTREMES=1` to include the 134 lab boundary cases. The output
includes `layout-findings.json` for text overflow and intersecting labels. The
second-pass gallery reported zero such findings; that check does not prove every
possible graphical element is collision-free.

Core question tests use the committed 63 KB supported-variant fixture, so a clean
checkout does not require the oversized external CSV. With the companion bank
available, `ZYLOXP_FULL_QUESTION_AUDIT=1 pnpm test` additionally verifies the fixture
against that CSV and checks all 12,500 upstream image identities and descriptions.
Without the external files this optional census is explicitly skipped; the core
formula, rendering and bundled-reference checks still run.

All 20 app-local question references are protected by `sync_reference_image` in
`tools/sync_question_bank.py`. A changed associated question prompt stops the
sync for review instead of restoring the upstream topology error. Other bank
images still follow the normal copy workflow. `pnpm sync:lab-references` regenerates
the 10 static lab SVGs from the live component, stylesheet and fixed example
values. The service-worker cache version was incremented so installed copies can
retire stale reference images.

## Model Limits

The models are idealized or reduced-order. Animated dots indicate a qualitative
signal/current path, not electron speed, measured timing or a SPICE solution.
Instrument housings are illustrations, not certified equipment or wiring guides.
Semiconductor curves are generic teaching models, not manufacturer device models.
PCB geometry and checks are instructional, not fabrication approval.

The servo lab's gains map heuristically to damping, bandwidth and final offset;
it is not a time-domain PID solver. The Atlas PID explorer and tuning game use
an ideal unity-feedback PID with a stated first-order plant, including derivative
feedthrough. Neither includes actuator limits, noise or a hardware stability check.
PCB checks are not full DRC: there is no fabrication stackup, minimum copper
clearance rule, current/thermal rating or complete circuit-function validation.

Some Atlas lessons share prerequisite illustrations. Their labels now identify
the actual scope: Thevenin source/load, propagation delay, sampling before
quantization, and a single Fourier component. These are not complete Norton
comparators, state-machine simulators, DAC models or harmonic synthesis tools.
Old saved best game scores are preserved even where scoring is now stricter.

Static references use fixed example values; live lab pictures use the current
controls. A qualified engineering review remains appropriate before expanding
the question templates or using these materials for physical builds.

## Technical References

- [Analog Devices: RC transient response](https://wiki.analog.com/university/courses/engineering_discovery/lab_2)
- [Analog Devices: virtual ground and negative feedback](https://www.analog.com/en/resources/technical-articles/so-what-exactly-is-a-virtual-ground.html)
- [UCSB: Norton equivalent lecture notes](https://web.ece.ucsb.edu/~parhami/pres_folder/10A_lecture16_notes.pdf)
- [Texas Instruments: buck power-stage calculations](https://www.ti.com/lit/an/slva477b/slva477b.pdf)
- [Vishay: resistor color codes](https://www.vishay.com/docs/49478/_dale_resistor_color_code_chart_vmn_ms0002_1612.pdf)
- [Analog Devices: AM envelope detection](https://wiki.analog.com/university/courses/alm1k/circuits1/alm-cir-envelope-detector)
- [Analog Devices: transmission-line reflections](https://www.analog.com/en/resources/analog-dialogue/raqs/2021/12/16/16/41/raq-issue-197.html)
- [University of Michigan: second-order system analysis](https://ctms.engin.umich.edu/CTMS/?example=Introduction&section=SystemAnalysis)
- [Analog Devices: ADC coding and quantization](https://www.analog.com/en/resources/technical-articles/types-of-adcs-and-dacs.html)
- [Analog Devices: sampling and conversion](https://wiki.analog.com/university/courses/electronics/text/chapter-20)
- [Analog Devices: transmission-line standing waves](https://wiki.analog.com/university/labs/tlines_standing_waves_adalm2000)
- [KiCad: PCB layers, pads and geometry checks](https://docs.kicad.org/9.0/en/pcbnew/pcbnew.html)
- [NIST: bias corrections and uncertainty](https://www.itl.nist.gov/div898/handbook/mpc/section5/mpc52.htm)
- [MathWorks: ideal parallel PID form](https://www.mathworks.com/help/control/ref/pid.html)
- [MathWorks: settling-time conventions](https://www.mathworks.com/help/control/ug/obtain-system-characteristics.html)
