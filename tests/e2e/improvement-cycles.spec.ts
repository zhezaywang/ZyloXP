import { expect, test, type Locator, type Page } from '@playwright/test';

const journalKey = 'zyloxp-field-journal-v1';
const queueKey = 'zyloxp-study-list-v1';
const note = (index: number) => ({ id: `note-${index}`, title: `Measurement ${index}`, body: `Recorded value ${index}`, category: 'lab', pinned: false, createdAt: 1000 + index, updatedAt: 1000 + index });

async function enter(page: Page, route: string, storage: Record<string, string> = {}) {
  await page.addInitScript((entries) => {
    if (sessionStorage.getItem('improvement-test-seeded')) return;
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
    sessionStorage.setItem('improvement-test-seeded', 'true');
  }, storage);
  await page.goto(`/${route}`);
  await page.getByRole('button', { name: 'Start learning', exact: true }).click();
  await expect(page.locator('.appShell')).toBeVisible();
}

async function enterJournal(page: Page, notes: unknown[] = []) {
  await enter(page, '#/notebook', {
    'zyloxp-notebook-library-view-v1': 'notes',
    [journalKey]: JSON.stringify(notes),
  });
  await expect(page.getByRole('heading', { name: 'Working notes' })).toBeVisible();
}

async function fillNote(page: Page, title: string, body = 'A useful working observation') {
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill(title);
  await page.getByRole('textbox', { name: 'Note', exact: true }).fill(body);
}

async function contained(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test('a full journal preserves every note, allows editing, and supports delete/undo', async ({ page }, testInfo) => {
  await enterJournal(page, Array.from({ length: 40 }, (_, index) => note(index)));
  const journal = page.locator('.fieldJournal');
  await expect(journal.getByRole('status')).toContainText('Journal is full');
  await journal.getByRole('button', { name: 'New note', exact: true }).click();
  await fillNote(page, 'Extra observation');
  await expect(journal.getByRole('button', { name: 'Save note', exact: true })).toBeDisabled();
  expect((await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), journalKey)).length).toBe(40);
  await contained(page);
  await journal.locator('.workspaceNotice').screenshot({ path: testInfo.outputPath('journal-capacity.png') });
  await journal.getByRole('button', { name: 'Cancel', exact: true }).click();
  await journal.getByRole('button', { name: 'Edit Measurement 39', exact: true }).click();
  await fillNote(page, 'Revised measurement');
  await journal.getByRole('button', { name: 'Update note', exact: true }).click();
  await expect(journal.locator('.fieldNote')).toHaveCount(40);
  await journal.getByRole('button', { name: 'Delete Revised measurement', exact: true }).click();
  await expect(journal.getByText('Journal is full', { exact: false })).toHaveCount(0);
  await journal.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(journal.locator('.fieldNote')).toHaveCount(40);
  await page.reload();
  await expect(journal.getByRole('heading', { name: 'Revised measurement', exact: true })).toBeVisible();
  await expect(journal.getByRole('heading', { name: 'Measurement 0', exact: true })).toBeVisible();
});

test('new and edited journal drafts survive navigation and reload without duplicating notes', async ({ page }) => {
  await enterJournal(page);
  await page.locator('.fieldJournalHeader').getByRole('button', { name: 'New note', exact: true }).click();
  await fillNote(page, 'Unfinished measurement', 'Keep this reasoning');
  await page.goto('/#/learn');
  await page.goto('/#/notebook');
  await expect(page.getByRole('textbox', { name: 'Title', exact: true })).toHaveValue('Unfinished measurement');
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Note', exact: true })).toHaveValue('Keep this reasoning');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Unfinished measurement', exact: true }).click();
  await fillNote(page, 'Revised draft', 'Changed reasoning');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Update note', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Title', exact: true })).toHaveValue('Revised draft');
  await page.getByRole('button', { name: 'Update note', exact: true }).click();
  await expect(page.locator('.fieldNote')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.fieldJournalEditor')).toHaveCount(0);
  await expect(page.locator('.fieldNote')).toContainText('Changed reasoning');
});

