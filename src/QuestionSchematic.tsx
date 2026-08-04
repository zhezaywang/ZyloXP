import type { ReactNode } from 'react';
import type { LessonQuestion } from './data';

type QuestionSchematicProps = {
  powered: boolean;
  question: LessonQuestion;
  revealed: boolean;
};

type ResistorProps = {
  label?: string;
  length?: number;
  x: number;
  y: number;
};

const wireClass = 'schematicWire';

function valueOnly(value: string | undefined, fallback: string) {
  return (value ?? fallback)
    .replace(/^power factor\s+/i, '')
    .replace(/^[A-Za-zβλτ][A-Za-z0-9',]*\s*=\s*/, '');
}

function HResistor({ label, length = 100, x, y }: ResistorProps) {
  return (
    <g>
      <line className={wireClass} x1={x} y1={y} x2={x + 18} y2={y} />
      <rect
        className="schematicComponent"
        x={x + 18}
        y={y - 12}
        width={length - 36}
        height={24}
        rx={2}
      />
      <line className={wireClass} x1={x + length - 18} y1={y} x2={x + length} y2={y} />
      {label && (
        <text className="schematicValue" x={x + length / 2} y={y - 20} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}

function VResistor({ label, length = 100, x, y }: ResistorProps) {
  return (
    <g>
      <line className={wireClass} x1={x} y1={y} x2={x} y2={y + 18} />
      <rect
        className="schematicComponent"
        x={x - 12}
        y={y + 18}
        width={24}
        height={length - 36}
        rx={2}
      />
      <line className={wireClass} x1={x} y1={y + length - 18} x2={x} y2={y + length} />
      {label && (
        <text className="schematicValue" x={x + 19} y={y + length / 2 + 5}>
          {label}
        </text>
      )}
    </g>
  );
}

function Ground({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line className={wireClass} x1={x} y1={y} x2={x} y2={y + 9} />
      <line className="schematicThin" x1={x - 19} y1={y + 9} x2={x + 19} y2={y + 9} />
      <line className="schematicThin" x1={x - 12} y1={y + 16} x2={x + 12} y2={y + 16} />
      <line className="schematicThin" x1={x - 5} y1={y + 23} x2={x + 5} y2={y + 23} />
    </g>
  );
}

function Battery({
  label,
  x,
  y,
}: {
  label: string;
  x: number;
  y: number;
}) {
  return (
    <g>
      <line className={wireClass} x1={x} y1={y - 46} x2={x} y2={y - 11} />
      <line className="schematicAccent" x1={x - 26} y1={y - 11} x2={x + 26} y2={y - 11} />
      <line className="schematicAccent" x1={x - 14} y1={y + 11} x2={x + 14} y2={y + 11} />
      <line className={wireClass} x1={x} y1={y + 11} x2={x} y2={y + 46} />
      <text className="schematicPolarity" x={x + 34} y={y - 7}>
        +
      </text>
      <text className="schematicPolarity" x={x + 34} y={y + 18}>
        −
      </text>
      <text className="schematicValue" x={x - 38} y={y + 5} textAnchor="end">
        {label}
      </text>
    </g>
  );
}

function Capacitor({
  label,
  x,
  y,
}: {
  label?: string;
  x: number;
  y: number;
}) {
  return (
    <g>
      <line className={wireClass} x1={x} y1={y - 48} x2={x} y2={y - 9} />
      <line className="schematicAccent" x1={x - 24} y1={y - 9} x2={x + 24} y2={y - 9} />
      <line className="schematicAccent" x1={x - 24} y1={y + 9} x2={x + 24} y2={y + 9} />
      <line className={wireClass} x1={x} y1={y + 9} x2={x} y2={y + 48} />
      {label && (
        <text className="schematicValue" x={x + 34} y={y + 5}>
          {label}
        </text>
      )}
    </g>
  );
}

function Inductor({
  label,
  x,
  y,
}: {
  label?: string;
  x: number;
  y: number;
}) {
  return (
    <g>
      <line className={wireClass} x1={x} y1={y} x2={x + 18} y2={y} />
      <path
        className={wireClass}
        d={`M${x + 18} ${y} q9 -22 18 0 q9 -22 18 0 q9 -22 18 0 q9 -22 18 0`}
      />
      <line className={wireClass} x1={x + 90} y1={y} x2={x + 108} y2={y} />
      {label && (
        <text className="schematicValue" x={x + 54} y={y - 28} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}

function Node({ x, y }: { x: number; y: number }) {
  return <circle className="schematicNode" cx={x} cy={y} r={5} />;
}

function Flow({ d }: { d: string }) {
  return <path className="schematicFlow" d={d} />;
}

function DiagramNote({
  children,
  x,
  y,
  width = 150,
}: {
  children: ReactNode;
  width?: number;
  x: number;
  y: number;
}) {
  return (
    <g>
      <rect className="schematicNote" x={x} y={y} width={width} height={38} rx={5} />
      <text className="schematicNoteText" x={x + width / 2} y={y + 24} textAnchor="middle">
        {children}
      </text>
    </g>
  );
}

function OhmsLawDiagram({ answer, values }: DiagramProps) {
  return (
    <g>
      <path className={wireClass} d="M105 105 V134 M105 105 H220 M340 105 H445" />
      <HResistor x={220} y={105} length={120} label={values[1] ?? 'R = 8 Ω'} />
      <circle className="schematicMeter" cx={485} cy={105} r={36} />
      <text className="schematicMeterLetter" x={485} y={113} textAnchor="middle">
        A
      </text>
      <path className={wireClass} d="M445 105 H449 M521 105 H545 V255 H105 V226" />
      <Battery x={105} y={180} label={values[0] ?? '8 V'} />
      <Flow d="M115 105 H440" />
      <text className="schematicCurrentLabel" x={395} y={86}>
        I
      </text>
      <DiagramNote x={372} y={212} width={170}>
        {answer}
      </DiagramNote>
    </g>
  );
}

function AcPhasorDiagram({ answer, markerId, values }: DiagramProps) {
  return (
    <g>
      <text className="schematicSectionLabel" x={45} y={74}>
        TIME DOMAIN
      </text>
      <path className="schematicAxis" d="M45 165 H300 M70 82 V238" />
      <path
        className="schematicSignal"
        d="M70 165 C92 88 122 88 144 165 S196 242 218 165 S270 88 292 165"
      />
      <text className="schematicValue" x={82} y={97}>
        Vpeak = {values[0] ?? '18 V'}
      </text>
      <text className="schematicSectionLabel" x={365} y={74}>
        RMS PHASOR
      </text>
      <path className="schematicAxis" d="M365 220 H585 M395 250 V92" />
      <path
        className="schematicPhasor"
        d="M395 220 L545 133"
        markerEnd={`url(#${markerId})`}
      />
      <path className="schematicThin" d="M449 220 A54 54 0 0 0 442 193" />
      <text className="schematicValue" x={451} y={202}>
        {values[1] ?? '30°'}
      </text>
      <text className="schematicValue" x={492} y={122}>
        |V| = {answer}
      </text>
      <Flow d="M395 220 L545 133" />
    </g>
  );
}

function TheveninNortonDiagram({ answer, markerId, values }: DiagramProps) {
  return (
    <g>
      <text className="schematicSectionLabel" x={58} y={72}>
        THEVENIN
      </text>
      <circle className="schematicSource" cx={105} cy={170} r={38} />
      <text className="schematicPolarity" x={99} y={156}>
        +
      </text>
      <text className="schematicPolarity" x={99} y={192}>
        −
      </text>
      <path className={wireClass} d="M105 132 V105 H150 M250 105 H290 M105 208 V245 H290" />
      <HResistor x={150} y={105} label={values[1] ?? 'Rth = 6 Ω'} />
      <Node x={290} y={105} />
      <Node x={290} y={245} />
      <text className="schematicValue" x={105} y={223} textAnchor="middle">
        {values[0] ?? 'Vth = 26 V'}
      </text>
      <text className="schematicTerminal" x={303} y={110}>
        a
      </text>
      <text className="schematicTerminal" x={303} y={250}>
        b
      </text>

      <path
        className="schematicEquivalence"
        d="M318 175 H365"
        markerEnd={`url(#${markerId})`}
      />
      <text className="schematicValue" x={340} y={159} textAnchor="middle">
        equivalent
      </text>

      <text className="schematicSectionLabel" x={400} y={72}>
        NORTON
      </text>
      <circle className="schematicSource" cx={435} cy={175} r={38} />
      <path
        className="schematicAccent"
        d="M435 197 V150"
        markerEnd={`url(#${markerId})`}
      />
      <path className={wireClass} d="M435 137 V105 H565 M435 213 V245 H565" />
      <VResistor x={515} y={105} length={140} label={values[1] ?? 'Rth'} />
      <Node x={565} y={105} />
      <Node x={565} y={245} />
      <text className="schematicValue" x={435} y={231} textAnchor="middle">
        IN = {answer}
      </text>
      <text className="schematicTerminal" x={578} y={110}>
        a
      </text>
      <text className="schematicTerminal" x={578} y={250}>
        b
      </text>
      <Flow d="M105 132 V105 H286" />
      <Flow d="M435 210 V240 H505 V112" />
    </g>
  );
}

function RcDiagram({ answer, values }: DiagramProps) {
  return (
    <g>
      <path className={wireClass} d="M95 105 V134 M95 105 H148 M192 105 H225" />
      <circle className="schematicSwitchNode" cx={150} cy={105} r={5} />
      <circle className="schematicSwitchNode" cx={190} cy={105} r={5} />
      <line className="schematicAccent" x1={150} y1={105} x2={184} y2={87} />
      <HResistor x={225} y={105} length={120} label={values[0] ?? 'R = 7 kΩ'} />
      <path className={wireClass} d="M345 105 H405 V255 H95 V226" />
      <Capacitor x={405} y={180} label={values[1] ?? 'C = 30 µF'} />
      <Battery x={95} y={180} label="Vs" />
      <Flow d="M200 105 H390" />

      <path className="schematicAxis" d="M458 244 H600 M470 244 V95" />
      <path className="schematicSignal" d="M470 234 C492 164 522 124 590 108" />
      <path className="schematicGuide" d="M470 148 H526 V244" />
      <text className="schematicValue" x={535} y={258} textAnchor="middle">
        τ = {answer}
      </text>
      <text className="schematicValue" x={478} y={140}>
        63.2%
      </text>
      <text className="schematicSectionLabel" x={458} y={74}>
        CAPACITOR CHARGE
      </text>
    </g>
  );
}

function CoulombDiagram({ answer, markerId, values }: DiagramProps) {
  return (
    <g>
      <line className="schematicGuide" x1={150} y1={245} x2={490} y2={245} />
      <line
        className="schematicDimension"
        x1={165}
        y1={245}
        x2={475}
        y2={245}
        markerEnd={`url(#${markerId})`}
        markerStart={`url(#${markerId})`}
      />
      <circle className="schematicCharge" cx={150} cy={145} r={46} />
      <circle className="schematicCharge secondary" cx={490} cy={145} r={46} />
      <text className="schematicChargeSign" x={150} y={158} textAnchor="middle">
        +
      </text>
      <text className="schematicChargeSign" x={490} y={158} textAnchor="middle">
        +
      </text>
      <text className="schematicValue" x={150} y={211} textAnchor="middle">
        q₁ = {values[0] ?? '3 µC'}
      </text>
      <text className="schematicValue" x={490} y={211} textAnchor="middle">
        q₂ = {values[1] ?? '4 µC'}
      </text>
      <path
        className="schematicForce schematicAnimatedVector"
        d="M112 145 H48"
        markerEnd={`url(#${markerId})`}
      />
      <path
        className="schematicForce schematicAnimatedVector"
        d="M528 145 H592"
        markerEnd={`url(#${markerId})`}
      />
      <text className="schematicValue" x={72} y={127}>
        F
      </text>
      <text className="schematicValue" x={564} y={127}>
        F
      </text>
      <text className="schematicValue" x={320} y={270} textAnchor="middle">
        r = {values[2] ?? '0.2 m'}
      </text>
      <DiagramNote x={245} y={92} width={150}>
        |F| = {answer}
      </DiagramNote>
    </g>
  );
}

function TransmissionLineDiagram({ answer, values }: DiagramProps) {
  return (
    <g>
      <text className="schematicSectionLabel" x={48} y={76}>
        DISTRIBUTED LOSSLESS LINE
      </text>
      <path className={wireClass} d="M50 135 H82" />
      <Inductor x={82} y={135} label={values[0] ?? "L′ = 250 nH/m"} />
      <path className={wireClass} d="M190 135 H235" />
      <Inductor x={235} y={135} label="L′Δx" />
      <path className={wireClass} d="M343 135 H390" />
      <Inductor x={390} y={135} label="L′Δx" />
      <path className={wireClass} d="M498 135 H580 M50 260 H580" />
      <Capacitor x={215} y={197} label="C′Δx" />
      <Capacitor x={370} y={197} label="C′Δx" />
      <path className={wireClass} d="M215 135 V149 M215 245 V260 M370 135 V149 M370 245 V260" />
      <VResistor x={565} y={135} length={125} label={`Z₀ = ${answer}`} />
      <Node x={215} y={135} />
      <Node x={370} y={135} />
      <Flow d="M52 135 H552" />
      <DiagramNote x={60} y={286} width={220}>
        {values[1] ?? "C′ = 100 pF/m"}
      </DiagramNote>
    </g>
  );
}

function ThreePhaseDiagram({ answer, values }: DiagramProps) {
  const phases = [
    { color: 'phaseA', label: 'A', y: 105 },
    { color: 'phaseB', label: 'B', y: 175 },
    { color: 'phaseC', label: 'C', y: 245 },
  ];

  return (
    <g>
      {phases.map((phase) => (
        <g key={phase.label}>
          <circle className={`schematicPhaseSource ${phase.color}`} cx={90} cy={phase.y} r={25} />
          <path
            className={`schematicPhaseLine ${phase.color}`}
            d={`M115 ${phase.y} H${phase.label === 'B' ? 525 : 460}`}
          />
          <text className="schematicPhaseLabel" x={90} y={phase.y + 6} textAnchor="middle">
            {phase.label}
          </text>
        </g>
      ))}
      <path className="schematicComponent" d="M460 105 L525 175 L460 245 Z" />
      <Node x={460} y={105} />
      <Node x={525} y={175} />
      <Node x={460} y={245} />
      <Flow d="M122 105 H445" />
      <Flow d="M122 175 H510" />
      <Flow d="M122 245 H445" />
      <text className="schematicValue" x={255} y={88} textAnchor="middle">
        VL = {values[0] ?? '6 kV RMS'}
      </text>
      <text className="schematicValue" x={255} y={165} textAnchor="middle">
        IL = {values[1] ?? '200 A RMS'}
      </text>
      <text className="schematicValue" x={255} y={235} textAnchor="middle">
        pf = {valueOnly(values[2], '0.85')}
      </text>
      <DiagramNote x={420} y={282} width={170}>
        P3φ = {answer}
      </DiagramNote>
    </g>
  );
}

function TransformerDiagram({ answer, values }: DiagramProps) {
  return (
    <g>
      <circle className="schematicSource" cx={90} cy={175} r={38} />
      <path className="schematicSignal" d="M66 175 q12 -24 24 0 q12 24 24 0" />
      <path className={wireClass} d="M90 137 V95 H230 M90 213 V255 H230" />
      <path className="schematicCoil" d="M230 95 q-28 13 0 26 q-28 13 0 26 q-28 13 0 26 q-28 13 0 26 q-28 13 0 26 q-28 13 0 30" />
      <path className="schematicCore" d="M278 84 V266 M294 84 V266" />
      <path className="schematicCoil secondary" d="M342 95 q28 13 0 26 q28 13 0 26 q28 13 0 26 q28 13 0 26 q28 13 0 26 q28 13 0 30" />
      <path className={wireClass} d="M342 95 H480 V120 M342 255 H480 V230" />
      <VResistor x={480} y={120} length={110} label="load" />
      <text className="schematicValue" x={90} y={230} textAnchor="middle">
        Vp = {values[2] ?? '480 V'}
      </text>
      <text className="schematicValue" x={208} y={284} textAnchor="middle">
        Np = {valueOnly(values[0], '140')}
      </text>
      <text className="schematicValue" x={366} y={284} textAnchor="middle">
        Ns = {valueOnly(values[1], '80')}
      </text>
      <DiagramNote x={435} y={74} width={155}>
        Vs = {answer}
      </DiagramNote>
      <Flow d="M110 95 H214" />
      <Flow d="M360 95 H465" />
    </g>
  );
}

function BuckDiagram({ answer, markerId, values }: DiagramProps) {
  return (
    <g>
      <text className="schematicValue" x={54} y={90}>
        Vin = {valueOnly(values[0], '24 V')}
      </text>
      <path className={wireClass} d="M65 120 H135 M178 120 H205" />
      <circle className="schematicSwitchNode" cx={137} cy={120} r={5} />
      <circle className="schematicSwitchNode" cx={176} cy={120} r={5} />
      <line className="schematicAccent" x1={138} y1={119} x2={169} y2={101} />
      <text className="schematicValue" x={155} y={82} textAnchor="middle">
        D = {valueOnly(values[1], '0.75')}
      </text>
      <Node x={205} y={120} />
      <Inductor x={205} y={120} label="L" />
      <path className={wireClass} d="M313 120 H520 M65 265 H520" />
      <Capacitor x={385} y={193} label="Cout" />
      <VResistor x={485} y={120} length={145} label="load" />
      <path className={wireClass} d="M385 120 V145 M385 241 V265" />
      <path className={wireClass} d="M205 120 V170 M205 218 V265" />
      <path className="schematicDiode" d="M184 210 H226 L205 180 Z M183 173 H227" />
      <text className="schematicValue" x={235} y={198}>
        freewheel diode
      </text>
      <path
        className="schematicCurrent"
        d="M215 120 H345"
        markerEnd={`url(#${markerId})`}
      />
      <Flow d="M70 120 H365" />
      <DiagramNote x={430} y={74} width={150}>
        Vout = {answer}
      </DiagramNote>
    </g>
  );
}

function OpAmpDiagram({ answer, values }: DiagramProps) {
  return (
    <g>
      <path className={wireClass} d="M330 115 L330 255 L495 185 Z" />
      <text className="schematicPolarity" x={350} y={160}>
        −
      </text>
      <text className="schematicPolarity" x={350} y={224}>
        +
      </text>
      <path className={wireClass} d="M55 150 H120 M230 150 H330" />
      <HResistor x={120} y={150} length={110} label={values[0] ?? 'Rin = 3 kΩ'} />
      <Node x={330} y={150} />
      <path className={wireClass} d="M495 185 H565" />
      <path className={wireClass} d="M330 150 V78 H370 M480 78 H530 V185" />
      <HResistor x={370} y={78} length={110} label={values[1] ?? 'Rf = 9 kΩ'} />
      <path className={wireClass} d="M330 220 H285 V253" />
      <Ground x={285} y={253} />
      <text className="schematicValue" x={48} y={155} textAnchor="end">
        Vin
      </text>
      <text className="schematicValue" x={573} y={190}>
        Vout
      </text>
      <text className="schematicValue" x={355} y={140}>
        virtual ground
      </text>
      <Flow d="M60 150 H314" />
      <DiagramNote x={412} y={270} width={165}>
        Av = {answer}
      </DiagramNote>
    </g>
  );
}

function BjtDiagram({ answer, markerId, values }: DiagramProps) {
  return (
    <g>
      <text className="schematicValue" x={325} y={66} textAnchor="middle">
        VCC
      </text>
      <path className={wireClass} d="M325 74 V105" />
      <VResistor x={325} y={105} length={90} label="RC" />
      <path className={wireClass} d="M325 195 V220" />
      <line className="schematicComponent" x1={275} y1={196} x2={275} y2={258} />
      <line className={wireClass} x1={210} y1={227} x2={275} y2={227} />
      <line className={wireClass} x1={275} y1={210} x2={325} y2={190} />
      <line className={wireClass} x1={275} y1={244} x2={325} y2={265} />
      <path
        className="schematicCurrent"
        d="M299 254 L321 263"
        markerEnd={`url(#${markerId})`}
      />
      <path className={wireClass} d="M325 265 V282" />
      <Ground x={325} y={282} />
      <path
        className="schematicCurrent"
        d="M150 227 H204"
        markerEnd={`url(#${markerId})`}
      />
      <path
        className="schematicCurrent"
        d="M355 105 V184"
        markerEnd={`url(#${markerId})`}
      />
      <text className="schematicValue" x={132} y={211}>
        IB = {values[1] ?? '20 µA'}
      </text>
      <text className="schematicValue" x={365} y={150}>
        IC
      </text>
      <text className="schematicValue" x={205} y={286}>
        NPN, forward-active
      </text>
      <DiagramNote x={392} y={125} width={180}>
        β = {valueOnly(values[0], '90')} → IC = {answer}
      </DiagramNote>
      <Flow d="M325 78 V187" />
    </g>
  );
}

function BinaryDiagram({ answer, values }: DiagramProps) {
  const bitCount = Number.parseInt(values[0]?.match(/\d+/)?.[0] ?? '6', 10);
  const visibleBits = Math.max(1, Math.min(bitCount, 8));
  const gap = 10;
  const cellWidth = (530 - gap * (visibleBits - 1)) / visibleBits;

  return (
    <g>
      <text className="schematicSectionLabel" x={55} y={82}>
        {bitCount}-BIT REGISTER
      </text>
      {Array.from({ length: visibleBits }, (_, index) => {
        const bit = index % 3 === 1 ? '0' : '1';
        const x = 55 + index * (cellWidth + gap);
        return (
          <g key={`${bit}-${index}`}>
            <rect
              className="schematicBitCell schematicAnimatedState"
              x={x}
              y={110}
              width={cellWidth}
              height={76}
              rx={5}
              style={{ animationDelay: `${index * 0.12}s` }}
            />
            <text className="schematicBitValue" x={x + cellWidth / 2} y={158} textAnchor="middle">
              {bit}
            </text>
            <text className="schematicTiny" x={x + cellWidth / 2} y={207} textAnchor="middle">
              b{bitCount - index - 1}
            </text>
          </g>
        );
      })}
      <path className="schematicBrace" d="M55 235 V248 H585 V235" />
      <text className="schematicValue" x={320} y={273} textAnchor="middle">
        2 choices per bit × {bitCount} independent bits
      </text>
      <DiagramNote x={242} y={290} width={155}>
        2^{bitCount} = {answer}
      </DiagramNote>
    </g>
  );
}

function NyquistDiagram({ answer, values }: DiagramProps) {
  return (
    <g>
      <text className="schematicSectionLabel" x={46} y={72}>
        BASEBAND SPECTRUM |X(f)|
      </text>
      <path className="schematicAxis" d="M45 205 H310 M177 225 V88" />
      <path className="schematicSignal" d="M78 205 L177 105 L276 205" />
      <path className="schematicGuide" d="M78 205 V220 M276 205 V220" />
      <text className="schematicValue" x={78} y={242} textAnchor="middle">
        −2 kHz
      </text>
      <text className="schematicValue" x={276} y={242} textAnchor="middle">
        +{values[0] ?? '2 kHz'}
      </text>

      <text className="schematicSectionLabel" x={352} y={72}>
        SAMPLING CLOCK
      </text>
      <path className="schematicAxis" d="M350 205 H595" />
      {[380, 425, 470, 515, 560].map((x) => (
        <line className="schematicSample" x1={x} y1={205} x2={x} y2={115} key={x} />
      ))}
      <path className="schematicDimension" d="M425 235 H470" />
      <line className="schematicThin" x1={425} y1={226} x2={425} y2={244} />
      <line className="schematicThin" x1={470} y1={226} x2={470} y2={244} />
      <text className="schematicValue" x={448} y={261} textAnchor="middle">
        Ts
      </text>
      <DiagramNote x={385} y={286} width={180}>
        fs,min = {answer}
      </DiagramNote>
    </g>
  );
}

function ControlDiagram({ answer, markerId, values }: DiagramProps) {
  return (
    <g>
      <text className="schematicValue" x={40} y={157}>
        r
      </text>
      <path
        className={wireClass}
        d="M58 152 H132"
        markerEnd={`url(#${markerId})`}
      />
      <circle className="schematicSumming" cx={160} cy={152} r={28} />
      <text className="schematicPolarity" x={143} y={139}>
        +
      </text>
      <text className="schematicPolarity" x={145} y={176}>
        −
      </text>
      <path
        className={wireClass}
        d="M188 152 H255"
        markerEnd={`url(#${markerId})`}
      />
      <rect className="schematicBlock" x={260} y={112} width={130} height={80} rx={5} />
      <text className="schematicBlockValue" x={325} y={147} textAnchor="middle">
        K = {valueOnly(values[0], '3')}
      </text>
      <text className="schematicTiny" x={325} y={169} textAnchor="middle">
        forward path
      </text>
      <path
        className={wireClass}
        d="M390 152 H555"
        markerEnd={`url(#${markerId})`}
      />
      <text className="schematicValue" x={565} y={157}>
        y
      </text>
      <Node x={505} y={152} />
      <path className={wireClass} d="M505 152 V262 H160 V180" />
      <rect className="schematicBlock" x={286} y={237} width={78} height={50} rx={5} />
      <text className="schematicBlockValue" x={325} y={268} textAnchor="middle">
        H = 1
      </text>
      <Flow d="M60 152 H545" />
      <DiagramNote x={421} y={58} width={170}>
        T(0) = {answer}
      </DiagramNote>
    </g>
  );
}

function AmDiagram({ answer, values }: DiagramProps) {
  const carrierPath =
    'M45 145 q6 -38 12 0 q6 38 12 0 q6 -38 12 0 q6 38 12 0 q6 -38 12 0 q6 38 12 0 q6 -38 12 0 q6 38 12 0 q6 -38 12 0 q6 38 12 0 q6 -38 12 0 q6 38 12 0 q6 -38 12 0 q6 38 12 0 q6 -38 12 0 q6 38 12 0 q6 -38 12 0 q6 38 12 0 q6 -38 12 0 q6 38 12 0';

  return (
    <g>
      <text className="schematicSectionLabel" x={45} y={66}>
        AM WAVEFORM
      </text>
      <path className="schematicEnvelope" d="M45 145 C105 68 165 68 225 145 C165 222 105 222 45 145" />
      <path className="schematicSignal" d={carrierPath} />
      <text className="schematicSectionLabel" x={322} y={66}>
        DOUBLE-SIDEBAND SPECTRUM
      </text>
      <path className="schematicAxis" d="M315 220 H600 M455 240 V92" />
      <line className="schematicSideband" x1={385} y1={220} x2={385} y2={155} />
      <line className="schematicCarrier" x1={455} y1={220} x2={455} y2={105} />
      <line className="schematicSideband" x1={525} y1={220} x2={525} y2={155} />
      <text className="schematicTiny" x={385} y={243} textAnchor="middle">
        fc−fm
      </text>
      <text className="schematicTiny" x={455} y={243} textAnchor="middle">
        fc
      </text>
      <text className="schematicTiny" x={525} y={243} textAnchor="middle">
        fc+fm
      </text>
      <path className="schematicDimension" d="M385 272 H525" />
      <line className="schematicThin" x1={385} y1={263} x2={385} y2={281} />
      <line className="schematicThin" x1={525} y1={263} x2={525} y2={281} />
      <text className="schematicValue" x={455} y={302} textAnchor="middle">
        BW = {answer}; fm,max = {values[0] ?? '2 kHz'}
      </text>
      <Flow d="M47 145 H268" />
    </g>
  );
}

function AdcDiagram({ answer, values }: DiagramProps) {
  return (
    <g>
      <text className="schematicSectionLabel" x={48} y={70}>
        ANALOG INPUT
      </text>
      <path className="schematicAxis" d="M45 190 H200 M55 225 V95" />
      <path className="schematicSignal" d="M55 160 C75 105 95 105 115 160 S155 215 175 160 S195 105 215 160" />
      <path className={wireClass} d="M215 160 H260" />
      <rect className="schematicBlock" x={260} y={105} width={135} height={110} rx={6} />
      <text className="schematicBlockValue" x={327} y={145} textAnchor="middle">
        {(values[0] ?? '12-bit').toUpperCase()} ADC
      </text>
      <text className="schematicTiny" x={327} y={170} textAnchor="middle">
        Vref = {values[1] ?? values[0] ?? '10 V'}
      </text>
      <text className="schematicTiny" x={327} y={190} textAnchor="middle">
        ideal unipolar
      </text>
      <path className={wireClass} d="M395 160 H445" />
      <path
        className="schematicCode"
        d="M445 215 H470 V195 H495 V170 H520 V145 H545 V120 H585"
      />
      <text className="schematicSectionLabel" x={445} y={92}>
        DIGITAL CODE
      </text>
      <DiagramNote x={430} y={260} width={170}>
        1 LSB = {answer}
      </DiagramNote>
      <Flow d="M215 160 H440" />
    </g>
  );
}

function PcbDelayDiagram({ answer, markerId, values }: DiagramProps) {
  return (
    <g>
      <rect className="schematicIc" x={45} y={105} width={110} height={115} rx={5} />
      <text className="schematicBlockValue" x={100} y={155} textAnchor="middle">
        DRIVER
      </text>
      <text className="schematicTiny" x={100} y={180} textAnchor="middle">
        digital output
      </text>
      <rect className="schematicIc" x={485} y={105} width={110} height={115} rx={5} />
      <text className="schematicBlockValue" x={540} y={155} textAnchor="middle">
        RECEIVER
      </text>
      <text className="schematicTiny" x={540} y={180} textAnchor="middle">
        input load
      </text>
      <path className="schematicTrace" d="M155 160 H485" />
      <path className="schematicReferencePlane" d="M150 235 H490" />
      <text className="schematicTiny" x={320} y={257} textAnchor="middle">
        continuous reference plane
      </text>
      <path
        className="schematicDimension"
        d="M170 88 H470"
        markerEnd={`url(#${markerId})`}
        markerStart={`url(#${markerId})`}
      />
      <text className="schematicValue" x={320} y={76} textAnchor="middle">
        length = {values[0] ?? '4 inch'}
      </text>
      <path
        className="schematicCurrent"
        d="M180 160 H450"
        markerEnd={`url(#${markerId})`}
      />
      <text className="schematicValue" x={320} y={145} textAnchor="middle">
        {values[1] ?? '170 ps/in'}
      </text>
      <DiagramNote x={235} y={285} width={170}>
        tpd = {answer}
      </DiagramNote>
      <Flow d="M160 160 H478" />
    </g>
  );
}

function UartDiagram({ answer, values }: DiagramProps) {
  const x0 = 62;
  const bitWidth = 48;
  const segments = [
    { label: 'START', level: 0 },
    { label: 'D0', level: 1 },
    { label: 'D1', level: 0 },
    { label: 'D2', level: 1 },
    { label: 'D3', level: 1 },
    { label: 'D4', level: 0 },
    { label: 'D5', level: 0 },
    { label: 'D6', level: 1 },
    { label: 'D7', level: 0 },
    { label: 'STOP', level: 1 },
  ];
  const startX = x0 + bitWidth;
  let d = `M${x0} 110 H${startX}`;

  segments.forEach((segment, index) => {
    const y = segment.level ? 110 : 205;
    d += ` V${y} H${startX + bitWidth * (index + 1)}`;
  });

  return (
    <g>
      <text className="schematicSectionLabel" x={52} y={72}>
        UART FRAME · IDLE HIGH
      </text>
      <path className="schematicDigitalSignal" d={d} />
      {segments.map((segment, index) => {
        const left = startX + bitWidth * index;
        return (
          <g key={segment.label}>
            <line className="schematicGuide" x1={left} y1={92} x2={left} y2={235} />
            <text className="schematicTiny" x={left + bitWidth / 2} y={225} textAnchor="middle">
              {segment.label}
            </text>
          </g>
        );
      })}
      <line
        className="schematicGuide"
        x1={startX + bitWidth * segments.length}
        y1={92}
        x2={startX + bitWidth * segments.length}
        y2={235}
      />
      <path className="schematicDimension" d={`M${startX} 270 H${startX + bitWidth}`} />
      <line className="schematicThin" x1={startX} y1={260} x2={startX} y2={280} />
      <line className="schematicThin" x1={startX + bitWidth} y1={260} x2={startX + bitWidth} y2={280} />
      <text className="schematicValue" x={startX + bitWidth / 2} y={300} textAnchor="middle">
        tbit = {answer}
      </text>
      <DiagramNote x={405} y={268} width={180}>
        baud = {values[0] ?? '115200 baud'}
      </DiagramNote>
      <Flow d={d} />
    </g>
  );
}

function RfWavelengthDiagram({ answer, markerId, values }: DiagramProps) {
  return (
    <g>
      <path className="schematicAntenna" d="M105 95 V255 M105 130 L55 90 M105 130 L155 90" />
      <Ground x={105} y={255} />
      <path
        className="schematicSignal"
        d="M155 165 C190 85 225 85 260 165 S330 245 365 165 S435 85 470 165 S540 245 575 165"
      />
      <path
        className="schematicDimension"
        d="M155 275 H365"
        markerEnd={`url(#${markerId})`}
        markerStart={`url(#${markerId})`}
      />
      <text className="schematicValue" x={260} y={302} textAnchor="middle">
        λ = {answer}
      </text>
      <text className="schematicValue" x={420} y={88} textAnchor="middle">
        f = {values[1] ?? '200 MHz'}
      </text>
      <text className="schematicTiny" x={420} y={108} textAnchor="middle">
        c ≈ {valueOnly(values[0], '300 Mm/s')}
      </text>
      <Flow d="M156 165 C190 85 225 85 260 165 S330 245 365 165 S435 85 470 165 S540 245 575 165" />
    </g>
  );
}

function CtDiagram({ answer, markerId, values }: DiagramProps) {
  return (
    <g>
      <text className="schematicSectionLabel" x={45} y={65}>
        PROTECTED PRIMARY
      </text>
      <path className={wireClass} d="M45 118 H125 M165 118 H565" />
      <path className="schematicBreaker" d="M125 118 L160 94 M165 118 H175" />
      <text className="schematicTiny" x={145} y={82} textAnchor="middle">
        breaker
      </text>
      <path
        className="schematicCurrent"
        d="M190 118 H520"
        markerEnd={`url(#${markerId})`}
      />
      <text className="schematicValue" x={405} y={99}>
        Ip = {values[1] ?? '50 A'}
      </text>
      <circle className="schematicCtCore" cx={300} cy={118} r={58} />
      <circle className="schematicCtWindow" cx={300} cy={118} r={30} />
      <path className="schematicCoil secondary" d="M253 154 q12 22 24 0 q12 22 24 0 q12 22 24 0 q12 22 24 0" />
      <path className={wireClass} d="M253 168 V270 H390 M349 168 V220 H470 V270 H450" />
      <rect className="schematicRelay" x={390} y={235} width={60} height={70} rx={5} />
      <text className="schematicBlockValue" x={420} y={266} textAnchor="middle">
        50/51
      </text>
      <text className="schematicTiny" x={420} y={286} textAnchor="middle">
        relay
      </text>
      <Ground x={470} y={270} />
      <path
        className="schematicTrip"
        d="M390 270 H205 V148"
        markerEnd={`url(#${markerId})`}
      />
      <text className="schematicTiny" x={230} y={254}>
        trip
      </text>
      <text className="schematicValue" x={300} y={210} textAnchor="middle">
        CT {values[0] ?? '400:5'}
      </text>
      <DiagramNote x={470} y={170} width={135}>
        Is = {answer}
      </DiagramNote>
      <Flow d="M180 118 H550" />
      <Flow d="M253 175 V270 H380" />
    </g>
  );
}

type DiagramProps = {
  answer: string;
  markerId: string;
  values: string[];
};

function getDiagram(question: LessonQuestion, props: DiagramProps) {
  switch (question.subtopic) {
    case "Ohm's law":
      return <OhmsLawDiagram {...props} />;
    case 'Sinusoid to RMS phasor':
      return <AcPhasorDiagram {...props} />;
    case 'Thevenin to Norton':
      return <TheveninNortonDiagram {...props} />;
    case 'RC time constant':
      return <RcDiagram {...props} />;
    case 'Coulomb force':
      return <CoulombDiagram {...props} />;
    case 'Lossless characteristic impedance':
      return <TransmissionLineDiagram {...props} />;
    case 'Three-phase real power':
      return <ThreePhaseDiagram {...props} />;
    case 'Transformer voltage ratio':
      return <TransformerDiagram {...props} />;
    case 'Buck converter output':
      return <BuckDiagram {...props} />;
    case 'Inverting op-amp gain':
      return <OpAmpDiagram {...props} />;
    case 'BJT collector current':
      return <BjtDiagram {...props} />;
    case 'Binary state count':
      return <BinaryDiagram {...props} />;
    case 'Nyquist sampling':
      return <NyquistDiagram {...props} />;
    case 'Unity-feedback closed-loop gain':
      return <ControlDiagram {...props} />;
    case 'AM bandwidth':
      return <AmDiagram {...props} />;
    case 'ADC LSB size':
      return <AdcDiagram {...props} />;
    case 'Trace propagation delay':
      return <PcbDelayDiagram {...props} />;
    case 'UART bit time':
      return <UartDiagram {...props} />;
    case 'Free-space wavelength':
      return <RfWavelengthDiagram {...props} />;
    case 'CT secondary current':
      return <CtDiagram {...props} />;
    default:
      return <OhmsLawDiagram {...props} />;
  }
}

export function QuestionSchematic({
  powered,
  question,
  revealed,
}: QuestionSchematicProps) {
  const markerId = `schematic-arrow-${question.id}`;
  const answer = revealed ? question.options[question.correctIndex] : '?';

  return (
    <div className={`accurateSchematic ${powered ? 'energized' : 'paused'}`}>
      <svg
        aria-label={`${question.subtopic} interactive schematic`}
        role="img"
        viewBox="0 0 640 350"
      >
        <title>{`${question.subtopic} interactive schematic`}</title>
        <desc>{question.prompt}</desc>
        <defs>
          <marker
            id={markerId}
            markerHeight="8"
            markerWidth="8"
            orient="auto-start-reverse"
            refX="7"
            refY="4"
          >
            <path d="M0,0 L8,4 L0,8 z" className="schematicMarker" />
          </marker>
          <pattern id={`grid-${question.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path className="schematicGridLine" d="M24 0 H0 V24" />
          </pattern>
        </defs>
        <rect className="schematicBackdrop" width="640" height="350" rx="6" />
        <rect
          className="schematicGrid"
          width="640"
          height="350"
          rx="6"
          fill={`url(#grid-${question.id})`}
        />
        <g className="schematicContent">{getDiagram(question, { answer, markerId, values: question.visualValues })}</g>
        <g className="schematicLiveState" transform="translate(506 18)">
          <circle cx="8" cy="8" r="5" />
          <text x="20" y="12">
            {powered ? 'ANIMATION ON' : 'PAUSED'}
          </text>
        </g>
      </svg>
    </div>
  );
}
