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

  useEffect(() => {
    if (status === "idle") dispatch(fetchProductos());
  }, [status, dispatch]);

  const onAgregar = (p) => {
    if (!isAuthed) {
      setShowLoginModal(true);
      setPendingProduct(p);
      return;
    }

    // ✅ Luego conectamos el carrito real
    dispatch(addItem(p));
    toast.success("Agregado al carrito");
  };

  return (
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
  );
}
