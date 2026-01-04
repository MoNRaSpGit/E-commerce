import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductos,
  selectProductos,
  selectProductosError,
  selectProductosStatus,
} from "../slices/productosSlice";

import ProductCard from "../components/ProductCard";
import ConfirmLoginModal from "../components/ConfirmLoginModal";
import ServerColdStartModal from "../components/ServerColdStartModal";

import "../styles/productos.css";
import { addItem } from "../slices/cartSlice";

import { useNavigate } from "react-router-dom";
import { selectIsAuthed } from "../slices/authSlice";
import toast from "react-hot-toast";

export default function Productos() {
  const dispatch = useDispatch();
  const items = useSelector(selectProductos);
  const status = useSelector(selectProductosStatus);
  const error = useSelector(selectProductosError);

  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthed);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showColdStart, setShowColdStart] = useState(false);

  // 1) Fetch productos (una sola vez cuando está idle)
  useEffect(() => {
    if (status === "idle") dispatch(fetchProductos());
  }, [status, dispatch]);

  // 2) Modal informativo SOLO si sigue cargando por +10s (cold start)
  useEffect(() => {
    // si no está cargando, o ya hay items, aseguramos que no se vea
    if (status !== "loading" || items.length > 0) {
      setShowColdStart(false);
      return;
    }

    const t = setTimeout(() => setShowColdStart(true), 10000);
    return () => clearTimeout(t);
  }, [status, items.length]);

  const onAgregar = (p) => {
    if (!isAuthed) {
      setShowLoginModal(true);

      // ⚠️ OJO: esto en tu código actual rompe porque no existe pendingProduct
      // Si lo necesitás, definimos:
      // const [pendingProduct, setPendingProduct] = useState(null);
      // y luego lo usamos al volver del login.
      // setPendingProduct(p);

      return;
    }

    dispatch(addItem(p));
    toast.success("Agregado al carrito");
  };

  return (
    <>
      {/* Modal bloqueante (solo aparece si loading > 10s) */}
      <ServerColdStartModal open={showColdStart} />

      <div className="productos-container">
        <h2 className="productos-title">🛒 Nuestros Productos</h2>

        {status === "loading" && items.length === 0 ? (
          <p className="no-products">Cargando productos...</p>
        ) : status === "failed" ? (
          <p className="no-products">{error || "Error cargando productos"}</p>
        ) : (
          <div className="productos-grid">
            {items.map((p) => (
              <ProductCard
                key={p.id}
                producto={p}
                onAgregar={() => onAgregar(p)}
              />
            ))}
          </div>
        )}

        <ConfirmLoginModal
          open={showLoginModal}
          onCancel={() => setShowLoginModal(false)}
          onConfirm={() => {
            setShowLoginModal(false);
            navigate("/login");
          }}
        />
      </div>
    </>
  );
}
