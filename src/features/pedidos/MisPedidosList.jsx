function formatUYU(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-UY", {
    style: "currency",
    currency: "UYU",
  });
}

function formatDateUY(value) {
  if (!value) return "-";

  let d;

  // Si viene como MySQL: "YYYY-MM-DD HH:mm:ss"
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value)) {
    // lo tratamos como UTC para que luego se muestre en Montevideo correcto
    d = new Date(value.replace(" ", "T") + "Z");
  } else {
    d = new Date(value);
  }

  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString("es-UY", {
    timeZone: "America/Montevideo",
    hour12: false,
  });
}



function badgeClass(estado) {
  if (estado === "pendiente") return "badge badge-pendiente";
  if (estado === "en_proceso") return "badge badge-proceso";
  if (estado === "listo") return "badge badge-listo";
  if (estado === "cancelado") return "badge badge-cancelado";
  return "badge";
}

export default function MisPedidosList({ rows, onOpenDetalle, onEliminarPedido }) {
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
              {formatDateUY(p.created_at)}
            </div>

            <div className="c-acc">
              <button
                className="ped-btn"
                type="button"
                onClick={() => onOpenDetalle?.(p.id)}
              >
                Ver
              </button>

              {(p.estado === "listo" || p.estado === "cancelado") && (
                <button
                  className="ped-btn ped-btn-danger"
                  type="button"
                  onClick={() => onEliminarPedido?.(p.id, p.estado)}
                >
                  Eliminar
                </button>
              )}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
