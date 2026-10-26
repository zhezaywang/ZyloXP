import { expect, test, type Page } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });

async function enter(page: Page, route = '#/learn') {
  await page.goto(`/${route}`);
  await page.getByRole('button', { name: 'Start learning', exact: true }).click();
  await expect(page.locator('.appShell')).toHaveAttribute('data-motion', 'full');
}

async function openSettings(page: Page) {
  if (await page.getByRole('button', { name: 'More', exact: true }).isVisible()) {
    await page.getByRole('button', { name: 'More', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  return page.getByRole('dialog', { name: 'Settings', exact: true });
}

async function openLabs(page: Page) {
  const sidebar = page.getByRole('complementary', { name: 'Primary navigation' });
  const navigation = await sidebar.isVisible()
    ? sidebar
    : page.getByRole('navigation', { name: 'Mobile navigation' });
  await navigation.getByRole('button', { name: 'Labs', exact: true }).click();
}

test('page arrivals are bounded, clean up, and never animate the workspace or diagrams', async ({ page }, info) => {
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    const arrivals: { animation: Animation; tag: string; classes: string }[] = [];
    (window as any).motionArrivals = arrivals;
    Element.prototype.animate = function (frames, options) {
      const animation = animate.call(this, frames, options);
      arrivals.push({ animation, tag: this.tagName, classes: this.className.toString() });
      return animation;
    };
  });
  await enter(page);
  await expect.poll(() => page.evaluate(() => (window as any).motionArrivals.filter((a: any) => a.animation.id === 'zylo-page-arrival').length)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.id === 'zylo-page-arrival').length)).toBe(0);
  const initial = await page.evaluate(() => (window as any).motionArrivals.filter((a: any) => a.animation.id === 'zylo-page-arrival').map((a: any) => ({ tag: a.tag, classes: a.classes })));
  expect(initial.length).toBeLessThanOrEqual(6);
  expect(initial.every((a: { tag: string; classes: string }) => a.tag === 'H1' || a.classes.includes('statCard'))).toBe(true);
  await openLabs(page);
  await expect(page).toHaveURL(/#\/labs$/);
  await expect.poll(() => page.evaluate(() => (window as any).motionArrivals.filter((a: any) => a.animation.id === 'zylo-page-arrival').length)).toBeGreaterThan(initial.length);
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.id === 'zylo-page-arrival').length)).toBe(0);
  expect(await page.locator('#main-content').evaluate((el) => getComputedStyle(el).transform)).toBe('none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('labs-motion.png') });
});

