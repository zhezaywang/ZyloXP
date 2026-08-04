import {
  ArrowLeft,
  Award,
  BookCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircuitBoard,
  ClipboardCheck,
  FileCheck2,
  FlaskConical,
  FolderKanban,
  GraduationCap,
  Pin,
  Sparkles,
  Target,
} from 'lucide-react';
import { useMemo, useState } from 'react';

export type PortfolioEvidenceKind =
  | 'circuit'
  | 'diagnostic'
  | 'formula'
  | 'lab'
  | 'project';

export type PortfolioEvidence = {
  description: string;
  id: string;
  kind: PortfolioEvidenceKind;
  metric: string;
  skills: string[];
  sourceId: string;
  subtitle: string;
  timestamp?: number;
  title: string;
};

type PortfolioFilter = 'all' | PortfolioEvidenceKind;

type EvidencePortfolioProps = {
  evidence: PortfolioEvidence[];
  featuredIds: string[];
  headline: string;
  notes: Record<string, string>;
  onBack: () => void;
  onHeadlineChange: (headline: string) => void;
  onNoteChange: (evidenceId: string, note: string) => void;
  onOpenSource: (evidence: PortfolioEvidence) => void;
  onPublish: () => void;
  onToggleFeatured: (evidenceId: string) => void;
  publishCount: number;
  readiness: number;
  rewardXp: number;
  role: string;
};

const EVIDENCE_META = {
  circuit: {
    icon: CircuitBoard,
    label: 'Circuit',
  },
  diagnostic: {
    icon: ClipboardCheck,
    label: 'Diagnostic',
  },
  formula: {
    icon: BookCheck,
    label: 'Formula',
  },
  lab: {
    icon: FlaskConical,
    label: 'Lab',
  },
  project: {
    icon: BriefcaseBusiness,
    label: 'Project',
  },
} as const;

const FILTERS: Array<{
  id: PortfolioFilter;
  label: string;
}> = [
  { id: 'all', label: 'All evidence' },
  { id: 'project', label: 'Projects' },
  { id: 'lab', label: 'Labs' },
  { id: 'circuit', label: 'Circuits' },
  { id: 'diagnostic', label: 'Diagnostics' },
  { id: 'formula', label: 'Formulas' },
];

