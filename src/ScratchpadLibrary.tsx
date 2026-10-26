import { ArrowRight, Download, NotebookPen, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { getSearchResultScore } from './searchRanking';
import { MAX_QUESTION_SCRATCHPADS, updateSavedScratchpad } from './questionScratchpads';
import { useSavedScratchpads } from './useSavedScratchpads';
import './ScratchpadLibrary.css';

type QuestionSource = { id: string; subtopic: string; topic: string; prompt: string };
export type ScratchpadLibraryItem = {
  id: string; text: string; title: string; topic: string; prompt: string; questionIndex: number | null;
};

export function getScratchpadItems(notes: Record<string, string>, questions: QuestionSource[]): ScratchpadLibraryItem[] {
  const sources = new Map(questions.map((question, index) => [question.id, { question, index }]));
  return Object.entries(notes).map(([id, text]) => {
    const source = sources.get(id);
    return { id, text, title: source?.question.subtopic ?? (text.trim().split(/\r?\n/)[0].slice(0, 80) || 'Untitled working'),
      topic: source?.question.topic ?? 'Unavailable questions', prompt: source?.question.prompt ?? '', questionIndex: source?.index ?? null };
  }).sort((a, b) => a.topic.localeCompare(b.topic) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
}

export function filterScratchpads(items: ScratchpadLibraryItem[], query: string, topic: string) {
  return items.flatMap((item) => {
    if (topic && item.topic !== topic) return [];
    const score = query.trim() ? getSearchResultScore({ title: item.title, subtitle: `${item.topic} ${item.prompt}`, keywords: item.text, kind: 'Scratchpad' }, query) : 0;
    return score === null ? [] : [{ item, score }];
  }).sort((a, b) => a.score - b.score).map(({ item }) => item);
}

export function exportScratchpadText(items: ScratchpadLibraryItem[]) {
  return `ZyloXP - Saved scratchpads\n${items.length} ${items.length === 1 ? 'scratchpad' : 'scratchpads'}\n\n`
    + items.map((item) => `${item.title}\n${item.topic}\nQuestion: ${item.id}\n${item.prompt ? `${item.prompt}\n` : ''}\n${item.text}\n`).join('\n--------------------\n\n');
}

const WRITE_ERRORS = {
  unavailable: 'Storage is unavailable. Nothing was changed. Try again when storage is available.',
  damaged: 'Saved scratchpads could not be read. Your stored work has been left unchanged.',
  conflict: 'This scratchpad changed elsewhere. The newer version has been kept.',
  capacity: 'All 80 slots are in use. Remove another saved scratchpad before undoing.',
  restoring: 'A backup is being restored. Wait for the page to reload before changing saved work.',
};

export function ScratchpadLibrary({ questions, onOpen, onBrowse }: {
  questions: QuestionSource[]; onOpen: (questionIndex: number) => void; onBrowse: () => void;
}) {
  const { collection, refresh } = useSavedScratchpads();
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('');
  const [removed, setRemoved] = useState<ScratchpadLibraryItem[]>([]);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const exportRef = useRef<HTMLButtonElement>(null);
  const items = useMemo(() => getScratchpadItems(collection.ok ? collection.notes : {}, questions), [collection, questions]);
  const visible = filterScratchpads(items, query, topic);
  const topics = [...new Set([...items.map((item) => item.topic), ...(topic ? [topic] : [])])].sort();

  function clearFilters() { setQuery(''); setTopic(''); }
  function remove(item: ScratchpadLibraryItem) {
    const result = updateSavedScratchpad(item.id, '', item.text);
    if (!result.ok) { setMessage({ text: WRITE_ERRORS[result.reason], error: true }); refresh(); return; }
    setRemoved((current) => [...current, item]);
    setMessage(null);
    requestAnimationFrame(() => undoRef.current?.focus({ preventScroll: true }));
  }
  function undo() {
    const item = removed.at(-1);
    if (!item) return;
    const result = updateSavedScratchpad(item.id, item.text, null);
    if (!result.ok) { setMessage({ text: WRITE_ERRORS[result.reason], error: true }); refresh(); return; }
    setRemoved((current) => current.slice(0, -1));
    clearFilters();
    setMessage({ text: `${item.title} restored.`, error: false });
    if (removed.length === 1) requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
  }
  function download() {
    let url: string | null = null;
    let link: HTMLAnchorElement | null = null;
    try {
      url = URL.createObjectURL(new Blob([exportScratchpadText(visible)], { type: 'text/plain;charset=utf-8' }));
      link = document.createElement('a');
      link.href = url;
      link.download = 'zyloxp-scratchpads.txt';
      document.body.append(link);
      link.click();
      setMessage({ text: `${visible.length} ${visible.length === 1 ? 'scratchpad' : 'scratchpads'} exported.`, error: false });
    } catch { setMessage({ text: 'Export could not start. Your saved work is unchanged. Try exporting again.', error: true }); }
    finally {
      link?.remove();
      exportRef.current?.focus({ preventScroll: true });
      if (url) { const objectUrl = url; window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0); }
    }
  }

  return <section className="scratchpadLibrary" aria-labelledby="scratchpad-library-title">
    <header className="scratchpadLibraryHeader">
      <NotebookPen size={24} aria-hidden="true" />
      <div><h2 id="scratchpad-library-title" ref={headingRef} tabIndex={-1}>Scratchpads</h2>
        <p>{collection.ok ? `${items.length} of ${MAX_QUESTION_SCRATCHPADS} saved on this device` : 'Saved working unavailable'}</p></div>
      <button ref={exportRef} className="secondaryButton" type="button" disabled={!collection.ok || !visible.length} onClick={download}>
        <Download size={16} aria-hidden="true" />Export {query || topic ? 'results' : 'all'}
      </button>
    </header>
    {!collection.ok && <div className="scratchpadLibraryNotice" role="alert">
      <p>{WRITE_ERRORS[collection.reason]}</p><button className="secondaryButton" type="button" onClick={refresh}><RotateCcw size={16} />Retry</button>
    </div>}
    {collection.ok && items.length >= MAX_QUESTION_SCRATCHPADS && <p className="scratchpadLibraryNotice" role="status">All 80 slots are in use. Export or review your saved working before removing an entry.</p>}
    {removed.length > 0 && <div className="scratchpadLibraryUndo" role="status">
      <span>Removed: {removed.at(-1)!.title}{removed.length > 1 ? ` (${removed.length} removals can be undone)` : ''}</span>
      <button ref={undoRef} className="secondaryButton" type="button" onClick={undo}><RotateCcw size={16} />Undo removal</button>
    </div>}
    {message && <p className="scratchpadLibraryNotice" role={message.error ? 'alert' : 'status'}>{message.text}</p>}
    {collection.ok && (items.length > 0 || query || topic) && <div className="notebookLibraryFilters">
      <label className="notebookLibrarySearch"><span>Search scratchpads</span><span><Search size={17} aria-hidden="true" />
        <input type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} /></span></label>
      <label><span>Scratchpad topic</span><select value={topic} onChange={(event) => setTopic(event.currentTarget.value)}>
        <option value="">All topics</option>{topics.map((value) => <option key={value}>{value}</option>)}</select></label>
      <span role="status">{visible.length} of {items.length} scratchpads</span>
      {(query || topic) && <button className="iconButton ghost" type="button" aria-label="Clear scratchpad filters" title="Clear filters" onClick={clearFilters}><X size={17} /></button>}
    </div>}
    {collection.ok && visible.length === 0 && <div className="notebookArtifactEmpty">
      <NotebookPen size={26} aria-hidden="true" />
      <strong>{query || topic ? 'No matching scratchpads' : 'No saved working yet'}</strong>
      <button className="secondaryButton" type="button" onClick={query || topic ? clearFilters : onBrowse}>{query || topic ? 'Clear filters' : 'Open practice'}<ArrowRight size={16} /></button>
    </div>}
    <div className="scratchpadLibraryRows">{visible.map((item) => <article key={item.id} aria-label={`${item.title} scratchpad`}>
      <div className="scratchpadLibraryCopy">
        <small>{item.topic}</small><h3>{item.title}</h3>
        {item.prompt && <p>{item.prompt}</p>}
        <details><summary>View working</summary><pre>{item.text || 'Empty scratchpad'}</pre></details>
      </div>
      <div className="scratchpadLibraryActions">
        {item.questionIndex !== null && <button className="secondaryButton" type="button" onClick={() => onOpen(item.questionIndex!)}>Continue question<ArrowRight size={16} aria-hidden="true" /></button>}
        <button className="iconButton ghost" type="button" aria-label={`Remove ${item.title} scratchpad`} title="Remove scratchpad" onClick={() => remove(item)}><Trash2 size={17} aria-hidden="true" /></button>
      </div>
    </article>)}</div>
  </section>;
}