test('Zy follows the pointer, keeps a stable hit area, and pauses outside the viewport', async ({ page }, info) => {
  await enter(page);
  const guide = page.locator('.zyGuide').first();
  const character = guide.getByRole('button', { name: 'Interact with Zy the penguin coach' });
  await expect(guide).toHaveAttribute('data-motion-active', 'true');
  const rect = (await character.boundingBox())!;
  await character.dispatchEvent('pointermove', { clientX: rect.x + rect.width * 0.9, clientY: rect.y + rect.height * 0.5, pointerType: 'mouse' });
  await expect.poll(() => character.evaluate((el) => parseFloat((el as HTMLElement).style.getPropertyValue('--zy-look-x')))).toBeGreaterThan(0);
  await character.dispatchEvent('pointerout', { pointerType: 'mouse', relatedTarget: null });
  await expect.poll(() => character.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--zy-look-x'))).toBe('0px');
  await character.dispatchEvent('pointermove', { clientX: rect.x + rect.width, clientY: rect.y, pointerType: 'touch' });
  expect(await character.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--zy-look-x'))).toBe('0px');
  const motion = await character.evaluate((el) => {
    const model = el.querySelector('.zyModel')!;
    const animation = model.getAnimations().find((item) => (item as CSSAnimation).animationName === 'zy-rest-breathe')!;
    animation.pause();
    animation.currentTime = 0;
    const before = { button: el.getBoundingClientRect().toJSON(), modelY: model.getBoundingClientRect().y };
    animation.currentTime = 2800;
    const after = { button: el.getBoundingClientRect().toJSON(), modelY: model.getBoundingClientRect().y };
    animation.play();
    return { before, after };
  });
  expect(motion.before.button).toEqual(motion.after.button);
  expect(Math.abs(motion.before.modelY - motion.after.modelY)).toBeGreaterThan(1);
  await character.press('Enter');
  await expect(guide).toHaveClass(/reaction-wave/);
  await expect(guide.locator('.zyGuideBubble p')).toContainText('right here');
  await guide.screenshot({ path: info.outputPath('zy-wave.png') });
  await page.setViewportSize({ ...page.viewportSize()!, height: 500 });
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await expect(guide).toHaveAttribute('data-motion-active', 'false');
  expect(await guide.locator('.zyEye').first().evaluate((el) => getComputedStyle(el).animationPlayState)).toBe('paused');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(guide).toHaveAttribute('data-motion-active', 'true');
});

test('live system reduced motion stops CSS, pointer tilt, and page arrival effects', async ({ page }) => {
  await enter(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.appShell')).toHaveAttribute('data-motion', 'reduced');
  const guide = page.locator('.zyGuide').first();
  await expect(guide).toHaveAttribute('data-motion-active', 'false');
  const character = guide.locator('.zyCharacter');
  await character.dispatchEvent('pointermove', { clientX: 100, clientY: 100, pointerType: 'mouse' });
  expect(await character.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--zy-look-x'))).toBe('0px');
  expect(await guide.locator('.zyPose').evaluate((el) => getComputedStyle(el).transform)).toBe('none');
  await character.press('Enter');
  await expect(guide.locator('.zyGuideBubble p')).toContainText('right here');
  expect(await page.evaluate(() => document.querySelector('.appShell')!.getAnimations({ subtree: true }).length)).toBe(0);
  await openLabs(page);
  await expect(page).toHaveURL(/#\/labs$/);
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.id === 'zylo-page-arrival').length)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.appShell')).toHaveAttribute('data-motion', 'full');
});

test('app reduced motion persists, and animated dialogs retain focus and fit the viewport', async ({ page }, info) => {
  await enter(page);
  const dialog = await openSettings(page);
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS('animation-name', 'interface-arrive');
  await expect.poll(() => dialog.evaluate((el) => el.getAnimations().length)).toBe(0);
  const rect = (await dialog.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(rect.y).toBeGreaterThanOrEqual(0);
  expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height + 1);
  await dialog.getByRole('checkbox', { name: /Reduce motion/ }).check();
  await expect(page.locator('.appShell')).toHaveAttribute('data-motion', 'reduced');
  await dialog.screenshot({ path: info.outputPath('motion-settings.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.appShell')).toHaveAttribute('data-motion', 'reduced');
  const reopened = await openSettings(page);
  await expect(reopened.getByRole('checkbox', { name: /Reduce motion/ })).toBeChecked();
  await reopened.getByRole('checkbox', { name: /Reduce motion/ }).uncheck();
  await expect(page.locator('.appShell')).toHaveAttribute('data-motion', 'full');
});

test('arrivals do not reset PCB edits or restart while editing', async ({ page }) => {
  await enter(page, '#/labs/pcb');
  const name = page.getByRole('textbox', { name: 'Board name', exact: true });
  await name.fill('Motion regression board');
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.id === 'zylo-page-arrival').length)).toBe(0);
  await name.press('End');
  await name.pressSequentially(' B');
  await expect(name).toHaveValue('Motion regression board B');
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.id === 'zylo-page-arrival').length)).toBe(0);
  await openLabs(page);
  await page.evaluate(() => { location.hash = '#/labs/pcb'; });
  await expect(name).toHaveValue('Motion regression board B');
});

test('answer feedback animates once and keeps notes and next-question navigation working', async ({ page }, info) => {
  await enter(page, '#/practice/question/EE-00001');
  const prompt = page.locator('.lessonQuestionBlock h2');
  const originalPrompt = await prompt.innerText();
  await page.getByRole('button', { name: 'Scratchpad', exact: true }).click();
  const notes = page.getByRole('textbox', { name: 'Scratchpad notes' });
  await notes.fill('I = 8 / 8 = 1 A');
  await page.getByRole('button', { name: 'Option C: 1 A', exact: true }).click();
  const feedback = page.locator('.feedbackBox.success');
  await expect(feedback).toBeVisible();
  await expect(feedback).toHaveCSS('animation-name', 'interface-arrive');
  await expect(page.locator('.answerButton.correct > span')).toHaveCSS('animation-name', 'answer-confirm');
  await expect(notes).toHaveValue('I = 8 / 8 = 1 A');
  await expect.poll(() => feedback.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
  await feedback.screenshot({ path: info.outputPath('answer-feedback.png') });
  await page.getByRole('button', { name: 'Next Prompt', exact: true }).click();
  await expect(prompt).not.toHaveText(originalPrompt);
  await expect(feedback).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('device preferences stay live without replacing the saved app choice', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/learn');
  await page.getByRole('button', { name: 'Start learning', exact: true }).click();
  await expect(page.locator('.appShell')).toHaveAttribute('data-motion', 'reduced');
  await page.reload();
  await expect(page.locator('.appShell')).toHaveAttribute('data-motion', 'reduced');
  const dialog = await openSettings(page);
  const preference = dialog.getByRole('checkbox', { name: /Reduce motion/ });
  await expect(preference).not.toBeChecked();
  await expect(dialog.getByText('Reduced motion is also enabled on your device')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.appShell')).toHaveAttribute('data-motion', 'full');
  await preference.check();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.appShell')).toHaveAttribute('data-motion', 'reduced');
  await preference.uncheck();
  await expect(page.locator('.appShell')).toHaveAttribute('data-motion', 'full');
});
