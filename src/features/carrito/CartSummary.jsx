function formatUYU(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-UY", { style: "currency", currency: "UYU" });
}

export default function CartSummary({
  totalItems,
  totalPrice,
  sending,
  isAuthed,
  onCheckout,
}) {
  return (
    <div className="cart-summary">
      <div className="sum-line">
        <span>Items</span>
        <strong>{totalItems}</strong>
      </div>
      <div className="sum-line">
        <span>Total</span>
        <strong>{formatUYU(totalPrice)}</strong>
      </div>

      <button
        className="cart-btn primary w100"
        type="button"
        onClick={onCheckout}
        disabled={sending}
      >
        {sending ? "Creando pedido..." : "Finalizar compra"}
      </button>

      {!isAuthed && (
        <div className="cart-note">Para finalizar la compra necesitás iniciar sesión.</div>
      )}
    </div>
  );
}
