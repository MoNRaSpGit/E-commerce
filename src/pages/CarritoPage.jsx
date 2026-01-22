import { useEffect, useState } from "react";

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
import { fetchProductos } from "../slices/productosSlice";
import PushOptInModal from "../components/PushOptInModal";


import { apiFetch } from "../services/apiFetch";

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
  const [sending, setSending] = useState(false);
  const [imgById, setImgById] = useState({}); // { [productoId]: imgSrc }
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [postCheckoutPath, setPostCheckoutPath] = useState(null);
  const [successToastMsg, setSuccessToastMsg] = useState("");






  const items = useSelector(selectCartItems);
  const totalItems = useSelector(selectCartTotalItems);
  const totalPrice = useSelector(selectCartTotalPrice);
  const isAuthed = useSelector(selectIsAuthed);

  useEffect(() => {
    let cancelled = false;

    // ids que necesitan imagen: no tienen it.image, tienen has_image, y no están en cache
    const targets = items
      .filter((it) => it && it.id != null)
      .filter((it) => !it.image && Boolean(it.has_image))
      .map((it) => Number(it.id))
      .filter((id) => Number.isFinite(id) && !imgById[id]);

    if (targets.length === 0) return;

    // pedimos en paralelo (carrito suele tener pocos)
    Promise.all(
      targets.map(async (id) => {
        try {
          const res = await apiFetch(
            `/api/productos/${id}/image`,
            { method: "GET" },
            { auth: false }
          );

          const data = await res.json().catch(() => null);
          const img = normalizeImage(data?.data?.image);

          if (res.ok && data?.ok && img) {
            return [id, img];
          }
        } catch { }
        return null;
      })
    ).then((pairs) => {
      if (cancelled) return;

      const next = {};
      for (const p of pairs) {
        if (!p) continue;
        const [id, img] = p;
        next[id] = img;
      }

      // solo actualizamos si hay algo nuevo
      if (Object.keys(next).length > 0) {
        setImgById((prev) => ({ ...prev, ...next }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [items, imgById]);


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
        { dispatch, navigate }
      );

      const data = await res.json().catch(() => null);

      // apiFetch ya manejó logout/toast/navigate si refresh falló
      if (res.status === 401) return;
      console.log("checkout status", res.status, data);

      if (!res.ok || !data?.ok) {
        toast.error(data?.error || "No se pudo crear el pedido");
        return;
      }



      dispatch(clearCart());
      dispatch(fetchProductos());
      setSuccessToastMsg(`¡Compra realizada con éxito! (${formatUYU(data.pedido.total)})`);


      // Paso 1: solo mostramos modal y decidimos después (sin push real aún)
      setPostCheckoutPath("/mis-pedidos");

      let cooldownUntil = 0;
      try {
        cooldownUntil = Number(localStorage.getItem("eco_push_optin_cooldown_until") || "0");
      } catch { }

      if (Date.now() < cooldownUntil) {
        if (successToastMsg) toast.success(successToastMsg);
        navigate("/mis-pedidos");
      } else {
        setPushModalOpen(true);
      }


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
                const cached = imgById[it.id];
                const img = normalizeImage(cached || it.image) || "/placeholder.png";
                const subtotal = (Number(it.price) || 0) * (it.qty || 0);
                const stock = Number(it.stock ?? 0);
                const atLimit = stock > 0 && (it.qty || 0) >= stock;

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
                          disabled={sending}
                        >
                          −
                        </button>
                        <span className="qty-num">{it.qty}</span>
                        <button
                          className="qty-btn"
                          type="button"
                          onClick={() => {
                            if (atLimit) {
                              toast.error("No podés superar el stock");
                              return;
                            }
                            dispatch(incQty(it.id));
                          }}
                          disabled={sending || atLimit}
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
        </>
      )}


      <PushOptInModal
        open={pushModalOpen}
        onConfirm={async () => {
          try {
            const { subscribeToPush } = await import("../services/pushClient");

            const r = await subscribeToPush();

            if (r?.ok === false && r?.reason === "push_disabled") {
              toast("Notificaciones no disponibles en este entorno", { icon: "ℹ️" });
            } else {
              toast.success("Listo, te vamos a avisar 🔔");
            }
          } catch (e) {
            toast.error(e?.message || "No se pudieron activar las notificaciones");
          } finally {
            setPushModalOpen(false);

            if (successToastMsg) toast.success(successToastMsg);
            if (postCheckoutPath) navigate(postCheckoutPath);
          }
        }}

        onDecline={() => {
          try {
            // cooldown prueba: 5 segundos
            localStorage.setItem(
              "eco_push_optin_cooldown_until",
              String(Date.now() + 10000)
            );
          } catch { }

          setPushModalOpen(false);
          if (postCheckoutPath) navigate(postCheckoutPath);
          if (successToastMsg) toast.success(successToastMsg);

        }}

      />

    </div>


  );
}
