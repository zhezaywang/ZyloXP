import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePcbBoard, parsePcbFile, readPcbDraft, writePcbDraft, readPcbProjects, PCB_DRAFT_KEY, PCB_STORAGE_KEY, MAX_COMPONENTS, MAX_TRACES, MAX_PCB_FILE_BYTES } from '../src/pcbStorage.ts';

const pads = { capacitor: 2, header: 6, led: 2, mcu: 8, regulator: 3, resistor: 2, usb: 4 };
const fixture = () => ({
  id: 'board-1', name: 'Sensor revision B', savedAt: 1780000000000,
  components: [
    { id: 'r1', kind: 'resistor', reference: 'R1', x: 200, y: 200, rotation: 90 },
    { id: 'j1', kind: 'usb', reference: 'J1', x: 95, y: 270, rotation: 0 },
  ],
  traces: [{ id: 'trace-1', layer: 'bottom', net: 'VBUS', width: 0.8,
    start: { componentId: 'j1', padIndex: 0 }, end: { componentId: 'r1', padIndex: 1 } }],
});
function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('draft round trip preserves geometry, copper, endpoints, and names', () => {
  const storage = memoryStorage();
  const board = fixture();
  assert.equal(writePcbDraft(storage, board), true);
  assert.deepEqual(readPcbDraft(storage, pads), board);
  assert.equal(storage.getItem(PCB_STORAGE_KEY), null);
});

test('an intentionally empty board restores as empty, not as a starter board', () => {
  const storage = memoryStorage();
  const board = { ...fixture(), components: [], traces: [] };
  writePcbDraft(storage, board);
  assert.deepEqual(readPcbDraft(storage, pads), board);
});

test('rejects corrupt topology without silently deleting components or routes', () => {
  const mutations = [
    (board) => { board.traces[0].end.padIndex = 2; },
    (board) => { board.traces[0].start.componentId = 'missing'; },
    (board) => { board.traces[0].end.padIndex = 0.5; },
    (board) => { board.traces[0].end = { ...board.traces[0].start }; },
    (board) => { board.components.push({ ...board.components[0] }); },
    (board) => { board.components[0].x = Infinity; },
    (board) => { board.components[0].kind = '__proto__'; },
    (board) => { board.traces[0].width = NaN; },
    (board) => { board.traces[0].layer = 'unknown'; },
    (board) => { board.savedAt = NaN; },
  ];
  mutations.forEach((mutate, index) => {
    const board = fixture();
    mutate(board);
    assert.equal(parsePcbBoard(board, pads), null, `Mutation ${index} must be rejected`);
  });
});

test('reading malformed or unavailable storage never crashes startup', () => {
  const storage = memoryStorage();
  storage.setItem(PCB_DRAFT_KEY, '{bad');
  assert.equal(readPcbDraft(storage, pads), null);
  assert.equal(readPcbDraft({ getItem() { throw new Error('denied'); } }, pads), null);
  assert.equal(writePcbDraft({ setItem() { throw new Error('full'); } }, fixture()), false);
});

test('saved projects survive independently of the active draft', () => {
  const storage = memoryStorage();
  storage.setItem(PCB_STORAGE_KEY, JSON.stringify([fixture(), { broken: true }]));
  writePcbDraft(storage, { ...fixture(), name: 'New draft' });
  assert.deepEqual(readPcbProjects(storage, pads), [fixture()]);
  assert.equal(readPcbDraft(storage, pads).name, 'New draft');
});

test('storage bounds match the editor capacity and reject oversized boards', () => {
  const board = fixture();
  board.components = Array.from({ length: MAX_COMPONENTS }, (_, index) => ({
    ...board.components[0], id: `r${index}`, reference: `R${index}`,
  }));
  board.traces = Array.from({ length: MAX_TRACES }, (_, index) => ({
    ...board.traces[0], id: `trace-${index}`,
    start: { componentId: 'r0', padIndex: 0 }, end: { componentId: 'r1', padIndex: 1 },
  }));
  assert.ok(parsePcbBoard(board, pads));
  assert.equal(parsePcbBoard({ ...board, components: [...board.components, { ...board.components[0], id: 'extra' }] }, pads), null);
  assert.equal(parsePcbBoard({ ...board, traces: [...board.traces, { ...board.traces[0], id: 'extra' }] }, pads), null);
});

test('board file import accepts exported and intentionally empty boards', () => {
  const board = fixture();
  assert.deepEqual(parsePcbFile(JSON.stringify(board), pads), board);
  const empty = { ...board, components: [], traces: [] };
  assert.deepEqual(parsePcbFile(JSON.stringify(empty), pads), empty);
  assert.equal(parsePcbFile(JSON.stringify({ ...board, name: '   ' }), pads).name, 'Untitled PCB');
});

test('board file import rejects malformed, wrong-format, and oversized files', () => {
  assert.throws(() => parsePcbFile('{bad', pads), /not valid JSON/);
  assert.throws(() => parsePcbFile(JSON.stringify({ app: 'ZyloXP', data: {} }), pads), /not a valid ZyloXP board/);
  const broken = fixture();
  broken.traces[0].end.componentId = 'missing';
  assert.throws(() => parsePcbFile(JSON.stringify(broken), pads), /components and connections/);
  assert.throws(() => parsePcbFile(' '.repeat(MAX_PCB_FILE_BYTES + 1), pads), /256 KB/);
  assert.throws(() => parsePcbFile(JSON.stringify({ ...fixture(), name: '\u03a9'.repeat(MAX_PCB_FILE_BYTES / 2) }), pads), /256 KB/);
});
