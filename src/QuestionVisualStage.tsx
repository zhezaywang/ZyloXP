import {
  Activity,
  Atom,
  CheckCircle2,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RefreshCw,
} from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import type { LessonQuestion } from './data';
import { getQuestionAtlasConcept } from './electricalAtlasData';
import { resolvePublicAssetPath } from './publicAsset';
import { QuestionSchematic } from './QuestionSchematic';
import { useVisualInspector } from './useVisualInspector';

const QuestionAtlasCompanion = lazy(() =>
  import('./ElectricalAtlas').then((module) => ({
    default: module.QuestionAtlasCompanion,
  })),
);

type QuestionVisualStageProps = {
  onOpenAtlasConcept: (conceptId: string) => void;
  onOpenAtlasGame: (gameId: string) => void;
  question: LessonQuestion;
  revealed: boolean;
};

function ConceptPanelFallback() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="deferredPanelFallback"
      role="status"
    >
      <RefreshCw aria-hidden="true" size={18} />
      <span>Loading panel</span>
    </div>
  );
}

export function QuestionVisualStage({
  onOpenAtlasConcept,
  onOpenAtlasGame,
  question,
  revealed,
}: QuestionVisualStageProps) {
  const [mode, setMode] = useState<'concept' | 'schematic' | 'source'>(
    'schematic',
  );
  const [isPowered, setIsPowered] = useState(true);
  const { expanded, toggleExpanded } = useVisualInspector(question.id);
  const atlasConcept = getQuestionAtlasConcept(question.topic);
  const result = revealed ? question.options[question.correctIndex] : '—';
  const target = question.formula.split('=')[0]?.trim() || 'result';

  return (
    <section
      aria-label={
        expanded
          ? `${question.subtopic} expanded engineering visual`
          : 'Interactive question visual'
      }
      aria-modal={expanded ? true : undefined}
      className={`questionVisualStage ${
        expanded ? 'visualStageExpanded' : ''
      }`}
      role={expanded ? 'dialog' : undefined}
    >
      <header className="visualStageHeader">
        <div>
          <span>Engineering visual</span>
          <strong>
            {mode === 'concept' && atlasConcept
              ? atlasConcept.interactiveLabel
              : question.visualLabel}
          </strong>
        </div>

        <div className="visualStageActions">
          <div className="visualModeSwitch" aria-label="Question visual mode">
            <button
              className={mode === 'schematic' ? 'active' : ''}
              onClick={() => setMode('schematic')}
              type="button"
            >
              <Activity size={14} />
              Schematic
            </button>
            {atlasConcept && (
              <button
                className={mode === 'concept' ? 'active' : ''}
                onClick={() => setMode('concept')}
                type="button"
              >
                <Atom size={14} />
                Concept
              </button>
            )}
            <button
              className={mode === 'source' ? 'active' : ''}
              onClick={() => setMode('source')}
              type="button"
            >
              <ImageIcon size={14} />
              Reference
            </button>
          </div>

          <button
            aria-label={
              isPowered ? 'Pause diagram animation' : 'Play diagram animation'
            }
            aria-pressed={isPowered}
            className={`visualPowerButton ${isPowered ? 'active' : ''}`}
            disabled={mode !== 'schematic'}
            onClick={() => setIsPowered((powered) => !powered)}
            title={
              isPowered ? 'Pause diagram animation' : 'Play diagram animation'
            }
            type="button"
          >
            {isPowered ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            aria-expanded={expanded}
            aria-label={
              expanded
                ? 'Close expanded question visual'
                : 'Expand question visual'
            }
            className={`visualInspectButton ${expanded ? 'active' : ''}`}
            onClick={toggleExpanded}
            title={expanded ? 'Close expanded visual' : 'Inspect visual'}
            type="button"
          >
            {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </header>

      <div className="visualInspectViewport">
        {mode === 'schematic' ? (
          <div
            className={`visualSchematicCanvas visual-${question.visualKind} ${
              isPowered ? 'powered' : 'paused'
            }`}
          >
            <QuestionSchematic
              powered={isPowered}
              question={question}
              revealed={revealed}
            />

            <div className="visualMeterReadout" aria-live="polite">
              <span>{revealed ? 'Calculated result' : 'Solve for'}</span>
              <strong>{revealed ? result : target}</strong>
            </div>
          </div>
        ) : mode === 'concept' && atlasConcept ? (
          <Suspense fallback={<ConceptPanelFallback />}>
            <QuestionAtlasCompanion
              conceptId={atlasConcept.id}
              onOpenConcept={onOpenAtlasConcept}
              onOpenGame={onOpenAtlasGame}
              revealed={revealed}
            />
          </Suspense>
        ) : (
          <div className="verifiedDiagramView">
            <img
              src={resolvePublicAssetPath(question.diagram)}
              alt={question.diagramAlt}
            />
            <span>
              <CheckCircle2 size={14} />
              Verified engineering diagram
            </span>
          </div>
        )}
      </div>

      <footer className="visualFormulaBar">
        <span>
          <Activity size={14} />
          Governing relation
        </span>
        <strong>{question.formula}</strong>
      </footer>
    </section>
  );
}
