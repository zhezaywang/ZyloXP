import { expect, test, type Page } from '@playwright/test';

const key = 'zyloxp-question-scratchpads-v1';
const first = 'Given: V = 8 V, R = 8 ohm\nWorking: I = V / R\nCheck the units before substituting.';
const second = 'Convert from peak to RMS before combining phasors.';
const region = (page: Page) => page.getByRole('region', { name: 'Scratchpads', exact: true });
const row = (page: Page) => region(page).getByRole('article', { name: "Ohm's law scratchpad", exact: true });

async function enter(page: Page, saved: Record<string, string> = { 'EE-00001': first, 'EE-12501': second }, route = '#/notebook') {
  await page.addInitScript(({ key, saved }) => {
    if (!sessionStorage.getItem('scratchpad-library-seeded')) {
      localStorage.setItem(key, JSON.stringify(saved));
      localStorage.setItem('zyloxp-notebook-library-view-v1', 'scratchpads');
      sessionStorage.setItem('scratchpad-library-seeded', 'yes');
    }
  }, { key, saved });
  await page.goto(`/${route}`);
  await page.getByRole('button', { name: 'Start learning', exact: true }).click();
  const dismiss = page.getByRole('button', { name: 'Dismiss notification', exact: true });
  if (await dismiss.isVisible()) await dismiss.click();
}

async function downloadedText(page: Page) {
  const event = page.waitForEvent('download');
  await region(page).getByRole('button', { name: /Export (all|results)/ }).click();
  const download = await event;
  expect(download.suggestedFilename()).toBe('zyloxp-scratchpads.txt');
  const stream = (await download.createReadStream())!;
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

test('search, topic filters, export and direct question reopening preserve working', async ({ page }, info) => {
  await enter(page);
  await expect(region(page)).toContainText('2 of 80 saved');
  await row(page).getByText('View working', { exact: true }).click();
  await expect(row(page).locator('pre')).toHaveText(first);
  await region(page).getByRole('searchbox', { name: 'Search scratchpads' }).fill('root mean square');
  await expect(region(page).getByRole('article')).toHaveCount(1);
  await expect(region(page).getByRole('article')).toContainText('RMS phasor');
  await region(page).getByRole('combobox', { name: 'Scratchpad topic' }).selectOption('DC Circuit Analysis');
  await expect(region(page)).toContainText('No matching scratchpads');
  await region(page).getByRole('button', { name: 'Clear filters', exact: true }).click();
  await region(page).getByRole('searchbox', { name: 'Search scratchpads' }).fill('substituting');
  await expect(region(page).getByRole('article')).toHaveCount(1);
  const text = await downloadedText(page);
  expect(text).toContain(first);
  expect(text).not.toContain(second);
  await expect(region(page).getByRole('button', { name: 'Export results' })).toBeFocused();
  await region(page).getByRole('button', { name: 'Clear scratchpad filters' }).click();
  await row(page).getByText('View working', { exact: true }).click();
  const dismiss = page.getByRole('button', { name: 'Dismiss notification', exact: true });
  if (await dismiss.isVisible()) await dismiss.click();
  await region(page).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('scratchpad-library.png') });
  await row(page).getByRole('button', { name: 'Continue question' }).click();
  await expect(page).toHaveURL(/#\/practice\/question\/EE-00001$/);
  await expect(page.getByRole('textbox', { name: 'Scratchpad notes', exact: true })).toHaveValue(first);
  await page.getByRole('button', { name: 'All scratchpads' }).click();
  await expect(region(page)).toBeVisible();
  await page.reload();
  await expect(region(page)).toContainText('2 of 80 saved');
});

test('removal and stacked undo update counts without losing unrelated notes', async ({ page }) => {
  await enter(page);
  await row(page).getByRole('button', { name: /Remove/ }).click();
  await expect(region(page)).toContainText('1 of 80 saved');
  await expect(page.getByRole('navigation', { name: 'Notebook views' }).getByRole('button', { name: /Scratchpads/ })).toContainText('1');
  await expect(region(page).getByRole('button', { name: 'Undo removal' })).toBeFocused();
  await region(page).getByRole('article').getByRole('button', { name: /Remove/ }).click();
  await expect(region(page)).toContainText('2 removals can be undone');
  await expect(region(page)).toContainText('No saved working yet');
  await region(page).getByRole('button', { name: 'Undo removal' }).click();
  await region(page).getByRole('button', { name: 'Undo removal' }).click();
  await expect(region(page)).toContainText('2 of 80 saved');
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key)).toEqual({ 'EE-00001': first, 'EE-12501': second });
});

test('a full library can free space for a retained question draft without silent eviction', async ({ page }) => {
  const saved = Object.fromEntries(Array.from({ length: 80 }, (_, i) => [`old-${i}`, `Saved working ${i}`]));
  await enter(page, saved, '#/practice/question/EE-00001');
  await page.getByRole('button', { name: 'Scratchpad', exact: true }).click();
  await page.getByRole('textbox', { name: 'Scratchpad notes', exact: true }).fill('New reasoning to keep');
  await expect(page.getByRole('alert')).toContainText('All 80 scratchpads');
  await page.getByRole('button', { name: 'All scratchpads' }).click();
  await expect(region(page)).toContainText('80 of 80 saved');
  await region(page).getByRole('article').first().getByRole('button', { name: /Remove/ }).click();
  await expect(region(page)).toContainText('79 of 80 saved');
  await page.evaluate(() => { location.hash = '#/practice/question/EE-00001'; });
  await expect(page.getByRole('textbox', { name: 'Scratchpad notes', exact: true })).toHaveValue('New reasoning to keep');
  await page.getByRole('button', { name: 'Retry save', exact: true }).click();
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  expect(Object.keys(stored)).toHaveLength(80);
  expect(stored['EE-00001']).toBe('New reasoning to keep');
  expect(stored['old-79']).toBe('Saved working 79');
});

