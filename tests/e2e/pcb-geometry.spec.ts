import { expect, test, type Page } from '@playwright/test';
import { FOOTPRINT_GEOMETRY, PAD_RADIUS, UNITS_PER_MM, getPadPosition, traceLengthMm, tracePath } from '../../src/pcbGeometry';
import type { FootprintKind, PcbBoardSnapshot } from '../../src/pcbStorage';

async function openBoard(page: Page, board?: PcbBoardSnapshot) {
  if (board) await page.addInitScript((draft) => localStorage.setItem('zyloxp-pcb-draft-v1', JSON.stringify(draft)), board);
  await page.goto('/#/labs/pcb');
  const start = page.getByRole('button', { name: 'Start learning', exact: true });
  if (await start.isVisible()) await start.click();
  await expect(page.locator('.pcbBoardCanvas')).toBeVisible();
  const dismiss = page.getByRole('button', { name: 'Dismiss notification', exact: true });
  if (await dismiss.isVisible()) await dismiss.click();
}

async function setup(page: Page) {
  const toggle = page.getByRole('button', { name: 'Board setup', exact: true });
  if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
}

async function assertContained(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('.pcbBoardCanvas').evaluate((svg) => /(?:NaN|Infinity)/.test(svg.outerHTML))).toBe(false);
}

test('PCB board, grid, trace width and reported length share one physical scale', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openBoard(page);
  await expect(page.locator('.pcbMetricBand')).toContainText('160 x 96 mm');
  await expect(page.locator('.pcbModelScope')).toContainText('not fabrication-ready');
  await expect(page.locator('.pcbCopperZone, .pcbMountingHole')).toHaveCount(0);
  await expect(page.locator('.pcbDraftStatus')).toContainText('Draft saved');
  const draft: PcbBoardSnapshot = await page.evaluate(() => JSON.parse(localStorage.getItem('zyloxp-pcb-draft-v1')!));
  expect(draft.components).toHaveLength(8);
  const pattern = page.locator('#pcb-grid');
  expect(Number(await pattern.getAttribute('width'))).toBe(2.5 * UNITS_PER_MM);
  expect(await pattern.getAttribute('width')).toBe(await pattern.getAttribute('height'));
  const rect = await page.locator('.pcbBoardSurface').boundingBox();
  expect(rect!.width / rect!.height).toBeCloseTo(160 / 96, 5);
  for (const trace of draft.traces) {
    const path = page.getByRole('button', { name: `${trace.net} route on ${trace.layer} copper`, exact: true });
    const visual = page.locator(`.pcbTraceLayer.${trace.layer} .pcbTraceVisual`);
    const matching = await visual.evaluateAll((elements, expectedPath) => elements.filter((element) => element.getAttribute('d') === expectedPath).map((element) => ({
      width: getComputedStyle(element).strokeWidth, dash: getComputedStyle(element).strokeDasharray,
    })), tracePath(trace, draft.components));
    expect(matching).toHaveLength(1);
    expect(parseFloat(matching[0].width)).toBeCloseTo(trace.width * UNITS_PER_MM, 6);
    expect(matching[0].dash).toBe('none');
    expect(await path.count()).toBeGreaterThan(0);
  }
  await page.getByRole('button', { name: 'VBUS route on top copper', exact: true }).press('Enter');
  await expect(page.locator('.pcbComponentDetails')).toContainText(`${traceLengthMm(draft.traces[0], draft.components).toFixed(1)} mm`);
  await page.locator('.pcbTraceProperties select').last().selectOption('1.2');
  expect(await page.locator('.pcbTrace.selected .pcbTraceVisual').evaluate((element) => parseFloat(getComputedStyle(element).strokeWidth))).toBe(1.2 * UNITS_PER_MM);
  await assertContained(page);
  expect(errors).toEqual([]);
  await page.getByRole('heading', { name: 'PCB Designer', exact: true }).click();
  await page.locator('.pcbDesignerPage').screenshot({ path: testInfo.outputPath('pcb-scale.png') });
});

