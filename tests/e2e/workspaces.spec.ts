import { expect, test, type Page } from '@playwright/test';

async function enterWorkspace(page: Page, hash = '#/learn') {
  await page.goto(`/${hash}`);
  await page.getByRole('button', { name: 'Start learning', exact: true }).click();
  await expect(page.locator('.appShell')).toBeVisible();
}

async function expectContained(page: Page) {
  const sizes = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(sizes.page).toBeLessThanOrEqual(sizes.viewport);
}

test('landing preview is keyboard accessible and profile setup is local', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'ZyloXP' })).toBeVisible();
  const firstTab = page.getByRole('tab', { name: 'Learning path' });
  await firstTab.focus();
  await firstTab.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Interactive labs' })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('Turn equations into intuition');
  await expectContained(page);
  await page.getByRole('button', { name: 'Set up profile', exact: true }).first().click();
  await expect(page.getByLabel('ZyloXP local profile')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Continue with (Apple|Google)/ })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Display name', exact: true }).fill('Demo learner');
  await page.getByRole('button', { name: 'Save profile and continue' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Engineering Foundations' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Engineering Foundations' })).toBeVisible();
});

test('main workspaces load without runtime errors or horizontal overflow', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await enterWorkspace(page);
  for (const [hash, heading] of [
    ['#/learn', 'Engineering Foundations'],
    ['#/practice', 'Practice Session'],
    ['#/labs', 'Engineering Labs'],
    ['#/atlas', 'Electrical Engineering Atlas'],
    ['#/careers', 'Career Map'],
    ['#/labs/pcb', 'PCB Designer'],
  ]) {
    await page.goto(`/${hash}`);
    await expect(page.getByRole('heading', { level: 1, name: heading, exact: true })).toBeVisible();
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    await expectContained(page);
    if (hash === '#/labs' || hash === '#/careers') {
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
  }
  expect(errors).toEqual([]);
});

