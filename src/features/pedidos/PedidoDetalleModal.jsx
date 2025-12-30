import "../..//styles/pedidoDetalleModal.css";
import { useEffect } from "react";


function formatUYU(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-UY", { style: "currency", currency: "UYU" });
}

export default function PedidoDetalleModal({
  open,
  onClose,
  loading,
  error,
  detail,
}) {
  useEffect(() => {
    if (!open) return;

    // ESC para cerrar
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);

    // bloquear scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="op-modal-backdrop" onMouseDown={onClose}>
      <div className="op-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="op-modal-head">
          <div>
            <div className="op-modal-title">
              Pedido {detail?.id ? `#${detail.id}` : ""}
            </div>
            <div className="op-modal-sub">
              {detail?.usuario_email ?? detail?.usuario_id ?? ""}
              {detail?.estado ? ` · ${detail.estado}` : ""}
            </div>
          </div>

          <button className="op-x" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <div className="op-modal-body">
            <p className="op-muted">Cargando detalle...</p>
          </div>
        ) : error ? (
          <div className="op-modal-body">
            <p className="op-error">{error}</p>
          </div>
        ) : !detail ? (
          <div className="op-modal-body">
            <p className="op-muted">Sin datos.</p>
          </div>
        ) : (
          <div className="op-modal-body">
            <div className="op-detail-meta">
              <div>
                <span>Total</span>
                <strong>{formatUYU(detail.total)}</strong>
              </div>
              <div>
                <span>Moneda</span>
                <strong>{detail.moneda || "UYU"}</strong>
              </div>
              <div>
                <span>Fecha</span>
                <strong>
                  {detail.created_at
                    ? new Date(detail.created_at).toLocaleString("es-UY")
                    : "-"}
                </strong>
              </div>
            </div>

            <div className="op-items">
              <div className="op-items-head">
                <div>Producto</div>
                <div className="right">Cant.</div>
                <div className="right">Precio</div>
                <div className="right">Subtotal</div>
              </div>

              {Array.isArray(detail.items) && detail.items.length > 0 ? (
                detail.items.map((it) => (
                  <div className="op-item-row" key={it.id}>
                    <div className="op-item-name">{it.nombre_snapshot}</div>
                    <div className="right">{it.cantidad}</div>
                    <div className="right">
                      {formatUYU(it.precio_unitario_snapshot)}
                    </div>
                    <div className="right">
                      {formatUYU(it.subtotal)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="op-item-empty">
                  <p className="op-muted">Este pedido no tiene ítems.</p>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
