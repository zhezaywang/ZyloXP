import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  CircleGauge,
  Database,
  FlaskConical,
  GitBranch,
  Lock,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type SkillMapLens = 'career' | 'mastery' | 'review';

export type SkillMapNode = {
  attemptedQuestions: number;
  bankCollectionId: string;
  bankLabel: string;
  careerWeight: number;
  difficulty: number;
  dueCount: number;
  icon: LucideIcon;
  id: string;
  lessons: number;
  nextTitle: string | null;
  prerequisiteTitle: string | null;
  progress: number;
  relatedLabId: string | null;
  relatedLabTitle: string | null;
  status: 'Current' | 'Locked' | 'Unlocked';
  title: string;
  unit: string;
};

type SkillMapProps = {
  averageProgress: number;
  backLabel: string;
  careerReadiness: number;
  careerRole: string;
  coach: ReactNode;
  nodes: SkillMapNode[];
  onBack: () => void;
  onOpenBank: (collectionId: string) => void;
  onOpenLab: (labId: string) => void;
  onPractice: (skillId: string) => void;
  onSelectSkill: (skillId: string) => void;
  selectedSkillId: string;
};

const LENSES: Array<{
  detail: string;
  icon: typeof Target;
  id: SkillMapLens;
  label: string;
}> = [
  {
    detail: 'See current strength and path completion.',
    icon: CircleGauge,
    id: 'mastery',
    label: 'Mastery',
  },
  {
    detail: 'Surface units with questions due now.',
    icon: RotateCcw,
    id: 'review',
    label: 'Review load',
  },
  {
    detail: 'Highlight skills tied to your active role.',
    icon: BriefcaseBusiness,
    id: 'career',
    label: 'Career signal',
  },
];

function getNodeSignal(node: SkillMapNode, lens: SkillMapLens) {
  if (lens === 'review') {
    return {
      label: node.dueCount === 1 ? '1 due' : `${node.dueCount} due`,
      strength: Math.min(100, node.dueCount * 25),
    };
  }

  if (lens === 'career') {
    return {
      label:
        node.careerWeight > 0
          ? `${Math.round(node.careerWeight * 100)}% role weight`
          : 'Supporting',
      strength: Math.round(node.careerWeight * 100),
    };
  }

  return {
    label: `${node.progress}% mastery`,
    strength: node.progress,
  };
}

function getNextMove(node: SkillMapNode) {
  if (node.status === 'Locked') {
    return {
      detail: node.prerequisiteTitle
        ? `Raise ${node.prerequisiteTitle} to unlock this unit.`
        : 'Complete the earlier units to open this skill.',
      label: 'Strengthen the prerequisite',
    };
  }

  if (node.dueCount > 0) {
    return {
      detail: `${node.dueCount} ${
        node.dueCount === 1 ? 'question is' : 'questions are'
      } due before new work.`,
      label: 'Clear the review signal',
    };
  }

  if (node.progress < 40) {
    return {
      detail: 'Use a short adaptive set to stabilize the core relationship.',
      label: 'Build the foundation',
    };
  }

  if (node.relatedLabId) {
    return {
      detail: `Apply this unit in ${node.relatedLabTitle}.`,
      label: 'Move from recall to measurement',
    };
  }

  return {
    detail: 'Use mixed practice to connect this unit to neighboring concepts.',
    label: 'Strengthen the connection',
  };
}

