export default function CartEmpty({ onGoProductos }) {
  return (
    <div className="cart-empty">
      <p className="cart-empty-text">Tu carrito está vacío.</p>
      <button className="cart-btn primary" type="button" onClick={onGoProductos}>
        Ver productos
      </button>
    </div>
  );
}
