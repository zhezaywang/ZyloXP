import { expect, test, type Page } from '@playwright/test';

const learnerKey = 'zyloxp-learner-state-v1';
async function enter(page: Page, route = '#/learn', storage: Record<string, unknown> = {}) {
  await page.addInitScript((entries) => {
    if (sessionStorage.getItem('refinement-seeded')) return;
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    sessionStorage.setItem('refinement-seeded', 'true');
  }, storage);
  await page.goto(`/${route}`);
  await page.getByRole('button', { name: 'Start learning', exact: true }).click();
  await expect(page.locator('.appShell')).toBeVisible();
}
async function toolkit(page: Page) {
  await enter(page);
  if (!await page.getByRole('button', { name: 'Open Engineering Toolkit', exact: true }).isVisible()) {
    await page.getByRole('button', { name: 'More', exact: true }).click();
    await page.getByRole('button', { name: 'Engineering Toolkit', exact: true }).click();
  } else await page.getByRole('button', { name: 'Open Engineering Toolkit', exact: true }).click();
  return page.locator('.engineeringToolkit');
}
async function contained(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test('C01 C04: blank conversions stay invalid and swapping preserves the quantity', async ({ page }, info) => {
  const tool = await toolkit(page);
  await tool.getByRole('button', { name: 'Units', exact: true }).click();
  const input = tool.getByRole('spinbutton', { name: 'Value', exact: true });
  await expect(tool.locator('output')).toContainText('12,000 mV');
  await tool.getByRole('button', { name: 'Swap conversion units' }).click();
  await expect(input).toHaveValue('12000');
  await expect(tool.locator('output')).toContainText('12 V');
  await tool.getByRole('button', { name: 'Swap conversion units' }).click();
  await expect(input).toHaveValue('12');
  await input.fill('');
  await expect(tool.locator('output')).toHaveClass(/invalid/);
  await expect(tool.getByRole('button', { name: 'Swap conversion units' })).toBeDisabled();
  await input.fill('-3.25');
  await expect(tool.locator('output')).toContainText('-3,250 mV');
  await contained(page);
  await tool.screenshot({ path: info.outputPath('toolkit-conversion.png') });
});

test('C02: every calculator rejects overflow without showing invalid results as ready', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const tool = await toolkit(page);
  await tool.locator('.toolkitSolveFor').getByRole('button', { name: /Voltage/ }).click();
  await tool.getByRole('spinbutton').nth(0).fill('1e308');
  await tool.getByRole('spinbutton').nth(1).fill('1e308');
  await expect(tool.locator('output')).toHaveClass(/invalid/);
  await tool.getByRole('button', { name: 'Power', exact: true }).click();
  await tool.getByRole('spinbutton').nth(0).fill('1e308');
  await tool.getByRole('spinbutton').nth(1).fill('1e308');
  await expect(tool.locator('output')).toHaveClass(/invalid/);
  await tool.getByRole('button', { name: 'AC', exact: true }).click();
  await tool.getByRole('spinbutton').first().fill('1e308');
  await expect(tool.locator('output')).toHaveClass(/invalid/);
  await tool.getByRole('button', { name: 'Units', exact: true }).click();
  await tool.getByRole('spinbutton').fill('1e308');
  await expect(tool.locator('output')).toHaveClass(/invalid/);
  await tool.getByRole('button', { name: 'Design', exact: true }).click();
  await tool.getByRole('spinbutton').first().fill('1e308');
  await expect(tool.getByRole('button', { name: 'Copy result', exact: true })).toBeDisabled();
  await tool.getByRole('button', { name: 'RC timing', exact: true }).click();
  await tool.getByRole('spinbutton').first().fill('1e308');
  await expect(tool.getByRole('button', { name: 'Copy result', exact: true })).toBeDisabled();
  await contained(page);
  expect(errors).toEqual([]);
});

test('C03: very large divider resistances retain a finite correct voltage', async ({ page }) => {
  const tool = await toolkit(page);
  await tool.getByRole('button', { name: 'Resistors', exact: true }).click();
  await tool.getByRole('button', { name: 'Voltage divider', exact: true }).click();
  for (const index of [1, 2, 3]) await tool.getByRole('spinbutton').nth(index).fill('1e308');
  await expect(tool.locator('output')).toHaveClass(/ready/);
  await expect(tool.locator('output strong')).toHaveText('4 V');
  await contained(page);
});

test('C05: clipboard denial is visible and a retry can succeed', async ({ page }) => {
  const tool = await toolkit(page);
  await tool.getByRole('button', { name: 'Design', exact: true }).click();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } }));
  await tool.getByRole('button', { name: 'Copy result', exact: true }).click();
  await expect(tool.getByRole('alert')).toContainText('Could not copy');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => undefined } }));
  await tool.getByRole('button', { name: 'Copy result', exact: true }).click();
  await expect(tool.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
  await expect(tool.getByRole('alert')).toHaveCount(0);
});