test('a newly saved note is revealed when old search and category filters exclude it', async ({ page }) => {
  await enterJournal(page, [note(0)]);
  await page.getByRole('navigation', { name: 'Filter field notes' }).getByRole('button', { name: 'Career', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search field notes' }).fill('nonmatching');
  await page.locator('.fieldJournalHeader').getByRole('button', { name: 'New note', exact: true }).click();
  await fillNote(page, 'Visible new note');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: 'Search field notes' })).toHaveValue('');
  await expect(page.locator('.fieldNote').filter({ hasText: 'Visible new note' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Filter field notes' }).getByRole('button', { name: /^All/ })).toHaveAttribute('aria-pressed', 'true');
});

test('journal storage failures remain visible until an explicit successful retry', async ({ page }, testInfo) => {
  await enterJournal(page);
  await page.evaluate((key) => {
    const original = Storage.prototype.setItem;
    (window as Window & { restoreWrites?: () => void }).restoreWrites = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) { if (name === key) throw new DOMException('Full', 'QuotaExceededError'); original.call(this, name, value); };
  }, journalKey);
  await page.locator('.fieldJournalHeader').getByRole('button', { name: 'New note', exact: true }).click();
  await fillNote(page, 'Recoverable note');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  const warning = page.locator('.fieldJournal').getByRole('alert');
  await expect(warning).toContainText('Notes could not be saved');
  await warning.getByRole('button', { name: 'Retry saving' }).click();
  await expect(warning).toBeVisible();
  await contained(page);
  await warning.screenshot({ path: testInfo.outputPath('journal-save-recovery.png') });
  await page.evaluate(() => (window as Window & { restoreWrites?: () => void }).restoreWrites!());
  await warning.getByRole('button', { name: 'Retry saving' }).click();
  await expect(warning).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.fieldNote')).toContainText('Recoverable note');
});

test('malformed imported note dates and duplicate IDs cannot crash or delete multiple entries', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await enterJournal(page, [{ ...note(0), updatedAt: 1e100 }, { ...note(0), title: 'Independent duplicate' }]);
  await expect(page.locator('.fieldNote')).toHaveCount(2);
  await page.getByRole('button', { name: 'Delete Measurement 0', exact: true }).click();
  await expect(page.locator('.fieldNote')).toHaveCount(1);
  await expect(page.locator('.fieldNote')).toContainText('Independent duplicate');
  await page.reload();
  await expect(page.locator('.fieldNote')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('Study List capacity is visible, disables additions, and recovers after removal', async ({ page }, testInfo) => {
  const items = Array.from({ length: 60 }, (_, index) => ({ id: `saved-${index}`, title: `Saved target ${index}`, subtitle: 'Learning target', kind: 'Concept', addedAt: 1000, completedAt: null }));
  await enter(page, '#/notebook', { [queueKey]: JSON.stringify(items), 'zyloxp-notebook-library-view-v1': 'study-list' });
  const list = page.locator('.studyListWorkspace');
  await expect(list.getByRole('status')).toContainText('Study List is full');
  await expect(list.locator('.studyListSuggestions button').first()).toBeDisabled();
  await contained(page);
  await list.locator('.workspaceNotice').screenshot({ path: testInfo.outputPath('study-list-capacity.png') });
  await list.getByRole('button', { name: 'Remove Saved target 0 from Study List', exact: true }).click();
  await expect(list.locator('.studyListSuggestions button').first()).toBeEnabled();
  await page.locator('.toast').getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(list.locator('.studyListItems article')).toHaveCount(60);
  await page.reload();
  await expect(list.locator('.studyListItems article')).toHaveCount(60);
});

test('Study List uses engineering aliases and supports a complete add, complete, clear and undo flow', async ({ page }) => {
  await enter(page, '#/notebook', { 'zyloxp-notebook-library-view-v1': 'study-list' });
  const list = page.locator('.studyListWorkspace');
  await list.getByRole('searchbox', { name: 'Search learning library' }).fill('operational amplifier');
  await expect(list.locator('.studyListSuggestions article').first()).toBeVisible();
  await expect(list.locator('.studyListSuggestions')).toContainText(/op-amp/i);
  const title = await list.locator('.studyListSuggestions article strong').first().innerText();
  await list.locator('.studyListSuggestions button').first().click();
  await expect(list.locator('.studyListItems')).toContainText(title);
  await list.getByRole('button', { name: `Mark complete: ${title}`, exact: true }).click();
  await list.getByRole('button', { name: 'Clear completed', exact: true }).click();
  await expect(list.locator('.studyListItems article')).toHaveCount(0);
  await page.locator('.toast').getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(list.locator('.studyListItems article')).toHaveCount(1);
  await expect(list.getByRole('button', { name: `Mark incomplete: ${title}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await contained(page);
});

async function checkFocusLoop(page: Page, visual: Locator, kind: 'lab' | 'question') {
  const expand = visual.getByRole('button', { name: `Expand ${kind} visual`, exact: true });
  await expand.click();
  await expect(visual).toHaveAttribute('role', 'dialog');
  const focusInside = () => visual.evaluate((element) => element.contains(document.activeElement));
  for (let index = 0; index < 12; index += 1) { await page.keyboard.press('Tab'); expect(await focusInside()).toBe(true); }
  for (let index = 0; index < 12; index += 1) { await page.keyboard.press('Shift+Tab'); expect(await focusInside()).toBe(true); }
  await page.keyboard.press('Escape');
  await expect(visual).not.toHaveAttribute('role', 'dialog');
  await expect(expand).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
}

test('expanded question and lab diagrams trap focus, restore it, and expose selected modes', async ({ page }) => {
  await enter(page, '#/labs/lab-pid');
  const lab = page.locator('.labVisualStage');
  await expect(lab).toBeVisible();
  await expect(lab.getByRole('button', { name: 'Live', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await checkFocusLoop(page, lab, 'lab');
  await lab.getByRole('button', { name: 'Reference', exact: true }).click();
  await expect(lab.getByRole('button', { name: 'Reference', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(lab.getByRole('button', { name: 'Live', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await checkFocusLoop(page, lab, 'lab');
  await page.goto('/#/practice/question/EE-00001');
  const question = page.locator('.questionVisualStage');
  await expect(question).toBeVisible();
  await expect(question.getByRole('button', { name: 'Schematic', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await checkFocusLoop(page, question, 'question');
  await question.getByRole('button', { name: 'Concept', exact: true }).click();
  await expect(question.getByRole('button', { name: 'Concept', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(question.getByRole('button', { name: 'Schematic', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await checkFocusLoop(page, question, 'question');
  await contained(page);
});

test('reference diagrams show loading, recover failed downloads, and leave live views usable', async ({ page }, testInfo) => {
  await enter(page, '#/labs/lab-pid');
  for (const [route, selector, liveLabel, pattern] of [
    ['/#/labs/lab-pid', '.labVisualStage', 'Live', '**/lab-pid-reference.svg*'],
    ['/#/practice/question/EE-00001', '.questionVisualStage', 'Schematic', '**/question-bank/images/IMG-0001.svg*'],
  ]) {
    await page.goto(route);
    let release: (() => void) | undefined;
    await page.route(pattern, async (request) => {
      if (request.request().url().includes('retry=')) await request.continue();
      else { await new Promise<void>((resolve) => { release = resolve; }); await request.abort(); }
    });
    const visual = page.locator(selector);
    await visual.getByRole('button', { name: 'Reference', exact: true }).click();
    await expect(visual.getByRole('status')).toContainText('Loading reference diagram');
    await expect.poll(() => Boolean(release)).toBe(true);
    release!();
    await expect(visual.getByRole('alert')).toContainText('Reference diagram unavailable');
    await expect(visual.locator('.referenceImageResource')).toHaveAttribute('aria-busy', 'false');
    await contained(page);
    await visual.locator('.referenceImageResource').screenshot({ path: testInfo.outputPath(`${liveLabel}-image-retry.png`) });
    await visual.getByRole('button', { name: 'Retry image' }).click();
    await expect(visual.getByRole('alert')).toHaveCount(0);
    await expect.poll(() => visual.locator('.referenceImageResource img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(visual.locator('.referenceImageResource')).toHaveAttribute('aria-busy', 'false');
    await visual.getByRole('button', { name: liveLabel, exact: true }).click();
    await expect(visual.locator('svg').last()).toBeVisible();
    await page.unroute(pattern);
  }
});
