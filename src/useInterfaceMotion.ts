import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { PointerEvent, RefObject } from 'react';

const motionQuery = '(prefers-reduced-motion: reduce)';
export const MotionEnabledContext = createContext(false);

function subscribeToMotionPreference(onChange: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function subscribeToVisibility(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

export function useInterfaceMotion(reducedMotion: boolean) {
  const systemReducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(motionQuery).matches,
    () => true,
  );
  const visible = useSyncExternalStore(
    subscribeToVisibility,
    () => document.visibilityState !== 'hidden',
    () => false,
  );
  return { reduced: reducedMotion || systemReducedMotion, systemReduced: systemReducedMotion, visible };
}

export function usePageArrival(
  rootRef: RefObject<HTMLElement | null>,
  routeKey: string,
  enabled: boolean,
) {
  const lastRoute = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      lastRoute.current = routeKey;
      return;
    }
    const root = rootRef.current;
    if (!root || lastRoute.current === routeKey) return;
    let frame = 0;
    const animations: Animation[] = [];

    const enter = () => {
      if (root.querySelector('.pageLoadingState')) return;
      observer.disconnect();
      lastRoute.current = routeKey;
      // Limit entrances to headings and catalog items, not workspace or simulation transforms.
      const targets = Array.from(root.querySelectorAll<HTMLElement>(
        'h1, .statCard, .labCard, .careerCard, .lessonQuestionBlock h2',
      )).filter((element) => {
        const rect = element.getBoundingClientRect();
        return !element.closest('[role="dialog"]') && rect.width > 0 && rect.height > 0
          && rect.top < innerHeight && rect.bottom > 0;
      }).slice(0, 6);

      targets.forEach((element, index) => {
        if (typeof element.animate !== 'function') return;
        const animation = element.animate(
          [{ opacity: 0.35, translate: '0 8px' }, { opacity: 1, translate: '0 0' }],
          { duration: 280, delay: index * 35, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', fill: 'backwards' },
        );
        animation.id = 'zylo-page-arrival';
        animations.push(animation);
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Let route focus and scroll restoration finish before measuring visibility.
        frame = requestAnimationFrame(enter);
      });
    };
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
    schedule();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      animations.forEach((animation) => animation.cancel());
    };
  }, [enabled, rootRef, routeKey]);
}

export function useCharacterMotion() {
  const motionEnabled = useContext(MotionEnabledContext);
  const guideRef = useRef<HTMLElement>(null);
  const characterRef = useRef<HTMLButtonElement>(null);
  const frame = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const [inView, setInView] = useState(false);
  const active = motionEnabled && inView;

  function resetPointer() {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    const style = characterRef.current?.style;
    for (const name of ['--zy-look-x', '--zy-look-y', '--zy-shift-x']) style?.setProperty(name, '0px');
    for (const name of ['--zy-tilt-x', '--zy-tilt-y']) style?.setProperty(name, '0deg');
  }

  useEffect(() => {
    const guide = guideRef.current;
    if (!guide) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(guide);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) resetPointer();
    return resetPointer;
  }, [active]);

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!active || event.pointerType === 'touch') return;
    pointer.current = { x: event.clientX, y: event.clientY };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const button = characterRef.current;
      if (!button) return;
      const bounds = button.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = Math.max(-1, Math.min(1, ((pointer.current.x - bounds.left) / bounds.width - 0.5) * 2));
      const y = Math.max(-1, Math.min(1, ((pointer.current.y - bounds.top) / bounds.height - 0.5) * 2));
      button.style.setProperty('--zy-look-x', `${x * 4}px`);
      button.style.setProperty('--zy-look-y', `${y * 3}px`);
      button.style.setProperty('--zy-tilt-x', `${y * -3}deg`);
      button.style.setProperty('--zy-tilt-y', `${x * 5}deg`);
      button.style.setProperty('--zy-shift-x', `${x}px`);
    });
  }

  return { active, guideRef, characterRef, handlePointerMove, resetPointer };
}
