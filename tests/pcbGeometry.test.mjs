import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  COURTYARD_MARGIN, DRILL_RADIUS, FOOTPRINT_GEOMETRY, PAD_RADIUS, UNITS_PER_MM,
  copperContactIssues, courtyardsOverlap, getCourtyardSize, getPadPosition,
  getRotatedSize, hasRoutedConnection, rotatePoint, segmentDistance, traceLengthMm,
  tracePath, tracePoints, tracePointsBetween,
} from '../src/pcbGeometry.ts';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../src/pcbStorage.ts';

const part = (id, x, y, kind = 'capacitor', rotation = 0) => ({ id, reference: id, kind, x, y, rotation });
const pad = (componentId, padIndex = 0) => ({ componentId, padIndex });
const route = (id, start, end, layer = 'top', net = id, width = 0.5) => ({ id, start, end, layer, net, width });
const issues = (parts, traces) => copperContactIssues(parts, traces, BOARD_WIDTH, BOARD_HEIGHT);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test('one physical scale agrees with the board aspect, square grid and all supported copper widths', () => {
  assert.equal(BOARD_WIDTH / UNITS_PER_MM, 160);
  assert.equal(BOARD_HEIGHT / UNITS_PER_MM, 96);
  close((BOARD_WIDTH / UNITS_PER_MM) / (BOARD_HEIGHT / UNITS_PER_MM), BOARD_WIDTH / BOARD_HEIGHT);
  for (const width of [0.2, 0.25, 0.5, 0.8, 1.2, 1.5]) close(width * UNITS_PER_MM / UNITS_PER_MM, width);
  assert.ok(DRILL_RADIUS > 0 && DRILL_RADIUS < PAD_RADIUS);
});

test('every pad is distinct, separated by copper clearance, and enclosed by its visible courtyard', () => {
  for (const [kind, definition] of Object.entries(FOOTPRINT_GEOMETRY)) {
    const size = getCourtyardSize(kind);
    assert.equal(new Set(definition.pads.map((item) => item.name)).size, definition.pads.length);
    for (let i = 0; i < definition.pads.length; i++) {
      const a = definition.pads[i];
      assert.ok(Math.abs(a.x) + PAD_RADIUS + COURTYARD_MARGIN <= size.width / 2);
      assert.ok(Math.abs(a.y) + PAD_RADIUS + COURTYARD_MARGIN <= size.height / 2);
      for (const b of definition.pads.slice(i + 1)) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > PAD_RADIUS * 2, kind);
    }
  }
});

test('all footprint rotations preserve pad identity, center distance and enclosure', () => {
  for (const [kind, definition] of Object.entries(FOOTPRINT_GEOMETRY)) {
    for (const rotation of [0, 90, 180, 270]) {
      const component = part('U', 300, 220, kind, rotation);
      const size = getRotatedSize(component);
      definition.pads.forEach((item, index) => {
        const point = getPadPosition(component, index);
        const expected = rotatePoint(item.x, item.y, rotation);
        assert.deepEqual(point, { x: 300 + expected.x, y: 220 + expected.y });
        close(Math.hypot(point.x - 300, point.y - 220), Math.hypot(item.x, item.y));
        assert.ok(Math.abs(point.x - 300) + PAD_RADIUS <= size.width / 2);
        assert.ok(Math.abs(point.y - 220) + PAD_RADIUS <= size.height / 2);
      });
    }
  }
  assert.deepEqual(rotatePoint(10, 0, 90), { x: -0, y: 10 });
  assert.deepEqual(FOOTPRINT_GEOMETRY.mcu.pads.map((item) => item.name), ['1', '2', '3', '4', '5', '6', '7', '8']);
  assert.deepEqual(FOOTPRINT_GEOMETRY.led.pads.map((item) => item.name), ['A', 'K']);
});

test('courtyard collision agrees exactly with the drawn outline, including exposed MCU pads', () => {
  const a = part('A', 200, 200, 'mcu');
  const b = part('B', 0, 200, 'capacitor');
  const boundary = 200 + (getRotatedSize(a).width + getRotatedSize(b).width) / 2;
  assert.equal(courtyardsOverlap(a, { ...b, x: boundary }), false);
  assert.equal(courtyardsOverlap(a, { ...b, x: boundary - 0.01 }), true);
  assert.equal(courtyardsOverlap(a, { ...b, x: boundary + 0.01 }), false);
  assert.ok(getCourtyardSize('mcu').width > FOOTPRINT_GEOMETRY.mcu.width + 14);
});

test('invalid endpoints cannot turn into fictitious routes to component centers', () => {
  const parts = [part('A', 100, 100), part('B', 200, 200)];
  const invalid = route('bad', pad('A', 90), pad('B'));
  assert.equal(getPadPosition(parts[0], 90), null);
  assert.equal(tracePath(invalid, parts), '');
  assert.equal(traceLengthMm(invalid, parts), 0);
  assert.ok(issues(parts, [invalid]).some((item) => item.title === 'Invalid route endpoint'));
});