test('PCB every package rotates with upright labels and attached trace endpoints', async ({ page }, testInfo) => {
  const kinds = Object.keys(FOOTPRINT_GEOMETRY) as FootprintKind[];
  const board: PcbBoardSnapshot = { id: 'rotations', name: 'Rotation audit', savedAt: 1,
    components: kinds.map((kind, i) => ({ id: kind, kind, reference: `X${i + 1}`, rotation: 0, x: 120 + i % 4 * 210, y: i < 4 ? 160 : 380 })),
    traces: [],
  };
  board.traces = board.components.slice(1).map((component, i) => ({ id: `t${i}`, net: `N${i}`, width: 0.33, layer: i % 2 ? 'top' : 'bottom', start: { componentId: board.components[0].id, padIndex: 0 }, end: { componentId: component.id, padIndex: 0 } }));
  await openBoard(page, board);
  for (const component of board.components) {
    const footprint = page.locator('.pcbFootprint').filter({ has: page.locator('.pcbReference', { hasText: component.reference }) });
    await footprint.press('Enter');
    for (const rotation of [0, 90, 180, 270] as const) {
      component.rotation = rotation;
      await expect(page.locator('.pcbComponentDetails')).toContainText(`${rotation} deg CW`);
      const pads = footprint.locator('.pcbPad');
      for (let i = 0; i < FOOTPRINT_GEOMETRY[component.kind].pads.length; i++) {
        const expected = getPadPosition(component, i)!;
        await expect(pads.nth(i)).toHaveAttribute('transform', `translate(${expected.x - component.x} ${expected.y - component.y})`);
        const matrix = await pads.nth(i).locator('text').evaluate((element: SVGGraphicsElement) => {
          const m = element.getCTM()!;
          return { a: m.a, b: m.b, c: m.c, d: m.d };
        });
        expect(matrix.b).toBe(0);
        expect(matrix.c).toBe(0);
        expect(matrix.a).toBeGreaterThan(0);
        expect(matrix.d).toBeGreaterThan(0);
        await expect(pads.nth(i).locator('.pcbPadRing')).toHaveAttribute('r', String(PAD_RADIUS));
      }
      for (const trace of board.traces) {
        const expected = tracePath(trace, board.components);
        expect(await page.locator('.pcbTraceVisual').evaluateAll((elements, path) => elements.some((element) => element.getAttribute('d') === path), expected)).toBe(true);
      }
      const overlaps = await footprint.evaluate((element) => {
        const labels = Array.from(element.querySelectorAll('text.pcbReference, .pcbPad text')).map((label) => label.getBoundingClientRect());
        return labels.some((a, i) => labels.slice(i + 1).some((b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.1));
      });
      expect(overlaps, `${component.kind} labels at ${rotation}`).toBe(false);
      if (rotation !== 270) await page.getByRole('button', { name: 'Rotate', exact: true }).click();
    }
  }
  await assertContained(page);
  await page.locator('.pcbStage').screenshot({ path: testInfo.outputPath('pcb-all-rotations.png') });
});

test('PCB active layer is on top, hidden copper is unfocusable and layer choice never mirrors pads', async ({ page }, testInfo) => {
  await openBoard(page);
  await setup(page);
  const before = await page.locator('.pcbPad').evaluateAll((pads) => pads.map((pad) => pad.getAttribute('transform')));
  await page.getByRole('button', { name: 'Bottom', exact: true }).click();
  await expect(page.locator('.pcbTraceLayer').last()).toHaveClass('pcbTraceLayer bottom');
  expect(await page.locator('.pcbPad').evaluateAll((pads) => pads.map((pad) => pad.getAttribute('transform')))).toEqual(before);
  await page.getByRole('button', { name: 'Hide inactive copper layer', exact: true }).click();
  for (const trace of await page.locator('.pcbTraceLayer.top .pcbTraceHit').all()) {
    await expect(trace).toHaveAttribute('tabindex', '-1');
    await expect(trace).toBeHidden();
  }
  await expect(page.locator('.pcbTraceLayer.bottom .pcbTraceHit')).toBeVisible();
  await page.getByRole('button', { name: 'Show inactive copper layer', exact: true }).click();
  await page.getByRole('button', { name: 'Route', exact: true }).click();
  await page.getByRole('button', { name: 'J1 pad GND', exact: true }).press('Enter');
  await expect(page.locator('.pcbRoutePreview')).toHaveClass('pcbRoutePreview bottom');
  expect(await page.locator('.pcbRoutePreview').evaluate((element) => parseFloat(getComputedStyle(element).strokeWidth))).toBe(0.5 * UNITS_PER_MM);
  await page.getByRole('button', { name: 'U1 pad GND', exact: true }).press('Enter');
  await expect(page.getByRole('button', { name: 'GND route on bottom copper', exact: true })).toBeVisible();
  await expect(page.locator('.pcbMetricBand')).toContainText('7/8 joined');
  await assertContained(page);
  await page.locator('.pcbStage').screenshot({ path: testInfo.outputPath('pcb-bottom-layer.png') });
});

test('PCB grid snapping and pointer conversion agree at zoom, and narrow/wide layouts remain contained', async ({ page }, testInfo) => {
  await openBoard(page);
  await setup(page);
  await page.getByRole('combobox', { name: 'Placement grid size', exact: true }).selectOption('5');
  await page.getByRole('button', { name: 'New board', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.locator('.pcbBoardCanvas').scrollIntoViewIfNeeded();
  const point = await page.locator('.pcbBoardCanvas').evaluate((svg: SVGSVGElement) => {
    const point = svg.createSVGPoint();
    point.x = 190; point.y = 190;
    const client = point.matrixTransform(svg.getScreenCTM()!);
    return { x: client.x, y: client.y };
  });
  await page.mouse.click(point.x, point.y);
  await expect(page.locator('.pcbFootprint')).toHaveCount(1);
  await expect(page.locator('.pcbFootprint')).toHaveAttribute('transform', 'translate(196.875 196.875)');
  await page.getByRole('button', { name: 'Fit board to view', exact: true }).click();
  for (const width of [320, 768, 2560]) {
    await page.setViewportSize({ width, height: 1000 });
    await assertContained(page);
    await page.locator('.pcbDesignerPage').screenshot({ path: testInfo.outputPath(`pcb-viewport-${width}.png`) });
  }
});

test('PCB rotation at the edge stays inside the courtyard margin and is undoable', async ({ page }, testInfo) => {
  const board: PcbBoardSnapshot = { id: 'edge', name: 'Edge rotation', savedAt: 1, traces: [], components: [
    { id: 'mcu', reference: 'U12345678901', kind: 'mcu', rotation: 0, x: 150, y: 92 },
  ] };
  await openBoard(page, board);
  expect(await page.locator('.pcbFootprint').evaluate((element) => getComputedStyle(element).transitionProperty)).toBe('none');
  expect(await page.locator('.pcbReference').evaluate((element) => getComputedStyle(element).transitionProperty)).toBe('none');
  await page.getByRole('button', { name: 'Rotate', exact: true }).click();
  await expect(page.locator('.pcbComponentDetails')).toContainText('90 deg CW');
  await expect(page.locator('.pcbDrcCounts')).toContainText('0 errors');
  const text = await page.locator('.pcbReference').evaluate((element: SVGGraphicsElement) => element.getBBox().width);
  const courtyard = await page.locator('.pcbCourtyard').evaluate((element: SVGGraphicsElement) => element.getBBox().height);
  expect(text).toBeLessThanOrEqual(courtyard + 0.01);
  const geometry = await page.locator('.pcbBoardCanvas').evaluate((element) => {
    const footprint = element.querySelector<SVGGraphicsElement>('.pcbFootprint')!;
    const reference = element.querySelector('.pcbReference')!.getBoundingClientRect();
    const board = element.querySelector('.pcbBoardSurface')!.getBoundingClientRect();
    const transform = footprint.transform.baseVal.consolidate()!.matrix;
    const computedTransform = new DOMMatrixReadOnly(getComputedStyle(footprint).transform);
    return { referenceTop: reference.top, boardTop: board.top, modelY: transform.f, renderedY: computedTransform.f };
  });
  expect(geometry.modelY).toBe(105);
  expect(geometry.renderedY).toBe(geometry.modelY);
  expect(geometry.referenceTop).toBeGreaterThanOrEqual(geometry.boardTop);
  await page.locator('.pcbStage').screenshot({ path: testInfo.outputPath('pcb-edge-rotation.png') });
  await page.getByRole('button', { name: 'Undo board edit', exact: true }).click();
  await expect(page.locator('.pcbComponentDetails')).toContainText('0 deg CW');
  await assertContained(page);
});

test('PCB routing inherits endpoint nets, rejects incompatible nets and permits a second copper layer', async ({ page }) => {
  await openBoard(page);
  await page.getByRole('button', { name: 'Route', exact: true }).click();
  await page.getByRole('button', { name: 'U1 pad OUT', exact: true }).press('Enter');
  await page.getByRole('button', { name: 'D1 pad A', exact: true }).press('Enter');
  await expect(page.locator('.pcbStageStatus')).toContainText('Route blocked');
  await expect(page.locator('.pcbTrace')).toHaveCount(6);
  await page.getByRole('button', { name: 'U1 pad OUT', exact: true }).press('Enter');
  await page.getByRole('button', { name: 'C2 pad 1', exact: true }).press('Enter');
  await expect(page.locator('.pcbTrace')).toHaveCount(7);
  await expect(page.locator('.pcbComponentDetails')).toContainText('3V3');
  await setup(page);
  await page.getByRole('button', { name: 'Bottom', exact: true }).click();
  await page.getByRole('button', { name: 'U1 pad OUT', exact: true }).press('Enter');
  await page.getByRole('button', { name: 'U2 pad 1', exact: true }).press('Enter');
  await expect(page.locator('.pcbTrace')).toHaveCount(8);
  await expect(page.locator('.pcbDrcPanel')).not.toContainText('Duplicate copper route');
});

test('PCB imported non-menu widths remain visible and same-layer copper contact is reported', async ({ page }, testInfo) => {
  const board: PcbBoardSnapshot = { id: 'crossing', name: 'Copper contact audit', savedAt: 1, components: [
    { id: 'a', reference: 'A', kind: 'capacitor', rotation: 0, x: 125, y: 200 },
    { id: 'b', reference: 'B', kind: 'capacitor', rotation: 0, x: 525, y: 200 },
    { id: 'c', reference: 'C', kind: 'capacitor', rotation: 0, x: 325, y: 75 },
    { id: 'd', reference: 'D', kind: 'capacitor', rotation: 0, x: 325, y: 400 },
  ], traces: [
    { id: 'x', net: 'X', layer: 'top', width: 0.33, start: { componentId: 'a', padIndex: 0 }, end: { componentId: 'b', padIndex: 0 } },
    { id: 'y', net: 'Y', layer: 'top', width: 0.33, start: { componentId: 'c', padIndex: 0 }, end: { componentId: 'd', padIndex: 0 } },
  ] };
  await openBoard(page, board);
  await expect(page.locator('.pcbDrcPanel')).toContainText('Copper nets touch');
  await page.getByRole('button', { name: 'Y route on top copper', exact: true }).press('Enter');
  await expect(page.locator('.pcbTraceProperties select').last()).toHaveValue('0.33');
  await page.locator('.pcbTraceProperties select').first().selectOption('bottom');
  await expect(page.locator('.pcbDrcPanel')).not.toContainText('Copper nets touch');
  await assertContained(page);
  await page.locator('.pcbDesignerPage').screenshot({ path: testInfo.outputPath('pcb-cross-layer-contact.png') });
});
