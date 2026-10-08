import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { secondOrderStep, secondOrderSettlingTime, transmissionVoltage } from '../src/visualMath.ts';
import { pidResponse } from '../src/atlasMath.ts';

const artifacts = process.env.ATLAS_AUDIT_ARTIFACTS;
const results = [];
const errors = [];
const diagnostics = [];
let server, browser, page, origin, concepts, games, cacheDir;
before(async () => {
  // node:test runs the SSR files in parallel. Their Vite instances must not
  // invalidate the optimized browser modules being served by this fixture.
  cacheDir = await mkdtemp(path.join(tmpdir(), 'zyloxp-atlas-vite-'));
  server = await createServer({ base: '/', cacheDir, logLevel: 'error', server: { host: '127.0.0.1', port: 0, hmr: false, ws: false } });
  await server.listen();
  origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  ({ electricalConcepts: concepts, engineeringGames: games } = await server.ssrLoadModule('/src/electricalAtlasData.ts'));
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') diagnostics.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) diagnostics.push(`${response.status()} ${response.url()}`); });
  page.on('requestfailed', request => diagnostics.push(`${request.failure()?.errorText} ${request.url()}`));
  if (artifacts) await mkdir(artifacts, { recursive: true });
});
after(async () => {
  try {
    if (artifacts) await writeFile(path.join(artifacts, 'atlas-browser-results.json'), JSON.stringify({ results, errors, diagnostics }, null, 2));
  } finally {
    await browser?.close();
    await server?.close();
    if (cacheDir) await rm(cacheDir, { recursive: true, force: true });
  }
});

async function open(view, id) {
  try {
    await page.goto(`${origin}/#/atlas/${view}/${id}`);
    await page.waitForFunction(() => document.querySelector('.atlasStage, .atlasGameWorkspace') || [...document.querySelectorAll('button')].some((button) => button.textContent.trim() === 'Start learning'));
    const start = page.getByRole('button', { name: 'Start learning', exact: true });
    if (await start.isVisible()) await start.click();
    await page.locator(view === 'concept' ? '.atlasStage' : '.atlasGameWorkspace').waitFor();
  } catch (cause) {
    throw new Error(`Atlas startup failed at ${view}/${id}: ${JSON.stringify({ errors, diagnostics: diagnostics.slice(-20) })}`, { cause });
  }
}

async function setSlider(name, value) {
  await page.getByRole('slider', { name, exact: true }).fill(String(value));
}

