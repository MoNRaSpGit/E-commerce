function formatUYU(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-UY", { style: "currency", currency: "UYU" });
}

export default function ProductosAdminTable({
  rows,
  onEdit,
  selectable = false,
  selectedIds,
  onToggleSelect,
}) {
  return (
    <div className="op-card">
      <div className="adm-table">
        <div className="adm-row adm-header">
          <div className="c-id">ID</div>
          <div className="c-name">Nombre</div>
          <div className="c-price">Precio</div>
          <div className="c-status">Estado</div>
          <div className="c-acc">Acciones</div>
        </div>

        {rows.map((p) => {
          const isSelected = selectable && selectedIds?.has?.(p.id);

          return (
            <div
              className={`adm-row ${isSelected ? "is-selected" : ""} ${
                selectable ? "is-selectable" : ""
              }`}
              key={p.id}
              onClick={selectable ? () => onToggleSelect?.(p.id) : undefined}
              role={selectable ? "button" : undefined}
              tabIndex={selectable ? 0 : undefined}
              onKeyDown={
                selectable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onToggleSelect?.(p.id);
                      }
                    }
                  : undefined
              }
            >
              <div className="c-id">#{p.id}</div>
              <div className="c-name">{p.name}</div>
              <div className="c-price">{formatUYU(p.price)}</div>
              <div className="c-status">{p.status}</div>

              {/* 👇 importante: que el click en acciones NO seleccione la fila */}
              <div className="c-acc" onClick={(e) => e.stopPropagation()}>
                <button
                  className="op-btn small"
                  type="button"
                  onClick={() => onEdit(p)}
                >
                  Editar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
