import { ArrowLeft, ArrowRight, History, RotateCcw, Search } from 'lucide-react';
import { useRef, useState } from 'react';
import type { LessonQuestion } from './data';
import { SprintReview } from './SprintReview';
import { filterSessionHistory, getSessionReplayIndices, SESSION_HISTORY_LIMIT } from './sessionHistoryModel';
import type { SessionHistoryRecord } from './sessionHistoryModel';
import './SessionHistory.css';

function sessionDate(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function elapsedLabel(record: SessionHistoryRecord) {
  const seconds = Math.round((record.completedAt - record.startedAt) / 1000);
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
}

export function SessionHistory({ records, selectedId, questions, bookmarkedIds, activeSessionLabel,
  onSelect, onBack, onPractice, onResume, onToggleBookmark }: {
  records: SessionHistoryRecord[];
  selectedId: string | null;
  questions: LessonQuestion[];
  bookmarkedIds: string[];
  activeSessionLabel: string | null;
  onSelect: (id: string | null) => void;
  onBack: () => void;
  onPractice: (record: SessionHistoryRecord, onlyMisses: boolean) => void;
  onResume: () => void;
  onToggleBookmark: (questionId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [onlyMisses, setOnlyMisses] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = records.find((record) => record.id === selectedId);
  const visible = filterSessionHistory(records, query, onlyMisses);
  const replayIndices = selected ? getSessionReplayIndices(selected, questions, false) : [];
  const retryIndices = selected ? getSessionReplayIndices(selected, questions, true) : [];
  const correct = selected?.items.filter((item) => item.answer.result === 'correct').length ?? 0;

  return <section className="sessionHistoryPage" aria-label="Session history">
    <header className="sessionHistoryHeader">
      <button className="secondaryButton" type="button" onClick={() => selectedId ? onSelect(null) : onBack()}>
        <ArrowLeft size={17} aria-hidden="true" />{selectedId ? 'All sessions' : 'Back to practice'}
      </button>
      <div><p className="eyebrow">Practice history</p><h1>{selected?.label ?? 'Session history'}</h1>
        <p>{selected ? sessionDate(selected.completedAt) : `Your latest ${SESSION_HISTORY_LIMIT} completed sessions, stored on this device.`}</p>
      </div>
    </header>
    {activeSessionLabel && <div className="sessionHistoryInProgress" role="status">
      <span>In progress: <strong>{activeSessionLabel}</strong></span>
      <button className="secondaryButton" type="button" onClick={onResume}>Resume session<ArrowRight size={17} aria-hidden="true" /></button>
    </div>}
    {selectedId && !selected ? <div className="sessionHistoryEmpty">
      <History size={28} aria-hidden="true" /><h2>Session not available</h2>
      <p>It may be outside your recent history or stored in another browser.</p>
      <button className="secondaryButton" type="button" onClick={() => onSelect(null)}>View recent sessions</button>
    </div> : selected ? <>
      <dl className="sessionHistoryScore" aria-label="Archived session score">
        <div><dt>Accuracy</dt><dd>{Math.round(correct / selected.items.length * 100)}%</dd></div>
        <div><dt>Correct</dt><dd>{correct}/{selected.items.length}</dd></div>
        <div><dt>XP earned</dt><dd>+{selected.earnedXp}</dd></div>
        <div><dt>Elapsed</dt><dd>{elapsedLabel(selected)}</dd></div>
      </dl>
      <div className="sessionHistoryActions">
        <button className="primaryButton" type="button" disabled={Boolean(activeSessionLabel) || retryIndices.length === 0}
          onClick={() => onPractice(selected, true)}><RotateCcw size={17} aria-hidden="true" />
          {retryIndices.length ? `Retry ${retryIndices.length} ${retryIndices.length === 1 ? 'miss' : 'misses'}` : 'No available misses'}
        </button>
        <button className="secondaryButton" type="button" disabled={Boolean(activeSessionLabel) || replayIndices.length === 0}
          onClick={() => onPractice(selected, false)}>Practice this set<ArrowRight size={17} aria-hidden="true" /></button>
      </div>
      {replayIndices.length < selected.items.length && <p className="sessionHistoryNotice" role="status">
        {replayIndices.length} of {selected.items.length} questions are still available unchanged. The review below preserves the original session.
      </p>}
      <SprintReview key={selected.id} items={selected.items} bookmarkedIds={bookmarkedIds}
        availableQuestionIds={replayIndices.map((index) => questions[index].id)} onToggleBookmark={onToggleBookmark} />
    </> : <>
      {records.length > 0 && <div className="sessionHistoryFilters">
        <label className="sessionHistorySearch"><span>Search sessions</span><span><Search size={17} aria-hidden="true" />
          <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} /></span></label>
        <label className="sessionHistoryCheckbox"><input type="checkbox" checked={onlyMisses} onChange={(event) => setOnlyMisses(event.currentTarget.checked)} />With misses</label>
        <p role="status">{visible.length} of {records.length} sessions</p>
      </div>}
      {visible.length > 0 ? <div className="sessionHistoryList">
        {visible.map((record) => {
          const right = record.items.filter((item) => item.answer.result === 'correct').length;
          const misses = record.items.length - right;
          return <article key={record.id}>
            <div><h2>{record.label}</h2><time dateTime={new Date(record.completedAt).toISOString()}>{sessionDate(record.completedAt)}</time>
              <p>{[...new Set(record.items.map((item) => item.question.topic))].join(' / ')}</p></div>
            <div className="sessionHistoryResult"><strong>{Math.round(right / record.items.length * 100)}%</strong><span>{right}/{record.items.length} correct</span><small>{misses ? `${misses} to review` : 'All correct'}</small></div>
            <button className="secondaryButton" type="button" aria-label={`Review ${record.label}, ${sessionDate(record.completedAt)}`}
              onClick={() => onSelect(record.id)}>Review<ArrowRight size={17} aria-hidden="true" /></button>
          </article>;
        })}
      </div> : <div className="sessionHistoryEmpty">
        <History size={28} aria-hidden="true" /><h2>{records.length ? 'No matching sessions' : 'Your next session starts here'}</h2>
        <p>{records.length ? 'No sessions match these filters.' : 'Completed sessions will appear here with their answers and worked solutions.'}</p>
        <button className="secondaryButton" type="button" onClick={() => {
          if (!records.length) { onBack(); return; }
          setQuery(''); setOnlyMisses(false); searchRef.current?.focus();
        }}>{records.length ? 'Clear filters' : 'Open practice'}</button>
      </div>}
    </>}
  </section>;
}
