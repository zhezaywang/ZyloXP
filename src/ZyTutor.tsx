import {
  BookOpenCheck,
  BriefcaseBusiness,
  FlaskConical,
  Lightbulb,
  Map,
  MessageCircleQuestion,
  NotebookTabs,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  TimerReset,
  Trash2,
  X,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';

export type ZyTutorContextKind =
  | 'question'
  | 'lab'
  | 'career'
  | 'focus'
  | 'skill'
  | 'general';

export type ZyTutorContext = {
  assumptions?: string;
  careerContext?: string;
  description: string;
  dueCount?: number;
  explanation?: string;
  formula?: string;
  id: string;
  kind: ZyTutorContextKind;
  labId?: string | null;
  mastery?: number;
  prompt?: string;
  solution?: string;
  subtitle: string;
  title: string;
};

export type ZyTutorAction =
  | 'practice'
  | 'review'
  | 'lab'
  | 'notebook'
  | 'skill-map'
  | 'focus';

type ZyTutorProps = {
  coach: ReactNode;
  context: ZyTutorContext;
  onAction: (action: ZyTutorAction) => void;
  onClose: () => void;
  open: boolean;
};

type TutorMessage = {
  contextId: string;
  id: string;
  role: 'learner' | 'zy';
  text: string;
};

type TutorPrompt = {
  icon: typeof Lightbulb;
  label: string;
  query: string;
};

const CONTEXT_LABELS: Record<ZyTutorContextKind, string> = {
  career: 'Career coaching',
  focus: 'Focus coaching',
  general: 'Learning guide',
  lab: 'Lab coaching',
  question: 'Question support',
  skill: 'Skill coaching',
};

function getTutorPrompts(context: ZyTutorContext): TutorPrompt[] {
  if (context.kind === 'question') {
    return [
      {
        icon: BookOpenCheck,
        label: 'Explain concept',
        query: 'Explain this concept in plain language.',
      },
      {
        icon: Lightbulb,
        label: 'Give me a hint',
        query: 'Give me a hint without revealing the answer.',
      },
      {
        icon: NotebookTabs,
        label: 'Show formula',
        query: 'Show the formula and help me map the values.',
      },
      {
        icon: BriefcaseBusiness,
        label: 'Career connection',
        query: 'Why does this matter in real engineering work?',
      },
    ];
  }

  if (context.kind === 'lab') {
    return [
      {
        icon: Lightbulb,
        label: 'Predict the change',
        query: 'Help me predict what will change before I move a control.',
      },
      {
        icon: NotebookTabs,
        label: 'Explain formula',
        query: 'Explain the formula behind this lab.',
      },
      {
        icon: BookOpenCheck,
        label: 'Check assumptions',
        query: 'Which assumptions should I check?',
      },
      {
        icon: Target,
        label: 'Next task',
        query: 'What should I do next in this lab?',
      },
    ];
  }

  if (context.kind === 'career') {
    return [
      {
        icon: BriefcaseBusiness,
        label: 'Why this skill',
        query: 'Why does this skill matter for this career?',
      },
      {
        icon: Sparkles,
        label: 'Build evidence',
        query: 'How can I build evidence for this role?',
      },
      {
        icon: Target,
        label: 'What next',
        query: 'What is the best next step for this career path?',
      },
      {
        icon: TimerReset,
        label: 'Practice plan',
        query: 'Give me a short practice plan.',
      },
    ];
  }

  return [
    {
      icon: Lightbulb,
      label: 'Unpack this',
      query: 'Explain what I should understand here.',
    },
    {
      icon: Target,
      label: 'Best next step',
      query: 'What is my best next step?',
    },
    {
      icon: NotebookTabs,
      label: 'Key relationship',
      query: 'What formula or relationship should I remember?',
    },
    {
      icon: BriefcaseBusiness,
      label: 'Career connection',
      query: 'How does this connect to real engineering work?',
    },
  ];
}

function cleanSentence(value: string | undefined, fallback: string) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : fallback;
}

function buildHint(context: ZyTutorContext, depth: number) {
  if (depth === 1) {
    const assumption = context.assumptions
      ? ` Keep this condition in view: ${context.assumptions}`
      : '';
    return `Start by separating what is known from what the prompt asks you to find. Write each value with its unit, then name the unknown before touching the answer choices.${assumption}`;
  }

  if (depth === 2) {
    if (context.formula) {
      return `Use this relationship: ${context.formula} Map each known value to its symbol, keep the units consistent, and leave the unknown by itself. I am holding back the final substitution so you can make the next move.`;
    }

    return `Look for the relationship that links the changing quantity to the measured result. Decide whether the result should rise, fall, or stay fixed before you calculate.`;
  }

  if (context.formula) {
    return `Set up ${context.formula} with the known values in the matching positions. Estimate the direction and rough size first, then calculate and compare that estimate with the options. That check should narrow the choice without me giving it away.`;
  }

  return `Make a quick estimate, remove choices with impossible units or direction, and test the strongest remaining choice against the diagram. You now have enough structure to finish it yourself.`;
}

