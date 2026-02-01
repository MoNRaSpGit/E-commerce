// frontend/src/components/CategoriaCascadaFilter.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/categoriaCascada.css";

/**
 * Menú cascada:
 * - Primer nivel: categorías
 * - Segundo nivel: subcategorías (si existen)
 * - Si elegís una categoría con sub, podés elegir:
 *    - "Todas" (solo categoría)
 *    - una sub (categoria:sub)
 *
 * El valor final queda en URL param: cat
 * Ej:
 *  - cat=bebidas
 *  - cat=bebidas:con_alcohol
 */
export default function CategoriaCascadaFilter({
  categoriasParaSelect = [], // [{value,label}] ya filtradas por "existentes"
  subcategorias = {}, // { bebidas: [{value,label}], helados: [...] }
  selectedCatRaw = "", // string de URL: "" | "bebidas" | "bebidas:con_alcohol"
  searchParams,
  setSearchParams,
  placeholder = "Todas las categorías",
}) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [hoverCat, setHoverCat] = useState(""); // categoria value en hover

  const currentLabel = useMemo(() => {
    if (!selectedCatRaw) return placeholder;

    const [cat, sub] = selectedCatRaw.split(":");
    const catObj = categoriasParaSelect.find((c) => c.value === cat);

    if (!catObj) return placeholder;
    if (!sub) return catObj.label;

    const subs = subcategorias?.[cat] || [];
    const subObj = subs.find((s) => s.value === sub);

    return subObj ? `${catObj.label} · ${subObj.label}` : catObj.label;
  }, [selectedCatRaw, categoriasParaSelect, subcategorias, placeholder]);

  const hoverCatLabel = useMemo(() => {
    const c = categoriasParaSelect.find((x) => x.value === hoverCat);
    return c?.label || "";
  }, [hoverCat, categoriasParaSelect]);

  const hoverSubs = useMemo(() => {
    return subcategorias?.[hoverCat] || [];
  }, [hoverCat, subcategorias]);

  // Cerrar al click afuera
  useEffect(() => {
    if (!open) return;

    const onDown = (e) => {
      const el = wrapRef.current;
      if (!el) return;
      if (!el.contains(e.target)) setOpen(false);
    };

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  function setCatParam(nextValue, opts = {}) {
    const nextParams = new URLSearchParams(searchParams);

    if (nextValue) nextParams.set("cat", nextValue);
    else nextParams.delete("cat");

    // ✅ si el usuario eligió categoría/sub, limpiamos búsqueda para evitar confusión
    if (opts.clearQ) nextParams.delete("q");

    setSearchParams(nextParams);
  }

  function onPickAll() {
    setCatParam("");
    setHoverCat(""); // ✅ limpia highlight visual
    setOpen(false);
  }


  function onPickCat(catValue) {
    setCatParam(catValue, { clearQ: true });
    setOpen(false);
  }

  function onPickSub(catValue, subValue) {
    setCatParam(`${catValue}:${subValue}`, { clearQ: true });
    setOpen(false);
  }


  return (
    <div className="cat-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="cat-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          // al abrir, si no hay hover todavía, apuntamos a la primera categoría
          if (!open && !selectedCatRaw && categoriasParaSelect.length > 0) {
            // ✅ si estás en "Todas", NO seteamos hover (no se pinta ninguna)
            setHoverCat("");
          } else if (!open && !hoverCat && categoriasParaSelect.length > 0) {
            // ✅ si hay selección previa, y no hay hover, apuntamos a la primera para UX
            setHoverCat(categoriasParaSelect[0].value);
          }

        }}
      >
        <span className="cat-trigger-label">{currentLabel}</span>
        <span className="cat-trigger-caret">▾</span>
      </button>

      {open && (
        <div className="cat-popover" role="menu">
          {/* Columna izquierda */}
          <div className="cat-col cat-col-left">
            <button
              type="button"
              className="cat-item"
              onClick={onPickAll}
              role="menuitem"
            >
              <span className="cat-item-text">{placeholder}</span>
            </button>

            <div className="cat-sep" />

            {categoriasParaSelect.map((c) => {
              const hasSubs = (subcategorias?.[c.value] || []).length > 0;
              const isActiveHover = hoverCat === c.value;

              return (
                <button
                  key={c.value}
                  type="button"
                  className={`cat-item ${isActiveHover ? "is-hover" : ""}`}
                  onMouseEnter={() => setHoverCat(c.value)}
                  onFocus={() => setHoverCat(c.value)}
                  onClick={() => {
                    if (!hasSubs) onPickCat(c.value);
                    else {
                      // si tiene subs, click NO selecciona todavía (clásico cascada)
                      // solo deja el hover para elegir sub a la derecha
                      setHoverCat(c.value);
                    }
                  }}
                  role="menuitem"
                >
                  <span className="cat-item-text">{c.label}</span>

                  {/* flecha alineada (si tiene subs) */}
                  <span className="cat-item-arrow" aria-hidden="true">
                    {hasSubs ? ">" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Columna derecha (solo si la categoría hover tiene subs) */}
          {hoverSubs.length > 0 && (
            <div className="cat-col cat-col-right">
              <div className="cat-right-title">{hoverCatLabel}</div>

              <button
                type="button"
                className="cat-item"
                onClick={() => onPickCat(hoverCat)}
                role="menuitem"
              >
                <span className="cat-item-text">Todas</span>
              </button>

              <div className="cat-sep" />

              {hoverSubs.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className="cat-item"
                  onClick={() => onPickSub(hoverCat, s.value)}
                  role="menuitem"
                >
                  <span className="cat-item-text">{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
