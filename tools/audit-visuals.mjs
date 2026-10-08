import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium } from '@playwright/test';
import { labValues as values } from '../tests/fixtures/labValues.mjs';
import { labExtremeCases } from '../tests/fixtures/labExtremes.mjs';

const output = process.env.VISUAL_AUDIT_DIR || path.join(os.homedir(), 'Desktop/ZyloXP/visual-audit');
const server = await createServer({ cacheDir: 'node_modules/.cache/zyloxp-gallery', server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
const escape = (text) => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
let browser;
try {
  await mkdir(output, { recursive: true });
  const { lessonQuestions, labScenarios } = await server.ssrLoadModule('/src/data.ts');
  const { electricalConcepts, engineeringGames } = await server.ssrLoadModule('/src/electricalAtlasData.ts');
  const { QuestionSchematic } = await server.ssrLoadModule('/src/QuestionSchematic.tsx');
  const { LabSchematic } = await server.ssrLoadModule('/src/LabVisualStage.tsx');
  const { ElectricalAtlas, InteractiveConceptDiagram } = await server.ssrLoadModule('/src/ElectricalAtlas.tsx');
  const { CircuitWorkbench } = await server.ssrLoadModule('/src/CircuitWorkbench.tsx');
  const fixtures = [];
  for (const question of lessonQuestions) {
    fixtures.push({ id: question.id, group: 'questions', title: question.subtopic, prompt: question.prompt,
      values: question.visualValues, html: renderToStaticMarkup(createElement(QuestionSchematic, { question, powered: false, revealed: true })) });
  }
  for (const lab of labScenarios) {
    fixtures.push({ id: lab.id, group: 'labs', title: lab.title,
      html: renderToStaticMarkup(createElement(LabSchematic, { lab, values, running: false })) });
  }
  if (process.env.VISUAL_AUDIT_EXTREMES === '1') {
    for (const fixture of labExtremeCases) {
      const lab = labScenarios.find((item) => item.id === fixture.labId);
      if (!lab) throw new Error(`Unknown audit lab: ${fixture.labId}`);
      fixtures.push({ id: fixture.id, group: 'lab-extremes', title: fixture.id, values: fixture.values,
        html: renderToStaticMarkup(createElement(LabSchematic, { lab, values: fixture.values, running: false })) });
    }
  }
  const kinds = new Set();
  for (const concept of electricalConcepts) {
    if (kinds.has(concept.diagramKind)) continue;
    kinds.add(concept.diagramKind);
    fixtures.push({ id: concept.id, group: 'atlas', title: concept.title,
      html: renderToStaticMarkup(createElement(InteractiveConceptDiagram, { kind: concept.diagramKind })) });
  }
  const references = [...new Set([...lessonQuestions, ...labScenarios].map((item) => item.diagram))];
  const noop = () => {};
  for (const game of engineeringGames) {
    fixtures.push({ id: game.id, group: 'games', title: game.title,
      html: renderToStaticMarkup(createElement(ElectricalAtlas, { activeId: game.id, view: 'game', onBack: noop,
        onCompleteConcept: noop, onCompleteGame: noop, onOpenConcept: noop, onOpenGame: noop, onOpenLab: noop, onOpenPcbDesigner: noop })) });
  }
  for (const mode of ['series', 'parallel']) {
    fixtures.push({ id: mode, group: 'workbench', title: `${mode} circuit workbench`,
      html: renderToStaticMarkup(createElement(CircuitWorkbench, { initialDesign: { id: 'audit', name: 'Audit', mode, voltage: 9,
        savedAt: 0, resistors: Array.from({ length: 6 }, (_, i) => ({ id: String(i), resistance: 100 + i * 100, rating: 0.5 })) },
        onBack: noop, onDelete: noop, onSave: noop, savedDesigns: [] })) });
  }
  for (const asset of references) {
    fixtures.push({ id: path.basename(asset, '.svg'), group: 'references', title: asset,
      html: `<img alt="${escape(asset)}" src="data:image/svg+xml;base64,${Buffer.from(await readFile(path.join('public', asset))).toString('base64')}">` });
  }
  const css = await readFile('src/styles.css', 'utf8') + await readFile('src/ElectricalAtlas.css', 'utf8');
  const style = `<style>${css}\nbody{margin:0;padding:20px;background:#e9f0f3} .auditGrid{display:grid;grid-template-columns:640px 640px;gap:20px}.auditItem{min-width:0;background:#f7fbfd;padding:12px}.auditItem h2{font:700 16px Arial;margin:0 0 8px}.auditItem p{font:14px Arial;margin:0 0 8px}.auditItem svg:not(.lucide),.auditItem img{width:100%;height:auto;display:block}.auditItem .atlasControlPanel,.auditItem .atlasStage>header,.auditItem .atlasReadoutStrip,.auditItem .atlasGameHeader,.auditItem .atlasGameControls,.auditItem .atlasGameProgress,.auditItem .workbenchHeader,.auditItem .workbenchControls,.auditItem .workbenchMetricBand,.auditItem .workbenchResultTable{display:none}.auditItem .atlasInteractiveGrid,.auditItem .atlasGameWorkspace,.auditItem .workbenchLayout{display:block}*{animation:none!important;transition:none!important}</style>`;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1360, height: 1100 } });
  const groups = ['questions', 'labs', 'atlas', 'references', 'games', 'workbench', 'lab-extremes'];
  const layoutFindings = [];
  for (const group of groups) {
    const items = fixtures.filter((item) => item.group === group);
    for (let index = 0; index < items.length; index += 6) {
      const batch = items.slice(index, index + 6);
      const html = `<!doctype html><meta charset="utf-8">${style}<main class="auditGrid">${batch.map((item) => `<section class="auditItem" data-id="${item.id}"><h2>${escape(item.title)}</h2>${item.prompt ? `<p>${escape(item.prompt)}</p>` : ''}${item.html}</section>`).join('')}</main>`;
      const basename = `${group}-${index / 6 + 1}`;
      await writeFile(path.join(output, `${basename}.html`), html);
      await page.setContent(html);
      layoutFindings.push(...await page.locator('.auditItem').evaluateAll((items) => items.flatMap((item) => {
        const texts = [...item.querySelectorAll('svg text')].filter((element) => !element.closest('[aria-hidden="true"]')).map((element) => ({
          text: element.textContent, box: element.getBoundingClientRect(), svg: element.ownerSVGElement.getBoundingClientRect(),
        })).filter((item) => item.box.width > 0 && item.box.height > 0);
        const findings = [];
        texts.forEach((current, index) => {
          if (current.box.left < current.svg.left - 1 || current.box.right > current.svg.right + 1 || current.box.top < current.svg.top - 1 || current.box.bottom > current.svg.bottom + 1) {
            findings.push({ id: item.getAttribute('data-id'), kind: 'text-outside-svg', text: current.text });
          }
          for (const other of texts.slice(index + 1)) {
            const width = Math.min(current.box.right, other.box.right) - Math.max(current.box.left, other.box.left);
            const height = Math.min(current.box.bottom, other.box.bottom) - Math.max(current.box.top, other.box.top);
            if (width > 1 && height > 1) findings.push({ id: item.getAttribute('data-id'), kind: 'text-intersection', text: current.text, other: other.text });
          }
        });
        return findings;
      })));
      await page.screenshot({ path: path.join(output, `${basename}.png`), fullPage: true });
    }
  }
  await writeFile(path.join(output, 'fixtures.json'), JSON.stringify(fixtures, null, 2));
  await writeFile(path.join(output, 'layout-findings.json'), JSON.stringify(layoutFindings, null, 2));
  console.log(JSON.stringify({ output, possibleLayoutIssues: layoutFindings.length, counts: Object.fromEntries(groups.map((group) => [group, fixtures.filter((item) => item.group === group).length])) }));
} finally {
  await browser?.close();
  await server.close();
}
