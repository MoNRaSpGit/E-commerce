import toast from "react-hot-toast";

function formatUYU(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-UY", { style: "currency", currency: "UYU" });
}

function normalizeImage(image) {
  if (!image) return null;
  const s = String(image).trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("data:image/")) return s;
  return `data:image/jpeg;base64,${s}`;
}

export default function CartTable({
  items,
  sending,
  onDec,
  onInc,
  onRemove,
}) {
  return (
    <div className="cart-card">
      <div className="cart-table">
        <div className="cart-row cart-header">
          <div className="c-prod">Producto</div>
          <div className="c-price">Precio</div>
          <div className="c-qty">Cantidad</div>
          <div className="c-sub">Subtotal</div>
          <div className="c-act">Acciones</div>
        </div>

        {items.map((it) => {
          const img = normalizeImage(it.image) || "/placeholder.png";
          const subtotal = (Number(it.price) || 0) * (it.qty || 0);

          return (
            <div className="cart-row" key={it.id}>
              <div className="c-prod">
                <img className="cart-img" src={img} alt={it.name} />
                <div className="cart-prod-meta">
                  <div className="cart-prod-name">{it.name}</div>
                  <div className="cart-prod-id">ID: {it.id}</div>
                </div>
              </div>

              <div className="c-price">{formatUYU(it.price)}</div>

              <div className="c-qty">
                <div className="qty-box">
                  <button
                    className="qty-btn"
                    type="button"
                    onClick={() => onDec(it.id)}
                    disabled={sending}
                  >
                    −
                  </button>
                  <span className="qty-num">{it.qty}</span>
                  <button
                    className="qty-btn"
                    type="button"
                    onClick={() => onInc(it.id)}
                    disabled={sending}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="c-sub">{formatUYU(subtotal)}</div>

              <div className="c-act">
                <button
                  className="cart-link danger"
                  type="button"
                  onClick={() => {
                    onRemove(it.id);
                    toast("Producto eliminado", { icon: "🗑️" });
                  }}
                  disabled={sending}
                >
                  Quitar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
