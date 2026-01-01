function formatUYU(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-UY", {
    style: "currency",
    currency: "UYU",
  });
}

function badgeClass(estado) {
  if (estado === "pendiente") return "badge badge-pendiente";
  if (estado === "en_proceso") return "badge badge-proceso";
  if (estado === "listo") return "badge badge-listo";
  if (estado === "cancelado") return "badge badge-cancelado";
  return "badge";
}

export default function MisPedidosList({ rows, onOpenDetalle }) {
  return (
    <div className="ped-card">
      <div className="ped-table">
        <div className="ped-row ped-header">
          <div className="c-est">Estado</div>
          <div className="c-total">Total</div>
          <div className="c-fecha">Fecha</div>
          <div className="c-acc">Acciones</div>
        </div>

        {rows.map((p) => (
          <div className="ped-row" key={p.id}>
            <div className="c-est">
              <span className={badgeClass(p.estado)}>{p.estado}</span>
            </div>

            <div className="c-total">{formatUYU(p.total)}</div>

            <div className="c-fecha">
              {p.created_at ? new Date(p.created_at).toLocaleString("es-UY") : "-"}
            </div>

            <div className="c-acc">
              <button className="ped-btn" type="button" onClick={() => onOpenDetalle?.(p.id)}>
                Ver
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
