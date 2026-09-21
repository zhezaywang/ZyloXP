import {
  CheckCircle2,
  ChevronDown,
  CircuitBoard,
  Cpu,
  Download,
  Eye,
  EyeOff,
  Grid3X3,
  Layers3,
  Lightbulb,
  MousePointer2,
  Maximize,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  Route,
  Save,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
  Undo2,
  Usb,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import './PcbDesigner.css';
import {
  BOARD_WIDTH, BOARD_HEIGHT, MAX_COMPONENTS, MAX_TRACES, PCB_STORAGE_KEY,
  readPcbDraft, readPcbProjects, writePcbDraft,
} from './pcbStorage';
import type { FootprintKind, PadEndpoint, PcbBoardSnapshot, PcbFootprint, PcbLayer, PcbTrace } from './pcbStorage';

type PcbTool = 'place' | 'route' | 'select';

type PadDefinition = {
  name: string;
  x: number;
  y: number;
};

type FootprintDefinition = {
  description: string;
  height: number;
  icon: LucideIcon;
  label: string;
  pads: PadDefinition[];
  prefix: string;
  width: number;
};

type EditorSnapshot = {
  components: PcbFootprint[];
  name: string;
  traces: PcbTrace[];
};

type RequiredConnection = {
  end: PadEndpoint;
  id: string;
  net: string;
  start: PadEndpoint;
};

type DrcIssue = {
  detail: string;
  id: string;
  severity: 'error' | 'warning';
  title: string;
};

type PcbDesignerProps = {
  onSaved?: (savedCount: number) => void;
};

const BOARD_EDGE_CLEARANCE = 22;
const TRACE_WIDTHS = [0.25, 0.5, 0.8, 1.2];
const GRID_OPTIONS = [1, 2.5, 5];
const BOARD_X_UNITS_PER_MM = BOARD_WIDTH / 160;
const BOARD_Y_UNITS_PER_MM = BOARD_HEIGHT / 100;
const MAX_HISTORY = 30;

const FOOTPRINT_DEFINITIONS: Record<FootprintKind, FootprintDefinition> = {
  capacitor: {
    description: '100 nF decoupling',
    height: 34,
    icon: CircuitBoard,
    label: 'Capacitor',
    pads: [
      { name: '1', x: -25, y: 0 },
      { name: '2', x: 25, y: 0 },
    ],
    prefix: 'C',
    width: 70,
  },
  header: {
    description: '2 x 3 programming header',
    height: 70,
    icon: CircuitBoard,
    label: 'Header',
    pads: [
      { name: '1', x: -20, y: -20 },
      { name: '2', x: 20, y: -20 },
      { name: '3', x: -20, y: 0 },
      { name: '4', x: 20, y: 0 },
      { name: '5', x: -20, y: 20 },
      { name: '6', x: 20, y: 20 },
    ],
    prefix: 'J',
    width: 70,
  },
  led: {
    description: '0603 indicator LED',
    height: 38,
    icon: Lightbulb,
    label: 'LED',
    pads: [
      { name: 'A', x: -27, y: 0 },
      { name: 'K', x: 27, y: 0 },
    ],
    prefix: 'D',
    width: 76,
  },
  mcu: {
    description: 'QFN-32 microcontroller',
    height: 126,
    icon: Cpu,
    label: 'MCU',
    pads: [
      { name: '1', x: -68, y: -42 },
      { name: '2', x: -68, y: -14 },
      { name: '3', x: -68, y: 14 },
      { name: '4', x: -68, y: 42 },
      { name: '5', x: 68, y: 42 },
      { name: '6', x: 68, y: 14 },
      { name: '7', x: 68, y: -14 },
      { name: '8', x: 68, y: -42 },
    ],
    prefix: 'U',
    width: 126,
  },
  regulator: {
    description: '3.3 V LDO regulator',
    height: 76,
    icon: CircuitBoard,
    label: 'Regulator',
    pads: [
      { name: 'IN', x: -52, y: -22 },
      { name: 'GND', x: -52, y: 22 },
      { name: 'OUT', x: 52, y: 0 },
    ],
    prefix: 'U',
    width: 100,
  },
  resistor: {
    description: '0603 series resistor',
    height: 34,
    icon: CircuitBoard,
    label: 'Resistor',
    pads: [
      { name: '1', x: -30, y: 0 },
      { name: '2', x: 30, y: 0 },
    ],
    prefix: 'R',
    width: 82,
  },
  usb: {
    description: 'USB-C power input',
    height: 112,
    icon: Usb,
    label: 'USB-C',
    pads: [
      { name: 'VBUS', x: 55, y: -31 },
      { name: 'D-', x: 55, y: -10 },
      { name: 'D+', x: 55, y: 10 },
      { name: 'GND', x: 55, y: 31 },
    ],
    prefix: 'J',
    width: 110,
  },
};

const SAMPLE_COMPONENTS: PcbFootprint[] = [
  { id: 'usb-input', kind: 'usb', reference: 'J1', rotation: 0, x: 95, y: 270 },
  { id: 'power-regulator', kind: 'regulator', reference: 'U1', rotation: 0, x: 275, y: 270 },
  { id: 'mcu-main', kind: 'mcu', reference: 'U2', rotation: 0, x: 520, y: 270 },
  { id: 'decoupling-1', kind: 'capacitor', reference: 'C1', rotation: 90, x: 390, y: 182 },
  { id: 'decoupling-2', kind: 'capacitor', reference: 'C2', rotation: 90, x: 650, y: 198 },
  { id: 'status-led', kind: 'led', reference: 'D1', rotation: 0, x: 690, y: 330 },
  { id: 'status-resistor', kind: 'resistor', reference: 'R1', rotation: 0, x: 785, y: 330 },
  { id: 'program-header', kind: 'header', reference: 'J2', rotation: 0, x: 790, y: 180 },
];

const SAMPLE_TRACES: PcbTrace[] = [
  {
    end: { componentId: 'power-regulator', padIndex: 0 },
    id: 'trace-vbus',
    layer: 'top',
    net: 'VBUS',
    start: { componentId: 'usb-input', padIndex: 0 },
    width: 0.8,
  },
  {
    end: { componentId: 'mcu-main', padIndex: 0 },
    id: 'trace-3v3',
    layer: 'top',
    net: '3V3',
    start: { componentId: 'power-regulator', padIndex: 2 },
    width: 0.5,
  },
  {
    end: { componentId: 'decoupling-1', padIndex: 0 },
    id: 'trace-c1',
    layer: 'top',
    net: '3V3',
    start: { componentId: 'power-regulator', padIndex: 2 },
    width: 0.5,
  },
  {
    end: { componentId: 'decoupling-2', padIndex: 0 },
    id: 'trace-c2',
    layer: 'bottom',
    net: '3V3',
    start: { componentId: 'mcu-main', padIndex: 7 },
    width: 0.5,
  },
  {
    end: { componentId: 'status-led', padIndex: 0 },
    id: 'trace-led',
    layer: 'top',
    net: 'STATUS',
    start: { componentId: 'mcu-main', padIndex: 5 },
    width: 0.25,
  },
  {
    end: { componentId: 'status-resistor', padIndex: 0 },
    id: 'trace-led-r',
    layer: 'top',
    net: 'STATUS',
    start: { componentId: 'status-led', padIndex: 1 },
    width: 0.25,
  },
];

const SAMPLE_REQUIRED_CONNECTIONS: RequiredConnection[] = [
  {
    end: { componentId: 'power-regulator', padIndex: 0 },
    id: 'required-vbus',
    net: 'VBUS',
    start: { componentId: 'usb-input', padIndex: 0 },
  },
  {
    end: { componentId: 'mcu-main', padIndex: 0 },
    id: 'required-3v3-main',
    net: '3V3',
    start: { componentId: 'power-regulator', padIndex: 2 },
  },
  {
    end: { componentId: 'decoupling-1', padIndex: 0 },
    id: 'required-3v3-c1',
    net: '3V3',
    start: { componentId: 'power-regulator', padIndex: 2 },
  },
  {
    end: { componentId: 'decoupling-2', padIndex: 0 },
    id: 'required-3v3-c2',
    net: '3V3',
    start: { componentId: 'mcu-main', padIndex: 7 },
  },
  {
    end: { componentId: 'status-led', padIndex: 0 },
    id: 'required-status-led',
    net: 'STATUS',
    start: { componentId: 'mcu-main', padIndex: 5 },
  },
  {
    end: { componentId: 'status-resistor', padIndex: 0 },
    id: 'required-status-resistor',
    net: 'STATUS',
    start: { componentId: 'status-led', padIndex: 1 },
  },
  {
    end: { componentId: 'power-regulator', padIndex: 1 },
    id: 'required-ground',
    net: 'GND',
    start: { componentId: 'usb-input', padIndex: 3 },
  },
  {
    end: { componentId: 'program-header', padIndex: 0 },
    id: 'required-swdio',
    net: 'SWDIO',
    start: { componentId: 'mcu-main', padIndex: 6 },
  },
];

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneComponents(components: PcbFootprint[]) {
  return components.map((component) => ({ ...component }));
}

function cloneTraces(traces: PcbTrace[]) {
  return traces.map((trace) => ({
    ...trace,
    end: { ...trace.end },
    start: { ...trace.start },
  }));
}

function cloneEditorSnapshot(snapshot: EditorSnapshot): EditorSnapshot {
  return {
    components: cloneComponents(snapshot.components),
    name: snapshot.name,
    traces: cloneTraces(snapshot.traces),
  };
}

function endpointKey(endpoint: PadEndpoint) {
  return `${endpoint.componentId}:${endpoint.padIndex}`;
}

function connectionKey(start: PadEndpoint, end: PadEndpoint) {
  return [endpointKey(start), endpointKey(end)].sort().join('|');
}

function endpointsMatch(
  leftStart: PadEndpoint,
  leftEnd: PadEndpoint,
  rightStart: PadEndpoint,
  rightEnd: PadEndpoint,
) {
  return connectionKey(leftStart, leftEnd) === connectionKey(rightStart, rightEnd);
}

function getRotatedSize(component: PcbFootprint) {
  const definition = FOOTPRINT_DEFINITIONS[component.kind];
  return component.rotation === 90 || component.rotation === 270
    ? { height: definition.width, width: definition.height }
    : { height: definition.height, width: definition.width };
}

function rotatePoint(x: number, y: number, rotation: PcbFootprint['rotation']) {
  if (rotation === 90) {
    return { x: -y, y: x };
  }
  if (rotation === 180) {
    return { x: -x, y: -y };
  }
  if (rotation === 270) {
    return { x: y, y: -x };
  }
  return { x, y };
}

function getPadPosition(component: PcbFootprint, padIndex: number) {
  const pad = FOOTPRINT_DEFINITIONS[component.kind].pads[padIndex];
  if (!pad) {
    return { x: component.x, y: component.y };
  }
  const rotated = rotatePoint(pad.x, pad.y, component.rotation);
  return { x: component.x + rotated.x, y: component.y + rotated.y };
}

function tracePath(trace: PcbTrace, components: PcbFootprint[]) {
  const startComponent = components.find(
    (component) => component.id === trace.start.componentId,
  );
  const endComponent = components.find(
    (component) => component.id === trace.end.componentId,
  );
  if (!startComponent || !endComponent) {
    return '';
  }
  const start = getPadPosition(startComponent, trace.start.padIndex);
  const end = getPadPosition(endComponent, trace.end.padIndex);
  return tracePathBetween(start, end);
}

function tracePathBetween(
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  const middleX = start.x + (end.x - start.x) * 0.52;
  return `M ${start.x} ${start.y} H ${middleX} V ${end.y} H ${end.x}`;
}

function traceLengthMm(trace: PcbTrace, components: PcbFootprint[]) {
  const startComponent = components.find(
    (component) => component.id === trace.start.componentId,
  );
  const endComponent = components.find(
    (component) => component.id === trace.end.componentId,
  );
  if (!startComponent || !endComponent) {
    return 0;
  }
  const start = getPadPosition(startComponent, trace.start.padIndex);
  const end = getPadPosition(endComponent, trace.end.padIndex);
  return Math.abs(end.x - start.x) / BOARD_X_UNITS_PER_MM +
    Math.abs(end.y - start.y) / BOARD_Y_UNITS_PER_MM;
}

const PAD_COUNTS = Object.fromEntries(
  Object.entries(FOOTPRINT_DEFINITIONS).map(([kind, definition]) => [kind, definition.pads.length]),
) as Record<FootprintKind, number>;

function readSavedDesigns() {
  try {
    return readPcbProjects(window.localStorage, PAD_COUNTS);
  } catch {
    return [];
  }
}

function readDraft() {
  try {
    return readPcbDraft(window.localStorage, PAD_COUNTS);
  } catch {
    return null;
  }
}

function persistDraft(snapshot: EditorSnapshot) {
  try {
    return writePcbDraft(window.localStorage, {
      ...snapshot, id: 'current-draft', savedAt: Date.now(),
    });
  } catch {
    return false;
  }
}

function FootprintGraphic({
  component,
  onKeyDown,
  onPadPointerDown,
  onPointerDown,
  routeStart,
  selected,
}: {
  component: PcbFootprint;
  onKeyDown: (event: ReactKeyboardEvent<SVGGElement>) => void;
  onPadPointerDown: (
    event: ReactPointerEvent<SVGGElement>,
    padIndex: number,
  ) => void;
  onPointerDown: (event: ReactPointerEvent<SVGGElement>) => void;
  routeStart: PadEndpoint | null;
  selected: boolean;
}) {
  const definition = FOOTPRINT_DEFINITIONS[component.kind];
  const bodyWidth = Math.max(32, definition.width - 28);
  const bodyHeight = Math.max(24, definition.height - 22);

  return (
    <g
      aria-label={`${component.reference} ${definition.label}`}
      className={`pcbFootprint ${selected ? 'selected' : ''}`}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      role="button"
      tabIndex={0}
      transform={`translate(${component.x} ${component.y}) rotate(${component.rotation})`}
    >
      <rect
        className="pcbCourtyard"
        height={definition.height + 14}
        rx="4"
        width={definition.width + 14}
        x={-(definition.width + 14) / 2}
        y={-(definition.height + 14) / 2}
      />
      {component.kind === 'usb' ? (
        <g className="pcbUsbBody">
          <path d="M-55 -50H22L46 -35V35L22 50H-55Z" />
          <rect height="48" rx="6" width="66" x="-46" y="-24" />
          <path d="M-36 -12H10M-36 0H10M-36 12H10" />
        </g>
      ) : component.kind === 'led' ? (
        <g className="pcbLedBody">
          <circle r="18" />
          <path d="M-7 8L0 -9L8 8Z" />
          <path d="M12 -14l11 -8M17 -5l11 -8" />
        </g>
      ) : component.kind === 'capacitor' ? (
        <g className="pcbPassiveBody capacitor">
          <rect height={bodyHeight} rx="5" width={bodyWidth} x={-bodyWidth / 2} y={-bodyHeight / 2} />
          <path d={`M-4 ${-bodyHeight / 2}V${bodyHeight / 2}M4 ${-bodyHeight / 2}V${bodyHeight / 2}`} />
        </g>
      ) : component.kind === 'resistor' ? (
        <g className="pcbPassiveBody resistor">
          <rect height={bodyHeight} rx="4" width={bodyWidth} x={-bodyWidth / 2} y={-bodyHeight / 2} />
          <path d={`M-10 ${-bodyHeight / 2}V${bodyHeight / 2}M0 ${-bodyHeight / 2}V${bodyHeight / 2}M10 ${-bodyHeight / 2}V${bodyHeight / 2}`} />
        </g>
      ) : component.kind === 'header' ? (
        <g className="pcbHeaderBody">
          <rect height={bodyHeight} rx="4" width={bodyWidth} x={-bodyWidth / 2} y={-bodyHeight / 2} />
          <path d="M0 -30V30" />
        </g>
      ) : (
        <g className={`pcbChipBody ${component.kind}`}>
          <rect height={bodyHeight} rx="7" width={bodyWidth} x={-bodyWidth / 2} y={-bodyHeight / 2} />
          <circle cx={-bodyWidth / 2 + 12} cy={-bodyHeight / 2 + 12} r="5" />
          {component.kind === 'mcu' && (
            <>
              <path d="M-28 -18H28M-28 0H28M-28 18H28" />
              <text textAnchor="middle" x="0" y="5">MCU</text>
            </>
          )}
          {component.kind === 'regulator' && (
            <text textAnchor="middle" x="0" y="5">3V3</text>
          )}
        </g>
      )}

      <text className="pcbReference" textAnchor="middle" x="0" y={-definition.height / 2 - 13}>
        {component.reference}
      </text>
      {definition.pads.map((pad, padIndex) => {
        const isRouteStart =
          routeStart?.componentId === component.id &&
          routeStart.padIndex === padIndex;
        return (
          <g
            aria-label={`${component.reference} pad ${pad.name}`}
            className={`pcbPad ${isRouteStart ? 'routeStart' : ''}`}
            key={`${component.id}-${pad.name}`}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onPadPointerDown(
                  event as unknown as ReactPointerEvent<SVGGElement>,
                  padIndex,
                );
              }
            }}
            onPointerDown={(event) => onPadPointerDown(event, padIndex)}
            role="button"
            tabIndex={0}
            transform={`translate(${pad.x} ${pad.y})`}
          >
            <circle className="pcbPadRing" r="10" />
            <circle className="pcbPadHole" r="4" />
            <text x="0" y="-14">{pad.name}</text>
          </g>
        );
      })}
    </g>
  );
}