test('C06: edited calculations never claim an earlier clipboard request copied them', async ({ page }) => {
  const tool = await toolkit(page);
  await tool.getByRole('button', { name: 'Design', exact: true }).click();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => new Promise<void>((resolve) => { (window as any).finishCopy = resolve; }) } }));
  await tool.getByRole('button', { name: 'Copy result', exact: true }).click();
  await tool.getByRole('spinbutton').first().fill('9');
  await page.evaluate(() => (window as any).finishCopy());
  await expect(tool.getByRole('button', { name: 'Copy result', exact: true })).toBeVisible();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => undefined } }));
  await tool.getByRole('button', { name: 'Copy result', exact: true }).click();
  await expect(tool.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
  await tool.getByRole('spinbutton').first().fill('12');
  await expect(tool.getByRole('button', { name: 'Copy result', exact: true })).toBeVisible();
});

test('C07: zero elapsed time means zero energy, not invalid power', async ({ page }) => {
  const tool = await toolkit(page);
  await tool.getByRole('button', { name: 'Power', exact: true }).click();
  await tool.getByRole('spinbutton').nth(2).fill('0');
  await expect(tool.locator('output')).toHaveClass(/ready/);
  await expect(tool.locator('output')).toContainText('18 W');
  await expect(tool.locator('output')).toContainText('0 Wh');
  await tool.getByRole('spinbutton').nth(2).fill('-1');
  await expect(tool.locator('output')).toHaveClass(/invalid/);
});

test('C08 C10 C11: bench restore preserves other labs, displays fractions, traps and restores focus', async ({ page }, info) => {
  const saved = { id: 'old-run', labId: 'lab-ohms', savedAt: Date.now() - 1000, values: { voltage: 8.25, resistance: 10, pidSetpoint: 20 } };
  await enter(page, '#/labs/lab-ohms', {
    [learnerKey]: { labRunHistory: [saved] },
    'zyloxp-saved-lab-v1': { activeLabId: 'lab-ohms', values: { voltage: 9, resistance: 10, pidSetpoint: 80 } },
  });
  const launcher = page.getByRole('button', { name: /^Bench Log/ });
  await launcher.scrollIntoViewIfNeeded();
  const scrollBefore = await page.evaluate(() => scrollY);
  await launcher.click();
  const dialog = page.getByRole('dialog', { name: 'Bench Log' });
  await expect(dialog.getByRole('button', { name: 'Close bench log' })).toBeFocused();
  await expect(dialog).toContainText('8.25 V');
  await expect(dialog).toContainText('Voltage +0.75 V');
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await dialog.getByRole('button').last().focus();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button').first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button').last()).toBeFocused();
  await contained(page);
  await dialog.screenshot({ path: info.outputPath('bench-log.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(launcher).toBeFocused();
  expect(Math.abs(await page.evaluate(() => scrollY) - scrollBefore)).toBeLessThanOrEqual(2);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  await launcher.click();
  await dialog.getByRole('button', { name: 'Restore', exact: true }).click();
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('zyloxp-saved-lab-v1')!).values);
  expect(restored.voltage).toBe(8.25);
  expect(restored.pidSetpoint).toBe(80);
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('zyloxp-saved-lab-v1')!).values.pidSetpoint)).toBe(80);
  await page.evaluate(() => { location.hash = '#/labs/lab-pid'; });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: /^Bench Log/ }).click();
  await expect(page.getByRole('dialog', { name: 'Bench Log' })).toBeVisible();
  await page.keyboard.press('Escape');
});

test('C09: a full bench log protects the oldest run and recovers after delete and undo', async ({ page }) => {
  const runs = Array.from({ length: 8 }, (_, i) => ({ id: `run-${i}`, labId: 'lab-ohms', savedAt: Date.now() - i * 1000, values: { voltage: i + 1 } }));
  await enter(page, '#/labs/lab-ohms', { [learnerKey]: { labRunHistory: runs } });
  const save = page.getByRole('button', { name: 'Save Lab', exact: true });
  await expect(save).toBeDisabled();
  await expect(page.locator('.focusActionStack').getByRole('status')).toContainText('8 saved runs');
  await page.getByRole('button', { name: /^Bench Log/ }).click();
  await page.locator('.labBenchRun').first().getByRole('button', { name: /Delete/ }).click();
  await page.keyboard.press('Escape');
  await expect(save).toBeEnabled();
  await page.locator('.toast').getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(save).toBeDisabled();
  await page.reload();
  const ids = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).labRunHistory.map((run: { id: string }) => run.id), learnerKey);
  expect(ids.sort()).toEqual(runs.map((run) => run.id).sort());
});

