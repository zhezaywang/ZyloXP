import { expect, test, type Page } from '@playwright/test';
import { lessonQuestions as questions } from '../../src/data';
import { createSessionHistoryRecord } from '../../src/sessionHistoryModel';

const learnerKey = 'zyloxp-learner-state-v1';
const lesson = (page: Page) => page.getByRole('region', { name: 'Lesson question page', exact: true });
const help = (page: Page) => page.getByRole('region', { name: 'Mistake explanation', exact: true });
const quick = (page: Page) => page.getByRole('region', { name: 'Quick understanding check', exact: true });
const state = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), learnerKey);
const progress = async (page: Page) => {
  const value = await state(page);
  const hearts = await page.evaluate(() => localStorage.getItem('zyloxp-heart-state-v1'));
  return { xp: value.earnedXp, hearts, mastery: value.questionMastery,
    activity: value.activityHistory, exam: value.checkpointExam, session: value.activeSprint, history: value.sessionHistory };
};
async function enter(page: Page, route = '/#/practice/question/EE-00001', extra = {}) {
  await page.addInitScript(({ key, extra }) => {
    if (sessionStorage.getItem('mistake-help-seeded')) return;
    localStorage.setItem(key, JSON.stringify({ earnedXp: 1300, ...extra }));
    sessionStorage.setItem('mistake-help-seeded', 'yes');
  }, { key: learnerKey, extra });
  await page.goto(route);
  await page.getByRole('button', { name: 'Start learning', exact: true }).click();
  const dismiss = page.getByRole('button', { name: 'Dismiss notification', exact: true });
  if (await dismiss.isVisible()) await dismiss.click();
}