async function verifyModel(kind) {
  const values = await page.getByRole('slider').evaluateAll(inputs => inputs.map(input => +input.value));
  const [a, b, c, d] = values;
  const actual = await page.locator('.atlasReadoutStrip strong').allTextContents();
  const near = (value, expected, tolerance = 0.006) => assert.ok(Math.abs(value - expected) <= tolerance, `${kind} ${values}: ${value} != ${expected}`);
  const numbers = (expected, tolerance) => expected.forEach((value, index) => {
    if (value !== null) near(Number(actual[index].match(/-?[\d,.]+/)[0].replaceAll(',', '')), value, tolerance);
  });
  const point = async (selector) => page.locator(selector).evaluate(element => ({ x: +element.getAttribute('cx'), y: +element.getAttribute('cy') }));
  const trace = async (selector) => {
    const d = await page.locator(selector).getAttribute('d');
    return [...d.matchAll(/[ML]([\d.e+-]+) ([\d.e+-]+)/g)].map(([, x, y]) => ({ x: +x, y: +y }));
  };
  switch (kind) {
    case 'network': numbers([a / (b + c), a * c / (b + c), (a / (b + c)) ** 2 * c]); break;
    case 'phasor': {
      numbers(values);
      const tip = await point('.atlasPhasorTip');
      near(tip.x, 505 + a * 7 * Math.cos(c * Math.PI / 180));
      near(tip.y, 105 - a * 7 * Math.sin(c * Math.PI / 180));
      near((await trace('.atlasWavePath'))[0].y, 115 - a * 8 * Math.cos(c * Math.PI / 180));
      break;
    }
    case 'resonance': {
      const f0 = 1 / (2 * Math.PI * Math.sqrt(b * 1e-3 * c * 1e-6));
      const q = Math.sqrt(b * 1e-3 / (c * 1e-6)) / a;
      numbers([f0, q, f0 / q], 0.51);
      const points = await trace('.atlasResponsePath');
      near(Math.min(...points.map(p => p.y)), 55);
      for (const p of points) {
        const ratio = 0.25 + (p.x - 48) / 515 * 2.2;
        // Path serialization rounds x to 0.1 px; steep high-Q flanks need a pixel tolerance.
        const exactRatio = Math.abs(ratio - 1) < 0.00022 ? 1 : ratio;
        near(p.y, 190 - 135 / Math.sqrt(1 + q * q * (exactRatio - 1 / exactRatio) ** 2), Math.max(0.2, q * 0.03));
      }
      break;
    }
    case 'diode': {
      const current = 0.08 * Math.exp(-0.45 / 0.055) * Math.expm1(a / 0.055);
      numbers([current, a + current * b / 1000, current * b / 1000]);
      const tip = await point('.atlasPhasorTip');
      near(tip.y, 195 - current * 140 / 120);
      break;
    }
    case 'opamp': numbers([-a * b, Math.max(-c + 0.6, Math.min(c - 0.6, -a * b)), null]); break;
    case 'filter': {
      const gain = 1 / Math.hypot(1, b / a);
      numbers([gain * 100, 20 * Math.log10(gain), -Math.atan(b / a) * 180 / Math.PI], 0.51);
      const tip = await point('.atlasPhasorTip');
      near(tip.x, 50 + Math.log10(b / 20) / 3 * 510);
      near(tip.y, 55 - 20 * Math.log10(gain) * 2.7);
      break;
    }
    case 'digital': numbers([1000 / a, b, 500 / a - b], 0.51); break;
    case 'sampling': {
      numbers([b / a, null, Math.abs(a - Math.round(a / b) * b)]);
      const points = await page.locator('.atlasSampleDot').evaluateAll(elements => elements.map(element => ({ x: +element.getAttribute('cx'), y: +element.getAttribute('cy') })));
      assert.equal(points.length, Math.floor(b * 0.34) + 1);
      points.forEach((p, index) => { near(p.x, 35 + index / b / 0.34 * 520); near(p.y, 115 - 65 * Math.sin(2 * Math.PI * a * index / b)); });
      break;
    }
    case 'three-phase': {
      const apparent = Math.sqrt(3) * a * b / 1000;
      numbers([apparent * c, apparent, apparent * Math.sqrt(1 - c * c)]);
      break;
    }
    case 'transformer': numbers([a * b, a * b / c, c / b ** 2]); break;
    case 'buck': {
      const output = a * b / 100, ripple = (a - output) * b / 100 / 10;
      numbers([output, output / c, ripple]);
      assert.ok(output / c > ripple / 2, 'buck must remain in CCM');
      break;
    }
    case 'field': numbers([8.988e-3 * Math.abs(a * b) / c ** 2, null, c]); break;
    case 'transmission': {
      const reflection = (b - a) / (b + a);
      numbers([reflection, (1 + Math.abs(reflection)) / (1 - Math.abs(reflection)), null]);
      for (const p of await trace('.atlasStandingWave')) near(p.y, 125 - 28 * transmissionVoltage((p.x - 45) / 470, c, reflection), 0.002);
      break;
    }
    case 'control': {
      const overshoot = a < 1 ? Math.exp(-a * Math.PI / Math.sqrt(1 - a * a)) * 100 : 0;
      numbers([overshoot, secondOrderSettlingTime(a, b), c], 0.51);
      const scale = 145 / (c * (1 + overshoot / 100));
      for (const p of await trace('.atlasControlResponse')) near(p.y, 190 - c * secondOrderStep((p.x - 45) / 520 * 6, a, b) * scale);
      break;
    }
    case 'ground': numbers([a * b, c / 10, c]); break;
    case 'meter': numbers([c, c * b / (a + b), a / (a + b) * 100]); break;
    case 'transient': {
      numbers([a * b, 10 * (1 - Math.exp(-c)), 100 * (1 - Math.exp(-c))], 0.051);
      const tip = await point('.atlasPhasorTip');
      near(tip.x, 58 + c / 5 * 510);
      near(tip.y, 202 - (1 - Math.exp(-c)) * 130);
      break;
    }
    case 'mosfet': {
      const r = a > 3 ? 0.035 + 0.32 / (a - 3) ** 2 : 0;
      const current = a > 3 ? b / (c + r) : 0;
      numbers([current, b - current * c, current * (b - current * c)]);
      break;
    }
    case 'embedded': {
      const utilization = b * c / (a * 10);
      numbers([utilization, c / a, Math.max(0, 100 - utilization)], 0.051);
      const width = Number(await page.locator('.atlasCpuBusy').first().getAttribute('width'));
      near(width / 66, Math.min(1, utilization / 100));
      break;
    }
    case 'modulation': numbers([2 ** a, a * b / 1000, 100 / 10 ** (c / 20)]); break;
    case 'protection': {
      const trip = b > c ? d * 0.14 / ((b / c) ** 0.02 - 1) : null;
      numbers([b / c, trip, c / a]);
      if (trip === null) assert.equal(actual[1], 'No trip');
      break;
    }
    case 'antenna': {
      const loss = 32.44 + 20 * Math.log10(a) + 20 * Math.log10(b);
      numbers([loss, c + 2 * d - loss, c + 2 * d - loss + 100], 0.051);
      break;
    }
    case 'pid': {
      const model = pidResponse(a, b, c, d), scale = 155 / Math.max(1.1, model.peak);
      numbers([model.overshoot, model.settlingTime, model.steadyError], 0.051);
      const points = await trace('.atlasControlResponse');
      for (const p of points.slice(1)) near(p.y, 205 - model.at((p.x - 55) / 520 * 8) * scale, 0.1);
      break;
    }
    case 'uncertainty': numbers([10 * (1 + (a + d) / 100), b / Math.sqrt(c) / 10, a + d], 0.00006); break;
    default: assert.fail(`No numerical oracle for ${kind}`);
  }
}

