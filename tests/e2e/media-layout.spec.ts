import { expect, test, type Page } from '@playwright/test';

test('question header fits narrow screens with wide fonts and enlarged labels', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/#/practice/question/EE-00001');
  await page.getByRole('button', { name: 'Start learning', exact: true }).click();
  const progress = page.locator('.lessonPageStats[aria-label="Prompt progress"]');
  await expect(progress).toBeVisible();
  await progress.evaluate((element) => {
    const sizes = Array.from(element.querySelectorAll<HTMLElement>('button, span, strong'))
      .map((child) => ({ child, size: parseFloat(getComputedStyle(child).fontSize) }));
    for (const { child, size } of sizes) {
      child.style.fontFamily = 'Verdana, monospace';
      child.style.fontSize = `${size * 1.5}px`;
    }
  });
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 740 });
    const layout = await progress.evaluate((element) => {
      const parent = element.getBoundingClientRect();
      return Array.from(element.querySelectorAll('button, span, strong')).map((child) => {
        const box = child.getBoundingClientRect();
        return { text: child.textContent, inside: box.left >= parent.left && box.right <= parent.right,
          clipped: child.scrollWidth > child.clientWidth + 1 };
      });
    });
    expect(layout.filter((item) => !item.inside || item.clipped)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize({ width: 320, height: 740 });
  await progress.screenshot({ path: info.outputPath('question-header-large-text.png') });
  await progress.getByRole('button', { name: 'Save question', exact: true }).click();
  await expect(progress.getByRole('button', { name: 'Saved', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await progress.getByRole('button', { name: 'Save formula', exact: true }).click();
  await expect(progress.getByRole('button', { name: 'In notebook', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

async function mediaTextCollisions(page: Page) {
  return page.locator('#main-content').evaluate((root) => {
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden';
    };
    const media = Array.from(root.querySelectorAll('img, svg:not(.lucide), .zyModel, .zyArm, .zyHead'))
      .filter((element) => visible(element) && !element.closest('[role="dialog"]'))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return element.matches('.zyArm, .zyHead') || (rect.width > 50 && rect.height > 40);
      });
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const collisions: { text: string; media: string; overlap: number }[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || !node.textContent?.trim() || !visible(parent)
        || parent.closest('svg, [aria-hidden="true"], .srOnly, .toast, .labCardLiveBadge, [role="dialog"]')) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of Array.from(range.getClientRects())) {
        if (!rect.width || !rect.height) continue;
        for (const image of media) {
          const box = image.getBoundingClientRect();
          const width = Math.min(rect.right, box.right) - Math.max(rect.left, box.left);
          const height = Math.min(rect.bottom, box.bottom) - Math.max(rect.top, box.top);
          if (width > 1 && height > 1 && getComputedStyle(parent).textOverflow !== 'ellipsis') collisions.push({
            text: node.textContent.trim().slice(0, 100),
            media: image.getAttribute('class') || image.tagName,
            overlap: Math.round(width * height),
          });
        }
      }
    }
    return collisions;
  });
}

for (const width of [320, 390, 768, 1024, 1280, 1440]) {
  test(`media leaves text unobstructed at ${width}px`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'The width matrix covers mobile and desktop in one project.');
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/#/learn');
    await page.getByRole('button', { name: 'Start learning', exact: true }).click();
    await expect(page.locator('.heroBand')).toBeVisible();
    const findings: { route: string; collisions: Awaited<ReturnType<typeof mediaTextCollisions>> }[] = [];
    for (const route of ['learn', 'practice', 'labs', 'careers', 'atlas', 'notebook',
      'practice/question/EE-00001', 'labs/lab-ohms', 'labs/lab-pid', 'labs/pcb', 'atlas/concept/ac-phasors']) {
      await page.evaluate((route) => { location.hash = `#/${route}`; }, route);
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await expect(page.locator('.pageLoadingState')).toHaveCount(0);
      await expect(page.locator('#main-content h1').first()).toBeVisible();
      await page.evaluate(async () => { await document.fonts.ready; });
      const collisions = await mediaTextCollisions(page);
      if (collisions.length) {
        findings.push({ route, collisions });
        await page.screenshot({ path: info.outputPath(`${route.replaceAll('/', '-')}.png`), fullPage: true });
      }
    }
    expect(findings).toEqual([]);
  });
}

for (const route of ['learn', 'labs', 'practice/question/EE-00001', 'labs/lab-ohms']) {
  test(`animated coach poses leave text clear in ${route}`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`/#/${route}`);
    await page.getByRole('button', { name: 'Start learning', exact: true }).click();
    await page.getByRole('button', { name: 'Dismiss notification' }).click();
    await page.evaluate(async () => { await document.fonts.ready; });
    await expect.poll(() => page.evaluate(() => document.getAnimations()
      .filter((animation) => animation.id === 'zylo-page-arrival').length)).toBe(0);
    const guide = page.locator('.zyGuide:visible').first();
    await guide.scrollIntoViewIfNeeded();
    await expect(guide).toHaveAttribute('data-motion-active', 'true');
    const button = guide.getByRole('button', { name: 'Interact with Zy the penguin coach' });
    const findings: unknown[] = [];
    for (let reaction = 0; reaction < 8; reaction++) {
      await button.press('Enter');
      for (const phase of [0.25, 0.5, 0.75]) {
        await guide.evaluate((element, phase) => {
          for (const animation of element.getAnimations({ subtree: true })) {
            animation.pause();
            const duration = animation.effect?.getTiming().duration;
            if (typeof duration === 'number') animation.currentTime = duration * phase;
          }
        }, phase);
        const collisions = await mediaTextCollisions(page);
        if (collisions.length) {
          findings.push({ reaction, phase, collisions });
          await page.screenshot({ path: info.outputPath(`pose-${reaction}-${phase}.png`) });
        }
        if (reaction === 0 && phase === 0.25) {
          await page.screenshot({ path: info.outputPath('character-text-clearance.png') });
        }
      }
    }
    expect(findings).toEqual([]);
  });
}

test('larger text stays clear of illustrations and coach controls', async ({ page }, info) => {
  await page.goto('/#/learn');
  await page.getByRole('button', { name: 'Start learning', exact: true }).click();
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  for (const route of ['learn', 'labs', 'practice/question/EE-00001', 'labs/lab-ohms']) {
    await page.evaluate((route) => { location.hash = `#/${route}`; }, route);
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(page.locator('.pageLoadingState')).toHaveCount(0);
    await expect(page.locator('#main-content h1').first()).toBeVisible();
    expect(await mediaTextCollisions(page), route).toEqual([]);
    const labelOverlaps = await page.locator('.zyGuide:visible').evaluateAll((guides) => guides.filter((guide) => {
      const label = guide.querySelector('.zyGuideMeta > span')!.getBoundingClientRect();
      const actions = guide.querySelector('.zyGuideActions')!.getBoundingClientRect();
      return Math.min(label.right, actions.right) - Math.max(label.left, actions.left) > 1
        && Math.min(label.bottom, actions.bottom) - Math.max(label.top, actions.top) > 1;
    }).length);
    expect(labelOverlaps, route).toBe(0);
  }
  const guide = page.locator('.zyGuide:visible').first();
  await guide.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await guide.screenshot({ path: info.outputPath('large-text-clearance.png') });
});