test('newer work wins over stale removals and undo, and write failures remain actionable', async ({ page }) => {
  await enter(page);
  await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ 'EE-00001': 'Changed elsewhere', 'EE-12501': 'Other note' })), key);
  await row(page).getByRole('button', { name: /Remove/ }).click();
  await expect(region(page).getByRole('alert')).toContainText('newer version has been kept');
  await row(page).getByRole('button', { name: /Remove/ }).click();
  await page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key)!);
    saved['EE-00001'] = 'A new note after removal';
    localStorage.setItem(key, JSON.stringify(saved));
  }, key);
  await region(page).getByRole('button', { name: 'Undo removal' }).click();
  await expect(region(page).getByRole('alert')).toContainText('newer version has been kept');
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!)['EE-00001'], key)).toBe('A new note after removal');
  await page.evaluate((key) => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) { if (name === key) throw new DOMException('Full'); return set.call(this, name, value); };
  }, key);
  await row(page).getByRole('button', { name: /Remove/ }).click();
  await expect(region(page).getByRole('alert')).toContainText('Storage is unavailable');
  await expect(row(page)).toBeVisible();
});

test('malformed storage shows an error rather than an empty library and can be retried', async ({ page }) => {
  await enter(page);
  await page.evaluate((key) => {
    localStorage.setItem(key, '{invalid');
    window.dispatchEvent(new StorageEvent('storage', { key }));
  }, key);
  await expect(region(page).getByRole('alert')).toContainText('left unchanged');
  await expect(region(page).getByText('No saved working yet')).toHaveCount(0);
  await expect(region(page).getByRole('button', { name: 'Export all' })).toBeDisabled();
  await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ 'EE-00001': 'Recovered note' })), key);
  await region(page).getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(region(page)).toContainText('1 of 80 saved');
  await expect(page.getByRole('navigation', { name: 'Notebook views' }).getByRole('button', { name: /Scratchpads/ })).toContainText('1');
});

test('unavailable questions remain readable and exportable on narrow screens', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const working = '<script>not executable</script>\n' + 'unbroken'.repeat(60);
  await enter(page, { 'unavailable-1': working });
  await expect(region(page).getByRole('button', { name: 'Continue question' })).toHaveCount(0);
  await region(page).getByText('View working', { exact: true }).click();
  await expect(region(page).locator('pre')).toHaveText(working);
  expect(await downloadedText(page)).toContain(working);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await region(page).getByText('View working', { exact: true }).focus();
  await region(page).screenshot({ path: info.outputPath('scratchpad-library-narrow.png') });
});

test('failed export can be retried, and undo never evicts entries at capacity', async ({ page }) => {
  await enter(page);
  await page.evaluate(() => {
    const original = URL.createObjectURL;
    let reject = true;
    URL.createObjectURL = (blob) => { if (reject) { reject = false; throw new Error('Download unavailable'); } return original(blob); };
  });
  await region(page).getByRole('button', { name: 'Export all' }).click();
  await expect(region(page).getByRole('alert')).toContainText('Export could not start');
  expect(await downloadedText(page)).toContain(first);
  await row(page).getByRole('button', { name: /Remove/ }).click();
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify(Object.fromEntries(Array.from({ length: 80 }, (_, i) => [`extra-${i}`, `New work ${i}`]))));
  }, key);
  await region(page).getByRole('button', { name: 'Undo removal' }).click();
  await expect(region(page).getByRole('alert')).toContainText('All 80 slots');
  expect(await page.evaluate((key) => Object.keys(JSON.parse(localStorage.getItem(key)!)).length, key)).toBe(80);
  await page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key)!);
    delete saved['extra-0'];
    localStorage.setItem(key, JSON.stringify(saved));
  }, key);
  await region(page).getByRole('button', { name: 'Undo removal' }).click();
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!)['EE-00001'], key)).toBe(first);
});

test('phone Notebook labels stay separate from their counts, including enlarged text', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await enter(page);
  const navigation = page.getByRole('navigation', { name: 'Notebook views' });
  for (const size of [13, 20]) {
    await navigation.locator('strong').evaluateAll((labels, size) => labels.forEach((label) => { (label as HTMLElement).style.fontSize = `${size}px`; }), size);
    const layout = await navigation.locator('button').evaluateAll((buttons) => buttons.map((button) => {
      const label = button.querySelector('strong')!.getBoundingClientRect();
      const badge = button.querySelector('em')!.getBoundingClientRect();
      const box = button.getBoundingClientRect();
      return { separate: label.right <= badge.left - 2, inside: label.bottom <= box.bottom && label.left >= box.left };
    }));
    expect(layout.every((item) => item.separate && item.inside)).toBe(true);
  }
  await navigation.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await navigation.screenshot({ path: info.outputPath('notebook-navigation-large-text.png') });
});
