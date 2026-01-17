import { useEffect } from "react";

/**
 * Llama a handler cuando el click ocurre fuera de los refs.
 * @param {Array<React.RefObject<HTMLElement>>} refs
 * @param {(e: MouseEvent) => void} handler
 * @param {boolean} enabled
 */
export function useOnClickOutside(refs, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onMouseDown = (e) => {
      const clickedOutside = refs.every((r) => {
        const el = r?.current;
        return !el || !el.contains(e.target);
      });

      if (clickedOutside) handler?.(e);
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [refs, handler, enabled]);
}
