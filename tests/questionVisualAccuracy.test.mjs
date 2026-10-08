import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium } from '@playwright/test';
import { fullBankAvailability, loadQuestionAudit, readBankVariants, readReferenceAudit, root } from './fixtures/question-bank-audit.mjs';

let audit;
before(async () => { audit = await loadQuestionAudit(); });
after(async () => { await audit?.server.close(); });
const render = (question, revealed = true, powered = false) => renderToStaticMarkup(createElement(audit.QuestionSchematic, { question, revealed, powered }), { identifierPrefix: `${question.id}-` });
const family = (template) => audit.variants.filter((q) => q.template === template);
const numeric = (text) => Number.parseFloat(text.replace(/^[^=]*=\s*/, '').replace(/^power factor\s+/, ''));
const content = (html) => html.split('<g class="schematicContent">')[1].split('<g class="schematicLiveState"')[0];
const reference = (id) => readFile(`${root}public/question-bank/images/${id}.svg`, 'utf8');

test('committed fixture renders all 895 supported prompt variants from the 50,000-row snapshot', () => {
  assert.equal(audit.census.source, 'committed-fixture');
  assert.equal(Object.keys(audit.census.families).length, 20);
  assert.equal(Object.values(audit.census.families).reduce((sum, f) => sum + f.rows, 0), 50000);
  assert.equal(new Set(audit.variants.map((q) => q.template)).size, 20);
  assert.equal(audit.variants.length, 895);
  assert.equal(audit.variants.reduce((sum, q) => sum + q.coverage, 0), 50000);
  for (const q of audit.variants) {
    assert.ok(q.visualValues.length > 0, q.id);
    for (const revealed of [false, true]) for (const powered of [false, true]) {
      const html = content(render(q, revealed, powered));
      assert.doesNotMatch(html, /NaN|Infinity|undefined|No schematic available/, q.id);
      if (revealed) assert.ok(html.includes(q.options[q.correctIndex]), `${q.id}: answer correspondence`);
    }
  }
});

test('all supported bank answers agree with independent engineering recomputation at displayed precision', () => {
  for (const q of audit.variants) {
    const [a, b, c] = q.visualValues.map(numeric);
    const charges = q.prompt.match(/\d+(?:\.\d+)?\s*µC/g)?.map(numeric);
    const distance = numeric(q.prompt.match(/\d+(?:\.\d+)?\s*m\b/)?.[0] || '0');
    const ratios = q.visualValues[0].split(':').map(Number);
    const expected = {
      'DC-01': () => a / b, 'AC-01': () => a / Math.sqrt(2), 'NT-01': () => a / b,
      'TR-01': () => a * b, 'EM-01': () => 8.98755e9 * charges[0] * charges[1] * 1e-12 / distance ** 2,
      'TL-01': () => Math.sqrt(a / b * 1000), 'PS-01': () => Math.sqrt(3) * a * b * c,
      'TM-01': () => c * b / a, 'PE-01': () => a * b, 'AE-01': () => -b / a,
      'SD-01': () => a * b / 1000, 'DL-01': () => 2 ** a, 'SS-01': () => 2 * a,
      'CS-01': () => a / (1 + a), 'CM-01': () => 2 * a, 'MI-01': () => 1000 * b / 2 ** a,
      'PCB-01': () => a * b, 'ES-01': () => 1e6 / a, 'RF-01': () => a / b,
      'SP-01': () => b * ratios[1] / ratios[0],
    }[q.template]();
    const answer = q.options[q.correctIndex];
    const decimals = answer.match(/^-?\d+\.(\d+)/)?.[1].length || 0;
    assert.ok(Math.abs(numeric(answer) - expected) <= 0.5 * 10 ** -decimals + 1e-9, `${q.id}: ${answer} vs ${expected}`);
  }
});

