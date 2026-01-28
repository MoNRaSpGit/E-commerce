export default function CartTable({
  items,
  sending,
  onDec,
  onInc,
  onRemove,
  renderImage,
}) {
  return (
    <div className="cart-card">
      <div className="cart-table">
        <div className="cart-row cart-header">
          <div className="c-prod">Producto</div>
          <div className="c-price">Precio</div>
          <div className="c-qty">Cantidad</div>
          <div className="c-total">Total</div>
          <div className="c-remove"></div>
        </div>

        {items.map((it) => {
          const img = renderImage(it);
          const subtotal = (Number(it.price) || 0) * (it.qty || 0);

          return (
            <div className="cart-row" key={it.id}>
              <div className="c-prod">
                <img className="cart-img" src={img} alt={it.name} />
                <div className="cart-prod-meta">
                  <div className="cart-prod-name" title={it.name}>
                    {it.name}
                  </div>
                </div>
              </div>

              <div className="c-price">{it.price}</div>

              <div className="c-qty">
                <div className="qty-box">
                  <button
                    className="qty-btn"
                    type="button"
                    onClick={() => onDec(it)}
                    disabled={sending}
                  >
                    −
                  </button>

                  <span className="qty-num">{it.qty}</span>

                  <button
                    className="qty-btn"
                    type="button"
                    onClick={() => onInc(it)}
                    disabled={sending}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="c-total">{subtotal}</div>

              <div className="c-remove">
                <button
                  className="cart-remove-x"
                  type="button"
                  onClick={() => onRemove(it)}
                  disabled={sending}
                  aria-label={`Quitar ${it.name}`}
                  title="Quitar"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
