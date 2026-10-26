import { expect, test, type Page } from '@playwright/test';
import { generatedLessonQuestions as questions } from '../../src/questionBank.generated';

const learnerKey = 'zyloxp-learner-state-v1';
const library = (page: Page) => page.getByRole('region', { name: 'Saved questions', exact: true });
const builder = (page: Page) => page.getByRole('region', { name: 'Saved question session', exact: true });
const lesson = (page: Page) => page.getByRole('region', { name: 'Lesson question page', exact: true });
const state = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), learnerKey);

async function enter(page: Page, saved = questions.slice(0, 12).map((q) => q.id), extra = {}) {
  await page.addInitScript(({ learnerKey, saved, extra }) => {
    if (sessionStorage.getItem('saved-session-seeded')) return;
    localStorage.setItem(learnerKey, JSON.stringify({ bookmarkedQuestionIds: saved, ...extra }));
    localStorage.setItem('zyloxp-notebook-library-view-v1', 'questions');
    sessionStorage.setItem('saved-session-seeded', 'yes');
  }, { learnerKey, saved, extra });
  await page.goto('/#/notebook');
  await page.getByRole('button', { name: 'Start learning', exact: true }).click();
  const dismiss = page.getByRole('button', { name: 'Dismiss notification', exact: true });
  if (await dismiss.isVisible()) await dismiss.click();
}

async function answer(page: Page, correct = true) {
  const session = (await state(page)).activeSprint;
  const question = questions[session.questionIndices[session.position]];
  await lesson(page).locator('.answerButton').nth(correct ? question.correctIndex : (question.correctIndex + 1) % question.options.length).click();
  await expect(lesson(page).locator('.feedbackBox')).toBeVisible();
}

test('filtered session lineup matches the actual set, length and ordering', async ({ page }, info) => {
  await enter(page);
  await builder(page).getByRole('combobox', { name: 'Session length' }).selectOption('10');
  await builder(page).locator('summary').click();
  const expected = await library(page).locator('.notebookQuestionRow h3').allTextContents();
  await expect(builder(page).locator('li')).toHaveCount(10);
  expect(await builder(page).locator('li strong').allTextContents()).toEqual(expected.slice(0, 10));
  await builder(page).evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.screenshot({ path: info.outputPath('saved-session-lineup.png') });
  await library(page).getByRole('searchbox', { name: 'Search saved questions' }).fill('operational amplifier');
  await expect(builder(page).getByRole('button', { name: 'Start 1-question session' })).toBeEnabled();
  await library(page).getByRole('combobox', { name: 'Topic', exact: true }).selectOption('DC Circuit Analysis');
  await expect(builder(page).getByRole('button', { name: 'No matching questions' })).toBeDisabled();
  await library(page).getByRole('button', { name: 'Clear filters', exact: true }).click();
  await library(page).getByRole('combobox', { name: 'Question order' }).selectOption('unattempted');
  const lineup = await builder(page).locator('li strong').allTextContents();
  await builder(page).getByRole('button', { name: 'Start 10-question session' }).click();
  await expect(lesson(page)).toBeVisible();
  const session = (await state(page)).activeSprint;
  expect(session.source).toBe('saved');
  expect(session.questionIndices.map((index: number) => questions[index].subtopic)).toEqual(lineup);
  await lesson(page).getByRole('button', { name: 'Exit sprint', exact: true }).click();
  await expect(library(page)).toBeVisible();
  expect((await state(page)).bookmarkedQuestionIds).toHaveLength(12);
  expect((await state(page)).activeSprint).toBeNull();
});

test('pause, resume and reload keep answers and the original set after bookmarks change', async ({ page }) => {
  await enter(page, [questions[0].id, questions[1].id]);
  await builder(page).getByRole('button', { name: 'Start 2-question session' }).click();
  await answer(page);
  const before = (await state(page)).activeSprint;
  await lesson(page).getByRole('button', { name: 'Saved', exact: true }).click();
  await page.getByRole('button', { name: /^Back from / }).click();
  await expect(builder(page)).toContainText('1 of 2 answered');
  await expect(library(page).getByRole('button', { name: /Open saved question/ })).toBeDisabled();
  expect((await state(page)).activeSprint.paused).toBe(true);
  await page.reload();
  await builder(page).getByRole('button', { name: 'Resume session' }).click();
  await expect(lesson(page).locator('.feedbackBox')).toBeVisible();
  expect((await state(page)).activeSprint).toEqual({ ...before, paused: false });
  await page.reload();
  await expect(lesson(page).locator('.feedbackBox')).toBeVisible();
  expect((await state(page)).activeSprint.questionIndices).toEqual(before.questionIndices);
  await lesson(page).getByRole('button', { name: 'Next Prompt', exact: true }).click();
  await answer(page);
  await lesson(page).getByRole('button', { name: 'View Sprint Results' }).click();
  await expect(page.getByRole('region', { name: 'Saved Questions Session results' })).toBeVisible();
  await page.getByRole('button', { name: 'Practice this set again', exact: true }).click();
  expect((await state(page)).activeSprint.questionIndices).toEqual(before.questionIndices);
  expect((await state(page)).activeSprint.results).toEqual([]);
  expect((await state(page)).bookmarkedQuestionIds).toHaveLength(1);
});