test('incorrect feedback offers optional explanation, exact choices and guided checks without re-awarding progress', async ({ page }, info) => {
  await enter(page);
  await expect(page.getByRole('button', { name: 'Explain my mistake', exact: true })).toHaveCount(0);
  await lesson(page).locator('.answerButton').nth(0).click();
  const button = lesson(page).getByRole('button', { name: 'Explain my mistake', exact: true });
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(help(page)).toHaveCount(0);
  await expect(lesson(page).locator('.solutionLead')).toHaveCount(0);
  const before = await progress(page);
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(help(page)).toBeVisible();
  await expect(help(page).locator('dd').first()).toHaveText('A. 18 A');
  await expect(help(page).locator('dd').last()).toHaveText('C. 1 A');
  await expect(help(page)).toContainText(questions[0].solution!);
  await expect(help(page)).toContainText(questions[0].assumptions!);
  await expect(help(page).locator('.mistakeExplanationReason')).toContainText('18 A is greater than the worked result, 1 A.');
  await expect(help(page).locator('.checkpointWorkedSteps')).toContainText('8 / 8 = 1 A');
  await help(page).getByRole('button', { name: 'Formula', exact: true }).click();
  await expect(help(page).getByRole('button', { name: 'Formula', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(help(page).getByRole('status')).toContainText('Start from I = V/R.');
  await help(page).getByRole('button', { name: 'Units', exact: true }).click();
  await expect(help(page).getByRole('status')).toContainText('Volts divided by ohms gives amperes.');
  await help(page).getByRole('button', { name: 'Final check', exact: true }).click();
  await expect(help(page).getByRole('status')).toContainText('Multiply your chosen current by the resistance.');
  expect(await progress(page)).toEqual(before);
  await help(page).evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.screenshot({ path: info.outputPath('mistake-guidance.png') });
  await lesson(page).getByRole('button', { name: 'Hide explanation', exact: true }).click();
  await expect(help(page)).toHaveCount(0);
  await expect(button).toBeFocused();
  await button.click();
  await expect(help(page)).toBeVisible();
  expect(await progress(page)).toEqual(before);
  await lesson(page).getByRole('button', { name: 'Next Prompt', exact: true }).click();
  await expect(help(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Explain my mistake', exact: true })).toHaveCount(0);
});

test('correct answers keep their ordinary feedback without a mistake button', async ({ page }) => {
  await enter(page);
  await lesson(page).locator('.answerButton').nth(questions[0].correctIndex).click();
  await expect(lesson(page).locator('.feedbackBox.success')).toBeVisible();
  await expect(lesson(page).locator('.solutionLead')).toHaveText(questions[0].solution!);
  await expect(page.getByRole('button', { name: 'Explain my mistake', exact: true })).toHaveCount(0);
});

for (const scenario of [
  { id: 'EE-112501', option: 1, feedback: 'opposite sign', focus: 'Concept', guidance: 'minus sign records the inversion' },
  { id: 'EE-150001', option: 0, feedback: 'A higher rate can be used for sampling', focus: 'Final check', guidance: 'sample above the boundary' },
  { id: 'EE-187501', option: 1, feedback: 'differs at the displayed precision', focus: 'Final check', guidance: 'highest unsigned code' },
  { id: 'EE-37501', option: 0, feedback: 'differs at the displayed precision', focus: 'Units', guidance: 'kohm multiplied by microfarads gives milliseconds' },
]) {
  test(`choice-specific teaching for ${scenario.id} is visible and does not change progress`, async ({ page }, info) => {
    await enter(page, `/#/practice/question/${scenario.id}`);
    await lesson(page).locator('.answerButton').nth(scenario.option).click();
    const before = await progress(page);
    await lesson(page).getByRole('button', { name: 'Explain my mistake', exact: true }).click();
    await expect(help(page).locator('.mistakeExplanationReason')).toContainText(scenario.feedback);
    await help(page).getByRole('button', { name: scenario.focus, exact: true }).click();
    await expect(help(page).getByRole('status')).toContainText(scenario.guidance);
    expect(await progress(page)).toEqual(before);
    expect(await help(page).evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    if (scenario.id === 'EE-187501') {
      await expect(help(page).locator('.checkpointWorkedSteps')).toContainText('2^12 = 4096');
      await expect(help(page).locator('.checkpointWorkedSteps')).toContainText('10/4096 = 0.00244140625 V');
      await help(page).screenshot({ path: info.outputPath('adc-explanation.png') });
    }
  });
}

test('equivalent archived answers flag the answer key without blaming the learner', async ({ page }) => {
  const archived = createSessionHistoryRecord({ source: 'custom', label: 'Equivalent units',
    startedAt: 1000, completedAt: 61000, earnedXp: 0, questionIndices: [0],
    results: [{ questionId: questions[0].id, result: 'wrong', optionIndex: 0 }],
  }, questions)!;
  archived.items[0].question.options[0] = '1000 mA';
  await enter(page, `/#/practice/history/${archived.id}`, { sessionHistory: [archived] });
  const before = await progress(page);
  await page.getByRole('button', { name: 'Explain my mistake', exact: true }).click();
  await expect(help(page).getByRole('heading', { name: 'Check this answer', exact: true })).toBeVisible();
  await expect(help(page)).toContainText('represent the same value after unit conversion');
  await expect(help(page).locator('dt').last()).toHaveText('Saved answer key');
  await expect(help(page).getByRole('button', { name: 'Try a quick check' })).toHaveCount(0);
  expect(await progress(page)).toEqual(before);
});

test('resuming an answered session keeps explanation opt-in and retains the recorded choice', async ({ page }) => {
  await enter(page, '/#/practice', { activeSprint: {
    source: 'custom', label: 'Mistake help session', paused: false, completedAt: null,
    questionIndices: [0, 1], position: 0, selectedOption: null, answerConfidence: null,
    results: [], earnedXp: 0, diagnosticId: null, startedAt: Date.now(),
  } });
  await lesson(page).locator('.answerButton').nth(0).click();
  await lesson(page).getByRole('button', { name: 'Explain my mistake' }).click();
  await expect(help(page)).toBeVisible();
  const before = await progress(page);
  await page.reload();
  await expect(help(page)).toHaveCount(0);
  await lesson(page).getByRole('button', { name: 'Explain my mistake' }).click();
  await expect(help(page).locator('dd').first()).toHaveText('A. 18 A');
  expect(await progress(page)).toEqual(before);
});

test('archived mistakes are explainable directly without opening the answer review or reading updated bank text', async ({ page }) => {
  const archived = createSessionHistoryRecord({ source: 'custom', label: 'Archived work',
    startedAt: 1000, completedAt: 61000, earnedXp: 0, questionIndices: [0, 1, 2],
    results: [
      { questionId: questions[0].id, result: 'wrong', optionIndex: 0, confidence: 'sure' },
      { questionId: questions[1].id, result: 'wrong' },
      { questionId: questions[2].id, result: 'skipped' },
    ],
  }, questions)!;
  archived.items[0].question.solution = 'Original worked steps saved with this session.';
  archived.items[0].question.prompt = 'The original question as it appeared in this session.';
  await enter(page, `/#/practice/history/${archived.id}`, { sessionHistory: [archived] });
  const review = page.getByRole('region', { name: 'Sprint answer breakdown' });
  await expect(review.getByRole('button', { name: 'Explain my mistake' })).toHaveCount(1);
  await review.getByRole('button', { name: 'Explain my mistake' }).click();
  await expect(help(page)).toContainText('Original worked steps saved with this session.');
  await expect(help(page)).toContainText('The original question as it appeared in this session.');
  await expect(help(page).locator('.checkpointWorkedSteps')).toHaveCount(0);
  await expect(review.locator('details[open]')).toHaveCount(0);
  const before = await progress(page);
  await help(page).getByRole('button', { name: 'Units', exact: true }).click();
  expect(await progress(page)).toEqual(before);
});

test('checkpoint guidance is available only for recorded mistakes after submission', async ({ page }) => {
  const now = Date.now();
  const exam = { id: 'mistake-checkpoint', questionIds: questions.slice(0, 5).map((q) => q.id),
    config: { domainId: 'all', length: 5, timing: 'untimed' }, createdAt: now, startedAt: now,
    completedAt: null, expiresAt: null, currentIndex: 0, score: null, bonusXp: 0, earnedXp: 0,
    answers: Object.fromEntries(questions.slice(0, 5).map((question, index) => [question.id,
      { optionIndex: index === 0 ? 0 : question.correctIndex, confidence: 'high', flagged: false }])) };
  await enter(page, '/#/practice/checkpoint', { checkpointExam: exam });
  await expect(page.getByRole('region', { name: 'Active Checkpoint Exam' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Explain my mistake' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Try a quick check' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Submit checkpoint', exact: true }).click();
  const review = page.getByRole('region', { name: 'Answer review', exact: true });
  await expect(review).toBeVisible();
  await expect(review.getByRole('button', { name: 'Explain my mistake' })).toHaveCount(1);
  const before = await progress(page);
  await review.getByRole('button', { name: 'Explain my mistake' }).click();
  await expect(help(page)).toContainText(questions[0].solution!);
  await help(page).getByRole('button', { name: 'Try a quick check' }).click();
  await quick(page).getByRole('radio', { name: 'It halves', exact: true }).check();
  await quick(page).getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(quick(page).getByRole('status', { name: 'Quick check feedback' })).toContainText("That's right");
  expect(await progress(page)).toEqual(before);
});

test('explanations wrap at narrow widths and enlarged text with reachable touch controls', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await enter(page);
  await lesson(page).locator('.answerButton').nth(0).click();
  await page.evaluate(() => document.documentElement.style.fontSize = '24px');
  await lesson(page).getByRole('button', { name: 'Explain my mistake' }).click();
  expect(await help(page).evaluate((element) => ({
    fits: element.scrollWidth <= element.clientWidth + 1,
    children: Array.from(element.querySelectorAll('button, h3, h4, dd, p, li'))
      .filter((el) => el.getClientRects().length).every((el) => {
        const box = el.getBoundingClientRect();
        return box.left >= 0 && box.right <= innerWidth && el.scrollWidth <= el.clientWidth + 1;
      }),
  }))).toEqual({ fits: true, children: true });
  for (const button of await help(page).getByRole('button').all()) {
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await help(page).getByRole('button', { name: 'Units', exact: true }).click();
  await help(page).getByRole('status').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('mistake-guidance-narrow.png') });
  await help(page).getByRole('button', { name: 'Try a quick check' }).click();
  await quick(page).getByRole('radio', { name: 'It stays the same' }).check();
  await quick(page).getByRole('button', { name: 'Check answer', exact: true }).click();
  await quick(page).getByRole('button', { name: 'Show hint', exact: true }).click();
  expect(await quick(page).evaluate((element) => ({
    fits: element.scrollWidth <= element.clientWidth + 1,
    children: Array.from(element.querySelectorAll('button, legend, label, p, h4, h5'))
      .filter((el) => el.getClientRects().length).every((el) => {
        const box = el.getBoundingClientRect();
        return box.left >= 0 && box.right <= innerWidth && el.scrollWidth <= el.clientWidth + 1;
      }),
  }))).toEqual({ fits: true, children: true });
  for (const target of await quick(page).locator('button, label').all()) {
    expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await quick(page).evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await quick(page).screenshot({ path: info.outputPath('quick-check-narrow.png') });
  const feedback = quick(page).getByRole('status', { name: 'Quick check feedback' });
  await feedback.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect(feedback).toContainText('The voltage is unchanged, but the resistance is not.');
  await expect(feedback.locator('p')).toBeInViewport({ ratio: 1 });
  const feedbackBox = (await feedback.boundingBox())!;
  expect(feedbackBox.y).toBeGreaterThanOrEqual(0);
  expect(feedbackBox.y + feedbackBox.height).toBeLessThanOrEqual(660);
  await page.screenshot({ path: info.outputPath('quick-check-narrow-feedback.png') });
});

test('quick checks support keyboard answers, hints and retries without changing the original result', async ({ page }, info) => {
  await enter(page);
  await lesson(page).locator('.answerButton').nth(0).click();
  await expect(page.getByRole('button', { name: 'Try a quick check' })).toHaveCount(0);
  const before = await progress(page);
  await lesson(page).getByRole('button', { name: 'Explain my mistake' }).click();
  await expect(quick(page)).toHaveCount(0);
  await help(page).getByRole('button', { name: 'Try a quick check' }).click();
  const submit = quick(page).getByRole('button', { name: 'Check answer', exact: true });
  const feedback = quick(page).getByRole('status', { name: 'Quick check feedback' });
  await expect(submit).toBeDisabled();
  await expect(feedback).toBeEmpty();
  await expect(quick(page).locator('.mistakeQuickCheckHint')).toBeHidden();
  await quick(page).getByRole('button', { name: 'Show hint', exact: true }).click();
  await expect(quick(page).locator('.mistakeQuickCheckHint')).toContainText('Only the denominator changes');
  await quick(page).getByRole('button', { name: 'Hide hint', exact: true }).click();
  await expect(quick(page).locator('.mistakeQuickCheckHint')).toBeHidden();
  await quick(page).getByRole('radio', { name: 'It doubles', exact: true }).focus();
  await page.keyboard.press('Space');
  await submit.focus();
  await page.keyboard.press('Enter');
  await expect(feedback).toContainText('Not quite');
  await expect(feedback).toContainText('Doubling R gives V/(2R)');
  await expect(lesson(page).locator('.answerButton').nth(0)).toHaveClass(/wrong/);
  expect(await progress(page)).toEqual(before);

  await quick(page).getByRole('radio', { name: 'It doubles', exact: true }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(quick(page).getByRole('radio', { name: 'It halves', exact: true })).toBeChecked();
  await expect(feedback).toBeEmpty();
  await submit.click();
  await expect(feedback).toContainText("That's right");
  await expect(feedback).toContainText('Inew = V/(2R) = Iold/2');
  await submit.click();
  expect(await progress(page)).toEqual(before);
  await quick(page).screenshot({ path: info.outputPath('quick-check-correct.png') });
  await help(page).getByRole('button', { name: 'Hide quick check' }).click();
  await expect(quick(page)).toHaveCount(0);
  await help(page).getByRole('button', { name: 'Try a quick check' }).click();
  await expect(feedback).toContainText("That's right");
  await lesson(page).getByRole('button', { name: 'Hide explanation' }).click();
  await expect(quick(page)).toHaveCount(0);
  await lesson(page).getByRole('button', { name: 'Explain my mistake' }).click();
  await expect(feedback).toContainText("That's right");
  expect(await progress(page)).toEqual(before);

  await lesson(page).getByRole('button', { name: 'Next Prompt', exact: true }).click();
  await expect(quick(page)).toHaveCount(0);
  await lesson(page).locator('.answerButton').nth(0).click();
  await lesson(page).getByRole('button', { name: 'Explain my mistake' }).click();
  await expect(quick(page)).toHaveCount(0);
  await help(page).getByRole('button', { name: 'Try a quick check' }).click();
  await expect(quick(page).getByRole('radio', { checked: true })).toHaveCount(0);
  await expect(feedback).toBeEmpty();
  await expect(submit).toBeDisabled();
});

test('archived quick checks have independent answer groups and preserve every saved answer', async ({ page }) => {
  const archived = createSessionHistoryRecord({ source: 'custom', label: 'Multiple mistakes',
    startedAt: 1000, completedAt: 61000, earnedXp: 0, questionIndices: [0, 1],
    results: questions.slice(0, 2).map((q) => ({ questionId: q.id, result: 'wrong' as const, optionIndex: 0 })),
  }, questions)!;
  await enter(page, `/#/practice/history/${archived.id}`, { sessionHistory: [archived] });
  const before = await progress(page);
  await expect(page.getByRole('button', { name: 'Explain my mistake' })).toHaveCount(2);
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Explain my mistake' }).first().click();
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Try a quick check' }).first().click();
  const first = quick(page).nth(0);
  const second = quick(page).nth(1);
  const group1 = await first.getByRole('radio').first().getAttribute('name');
  const group2 = await second.getByRole('radio').first().getAttribute('name');
  expect(group1).not.toBe(group2);
  await first.getByRole('radio', { name: 'It halves', exact: true }).check();
  await first.getByRole('button', { name: 'Check answer', exact: true }).click();
  await second.getByRole('radio', { name: 'It stays the same', exact: true }).check();
  await second.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(first.getByRole('radio', { name: 'It halves', exact: true })).toBeChecked();
  await expect(first.getByRole('status', { name: 'Quick check feedback' })).toContainText("That's right");
  await expect(second.getByRole('status', { name: 'Quick check feedback' })).toContainText("That's right");
  expect(await progress(page)).toEqual(before);
});

test('an unsupported archived relationship does not offer an unrelated quick check', async ({ page }) => {
  const archived = createSessionHistoryRecord({ source: 'custom', label: 'Older relationship',
    startedAt: 1000, completedAt: 61000, earnedXp: 0, questionIndices: [0],
    results: [{ questionId: questions[0].id, result: 'wrong', optionIndex: 0 }],
  }, questions)!;
  archived.items[0].question.formula = 'P = I^2 R';
  await enter(page, `/#/practice/history/${archived.id}`, { sessionHistory: [archived] });
  await page.getByRole('button', { name: 'Explain my mistake' }).click();
  await expect(help(page)).toBeVisible();
  await expect(help(page).getByRole('button', { name: 'Try a quick check' })).toHaveCount(0);
});
