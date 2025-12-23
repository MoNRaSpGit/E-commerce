import { useDispatch, useSelector } from "react-redux";
import {
  clearCart,
  decQty,
  incQty,
  removeItem,
  selectCartItems,
  selectCartTotalItems,
  selectCartTotalPrice,
} from "../slices/cartSlice";
import { selectIsAuthed } from "../slices/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import "../styles/carrito.css";

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

export default function CarritoPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const items = useSelector(selectCartItems);
  const totalItems = useSelector(selectCartTotalItems);
  const totalPrice = useSelector(selectCartTotalPrice);
  const isAuthed = useSelector(selectIsAuthed);

  const onCheckout = () => {
    if (!isAuthed) {
      toast.error("Tenés que iniciar sesión para comprar");
      navigate("/login");
      return;
    }

    // más adelante: POST /api/pedidos
    toast.success("Checkout listo (falta conectar pedidos)");
  };

  return (
    <div className="container py-4">
      <div className="cart-head">
        <h1 className="cart-title">Carrito</h1>

        <div className="cart-actions">
          <button
            className="cart-btn ghost"
            type="button"
            onClick={() => navigate("/productos")}
          >
            Seguir comprando
          </button>

          <button
            className="cart-btn danger"
            type="button"
            onClick={() => {
              if (items.length === 0) return;
              dispatch(clearCart());
              toast("Carrito vaciado", { icon: "🧹" });
            }}
            disabled={items.length === 0}
          >
            Vaciar
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="cart-empty">
          <p className="cart-empty-text">Tu carrito está vacío.</p>
          <button
            className="cart-btn primary"
            type="button"
            onClick={() => navigate("/productos")}
          >
            Ver productos
          </button>
        </div>
      ) : (
        <>
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
                          onClick={() => dispatch(decQty(it.id))}
                        >
                          −
                        </button>
                        <span className="qty-num">{it.qty}</span>
                        <button
                          className="qty-btn"
                          type="button"
                          onClick={() => dispatch(incQty(it.id))}
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
                          dispatch(removeItem(it.id));
                          toast("Producto eliminado", { icon: "🗑️" });
                        }}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cart-summary">
            <div className="sum-line">
              <span>Items</span>
              <strong>{totalItems}</strong>
            </div>
            <div className="sum-line">
              <span>Total</span>
              <strong>{formatUYU(totalPrice)}</strong>
            </div>

            <button className="cart-btn primary w100" type="button" onClick={onCheckout}>
              Finalizar compra
            </button>

            {!isAuthed && (
              <div className="cart-note">
                Para finalizar la compra necesitás iniciar sesión.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
