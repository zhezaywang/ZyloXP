import type { FootprintKind, PadEndpoint, PcbFootprint, PcbTrace } from './pcbStorage';

export type Point = { x: number; y: number };
export type FootprintGeometry = { width: number; height: number; pads: (Point & { name: string })[] };

// Keep v1's stored coordinates unchanged. One isotropic scale makes 900 x 540 a 160 x 96 mm board.
export const UNITS_PER_MM = 900 / 160;
export const PAD_RADIUS = 8;
export const DRILL_RADIUS = 3;
export const COURTYARD_MARGIN = 7;
export const BOARD_EDGE_CLEARANCE = 22;

// Nonstandard teaching footprints, all with plated through holes on both copper layers.
export const FOOTPRINT_GEOMETRY: Record<FootprintKind, FootprintGeometry> = {
  capacitor: { width: 70, height: 34, pads: [{ name: '1', x: -25, y: 0 }, { name: '2', x: 25, y: 0 }] },
  resistor: { width: 82, height: 34, pads: [{ name: '1', x: -30, y: 0 }, { name: '2', x: 30, y: 0 }] },
  led: { width: 76, height: 38, pads: [{ name: 'A', x: -27, y: 0 }, { name: 'K', x: 27, y: 0 }] },
  header: { width: 70, height: 70, pads: [
    { name: '1', x: -20, y: -20 }, { name: '2', x: 20, y: -20 },
    { name: '3', x: -20, y: 0 }, { name: '4', x: 20, y: 0 },
    { name: '5', x: -20, y: 20 }, { name: '6', x: 20, y: 20 },
  ] },
  mcu: { width: 126, height: 126, pads: [
    { name: '1', x: -68, y: -42 }, { name: '2', x: -68, y: -14 },
    { name: '3', x: -68, y: 14 }, { name: '4', x: -68, y: 42 },
    { name: '5', x: 68, y: 42 }, { name: '6', x: 68, y: 14 },
    { name: '7', x: 68, y: -14 }, { name: '8', x: 68, y: -42 },
  ] },
  regulator: { width: 100, height: 76, pads: [
    { name: 'IN', x: -52, y: -22 }, { name: 'GND', x: -52, y: 22 }, { name: 'OUT', x: 52, y: 0 },
  ] },
  usb: { width: 110, height: 112, pads: [
    { name: 'VBUS', x: 55, y: -31 }, { name: 'D-', x: 55, y: -10 },
    { name: 'D+', x: 55, y: 10 }, { name: 'GND', x: 55, y: 31 },
  ] },
};

export function rotatePoint(x: number, y: number, rotation: PcbFootprint['rotation']): Point {
  if (rotation === 90) return { x: -y, y: x };
  if (rotation === 180) return { x: -x, y: -y };
  if (rotation === 270) return { x: y, y: -x };
  return { x, y };
}

export function getPadPosition(component: PcbFootprint, padIndex: number): Point | null {
  const pad = FOOTPRINT_GEOMETRY[component.kind].pads[padIndex];
  if (!pad) return null;
  const rotated = rotatePoint(pad.x, pad.y, component.rotation);
  return { x: component.x + rotated.x, y: component.y + rotated.y };
}

export function getCourtyardSize(kind: FootprintKind) {
  const definition = FOOTPRINT_GEOMETRY[kind];
  return {
    width: 2 * (Math.max(definition.width / 2, ...definition.pads.map((pad) => Math.abs(pad.x) + PAD_RADIUS)) + COURTYARD_MARGIN),
    height: 2 * (Math.max(definition.height / 2, ...definition.pads.map((pad) => Math.abs(pad.y) + PAD_RADIUS)) + COURTYARD_MARGIN),
  };
}

export function getRotatedSize(component: PcbFootprint) {
  const size = getCourtyardSize(component.kind);
  return component.rotation === 90 || component.rotation === 270
    ? { width: size.height, height: size.width } : size;
}

export function courtyardsOverlap(left: PcbFootprint, right: PcbFootprint) {
  const a = getRotatedSize(left);
  const b = getRotatedSize(right);
  return Math.abs(left.x - right.x) < (a.width + b.width) / 2 &&
    Math.abs(left.y - right.y) < (a.height + b.height) / 2;
}

export function tracePointsBetween(start: Point, end: Point): Point[] {
  // Canonical direction keeps the same copper geometry when endpoint order is reversed.
  const [a, b] = start.x < end.x || (start.x === end.x && start.y <= end.y) ? [start, end] : [end, start];
  const middleX = a.x + (b.x - a.x) * 0.52;
  return [a, { x: middleX, y: a.y }, { x: middleX, y: b.y }, b];
}

export function tracePoints(trace: PcbTrace, components: PcbFootprint[]) {
  const a = components.find((component) => component.id === trace.start.componentId);
  const b = components.find((component) => component.id === trace.end.componentId);
  const start = a && getPadPosition(a, trace.start.padIndex);
  const end = b && getPadPosition(b, trace.end.padIndex);
  return start && end ? tracePointsBetween(start, end) : [];
}

