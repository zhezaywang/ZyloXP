import { useEffect, useRef, useState } from 'react';

export function useVisualInspector(resetKey: string) {
  const [expanded, setExpanded] = useState(false);
  const inspectorRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setExpanded(false);
  }, [resetKey]);

  useEffect(() => {
    if (!expanded) {
      return;
    }

    const inspector = inspectorRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => Array.from(inspector?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ) ?? []).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0 && !element.closest('[inert]'));
    const focusFirst = () => (focusable()[0] ?? inspector)?.focus({ preventScroll: true });
    focusFirst();

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
      if (event.key === 'Tab') {
        const targets = focusable();
        const index = targets.indexOf(document.activeElement as HTMLElement);
        if (!targets.length || index < 0 || (event.shiftKey ? index === 0 : index === targets.length - 1)) {
          event.preventDefault();
          (event.shiftKey ? targets.at(-1) ?? inspector : targets[0] ?? inspector)?.focus({ preventScroll: true });
        }
        return;
      }
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setExpanded(false);
    }

    function containFocus(event: FocusEvent) {
      if (inspector && event.target instanceof Node && !inspector.contains(event.target)) focusFirst();
    }

    document.addEventListener('keydown', handleEscape, true);
    document.addEventListener('focusin', containFocus);
    return () => {
      document.removeEventListener('keydown', handleEscape, true);
      document.removeEventListener('focusin', containFocus);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [expanded]);

  return {
    expanded,
    inspectorRef,
    toggleExpanded: () => setExpanded((isExpanded) => !isExpanded),
  };
}
