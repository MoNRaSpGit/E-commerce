function formatUYU(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-UY", { style: "currency", currency: "UYU" });
}

export default function ProductosAdminTable({ rows, onEdit }) {
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

        {rows.map((p) => (
          <div className="adm-row" key={p.id}>
            <div className="c-id">#{p.id}</div>
            <div className="c-name">{p.name}</div>
            <div className="c-price">{formatUYU(p.price)}</div>
            <div className="c-status">{p.status}</div>
            <div className="c-acc">
              <button className="op-btn small" type="button" onClick={() => onEdit(p)}>
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