async function inspect(id, state, screenshot = false) {
  const result = await page.evaluate(() => {
    const issues = [];
    for (const svg of document.querySelectorAll('.atlasStageCanvas svg, .atlasGameWorkspace svg[aria-label]')) {
      const vb = svg.viewBox.baseVal;
      if (/NaN|Infinity/.test(svg.outerHTML)) issues.push('non-finite SVG');
      const texts = [];
      for (const element of svg.querySelectorAll('path,rect,circle,text')) {
        if (element.closest('defs')) continue;
        const box = element.getBBox();
        const matrix = svg.getCTM().inverse().multiply(element.getCTM());
        const corners = [[box.x, box.y], [box.x + box.width, box.y + box.height], [box.x, box.y + box.height], [box.x + box.width, box.y]]
          .map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix));
        const bounds = { left: Math.min(...corners.map(p => p.x)), top: Math.min(...corners.map(p => p.y)), right: Math.max(...corners.map(p => p.x)), bottom: Math.max(...corners.map(p => p.y)) };
        const label = element.tagName === 'text' ? element.textContent : element.getAttribute('class');
        if (bounds.left < -1 || bounds.top < -1 || bounds.right > vb.width + 1 || bounds.bottom > vb.height + 1) issues.push(`outside SVG: ${label} ${JSON.stringify(bounds)}`);
        if (element.tagName === 'text') texts.push({ label, ...bounds });
      }
      for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
        const a = texts[i], b = texts[j];
        if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) issues.push(`overlapping labels: ${a.label} / ${b.label}`);
      }
    }
    if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('page overflows viewport');
    for (const output of document.querySelectorAll('.atlasReadoutStrip strong')) {
      if (output.scrollWidth > output.clientWidth + 1) issues.push(`truncated readout: ${output.textContent}`);
    }
    return { issues, text: document.querySelector('.atlasStage, .atlasGameWorkspace')?.textContent };
  });
  results.push({ id, state, viewport: page.viewportSize(), ...result });
  if (artifacts && screenshot) {
    await page.locator('.atlasStage, .atlasGameWorkspace').first().screenshot({ path: path.join(artifacts, `${page.viewportSize().width}-${id}-${state}.png`), animations: 'disabled' });
  }
  return result.issues;
}

