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
import { selectCartItems } from "../slices/cartSlice";

import { selectAuth } from "../slices/authSlice";
import { connectStock } from "../sse/stockSse";
import { productoStockActualizado } from "../slices/productosSlice";



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
  const { accessToken } = useSelector(selectAuth);

  const cartItems = useSelector(selectCartItems);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showColdStart, setShowColdStart] = useState(false);

  useEffect(() => {
    dispatch(fetchProductos());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthed || !accessToken) return;

    const conn = connectStock({
      token: accessToken,
      onOpen: () => { },
      onPing: () => { },
      onStockUpdate: (e) => {
        try {
          const payload = JSON.parse(e.data);
          // payload: { productoId, stock }
          dispatch(productoStockActualizado(payload));
        } catch { }
      },
      onError: () => {
        // no hacemos refetch ni reload; si se corta, queda con el último stock conocido
      },
    });

    return () => conn?.close?.();
  }, [isAuthed, accessToken, dispatch]);


  useEffect(() => {
    if (status !== "loading" || items.length > 0) return;

    const t = setTimeout(() => setShowColdStart(true), 500);
    return () => clearTimeout(t);
  }, [status, items.length]);


  const onAgregar = (p) => {
    const stock = Number(p?.stock ?? 0);

    // 1) Sin stock
    if (stock <= 0) {
      toast.error("Sin stock");
      return;
    }

    // 2) No logueado
    if (!isAuthed) {
      setShowLoginModal(true);
      return;
    }

    // 3) Ya en carrito → validar límite
    const inCart = cartItems.find((x) => Number(x.id) === Number(p.id));
    const qtyEnCarrito = Number(inCart?.qty ?? 0);

    if (qtyEnCarrito >= stock) {
      toast.error("Llegaste al máximo por stock");
      return;
    }

    // 4) Agregar
    dispatch(addItem(p));
    toast.success("Agregado al carrito");
  };


  return (
    <>
      {/* Modal bloqueante (solo aparece si loading > 10s) */}
      <ServerColdStartModal
        open={showColdStart}
        onClose={() => setShowColdStart(false)}
      />

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