function buildTutorResponse(
  context: ZyTutorContext,
  query: string,
  hintDepth: number,
) {
  const normalized = query.toLowerCase();
  const asksForHint =
    normalized.includes('hint') ||
    normalized.includes('without revealing') ||
    normalized.includes('help me solve');
  const asksForFormula =
    normalized.includes('formula') ||
    normalized.includes('equation') ||
    normalized.includes('relationship');
  const asksForAssumptions =
    normalized.includes('assumption') ||
    normalized.includes('condition') ||
    normalized.includes('check');
  const asksForCareer =
    normalized.includes('career') ||
    normalized.includes('job') ||
    normalized.includes('engineering work') ||
    normalized.includes('role') ||
    normalized.includes('evidence');
  const asksForNext =
    normalized.includes('next') ||
    normalized.includes('plan') ||
    normalized.includes('practice') ||
    normalized.includes('improve');
  const asksToExplain =
    normalized.includes('explain') ||
    normalized.includes('understand') ||
    normalized.includes('plain language') ||
    normalized.includes('unpack');
  const asksToPredict =
    normalized.includes('predict') ||
    normalized.includes('change') ||
    normalized.includes('control');

  if (asksForHint && context.kind === 'question') {
    return buildHint(context, hintDepth);
  }

  if (asksForAssumptions) {
    return context.assumptions
      ? `Treat these as your boundary conditions: ${context.assumptions} Check each one against the diagram and given values before trusting the result.`
      : `Check that the units, reference direction, and operating condition match the relationship you are using. If one changes, state it before you calculate.`;
  }

  if (asksForFormula) {
    const formula = cleanSentence(
      context.formula,
      'Start with the relationship between the input, the system, and the measured output.',
    );
    const assumptions = context.assumptions
      ? ` The result depends on: ${context.assumptions}`
      : '';
    return `${formula}${assumptions} Say what each symbol represents before substituting numbers; that catches most setup errors.`;
  }

  if (asksForCareer) {
    return cleanSentence(
      context.careerContext,
      `This work builds evidence that you can reason from measurements, explain assumptions, and verify a result. Those habits matter across engineering roles, even when the exact circuit or tool changes.`,
    );
  }

  if (asksForNext) {
    const signals: string[] = [];
    if (typeof context.mastery === 'number') {
      signals.push(`${Math.round(context.mastery)}% mastery`);
    }
    if (typeof context.dueCount === 'number' && context.dueCount > 0) {
      signals.push(`${context.dueCount} reviews due`);
    }
    const signalText =
      signals.length > 0 ? ` Your current signal is ${signals.join(' with ')}.` : '';

    if (context.kind === 'lab') {
      return `Predict the meter or output first, change one control, then explain whether the result matched your model.${signalText} Complete that loop before adding another variable.`;
    }

    if (context.kind === 'career') {
      return `${context.description}${signalText} Turn the next activity into evidence by recording the decision you made, the result, and what you would improve.`;
    }

    return `Take one short, deliberate set on ${context.title}, then review any miss before moving on.${signalText} A focused session is more useful here than a longer mixed session.`;
  }

  if (asksToPredict && context.kind === 'lab') {
    const formula = context.formula ? ` Use ${context.formula} as your model.` : '';
    return `Choose one control and say whether the measured result should increase, decrease, or stay stable before moving it.${formula} Then change only that control and compare the meter with your prediction.`;
  }

  if (asksToExplain) {
    return cleanSentence(
      context.explanation,
      `${context.description} Focus on the cause-and-effect relationship first, then use the formula as a compact way to express it.`,
    );
  }

  return `${context.description} ${
    context.formula
      ? `The key relationship is ${context.formula}`
      : 'Start by naming the input, the output, and what connects them.'
  } Ask me to explain it, give a measured hint, or connect it to your career path.`;
}

function createMessage(
  role: TutorMessage['role'],
  text: string,
  contextId: string,
): TutorMessage {
  return {
    contextId,
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    text,
  };
}

