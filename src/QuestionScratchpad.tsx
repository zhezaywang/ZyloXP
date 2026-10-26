import { Library, ListChecks, NotebookPen, NotebookTabs, RotateCcw, XCircle } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  createWorkingOutline, QUESTION_SCRATCHPAD_KEY, QUESTION_SCRATCHPAD_LIMIT,
  readQuestionDraft, readSavedScratchpad, loadSavedQuestionDraft, writeQuestionDraft,
} from './questionScratchpads';
import './QuestionScratchpad.css';

const SAVE_ERRORS = {
  capacity: 'All 80 scratchpads are in use. Clear an older scratchpad or keep this work as a field note.',
  unavailable: 'Device storage is unavailable. Retry the save or keep this work as a field note.',
  damaged: 'Saved scratchpads could not be read. They have been left unchanged.',
  conflict: 'A different version is saved on this device. Choose which version to keep.',
  pending: 'This recovered draft has not been saved to your device yet.',
  restoring: 'A backup is being restored. Saving is paused until the page reloads.',
};

export function QuestionScratchpad({ questionId, givenValues, onOpenJournal, onOpenLibrary, children }: {
  questionId: string;
  givenValues: string[];
  onOpenJournal: (text: string) => void;
  onOpenLibrary: () => void;
  children?: ReactNode;
}) {
  const [draft, setDraft] = useState(() => readQuestionDraft(questionId));
  const [open, setOpen] = useState(Boolean(draft.text) || !['saved', 'empty'].includes(draft.status));
  const [clearedText, setClearedText] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const panelId = useId();
  const statusId = useId();
  const saved = draft.status === 'saved' || draft.status === 'empty';

  useEffect(() => {
    function refresh(event: StorageEvent) {
      if (event.key !== null && event.key !== QUESTION_SCRATCHPAD_KEY) return;
      setDraft(readQuestionDraft(questionId));
      setClearedText(null);
    }
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, [questionId]);

  function changeText(text: string) {
    setClearedText(null);
    setDraft(writeQuestionDraft(questionId, text, draft.base));
  }

  function saveMyVersion() {
    try {
      const latest = readSavedScratchpad(window.localStorage, questionId);
      setDraft(writeQuestionDraft(questionId, draft.text, latest.ok ? latest.text : draft.base));
    } catch { setDraft(writeQuestionDraft(questionId, draft.text, draft.base)); }
  }

  return <>
    <div className="questionWorkTools">
      <button aria-label="Scratchpad" aria-controls={panelId} aria-expanded={open}
        className={open ? 'active' : ''} onClick={() => setOpen(!open)} type="button">
        <NotebookPen size={17} /><span>Scratchpad</span>
        {draft.text.trim() && <em data-unsaved={!saved}>{saved ? 'Saved' : 'Draft'}</em>}
      </button>
      {children}
    </div>
    {open && <section className="questionScratchpad" id={panelId} aria-label="Question scratchpad">
      <header>
        <span><NotebookPen size={17} /><strong>Scratchpad</strong></span>
        <div className="scratchpadActions">
          <button aria-label="Insert working outline" title="Insert working outline" type="button"
            disabled={Boolean(draft.text.trim())} onClick={() => {
              changeText(createWorkingOutline(givenValues));
              editorRef.current?.focus();
            }}><ListChecks size={17} /></button>
          <button aria-label="Undo clear scratchpad" title="Undo clear" type="button" disabled={clearedText === null}
            onClick={() => { if (clearedText !== null) changeText(clearedText); editorRef.current?.focus(); }}>
            <RotateCcw size={17} />
          </button>
          <button aria-label="Clear scratchpad" title="Clear scratchpad" type="button" disabled={!draft.text}
            onClick={() => { setClearedText(draft.text); setDraft(writeQuestionDraft(questionId, '', draft.base)); editorRef.current?.focus(); }}>
            <XCircle size={17} />
          </button>
        </div>
      </header>
      <textarea aria-label="Scratchpad notes" aria-describedby={statusId} ref={editorRef}
        maxLength={QUESTION_SCRATCHPAD_LIMIT} onChange={(event) => changeText(event.currentTarget.value)}
        placeholder="Equations and reasoning" rows={6} value={draft.text} />
      <div className="scratchpadSaveState" id={statusId} role="status">
        {saved ? draft.status === 'saved' ? 'Saved on this device' : 'Scratchpad empty'
          : draft.recovery === 'session' ? 'Not saved. Draft retained in this tab.'
            : 'Not saved. Keep this tab open to retain your draft.'}
      </div>
      {!saved && <div className="scratchpadSaveNotice" role="alert">
        <p>{SAVE_ERRORS[draft.status as keyof typeof SAVE_ERRORS]}</p>
        {draft.status === 'conflict' && <details>
          <summary>Saved version</summary><pre>{draft.savedText || 'Empty scratchpad'}</pre>
        </details>}
        <div>
          {draft.status === 'conflict' ? <>
            <button type="button" onClick={() => {
              const state = loadSavedQuestionDraft(questionId);
              setDraft(state);
              setClearedText(null);
            }}>Use saved version</button>
            <button type="button" onClick={saveMyVersion}>Save my version</button>
          </> : <button type="button" onClick={() => setDraft(writeQuestionDraft(questionId, draft.text, draft.base))}>
            <RotateCcw size={15} />Retry save
          </button>}
        </div>
      </div>}
      <footer>
        <span>{draft.text.length}/{QUESTION_SCRATCHPAD_LIMIT}</span>
        <button onClick={onOpenLibrary} type="button"><Library size={16} />All scratchpads</button>
        <button disabled={!draft.text.trim()} onClick={() => onOpenJournal(draft.text)} type="button">
          <NotebookTabs size={16} />Save as field note
        </button>
      </footer>
    </section>}
  </>;
}