test('equal Coulomb charges preserve both values and center-to-center separation in every variant', () => {
  let equalCharges = 0;
  for (const q of family('EM-01')) {
    const charges = q.prompt.match(/\d+(?:\.\d+)?\s*µC/g);
    const distance = q.prompt.match(/\d+(?:\.\d+)?\s*m\b/)[0];
    const html = content(render(q));
    assert.ok(html.includes(`q₁ = ${charges[0]}`), q.id);
    assert.ok(html.includes(`q₂ = ${charges[1]}`), q.id);
    assert.ok(html.includes(`r = ${distance}`), q.id);
    assert.match(html, /x1="150" y1="245" x2="490" y2="245"/);
    if (charges[0] === charges[1]) equalCharges++;
  }
  assert.equal(equalCharges, 40);
  const opposite = render({ ...family('EM-01')[0], prompt: 'Charges -3 µC and 4 µC, separated by 0.2 m.' });
  assert.match(opposite, /d="M196 145 H260"/);
  assert.match(opposite, /d="M444 145 H380"/);
  const neutral = render({ ...family('EM-01')[0], prompt: 'Charges 0 µC and 4 µC, separated by 0.2 m.' });
  assert.doesNotMatch(neutral, /class="schematicForce /);
});

test('register geometry contains every bit, including b0 for 9, 10 and 11 bits', () => {
  for (const q of family('DL-01')) {
    const bits = numeric(q.visualValues[0]), html = render(q);
    assert.equal([...html.matchAll(/class="schematicBitCell /g)].length, bits);
    for (let bit = 0; bit < bits; bit++) assert.ok(html.includes(`>b${bit}</text>`), q.id);
    assert.doesNotMatch(html, /choices per bit ×/);
  }
});

test('phasor vector and cosine waveform agree at bank and supplementary signed angles', () => {
  for (const phase of [-180, -90, -30, 0, 30, 90, 180]) {
    const q = { ...family('AC-01')[0], visualValues: ['18 V', `${phase} °`] };
    const html = render(q), tip = html.match(/class="schematicPhasor" d="M475 175 L([\d.-]+) ([\d.-]+)"/);
    assert.ok(Math.abs(Number(tip[1]) - (475 + 78 * Math.cos(phase * Math.PI / 180))) < 1e-8);
    assert.ok(Math.abs(Number(tip[2]) - (175 - 78 * Math.sin(phase * Math.PI / 180))) < 1e-8);
    const start = html.match(/class="schematicSignal" d="M70\.000 ([\d.-]+)/);
    assert.ok(Math.abs(Number(start[1]) - (165 - 55 * Math.cos(phase * Math.PI / 180))) <= 0.00051);
  }
});

test('ADC sampled code geometry uses the actual bit depth and follows its analog input', () => {
  for (const q of family('MI-01')) {
    const levels = 2 ** numeric(q.visualValues[0]), html = render(q);
    const path = html.match(/class="schematicCode" d="([^"]+)"/)[1];
    const points = [...path.matchAll(/(?:M([\d.]+) |H([\d.]+) V)([\d.-]+)/g)];
    assert.equal(points.length, 25);
    points.forEach(([, x0, x1, y], i) => {
      const code = Math.floor((0.5 + 0.4 * Math.sin(4 * Math.PI * i / 24)) * levels);
      assert.ok(Math.abs(Number(y) - (215 - 110 * code / (levels - 1))) < 1e-9);
      assert.ok(Math.abs(Number(x0 || x1) - (445 + 140 * i / 24)) < 1e-9);
    });
    assert.ok(html.includes(`0…${levels - 1} · sample index`));
  }
});

test('current and signal paths do not imply a shorted source, op-amp input current, or an unspecified matched load', () => {
  const opamp = render(family('AE-01')[0], true, true);
  assert.match(opamp, /d="M280 150 V78 H370 M480 78 H530 V185"/);
  assert.match(opamp, /class="schematicFlow" d="M60 150 H280 V78 H530 V185"/);
  const buck = render(family('PE-01')[0]);
  assert.match(buck, /d="M65 120 V165 M65 221 V265"/);
  assert.match(buck, /d="M205 120 V174 M205 210 V265"/);
  assert.match(buck, /d="M184 210 H226 L205 174 Z M183 174 H227"/);
  assert.match(buck, />SW ON<\/text>/);
  assert.match(buck, />OFF<\/text>/);
  const line = render(family('TL-01')[0]);
  assert.doesNotMatch(line, /<rect class="schematicComponent"/);
  assert.equal([...line.matchAll(/>L′Δx<\/text>/g)].length, 3);
  assert.equal([...line.matchAll(/>C′Δx<\/text>/g)].length, 2);
  assert.match(render(family('CS-01')[0]), /d="M286 262 H160 V180" marker-end=/);
  const ct = render(family('SP-01')[0]);
  assert.ok(ct.indexOf('class="schematicCtWindow"') < ct.indexOf('d="M45 118 H125 M165 118 H565"'), 'CT window must not hide the primary conductor');
  assert.match(render(family('SD-01')[0]), /x1="275" y1="210" x2="325" y2="195"/);
});

test('time, frequency and distance pictures state their measurement conventions', () => {
  for (const q of family('SS-01')) {
    const html = render(q);
    assert.ok(html.includes(`−${q.visualValues[0]}`));
    assert.ok(html.includes(`+${q.visualValues[0]}`));
    assert.ok(html.includes('Practical fs &gt; 2 × fmax'));
  }
  assert.match(render(family('ES-01')[0]), /UART · 8N1 EXAMPLE · IDLE HIGH/);
  assert.match(render(family('ES-01')[0]), /M62 110 H110 V205 H158 V110 H206/);
  assert.match(render(family('PCB-01')[0]), /d="M155 88 H485"/);
  assert.match(render(family('RF-01')[0]), /d="M155 275 H365"/);
  assert.doesNotMatch(render(family('RF-01')[0]), /schematicAntenna/);
  assert.match(render(family('CM-01')[0]), /modulation index 0.5/);
});

test('all 20 bundled references match committed question identities and descriptions', async () => {
  const result = readReferenceAudit(), browser = await chromium.launch({ headless: true });
  try {
    assert.equal(result.source, 'bundled-references');
    assert.equal(result.local.length, 20);
    const page = await browser.newPage();
    const errors = await page.evaluate((references) => references.flatMap((reference) => {
      const xml = new DOMParser().parseFromString(reference.svg, 'image/svg+xml');
      const errors = [], svg = xml.documentElement;
      if (xml.querySelector('parsererror')) errors.push('invalid XML');
      if (svg.namespaceURI !== 'http://www.w3.org/2000/svg' || svg.tagName !== 'svg') errors.push('invalid SVG root');
      if (svg.getAttribute('viewBox') !== '0 0 960 600') errors.push('unexpected viewBox');
      if (svg.querySelector('desc')?.textContent !== reference.prompt) errors.push('description mismatch');
      if (svg.querySelector('title')?.textContent !== `${reference.subtopic} problem diagram`) errors.push('title mismatch');
      if (!svg.textContent.includes(reference.questionId) || !svg.textContent.includes(reference.imageId)) errors.push('missing identity');
      return errors.map((error) => `${reference.file}: ${error}`);
    }), result.local);
    assert.deepEqual(errors, []);
    for (const q of audit.data.lessonQuestions) {
      const reference = result.local.find((r) => q.diagram.endsWith(`/${r.file}`));
      assert.ok(reference, q.diagram);
      assert.equal(reference.questionId, q.id);
      assert.equal(reference.subtopic, q.subtopic);
    }
  } finally { await browser.close(); }
});

test('missing external bank falls back without skipping core variants or bundled references', () => {
  const options = { full: true, bank: `${root}tests/fixtures/absent-external-bank` };
  const bank = readBankVariants(options), references = readReferenceAudit(options);
  assert.equal(bank.source, 'committed-fixture');
  assert.equal(bank.variants.length, 895);
  assert.equal(references.local.length, 20);
  assert.match(bank.fullAuditSkipped, /External bank unavailable/);
  assert.match(references.fullAuditSkipped, /External bank unavailable/);
});

const fullAuditSkip = process.env.ZYLOXP_FULL_QUESTION_AUDIT !== '1'
  ? 'Opt-in external census: set ZYLOXP_FULL_QUESTION_AUDIT=1; core fixture tests always run'
  : fullBankAvailability().reason || false;
test('opt-in census counts 250,000 bank rows and validates 12,500 upstream image identities', { skip: fullAuditSkip }, () => {
  const census = readBankVariants({ full: true }), result = readReferenceAudit({ full: true });
  assert.equal(census.source, 'external-bank');
  assert.equal(Object.keys(census.families).length, 100);
  assert.equal(Object.values(census.families).reduce((sum, f) => sum + f.rows, 0), 250000);
  const comparable = (rows) => rows.map(({ id, template, prompt, answer, coverage }) => ({ id, template, prompt, answer, coverage }));
  assert.deepEqual(comparable(census.variants), comparable(audit.census.variants), 'committed fixture must reproduce the supported external prompts exactly');
  assert.equal(result.imageCount, 12500);
  assert.equal(result.metadataCount, 12500);
  assert.equal(Object.keys(result.families).length, 100);
  assert.equal(result.local.length, 20);
  assert.deepEqual(result.errors, []);
});

test('static reference topology guards cover source terminals, polarity, isolated ports and device symbols', async () => {
  const dc = await reference('IMG-0001');
  assert.match(dc, /cx="205" cy="354" r="34"/);
  assert.match(dc, /d="M205 320 V285 H290 V354 H315"/);
  const network = await reference('IMG-1251');
  assert.match(network, /d="M350 300 H395 M395 390 H155 V334"/);
  assert.match(network, /d="M710 270 L698 280 L722 295 L698 310 L722 325 L698 340 L710 355"/);
  const buck = await reference('IMG-5001');
  assert.match(buck, /M370 324 H410 M370 356 L390 324 L410 356 Z/);
  assert.match(buck, /d="M390 425 H715"/);
  const bjt = await reference('IMG-6251');
  assert.match(bjt, /x1="700" y1="205" x2="555" y2="205" marker-end=/);
  const opamp = await reference('IMG-5626');
  assert.match(opamp, /d="M370 260 V170 H380"/);
  assert.match(opamp, /d="M400 340 H330 V410"/);
  assert.match(await reference('IMG-3751'), /x="107" y="206" width="96" height="188"/);
  assert.match(await reference('IMG-4376'), /cx="325" cy="225" r="5"/);
  assert.match(await reference('IMG-11876'), /M275 260 q12.5 25 25 0 q12.5 25 25 0/);
});

test('static parameter and plot correspondence includes RC tau, UART bit width and ADC code range', async () => {
  assert.match(await reference('IMG-1876'), /M630 315.182 H680 V410/);
  assert.match(await reference('IMG-2501'), /x1="260" y1="270" x2="700" y2="270"/);
  assert.match(await reference('IMG-9376'), />0 ... 4095<\/text>/);
  const uart = await reference('IMG-10626');
  assert.match(uart, /M110 220 H170 V340 H230 V220 H290/);
  assert.match(uart, /M170 405 V429 M170 417 H230 M230 405 V429/);
  assert.match(await reference('IMG-0626'), /x1="130" y1="405" x2="130" y2="210"/);
  assert.match(await reference('IMG-8751'), /x="480" y="285" width="260"/);
  assert.match(await reference('IMG-8126'), /x="214" y="317" text-anchor="start">-<\/text>/);
  assert.match(await reference('IMG-10001'), /x1="145" y1="295" x2="815" y2="295"/);
});

test('all app reference text stays inside the drawing and avoids other labels', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const q of audit.data.lessonQuestions) {
      const svg = await readFile(`${root}public${q.diagram}`, 'utf8');
      await page.setContent(`<!doctype html><meta charset="utf-8">${svg}`);
      const errors = await page.locator('svg').evaluate((svg) => {
        const texts = [...svg.querySelectorAll('text')].map((t) => ({ text: t.textContent, box: t.getBBox() }));
        const errors = [];
        for (let i = 0; i < texts.length; i++) {
          const { text, box: b } = texts[i];
          if (b.x < 24 || b.x + b.width > 936 || b.y < 22 || b.y + b.height > 574) errors.push(`out of content area: ${text}`);
          for (const { text: other, box: c } of texts.slice(i + 1)) {
            if (Math.min(b.x + b.width, c.x + c.width) - Math.max(b.x, c.x) > 1 && Math.min(b.y + b.height, c.y + c.height) - Math.max(b.y, c.y) > 1) errors.push(`overlap: ${text} / ${other}`);
          }
        }
        return errors;
      });
      assert.deepEqual(errors, [], q.diagram);
    }
  } finally { await browser.close(); }
});

test('every parameter variant fits the real stylesheet, with concealed/revealed answers at desktop and mobile widths', { timeout: 120000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const css = await readFile(`${root}src/styles.css`, 'utf8');
    for (const width of [640, 350]) {
      await page.setViewportSize({ width, height: 800 });
      for (const revealed of [false, true]) {
        for (let i = 0; i < audit.variants.length; i += 80) {
          const batch = audit.variants.slice(i, i + 80);
          await page.setContent(`<!doctype html><meta charset="utf-8"><style>${css}\nbody{margin:0}.fixture{width:${width}px}*{animation:none!important}</style>${batch.map((q) => `<div class="fixture" data-id="${q.id}">${render(q, revealed)}</div>`).join('')}`);
          const errors = await page.locator('.fixture').evaluateAll((items) => items.flatMap((item) => {
            const svg = item.querySelector('svg'), errors = [];
            if (document.compatMode !== 'CSS1Compat') errors.push('fixture must use standards mode');
            if (getComputedStyle(svg.querySelector('.schematicBackdrop')).fill !== 'rgb(248, 252, 254)') errors.push('schematic backdrop stylesheet missing');
            const wire = svg.querySelector('.schematicWire');
            if (wire && getComputedStyle(wire).stroke === 'none') errors.push('schematic wire stylesheet missing');
            const texts = [...svg.querySelectorAll('text')].map((t) => {
              const b = t.getBBox(), m = svg.getScreenCTM().inverse().multiply(t.getScreenCTM());
              const p = new DOMPoint(b.x, b.y).matrixTransform(m);
              return { text: t.textContent, x: p.x, y: p.y, width: b.width, height: b.height, node: t };
            });
            for (let j = 0; j < texts.length; j++) {
              const b = texts[j];
              if (b.x < -0.01 || b.y < -0.01 || b.x + b.width > 640.01 || b.y + b.height > 350.01) errors.push(`clipped: ${b.text}`);
              const note = b.node.previousElementSibling;
              if (note?.classList.contains('schematicNote')) {
                const n = note.getBBox();
                if (b.x < n.x + 3 || b.x + b.width > n.x + n.width - 3) errors.push(`note overflow: ${b.text}`);
              }
              for (const c of texts.slice(j + 1)) {
                if (Math.min(b.x + b.width, c.x + c.width) - Math.max(b.x, c.x) > 1 && Math.min(b.y + b.height, c.y + c.height) - Math.max(b.y, c.y) > 1) errors.push(`text overlap: ${b.text} / ${c.text}`);
              }
            }
            return errors.map((error) => `${item.dataset.id}: ${error}`);
          }));
          assert.deepEqual(errors, [], `${width}px, revealed=${revealed}`);
        }
      }
    }
  } finally { await browser.close(); }
});
