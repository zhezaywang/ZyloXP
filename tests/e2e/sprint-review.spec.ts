import { expect, test, type Page } from '@playwright/test';
import { generatedLessonQuestions as questions } from '../../src/questionBank.generated';

const learnerKey = 'zyloxp-learner-state-v1';
const lesson = (page: Page) => page.getByRole('region', { name: 'Lesson question page', exact: true });
const review = (page: Page) => page.getByRole('region', { name: 'Sprint answer breakdown', exact: true });
const state = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), learnerKey);
const learningRecord = async (page: Page) => {
  const value = await state(page);
  return { xp: value.earnedXp, mastery: value.questionMastery, activity: value.activityHistory,
    summary: value.lastSprintSummary, customCompletions: value.customSessionCompletions };
};

async function enter(page: Page, source = 'custom', overrides = {}) {
  const activeSprint = {
    source, label: 'Review test session', paused: false, completedAt: null,
    questionIndices: [0, 1, 2, 3], position: 0, selectedOption: null, answerConfidence: null,
    results: [], earnedXp: 0, diagnosticId: null, startedAt: Date.now(), ...overrides,
  };
  await page.addInitScript(({ learnerKey, activeSprint, outsideId }) => {
    if (sessionStorage.getItem('sprint-review-seeded')) return;
    localStorage.setItem(learnerKey, JSON.stringify({ activeSprint, earnedXp: 1300,
      tunedCareerRole: 'Electronics Design Engineer',
      skillProgress: { 'dc-analysis': 12, transients: 70, 'circuit-reading': 50 },
      questionMastery: { [outsideId]: { attempts: 2, correct: 0, lastResult: 'wrong', lastAnsweredAt: Date.now() } },
    }));
    sessionStorage.setItem('sprint-review-seeded', 'yes');
  }, { learnerKey, activeSprint, outsideId: questions[19].id });
  await page.goto('/#/practice');
  await page.getByRole('button', { name: 'Start learning', exact: true }).click();
  const dismiss = page.getByRole('button', { name: 'Dismiss notification', exact: true });
  if (await dismiss.isVisible()) await dismiss.click();
  await expect(lesson(page)).toBeVisible();
}

async function answer(page: Page, correct: boolean, confidence: 'Sure' | 'Guess' | 'Unsure' = 'Sure') {
  const session = (await state(page)).activeSprint;
  const question = questions[session.questionIndices[session.position]];
  await lesson(page).getByRole('group', { name: 'Answer confidence' }).getByRole('button', { name: confidence, exact: true }).click();
  const optionIndex = correct ? question.correctIndex : (question.correctIndex + 1) % question.options.length;
  await lesson(page).locator('.answerButton').nth(optionIndex).click();
  await expect(lesson(page).locator('.feedbackBox')).toBeVisible();
  return optionIndex;
}

async function finishMixedSession(page: Page) {
  await answer(page, true);
  await lesson(page).getByRole('button', { name: 'Next Prompt', exact: true }).click();
  const wrongChoice = await answer(page, false);
  await lesson(page).getByRole('button', { name: 'Next Prompt', exact: true }).click();
  await answer(page, true, 'Guess');
  await lesson(page).getByRole('button', { name: 'Next Prompt', exact: true }).click();
  await lesson(page).getByRole('button', { name: 'Skip Prompt', exact: true }).click();
  await expect(review(page)).toBeVisible();
  return wrongChoice;
}

