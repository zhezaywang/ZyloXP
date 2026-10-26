import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const activeModals: symbol[] = [];

export function useModalFocus(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void, returnFocusRef?: RefObject<HTMLElement | null>) {
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const token = Symbol('modal');
    activeModals.push(token);
    const isTop = () => activeModals.at(-1) === token;
    const previousFocus = returnFocusRef?.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    )).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0 && !element.closest('[inert]'));
    const focusFirst = () => (focusable()[0] ?? dialog).focus({ preventScroll: true });
    focusFirst();
    const overflow = document.body.style.overflow;
    const padding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0) {
      const current = Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${current + scrollbar}px`;
    }
    document.body.style.overflow = 'hidden';
    function handleKey(event: KeyboardEvent) {
      if (!isTop()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close.current();
      } else if (event.key === 'Tab') {
        const targets = focusable();
        const index = targets.indexOf(document.activeElement as HTMLElement);
        if (!targets.length || index < 0 || (event.shiftKey ? index === 0 : index === targets.length - 1)) {
          event.preventDefault();
          (event.shiftKey ? targets.at(-1) ?? dialog : targets[0] ?? dialog)?.focus({ preventScroll: true });
        }
      }
    }
    function containFocus(event: FocusEvent) {
      if (isTop() && event.target instanceof Node && !dialog!.contains(event.target)) focusFirst();
    }
    document.addEventListener('keydown', handleKey, true);
    document.addEventListener('focusin', containFocus);
    return () => {
      document.removeEventListener('keydown', handleKey, true);
      document.removeEventListener('focusin', containFocus);
      activeModals.splice(activeModals.indexOf(token), 1);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = padding;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open, ref, returnFocusRef]);
}
