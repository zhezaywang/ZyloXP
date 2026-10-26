import { expect, test, type Page } from '@playwright/test';

const key = 'zyloxp-question-scratchpads-v1';
const question = '#/practice/question/EE-00001';
const notes = (page: Page) => page.getByRole('textbox', { name: 'Scratchpad notes', exact: true });
const panel = (page: Page) => page.getByRole('region', { name: 'Question scratchpad', exact: true });

async function enter(page: Page) {
  await page.goto(`/${question}`);
  await page.getByRole('button', { name: 'Start learning', exact: true }).click();
  await expect(page.locator('.lessonQuestionBlock h2')).toBeVisible();
  const dismiss = page.getByRole('button', { name: 'Dismiss notification', exact: true });
  if (await dismiss.isVisible()) await dismiss.click();
}

async function settings(page: Page) {
  const more = page.getByRole('button', { name: 'More', exact: true });
  if (await more.isVisible()) await more.click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  return page.getByRole('region', { name: 'Progress backup', exact: true });
}

test('working outline, undo, question isolation and field-note handoff preserve reasoning', async ({ page }, info) => {
  await enter(page);
  await page.getByRole('button', { name: 'Scratchpad', exact: true }).click();
  await panel(page).getByRole('button', { name: 'Insert working outline' }).click();
  await expect(notes(page)).toHaveValue(/Given:.*8/);
  await expect(notes(page)).toHaveValue(/Check \(units and scale\):/);
  await expect(notes(page)).toBeFocused();
  await notes(page).fill('Given: V = 8 V, R = 8 ohm\nFind: current\nWorking: I = V / R = 1 A\nCheck: V / ohm = A');
  const text = await notes(page).inputValue();
  await expect(panel(page).getByRole('status')).toHaveText('Saved on this device');
  await panel(page).getByRole('button', { name: 'Clear scratchpad', exact: true }).click();
  await expect(notes(page)).toHaveValue('');
  await panel(page).getByRole('button', { name: 'Undo clear scratchpad' }).click();
  await expect(notes(page)).toHaveValue(text);
  await page.reload();
  await expect(notes(page)).toHaveValue(text);
  await page.evaluate(() => { location.hash = '#/practice/question/EE-12501'; });
  await expect(page.getByRole('button', { name: 'Scratchpad', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Scratchpad', exact: true }).click();
  await expect(notes(page)).toHaveValue('');
  await page.evaluate(() => { location.hash = '#/practice/question/EE-00001'; });
  await expect(notes(page)).toHaveValue(text);
  await panel(page).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('question-workspace.png') });
  await panel(page).getByRole('button', { name: 'Save as field note' }).click();
  await expect(page.getByRole('textbox', { name: 'Note', exact: true })).toHaveValue(new RegExp('Reasoning: Given: V = 8 V'));
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await expect(page.locator('.fieldJournalEditor')).toHaveCount(0);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!)['EE-00001'], key)).toBe(text);
});

test('failed saves remain drafts across navigation and reload, then retry succeeds', async ({ page }, info) => {
  await page.addInitScript((key) => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (this === localStorage && name === key && sessionStorage.getItem('scratchpad-test-retry') !== 'ready') throw new DOMException('Full', 'QuotaExceededError');
      return set.call(this, name, value);
    };
  }, key);
  await enter(page);
  await page.getByRole('button', { name: 'Scratchpad', exact: true }).click();
  await notes(page).fill('Retain this reasoning after an interrupted save');
  await expect(panel(page).getByRole('status')).toHaveText('Not saved. Draft retained in this tab.');
  await expect(page.getByRole('button', { name: 'Scratchpad', exact: true })).toContainText('Draft');
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
  await page.evaluate(() => { location.hash = '#/learn'; });
  await expect(notes(page)).toHaveCount(0);
  await page.evaluate(() => { location.hash = '#/practice/question/EE-00001'; });
  await expect(notes(page)).toHaveValue('Retain this reasoning after an interrupted save');
  await page.reload();
  await expect(notes(page)).toHaveValue('Retain this reasoning after an interrupted save');
  await expect(panel(page).getByRole('alert')).toContainText('recovered draft');
  await panel(page).screenshot({ path: info.outputPath('recovered-draft.png') });
  await page.evaluate(() => sessionStorage.setItem('scratchpad-test-retry', 'ready'));
  await panel(page).getByRole('button', { name: 'Retry save' }).click();
  await expect(panel(page).getByRole('status')).toHaveText('Saved on this device');
  expect(await page.evaluate(() => sessionStorage.getItem('zyloxp-question-draft-v1:EE-00001'))).toBeNull();
});

