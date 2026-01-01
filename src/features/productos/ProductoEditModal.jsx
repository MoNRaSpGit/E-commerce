import "../../styles/productoEditModal.css";

export default function ProductoEditModal({
  open,
  saving,
  current,
  form,
  setField,
  onClose,
  onSave,
}) {
  if (!open) return null;

  return (
    <div className="op-modal-backdrop" onMouseDown={onClose}>
      <div className="op-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="op-modal-head">
          <div>
            <div className="op-modal-title">
              Editar producto {current?.id ? `#${current.id}` : ""}
            </div>
            <div className="op-modal-sub">Admin / Operario</div>
          </div>

          <button className="op-x" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="op-modal-body">
          <label className="op-label block">
            Nombre
            <input
              className="op-select"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              disabled={saving}
            />
          </label>

          <label className="op-label block mt">
            Precio
            <input
              className="op-select"
              value={form.price}
              onChange={(e) => setField("price", e.target.value)}
              disabled={saving}
            />
          </label>

          <label className="op-label block mt">
            Estado
            <select
              className="op-select"
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              disabled={saving}
            >
              <option value="pendiente">pendiente</option>
              <option value="activo">activo</option>
            </select>
          </label>

          <div className="adm-actions">
            <button className="op-btn" type="button" onClick={onSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button className="op-btn" type="button" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
          </div>

          <p className="op-muted mt2">
            Tip: “pendiente” no debería aparecer en la tienda.
          </p>
        </div>
      </div>
    </div>
  );
}
