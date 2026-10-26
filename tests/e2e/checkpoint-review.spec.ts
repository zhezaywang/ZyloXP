import { expect, test, type Page } from '@playwright/test';
import { generatedLessonQuestions } from '../../src/questionBank.generated';

type ExamFixture = {
  id: string; questionIds: string[];
  config: { domainId: 'all'; length: 5; timing: 'untimed' | 'standard' };
  createdAt: number; startedAt: number; completedAt: number | null;
  expiresAt: number | null; currentIndex: number; score: number | null; bonusXp: number; earnedXp: number;
  answers: Record<string, { optionIndex: number | null; confidence: 'low' | 'medium' | 'high' | null; flagged: boolean }>;
};

const learnerKey = 'zyloxp-learner-state-v1';
const questions = generatedLessonQuestions.slice(0, 5);
const review = (page: Page) => page.getByRole('region', { name: 'Answer review', exact: true });
const snapshot = (page: Page) => page.evaluate((key) => {
  const state = JSON.parse(localStorage.getItem(key)!);
  return { exam: state.checkpointExam, earnedXp: state.earnedXp, completions: state.checkpointExamCompletionCount };
}, learnerKey);

function completedExam(perfect = false): ExamFixture {
  const now = Date.now();
  const confidence: ExamFixture['answers'][string]['confidence'][] = ['high', 'high', null, 'low', 'medium'];
  return {
    id: 'review-fixture', questionIds: questions.map((q) => q.id),
    config: { domainId: 'all', length: 5, timing: 'untimed' },
    createdAt: now - 60000, startedAt: now - 60000, completedAt: now,
    expiresAt: null, currentIndex: 0, score: perfect ? 100 : 40, bonusXp: 0, earnedXp: 24,
    answers: Object.fromEntries(questions.map((q, index) => [q.id, {
      optionIndex: perfect || index === 0 || index === 3 ? q.correctIndex : index === 2 ? null : (q.correctIndex + 1) % q.options.length,
      confidence: perfect ? 'high' : confidence[index],
      flagged: !perfect && (index === 1 || index === 2),
    }])),
  };
}

async function enter(page: Page, exam: ExamFixture | null = completedExam()) {
  await page.addInitScript(({ learnerKey, exam }) => {
    if (sessionStorage.getItem('checkpoint-review-seeded')) return;
    localStorage.setItem(learnerKey, JSON.stringify({ checkpointExam: exam, checkpointExamCompletionCount: exam?.completedAt ? 1 : 0, earnedXp: 1300 }));
    sessionStorage.setItem('checkpoint-review-seeded', 'yes');
  }, { learnerKey, exam });
  await page.goto('/#/practice/checkpoint');
  await page.getByRole('button', { name: 'Start learning', exact: true }).click();
  const dismiss = page.getByRole('button', { name: 'Dismiss notification', exact: true });
  if (await dismiss.isVisible()) await dismiss.click();
}

test('results filter exact answers, preserve numbering and show worked reasoning after submission', async ({ page }, info) => {
  await enter(page);
  const region = review(page);
  await expect(region.getByRole('article')).toHaveCount(5);
  await expect(region.getByRole('status')).toHaveText('5 of 5 questions');
  await region.getByRole('button', { name: 'Missed 3', exact: true }).click();
  await expect(region.getByRole('article')).toHaveCount(3);
  await expect(region.getByRole('article').first().getByLabel('Question 2', { exact: true })).toBeVisible();
  await region.getByRole('button', { name: 'Flagged 2', exact: true }).click();
  await expect(region.getByRole('article')).toHaveCount(2);
  await region.getByRole('button', { name: 'Uncertain 2', exact: true }).click();
  await expect(region.getByRole('article')).toHaveCount(2);
  await expect(region).toContainText('Answered with low or medium confidence.');
  await region.getByRole('button', { name: 'Unanswered 1', exact: true }).click();
  const unanswered = region.getByRole('article');
  await expect(unanswered.getByText('Unanswered', { exact: true })).toBeVisible();
  await unanswered.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(unanswered.locator('details')).toHaveAttribute('open', '');
  await expect(unanswered.locator('dd').first()).toHaveText('Not answered');
  await expect(unanswered.locator('dd').last()).toHaveText(`${String.fromCharCode(65 + questions[2].correctIndex)}. ${questions[2].options[questions[2].correctIndex]}`);
  await expect(unanswered.getByRole('heading', { name: 'Worked solution' })).toBeVisible();
  await expect(unanswered.getByRole('heading', { name: 'Assumptions' })).toBeVisible();
  await region.getByRole('button', { name: 'All 5', exact: true }).click();
  const first = region.getByRole('article').first();
  await first.locator('summary').click();
  await expect(first.locator('dd').first()).toHaveText('C. 1 A');
  await expect(first.locator('dd').last()).toHaveText('C. 1 A');
  await expect(first).toContainText("Ohm's law gives");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: info.outputPath('checkpoint-results.png') });
  await first.evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.screenshot({ path: info.outputPath('checkpoint-review.png') });
});

