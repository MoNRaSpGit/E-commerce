import { useState } from "react";
import toast from "react-hot-toast";

export default function ManualCategoryButtons({ onAdd, onAfterAdd }) {
  const cats = [{ key: "manual", label: "Producto manual" }];

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");

    const close = () => {
    setOpen(false);
    setLabel("");
    setPrice("");

    setTimeout(() => {
      onAfterAdd?.();
    }, 400);
  };

  const confirm = () => {
    const p = Number(String(price || "").replace(",", "."));
    if (!Number.isFinite(p) || p <= 0) {
      toast.error("Precio inválido");
      return;
    }
    onAdd?.({ label, price: p });
    close();
  };

  return (
    <>
      <div className="oper-manual-grid">
        {cats.map((c) => (
          <button
            key={c.key}
            type="button"
            className="oper-manual-btn"
            onClick={() => {
              setLabel(c.label);
              setPrice("");
              setOpen(true);
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {open && (
        <div className="oper-modal__backdrop" onMouseDown={close}>
          <div className="oper-modal__card" onMouseDown={(e) => e.stopPropagation()}>
            <h2 className="oper-modal__title">Ingresar precio</h2>

            <div className="oper-modal__field">
              <label className="oper-modal__label">Precio</label>
              <input
                className="oper-modal__input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    confirm();
                  }
                }}
                autoComplete="off"
                inputMode="decimal"
                autoFocus
              />
            </div>

            <div className="oper-modal__actions">
              <button type="button" className="oper-modal__btn" onClick={close}>
                Cancelar
              </button>
              <button
                type="button"
                className="oper-modal__btn oper-modal__btn--primary"
                onClick={confirm}
                disabled={!String(price || "").trim()}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}