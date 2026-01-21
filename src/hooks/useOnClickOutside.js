import { useEffect } from "react";

/**
 * Llama a handler cuando el click ocurre fuera de los refs.
 * @param {Array<React.RefObject<HTMLElement>>} refs
 * @param {(e: Event) => void} handler
 * @param {boolean} enabled
 */
export function useOnClickOutside(refs, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onPointerDown = (e) => {
      const path = e.composedPath?.() || [];

      const clickedOutside = refs.every((r) => {
        const el = r?.current;
        if (!el) return true;

        // si el browser soporta composedPath, usamos eso (más fiable con SVG)
        if (path.length) return !path.includes(el);

        // fallback clásico
        return !el.contains(e.target);
      });

      if (clickedOutside) handler?.(e);
    };

    // pointerdown + capture para evitar "cierro y reabro"
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [handler, enabled, refs]);
}