test('mixed-topic sessions award progress to each answered skill and return to the library', async ({ page }) => {
  await enter(page, [questions[0].id, questions[1].id], {
    skillProgress: { 'voltage-current-resistance': 20, 'signals-ac': 30 },
  });
  await builder(page).getByRole('button', { name: 'Start 2-question session' }).click();
  const indices: number[] = (await state(page)).activeSprint.questionIndices;
  for (let i = 0; i < indices.length; i++) {
    const before = await state(page);
    await answer(page);
    const after = await state(page);
    const skill = questions[indices[i]].topic === 'DC Circuit Analysis' ? 'voltage-current-resistance' : 'signals-ac';
    const other = skill === 'signals-ac' ? 'voltage-current-resistance' : 'signals-ac';
    expect(after.skillProgress[skill]).toBe(before.skillProgress[skill] + 4);
    expect(after.skillProgress[other]).toBe(before.skillProgress[other]);
    expect(after.earnedXp).toBe(before.earnedXp + questions[indices[i]].xp);
    await lesson(page).getByRole('button', { name: i === 0 ? 'Next Prompt' : 'View Sprint Results', exact: true }).click();
  }
  await expect(page.getByRole('region', { name: 'Sprint score' })).toContainText('100%');
  const finished = await state(page);
  expect(finished.lastSprintSummary.source).toBe('saved');
  await page.getByRole('button', { name: /^Back from / }).click();
  await expect(library(page)).toBeVisible();
  await page.reload();
  expect((await state(page)).lastSprintSummary).toEqual(finished.lastSprintSummary);
  expect((await state(page)).earnedXp).toBe(finished.earnedXp);
});

test('missed-question review includes only mistakes from this saved set', async ({ page }) => {
  await enter(page, [questions[0].id, questions[1].id, questions[2].id]);
  await builder(page).getByRole('button', { name: 'Start 3-question session' }).click();
  const indices: number[] = (await state(page)).activeSprint.questionIndices;
  for (let i = 0; i < 3; i++) {
    await answer(page, i === 0);
    await lesson(page).getByRole('button', { name: i < 2 ? 'Next Prompt' : 'View Sprint Results', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Review 2 misses', exact: true }).click();
  const session = (await state(page)).activeSprint;
  expect(session.label).toBe('Saved Questions Review');
  expect(session.questionIndices).toEqual(indices.slice(1));
  expect(session.results).toEqual([]);
  await expect(lesson(page).getByRole('region', { name: 'Saved Questions Review progress' })).toContainText('0/2 answered');
});

test('an unrelated active session is offered for resumption even with no saved questions', async ({ page }) => {
  const activeSprint = { source: 'custom', label: 'Existing practice', paused: true, completedAt: null, questionIndices: [0, 1], position: 0, selectedOption: null, answerConfidence: null, results: [], earnedXp: 0, diagnosticId: null, startedAt: Date.now() };
  await enter(page, [], { activeSprint });
  await expect(builder(page)).toContainText('Existing practice');
  await expect(builder(page).getByRole('button', { name: /Start/ })).toHaveCount(0);
  await builder(page).getByRole('button', { name: 'Resume session' }).click();
  await expect(lesson(page)).toBeVisible();
  expect((await state(page)).activeSprint).toEqual({ ...activeSprint, paused: false });
});

test('weakest and unattempted ordering become the actual session order', async ({ page }) => {
  await enter(page, questions.slice(0, 3).map((q) => q.id), {
    questionMastery: {
      [questions[0].id]: { attempts: 5, correct: 5, lastResult: 'correct', lastAnsweredAt: Date.now() },
      [questions[1].id]: { attempts: 4, correct: 1, lastResult: 'wrong', lastAnsweredAt: Date.now() },
    },
  });
  await library(page).getByRole('combobox', { name: 'Question order' }).selectOption('weakest');
  await builder(page).getByRole('button', { name: 'Start 3-question session' }).click();
  expect((await state(page)).activeSprint.questionIndices).toEqual([1, 0, 2]);
  await lesson(page).getByRole('button', { name: 'Exit sprint', exact: true }).click();
  await library(page).getByRole('combobox', { name: 'Question order' }).selectOption('unattempted');
  await builder(page).getByRole('button', { name: 'Start 3-question session' }).click();
  expect((await state(page)).activeSprint.questionIndices[0]).toBe(2);
});

test('one saved question can be skipped, reviewed and completed without padding the set', async ({ page }) => {
  await enter(page, [questions[0].id]);
  await builder(page).getByRole('button', { name: 'Start 1-question session' }).click();
  expect((await state(page)).activeSprint.questionIndices).toEqual([0]);
  await lesson(page).getByRole('button', { name: 'Skip Prompt', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Sprint answer breakdown' })).toContainText('Skipped');
  await page.getByRole('button', { name: 'Review 1 miss', exact: true }).click();
  expect((await state(page)).activeSprint.questionIndices).toEqual([0]);
  await answer(page);
  await lesson(page).getByRole('button', { name: 'View Sprint Results' }).click();
  await expect(page.getByRole('region', { name: 'Sprint score' })).toContainText('100%');
  await expect(page.getByRole('button', { name: 'No misses to review', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Open saved questions', exact: true }).click();
  await expect(library(page)).toBeVisible();
  expect((await state(page)).bookmarkedQuestionIds).toEqual([questions[0].id]);
});

test('lineup and controls stay readable at narrow widths and enlarged text', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await enter(page);
  await builder(page).getByRole('combobox', { name: 'Session length' }).selectOption('10');
  await builder(page).locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(builder(page).locator('details')).toHaveAttribute('open', '');
  for (const size of [16, 24]) {
    await page.evaluate((size) => document.documentElement.style.fontSize = `${size}px`, size);
    const fits = await builder(page).evaluate((element) => {
      const labels = Array.from(element.querySelectorAll('button, select, summary, strong, h3, li span'));
      return element.scrollWidth <= element.clientWidth && labels.every((el) => {
        const box = el.getBoundingClientRect();
        return box.left >= 0 && box.right <= innerWidth && el.scrollWidth <= el.clientWidth + 1;
      });
    });
    expect(fits).toBe(true);
  }
  await builder(page).evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.screenshot({ path: info.outputPath('saved-session-narrow.png') });
});