test('C12: bench library filters combine and recover from no matches', async ({ page }, info) => {
  await enter(page, '#/notebook', {
    [learnerKey]: { labRunHistory: [{ id: 'a', labId: 'lab-ohms', savedAt: Date.now(), values: {} }, { id: 'b', labId: 'lab-opamp', savedAt: Date.now(), values: {} }] },
    'zyloxp-notebook-library-view-v1': 'bench',
  });
  const library = page.getByRole('region', { name: 'Bench runs', exact: true });
  await expect(library.locator('article')).toHaveCount(2);
  await library.getByRole('searchbox', { name: 'Search bench runs' }).fill('operational amplifier');
  await expect(library.locator('article')).toHaveCount(1);
  await library.getByRole('combobox', { name: 'Lab', exact: true }).selectOption('lab-ohms');
  await expect(library.getByText('No matching bench runs')).toBeVisible();
  await library.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(library.locator('article')).toHaveCount(2);
  await contained(page);
  await library.screenshot({ path: info.outputPath('bench-library.png') });
  await library.locator('article').first().getByRole('button', { name: /^Restore/ }).click();
  await expect(page).toHaveURL(/#\/labs\/lab-/);
});

test('C13 C14: saved-question filtering and prioritization stay usable on small screens', async ({ page }, info) => {
  await enter(page, '#/notebook', {
    [learnerKey]: { bookmarkedQuestionIds: ['EE-00001', 'EE-12501', 'EE-25001'] },
    'zyloxp-notebook-library-view-v1': 'questions',
  });
  const library = page.getByRole('region', { name: 'Saved questions', exact: true });
  await expect(library.locator('article')).toHaveCount(3);
  await library.getByRole('searchbox').fill('no-matching-text-9999');
  await expect(library.getByText('No matching saved questions')).toBeVisible();
  await library.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await library.getByRole('combobox', { name: 'Topic', exact: true }).selectOption({ index: 1 });
  await expect(library.locator('article')).toHaveCount(1);
  await library.getByRole('combobox', { name: 'Question order' }).selectOption('weakest');
  await library.getByRole('button', { name: 'Clear question filters' }).click();
  await expect(library.locator('article')).toHaveCount(3);
  await contained(page);
  await library.screenshot({ path: info.outputPath('saved-questions.png') });
});

test('C15 C16 C17: all recent entries are reachable and clear/undo keeps new visits', async ({ page }) => {
  const ids = ['lab-ohms', 'lab-rc', 'lab-filter', 'lab-pid', 'lab-adc', 'lab-bjt'];
  const recents = ids.map((id, i) => ({ id, kind: 'Lab', routeHash: `#/labs/${id}`, title: id, subtitle: 'Recent lab', viewedAt: Date.now() - 10000 - i * 1000 }));
  await enter(page, '#/learn', { 'zyloxp-recent-learning-v1': [...recents, recents[0], { ...recents[0], viewedAt: 1e100 }] });
  const region = page.getByRole('region', { name: 'Recent learning' });
  await expect(region.locator('.recentLearningItem')).toHaveCount(3);
  await region.getByRole('button', { name: 'Show all 6' }).click();
  await expect(region.locator('.recentLearningItem')).toHaveCount(6);
  await region.getByRole('button', { name: 'Show fewer' }).click();
  await region.getByRole('button', { name: 'Clear history' }).click();
  await page.evaluate(() => { location.hash = '#/labs/lab-transformer'; });
  await expect(page.locator('.labVisualStage')).toBeVisible();
  await page.locator('.toast').getByRole('button', { name: 'Undo', exact: true }).click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('zyloxp-recent-learning-v1')!));
  expect(stored).toHaveLength(6);
  expect(stored[0].routeHash).toBe('#/labs/lab-transformer');
  expect(stored.some((item: { title: string }) => item.title === 'lab-ohms')).toBe(true);
});

test('C19 C20: study-day limits are explicit and weekly charts expose exact daily values', async ({ page }, info) => {
  await enter(page, '#/learn/week');
  const picker = page.locator('.weeklyDayPicker');
  for (let i = 0; i < 2; i++) await picker.locator('button[aria-pressed="true"]').first().click();
  await expect(picker.locator('button:disabled')).toHaveCount(2);
  await expect(picker.getByRole('status')).toHaveText('Minimum reached: two study days.');
  await picker.locator('button[aria-pressed="false"]').first().click();
  await expect(picker.locator('button:disabled')).toHaveCount(0);
  await page.getByRole('button', { name: 'Create weekly plan', exact: true }).click();
  const chart = page.locator('.weeklyPlanChart');
  await expect(chart).toHaveAttribute('aria-label', /0 minutes.*planned study day/);
  await page.locator('.weeklyChartTabs').getByRole('button', { name: 'Questions', exact: true }).click();
  await expect(chart).toHaveAttribute('aria-label', /0 questions/);
  expect(await chart.locator('i').evaluateAll((bars) => bars.every((bar) => bar.getBoundingClientRect().height === 0))).toBe(true);
  await contained(page);
  await chart.screenshot({ path: info.outputPath('weekly-chart.png') });
});
