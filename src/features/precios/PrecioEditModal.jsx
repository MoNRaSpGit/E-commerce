export default function PrecioEditModal({
  open,
  onClose,
  nombre,
  precio,
  setPrecio,
  saving,
  onSave,
}) {
  if (!open) return null;

  return (
    <div
      className="oper-modal__backdrop"
      onMouseDown={onClose}
    >
      <div
        className="oper-modal__card"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="oper-modal__title">
          Actualizar precio
        </h2>

        <div
          style={{
            fontWeight: 900,
            marginBottom: 10,
          }}
        >
          {nombre}
        </div>

        <div className="oper-modal__field">

          <label className="oper-modal__label">
            Precio
          </label>

          <input
            className="oper-modal__input"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            onKeyDown={(e) => {

              if (e.key === "Enter") {
                e.preventDefault();
                if (!saving) onSave();
              }

              if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            autoComplete="off"
            inputMode="decimal"
            autoFocus
            onFocus={(e) => e.target.select()}
          />

        </div>

        <div className="oper-modal__actions">

          <button
            type="button"
            className="oper-modal__btn"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="oper-modal__btn oper-modal__btn--primary"
            onClick={onSave}
            disabled={
              saving || !String(precio || "").trim()
            }
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>

        </div>
      </div>
    </div>
  );
}