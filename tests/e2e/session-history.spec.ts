import { expect, test, type Page } from '@playwright/test';
import { lessonQuestions as questions } from '../../src/data';
import { createSessionHistoryRecord, type SessionHistoryRecord } from '../../src/sessionHistoryModel';

const learnerKey = 'zyloxp-learner-state-v1';
const historyView = (page: Page) => page.getByRole('region', { name: 'Session history', exact: true });
const lesson = (page: Page) => page.getByRole('region', { name: 'Lesson question page', exact: true });
const state = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), learnerKey);
const progress = async (page: Page) => {
  const value = await state(page);
  return { xp: value.earnedXp, mastery: value.questionMastery, activity: value.activityHistory, completions: value.customSessionCompletions };
};
function record(id = 'archived-1', label = 'Circuit review', perfect = false): SessionHistoryRecord {
  return { ...createSessionHistoryRecord({
    source: 'custom', label, startedAt: 1700000000000, completedAt: 1700000120000, earnedXp: 45,
    questionIndices: [0, 1, 2], results: [0, 1, 2].map((index) => ({
      questionId: questions[index].id, result: index === 0 || perfect ? 'correct' : index === 1 ? 'wrong' : 'skipped',
      optionIndex: index === 0 || perfect ? questions[index].correctIndex : index === 1 ? (questions[index].correctIndex + 1) % questions[index].options.length : null,
      confidence: index === 2 && !perfect ? null : 'sure',
    })),
  }, questions)!, id };
}
function activeSprint() {
  return { source: 'custom', label: 'Unfinished practice', paused: false, completedAt: null,
    questionIndices: [0, 1], position: 1, selectedOption: null, answerConfidence: null,
    results: [{ questionId: questions[0].id, result: 'correct', optionIndex: questions[0].correctIndex, confidence: 'sure' }],
    earnedXp: questions[0].xp, diagnosticId: null, startedAt: Date.now() - 60000 };
}
async function enter(page: Page, records: SessionHistoryRecord[] = [record()], route = '/#/practice/history', extra = {}) {
  await page.addInitScript(({ learnerKey, records, extra }) => {
    if (sessionStorage.getItem('session-history-seeded')) return;
    localStorage.setItem(learnerKey, JSON.stringify({ earnedXp: 1300, sessionHistory: records, ...extra }));
    sessionStorage.setItem('session-history-seeded', 'yes');
  }, { learnerKey, records, extra });
  await page.goto(route);
  await page.getByRole('button', { name: 'Start learning', exact: true }).click();
  const dismiss = page.getByRole('button', { name: 'Dismiss notification', exact: true });
  if (await dismiss.isVisible()) await dismiss.click();
}

