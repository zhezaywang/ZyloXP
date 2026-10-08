import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { labValues } from './fixtures/labValues.mjs';

let server, data, QuestionSchematic, LabSchematic, ElectricalAtlas, InteractiveConceptDiagram, CircuitWorkbench, concepts, games;
const render = (Component, props) => renderToStaticMarkup(createElement(Component, props));
before(async () => {
  server = await createServer({ cacheDir: 'node_modules/.cache/zyloxp-visual-renderers', server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
  data = await server.ssrLoadModule('/src/data.ts');
  ({ QuestionSchematic } = await server.ssrLoadModule('/src/QuestionSchematic.tsx'));
  ({ LabSchematic } = await server.ssrLoadModule('/src/LabVisualStage.tsx'));
  ({ ElectricalAtlas, InteractiveConceptDiagram } = await server.ssrLoadModule('/src/ElectricalAtlas.tsx'));
  ({ CircuitWorkbench } = await server.ssrLoadModule('/src/CircuitWorkbench.tsx'));
  ({ electricalConcepts: concepts, engineeringGames: games } = await server.ssrLoadModule('/src/electricalAtlasData.ts'));
});
after(async () => { await server?.close(); });
const question = (subtopic) => data.lessonQuestions.find((item) => item.subtopic === subtopic);

test('every bundled question, lab and Atlas family renders finite SVG geometry', () => {
  const diagrams = [
    ...data.lessonQuestions.map((question) => render(QuestionSchematic, { question, powered: false, revealed: true })),
    ...data.labScenarios.map((lab) => render(LabSchematic, { lab, values: labValues, running: false })),
    ...new Set(concepts.map((item) => item.diagramKind)),
  ];
  for (const item of diagrams) {
    const html = item.startsWith('<') ? item : render(InteractiveConceptDiagram, { kind: item });
    assert.match(html, /<svg/);
    assert.doesNotMatch(html, /(?:NaN|Infinity)/);
  }
});

test('RC schematic and lab keep separate capacitor leads and a closed charging switch', () => {
  const html = render(QuestionSchematic, { question: question('RC time constant'), powered: true, revealed: false });
  assert.match(html, /d="M345 105 H405 V132 M405 228 V255 H95 V226"/);
  assert.doesNotMatch(html, /H405 V255/);
  assert.match(html, /x1="150" y1="105" x2="190" y2="105"/);
  const lab = data.labScenarios.find((item) => item.id === 'lab-rc');
  const labHtml = render(LabSchematic, { lab, values: labValues, running: false });
  assert.match(labHtml, /d="M296 100 H316 V135 M316 235 V272 H70 V228"/);
  assert.doesNotMatch(labHtml, /H316 V272/);
});

test('unknown questions do not get an unrelated Ohm law drawing', () => {
  const html = render(QuestionSchematic, { question: { ...data.lessonQuestions[0], subtopic: 'Unmapped concept' }, powered: false, revealed: false });
  assert.match(html, /No schematic available/);
  assert.doesNotMatch(html, /schematicMeterLetter/);
});

test('duplicate question instances have independent SVG definition IDs', () => {
  const props = { question: data.lessonQuestions[0], powered: false, revealed: false };
  const html = renderToStaticMarkup(createElement('div', {}, createElement(QuestionSchematic, props), createElement(QuestionSchematic, props)));
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});

test('Norton flow follows its parallel resistor, while the unloaded Thevenin port has no current', () => {
  const html = render(QuestionSchematic, { question: question('Thevenin to Norton'), powered: true, revealed: true });
  assert.match(html, /class="schematicFlow" d="M435 137 V105 H515 V245 H435 V213"/);
  assert.doesNotMatch(html, /class="schematicFlow" d="M105/);
});

test('learning games and both circuit workbench modes render finite diagrams', () => {
  const noop = () => {};
  for (const game of games) {
    const html = render(ElectricalAtlas, { activeId: game.id, view: 'game', onBack: noop, onCompleteConcept: noop,
      onCompleteGame: noop, onOpenConcept: noop, onOpenGame: noop, onOpenLab: noop, onOpenPcbDesigner: noop });
    assert.doesNotMatch(html, /(?:NaN|Infinity)/);
  }
  for (const mode of ['series', 'parallel']) {
    const html = render(CircuitWorkbench, { initialDesign: { id: 'test', name: 'test', mode, voltage: 9, savedAt: 0,
      resistors: Array.from({ length: 6 }, (_, i) => ({ id: String(i), rating: 0.5, resistance: 100 + i * 100 })) },
      onBack: noop, onSave: noop, onDelete: noop, savedDesigns: [] });
    assert.doesNotMatch(html, /(?:NaN|Infinity)/);
    assert.match(html, /x1="90" x2="90" y1="80" y2="186"/);
    assert.match(html, /x1="90" x2="90" y1="232" y2="340"/);
  }
});

test('ADC lab uses actual sample times and keeps quantized points inside its voltage range', () => {
  const lab = data.labScenarios.find((item) => item.id === 'lab-adc');
  for (const adcSampleRate of [1, 8, 24]) {
    for (const adcInputFrequency of [0.1, 1, 12]) {
      const html = render(LabSchematic, { lab, values: { ...labValues, adcSampleRate, adcInputFrequency }, running: false });
      const points = [...html.matchAll(/class="labAdcSamplePoint" cx="([^"]+)" cy="([^"]+)"/g)];
      assert.equal(points.length, adcSampleRate + 1);
      points.forEach(([, x, y], index) => {
        assert.ok(Math.abs(Number(x) - (18 + index / adcSampleRate * 176)) < 1e-10);
        assert.ok(Number(y) >= 60 && Number(y) <= 100);
      });
    }
  }
});