test('review and direct practice never alter or re-award the completed checkpoint', async ({ page }) => {
  await enter(page);
  await expect(review(page)).toBeVisible();
  const before = await snapshot(page);
  const first = review(page).getByRole('article').first();
  await first.locator('summary').click();
  await first.getByRole('button', { name: 'Practice this question' }).click();
  await expect(page).toHaveURL(/#\/practice\/question\/EE-00001$/);
  await expect(page.getByRole('heading', { name: /An 8 V source/ })).toBeVisible();
  await page.goBack();
  await expect(review(page)).toBeVisible();
  expect(await snapshot(page)).toEqual(before);
  await page.reload();
  await expect(review(page).getByRole('article')).toHaveCount(5);
  expect(await snapshot(page)).toEqual(before);
});

test('empty filters have an accessible recovery action', async ({ page }) => {
  await enter(page, completedExam(true));
  await review(page).getByRole('button', { name: 'Missed 0', exact: true }).click();
  await expect(review(page)).toContainText('No missed questions');
  await expect(review(page).getByRole('article')).toHaveCount(0);
  await review(page).getByRole('button', { name: 'Show all answers' }).click();
  await expect(review(page).getByRole('button', { name: 'All 5', exact: true })).toBeFocused();
  await expect(review(page).getByRole('article')).toHaveCount(5);
});

test('a new checkpoint hides solutions, then exposes the submitted answer snapshot', async ({ page }) => {
  await enter(page, null);
  await page.getByRole('button', { name: 'Untimed No countdown' }).click();
  await page.getByRole('button', { name: 'Generate checkpoint' }).click();
  const active = page.getByRole('region', { name: 'Active Checkpoint Exam' });
  await expect(active).toBeVisible();
  await expect(review(page)).toHaveCount(0);
  await expect(page.getByText('Worked solution', { exact: true })).toHaveCount(0);
  const ids: string[] = (await snapshot(page)).exam.questionIds;
  for (let index = 0; index < ids.length; index++) {
    const question = generatedLessonQuestions.find((q) => q.id === ids[index])!;
    const choice = index === 1 ? (question.correctIndex + 1) % question.options.length : question.correctIndex;
    await active.getByRole('group', { name: 'Select one answer' }).getByRole('button').nth(choice).click();
    await active.getByRole('button', { name: 'High', exact: true }).click();
    if (index === 1) await active.getByRole('button', { name: 'Flag for review', exact: true }).click();
    if (index < ids.length - 1) await active.getByRole('button', { name: 'Next', exact: true }).first().click();
  }
  await active.getByRole('button', { name: 'Submit checkpoint', exact: true }).click();
  await expect(review(page)).toBeVisible();
  await expect(page.getByRole('region', { name: 'Checkpoint score' })).toContainText('80%');
  await review(page).getByRole('button', { name: 'Missed 1', exact: true }).click();
  const result = review(page).getByRole('article');
  await expect(result.getByLabel('Question 2', { exact: true })).toBeVisible();
  await result.locator('summary').click();
  await expect(result.locator('dd').first()).not.toHaveText(await result.locator('dd').last().innerText());
  const completed = await snapshot(page);
  await page.reload();
  await expect(review(page)).toBeVisible();
  expect(await snapshot(page)).toEqual(completed);
});

test('expired unanswered questions remain distinct and do not count as rated predictions', async ({ page }) => {
  const exam: ExamFixture = { ...completedExam(), completedAt: null, expiresAt: Date.now() - 1000, config: { domainId: 'all', length: 5, timing: 'standard' }, score: null,
    answers: Object.fromEntries(questions.map((q) => [q.id, { optionIndex: null, confidence: 'high', flagged: false }])),
  };
  await enter(page, exam);
  await expect(review(page)).toBeVisible();
  await expect(page.getByRole('region', { name: 'Checkpoint score' })).toContainText('Not rated');
  await review(page).getByRole('button', { name: 'Unanswered 5', exact: true }).click();
  await expect(review(page).getByRole('article')).toHaveCount(5);
  expect((await snapshot(page)).exam.score).toBe(0);
});

test('review remains readable on narrow phones with enlarged text and natural scrolling', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await enter(page);
  await review(page).getByRole('article').first().locator('summary').click();
  for (const size of [16, 24]) {
    await page.evaluate((size) => document.documentElement.style.fontSize = `${size}px`, size);
    const layout = await review(page).evaluate((element) => {
      const prompt = element.querySelector('.checkpointReviewPrompt')!;
      return {
        contained: element.scrollWidth <= element.clientWidth,
        naturalScroll: getComputedStyle(element.querySelector('.checkpointReviewList')!).overflowY === 'visible',
        unclipped: prompt.scrollHeight <= prompt.clientHeight + 1,
        boxesFit: Array.from(element.querySelectorAll('button, summary, h3, dd, .checkpointReviewPrompt, .checkpointReviewOutcome')).filter((el) => el.getClientRects().length).every((el) => {
          const box = el.getBoundingClientRect();
          return box.left >= 0 && box.right <= innerWidth && el.scrollWidth <= el.clientWidth + 1;
        }),
      };
    });
    expect(layout).toEqual({ contained: true, naturalScroll: true, unclipped: true, boxesFit: true });
  }
  const first = review(page).getByRole('article').first();
  await first.evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.screenshot({ path: info.outputPath('checkpoint-narrow-large-text.png') });
  await first.getByRole('heading', { name: 'Worked solution' }).evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.screenshot({ path: info.outputPath('checkpoint-narrow-solution.png') });
});
