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