test('all 24 Atlas diagram families: default and every min/max control combination on desktop and mobile', { timeout: 240000 }, async () => {
  const issues = [];
  const unique = [...new Map(concepts.map((concept) => [concept.diagramKind, concept])).values()];
  assert.equal(unique.length, 24);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const concept of unique) {
      await open('concept', concept.id);
      const sliders = await page.getByRole('slider').evaluateAll((inputs) => inputs.map((input) => ({ name: input.getAttribute('aria-label'), min: +input.min, max: +input.max })));
      await verifyModel(concept.diagramKind);
      for (const issue of await inspect(concept.diagramKind, 'default', true)) issues.push(`${width}/${concept.diagramKind}/default: ${issue}`);
      for (let combination = 0; combination < 2 ** sliders.length; combination++) {
        for (let index = 0; index < sliders.length; index++) {
          const slider = sliders[index];
          await setSlider(slider.name, combination & (1 << index) ? slider.max : slider.min);
        }
        await verifyModel(concept.diagramKind);
        for (const issue of await inspect(concept.diagramKind, `corner-${combination}`, combination === 0 || combination === 2 ** sliders.length - 1)) issues.push(`${width}/${concept.diagramKind}/${combination}: ${issue}`);
      }
    }
  }
  assert.deepEqual(issues, []);
});

test('all seven games: every round, min/max controls, logic gates and score states', { timeout: 240000 }, async () => {
  const issues = [];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const game of games) {
      await open('game', game.id);
      for (let round = 0; round < 3; round++) {
        const sliders = await page.getByRole('slider').evaluateAll((inputs) => inputs.map((input) => ({ name: input.getAttribute('aria-label'), min: +input.min, max: +input.max })));
        const combinations = game.id === 'logic-lock' ? 6 : 2 ** sliders.length;
        for (let combination = 0; combination < combinations; combination++) {
          for (let index = 0; index < sliders.length; index++) {
            const slider = sliders[index];
            await setSlider(slider.name, combination & (1 << index) ? slider.max : slider.min);
          }
          if (game.id === 'logic-lock') await page.locator('.logicGateRack > div button').nth(combination).click();
          await page.locator('.atlasCheckButton').click();
          for (const issue of await inspect(game.id, `round-${round}-corner-${combination}`, combination === combinations - 1)) issues.push(`${width}/${game.id}/${round}/${combination}: ${issue}`);
        }
        await page.getByRole('button', { name: 'Next challenge', exact: true }).click();
      }
    }
  }
  assert.deepEqual(issues, []);
});

test('boundary states: timing violation, PID offset, no-trip relay, uncertainty correction and off-screen tau', async () => {
  await open('concept', 'digital-timing');
  await setSlider('Clock frequency', 10);
  await setSlider('Propagation delay', 120);
  assert.match(await page.locator('.atlasReadoutStrip').innerText(), /-70 ns/);
  assert.equal(await page.locator('.atlasDigitalOutput').getAttribute('transform'), null);

  await open('concept', 'pid-control');
  await setSlider('Proportional Kp', 2);
  await setSlider('Integral Ki', 0);
  await setSlider('Derivative Kd', 0);
  assert.match(await page.locator('.atlasReadoutStrip').innerText(), /33\.3%/);
  const response = await page.locator('.atlasControlResponse').getAttribute('d');
  const lastY = Number(response.split(' ').at(-1));
  const targetY = Number((await page.locator('.atlasSetpoint').getAttribute('d')).split(' ')[1].split('H')[0]);
  assert.ok(lastY > targetY + 40);

  await open('game', 'relay-coordination');
  await page.locator('.atlasCheckButton').click();
  await page.getByRole('button', { name: 'Next challenge', exact: true }).click();
  await setSlider('Pickup current', 5000);
  await page.locator('.atlasCheckButton').click();
  assert.match(await page.locator('.atlasGameWorkspace').innerText(), /NO PICKUP · NO COORDINATION MARGIN/);
  assert.match(await page.locator('.atlasScorePanel').innerText(), /0%/);

  await open('concept', 'uncertainty-calibration');
  await setSlider('Calibration correction', -0.8);
  assert.match(await page.locator('.atlasReadoutStrip').innerText(), /10 V/);
  assert.ok(Math.abs(Number((await page.locator('.atlasMeanMarker').getAttribute('d')).match(/M([\d.]+)/)[1]) - 310) < 1e-6);

  await open('game', 'transient-trace');
  await setSlider('Resistance', 100);
  await setSlider('Capacitance', 100);
  assert.equal(await page.locator('.atlasTransientPlayerMarker').count(), 0);
  assert.match(await page.locator('.atlasGameWorkspace').innerText(), /> WINDOW/);
  await setSlider('Resistance', 1);
  await setSlider('Capacitance', 1);
  assert.equal(await page.locator('.atlasTransientPlayerMarker').count(), 1);
  const trace = await page.locator('.atlasTransientPlayer').getAttribute('d');
  assert.match(trace, /L70\.56 135\.18/);
  assert.deepEqual(errors, []);
});

