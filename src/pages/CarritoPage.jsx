import { useState } from "react";
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

import { apiFetch } from "../services/apiFetch";

import CartEmpty from "../features/carrito/CartEmpty";
import CartTable from "../features/carrito/CartTable";
import CartSummary from "../features/carrito/CartSummary";

import "../styles/carrito.css";

function formatUYU(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-UY", { style: "currency", currency: "UYU" });
}

export default function CarritoPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);

  const items = useSelector(selectCartItems);
  const totalItems = useSelector(selectCartTotalItems);
  const totalPrice = useSelector(selectCartTotalPrice);
  const isAuthed = useSelector(selectIsAuthed);

  const onCheckout = async () => {
    if (!isAuthed) {
      toast.error("Tenés que iniciar sesión para comprar");
      navigate("/login");
      return;
    }

    if (items.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }

    if (sending) return;

    const payload = {
      items: items.map((it) => ({
        productoId: it.id,
        cantidad: it.qty,
      })),
    };

    try {
      setSending(true);

      const res = await apiFetch(
        "/api/pedidos",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        {
          dispatch,
          navigate,
          onForbidden: () => {
            toast.error("Sin permisos");
            navigate("/productos");
          },
        }
      );

      const data = await res.json().catch(() => null);

      // Si apiFetch hizo logout por refresh fallido, acá puede venir 401
      if (res.status === 401) return;

      if (!res.ok || !data?.ok) {
        toast.error(data?.error || "No se pudo crear el pedido");
        return;
      }

      dispatch(clearCart());
      toast.success(`Pedido #${data.pedido.id} creado (${formatUYU(data.pedido.total)})`);
      navigate("/mis-pedidos");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSending(false);
    }
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
            disabled={sending}
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
            disabled={items.length === 0 || sending}
          >
            Vaciar
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <CartEmpty onGoProductos={() => navigate("/productos")} />
      ) : (
        <>
          <CartTable
            items={items}
            sending={sending}
            onDec={(id) => dispatch(decQty(id))}
            onInc={(id) => dispatch(incQty(id))}
            onRemove={(id) => dispatch(removeItem(id))}
          />

          <CartSummary
            totalItems={totalItems}
            totalPrice={totalPrice}
            sending={sending}
            isAuthed={isAuthed}
            onCheckout={onCheckout}
          />
        </>
      )}
    </div>
  );
}