test('routing has identical geometry in either endpoint order, in every quadrant and degenerate case', () => {
  for (const start of [{ x: 0, y: 0 }, { x: 130, y: 95 }]) {
    for (const end of [{ x: 130, y: 95 }, { x: 0, y: 95 }, { x: 130, y: 0 }, start]) {
      assert.deepEqual(tracePointsBetween(start, end), tracePointsBetween(end, start));
      const points = tracePointsBetween(start, end);
      for (let i = 1; i < points.length; i++) assert.ok(points[i].x === points[i - 1].x || points[i].y === points[i - 1].y);
    }
  }
});

test('reported route length is the actual centerline length after every endpoint rotation', () => {
  for (const rotation of [0, 90, 180, 270]) {
    const parts = [part('A', 100, 150, 'mcu', rotation), part('B', 450, 300, 'regulator', rotation)];
    const trace = route('N', pad('A', 7), pad('B', 2));
    const points = tracePoints(trace, parts);
    const a = getPadPosition(parts[0], 7);
    const b = getPadPosition(parts[1], 2);
    assert.ok(points.some((point) => point.x === a.x && point.y === a.y));
    assert.ok(points.some((point) => point.x === b.x && point.y === b.y));
    close(traceLengthMm(trace, parts), (Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) / UNITS_PER_MM);
  }
});

test('guided connectivity traverses a shared plated pad across layers, but not a device body or another net', () => {
  const a = pad('A'), b = pad('B'), c = pad('C');
  const traces = [route('one', a, b, 'top', 'VCC'), route('two', b, c, 'bottom', 'VCC')];
  assert.equal(hasRoutedConnection(a, c, 'VCC', traces), true);
  assert.equal(hasRoutedConnection(c, a, 'VCC', traces), true);
  assert.equal(hasRoutedConnection(a, c, 'GND', traces), false);
  assert.equal(hasRoutedConnection(a, c, 'VCC', [traces[0], { ...traces[1], start: pad('B', 1) }]), false);
  assert.equal(hasRoutedConnection(a, c, 'VCC', [traces[0], { ...traces[1], net: 'GND' }]), false);
});

test('segment distances handle crossing, parallel, collinear, point and diagonal separation', () => {
  const horizontal = [{ x: 0, y: 0 }, { x: 10, y: 0 }];
  assert.equal(segmentDistance(horizontal, [{ x: 5, y: -5 }, { x: 5, y: 5 }]), 0);
  assert.equal(segmentDistance(horizontal, [{ x: 8, y: 3 }, { x: 2, y: 3 }]), 3);
  assert.equal(segmentDistance(horizontal, [{ x: 7, y: 0 }, { x: 15, y: 0 }]), 0);
  assert.equal(segmentDistance(horizontal, [{ x: 13, y: 4 }, { x: 13, y: 4 }]), 5);
});

const crossParts = [part('A', 125, 200), part('B', 525, 200), part('C', 325, 75), part('D', 325, 400)];
const crossTraces = [route('X', pad('A'), pad('B')), route('Y', pad('C'), pad('D'))];
test('different-net copper crossings are errors only on the same layer', () => {
  assert.ok(issues(crossParts, crossTraces).some((item) => item.title === 'Copper nets touch'));
  assert.ok(!issues(crossParts, [crossTraces[0], { ...crossTraces[1], layer: 'bottom' }]).some((item) => item.title === 'Copper nets touch'));
  assert.ok(!issues(crossParts, [crossTraces[0], { ...crossTraces[1], net: 'X' }]).some((item) => item.title === 'Copper nets touch'));
});

test('copper contact includes trace width, not just centerline intersection', () => {
  const parts = [part('A', 125, 200), part('B', 525, 200), part('C', 175, 204), part('D', 475, 204)];
  const thin = [route('X', pad('A'), pad('B'), 'top', 'X', 0.2), route('Y', pad('C'), pad('D'), 'top', 'Y', 0.2)];
  assert.ok(!issues(parts, thin).some((item) => item.title === 'Copper nets touch'));
  assert.ok(issues(parts, thin.map((trace) => ({ ...trace, width: 1.2 }))).some((item) => item.title === 'Copper nets touch'));
});

test('both copper layers contact through-hole pads, including unassigned pads', () => {
  const parts = [part('A', 125, 200), part('B', 525, 200), part('P', 300, 200)];
  for (const layer of ['top', 'bottom']) {
    const contacts = issues(parts, [route('X', pad('A'), pad('B'), layer)]);
    assert.ok(contacts.some((item) => item.title === 'Route touches another pad' && item.detail.includes('P.1')));
  }
});

test('different net names on one plated pad conflict even when traces are on opposite layers', () => {
  const parts = [part('A', 125, 100), part('B', 325, 200), part('C', 525, 300)];
  const traces = [route('X', pad('A'), pad('B')), route('Y', pad('B'), pad('C'), 'bottom')];
  assert.ok(issues(parts, traces).some((item) => item.title === 'Conflicting pad nets'));
});

test('pad overlap and copper beyond the actual board edge cannot silently pass', () => {
  assert.ok(issues([part('A', 100, 100), part('B', 101, 100)], []).some((item) => item.title === 'Pads touch'));
  const parts = [part('A', 25, 100), part('B', 325, 100)];
  assert.ok(issues(parts, [route('X', pad('A'), pad('B'))]).some((item) => item.title === 'Copper outside board'));
});