test('every game round has a verified solution, and failed engineering constraints never pass', { timeout: 90000 }, async () => {
  const solutions = {
    'wave-match': [
      { Amplitude: 7, Frequency: 3, Phase: 45 },
      { Amplitude: 4, Frequency: 5, Phase: -60 },
      { Amplitude: 9, Frequency: 2, Phase: 120 },
    ],
    'power-target': [6, 4, 8].map(resistance => ({ 'Source voltage': 12, 'Load resistance': resistance })),
    'transient-trace': [{ Resistance: 10, Capacitance: 22 }, { Resistance: 10, Capacitance: 47 }, { Resistance: 20, Capacitance: 50 }],
    'alias-escape': [16, 23, 34].map(rate => ({ 'Sample rate': rate })),
    'pid-tune': [[4, 4], [2, 3], [8, 4]].map(([p, i]) => ({ 'Proportional Kp': p, 'Integral Ki': i, 'Derivative Kd': 0 })),
    'relay-coordination': [1000, 750, 1250].map(pickup => ({ 'Pickup current': pickup, 'Time multiplier': 0.1 })),
  };
  const score = async () => Number((await page.locator('.atlasScorePanel strong').innerText()).replace('%', ''));
  for (const [game, rounds] of Object.entries(solutions)) {
    await open('game', game);
    for (const round of rounds) {
      for (const [name, value] of Object.entries(round)) await setSlider(name, value);
      await page.locator('.atlasCheckButton').click();
      assert.ok(await score() >= (game === 'alias-escape' ? 99 : 100), `${game} did not accept ${JSON.stringify(round)}`);
      await page.getByRole('button', { name: 'Next challenge', exact: true }).click();
    }
  }
  await open('game', 'logic-lock');
  for (const gate of ['XOR', 'NAND', 'XNOR']) {
    await page.locator('.logicGateRack > div button').filter({ hasText: new RegExp(`^${gate}`) }).click();
    await page.locator('.atlasCheckButton').click();
    assert.equal(await score(), 100);
    await page.getByRole('button', { name: 'Next challenge', exact: true }).click();
  }

  await open('game', 'wave-match');
  await setSlider('Amplitude', 7);
  await setSlider('Frequency', 4);
  await setSlider('Phase', 45);
  await page.locator('.atlasCheckButton').click();
  assert.ok(await score() < 80, 'wrong frequency must not pass');

  await open('game', 'transient-trace');
  await setSlider('Resistance', 5);
  await setSlider('Capacitance', 44);
  await page.locator('.atlasCheckButton').click();
  assert.ok(await score() < 80, 'exact tau with excessive inrush must not pass');

  await open('game', 'pid-tune');
  await setSlider('Proportional Kp', 8);
  await setSlider('Integral Ki', 0);
  await setSlider('Derivative Kd', 0);
  await page.locator('.atlasCheckButton').click();
  assert.ok(await score() < 80, 'steady offset must not pass');

  await open('game', 'relay-coordination');
  await setSlider('Pickup current', 750);
  await setSlider('Time multiplier', 0.1);
  await page.locator('.atlasCheckButton').click();
  assert.ok(await score() < 80, 'inadequate load margin must not pass');

  await open('concept', 'sampling-aliasing');
  await setSlider('Signal frequency', 7);
  await setSlider('Sample rate', 14);
  const ordinates = await page.locator('.atlasSampleDot').evaluateAll(elements => elements.map(element => +element.getAttribute('cy')));
  ordinates.forEach(y => assert.ok(Math.abs(y - 115) < 1e-9));
  assert.match(await page.locator('.atlasReadoutStrip').innerText(), /At limit/);
  await open('concept', 'electric-magnetic-fields');
  await setSlider('Charge A', 0);
  assert.equal(await page.locator('.atlasFieldLine').count(), 0);
  await open('concept', 'mosfet-switching');
  await setSlider('Gate voltage', 3);
  assert.match(await page.locator('.atlasStage').innerText(), /BELOW THRESHOLD/);
  await setSlider('Gate voltage', 3.5);
  assert.match(await page.locator('.atlasStage').innerText(), /CHANNEL ON/);
  assert.deepEqual(errors, []);
});
