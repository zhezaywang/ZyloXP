import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

async function enterLab(page: Page, labId = 'lab-ohms', empty = false) {
  await page.addInitScript(({ labId, empty }) => {
    const values = { voltage: 9, resistance: 10, pidDerivativeGain: 0.125 };
    localStorage.setItem('zyloxp-saved-lab-v1', JSON.stringify({ activeLabId: labId, values }));
    localStorage.setItem('zyloxp-learner-state-v1', JSON.stringify({
      labRunHistory: empty ? [] : [
        { id: 'recent', labId, savedAt: Date.now() - 1000, values: { ...values, voltage: 8.25, pidDerivativeGain: 0.12 } },
        { id: 'older', labId, savedAt: Date.now() - 86400000, values: { ...values, voltage: 5, pidDerivativeGain: 0.1 } },
      ],
    }));
  }, { labId, empty });
  await page.goto(`/#/labs/${labId}`);
  await page.getByRole('button', { name: 'Start learning', exact: true }).click();
  await expect(page.locator('.labVisualStage')).toBeVisible();
  await page.getByRole('button', { name: /^Bench Log/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Bench Log' });
  await expect(dialog).toBeVisible();
  return dialog;
}

test('compare any two setups, reverse direction, filter and export without altering the live experiment', async ({ page }, info) => {
  const dialog = await enterLab(page);
  const savedBefore = await page.evaluate(() => localStorage.getItem('zyloxp-saved-lab-v1'));
  const comparison = dialog.getByRole('region', { name: 'Compare setups' });
  const table = comparison.getByRole('table', { name: 'Lab setup differences' });
  await expect(comparison).toContainText('1 of 2 settings changed');
  await expect(table.getByRole('row', { name: /^Voltage/ })).toContainText('+0.75 V');
  await comparison.getByRole('combobox', { name: 'Baseline', exact: true }).selectOption('saved:older');
  await comparison.getByRole('combobox', { name: 'Compare with', exact: true }).selectOption('saved:recent');
  await expect(table.getByRole('row', { name: /^Voltage/ })).toContainText('+3.25 V');
  await comparison.getByRole('checkbox', { name: 'Changes only' }).check();
  await expect(table.locator('tbody tr')).toHaveCount(1);
  const downloadEvent = page.waitForEvent('download');
  await comparison.getByRole('button', { name: 'Download comparison CSV' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('zyloxp-lab-ohms-comparison.csv');
  const csv = await readFile((await download.path())!, 'utf8');
  expect(csv).toContain('"Voltage","V",5,8.25,3.25');
  expect(csv).toContain('"Resistance","Ω",10,10,0');
  await comparison.getByRole('button', { name: 'Swap baseline and comparison' }).click();
  await expect(table.getByRole('row', { name: /^Voltage/ })).toContainText('−3.25 V');
  expect(await page.evaluate(() => localStorage.getItem('zyloxp-saved-lab-v1'))).toBe(savedBefore);
  await comparison.getByRole('checkbox', { name: 'Changes only' }).uncheck();
  await page.evaluate(async () => { await document.fonts.ready; });
  await dialog.screenshot({ path: info.outputPath('lab-comparison.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Bench Log/ })).toBeFocused();
});

test('identical setups and deleted selections have honest empty states', async ({ page }) => {
  const dialog = await enterLab(page);
  const comparison = dialog.getByRole('region', { name: 'Compare setups' });
  await comparison.getByRole('combobox', { name: 'Compare with', exact: true }).selectOption('saved:recent');
  await comparison.getByRole('checkbox', { name: 'Changes only' }).check();
  await expect(comparison).toContainText('0 of 2 settings changed');
  await expect(comparison.getByText('No settings changed.', { exact: true })).toBeVisible();
  await expect(comparison.getByRole('button', { name: 'Swap baseline and comparison' })).toBeDisabled();
  await dialog.locator('.labBenchRun').first().getByRole('button', { name: /Delete run/ }).click();
  await expect(comparison.getByRole('combobox', { name: 'Baseline', exact: true })).toHaveValue('live');
  await expect(comparison.getByRole('combobox', { name: 'Compare with', exact: true })).toHaveValue('live');
  await expect(comparison.locator('.labComparisonOutputs')).toContainText('0.90 A');
  await dialog.locator('.labBenchRun').first().getByRole('button', { name: /Delete run/ }).click();
  await expect(comparison).toHaveCount(0);
  await expect(dialog.getByText('No saved runs', { exact: true })).toBeVisible();
});

test('first saved run enables comparisons and export failures can be retried', async ({ page }) => {
  const dialog = await enterLab(page, 'lab-ohms', true);
  await expect(dialog.getByRole('region', { name: 'Compare setups' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Save Lab', exact: true }).click();
  await page.getByRole('button', { name: /^Bench Log/ }).click();
  const comparison = dialog.getByRole('region', { name: 'Compare setups' });
  await expect(comparison).toContainText('0 of 2 settings changed');
  await page.evaluate(() => {
    const original = URL.createObjectURL;
    let fail = true;
    URL.createObjectURL = (blob) => {
      if (fail) { fail = false; throw new Error('Download unavailable'); }
      return original(blob);
    };
  });
  await comparison.getByRole('button', { name: 'Download comparison CSV' }).click();
  await expect(comparison.getByRole('alert')).toContainText('could not be downloaded');
  const download = page.waitForEvent('download');
  await comparison.getByRole('button', { name: 'Download comparison CSV' }).click();
  await download;
  await expect(comparison.getByRole('alert')).toHaveCount(0);
});

test('long comparisons keep one scroll area, readable cells and a reachable close control', async ({ page }, info) => {
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 320 : 1024, height: 600 });
  const dialog = await enterLab(page, 'lab-transformer');
  await page.addStyleTag({ content: 'html { font-size: 150% !important; }' });
  await expect(dialog.locator('.labComparisonTable tbody tr')).toHaveCount(7);
  await dialog.locator('.labBenchRun').last().getByRole('button', { name: 'Restore', exact: true }).scrollIntoViewIfNeeded();
  await expect(dialog.getByRole('button', { name: 'Close bench log' })).toBeInViewport();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await dialog.locator('.labBenchBody').evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await dialog.locator('.labComparisonTable').scrollIntoViewIfNeeded();
  const overlaps = await dialog.locator('.labComparisonTable tr').evaluateAll((rows) => rows.some((row) => {
    const cells = Array.from(row.children).map((cell) => cell.getBoundingClientRect()).filter((rect) => rect.width > 1);
    return cells.some((a, i) => cells.slice(i + 1).some((b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
      && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1));
  }));
  expect(overlaps).toBe(false);
  await dialog.screenshot({ path: info.outputPath('narrow-bench-comparison.png') });
  await dialog.getByRole('button', { name: 'Close bench log' }).click();
  await expect(dialog).toHaveCount(0);
});
