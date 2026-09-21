export type PcbLayer = 'bottom' | 'top';
export type FootprintKind = 'capacitor' | 'header' | 'led' | 'mcu' | 'regulator' | 'resistor' | 'usb';
export type PcbFootprint = {
  id: string;
  kind: FootprintKind;
  reference: string;
  rotation: 0 | 90 | 180 | 270;
  x: number;
  y: number;
};
export type PadEndpoint = { componentId: string; padIndex: number };
export type PcbTrace = {
  end: PadEndpoint;
  id: string;
  layer: PcbLayer;
  net: string;
  start: PadEndpoint;
  width: number;
};
export type PcbBoardSnapshot = {
  components: PcbFootprint[];
  id: string;
  name: string;
  savedAt: number;
  traces: PcbTrace[];
};

export const PCB_STORAGE_KEY = 'zyloxp-pcb-designs-v1';
export const PCB_DRAFT_KEY = 'zyloxp-pcb-draft-v1';
export const BOARD_WIDTH = 900;
export const BOARD_HEIGHT = 540;
export const MAX_COMPONENTS = 80;
export const MAX_TRACES = 240;
type PadCounts = Record<FootprintKind, number>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function identifier(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 80;
}

// Reject broken topology rather than silently dropping parts of a saved board.
export function parsePcbBoard(value: unknown, padCounts: PadCounts): PcbBoardSnapshot | null {
  if (!isRecord(value) || !identifier(value.id) || typeof value.name !== 'string' ||
      !finite(value.savedAt) || value.savedAt < 0 || !Array.isArray(value.components) ||
      !Array.isArray(value.traces) || value.components.length > MAX_COMPONENTS ||
      value.traces.length > MAX_TRACES) return null;

  const components: PcbFootprint[] = [];
  const ids = new Set<string>();
  for (const part of value.components) {
    if (!isRecord(part) || !identifier(part.id) || ids.has(part.id) ||
        typeof part.reference !== 'string' || !part.reference.trim() || part.reference.length > 12 ||
        typeof part.kind !== 'string' || !Object.hasOwn(padCounts, part.kind) ||
        !finite(part.x) || !finite(part.y) || part.x < 0 || part.x > BOARD_WIDTH ||
        part.y < 0 || part.y > BOARD_HEIGHT || !finite(part.rotation) ||
        ![0, 90, 180, 270].includes(part.rotation)) return null;
    ids.add(part.id);
    components.push({
      id: part.id, kind: part.kind as FootprintKind, reference: part.reference,
      rotation: part.rotation as PcbFootprint['rotation'], x: part.x, y: part.y,
    });
  }

  function endpoint(value: unknown): PadEndpoint | null {
    if (!isRecord(value) || typeof value.componentId !== 'string' ||
        !finite(value.padIndex) || !Number.isInteger(value.padIndex)) return null;
    const part = components.find((component) => component.id === value.componentId);
    if (!part || value.padIndex < 0 || value.padIndex >= padCounts[part.kind]) return null;
    return { componentId: part.id, padIndex: value.padIndex };
  }

  const traces: PcbTrace[] = [];
  const traceIds = new Set<string>();
  for (const item of value.traces) {
    if (!isRecord(item) || !identifier(item.id) || traceIds.has(item.id) ||
        typeof item.net !== 'string' || !item.net.trim() || item.net.length > 20 ||
        !finite(item.width) || item.width < 0.2 || item.width > 1.5 ||
        (item.layer !== 'top' && item.layer !== 'bottom')) return null;
    const start = endpoint(item.start);
    const end = endpoint(item.end);
    if (!start || !end || (start.componentId === end.componentId && start.padIndex === end.padIndex)) return null;
    traceIds.add(item.id);
    traces.push({ id: item.id, net: item.net, width: item.width, layer: item.layer, start, end });
  }
  return { id: value.id, name: value.name.trim().slice(0, 60) || 'Untitled PCB', savedAt: value.savedAt, components, traces };
}

export function readPcbDraft(storage: Pick<Storage, 'getItem'>, padCounts: PadCounts) {
  try {
    return parsePcbBoard(JSON.parse(storage.getItem(PCB_DRAFT_KEY) ?? 'null'), padCounts);
  } catch {
    return null;
  }
}

export function writePcbDraft(storage: Pick<Storage, 'setItem'>, board: PcbBoardSnapshot) {
  try {
    storage.setItem(PCB_DRAFT_KEY, JSON.stringify(board));
    return true;
  } catch {
    return false;
  }
}

export function readPcbProjects(storage: Pick<Storage, 'getItem'>, padCounts: PadCounts) {
  try {
    const value: unknown = JSON.parse(storage.getItem(PCB_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.slice(0, 6).flatMap((item) => {
      const board = parsePcbBoard(item, padCounts);
      return board ? [board] : [];
    });
  } catch {
    return [];
  }
}
