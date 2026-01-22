export default function PushOptInModal({
  open,
  onConfirm,
  onDecline,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="eco-modal-backdrop" role="dialog" aria-modal="true">
      <div className="eco-modal">
        <h3 className="eco-modal-title">¿Querés que te avisemos?</h3>

        <div className="eco-modal-body">
          <p>
            Podemos enviarte una notificación cuando tu pedido esté listo.
          </p>
          <p style={{ marginTop: 8, fontSize: "0.85rem", color: "#6b7280" }}>
            Podés desactivar esto cuando quieras en el navegador.
          </p>
        </div>

        <div className="eco-modal-actions" style={{ gap: 10 }}>
          <button
            className="eco-modal-btn"
            type="button"
            onClick={onDecline}
            style={{ background: "#6b7280" }}
          >
            Ahora no
          </button>

          <button className="eco-modal-btn" type="button" onClick={onConfirm}>
            Sí, avisame
          </button>
        </div>

        {/* Cierre por click afuera opcional (si querés estrictos, lo sacamos) */}
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