function formatEvidenceDate(timestamp?: number) {
  if (!timestamp) {
    return 'Current evidence';
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(timestamp);
}

export function EvidencePortfolio({
  evidence,
  featuredIds,
  headline,
  notes,
  onBack,
  onHeadlineChange,
  onNoteChange,
  onOpenSource,
  onPublish,
  onToggleFeatured,
  publishCount,
  readiness,
  rewardXp,
  role,
}: EvidencePortfolioProps) {
  const [filter, setFilter] = useState<PortfolioFilter>('all');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(
    evidence[0]?.id ?? '',
  );
  const filteredEvidence = useMemo(
    () =>
      filter === 'all'
        ? evidence
        : evidence.filter((item) => item.kind === filter),
    [evidence, filter],
  );
  const selectedEvidence =
    evidence.find((item) => item.id === selectedEvidenceId) ??
    filteredEvidence[0] ??
    evidence[0] ??
    null;
  const featuredEvidence = featuredIds
    .map((evidenceId) => evidence.find((item) => item.id === evidenceId))
    .filter((item): item is PortfolioEvidence => Boolean(item));
  const skillCoverage = new Set(
    evidence.flatMap((item) => item.skills.map((skill) => skill.toLowerCase())),
  ).size;
  const reflectedCount = featuredEvidence.filter(
    (item) => (notes[item.id] ?? '').trim().length > 0,
  ).length;
  const headlineReady = headline.trim().length >= 8;
  const featureSetReady = featuredEvidence.length === 3;
  const readyToPublish = headlineReady && featureSetReady;
  const featuredSkills = Array.from(
    new Set(featuredEvidence.flatMap((item) => item.skills)),
  ).slice(0, 4);
  const portfolioStatus =
    publishCount > 0 && readyToPublish
      ? 'Portfolio ready'
      : readyToPublish
        ? 'Ready to save'
        : 'Draft in progress';

  function handleFilterChange(nextFilter: PortfolioFilter) {
    setFilter(nextFilter);
    const firstMatch =
      nextFilter === 'all'
        ? evidence[0]
        : evidence.find((item) => item.kind === nextFilter);

    if (firstMatch) {
      setSelectedEvidenceId(firstMatch.id);
    }
  }

  return (
    <section className="portfolioStudioPage" aria-label="Career evidence portfolio">
      <header className="portfolioStudioHeader">
        <button
          className="secondaryButton compactHeaderBack"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          Back to career
        </button>

        <div>
          <p className="eyebrow">Career Evidence</p>
          <h1>Portfolio Studio</h1>
          <p>Turn completed work into a focused proof-of-skill profile.</p>
        </div>

        <div className={`portfolioStatus ${readyToPublish ? 'ready' : ''}`}>
          {readyToPublish ? <FileCheck2 size={20} /> : <FolderKanban size={20} />}
          <span>
            <small>{role}</small>
            <strong>{portfolioStatus}</strong>
          </span>
        </div>
      </header>

      <section className="portfolioMetricBand" aria-label="Portfolio metrics">
        <div>
          <BriefcaseBusiness size={19} />
          <span>Evidence items</span>
          <strong>{evidence.length}</strong>
        </div>
        <div>
          <Pin size={19} />
          <span>Featured</span>
          <strong>{featuredEvidence.length}/3</strong>
        </div>
        <div>
          <Sparkles size={19} />
          <span>Skills represented</span>
          <strong>{skillCoverage}</strong>
        </div>
        <div>
          <GraduationCap size={19} />
          <span>Career readiness</span>
          <strong>{readiness}%</strong>
        </div>
      </section>

      <div className="portfolioStudioLayout">
        <main className="portfolioEvidenceWorkspace">
          <section className="portfolioEvidenceLibrary" aria-label="Evidence library">
            <header>
              <div>
                <p className="eyebrow">Evidence library</p>
                <h2>Choose the work that tells your story</h2>
              </div>
              <span>{filteredEvidence.length} shown</span>
            </header>

            <nav aria-label="Filter portfolio evidence">
              {FILTERS.map((portfolioFilter) => {
                const count =
                  portfolioFilter.id === 'all'
                    ? evidence.length
                    : evidence.filter(
                        (item) => item.kind === portfolioFilter.id,
                      ).length;

                return (
                  <button
                    aria-pressed={filter === portfolioFilter.id}
                    className={filter === portfolioFilter.id ? 'active' : ''}
                    key={portfolioFilter.id}
                    onClick={() => handleFilterChange(portfolioFilter.id)}
                    type="button"
                  >
                    {portfolioFilter.label}
                    <span>{count}</span>
                  </button>
                );
              })}
            </nav>

            {filteredEvidence.length > 0 ? (
              <div className="portfolioEvidenceGrid">
                {filteredEvidence.map((item) => {
                  const meta = EVIDENCE_META[item.kind];
                  const Icon = meta.icon;
                  const isFeatured = featuredIds.includes(item.id);
                  const isSelected = selectedEvidence?.id === item.id;
                  const featureLimitReached =
                    !isFeatured && featuredEvidence.length >= 3;

                  return (
                    <article
                      className={`${item.kind} ${isSelected ? 'selected' : ''}`}
                      key={item.id}
                    >
                      <header>
                        <span>
                          <Icon size={15} />
                          {meta.label}
                        </span>
                        <button
                          aria-label={
                            isFeatured
                              ? `Remove ${item.title} from featured evidence`
                              : `Feature ${item.title}`
                          }
                          aria-pressed={isFeatured}
                          className={isFeatured ? 'featured' : ''}
                          disabled={featureLimitReached}
                          onClick={() => onToggleFeatured(item.id)}
                          title={
                            featureLimitReached
                              ? 'Three evidence items are already featured'
                              : isFeatured
                                ? 'Remove from featured evidence'
                                : 'Feature this evidence'
                          }
                          type="button"
                        >
                          <Pin fill={isFeatured ? 'currentColor' : 'none'} size={16} />
                        </button>
                      </header>

                      <button
                        className="portfolioEvidenceSelect"
                        onClick={() => setSelectedEvidenceId(item.id)}
                        type="button"
                      >
                        <span>{item.subtitle}</span>
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                        <footer>
                          <em>{item.metric}</em>
                          <small>{formatEvidenceDate(item.timestamp)}</small>
                        </footer>
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="portfolioEmptyState">
                <Target size={25} />
                <strong>No evidence in this category yet.</strong>
                <span>Complete the matching ZyloXP activity to add it here.</span>
                <button onClick={() => handleFilterChange('all')} type="button">
                  Show all evidence
                </button>
              </div>
            )}
          </section>

          {selectedEvidence && (
            <section
              className="portfolioEvidenceDetail"
              aria-label="Selected evidence details"
            >
              <header>
                <span className={selectedEvidence.kind}>
                  {(() => {
                    const DetailIcon = EVIDENCE_META[selectedEvidence.kind].icon;
                    return <DetailIcon size={20} />;
                  })()}
                </span>
                <div>
                  <p className="eyebrow">Selected evidence</p>
                  <h2>{selectedEvidence.title}</h2>
                  <p>{selectedEvidence.description}</p>
                </div>
                <strong>{selectedEvidence.metric}</strong>
              </header>

              <div className="portfolioEvidenceDetailBody">
                <div>
                  <span>Skill signals</span>
                  <div className="portfolioSkillTags">
                    {selectedEvidence.skills.map((skill) => (
                      <em key={skill}>{skill}</em>
                    ))}
                  </div>
                  <button
                    className="secondaryButton"
                    onClick={() => onOpenSource(selectedEvidence)}
                    type="button"
                  >
                    Open original work
                    <ChevronRight size={16} />
                  </button>
                </div>

                <label>
                  <span>Reflection</span>
                  <textarea
                    aria-label={`Reflection for ${selectedEvidence.title}`}
                    maxLength={280}
                    onChange={(event) =>
                      onNoteChange(selectedEvidence.id, event.currentTarget.value)
                    }
                    placeholder="What did you decide, measure, or improve?"
                    value={notes[selectedEvidence.id] ?? ''}
                  />
                  <small>
                    {(notes[selectedEvidence.id] ?? '').length}/280
                  </small>
                </label>
              </div>
            </section>
          )}
        </main>

        <aside className="portfolioPreview" aria-label="Portfolio preview">
          <header>
            <span>
              <Award size={21} />
            </span>
            <div>
              <p className="eyebrow">Live preview</p>
              <h2>Featured profile</h2>
            </div>
          </header>

          <label className="portfolioHeadlineField">
            <span>Professional headline</span>
            <input
              aria-label="Professional headline"
              maxLength={80}
              onChange={(event) => onHeadlineChange(event.currentTarget.value)}
              placeholder={`Emerging ${role}`}
              type="text"
              value={headline}
            />
            <small>{headline.length}/80</small>
          </label>

          <section className="portfolioProfilePreview">
            <header>
              <span>ZW</span>
              <div>
                <strong>{headline.trim() || `Emerging ${role}`}</strong>
                <small>{role} pathway · {readiness}% ready</small>
              </div>
            </header>

            <p>
              {featuredEvidence.length === 0
                ? 'Feature three evidence items to build a concise proof-of-skill summary.'
                : `Hands-on evidence across ${
                    featuredSkills.length > 0
                      ? featuredSkills.join(', ')
                      : 'technical practice'
                  }, supported by ${featuredEvidence.length} selected ${
                    featuredEvidence.length === 1 ? 'artifact' : 'artifacts'
                  }.`}
            </p>

            <div className="portfolioFeaturedSlots">
              {Array.from({ length: 3 }, (_, index) => {
                const item = featuredEvidence[index];

                return item ? (
                  <div key={item.id}>
                    <button
                      onClick={() => setSelectedEvidenceId(item.id)}
                      type="button"
                    >
                      <span>{EVIDENCE_META[item.kind].label}</span>
                      <strong>{item.title}</strong>
                      <small>{item.metric}</small>
                    </button>
                    <button
                      aria-label={`Remove ${item.title} from featured evidence`}
                      onClick={() => onToggleFeatured(item.id)}
                      title="Remove from featured evidence"
                      type="button"
                    >
                      <Pin fill="currentColor" size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="empty" key={`empty-${index}`}>
                    <span>{index + 1}</span>
                    <strong>Evidence slot</strong>
                    <small>Pin an item from the library</small>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="portfolioReadinessCheck">
            <header>
              <span>Portfolio check</span>
              <strong>{Number(headlineReady) + Number(featureSetReady)}/2</strong>
            </header>
            <div className={headlineReady ? 'complete' : ''}>
              <CheckCircle2 size={16} />
              <span>Add a professional headline</span>
            </div>
            <div className={featureSetReady ? 'complete' : ''}>
              <CheckCircle2 size={16} />
              <span>Feature three evidence items</span>
            </div>
            <small>
              {reflectedCount}/{featuredEvidence.length} featured items include a
              reflection
            </small>
          </section>

          <button
            className="primaryButton fullWidth"
            disabled={!readyToPublish}
            onClick={onPublish}
            type="button"
          >
            <FileCheck2 size={17} />
            {publishCount > 0
              ? 'Save portfolio update'
              : `Mark portfolio ready · +${rewardXp} XP`}
          </button>
        </aside>
      </div>
    </section>
  );
}
