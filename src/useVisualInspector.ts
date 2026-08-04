import { useEffect, useState } from 'react';

export function useVisualInspector(resetKey: string) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [resetKey]);

  useEffect(() => {
    if (!expanded) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    if (scrollbarWidth > 0) {
      const currentPaddingRight =
        Number.parseFloat(
          window.getComputedStyle(document.body).paddingRight,
        ) || 0;
      document.body.style.paddingRight = `${
        currentPaddingRight + scrollbarWidth
      }px`;
    }
    document.body.style.overflow = 'hidden';

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setExpanded(false);
    }

    document.addEventListener('keydown', handleEscape, true);
    return () => {
      document.removeEventListener('keydown', handleEscape, true);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [expanded]);

  return {
    expanded,
    toggleExpanded: () => setExpanded((isExpanded) => !isExpanded),
  };
}
