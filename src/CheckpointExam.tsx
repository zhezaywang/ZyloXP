import {
  AlarmClock,
  ArrowLeft,
  ArrowRight,
  Award,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  Clock3,
  Flag,
  Gauge,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { getCheckpointDurationMinutes } from './checkpointExamTiming';
import type { LessonQuestion } from './data';
import { QuestionSchematic } from './QuestionSchematic';

export type CheckpointDomainId =
  | 'all'
  | 'circuits'
  | 'hardware'
  | 'power'
  | 'signals';
export type CheckpointExamLength = 5 | 10;
export type CheckpointExamTiming = 'deep' | 'standard' | 'untimed';
export type CheckpointConfidence = 'high' | 'low' | 'medium';

export type CheckpointExamConfig = {
  domainId: CheckpointDomainId;
  length: CheckpointExamLength;
  timing: CheckpointExamTiming;
};

export type CheckpointExamAnswer = {
  confidence: CheckpointConfidence | null;
  flagged: boolean;
  optionIndex: number | null;
};

export type CheckpointExamState = {
  answers: Record<string, CheckpointExamAnswer>;
  bonusXp: number;
  completedAt: number | null;
  config: CheckpointExamConfig;
  createdAt: number;
  currentIndex: number;
  earnedXp: number;
  expiresAt: number | null;
  id: string;
  questionIds: string[];
  score: number | null;
  startedAt: number;
};

export type CheckpointDomain = {
  description: string;
  id: CheckpointDomainId;
  label: string;
  questionCount: number;
};

type CheckpointExamProps = {
  bestScore: number;
  bonusXp: number;
  coach: ReactNode;
  completionCount: number;
  domains: CheckpointDomain[];
  exam: CheckpointExamState | null;
  onAnswerPatch: (
    questionId: string,
    patch: Partial<CheckpointExamAnswer>,
  ) => void;
  onBack: () => void;
  onCreate: (config: CheckpointExamConfig) => void;
  onNavigate: (questionIndex: number) => void;
  onOpenMistakeLab: () => void;
  onReset: () => void;
  onSubmit: (expired?: boolean) => void;
  questions: LessonQuestion[];
};

const TIMING_OPTIONS: Array<{
  detail: string;
  icon: typeof Clock3;
  id: CheckpointExamTiming;
  label: string;
}> = [
  {
    detail: '90 seconds per question',
    icon: Gauge,
    id: 'standard',
    label: 'Standard',
  },
  {
    detail: 'Two minutes per question',
    icon: BrainCircuit,
    id: 'deep',
    label: 'Deep focus',
  },
  {
    detail: 'No countdown',
    icon: Clock3,
    id: 'untimed',
    label: 'Untimed',
  },
];

const CONFIDENCE_OPTIONS: Array<{
  id: CheckpointConfidence;
  label: string;
}> = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

const DOMAIN_ICONS: Record<CheckpointDomainId, typeof Target> = {
  all: Target,
  circuits: CircleGauge,
  hardware: BrainCircuit,
  power: Zap,
  signals: Gauge,
};

function formatTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatElapsed(milliseconds: number) {
  const totalSeconds = Math.max(1, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export function CheckpointExam({
  bestScore,
  bonusXp,
  coach,
  completionCount,
  domains,
  exam,
  onAnswerPatch,
  onBack,
  onCreate,
  onNavigate,
  onOpenMistakeLab,
  onReset,
  onSubmit,
  questions,
}: CheckpointExamProps) {
  const [domainId, setDomainId] = useState<CheckpointDomainId>('all');
  const [length, setLength] = useState<CheckpointExamLength>(5);
  const [timing, setTiming] =
    useState<CheckpointExamTiming>('standard');
  const [clock, setClock] = useState(Date.now());
  const submittedForExpiry = useRef<string | null>(null);
  const selectedDomain =
    domains.find((domain) => domain.id === domainId) ?? domains[0];
  const durationMinutes = getCheckpointDurationMinutes({
    length,
    timing,
  });

  useEffect(() => {
    if (selectedDomain.questionCount < length) {
      setLength(5);
    }
  }, [length, selectedDomain.questionCount]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [exam?.completedAt, exam?.id]);

  useEffect(() => {
    if (!exam || exam.completedAt !== null || exam.expiresAt === null) {
      return;
    }

    const updateClock = () => setClock(Date.now());
    updateClock();
    const intervalId = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(intervalId);
  }, [exam]);

  useEffect(() => {
    if (
      !exam ||
      exam.completedAt !== null ||
      exam.expiresAt === null ||
      clock < exam.expiresAt ||
      submittedForExpiry.current === exam.id
    ) {
      return;
    }

    submittedForExpiry.current = exam.id;
    onSubmit(true);
  }, [clock, exam, onSubmit]);

  const activeQuestion = exam
    ? questions[exam.currentIndex] ?? questions[0]
    : undefined;
  const activeAnswer =
    exam && activeQuestion
      ? exam.answers[activeQuestion.id]
      : undefined;
  const answeredCount = exam
    ? Object.values(exam.answers).filter(
        (answer) => answer.optionIndex !== null,
      ).length
    : 0;
  const flaggedCount = exam
    ? Object.values(exam.answers).filter((answer) => answer.flagged).length
    : 0;
  const ratedCount = exam
    ? Object.values(exam.answers).filter(
        (answer) => answer.confidence !== null,
      ).length
    : 0;
  const unansweredCount = exam
    ? exam.questionIds.length - answeredCount
    : 0;
  const progress = exam
    ? (answeredCount / Math.max(1, exam.questionIds.length)) * 100
    : 0;
  const remainingMs =
    exam?.expiresAt === null || exam?.expiresAt === undefined
      ? null
      : Math.max(0, exam.expiresAt - clock);

  const results = useMemo(() => {
    if (!exam || exam.completedAt === null) {
      return [];
    }

    return questions.map((question) => {
      const answer = exam.answers[question.id];
      return {
        answer,
        correct:
          answer?.optionIndex !== null &&
          answer?.optionIndex === question.correctIndex,
        question,
      };
    });
  }, [exam, questions]);
  const correctCount = results.filter((result) => result.correct).length;
  const missedCount = results.length - correctCount;
  const ratedResults = results.filter(
    (result) => result.answer?.confidence !== null,
  );
  const confidenceExpected: Record<CheckpointConfidence, number> = {
    low: 0.35,
    medium: 0.65,
    high: 0.85,
  };
  const confidenceAlignment =
    ratedResults.length === 0
      ? null
      : Math.round(
          100 -
            (ratedResults.reduce((total, result) => {
              const confidence = result.answer
                ?.confidence as CheckpointConfidence;
              return (
                total +
                Math.abs(
                  Number(result.correct) - confidenceExpected[confidence],
                )
              );
            }, 0) /
              ratedResults.length) *
              100,
        );

  if (!exam) {
    return (
      <section
        className="checkpointPage checkpointBuilderPage"
        aria-label="Checkpoint Exam builder"
      >
        <header className="checkpointHeader">
          <button
            className="secondaryButton compactHeaderBack"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft size={17} />
            Back to dashboard
          </button>
          <div>
            <p className="eyebrow">Assessment Mode</p>
            <h1>Checkpoint Exam</h1>
            <p>Measure recall without immediate answer feedback.</p>
          </div>
          <span className="checkpointStatus">
            <ShieldCheck size={18} />
            <span>
              <small>Exam status</small>
              <strong>Ready to configure</strong>
            </span>
          </span>
        </header>

        <div className="checkpointBuilderLayout">
          <aside className="checkpointBuilderCoach" aria-label="Zy exam guidance">
            {coach}
            <div className="checkpointIntegrityList">
              <span>
                <ShieldCheck size={17} />
                <strong>Feedback locked</strong>
                <small>Solutions stay hidden until submission.</small>
              </span>
              <span>
                <Flag size={17} />
                <strong>Review enabled</strong>
                <small>Flag uncertain questions and revisit them.</small>
              </span>
              <span>
                <Gauge size={17} />
                <strong>Confidence tracked</strong>
                <small>Compare certainty with actual performance.</small>
              </span>
            </div>
          </aside>

          <section className="checkpointBuilder" aria-label="Exam settings">
            <header>
              <span>
                <ListChecks size={22} />
              </span>
              <div>
                <p className="eyebrow">Exam builder</p>
                <h2>Choose your checkpoint</h2>
              </div>
              {completionCount > 0 && (
                <small>Best score {bestScore}%</small>
              )}
            </header>

            <fieldset className="checkpointDomainPicker">
              <legend>Question domain</legend>
              <div>
                {domains.map((domain) => {
                  const Icon = DOMAIN_ICONS[domain.id];

                  return (
                    <button
                      aria-pressed={domainId === domain.id}
                      className={domainId === domain.id ? 'active' : ''}
                      key={domain.id}
                      onClick={() => setDomainId(domain.id)}
                      type="button"
                    >
                      <Icon size={18} />
                      <span>
                        <strong>{domain.label}</strong>
                        <small>{domain.description}</small>
                      </span>
                      <em>{domain.questionCount}</em>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="checkpointBuilderControls">
              <fieldset>
                <legend>Question count</legend>
                <div>
                  {[5, 10].map((questionCount) => (
                    <button
                      aria-pressed={length === questionCount}
                      className={length === questionCount ? 'active' : ''}
                      disabled={selectedDomain.questionCount < questionCount}
                      key={questionCount}
                      onClick={() =>
                        setLength(questionCount as CheckpointExamLength)
                      }
                      type="button"
                    >
                      {questionCount} questions
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend>Timing</legend>
                <div>
                  {TIMING_OPTIONS.map((option) => {
                    const Icon = option.icon;

                    return (
                      <button
                        aria-pressed={timing === option.id}
                        className={timing === option.id ? 'active' : ''}
                        key={option.id}
                        onClick={() => setTiming(option.id)}
                        type="button"
                      >
                        <Icon size={16} />
                        <span>
                          <strong>{option.label}</strong>
                          <small>{option.detail}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            <div className="checkpointBuildPreview">
              <span>
                <Target size={18} />
                <strong>{selectedDomain.label}</strong>
                <small>{length} verified questions</small>
              </span>
              <span>
                <AlarmClock size={18} />
                <strong>
                  {durationMinutes === 0
                    ? 'Untimed'
                    : `${durationMinutes} minutes`}
                </strong>
                <small>{timing} pacing</small>
              </span>
              <span>
                <Trophy size={18} />
                <strong>
                  {completionCount === 0
                    ? `+${bonusXp} first-check bonus`
                    : 'Milestone earned'}
                </strong>
                <small>Correct answers also earn XP</small>
              </span>
            </div>

            <button
              className="primaryButton fullWidth"
              onClick={() => onCreate({ domainId, length, timing })}
              type="button"
            >
              <Sparkles size={17} />
              Generate checkpoint
            </button>
          </section>
        </div>
      </section>
    );
  }

  if (exam.completedAt !== null) {
    const resultHeadline =
      (exam.score ?? 0) >= 90
        ? 'Checkpoint cleared'
        : (exam.score ?? 0) >= 70
          ? 'Strong foundation'
          : 'Useful calibration';

    return (
      <section
        className="checkpointPage checkpointResultsPage"
        aria-label="Checkpoint Exam results"
      >
        <header className="checkpointHeader">
          <button
            className="secondaryButton compactHeaderBack"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft size={17} />
            Back to dashboard
          </button>
          <div>
            <p className="eyebrow">Checkpoint complete</p>
            <h1>{resultHeadline}</h1>
            <p>Your score and confidence pattern are ready.</p>
          </div>
          <button className="primaryButton" onClick={onReset} type="button">
            <RefreshCw size={17} />
            New checkpoint
          </button>
        </header>

        <section className="checkpointScoreBand" aria-label="Checkpoint score">
          <div className="score">
            <Award size={25} />
            <span>Score</span>
            <strong>{exam.score ?? 0}%</strong>
          </div>
          <div>
            <CheckCircle2 size={20} />
            <span>Correct</span>
            <strong>
              {correctCount}/{results.length}
            </strong>
          </div>
          <div>
            <Gauge size={20} />
            <span>Confidence alignment</span>
            <strong>
              {confidenceAlignment === null
                ? 'Not rated'
                : `${confidenceAlignment}%`}
            </strong>
          </div>
          <div>
            <Clock3 size={20} />
            <span>Time used</span>
            <strong>
              {formatElapsed(exam.completedAt - exam.startedAt)}
            </strong>
          </div>
          <div>
            <Zap size={20} />
            <span>XP earned</span>
            <strong>+{exam.earnedXp}</strong>
          </div>
        </section>

        <div className="checkpointResultsLayout">
          <main className="checkpointBreakdown" aria-label="Exam breakdown">
            <header>
              <div>
                <p className="eyebrow">Answer audit</p>
                <h2>{results.length} exam decisions</h2>
              </div>
              <span>{missedCount} routed to recovery</span>
            </header>
            <div>
              {results.map((result, index) => (
                <article
                  className={result.correct ? 'correct' : 'missed'}
                  key={result.question.id}
                >
                  <span>{index + 1}</span>
                  <div>
                    <small>{result.question.topic}</small>
                    <strong>{result.question.subtopic}</strong>
                    <p>{result.question.prompt}</p>
                  </div>
                  <em>
                    {result.answer?.confidence
                      ? `${result.answer.confidence} confidence`
                      : 'Not rated'}
                  </em>
                  {result.correct ? (
                    <CheckCircle2 size={19} />
                  ) : (
                    <XCircle size={19} />
                  )}
                </article>
              ))}
            </div>
          </main>

          <aside className="checkpointResultsRail">
            <div className="checkpointResultsCoach">{coach}</div>
            <section>
              <p className="eyebrow">Next best move</p>
              <h2>
                {missedCount > 0
                  ? 'Turn misses into repairs'
                  : 'Raise the challenge'}
              </h2>
              <p>
                {missedCount > 0
                  ? `${missedCount} ${
                      missedCount === 1 ? 'question is' : 'questions are'
                    } now prioritized in Mistake Lab.`
                  : 'Every answer was correct. Build another checkpoint in a different domain.'}
              </p>
              <button
                className="primaryButton fullWidth"
                disabled={missedCount === 0}
                onClick={onOpenMistakeLab}
                type="button"
              >
                <BrainCircuit size={17} />
                {missedCount === 0
                  ? 'No misses to repair'
                  : `Open ${missedCount} ${
                      missedCount === 1 ? 'repair' : 'repairs'
                    }`}
              </button>
              <button
                className="secondaryButton fullWidth"
                onClick={onReset}
                type="button"
              >
                <RefreshCw size={17} />
                Build another checkpoint
              </button>
            </section>
          </aside>
        </div>
      </section>
    );
  }

  if (!activeQuestion || !activeAnswer) {
    return null;
  }

  return (
    <section
      className="checkpointPage checkpointActivePage"
      aria-label="Active Checkpoint Exam"
    >
      <header className="checkpointActiveHeader">
        <button
          className="secondaryButton compactHeaderBack"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          Save and exit
        </button>
        <div>
          <p className="eyebrow">Assessment in progress</p>
          <h1>Checkpoint Exam</h1>
          <p>
            Question {exam.currentIndex + 1} of {exam.questionIds.length}
          </p>
        </div>
        <span
          className={`checkpointTimer ${
            remainingMs !== null && remainingMs <= 60_000 ? 'urgent' : ''
          }`}
          aria-live="polite"
        >
          <AlarmClock size={20} />
          <span>
            <small>{remainingMs === null ? 'Pacing' : 'Time remaining'}</small>
            <strong>
              {remainingMs === null ? 'Untimed' : formatTime(remainingMs)}
            </strong>
          </span>
        </span>
      </header>

      <section className="checkpointActiveProgress" aria-label="Exam progress">
        <span style={{ width: `${progress}%` }} />
      </section>

      <div className="checkpointActiveLayout">
        <main className="checkpointQuestionPanel">
          <header>
            <div>
              <span>
                {activeQuestion.topic} · {activeQuestion.difficultyLabel}
              </span>
              <strong>
                {exam.currentIndex + 1}/{exam.questionIds.length}
              </strong>
            </div>
            <button
              aria-pressed={activeAnswer.flagged}
              className={activeAnswer.flagged ? 'active' : ''}
              onClick={() =>
                onAnswerPatch(activeQuestion.id, {
                  flagged: !activeAnswer.flagged,
                })
              }
              title={
                activeAnswer.flagged
                  ? 'Remove review flag'
                  : 'Flag for review'
              }
              type="button"
            >
              <Flag size={17} />
              {activeAnswer.flagged ? 'Flagged' : 'Flag for review'}
            </button>
          </header>

          <h2>{activeQuestion.prompt}</h2>

          {activeQuestion.visualValues.length > 0 && (
            <div className="checkpointGivenValues" aria-label="Given values">
              <span>Given</span>
              {activeQuestion.visualValues.map((value) => (
                <strong key={value}>{value}</strong>
              ))}
            </div>
          )}

          <div className="checkpointVisual">
            <QuestionSchematic
              powered
              question={activeQuestion}
              revealed={false}
            />
          </div>

          <fieldset className="checkpointAnswers">
            <legend>Select one answer</legend>
            <div>
              {activeQuestion.options.map((option, optionIndex) => (
                <button
                  aria-pressed={activeAnswer.optionIndex === optionIndex}
                  className={
                    activeAnswer.optionIndex === optionIndex ? 'active' : ''
                  }
                  key={`${activeQuestion.id}-${option}`}
                  onClick={() =>
                    onAnswerPatch(activeQuestion.id, { optionIndex })
                  }
                  type="button"
                >
                  <span>{String.fromCharCode(65 + optionIndex)}</span>
                  <strong>{option}</strong>
                </button>
              ))}
            </div>
          </fieldset>
        </main>

        <aside className="checkpointExamRail" aria-label="Exam controls">
          <section className="checkpointNavigator">
            <header>
              <span>Question navigator</span>
              <small>
                {answeredCount}/{exam.questionIds.length} answered
              </small>
            </header>
            <div>
              {questions.map((question, questionIndex) => {
                const answer = exam.answers[question.id];
                const isCurrent = questionIndex === exam.currentIndex;

                return (
                  <button
                    aria-label={`Question ${questionIndex + 1}${
                      answer?.optionIndex !== null ? ', answered' : ''
                    }${answer?.flagged ? ', flagged' : ''}`}
                    aria-pressed={isCurrent}
                    className={`${isCurrent ? 'current' : ''} ${
                      answer?.optionIndex !== null ? 'answered' : ''
                    } ${answer?.flagged ? 'flagged' : ''}`}
                    key={question.id}
                    onClick={() => onNavigate(questionIndex)}
                    type="button"
                  >
                    {questionIndex + 1}
                    {answer?.flagged && <Flag size={9} />}
                  </button>
                );
              })}
            </div>
          </section>

          <fieldset className="checkpointConfidence">
            <legend>Confidence in this answer</legend>
            <div>
              {CONFIDENCE_OPTIONS.map((option) => (
                <button
                  aria-pressed={activeAnswer.confidence === option.id}
                  className={
                    activeAnswer.confidence === option.id ? 'active' : ''
                  }
                  key={option.id}
                  onClick={() =>
                    onAnswerPatch(activeQuestion.id, {
                      confidence: option.id,
                    })
                  }
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <dl className="checkpointExamStats">
            <div>
              <dt>Answered</dt>
              <dd>
                {answeredCount}/{exam.questionIds.length}
              </dd>
            </div>
            <div>
              <dt>Confidence rated</dt>
              <dd>
                {ratedCount}/{exam.questionIds.length}
              </dd>
            </div>
            <div>
              <dt>Flagged</dt>
              <dd>{flaggedCount}</dd>
            </div>
          </dl>

          <div className="checkpointPager">
            <button
              className="secondaryButton"
              disabled={exam.currentIndex === 0}
              onClick={() => onNavigate(exam.currentIndex - 1)}
              title="Previous question"
              type="button"
            >
              <ChevronLeft size={18} />
              Previous
            </button>
            <button
              className="secondaryButton"
              disabled={exam.currentIndex >= exam.questionIds.length - 1}
              onClick={() => onNavigate(exam.currentIndex + 1)}
              title="Next question"
              type="button"
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            className="primaryButton fullWidth"
            disabled={unansweredCount > 0}
            onClick={() => onSubmit(false)}
            type="button"
          >
            <ListChecks size={17} />
            {unansweredCount > 0
              ? `${unansweredCount} unanswered`
              : 'Submit checkpoint'}
          </button>

          <p className="checkpointAutosave">
            <ShieldCheck size={15} />
            Answers, flags, and time are autosaved.
          </p>
        </aside>
      </div>

      <footer className="checkpointMobileActions">
        <button
          disabled={exam.currentIndex === 0}
          onClick={() => onNavigate(exam.currentIndex - 1)}
          type="button"
        >
          <ChevronLeft size={18} />
          Previous
        </button>
        <button
          disabled={exam.currentIndex >= exam.questionIds.length - 1}
          onClick={() => onNavigate(exam.currentIndex + 1)}
          type="button"
        >
          Next
          <ArrowRight size={18} />
        </button>
      </footer>
    </section>
  );
}