test('PCB edits survive navigation, reload, and backup export', async ({ page }) => {
  await enterWorkspace(page, '#/labs/pcb');
  await page.getByRole('textbox', { name: 'Board name', exact: true }).fill('Sensor revision B');
  await page.getByRole('button', { name: 'U2 MCU', exact: true }).press('ArrowRight');
  const position = await page.locator('.pcbComponentDetails').innerText();
  await page.goto('/#/learn');
  await page.getByRole('region', { name: 'Recent learning' }).getByRole('button', { name: /PCB Designer/ }).click();
  await expect(page.getByRole('textbox', { name: 'Board name', exact: true })).toHaveValue('Sensor revision B');
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Board name', exact: true })).toHaveValue('Sensor revision B');
  await page.getByRole('button', { name: 'U2 MCU', exact: true }).press('Enter');
  await expect(page.locator('.pcbComponentDetails')).toHaveText(position, { useInnerText: true });
  await page.getByRole('button', { name: 'Save board', exact: true }).click();
  if (await page.getByRole('button', { name: 'More', exact: true }).isVisible()) {
    await page.getByRole('button', { name: 'More', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download backup' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const backup = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(backup.data['zyloxp-pcb-draft-v1'].name).toBe('Sensor revision B');
  expect(backup.data['zyloxp-pcb-designs-v1'][0].name).toBe('Sensor revision B');
  expect(backup.data['zyloxp-recent-learning-v1'].some((item: { title: string }) => item.title === 'PCB Designer')).toBe(true);
});

test('PCB controls fit the board and undo keyboard edits', async ({ page }, testInfo) => {
  await enterWorkspace(page, '#/labs/pcb');
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Board setup', exact: true }).click();
  }
  await page.getByRole('combobox', { name: 'Placement grid size' }).selectOption('5');
  await page.getByRole('button', { name: 'U2 MCU', exact: true }).press('Enter');
  const before = await page.locator('.pcbComponentDetails').innerText();
  await page.getByRole('button', { name: 'U2 MCU', exact: true }).press('ArrowRight');
  await expect(page.locator('.pcbComponentDetails')).not.toHaveText(before, { useInnerText: true });
  await page.getByRole('button', { name: 'Undo board edit' }).click();
  await expect(page.locator('.pcbComponentDetails')).toHaveText(before, { useInnerText: true });
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Board zoom' })).toContainText('125%');
  await page.getByRole('button', { name: 'Fit board to view' }).click();
  await expect(page.getByRole('group', { name: 'Board zoom' })).toContainText('100%');
  await expectContained(page);
});

test('PCB export opens through a confirmed, undoable import', async ({ page }, testInfo) => {
  await enterWorkspace(page, '#/labs/pcb');
  const name = page.getByRole('textbox', { name: 'Board name', exact: true });
  await name.fill('Portable sensor board');
  await page.getByRole('button', { name: 'U2 MCU', exact: true }).press('ArrowRight');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export board JSON' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const buffer = Buffer.concat(chunks);
  const exported = JSON.parse(buffer.toString('utf8'));
  await page.getByRole('button', { name: 'New board', exact: true }).click();
  const input = page.getByLabel('Choose a PCB board file');
  const preview = page.getByRole('region', { name: 'Board import preview' });
  await input.setInputFiles({ name: download.suggestedFilename(), mimeType: 'application/json', buffer });
  await expect(preview).toContainText('Portable sensor board');
  await expect(preview.getByRole('button', { name: 'Open board' })).toBeFocused();
  await expect(name).toHaveValue('Untitled PCB');
  await expectContained(page);
  await preview.screenshot({ path: testInfo.outputPath('pcb-import-preview.png') });
  await preview.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(preview).toHaveCount(0);
  await expect(name).toHaveValue('Untitled PCB');
  await expect(page.getByRole('button', { name: 'Import board JSON' })).toBeFocused();
  await input.setInputFiles({ name: 'board.json', mimeType: 'application/json', buffer });
  await preview.getByRole('button', { name: 'Open board' }).click();
  await expect(name).toHaveValue('Portable sensor board');
  await page.getByRole('button', { name: 'Undo board edit' }).click();
  await expect(name).toHaveValue('Untitled PCB');
  await page.getByRole('button', { name: 'Redo board edit' }).click();
  await expect(name).toHaveValue('Portable sensor board');
  await page.reload();
  await expect(name).toHaveValue('Portable sensor board');
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('zyloxp-pcb-draft-v1')!));
  expect(restored.components).toEqual(exported.components);
  expect(restored.traces).toEqual(exported.traces);
});

test('PCB rejects damaged imports and never evicts a saved board at capacity', async ({ page }) => {
  await enterWorkspace(page, '#/labs/pcb');
  const name = page.getByRole('textbox', { name: 'Board name', exact: true });
  const input = page.getByLabel('Choose a PCB board file');
  await input.setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
  await expect(page.getByRole('alert')).toContainText('not valid JSON');
  await expect(name).toHaveValue('Sensor Node Rev A');
  await input.setInputFiles({ name: 'large.json', mimeType: 'application/json', buffer: Buffer.alloc(256 * 1024 + 1) });
  await expect(page.getByRole('alert')).toContainText('256 KB');
  await expect(page.getByRole('region', { name: 'Board import preview' })).toHaveCount(0);
  for (let index = 1; index <= 6; index += 1) {
    await name.fill(`Revision ${index}`);
    await page.getByRole('button', { name: 'Save board', exact: true }).click();
  }
  const before = await page.evaluate(() => localStorage.getItem('zyloxp-pcb-designs-v1'));
  await name.fill('Revision 7');
  await page.getByRole('button', { name: 'Save board', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Saved boards are full');
  expect(await page.evaluate(() => localStorage.getItem('zyloxp-pcb-designs-v1'))).toBe(before);
  await expect(page.getByRole('region', { name: 'Saved boards' }).locator('article')).toHaveCount(6);
  await page.getByRole('button', { name: 'Delete Revision 1', exact: true }).click();
  await page.getByRole('button', { name: 'Save board', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Saved boards' })).toContainText('Revision 7');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expectContained(page);
});

test('restoring a PCB backup replaces the open draft and survives another reload', async ({ page }, testInfo) => {
  await enterWorkspace(page, '#/labs/pcb');
  const name = page.getByRole('textbox', { name: 'Board name', exact: true });
  await name.fill('Draft before restore');
  await expect(page.locator('.pcbDraftStatus')).toContainText('Draft saved');
  const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('zyloxp-pcb-draft-v1')!));
  const restored = { ...draft, name: 'Restored from backup', components: [], traces: [] };
  if (await page.getByRole('button', { name: 'More', exact: true }).isVisible()) {
    await page.getByRole('button', { name: 'More', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const backup = page.getByRole('region', { name: 'Progress backup' });
  await backup.locator('input[type="file"]').setInputFiles({
    name: 'restore.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ app: 'ZyloXP', schemaVersion: 1, createdAt: new Date().toISOString(),
      data: { 'zyloxp-pcb-draft-v1': restored } })),
  });
  await expect(backup).toContainText('Backup ready to restore');
  await expect(page.locator('.toast:not(.progressSyncToast)')).toHaveCount(0);
  await expect(backup.locator('.backupPreview')).toContainText('PCB draft: Restored from backup');
  await expect(backup.locator('.backupSnapshot.preview')).toHaveCount(0);
  await backup.locator('.backupPreview').screenshot({ path: testInfo.outputPath('backup-restore-preview.png') });
  await backup.getByRole('button', { name: 'Restore included data' }).click();
  await expect(name).toHaveValue('Restored from backup');
  await page.reload();
  await expect(name).toHaveValue('Restored from backup');
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('zyloxp-pcb-draft-v1')!));
  expect(after.components).toEqual([]);
  expect(after.traces).toEqual([]);
});