export function tracePathBetween(start: Point, end: Point) {
  return tracePointsBetween(start, end).map((point, i) => `${i ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
}

export function tracePath(trace: PcbTrace, components: PcbFootprint[]) {
  return tracePoints(trace, components).map((point, i) => `${i ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
}

export function traceLengthMm(trace: PcbTrace, components: PcbFootprint[]) {
  const points = tracePoints(trace, components);
  return points.slice(1).reduce((length, point, i) => length + Math.hypot(point.x - points[i].x, point.y - points[i].y), 0) / UNITS_PER_MM;
}

export function endpointKey(endpoint: PadEndpoint) {
  return `${endpoint.componentId}:${endpoint.padIndex}`;
}

export function hasRoutedConnection(start: PadEndpoint, end: PadEndpoint, net: string, traces: PcbTrace[]) {
  const visited = new Set([endpointKey(start)]);
  const queue = [endpointKey(start)];
  const adjacency = new Map<string, string[]>();
  for (const trace of traces.filter((item) => item.net === net)) {
    const a = endpointKey(trace.start);
    const b = endpointKey(trace.end);
    adjacency.set(a, [...(adjacency.get(a) ?? []), b]);
    adjacency.set(b, [...(adjacency.get(b) ?? []), a]);
  }
  // Every modeled pad is plated, so shared endpoints connect top and bottom routes.
  for (let i = 0; i < queue.length; i += 1) {
    if (queue[i] === endpointKey(end)) return true;
    for (const neighbor of adjacency.get(queue[i]) ?? []) {
      if (!visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); }
    }
  }
  return false;
}

type Segment = [Point, Point];
const segments = (points: Point[]): Segment[] => points.slice(1).map((point, i) => [points[i], point]);

// Routes are axis-aligned, including zero-length segments. Interval distances also handle crossings.
export function segmentDistance(a: Segment, b: Segment) {
  const gap = (axis: 'x' | 'y') => Math.max(0,
    Math.min(a[0][axis], a[1][axis]) - Math.max(b[0][axis], b[1][axis]),
    Math.min(b[0][axis], b[1][axis]) - Math.max(a[0][axis], a[1][axis]));
  return Math.hypot(gap('x'), gap('y'));
}

export type CopperIssue = { id: string; title: string; detail: string; severity: 'error' | 'warning' };

export function copperContactIssues(components: PcbFootprint[], traces: PcbTrace[], boardWidth: number, boardHeight: number): CopperIssue[] {
  const issues: CopperIssue[] = [];
  const pads = components.flatMap((component) => FOOTPRINT_GEOMETRY[component.kind].pads.map((pad, padIndex) => ({
    point: getPadPosition(component, padIndex)!, key: endpointKey({ componentId: component.id, padIndex }),
    label: `${component.reference}.${pad.name}`, nets: new Set<string>(),
  })));
  const byKey = new Map(pads.map((pad) => [pad.key, pad]));
  const routes = traces.map((trace) => ({ trace, points: tracePoints(trace, components), radius: trace.width * UNITS_PER_MM / 2 }));
  for (const { trace } of routes) {
    byKey.get(endpointKey(trace.start))?.nets.add(trace.net);
    byKey.get(endpointKey(trace.end))?.nets.add(trace.net);
  }
  for (const pad of pads) {
    if (pad.nets.size > 1) issues.push({ id: `pad-nets-${pad.key}`, title: 'Conflicting pad nets', severity: 'error',
      detail: `${pad.label} joins ${[...pad.nets].join(' and ')} through a plated hole.` });
  }
  for (let i = 0; i < routes.length; i += 1) {
    const { trace, points, radius } = routes[i];
    if (points.length === 0) {
      issues.push({ id: `invalid-${trace.id}`, title: 'Invalid route endpoint', severity: 'error', detail: `${trace.net} has a missing pad.` });
      continue;
    }
    if (points.some((point) => point.x - radius < 0 || point.y - radius < 0 || point.x + radius > boardWidth || point.y + radius > boardHeight)) {
      issues.push({ id: `copper-edge-${trace.id}`, title: 'Copper outside board', severity: 'error', detail: `${trace.net} extends past the board outline.` });
    }
    const lines = segments(points);
    for (const other of routes.slice(i + 1)) {
      if (trace.layer !== other.trace.layer || trace.net === other.trace.net) continue;
      if (lines.some((line) => segments(other.points).some((otherLine) => segmentDistance(line, otherLine) <= radius + other.radius))) {
        issues.push({ id: `copper-cross-${trace.id}-${other.trace.id}`, title: 'Copper nets touch', severity: 'error',
          detail: `${trace.net} and ${other.trace.net} touch on ${trace.layer} copper.` });
      }
    }
    for (const pad of pads) {
      if (pad.key === endpointKey(trace.start) || pad.key === endpointKey(trace.end)) continue;
      if (pad.nets.size === 1 && pad.nets.has(trace.net)) continue;
      if (lines.some((line) => segmentDistance(line, [pad.point, pad.point]) <= radius + PAD_RADIUS)) {
        issues.push({ id: `copper-pad-${trace.id}-${pad.key}`, title: 'Route touches another pad', severity: 'error',
          detail: `${trace.net} touches ${pad.label}${pad.nets.size ? ` (${[...pad.nets].join(', ')})` : ' (unassigned)'} on ${trace.layer} copper.` });
      }
    }
  }
  for (let i = 0; i < pads.length; i += 1) {
    for (const other of pads.slice(i + 1)) {
      const pad = pads[i];
      if (Math.hypot(pad.point.x - other.point.x, pad.point.y - other.point.y) <= 2 * PAD_RADIUS &&
          !(pad.nets.size === 1 && other.nets.size === 1 && [...pad.nets][0] === [...other.nets][0])) {
        issues.push({ id: `pad-touch-${pad.key}-${other.key}`, title: 'Pads touch', severity: 'error', detail: `${pad.label} and ${other.label} touch on both copper layers.` });
      }
    }
  }
  return issues;
}
