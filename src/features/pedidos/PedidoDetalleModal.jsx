import { useEffect, useMemo } from "react";
import "../../styles/pedidoDetalleModal.css";

function formatUYU(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-UY", { style: "currency", currency: "UYU" });
}

export default function PedidoDetalleModal({ open, onClose, loading, error, detail }) {
  // ✅ Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ✅ Bloquear scroll del fondo cuando el modal está abierto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  const items = Array.isArray(detail?.items) ? detail.items : [];

  const totalItems = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it?.subtotal) || 0), 0);
  }, [items]);

  if (!open) return null;

  return (
    <div className="op-modal-backdrop" onMouseDown={onClose}>
      <div className="op-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="op-modal-head">
          <div className="op-modal-title">Detalle de compra</div>

          <button className="op-x" type="button" onClick={onClose} aria-label="Cerrar">
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
            {/* meta oculto por UX: lo dejamos para futuro si hace falta */}

            <div className="op-items">
              <div className="op-items-head">
                <div>Producto</div>
                <div className="right">Cant.</div>
                <div className="right">Precio</div>
                <div className="right">Subtotal</div>
              </div>

              {items.length === 0 ? (
                <div className="op-item-empty">Sin ítems en este pedido.</div>
              ) : (
                items.map((it) => (
                  <div className="op-item-row" key={it.id}>
                    <div className="op-item-name">{it.nombre_snapshot}</div>
                    <div className="right">{it.cantidad}</div>
                    <div className="right">{formatUYU(it.precio_unitario_snapshot)}</div>
                    <div className="right">{formatUYU(it.subtotal)}</div>
                  </div>
                ))
              )}
            </div>

            {/* ✅ Sumario abajo (pro) */}
            <div className="op-detail-foot">
              <div className="op-detail-foot-row">
                <span>Total </span>
                <strong>{formatUYU(totalItems)}</strong>
              </div>

              <button className="op-btn" type="button" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