test('full storage does not remove notes and conflicts require an explicit choice', async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify(Object.fromEntries(Array.from({ length: 80 }, (_, i) => [`note-${i}`, `Saved ${i}`]))));
  }, key);
  await enter(page);
  await page.getByRole('button', { name: 'Scratchpad', exact: true }).click();
  await notes(page).fill('My new work');
  await expect(panel(page).getByRole('alert')).toContainText('All 80 scratchpads');
  expect(await page.evaluate((key) => Object.keys(JSON.parse(localStorage.getItem(key)!)).length, key)).toBe(80);
  await page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key)!);
    delete saved['note-0'];
    localStorage.setItem(key, JSON.stringify(saved));
  }, key);
  await panel(page).getByRole('button', { name: 'Retry save' }).click();
  await expect(panel(page).getByRole('status')).toHaveText('Saved on this device');
  await page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key)!);
    saved['EE-00001'] = 'A different saved version';
    localStorage.setItem(key, JSON.stringify(saved));
  }, key);
  await notes(page).fill('My updated work');
  await expect(panel(page).getByRole('alert')).toContainText('different version');
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!)['EE-00001'], key)).toBe('A different saved version');
  await panel(page).getByText('Saved version', { exact: true }).click();
  await expect(panel(page).locator('pre')).toHaveText('A different saved version');
  await panel(page).getByRole('button', { name: 'Save my version' }).click();
  await expect(panel(page).getByRole('status')).toHaveText('Saved on this device');
  await page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key)!);
    saved['EE-00001'] = 'Newest saved work';
    localStorage.setItem(key, JSON.stringify(saved));
  }, key);
  await notes(page).fill('Discard this version');
  await panel(page).getByRole('button', { name: 'Use saved version', exact: true }).click();
  await expect(notes(page)).toHaveValue('Newest saved work');
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!)['note-79'], key)).toBe('Saved 79');
});

test('progress backup downloads and restores scratchpads without stale autosave', async ({ page }) => {
  await enter(page);
  await page.getByRole('button', { name: 'Scratchpad', exact: true }).click();
  await notes(page).fill('A saved calculation');
  const backup = await settings(page);
  const downloadEvent = page.waitForEvent('download');
  await backup.getByRole('button', { name: 'Download backup' }).click();
  const download = await downloadEvent;
  const stream = (await download.createReadStream())!;
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const exported = JSON.parse(Buffer.concat(chunks).toString());
  expect(exported.data[key]['EE-00001']).toBe('A saved calculation');
  exported.data = { [key]: { 'EE-00001': 'Restored calculation' } };
  await backup.getByLabel('Choose a progress backup file').setInputFiles({ name: 'scratchpads.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
  await expect(backup).toContainText('Replaces Question scratchpads');
  await backup.getByRole('button', { name: 'Restore included data' }).click();
  await expect(notes(page)).toHaveValue('Restored calculation');
  await notes(page).fill('Restored calculation, continued');
  await expect(panel(page).getByRole('status')).toHaveText('Saved on this device');
});

test('scratchpad controls and long content fit a narrow screen with enlarged text', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await enter(page);
  await page.getByRole('button', { name: 'Scratchpad', exact: true }).click();
  await notes(page).fill('A'.repeat(600));
  await panel(page).evaluate((el) => {
    const sizes = Array.from(el.querySelectorAll<HTMLElement>('button, strong, span, textarea, [role="status"]'))
      .map((child) => ({ child, size: parseFloat(getComputedStyle(child).fontSize) }));
    for (const { child, size } of sizes) {
      child.style.fontSize = `${size * 1.5}px`;
    }
  });
  await expect(notes(page)).toHaveAttribute('maxlength', '600');
  const bounds = await panel(page).evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return Array.from(el.querySelectorAll('button, textarea, [role="status"]')).map((child) => {
      const box = child.getBoundingClientRect();
      return { inside: box.left >= rect.left && box.right <= rect.right + 1, clipped: child.scrollWidth > child.clientWidth + 1 };
    });
  });
  expect(bounds.every((box) => box.inside && !box.clipped)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await panel(page).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await panel(page).screenshot({ path: info.outputPath('scratchpad-narrow.png') });
});

test('memory fallback retains failed drafts between routes and warns before leaving', async ({ page }) => {
  await page.addInitScript((key) => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key || name.startsWith('zyloxp-question-draft-v1:')) throw new DOMException('Unavailable', 'QuotaExceededError');
      return set.call(this, name, value);
    };
  }, key);
  await enter(page);
  await page.getByRole('button', { name: 'Scratchpad', exact: true }).click();
  await notes(page).fill('Memory-only reasoning');
  await expect(panel(page).getByRole('status')).toHaveText('Not saved. Keep this tab open to retain your draft.');
  await page.evaluate(() => { location.hash = '#/learn'; });
  await expect(notes(page)).toHaveCount(0);
  expect(await page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  })).toBe(true);
  await page.evaluate(() => { location.hash = '#/practice/question/EE-00001'; });
  await expect(notes(page)).toHaveValue('Memory-only reasoning');
});

test('another tab updates saved notes but cannot silently replace a retained draft', async ({ page, context }) => {
  await page.addInitScript((key) => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (this === localStorage && name === key && sessionStorage.getItem('scratchpad-test-fail') === 'yes') throw new DOMException('Full', 'QuotaExceededError');
      return set.call(this, name, value);
    };
  }, key);
  await enter(page);
  await page.getByRole('button', { name: 'Scratchpad', exact: true }).click();
  await notes(page).fill('Initial work');
  const other = await context.newPage();
  await other.goto('/');
  await other.evaluate((key) => localStorage.setItem(key, JSON.stringify({ 'EE-00001': 'Saved in another tab' })), key);
  await expect(notes(page)).toHaveValue('Saved in another tab');
  await page.evaluate(() => sessionStorage.setItem('scratchpad-test-fail', 'yes'));
  await notes(page).fill('My unsaved continuation');
  await other.evaluate((key) => localStorage.setItem(key, JSON.stringify({ 'EE-00001': 'Newer work from another tab' })), key);
  await expect(notes(page)).toHaveValue('My unsaved continuation');
  await expect(panel(page).getByRole('alert')).toContainText('different version');
  await panel(page).getByRole('button', { name: 'Use saved version', exact: true }).click();
  await expect(notes(page)).toHaveValue('Newer work from another tab');
  await other.close();
});
