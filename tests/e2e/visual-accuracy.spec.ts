import { expect, test, type Page } from '@playwright/test';

async function openConcept(page: Page, id: string) {
  await page.goto(`/#/atlas/concept/${id}`);
  const start = page.getByRole('button', { name: 'Start learning', exact: true });
  if (await start.isVisible()) await start.click();
  await expect(page.locator('.atlasControlPanel')).toBeVisible();
}

async function setSlider(page: Page, name: string, value: number) {
  await page.getByRole('slider', { name, exact: true }).fill(String(value));
}

async function expectContained(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.locator('svg').evaluateAll((elements) => elements.some((element) => /(?:NaN|Infinity)/.test(element.outerHTML)))).toBe(false);
}

test('phasor angles and amplitudes agree with their SVG origin at slider extremes', async ({ page }, testInfo) => {
  await openConcept(page, 'ac-phasors');
  await setSlider(page, 'Amplitude', 10);
  for (const phase of [-180, -90, 0, 90, 180]) {
    await setSlider(page, 'Phase angle', phase);
    const tip = page.locator('.atlasPhasorTip');
    await expect.poll(async () => Number(await tip.getAttribute('cx'))).toBeCloseTo(505 + 70 * Math.cos(phase * Math.PI / 180), 5);
    await expect.poll(async () => Number(await tip.getAttribute('cy'))).toBeCloseTo(105 - 70 * Math.sin(phase * Math.PI / 180), 5);
  }
  await expectContained(page);
  await page.locator('.atlasStage').screenshot({ path: testInfo.outputPath('phasor-maximum.png') });
});

test('Bode markers stay on the plotted curve at maximum attenuation', async ({ page }, testInfo) => {
  await openConcept(page, 'filters-bode');
  await setSlider(page, 'Cutoff frequency', 100);
  await setSlider(page, 'Signal frequency', 20000);
  const gain = 1 / Math.sqrt(1 + 200 ** 2);
  const expectedY = 55 + Math.abs(20 * Math.log10(gain)) * 2.7;
  await expect.poll(async () => Number(await page.locator('.atlasPhasorTip').getAttribute('cy'))).toBeCloseTo(expectedY, 5);
  expect(Number(await page.locator('.atlasPhasorTip').getAttribute('cy'))).toBeLessThan(190);
  await expectContained(page);
  await page.locator('.atlasStage').screenshot({ path: testInfo.outputPath('bode-maximum-attenuation.png') });
});

test('charge forces reverse for like charges and disappear at zero charge', async ({ page }, testInfo) => {
  await openConcept(page, 'electric-magnetic-fields');
  const arrows = page.locator('.atlasFieldLine');
  await expect(arrows).toHaveCount(2);
  await expect(arrows.first()).toHaveAttribute('d', 'M210 125H285');
  await setSlider(page, 'Charge B', 2);
  await expect(arrows.first()).toHaveAttribute('d', 'M100 125H25');
  await setSlider(page, 'Charge A', 0);
  await expect(arrows).toHaveCount(0);
  await expect(page.locator('.atlasStage')).toContainText('No force');
  await expectContained(page);
  await page.locator('.atlasStage').screenshot({ path: testInfo.outputPath('neutral-charge.png') });
});

test('RC lab and its reference load without clipping on desktop and mobile', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/labs/lab-rc');
  await page.getByRole('button', { name: 'Start learning', exact: true }).click();
  const visual = page.locator('.labVisualStage');
  await expect(visual).toBeVisible();
  await expect(visual.locator('.labChargeTrace')).toHaveAttribute('d', /^M30\.000 164\.000/);
  await expectContained(page);
  await visual.screenshot({ path: testInfo.outputPath('rc-lab.png') });
  await visual.getByRole('button', { name: 'Reference', exact: true }).click();
  await expect(visual.getByText('Reference schematic', { exact: true })).toBeVisible();
  await expect.poll(() => visual.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expectContained(page);
  expect(errors).toEqual([]);
});

test('control response stays within the plot for high overshoot and critical damping', async ({ page }, testInfo) => {
  await openConcept(page, 'feedback-stability');
  await setSlider(page, 'Command level', 1.4);
  await setSlider(page, 'Damping ratio ζ', 0.1);
  const chart = page.locator('.atlasControlResponse');
  const bounds = await chart.evaluate((element: SVGGraphicsElement) => {
    const bounds = element.getBBox();
    return { y: bounds.y, bottom: bounds.y + bounds.height };
  });
  expect(bounds.y).toBeGreaterThanOrEqual(44.9);
  expect(bounds.bottom).toBeLessThanOrEqual(190.1);
  await setSlider(page, 'Damping ratio ζ', 1);
  await expectContained(page);
  await page.locator('.atlasStage').screenshot({ path: testInfo.outputPath('critical-damping.png') });
});

test('sample points follow the acquisition clock in both the explorer and game', async ({ page }, testInfo) => {
  await openConcept(page, 'sampling-aliasing');
  const samples = page.locator('.atlasSampleDot');
  await expect(samples).toHaveCount(7);
  await expect.poll(async () => Number(await samples.nth(1).getAttribute('cx'))).toBeCloseTo(35 + 520 / (20 * 0.34), 5);
  await setSlider(page, 'Sample rate', 14);
  await expect(page.locator('.atlasStage')).toContainText('At limit');
  await expect(samples).toHaveCount(5);
  for (const sample of await samples.all()) {
    expect(Number(await sample.getAttribute('cy'))).toBeCloseTo(115, 5);
  }
  await setSlider(page, 'Sample rate', 60);
  await expect(samples).toHaveCount(21);
  await setSlider(page, 'Sample rate', 2);
  await expect(samples).toHaveCount(1);
  await expectContained(page);

  await page.goto('/#/atlas/game/alias-escape');
  await expect(samples).toHaveCount(4);
  await expect.poll(async () => Number(await samples.nth(1).getAttribute('cx'))).toBeCloseTo(45 + 660 / (16 * 0.23), 5);
  await setSlider(page, 'Sample rate', 12);
  await expect(page.locator('.aliasScope')).toContainText('AT NYQUIST LIMIT');
  await setSlider(page, 'Sample rate', 24);
  await expect(samples).toHaveCount(6);
  await expectContained(page);
  await page.locator('.aliasScope').screenshot({ path: testInfo.outputPath('sampling-clock.png') });
});
