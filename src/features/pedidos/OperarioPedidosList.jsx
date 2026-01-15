const ESTADOS = ["pendiente", "en_proceso", "listo", "cancelado"];




function formatUYU(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-UY", { style: "currency", currency: "UYU" });
}

function formatDateUY(value) {
  if (!value) return "-";

  // Si viene como "YYYY-MM-DD HH:mm:ss" (MySQL), lo tratamos como UTC
  let d;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value)) {
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


export default function OperarioPedidosList({
  rows,
  updatingId,
  onVerDetalle,
  onCambiarEstado,
  onArchivar,
  loadingDisabled,
}) {
  if (!rows || rows.length === 0) {
    return (
      <div className="op-card">
        <p className="op-muted">No hay pedidos para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="op-card">
      <div className="op-table">
        <div className="op-row op-header">
          <div className="c-id">Pedido</div>
          <div className="c-user">Usuario</div>
          <div className="c-est">Estado</div>
          <div className="c-total">Total</div>
          <div className="c-fecha">Fecha</div>
          <div className="c-acc">Acciones</div>
        </div>

        {rows.map((p) => {
          const canArchive =
            typeof onArchivar === "function" &&
            (p.estado === "listo" || p.estado === "cancelado");

          return (
            <div key={p.id}>
              {/* Desktop */}
              <div className="op-row op-row-desktop">
                <div className="c-id">#{p.id}</div>
                <div className="c-user">{p.usuario_nombre || p.nombre || p.usuario_email || `Usuario #${p.usuario_id}`}
                </div>
                <div className="c-est">{p.estado}</div>
                <div className="c-total">{formatUYU(p.total)}</div>
                <div className="c-fecha">
                  {formatDateUY(p.created_at)}
                </div>
                <div className="c-acc">
                  <div className="op-actions">
                    <button
                      className="op-btn small"
                      type="button"
                      onClick={() => onVerDetalle(p.id)}
                      disabled={loadingDisabled}
                    >
                      Ver
                    </button>

                    {canArchive && (
                      <button
                        className="op-btn small"
                        type="button"
                        onClick={() => onArchivar(p.id)}
                        disabled={updatingId === p.id || loadingDisabled}
                      >
                        Archivar
                      </button>
                    )}

                    <select
                      className="op-select"
                      value={p.estado}
                      onChange={(e) => onCambiarEstado(p.id, e.target.value)}
                      disabled={updatingId === p.id || loadingDisabled}
                    >
                      {ESTADOS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Mobile card */}
              <div className="op-card-mobile">
                <div className="op-card-top">
                  <div className="op-card-id">Pedido #{p.id}</div>
                  <span className={`op-badge ${p.estado}`}>{p.estado}</span>
                </div>

                <div className="op-card-line">
                  <span>Usuario</span>
                  <strong>{p.nombre || p.usuario_email || p.usuario_id}</strong>
                </div>

                <div className="op-card-line">
                  <span>Total</span>
                  <strong>{formatUYU(p.total)}</strong>
                </div>

                <div className="op-card-line">
                  <span>Fecha</span>
                  <strong>
                    {formatDateUY(p.created_at)}
                  </strong>
                </div>

                <div className="op-card-actions">
                  <button
                    className="op-btn small"
                    type="button"
                    onClick={() => onVerDetalle(p.id)}
                    disabled={loadingDisabled}
                  >
                    Ver
                  </button>

                  {canArchive && (
                    <button
                      className="op-btn small"
                      type="button"
                      onClick={() => onArchivar(p.id)}
                      disabled={updatingId === p.id || loadingDisabled}
                    >
                      Archivar
                    </button>
                  )}

                  <select
                    className="op-select"
                    value={p.estado}
                    onChange={(e) => onCambiarEstado(p.id, e.target.value)}
                    disabled={updatingId === p.id || loadingDisabled}
                  >
                    {ESTADOS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {updatingId && <div className="op-muted mt-2">Actualizando pedido #{updatingId}...</div>}
    </div>
  );
}
