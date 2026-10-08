import { RefreshCw, ImageOff } from 'lucide-react';
import { useState } from 'react';

export function ReferenceImage({ src, alt }: { src: string; alt: string }) {
  // A resource change gets an independent loading/error state.
  return <ReferenceImageResource key={src} src={src} alt={alt} />;
}

function ReferenceImageResource({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const retrySource = attempt ? `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}` : src;

  return (
    <div className="referenceImageResource" aria-busy={status === 'loading'}>
      {status === 'loading' && <div className="referenceImageLoading" role="status"><span className="srOnly">Loading reference diagram</span></div>}
      {status === 'error' ? (
        <div className="referenceImageError" role="alert">
          <ImageOff size={24} aria-hidden="true" />
          <strong>Reference diagram unavailable</strong>
          <span>The live diagram is still available.</span>
          <button className="secondaryButton" type="button" onClick={() => { setStatus('loading'); setAttempt((value) => value + 1); }}>
            <RefreshCw size={16} aria-hidden="true" />Retry image
          </button>
        </div>
      ) : <img alt={alt} src={retrySource} onLoad={() => setStatus('loaded')} onError={() => setStatus('error')} />}
    </div>
  );
}