export function ZyTutor({
  coach,
  context,
  onAction,
  onClose,
  open,
}: ZyTutorProps) {
  const [draft, setDraft] = useState('');
  const [hintDepths, setHintDepths] = useState<Record<string, number>>({});
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const previousContextIdRef = useRef('');
  const pendingReplyRef = useRef<number | null>(null);

  const prompts = getTutorPrompts(context);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => inputRef.current?.focus(), 80);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open || previousContextIdRef.current === context.id) {
      return;
    }

    previousContextIdRef.current = context.id;
    setMessages((current) => [
      ...current,
      createMessage(
        'zy',
        `I am with you on ${context.title}. ${context.description}`,
        context.id,
      ),
    ]);
  }, [context.description, context.id, context.title, open]);

  useEffect(() => {
    if (open) {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isThinking, messages, open]);

  useEffect(
    () => () => {
      if (pendingReplyRef.current !== null) {
        window.clearTimeout(pendingReplyRef.current);
      }
    },
    [],
  );

  function askTutor(query: string) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isThinking) {
      return;
    }

    const asksForHint =
      context.kind === 'question' &&
      (trimmedQuery.toLowerCase().includes('hint') ||
        trimmedQuery.toLowerCase().includes('without revealing') ||
        trimmedQuery.toLowerCase().includes('help me solve'));
    const nextHintDepth = asksForHint
      ? Math.min(3, (hintDepths[context.id] ?? 0) + 1)
      : hintDepths[context.id] ?? 0;

    if (asksForHint) {
      setHintDepths((current) => ({
        ...current,
        [context.id]: nextHintDepth,
      }));
    }

    setMessages((current) => [
      ...current,
      createMessage('learner', trimmedQuery, context.id),
    ]);
    setDraft('');
    setIsThinking(true);

    pendingReplyRef.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        createMessage(
          'zy',
          buildTutorResponse(context, trimmedQuery, nextHintDepth),
          context.id,
        ),
      ]);
      setIsThinking(false);
      pendingReplyRef.current = null;
    }, 320);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    askTutor(draft);
  }

  function handleClear() {
    if (pendingReplyRef.current !== null) {
      window.clearTimeout(pendingReplyRef.current);
      pendingReplyRef.current = null;
    }
    setMessages([
      createMessage(
        'zy',
        `Fresh page. We can keep working on ${context.title}.`,
        context.id,
      ),
    ]);
    setHintDepths({});
    setIsThinking(false);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="zyTutorLayer">
      <button
        aria-label="Close Zy Tutor"
        className="zyTutorBackdrop"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-label="Zy Tutor"
        aria-modal="true"
        className="zyTutorDrawer"
        role="dialog"
      >
        <header className="zyTutorHeader">
          <span className="zyTutorHeaderIcon">
            <MessageCircleQuestion size={20} />
          </span>
          <div>
            <span>Learning companion</span>
            <strong>Zy Tutor</strong>
          </div>
          <button
            aria-label="Clear tutor conversation"
            className="zyTutorIconButton"
            onClick={handleClear}
            title="Clear conversation"
            type="button"
          >
            <Trash2 size={18} />
          </button>
          <button
            aria-label="Close Zy Tutor"
            className="zyTutorIconButton"
            onClick={onClose}
            title="Close"
            type="button"
          >
            <X size={20} />
          </button>
        </header>

        <div className="zyTutorContext">
          <span>{CONTEXT_LABELS[context.kind]}</span>
          <strong>{context.title}</strong>
          <p>{context.subtitle}</p>
          {(typeof context.mastery === 'number' ||
            (context.dueCount ?? 0) > 0) && (
            <div>
              {typeof context.mastery === 'number' && (
                <span>{Math.round(context.mastery)}% mastery</span>
              )}
              {(context.dueCount ?? 0) > 0 && (
                <span>{context.dueCount} due</span>
              )}
            </div>
          )}
        </div>

        <div className="zyTutorCoach">{coach}</div>

        <section className="zyTutorConversation" aria-live="polite">
          {messages.map((message) => (
            <article
              className={`zyTutorMessage ${message.role}`}
              key={message.id}
            >
              <span>{message.role === 'zy' ? 'Zy' : 'You'}</span>
              <p>{message.text}</p>
            </article>
          ))}
          {isThinking && (
            <article className="zyTutorMessage zy thinking">
              <span>Zy</span>
              <p>
                <i />
                <i />
                <i />
                <span className="srOnly">Thinking</span>
              </p>
            </article>
          )}
          <div ref={messageEndRef} />
        </section>

        <div className="zyTutorPrompts" aria-label="Tutor prompts">
          {prompts.map((prompt) => {
            const Icon = prompt.icon;
            return (
              <button
                disabled={isThinking}
                key={prompt.label}
                onClick={() => askTutor(prompt.query)}
                type="button"
              >
                <Icon size={15} />
                <span>{prompt.label}</span>
              </button>
            );
          })}
        </div>

        <form className="zyTutorComposer" onSubmit={handleSubmit}>
          <input
            aria-label="Ask Zy a question"
            disabled={isThinking}
            maxLength={240}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Ask about ${context.title}`}
            ref={inputRef}
            type="text"
            value={draft}
          />
          <button
            aria-label="Send question"
            disabled={!draft.trim() || isThinking}
            title="Send"
            type="submit"
          >
            <Send size={18} />
          </button>
        </form>

        <nav className="zyTutorActions" aria-label="Learning actions">
          <button onClick={() => onAction('practice')} type="button">
            <Target size={16} />
            <span>{context.kind === 'question' ? 'Question' : 'Practice'}</span>
          </button>
          <button onClick={() => onAction('review')} type="button">
            <RotateCcw size={16} />
            <span>Review</span>
          </button>
          <button
            disabled={!context.labId}
            onClick={() => onAction('lab')}
            type="button"
          >
            <FlaskConical size={16} />
            <span>Lab</span>
          </button>
          <button onClick={() => onAction('notebook')} type="button">
            <NotebookTabs size={16} />
            <span>Formulas</span>
          </button>
          <button onClick={() => onAction('skill-map')} type="button">
            <Map size={16} />
            <span>Skills</span>
          </button>
          <button onClick={() => onAction('focus')} type="button">
            <TimerReset size={16} />
            <span>Focus</span>
          </button>
        </nav>
      </aside>
    </div>
  );
}