export function PcbDesigner({ onSaved }: PcbDesignerProps) {
  const [initialDraft] = useState(readDraft);
  const [name, setName] = useState(initialDraft?.name ?? 'Sensor Node Rev A');
  const [components, setComponents] = useState<PcbFootprint[]>(() =>
    cloneComponents(initialDraft?.components ?? SAMPLE_COMPONENTS),
  );
  const [traces, setTraces] = useState<PcbTrace[]>(() =>
    cloneTraces(initialDraft?.traces ?? SAMPLE_TRACES),
  );
  const [savedDesigns, setSavedDesigns] = useState<PcbBoardSnapshot[]>(readSavedDesigns);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialDraft ? initialDraft.components[0]?.id ?? null : 'mcu-main',
  );
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [paletteKind, setPaletteKind] = useState<FootprintKind>('capacitor');
  const [tool, setTool] = useState<PcbTool>('select');
  const [activeLayer, setActiveLayer] = useState<PcbLayer>('top');
  const [traceWidth, setTraceWidth] = useState(0.5);
  const [routeStart, setRouteStart] = useState<PadEndpoint | null>(null);
  const [routeCursor, setRouteCursor] = useState<{ x: number; y: number } | null>(null);
  const [gridMm, setGridMm] = useState(2.5);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showInactiveLayer, setShowInactiveLayer] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [drcHasRun, setDrcHasRun] = useState(false);
  const [saveMessage, setSaveMessage] = useState(initialDraft ? 'Draft restored' : 'Sensor node starter');
  const [draftStatus, setDraftStatus] = useState<'saving' | 'saved' | 'unavailable'>('saved');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<EditorSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<EditorSnapshot[]>([]);
  const dragStateRef = useRef<{
    before: EditorSnapshot;
    id: string;
    moved: boolean;
    offsetX: number;
    offsetY: number;
    pointerId: number;
  } | null>(null);
  const editorSnapshotRef = useRef<EditorSnapshot>({
    components: cloneComponents(SAMPLE_COMPONENTS),
    name: 'Sensor Node Rev A',
    traces: cloneTraces(SAMPLE_TRACES),
  });
  editorSnapshotRef.current = { components, name, traces };

  useEffect(() => {
    setDraftStatus('saving');
    const timer = window.setTimeout(() => {
      setDraftStatus(persistDraft(editorSnapshotRef.current) ? 'saved' : 'unavailable');
    }, 400);
    return () => window.clearTimeout(timer);
  }, [components, name, traces]);

  useEffect(() => {
    const flush = () => { persistDraft(editorSnapshotRef.current); };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      flush();
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const selectedComponent = components.find(
    (component) => component.id === selectedId,
  ) ?? null;
  const selectedTrace = traces.find((trace) => trace.id === selectedTraceId) ?? null;
  const gridUnitsX = gridMm * BOARD_X_UNITS_PER_MM;
  const gridUnitsY = gridMm * BOARD_Y_UNITS_PER_MM;
  const requiredConnections = useMemo(
    () => SAMPLE_REQUIRED_CONNECTIONS.filter((connection) => {
      const startComponent = components.find(
        (component) => component.id === connection.start.componentId,
      );
      const endComponent = components.find(
        (component) => component.id === connection.end.componentId,
      );
      return Boolean(
        startComponent &&
        endComponent &&
        FOOTPRINT_DEFINITIONS[startComponent.kind].pads[connection.start.padIndex] &&
        FOOTPRINT_DEFINITIONS[endComponent.kind].pads[connection.end.padIndex],
      );
    }),
    [components],
  );
  const unroutedConnections = useMemo(
    () => requiredConnections.filter(
      (connection) => !traces.some((trace) =>
        endpointsMatch(trace.start, trace.end, connection.start, connection.end),
      ),
    ),
    [requiredConnections, traces],
  );
  const routePreviewPath = useMemo(() => {
    if (!routeStart || !routeCursor) {
      return '';
    }
    const startComponent = components.find(
      (component) => component.id === routeStart.componentId,
    );
    if (!startComponent) {
      return '';
    }
    return tracePathBetween(
      getPadPosition(startComponent, routeStart.padIndex),
      routeCursor,
    );
  }, [components, routeCursor, routeStart]);

  const drcIssues = useMemo<DrcIssue[]>(() => {
    const issues: DrcIssue[] = [];
    components.forEach((component) => {
      const size = getRotatedSize(component);
      if (
        component.x - size.width / 2 < BOARD_EDGE_CLEARANCE ||
        component.x + size.width / 2 > BOARD_WIDTH - BOARD_EDGE_CLEARANCE ||
        component.y - size.height / 2 < BOARD_EDGE_CLEARANCE ||
        component.y + size.height / 2 > BOARD_HEIGHT - BOARD_EDGE_CLEARANCE
      ) {
        issues.push({
          detail: `${component.reference} crosses the component placement margin.`,
          id: `edge-${component.id}`,
          severity: 'error',
          title: 'Board-edge clearance',
        });
      }
    });

    for (let leftIndex = 0; leftIndex < components.length; leftIndex += 1) {
      const left = components[leftIndex];
      const leftSize = getRotatedSize(left);
      for (let rightIndex = leftIndex + 1; rightIndex < components.length; rightIndex += 1) {
        const right = components[rightIndex];
        const rightSize = getRotatedSize(right);
        const overlapX =
          Math.abs(left.x - right.x) <
          (leftSize.width + rightSize.width) / 2 + 6;
        const overlapY =
          Math.abs(left.y - right.y) <
          (leftSize.height + rightSize.height) / 2 + 6;
        if (overlapX && overlapY) {
          issues.push({
            detail: `${left.reference} and ${right.reference} have overlapping courtyards.`,
            id: `overlap-${left.id}-${right.id}`,
            severity: 'error',
            title: 'Footprint overlap',
          });
        }
      }
    }

    if (unroutedConnections.length > 0) {
      issues.push({
        detail: `${unroutedConnections.length} required ${unroutedConnections.length === 1 ? 'connection remains' : 'connections remain'}; follow the dashed airwires.`,
        id: 'unrouted-required-connections',
        severity: 'warning',
        title: 'Unrouted connections',
      });
    }

    const seenConnections = new Set<string>();
    traces.forEach((trace) => {
      const key = connectionKey(trace.start, trace.end);
      if (seenConnections.has(key)) {
        issues.push({
          detail: `${trace.net} duplicates an existing pad-to-pad route.`,
          id: `duplicate-${trace.id}`,
          severity: 'warning',
          title: 'Duplicate copper route',
        });
      }
      seenConnections.add(key);
    });
    if (routeStart) {
      issues.push({
        detail: 'Finish the active route or select the Route tool again to cancel it.',
        id: 'open-route',
        severity: 'warning',
        title: 'Route in progress',
      });
    }
    return issues;
  }, [components, routeStart, traces, unroutedConnections]);

  const errorCount = drcIssues.filter((issue) => issue.severity === 'error').length;
  const warningCount = drcIssues.filter((issue) => issue.severity === 'warning').length;
  const challengeChecks = [
    {
      complete: components.some((component) => component.kind === 'mcu'),
      label: 'Place a microcontroller',
    },
    {
      complete: components.some((component) => component.kind === 'regulator'),
      label: 'Add a 3.3 V regulator',
    },
    {
      complete:
        components.filter((component) => component.kind === 'capacitor').length >= 2,
      label: 'Place two decoupling capacitors',
    },
    {
      complete: traces.length >= 6,
      label: 'Route six copper connections',
    },
    {
      complete: requiredConnections.length > 0 && unroutedConnections.length === 0,
      label: 'Finish every required net',
    },
    {
      complete: errorCount === 0,
      label: 'Clear placement violations',
    },
  ];
  const completedChallengeChecks = challengeChecks.filter(
    (check) => check.complete,
  ).length;
  const routedPadCount = new Set(
    traces.flatMap((trace) => [
      `${trace.start.componentId}:${trace.start.padIndex}`,
      `${trace.end.componentId}:${trace.end.padIndex}`,
    ]),
  ).size;
  const selectedTraceLength = selectedTrace
    ? traceLengthMm(selectedTrace, components)
    : 0;

  useEffect(() => {
    function handleHistoryShortcut(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        !target?.closest('.pcbDesignerPage') ||
        target?.matches('input, select, textarea') ||
        target?.isContentEditable ||
        (!event.metaKey && !event.ctrlKey)
      ) {
        return;
      }
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redoBoard();
        } else {
          undoBoard();
        }
      } else if (event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redoBoard();
      }
    }
    window.addEventListener('keydown', handleHistoryShortcut);
    return () => window.removeEventListener('keydown', handleHistoryShortcut);
  }, [components, name, redoStack, traces, undoStack]);

  function boardPoint(
    svg: SVGSVGElement,
    clientX: number,
    clientY: number,
  ) {
    const matrix = svg.getScreenCTM();
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    if (!matrix) {
      return { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT / 2 };
    }
    const transformed = point.matrixTransform(matrix.inverse());
    return { x: transformed.x, y: transformed.y };
  }

  function snapshotNow() {
    return cloneEditorSnapshot(editorSnapshotRef.current);
  }

  function recordHistory(snapshot: EditorSnapshot = editorSnapshotRef.current) {
    setUndoStack((current) => [
      ...current.slice(-(MAX_HISTORY - 1)),
      cloneEditorSnapshot(snapshot),
    ]);
    setRedoStack([]);
  }

  function restoreEditorSnapshot(snapshot: EditorSnapshot, message: string) {
    const restored = cloneEditorSnapshot(snapshot);
    setName(restored.name);
    setComponents(restored.components);
    setTraces(restored.traces);
    setSelectedId((current) =>
      restored.components.some((component) => component.id === current)
        ? current
        : restored.components[0]?.id ?? null,
    );
    setSelectedTraceId((current) =>
      restored.traces.some((trace) => trace.id === current) ? current : null,
    );
    setRouteStart(null);
    setRouteCursor(null);
    setTool('select');
    setDrcHasRun(false);
    setSaveMessage(message);
  }

  function undoBoard() {
    const previous = undoStack.at(-1);
    if (!previous) {
      return;
    }
    setUndoStack((current) => current.slice(0, -1));
    setRedoStack((current) => [
      ...current.slice(-(MAX_HISTORY - 1)),
      snapshotNow(),
    ]);
    restoreEditorSnapshot(previous, 'Undid last board edit');
  }

  function redoBoard() {
    const next = redoStack.at(-1);
    if (!next) {
      return;
    }
    setRedoStack((current) => current.slice(0, -1));
    setUndoStack((current) => [
      ...current.slice(-(MAX_HISTORY - 1)),
      snapshotNow(),
    ]);
    restoreEditorSnapshot(next, 'Redid board edit');
  }

  function markChanged(message = 'Unsaved changes') {
    setDrcHasRun(false);
    setSaveMessage(message);
  }

  function snapCoordinate(value: number, axis: 'x' | 'y') {
    const interval = axis === 'x' ? gridUnitsX : gridUnitsY;
    return snapEnabled ? Math.round(value / interval) * interval : value;
  }

  function moveComponent(
    componentId: string,
    x: number,
    y: number,
    useSnap = true,
  ) {
    setComponents((currentComponents) =>
      currentComponents.map((component) => {
        if (component.id !== componentId) {
          return component;
        }
        const size = getRotatedSize(component);
        const nextX = useSnap ? snapCoordinate(x, 'x') : x;
        const nextY = useSnap ? snapCoordinate(y, 'y') : y;
        return {
          ...component,
          x: clamp(
            nextX,
            BOARD_EDGE_CLEARANCE + size.width / 2,
            BOARD_WIDTH - BOARD_EDGE_CLEARANCE - size.width / 2,
          ),
          y: clamp(
            nextY,
            BOARD_EDGE_CLEARANCE + size.height / 2,
            BOARD_HEIGHT - BOARD_EDGE_CLEARANCE - size.height / 2,
          ),
        };
      }),
    );
    markChanged();
  }

  function nextReference(kind: FootprintKind) {
    const prefix = FOOTPRINT_DEFINITIONS[kind].prefix;
    const usedReferences = new Set(components.map((component) => component.reference));
    let index = 1;
    while (usedReferences.has(`${prefix}${index}`)) {
      index += 1;
    }
    return `${prefix}${index}`;
  }

  function placeComponent(x: number, y: number) {
    if (components.length >= MAX_COMPONENTS) {
      setSaveMessage('Board limit reached: 80 footprints');
      return;
    }
    const definition = FOOTPRINT_DEFINITIONS[paletteKind];
    const placementX = snapCoordinate(x, 'x');
    const placementY = snapCoordinate(y, 'y');
    const component: PcbFootprint = {
      id: makeId(paletteKind),
      kind: paletteKind,
      reference: nextReference(paletteKind),
      rotation: 0,
      x: clamp(
        placementX,
        BOARD_EDGE_CLEARANCE + definition.width / 2,
        BOARD_WIDTH - BOARD_EDGE_CLEARANCE - definition.width / 2,
      ),
      y: clamp(
        placementY,
        BOARD_EDGE_CLEARANCE + definition.height / 2,
        BOARD_HEIGHT - BOARD_EDGE_CLEARANCE - definition.height / 2,
      ),
    };
    recordHistory();
    setComponents((current) => [...current, component]);
    setSelectedId(component.id);
    setSelectedTraceId(null);
    setTool('select');
    markChanged();
  }

  function handleBoardPointerDown(event: ReactPointerEvent<SVGRectElement>) {
    if (tool !== 'place') {
      if (tool === 'select') {
        setSelectedId(null);
        setSelectedTraceId(null);
      }
      return;
    }
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) {
      return;
    }
    event.preventDefault();
    const point = boardPoint(svg, event.clientX, event.clientY);
    placeComponent(point.x, point.y);
  }

  function handleFootprintPointerDown(
    event: ReactPointerEvent<SVGGElement>,
    componentId: string,
  ) {
    event.stopPropagation();
    if (event.button !== 0) return;
    setSelectedId(componentId);
    setSelectedTraceId(null);
    if (tool !== 'select') {
      return;
    }
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) {
      return;
    }
    svg.setPointerCapture(event.pointerId);
    const point = boardPoint(svg, event.clientX, event.clientY);
    const component = components.find((item) => item.id === componentId)!;
    dragStateRef.current = {
      before: snapshotNow(),
      id: componentId,
      moved: false,
      offsetX: component.x - point.x,
      offsetY: component.y - point.y,
      pointerId: event.pointerId,
    };
  }

  function handleBoardPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const point = boardPoint(event.currentTarget, event.clientX, event.clientY);
    if (routeStart) {
      setRouteCursor({
        x: snapCoordinate(point.x, 'x'),
        y: snapCoordinate(point.y, 'y'),
      });
    }
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }
    dragState.moved = true;
    moveComponent(dragState.id, point.x + dragState.offsetX, point.y + dragState.offsetY);
  }

  function handleBoardPointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    const dragState = dragStateRef.current;
    if (!dragState) {
      return;
    }
    dragStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(dragState.pointerId)) {
      event.currentTarget.releasePointerCapture(dragState.pointerId);
    }
    if (dragState.moved) {
      recordHistory(dragState.before);
    }
  }

  function handlePadPointerDown(
    event: ReactPointerEvent<SVGGElement>,
    endpoint: PadEndpoint,
  ) {
    event.stopPropagation();
    setSelectedId(endpoint.componentId);
    setSelectedTraceId(null);
    if (tool !== 'route') {
      return;
    }
    if (!routeStart) {
      setRouteStart(endpoint);
      const component = components.find(
        (candidate) => candidate.id === endpoint.componentId,
      );
      if (component) {
        setRouteCursor(getPadPosition(component, endpoint.padIndex));
      }
      return;
    }
    if (
      routeStart.componentId === endpoint.componentId &&
      routeStart.padIndex === endpoint.padIndex
    ) {
      setRouteStart(null);
      setRouteCursor(null);
      return;
    }
    const existingTrace = traces.find((trace) =>
      endpointsMatch(trace.start, trace.end, routeStart, endpoint),
    );
    if (existingTrace) {
      setSelectedId(null);
      setSelectedTraceId(existingTrace.id);
      setRouteStart(null);
      setRouteCursor(null);
      setTool('select');
      setSaveMessage('That connection is already routed');
      return;
    }
    const requiredConnection = requiredConnections.find((connection) =>
      endpointsMatch(connection.start, connection.end, routeStart, endpoint),
    );
    if (traces.length >= MAX_TRACES) {
      setSaveMessage('Board limit reached: 240 routes');
      setRouteStart(null);
      setRouteCursor(null);
      return;
    }
    const newTrace: PcbTrace = {
      end: endpoint,
      id: makeId('trace'),
      layer: activeLayer,
      net: requiredConnection?.net ?? `N${traces.length + 1}`,
      start: routeStart,
      width: traceWidth,
    };
    recordHistory();
    setTraces((currentTraces) => [...currentTraces, newTrace]);
    setSelectedId(null);
    setSelectedTraceId(newTrace.id);
    setRouteStart(null);
    setRouteCursor(null);
    markChanged(`${newTrace.net} routed on ${activeLayer} copper`);
  }

  function rotateSelected() {
    if (!selectedId) {
      return;
    }
    recordHistory();
    setComponents((currentComponents) =>
      currentComponents.map((component) =>
        component.id === selectedId
          ? {
              ...component,
              rotation: ((component.rotation + 90) % 360) as PcbFootprint['rotation'],
            }
          : component,
      ),
    );
    markChanged();
  }

  function deleteSelected() {
    if (selectedTraceId) {
      recordHistory();
      setTraces((current) =>
        current.filter((trace) => trace.id !== selectedTraceId),
      );
      setSelectedTraceId(null);
      markChanged('Copper route deleted');
      return;
    }
    if (!selectedId) {
      return;
    }
    recordHistory();
    setComponents((current) =>
      current.filter((component) => component.id !== selectedId),
    );
    setTraces((current) =>
      current.filter(
        (trace) =>
          trace.start.componentId !== selectedId &&
          trace.end.componentId !== selectedId,
      ),
    );
    setSelectedId(null);
    setSelectedTraceId(null);
    setRouteStart(null);
    setRouteCursor(null);
    markChanged('Footprint and connected copper deleted');
  }

  function updateSelectedTrace(updates: Partial<Pick<PcbTrace, 'layer' | 'width'>>) {
    if (!selectedTraceId) {
      return;
    }
    recordHistory();
    setTraces((current) =>
      current.map((trace) =>
        trace.id === selectedTraceId ? { ...trace, ...updates } : trace,
      ),
    );
    if (updates.layer) {
      setActiveLayer(updates.layer);
    }
    if (updates.width) {
      setTraceWidth(updates.width);
    }
    markChanged('Copper properties updated');
  }

  function handleTracePointerDown(
    event: ReactPointerEvent<SVGPathElement> | ReactKeyboardEvent<SVGPathElement>,
    trace: PcbTrace,
  ) {
    event.stopPropagation();
    setSelectedId(null);
    setSelectedTraceId(trace.id);
    setActiveLayer(trace.layer);
    setTraceWidth(trace.width);
    setRouteStart(null);
    setRouteCursor(null);
    setTool('select');
    setSaveMessage(`${trace.net} selected`);
  }

  function handleFootprintKeyDown(
    event: ReactKeyboardEvent<SVGGElement>,
    component: PcbFootprint,
  ) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      setSelectedId(component.id);
      setSelectedTraceId(null);
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      event.stopPropagation();
      recordHistory();
      setSelectedId(null);
      setSelectedTraceId(null);
      setComponents((current) =>
        current.filter((candidate) => candidate.id !== component.id),
      );
      setTraces((current) =>
        current.filter(
          (trace) =>
            trace.start.componentId !== component.id &&
            trace.end.componentId !== component.id,
        ),
      );
      markChanged('Footprint and connected copper deleted');
      setRouteStart(null);
      setRouteCursor(null);
      return;
    }
    const horizontalStep = event.shiftKey ? 2 : snapEnabled ? gridUnitsX : 8;
    const verticalStep = event.shiftKey ? 2 : snapEnabled ? gridUnitsY : 8;
    const offset =
      event.key === 'ArrowLeft'
        ? { x: -horizontalStep, y: 0 }
        : event.key === 'ArrowRight'
          ? { x: horizontalStep, y: 0 }
          : event.key === 'ArrowUp'
            ? { x: 0, y: -verticalStep }
            : event.key === 'ArrowDown'
              ? { x: 0, y: verticalStep }
              : null;
    if (offset) {
      event.preventDefault();
      recordHistory();
      setSelectedId(component.id);
      setSelectedTraceId(null);
      moveComponent(
        component.id,
        component.x + offset.x,
        component.y + offset.y,
        !event.shiftKey,
      );
    }
  }

  function setEditorTool(nextTool: PcbTool) {
    setTool(nextTool);
    if (nextTool !== 'route') {
      setRouteStart(null);
      setRouteCursor(null);
    } else if (tool === 'route') {
      setRouteStart(null);
      setRouteCursor(null);
    }
  }

  function resetSample() {
    recordHistory();
    setName('Sensor Node Rev A');
    setComponents(cloneComponents(SAMPLE_COMPONENTS));
    setTraces(cloneTraces(SAMPLE_TRACES));
    setSelectedId('mcu-main');
    setSelectedTraceId(null);
    setRouteStart(null);
    setRouteCursor(null);
    setTool('select');
    setActiveLayer('top');
    setTraceWidth(0.5);
    setGridMm(2.5);
    setSnapEnabled(true);
    setShowInactiveLayer(true);
    setZoom(1);
    setDrcHasRun(false);
    setSaveMessage('Sample restored');
  }

  function createBlankBoard() {
    recordHistory();
    setName('Untitled PCB');
    setComponents([]);
    setTraces([]);
    setSelectedId(null);
    setSelectedTraceId(null);
    setRouteStart(null);
    setRouteCursor(null);
    setTool('place');
    setActiveLayer('top');
    setTraceWidth(0.5);
    setDrcHasRun(false);
    setSaveMessage('Blank board');
  }

  function saveBoard() {
    const savedAt = Date.now();
    const snapshot: PcbBoardSnapshot = {
      components: cloneComponents(components),
      id: `pcb-${savedAt}`,
      name: name.trim().slice(0, 60) || 'Untitled PCB',
      savedAt,
      traces: cloneTraces(traces),
    };
    const nextDesigns = [snapshot, ...savedDesigns].slice(0, 6);
    setSavedDesigns(nextDesigns);
    try {
      window.localStorage.setItem(PCB_STORAGE_KEY, JSON.stringify(nextDesigns));
      setSaveMessage(`Saved ${new Date(savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
    } catch {
      setSaveMessage('Saved for this session');
    }
    setDrcHasRun(true);
    onSaved?.(nextDesigns.length);
  }

  function loadBoard(design: PcbBoardSnapshot) {
    recordHistory();
    setName(design.name);
    setComponents(cloneComponents(design.components));
    setTraces(cloneTraces(design.traces));
    setSelectedId(design.components[0]?.id ?? null);
    setSelectedTraceId(null);
    setRouteStart(null);
    setRouteCursor(null);
    setTool('select');
    setActiveLayer('top');
    setTraceWidth(0.5);
    setDrcHasRun(false);
    setSaveMessage(`Loaded ${design.name}`);
  }

  function deleteSavedBoard(designId: string) {
    const nextDesigns = savedDesigns.filter((design) => design.id !== designId);
    setSavedDesigns(nextDesigns);
    try {
      window.localStorage.setItem(PCB_STORAGE_KEY, JSON.stringify(nextDesigns));
    } catch {
      // The visible shelf still updates for this session.
    }
    onSaved?.(nextDesigns.length);
  }

  function exportBoard() {
    const payload: PcbBoardSnapshot = {
      components: cloneComponents(components),
      id: 'pcb-export',
      name: name.trim() || 'Untitled PCB',
      savedAt: Date.now(),
      traces: cloneTraces(traces),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'zyloxp-pcb'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setSaveMessage('Board JSON exported');
  }

  return (
    <section className="pcbDesignerPage" aria-label="PCB Designer" onKeyDown={(event) => {
      if (event.key === 'Escape') {
        setRouteStart(null);
        setRouteCursor(null);
        setTool('select');
      }
    }}>
      <header className="pcbDesignerHeader">
        <div>
          <p className="eyebrow">Board Layout Lab</p>
          <h1>PCB Designer</h1>
          <p className={`pcbDraftStatus ${draftStatus}`} role="status">
            <span aria-hidden="true" />
            {draftStatus === 'saved' ? 'Draft saved on this device' : draftStatus === 'saving' ? 'Saving draft...' : 'Draft could not be saved. Export a copy to keep your work.'}
          </p>
        </div>
        <span className={`pcbDrcSummary ${errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'pass'}`}>
          {errorCount > 0 ? <TriangleAlert size={20} /> : <CheckCircle2 size={20} />}
          <span>
            <small>Live DRC</small>
            <strong>{errorCount > 0 ? `${errorCount} errors` : warningCount > 0 ? `${warningCount} ${warningCount === 1 ? 'warning' : 'warnings'}` : 'Board clear'}</strong>
          </span>
        </span>
      </header>

      <section className="pcbMetricBand" aria-label="PCB design metrics">
        <div><CircuitBoard size={18} /><span>Board</span><strong>160 x 100 mm</strong></div>
        <div><Cpu size={18} /><span>Footprints</span><strong>{components.length}</strong></div>
        <div><Route size={18} /><span>Copper routes</span><strong>{traces.length}</strong></div>
        <div><CheckCircle2 size={18} /><span>Connections</span><strong>{requiredConnections.length > 0 ? `${requiredConnections.length - unroutedConnections.length}/${requiredConnections.length} routed` : `${routedPadCount} pads`}</strong></div>
      </section>

      <div className="pcbWorkspace">
        <aside className="pcbPalette" aria-label="Footprint palette" data-library-open={libraryOpen}>
          <header>
            <div><p className="eyebrow">Library</p><h2>Footprints</h2></div>
            <button className="pcbLibraryToggle" aria-controls="pcb-palette-list" aria-expanded={libraryOpen} onClick={() => setLibraryOpen((open) => !open)} type="button">
              <Plus size={16} /> Add part <ChevronDown size={14} />
            </button>
          </header>
          <div className="pcbPaletteList" id="pcb-palette-list">
            {(Object.entries(FOOTPRINT_DEFINITIONS) as Array<[FootprintKind, FootprintDefinition]>).map(([kind, definition]) => {
              const Icon = definition.icon;
              const selected = tool === 'place' && paletteKind === kind;
              return (
                <button
                  aria-pressed={selected}
                  className={selected ? 'active' : ''}
                  key={kind}
                  onClick={() => {
                    setPaletteKind(kind);
                    setEditorTool('place');
                    setLibraryOpen(false);
                  }}
                  title={`Place ${definition.label}`}
                  type="button"
                >
                  <Icon size={18} />
                  <span>
                    <strong>{definition.label}</strong>
                    <small>{definition.description}</small>
                  </span>
                  <Plus size={15} />
                </button>
              );
            })}
          </div>
          <section className="pcbChallenge" aria-label="PCB layout challenge">
            <header>
              <span>{completedChallengeChecks}/{challengeChecks.length}</span>
              <div>
                <p className="eyebrow">Design brief</p>
                <h3>Sensor node</h3>
              </div>
            </header>
            <div className="pcbChallengeMeter"><span style={{ width: `${(completedChallengeChecks / challengeChecks.length) * 100}%` }} /></div>
            <ul>
              {challengeChecks.map((check) => (
                <li className={check.complete ? 'complete' : ''} key={check.label}>
                  <CheckCircle2 size={14} />
                  {check.label}
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <section className="pcbStage" aria-label="Board editor">
          <header className="pcbStageToolbar">
            <div className="pcbToolGroup" aria-label="PCB editing tools" role="group">
              <button aria-pressed={tool === 'select'} className={tool === 'select' ? 'active' : ''} onClick={() => setEditorTool('select')} title="Select and move" type="button">
                <MousePointer2 size={17} /><span>Select</span>
              </button>
              <button aria-pressed={tool === 'route'} className={tool === 'route' ? 'active' : ''} onClick={() => setEditorTool('route')} title="Route copper" type="button">
                <Route size={17} /><span>Route</span>
              </button>
            </div>
            <div className="pcbHistoryControls" aria-label="Board edit history" role="group">
              <button aria-label="Undo board edit" disabled={undoStack.length === 0} onClick={undoBoard} title="Undo" type="button"><Undo2 size={17} /></button>
              <button aria-label="Redo board edit" disabled={redoStack.length === 0} onClick={redoBoard} title="Redo" type="button"><Redo2 size={17} /></button>
            </div>
            <button className="pcbOptionsToggle" aria-controls="pcb-board-options" aria-expanded={optionsOpen} onClick={() => setOptionsOpen((open) => !open)} type="button">
              <SlidersHorizontal size={16} /> Board setup <ChevronDown size={14} />
            </button>
            <div id="pcb-board-options" className="pcbBoardOptions" data-open={optionsOpen}>
            <div className="pcbLayerGroup" aria-label="Active copper layer" role="group">
              <Layers3 size={16} />
              <button aria-pressed={activeLayer === 'top'} className={activeLayer === 'top' ? 'active top' : 'top'} onClick={() => setActiveLayer('top')} type="button">Top</button>
              <button aria-pressed={activeLayer === 'bottom'} className={activeLayer === 'bottom' ? 'active bottom' : 'bottom'} onClick={() => setActiveLayer('bottom')} type="button">Bottom</button>
              <button aria-label={showInactiveLayer ? 'Hide inactive copper layer' : 'Show inactive copper layer'} aria-pressed={showInactiveLayer} className="pcbLayerVisibility" onClick={() => setShowInactiveLayer((current) => !current)} title={showInactiveLayer ? 'Hide inactive layer' : 'Show both layers'} type="button">
                {showInactiveLayer ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            <div className="pcbGridControl">
              <Grid3X3 size={15} />
              <span>Grid</span>
              <select aria-label="Placement grid size" onChange={(event) => setGridMm(Number(event.currentTarget.value))} value={gridMm}>
                {GRID_OPTIONS.map((size) => <option key={size} value={size}>{size} mm</option>)}
              </select>
              <button aria-label={snapEnabled ? 'Disable grid snapping' : 'Enable grid snapping'} aria-pressed={snapEnabled} className={snapEnabled ? 'active' : ''} onClick={() => setSnapEnabled((current) => !current)} title="Toggle grid snapping" type="button">Snap</button>
            </div>
            <label className="pcbTraceWidth">
              <span>Trace</span>
              <select aria-label="Copper trace width" onChange={(event) => setTraceWidth(Number(event.currentTarget.value))} value={traceWidth}>
                {TRACE_WIDTHS.map((width) => <option key={width} value={width}>{width.toFixed(2)} mm</option>)}
              </select>
            </label>
            </div>
            <div className="pcbZoomControls" aria-label="Board zoom" role="group">
              <button aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom((current) => clamp(current - 0.25, 0.5, 3))} title="Zoom out" type="button"><ZoomOut size={17} /></button>
              <span>{Math.round(zoom * 100)}%</span>
              <button aria-label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom((current) => clamp(current + 0.25, 0.5, 3))} title="Zoom in" type="button"><ZoomIn size={17} /></button>
              <button aria-label="Fit board to view" onClick={() => setZoom(1)} title="Fit board to view" type="button"><Maximize size={16} /></button>
            </div>
          </header>

          <div className="pcbBoardViewport" data-tool={tool}>
            <svg
              aria-label={`${name} printed circuit board layout`}
              className="pcbBoardCanvas"
              data-active-layer={activeLayer}
              data-show-inactive={showInactiveLayer ? 'true' : 'false'}
              onPointerMove={handleBoardPointerMove}
              onPointerUp={handleBoardPointerUp}
              onPointerCancel={handleBoardPointerUp}
              onLostPointerCapture={handleBoardPointerUp}
              role="group"
              style={{ width: `${zoom * 100}%` }}
              viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
            >
              <defs>
                <pattern height={gridUnitsY} id="pcb-grid" patternUnits="userSpaceOnUse" width={gridUnitsX}>
                  <path d={`M${gridUnitsX} 0H0V${gridUnitsY}`} fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
                <filter id="pcb-component-shadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="3" floodColor="#052a23" floodOpacity=".34" stdDeviation="3" />
                </filter>
              </defs>
              <rect className="pcbBoardEdge" height={BOARD_HEIGHT - 8} rx="18" width={BOARD_WIDTH - 8} x="4" y="4" />
              <rect className="pcbBoardSurface" height={BOARD_HEIGHT - 24} onPointerDown={handleBoardPointerDown} rx="12" width={BOARD_WIDTH - 24} x="12" y="12" />
              <rect className="pcbBoardGrid" height={BOARD_HEIGHT - 24} pointerEvents="none" rx="12" width={BOARD_WIDTH - 24} x="12" y="12" />
              <g className="pcbBoardSilkscreen" pointerEvents="none">
                <path d="M72 54H238M72 54V100M826 438V468H660" />
                <text x="76" y="42">{name.trim().toUpperCase().slice(0, 32) || 'UNTITLED PCB'}</text>
                <text textAnchor="end" x="820" y="510">160 x 100 mm · 2 LAYER</text>
                <path d="M440 26h20M450 16v20" />
              </g>
              {[
                [42, 42],
                [858, 42],
                [42, 498],
                [858, 498],
              ].map(([x, y]) => (
                <g className="pcbMountingHole" key={`${x}-${y}`} pointerEvents="none">
                  <circle cx={x} cy={y} r="15" />
                  <circle cx={x} cy={y} r="7" />
                </g>
              ))}
              <g className="pcbCopperZone" pointerEvents="none">
                <path d="M44 452H856V486H44Z" />
                <text x="65" y="477">GND PLANE</text>
              </g>
              <g className="pcbAirwireLayer" pointerEvents="none">
                {unroutedConnections.map((connection) => {
                  const startComponent = components.find((component) => component.id === connection.start.componentId);
                  const endComponent = components.find((component) => component.id === connection.end.componentId);
                  if (!startComponent || !endComponent) {
                    return null;
                  }
                  const start = getPadPosition(startComponent, connection.start.padIndex);
                  const end = getPadPosition(endComponent, connection.end.padIndex);
                  return (
                    <g key={connection.id}>
                      <line x1={start.x} x2={end.x} y1={start.y} y2={end.y} />
                      <text textAnchor="middle" x={(start.x + end.x) / 2} y={(start.y + end.y) / 2 - 7}>{connection.net}</text>
                    </g>
                  );
                })}
              </g>
              <g className="pcbTraceLayer bottom">
                {traces.filter((trace) => trace.layer === 'bottom').map((trace) => (
                  <g className={`pcbTrace ${trace.id === selectedTraceId ? 'selected' : ''}`} key={trace.id}>
                    <path aria-label={`${trace.net} route on ${trace.layer} copper`} role="button" tabIndex={showInactiveLayer || activeLayer === trace.layer ? 0 : -1} className="pcbTraceHit" d={tracePath(trace, components)} onPointerDown={(event) => handleTracePointerDown(event, trace)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleTracePointerDown(event, trace); } }} style={{ strokeWidth: 20 + trace.width * 7 }} />
                    <path className="pcbTraceVisual" d={tracePath(trace, components)} pointerEvents="none" style={{ strokeWidth: 6 + trace.width * 7 }} />
                  </g>
                ))}
              </g>
              <g className="pcbTraceLayer top">
                {traces.filter((trace) => trace.layer === 'top').map((trace) => (
                  <g className={`pcbTrace ${trace.id === selectedTraceId ? 'selected' : ''}`} key={trace.id}>
                    <path aria-label={`${trace.net} route on ${trace.layer} copper`} role="button" tabIndex={showInactiveLayer || activeLayer === trace.layer ? 0 : -1} className="pcbTraceHit" d={tracePath(trace, components)} onPointerDown={(event) => handleTracePointerDown(event, trace)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleTracePointerDown(event, trace); } }} style={{ strokeWidth: 20 + trace.width * 7 }} />
                    <path className="pcbTraceVisual" d={tracePath(trace, components)} pointerEvents="none" style={{ strokeWidth: 6 + trace.width * 7 }} />
                  </g>
                ))}
              </g>
              {routePreviewPath && (
                <path className={`pcbRoutePreview ${activeLayer}`} d={routePreviewPath} pointerEvents="none" style={{ strokeWidth: 6 + traceWidth * 7 }} />
              )}
              {components.map((component) => (
                <FootprintGraphic
                  component={component}
                  key={component.id}
                  onKeyDown={(event) => handleFootprintKeyDown(event, component)}
                  onPadPointerDown={(event, padIndex) =>
                    handlePadPointerDown(event, {
                      componentId: component.id,
                      padIndex,
                    })
                  }
                  onPointerDown={(event) => handleFootprintPointerDown(event, component.id)}
                  routeStart={routeStart}
                  selected={component.id === selectedId}
                />
              ))}
            </svg>
          </div>

          <footer className="pcbStageStatus" aria-live="polite">
            <span className={`pcbToolStatus ${tool}`}>
              {tool === 'place' ? <Plus size={15} /> : tool === 'route' ? <Route size={15} /> : <MousePointer2 size={15} />}
              {tool === 'place'
                ? `Click the board to place ${FOOTPRINT_DEFINITIONS[paletteKind].label}`
                : tool === 'route'
                  ? routeStart
                    ? 'Choose the destination pad'
                    : `Choose a start pad on ${activeLayer} copper`
                  : selectedComponent
                    ? `${selectedComponent.reference} selected · drag or use arrow keys`
                    : selectedTrace
                      ? `${selectedTrace.net} selected · ${selectedTraceLength.toFixed(1)} mm on ${selectedTrace.layer} copper`
                    : 'Select a footprint to inspect it'}
            </span>
            <span>{saveMessage}</span>
          </footer>
        </section>

        <aside className="pcbInspector" aria-label="PCB inspector and design rules">
          <section className="pcbInspectorSection">
            <header>
              <p className="eyebrow">Inspector</p>
              <h2>{selectedComponent ? selectedComponent.reference : selectedTrace ? selectedTrace.net : 'Board'}</h2>
            </header>
            {selectedTrace ? (
              <>
                <dl className="pcbComponentDetails">
                  <div><dt>Net</dt><dd>{selectedTrace.net}</dd></div>
                  <div><dt>Layer</dt><dd>{selectedTrace.layer === 'top' ? 'Top copper' : 'Bottom copper'}</dd></div>
                  <div><dt>Length</dt><dd>{selectedTraceLength.toFixed(1)} mm</dd></div>
                  <div><dt>Width</dt><dd>{selectedTrace.width.toFixed(2)} mm</dd></div>
                </dl>
                <div className="pcbTraceProperties">
                  <label>
                    <span>Copper layer</span>
                    <select onChange={(event) => updateSelectedTrace({ layer: event.currentTarget.value as PcbLayer })} value={selectedTrace.layer}>
                      <option value="top">Top copper</option>
                      <option value="bottom">Bottom copper</option>
                    </select>
                  </label>
                  <label>
                    <span>Trace width</span>
                    <select onChange={(event) => updateSelectedTrace({ width: Number(event.currentTarget.value) })} value={selectedTrace.width}>
                      {TRACE_WIDTHS.map((width) => <option key={width} value={width}>{width.toFixed(2)} mm</option>)}
                    </select>
                  </label>
                </div>
                <div className="pcbInspectorActions single">
                  <button className="danger" onClick={deleteSelected} type="button"><Trash2 size={16} />Delete route</button>
                </div>
              </>
            ) : selectedComponent ? (
              <>
                <dl className="pcbComponentDetails">
                  <div><dt>Footprint</dt><dd>{FOOTPRINT_DEFINITIONS[selectedComponent.kind].label}</dd></div>
                  <div><dt>Rotation</dt><dd>{selectedComponent.rotation} deg</dd></div>
                  <div><dt>Position</dt><dd>{(selectedComponent.x / BOARD_X_UNITS_PER_MM).toFixed(1)}, {(selectedComponent.y / BOARD_Y_UNITS_PER_MM).toFixed(1)} mm</dd></div>
                  <div><dt>Pads</dt><dd>{FOOTPRINT_DEFINITIONS[selectedComponent.kind].pads.length}</dd></div>
                </dl>
                <div className="pcbInspectorActions">
                  <button onClick={rotateSelected} type="button"><RotateCw size={16} />Rotate</button>
                  <button className="danger" onClick={deleteSelected} type="button"><Trash2 size={16} />Delete</button>
                </div>
              </>
            ) : (
              <p className="pcbInspectorEmpty">Select a footprint or copper route to inspect its physical properties.</p>
            )}
          </section>

          <section className={`pcbDrcPanel ${drcHasRun ? 'checked' : ''}`}>
            <header>
              <span className={errorCount > 0 ? 'error' : 'pass'}>{errorCount > 0 ? <TriangleAlert size={18} /> : <CheckCircle2 size={18} />}</span>
              <div>
                <p className="eyebrow">Design rules</p>
                <h2>{errorCount > 0 ? 'Resolve placement' : 'No hard errors'}</h2>
              </div>
              <button onClick={() => setDrcHasRun(true)} type="button">Run DRC</button>
            </header>
            <div className="pcbDrcCounts">
              <span><strong>{errorCount}</strong> errors</span>
              <span><strong>{warningCount}</strong> warnings</span>
            </div>
            <ul>
              {drcIssues.slice(0, 4).map((issue) => (
                <li className={issue.severity} key={issue.id}>
                  {issue.severity === 'error' ? <TriangleAlert size={15} /> : <Route size={15} />}
                  <span><strong>{issue.title}</strong><small>{issue.detail}</small></span>
                </li>
              ))}
              {drcIssues.length === 0 && (
                <li className="pass"><CheckCircle2 size={15} /><span><strong>Layout checks clear</strong><small>Placement and guided connections checked.</small></span></li>
              )}
            </ul>
          </section>

          <section className="pcbProjectControls">
            <label>
              <span>Board name</span>
              <input maxLength={60} onChange={(event) => { setName(event.currentTarget.value); setSaveMessage('Unsaved changes'); }} value={name} />
            </label>
            <div>
              <button className="pcbSaveButton" onClick={saveBoard} type="button"><Save size={16} />Save board</button>
              <button aria-label="Export board JSON" onClick={exportBoard} title="Export board JSON" type="button"><Download size={17} /></button>
            </div>
            <div className="pcbResetActions">
              <button onClick={resetSample} type="button"><RotateCcw size={15} />Sample</button>
              <button onClick={createBlankBoard} type="button"><Plus size={15} />New board</button>
            </div>
          </section>
        </aside>
      </div>

      {savedDesigns.length > 0 && (
        <section className="pcbSavedShelf" aria-labelledby="pcb-saved-title">
          <header>
            <div><p className="eyebrow">Local projects</p><h2 id="pcb-saved-title">Saved boards</h2></div>
            <span>{savedDesigns.length}/6 saved</span>
          </header>
          <div>
            {savedDesigns.map((design) => (
              <article key={design.id}>
                <button className="pcbSavedOpen" onClick={() => loadBoard(design)} type="button">
                  <CircuitBoard size={20} />
                  <span><strong>{design.name}</strong><small>{design.components.length} footprints · {design.traces.length} routes</small></span>
                </button>
                <button aria-label={`Delete ${design.name}`} onClick={() => deleteSavedBoard(design.id)} title="Delete saved board" type="button"><Trash2 size={16} /></button>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