test('completed sessions reveal exact choices, solutions, assumptions and confidence without awarding progress twice', async ({ page }, info) => {
  await enter(page);
  await expect(review(page)).toHaveCount(0);
  const wrongChoice = await finishMixedSession(page);
  await expect(page.getByRole('region', { name: 'Sprint score' })).toContainText('50%');
  const nextStep = page.getByRole('complementary', { name: 'Recommended next step' });
  await expect(nextStep.getByRole('heading', { name: 'DC Circuit Analysis', exact: true })).toBeVisible();
  const before = await learningRecord(page);
  await expect(review(page).getByRole('article')).toHaveCount(4);
  await expect(review(page).getByRole('heading', { name: 'Worked solution' })).not.toBeVisible();
  await review(page).getByRole('button', { name: 'Missed 2', exact: true }).click();
  const wrong = review(page).getByRole('article').first();
  await expect(wrong.getByLabel('Question 2', { exact: true })).toBeVisible();
  await wrong.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(wrong.locator('dd').first()).toHaveText(`${String.fromCharCode(65 + wrongChoice)}. ${questions[1].options[wrongChoice]}`);
  await expect(wrong.locator('dd').last()).toHaveText(`${String.fromCharCode(65 + questions[1].correctIndex)}. ${questions[1].options[questions[1].correctIndex]}`);
  await expect(wrong).toContainText('Confidence: Sure');
  await expect(wrong.getByRole('heading', { name: 'Worked solution', exact: true })).toBeVisible();
  await expect(wrong.getByRole('heading', { name: 'Assumptions', exact: true })).toBeVisible();
  await wrong.getByRole('button', { name: 'Save question', exact: true }).click();
  await expect(wrong.getByRole('button', { name: 'Saved question', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect((await state(page)).bookmarkedQuestionIds).toContain(questions[1].id);
  await wrong.getByRole('button', { name: 'Saved question', exact: true }).click();
  expect((await state(page)).bookmarkedQuestionIds).not.toContain(questions[1].id);
  expect(await learningRecord(page)).toEqual(before);
  await wrong.evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.screenshot({ path: info.outputPath('session-answer-review.png') });
  await nextStep.getByRole('button', { name: 'Practice this skill', exact: true }).click();
  await expect(lesson(page).locator('.lessonPageHeader .eyebrow')).toHaveText('Practice / DC Circuit Analysis');
});

test('uncertainty includes correct guesses but not skipped questions and empty filters restore keyboard focus', async ({ page }) => {
  await enter(page);
  await finishMixedSession(page);
  await review(page).getByRole('button', { name: 'Uncertain 1', exact: true }).click();
  await expect(review(page).getByRole('article')).toHaveCount(1);
  await expect(review(page).getByLabel('Question 3', { exact: true })).toBeVisible();
  await expect(review(page).getByText('Correct', { exact: true })).toBeVisible();
  await review(page).getByRole('button', { name: 'Skipped 1', exact: true }).click();
  await review(page).locator('summary').click();
  await expect(review(page).locator('dd').first()).toHaveText('Skipped');
  await expect(review(page)).not.toContainText('Confidence:');
  await page.getByRole('button', { name: 'Review 2 misses', exact: true }).click();
  await answer(page, true);
  await lesson(page).getByRole('button', { name: 'Next Prompt', exact: true }).click();
  await answer(page, true);
  await lesson(page).getByRole('button', { name: 'View Sprint Results', exact: true }).click();
  await review(page).getByRole('button', { name: 'Missed 0', exact: true }).click();
  await expect(review(page)).toContainText('No missed questions in this session.');
  await expect(review(page).getByRole('article')).toHaveCount(0);
  await review(page).getByRole('button', { name: 'Show all answers' }).click();
  await expect(review(page).getByRole('button', { name: 'All 2', exact: true })).toBeFocused();
});

test('per-question choices and confidence survive an active-session reload', async ({ page }) => {
  await enter(page, 'power', { questionIndices: [0, 1] });
  const choice = await answer(page, false, 'Unsure');
  const recorded = (await state(page)).activeSprint.results;
  expect(recorded[0]).toEqual({ questionId: questions[0].id, result: 'wrong', optionIndex: choice, confidence: 'unsure' });
  await lesson(page).getByRole('button', { name: 'Next Prompt', exact: true }).click();
  await page.reload();
  expect((await state(page)).activeSprint.results).toEqual(recorded);
  await answer(page, true, 'Sure');
  await lesson(page).getByRole('button', { name: 'View Sprint Results', exact: true }).click();
  await review(page).getByRole('article').first().locator('summary').click();
  await expect(review(page).getByRole('article').first()).toContainText('Confidence: Unsure');
  await expect(review(page).locator('dd').first()).toHaveText(`${String.fromCharCode(65 + choice)}. ${questions[0].options[choice]}`);
});

test('older active sessions retain their results and explicitly identify missing answer snapshots', async ({ page }) => {
  await enter(page, 'custom', { questionIndices: [0, 1, 2], position: 2, results: [
    { questionId: questions[0].id, result: 'correct' },
    { questionId: questions[1].id, result: 'wrong', optionIndex: 999, confidence: 'sure' },
  ] });
  await answer(page, true);
  await lesson(page).getByRole('button', { name: 'View Sprint Results', exact: true }).click();
  for (const index of [0, 1]) {
    const item = review(page).getByRole('article').nth(index);
    await item.locator('summary').click();
    await expect(item.locator('dd').first()).toHaveText('Answer not recorded for this session');
    await expect(item).toContainText('Confidence not recorded');
    await expect(item).not.toContainText('undefined');
  }
  await expect(page.getByRole('region', { name: 'Sprint score' })).toContainText('67%');
});

for (const source of ['custom', 'power', 'career', 'diagnostic', 'review']) {
  test(`${source} review includes only this session's misses, not unrelated question history`, async ({ page }) => {
    await enter(page, source, source === 'diagnostic' ? { diagnosticId: 'circuits' } : {});
    await finishMixedSession(page);
    const before = await learningRecord(page);
    if (source === 'diagnostic') {
      await expect(page.getByRole('complementary', { name: 'Recommended next step' })
        .getByRole('heading', { name: 'Signals and AC', exact: true })).toBeVisible();
    }
    await page.getByRole('button', { name: 'Review 2 misses', exact: true }).click();
    const session = (await state(page)).activeSprint;
    expect(session.questionIndices).toEqual([1, 3]);
    expect(session.diagnosticId).toBeNull();
    expect(session.label).toBe('Session Misses');
    expect(session.results).toEqual([]);
    expect(await learningRecord(page)).toEqual(before);
  });
}

test('expanded reviews wrap long content with large text and one natural page scroll on narrow screens', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await enter(page, 'custom', { questionIndices: [0] });
  await answer(page, false);
  await lesson(page).getByRole('button', { name: 'View Sprint Results', exact: true }).click();
  const item = review(page).getByRole('article');
  await item.locator('summary').click();
  for (const size of [16, 24]) {
    await page.evaluate((size) => document.documentElement.style.fontSize = `${size}px`, size);
    const fits = await review(page).evaluate((element) => ({
      container: element.scrollWidth <= element.clientWidth,
      naturalScroll: getComputedStyle(element.querySelector('.checkpointReviewList')!).overflowY === 'visible',
      children: Array.from(element.querySelectorAll('button, summary, h3, dd, .checkpointReviewPrompt, .checkpointReviewOutcome'))
        .filter((el) => el.getClientRects().length).every((el) => {
          const box = el.getBoundingClientRect();
          return box.left >= 0 && box.right <= innerWidth && el.scrollWidth <= el.clientWidth + 1;
        }),
    }));
    expect(fits).toEqual({ container: true, naturalScroll: true, children: true });
  }
  await item.evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.screenshot({ path: info.outputPath('session-review-narrow.png') });
  const save = item.getByRole('button', { name: 'Save question', exact: true });
  await save.scrollIntoViewIfNeeded();
  expect((await save.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await save.click();
  await expect(item.getByRole('button', { name: 'Saved question', exact: true })).toBeVisible();
});