export function SkillMap({
  averageProgress,
  backLabel,
  careerReadiness,
  careerRole,
  coach,
  nodes,
  onBack,
  onOpenBank,
  onOpenLab,
  onPractice,
  onSelectSkill,
  selectedSkillId,
}: SkillMapProps) {
  const [lens, setLens] = useState<SkillMapLens>('mastery');
  const selectedNode =
    nodes.find((node) => node.id === selectedSkillId) ?? nodes[0];
  const selectedIndex = nodes.findIndex((node) => node.id === selectedNode.id);
  const SelectedIcon = selectedNode.icon;
  const selectedSignal = getNodeSignal(selectedNode, lens);
  const nextMove = getNextMove(selectedNode);
  const availableCount = nodes.filter((node) => node.status !== 'Locked').length;
  const totalDue = nodes.reduce((sum, node) => sum + node.dueCount, 0);
  const roleSkillCount = nodes.filter((node) => node.careerWeight > 0).length;

  return (
    <section className="skillMapPage" aria-label="Interactive Skill Map">
      <header className="skillMapHeader">
        <button
          className="secondaryButton compactHeaderBack"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          {backLabel}
        </button>

        <div>
          <p className="eyebrow">Knowledge Network</p>
          <h1>Skill Map</h1>
          <p>Trace prerequisites, review pressure, and career relevance.</p>
        </div>

        <div className="skillMapStatus">
          <GitBranch size={20} />
          <span>
            <small>Path availability</small>
            <strong>
              {availableCount}/{nodes.length} units open
            </strong>
          </span>
        </div>
      </header>

      <section className="skillMapSummary" aria-label="Skill Map summary">
        <div>
          <CircleGauge size={19} />
          <span>Average mastery</span>
          <strong>{averageProgress}%</strong>
        </div>
        <div className={totalDue > 0 ? 'attention' : ''}>
          <RotateCcw size={19} />
          <span>Review signal</span>
          <strong>{totalDue} due</strong>
        </div>
        <div>
          <BriefcaseBusiness size={19} />
          <span>{careerRole.replace(' Engineer', '')}</span>
          <strong>{careerReadiness}% ready</strong>
        </div>
        <div>
          <Sparkles size={19} />
          <span>Role-linked units</span>
          <strong>
            {roleSkillCount}/{nodes.length}
          </strong>
        </div>
      </section>

      <fieldset className="skillMapLens" aria-label="Map lens">
        <legend>Map lens</legend>
        <div>
          {LENSES.map((option) => {
            const Icon = option.icon;

            return (
              <button
                aria-pressed={lens === option.id}
                className={lens === option.id ? 'active' : ''}
                key={option.id}
                onClick={() => setLens(option.id)}
                type="button"
              >
                <Icon size={17} />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.detail}</small>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="skillMapLayout">
        <main className="skillMapCanvas" aria-label={`${LENSES.find((item) => item.id === lens)?.label} skill path`}>
          <header>
            <div>
              <p className="eyebrow">Foundation trace</p>
              <h2>Six connected units</h2>
            </div>
            <span>
              <i className="open" /> Open
              <i className="locked" /> Locked
            </span>
          </header>

          <nav className="skillMapTrack" aria-label="Skill nodes">
            {nodes.map((node, index) => {
              const Icon = node.icon;
              const signal = getNodeSignal(node, lens);
              const isSelected = node.id === selectedNode.id;
              const isLocked = node.status === 'Locked';
              const isRoleSkill = node.careerWeight > 0;
              const needsReview = node.dueCount > 0;

              return (
                <div
                  className={`skillMapTrackRow ${
                    index % 2 === 0 ? 'left' : 'right'
                  }`}
                  key={node.id}
                >
                  <button
                    aria-label={`${node.unit}, ${node.title}, ${signal.label}, ${node.status}`}
                    aria-pressed={isSelected}
                    className={`skillMapNode ${isSelected ? 'selected' : ''} ${
                      isLocked ? 'locked' : ''
                    } ${lens === 'career' && isRoleSkill ? 'roleSkill' : ''} ${
                      lens === 'review' && needsReview ? 'reviewDue' : ''
                    }`}
                    onClick={() => onSelectSkill(node.id)}
                    type="button"
                  >
                    <span className="skillMapNodeIcon">
                      {isLocked ? <Lock size={18} /> : <Icon size={19} />}
                    </span>
                    <span className="skillMapNodeCopy">
                      <small>{node.unit}</small>
                      <strong>{node.title}</strong>
                      <em>{signal.label}</em>
                    </span>
                    <span
                      className="skillMapNodeMeter"
                      role="progressbar"
                      aria-label={`${signal.label} signal`}
                      aria-valuemax={100}
                      aria-valuemin={0}
                      aria-valuenow={signal.strength}
                    >
                      <i style={{ width: `${signal.strength}%` }} />
                    </span>
                  </button>

                  <span className="skillMapJunction" aria-hidden="true">
                    {isLocked ? <Lock size={13} /> : index + 1}
                  </span>
                </div>
              );
            })}
          </nav>
        </main>

        <aside className="skillMapDetail" aria-label="Selected skill details">
          <div className="skillMapCoach">{coach}</div>

          <section>
            <header>
              <span className="skillMapDetailIcon">
                <SelectedIcon size={22} />
              </span>
              <div>
                <p className="eyebrow">
                  {selectedNode.unit} · Level {selectedNode.difficulty}
                </p>
                <h2>{selectedNode.title}</h2>
              </div>
              <em className={selectedNode.status.toLowerCase()}>
                {selectedNode.status}
              </em>
            </header>

            <div className="skillMapDetailMeter">
              <span>
                <strong>{selectedSignal.label}</strong>
                <small>{LENSES.find((item) => item.id === lens)?.label} lens</small>
              </span>
              <div
                role="progressbar"
                aria-label={`${selectedNode.title} ${selectedSignal.label}`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={selectedSignal.strength}
              >
                <span style={{ width: `${selectedSignal.strength}%` }} />
              </div>
            </div>

            <dl className="skillMapMetrics">
              <div>
                <dt>Mastery</dt>
                <dd>{selectedNode.progress}%</dd>
              </div>
              <div>
                <dt>Review</dt>
                <dd>{selectedNode.dueCount} due</dd>
              </div>
              <div>
                <dt>Practice</dt>
                <dd>{selectedNode.attemptedQuestions} tried</dd>
              </div>
            </dl>

            <div className="skillMapRelay">
              <span>
                <small>Prerequisite</small>
                <strong>
                  {selectedNode.prerequisiteTitle ?? 'Starting node'}
                </strong>
              </span>
              <ArrowRight size={16} />
              <span>
                <small>Feeds next</small>
                <strong>{selectedNode.nextTitle ?? 'Path complete'}</strong>
              </span>
            </div>

            <div className="skillMapMove">
              <Target size={19} />
              <span>
                <small>Best next move</small>
                <strong>{nextMove.label}</strong>
                <p>{nextMove.detail}</p>
              </span>
            </div>

            <div className="skillMapActions">
              <button
                className="primaryButton"
                disabled={selectedNode.status === 'Locked'}
                onClick={() => onPractice(selectedNode.id)}
                type="button"
              >
                <BookOpenCheck size={17} />
                Practice this unit
              </button>
              {selectedNode.relatedLabId && (
                <button
                  className="secondaryButton"
                  onClick={() => onOpenLab(selectedNode.relatedLabId!)}
                  type="button"
                >
                  <FlaskConical size={17} />
                  Open {selectedNode.relatedLabTitle}
                </button>
              )}
              <button
                className="secondaryButton"
                onClick={() => onOpenBank(selectedNode.bankCollectionId)}
                type="button"
              >
                <Database size={17} />
                Explore {selectedNode.bankLabel}
              </button>
            </div>

            <footer>
              {selectedNode.status === 'Locked' ? (
                <>
                  <Lock size={15} />
                  Locked nodes can still be inspected before they open.
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  Selection {selectedIndex + 1} of {nodes.length} is ready to launch.
                </>
              )}
            </footer>
          </section>
        </aside>
      </div>
    </section>
  );
}