test('completion creates one durable review; refresh and browsing do not award progress twice', async ({ page }, info) => {
  await enter(page, [], '/#/practice', { activeSprint: activeSprint() });
  await expect(lesson(page)).toBeVisible();
  await lesson(page).getByRole('button', { name: 'Skip Prompt', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Sprint answer breakdown' })).toBeVisible();
  const saved = (await state(page)).sessionHistory;
  expect(saved).toHaveLength(1);
  expect(saved[0].items.map((item: { question: { id: string } }) => item.question.id)).toEqual([questions[0].id, questions[1].id]);
  const before = await progress(page);
  await expect(page).toHaveURL(new RegExp(`#/practice/history/${saved[0].id}$`));
  await page.reload();
  await expect(historyView(page).getByRole('heading', { name: 'Unfinished practice', exact: true })).toBeVisible();
  await expect(historyView(page).getByLabel('Archived session score')).toContainText('50%');
  await historyView(page).getByRole('button', { name: 'All sessions', exact: true }).click();
  await expect(historyView(page).getByRole('article')).toHaveCount(1);
  await historyView(page).getByRole('button', { name: /^Review Unfinished practice/ }).click();
  await historyView(page).locator('summary').first().click();
  await expect(historyView(page).getByRole('heading', { name: 'Worked solution', exact: true })).toBeVisible();
  expect(await progress(page)).toEqual(before);
  expect((await state(page)).sessionHistory).toEqual(saved);
  await page.screenshot({ path: info.outputPath('history-detail.png'), fullPage: true });
});

test('search, misses and browser navigation preserve the compact chronological history', async ({ page }, info) => {
  const perfect = { ...record('perfect', 'Perfect practice', true), completedAt: 1700000240000 };
  await enter(page, [record(), perfect]);
  await expect(historyView(page).getByRole('article').first()).toContainText('Perfect practice');
  await historyView(page).getByRole('checkbox', { name: 'With misses' }).check();
  await expect(historyView(page).getByRole('article')).toHaveCount(1);
  await historyView(page).getByRole('searchbox', { name: 'Search sessions' }).fill('nothing-matches');
  await expect(historyView(page).getByRole('heading', { name: 'No matching sessions' })).toBeVisible();
  await historyView(page).getByRole('button', { name: 'Clear filters' }).click();
  await expect(historyView(page).getByRole('searchbox', { name: 'Search sessions' })).toBeFocused();
  await historyView(page).getByRole('searchbox', { name: 'Search sessions' }).fill('Circuit review');
  await historyView(page).getByRole('button', { name: /^Review Circuit review/ }).click();
  await page.goBack();
  await expect(historyView(page).getByRole('searchbox')).toHaveValue('Circuit review');
  await historyView(page).getByRole('searchbox').fill('');
  await expect(historyView(page).getByRole('article')).toHaveCount(2);
  await page.screenshot({ path: info.outputPath('history-list.png'), fullPage: true });
});

test('history deep links preserve unfinished work, disable replacement and resume across refresh', async ({ page }) => {
  const unfinished = activeSprint();
  await enter(page, [record()], '/#/practice/history/archived-1', { activeSprint: unfinished });
  await expect(historyView(page)).toBeVisible();
  await expect(historyView(page).getByRole('button', { name: 'Retry 2 misses' })).toBeDisabled();
  await expect(historyView(page).getByRole('button', { name: 'Practice this set' })).toBeDisabled();
  expect((await state(page)).activeSprint).toMatchObject({ ...unfinished, paused: true });
  await page.reload();
  await expect(historyView(page)).toBeVisible();
  await historyView(page).getByRole('button', { name: 'Resume session', exact: true }).click();
  await expect(lesson(page)).toBeVisible();
  expect((await state(page)).activeSprint).toMatchObject(unfinished);
  await expect(page).toHaveURL(/#\/practice$/);
  await page.reload();
  await expect(lesson(page)).toBeVisible();
  expect((await state(page)).activeSprint).toMatchObject(unfinished);
  await page.goBack();
  await expect(historyView(page)).toBeVisible();
  expect((await state(page)).activeSprint.results).toEqual(unfinished.results);
  expect((await state(page)).activeSprint.paused).toBe(true);
});

for (const onlyMisses of [true, false]) {
  test(`${onlyMisses ? 'retry misses' : 'practice set'} starts exactly the archived questions without diagnostic rewards`, async ({ page }) => {
    const archived = { ...record(), source: 'diagnostic' as const };
    await enter(page, [archived], '/#/practice/history/archived-1');
    const before = await progress(page);
    await historyView(page).getByRole('button', { name: onlyMisses ? 'Retry 2 misses' : 'Practice this set', exact: true }).click();
    await expect(lesson(page)).toBeVisible();
    expect((await state(page)).activeSprint).toMatchObject({ source: 'review', diagnosticId: null, results: [],
      questionIndices: onlyMisses ? [1, 2] : [0, 1, 2] });
    expect((await state(page)).sessionHistory).toEqual([archived]);
    expect(await progress(page)).toEqual(before);
    await page.reload();
    await expect(lesson(page)).toBeVisible();
  });
}

test('changed and missing questions retain original solutions but cannot be replayed or bookmarked', async ({ page }) => {
  const archived = record();
  archived.items[1].question.prompt = 'Original prompt before the bank changed.';
  archived.items[2].question.id = 'removed-question';
  archived.items[2].answer.questionId = 'removed-question';
  await enter(page, [archived], '/#/practice/history/archived-1');
  await expect(historyView(page)).toContainText('1 of 3 questions are still available unchanged.');
  await expect(historyView(page).getByRole('button', { name: 'No available misses' })).toBeDisabled();
  for (const summary of await historyView(page).locator('summary').all()) await summary.click();
  await expect(historyView(page).getByRole('button', { name: 'Question changed or unavailable' })).toHaveCount(2);
  const changed = historyView(page).getByRole('article').nth(1);
  await expect(changed.getByRole('button', { name: 'Question changed or unavailable' })).toBeDisabled();
  await expect(changed).toContainText(archived.items[1].question.solution!);
  await historyView(page).getByRole('article').first().getByRole('button', { name: 'Save question' }).click();
  expect((await state(page)).bookmarkedQuestionIds).toContain(questions[0].id);
  await historyView(page).getByRole('button', { name: 'Practice this set' }).click();
  expect((await state(page)).activeSprint.questionIndices).toEqual([0]);
});

test('empty history and unknown IDs are honest and lead back to practice', async ({ page }) => {
  await enter(page, [], '/#/practice/history/missing', { lastSprintSummary: { correct: 5, total: 5, xp: 100 } });
  await expect(historyView(page).getByRole('heading', { name: 'Session not available' })).toBeVisible();
  await historyView(page).getByRole('button', { name: 'View recent sessions' }).click();
  await expect(historyView(page).getByRole('heading', { name: 'Your next session starts here' })).toBeVisible();
  await expect(historyView(page).getByRole('article')).toHaveCount(0);
  await historyView(page).getByRole('button', { name: 'Open practice' }).click();
  await expect(page).toHaveURL(/#\/practice$/);
  await page.getByRole('button', { name: 'Session history 0', exact: true }).click();
  await expect(historyView(page)).toBeVisible();
});

test('progress backup downloads and restores historical question snapshots', async ({ page }) => {
  await enter(page);
  const more = page.getByRole('button', { name: 'More', exact: true });
  if (await more.isVisible()) await more.click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const backup = page.getByRole('region', { name: 'Progress backup', exact: true });
  const downloadEvent = page.waitForEvent('download');
  await backup.getByRole('button', { name: 'Download backup' }).click();
  const stream = (await (await downloadEvent).createReadStream())!;
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const exported = JSON.parse(Buffer.concat(chunks).toString());
  expect(exported.data[learnerKey].sessionHistory).toEqual([record()]);
  const restored = record('restored-session', 'Restored circuit review');
  exported.data = { [learnerKey]: { earnedXp: 1300, sessionHistory: [restored] } };
  await backup.getByLabel('Choose a progress backup file').setInputFiles({
    name: 'session-history.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)),
  });
  await backup.getByRole('button', { name: 'Restore included data' }).click();
  await expect(historyView(page).getByRole('heading', { name: 'Restored circuit review' })).toBeVisible();
  await historyView(page).getByRole('button', { name: /^Review Restored circuit review/ }).click();
  await expect(historyView(page).getByRole('article')).toHaveCount(3);
});

test('history and expanded answers fit narrow screens and large text without nested scrolling', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const archived = record('long-session', 'CircuitAnalysis'.repeat(5));
  archived.items[0].question.options[0] = 'UnbrokenAnswer'.repeat(24);
  await enter(page, [archived]);
  await page.evaluate(() => document.documentElement.style.fontSize = '24px');
  async function checkFit() {
    expect(await historyView(page).evaluate((element) => ({
      container: element.scrollWidth <= element.clientWidth + 1,
      children: Array.from(element.querySelectorAll('button, input, h1, h2, dd, summary, .checkpointReviewPrompt'))
        .filter((el) => el.getClientRects().length).every((el) => {
          const box = el.getBoundingClientRect();
          return box.left >= 0 && box.right <= innerWidth && el.scrollWidth <= el.clientWidth + 1;
        }),
    }))).toEqual({ container: true, children: true });
  }
  await checkFit();
  await historyView(page).getByRole('button', { name: /^Review CircuitAnalysis/ }).click();
  await historyView(page).locator('summary').first().click();
  await checkFit();
  expect(await historyView(page).locator('.checkpointReviewList').evaluate((element) => getComputedStyle(element).overflowY)).toBe('visible');
  await historyView(page).locator('summary').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('history-narrow-large-text.png') });
});