test('failed backup restore preserves local progress and can be retried', async ({ page }) => {
  await enterWorkspace(page, '#/labs/pcb');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('zyloxp-pcb-draft-v1'))).not.toBeNull();
  await expect(page.locator('.pcbDraftStatus')).toContainText('Draft saved');
  const before = await page.evaluate(() => ({
    learning: localStorage.getItem('zyloxp-learner-state-v1')!,
    hearts: localStorage.getItem('zyloxp-heart-state-v1')!,
    draft: localStorage.getItem('zyloxp-pcb-draft-v1')!,
  }));
  if (await page.getByRole('button', { name: 'More', exact: true }).isVisible()) {
    await page.getByRole('button', { name: 'More', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const backup = page.getByRole('region', { name: 'Progress backup' });
  const data = {
    'zyloxp-learner-state-v1': { ...JSON.parse(before.learning), earnedXp: 450 },
    'zyloxp-heart-state-v1': JSON.parse(before.hearts),
    'zyloxp-pcb-draft-v1': { ...JSON.parse(before.draft), name: 'Recovered board' },
  };
  const payload = { app: 'ZyloXP', createdAt: new Date().toISOString(), schemaVersion: 1, data };
  await backup.getByLabel('Choose a progress backup file').setInputFiles({
    name: 'future.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...payload, schemaVersion: 99 })),
  });
  await expect(backup.getByRole('alert')).toContainText('version is not supported');
  await expect(backup.getByRole('button', { name: 'Restore included data' })).toHaveCount(0);
  await backup.getByLabel('Choose a progress backup file').setInputFiles({
    name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(payload)),
  });
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'zyloxp-heart-state-v1') {
        Storage.prototype.setItem = original;
        throw new DOMException('Storage is full', 'QuotaExceededError');
      }
      original.call(this, key, value);
    };
  });
  await backup.getByRole('button', { name: 'Restore included data' }).click();
  await expect(backup.getByRole('alert')).toContainText('Your previous local data was recovered');
  const after = await page.evaluate(() => ({
    learning: localStorage.getItem('zyloxp-learner-state-v1'),
    hearts: localStorage.getItem('zyloxp-heart-state-v1'),
    draft: localStorage.getItem('zyloxp-pcb-draft-v1'),
  }));
  expect(after).toEqual(before);
  await backup.getByRole('button', { name: 'Restore included data' }).click();
  await expect(page.getByRole('textbox', { name: 'Board name', exact: true })).toHaveValue('Recovered board');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('zyloxp-learner-state-v1')!).earnedXp)).toBe(450);
});
