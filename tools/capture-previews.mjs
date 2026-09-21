import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { copyFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

// Capture the running product, without injecting progress or rearranging the DOM.
const origin = 'http://127.0.0.1:4179';
const server = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4179', '--strictPort',
], { stdio: 'inherit' });
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (server.exitCode !== null) throw new Error('Preview server could not start on port 4179.');
    ready = await fetch(origin).then((response) => response.ok).catch(() => false);
    if (ready) break;
    await delay(100);
  }
  if (!ready) throw new Error('Preview server did not become ready.');
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  await page.goto(origin);
  if (process.env.PREVIEW_REVIEW_DIR) {
    await page.screenshot({ path: `${process.env.PREVIEW_REVIEW_DIR}/landing-desktop.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${process.env.PREVIEW_REVIEW_DIR}/landing-mobile.png` });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.getByRole('button', { name: 'Start learning', exact: true }).click();
  await page.getByRole('heading', { name: 'Engineering Foundations', exact: true }).waitFor();
  // Let the transient welcome notification dismiss before capturing the workspace.
  await page.getByText('Welcome to ZyloXP. Your progress stays on this device.', { exact: true }).waitFor({ state: 'hidden' });
  for (const [name, route, heading] of [
    ['dashboard', 'learn', 'Engineering Foundations'],
    ['pcb', 'labs/pcb', 'PCB Designer'],
    ['labs', 'labs/lab-ohms', "Ohm's Law Bench"],
    ['notebook', 'notebook', 'Engineering Notebook'],
  ]) {
    await page.goto(`${origin}/#/${route}`);
    await page.getByRole('heading', { name: heading, level: 1, exact: true }).waitFor();
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    if (name === 'pcb') await page.locator('.pcbBoardCanvas').waitFor();
    if (name === 'labs') await page.locator('.labVisualStage svg[role="img"]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/zyloxp-${name}.jpg`, type: 'jpeg', quality: 85 });
    if (name === 'pcb') {
      await page.locator('.pcbBoardCanvas').screenshot({ path: 'public/landing/zyloxp-board.jpg', type: 'jpeg', quality: 90 });
    }
    await copyFile(`docs/zyloxp-${name}.jpg`, `public/landing/zyloxp-${name}.jpg`);
    console.log(`Captured ${name}`);
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
