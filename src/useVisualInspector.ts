import { useEffect, useRef, useState } from 'react';
import { useModalFocus } from './useModalFocus';

export function useVisualInspector(resetKey: string) {
  const [expanded, setExpanded] = useState(false);
  const inspectorRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setExpanded(false);
  }, [resetKey]);

  useModalFocus(inspectorRef, expanded, () => setExpanded(false));

  return {
    expanded,
    inspectorRef,
    toggleExpanded: () => setExpanded((isExpanded) => !isExpanded),
  };
}
