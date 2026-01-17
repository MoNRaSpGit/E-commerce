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

import { selectCartItems } from "../slices/cartSlice";

import { selectAuth } from "../slices/authSlice";
import { connectStock } from "../sse/stockSse";
import { productoStockActualizado } from "../slices/productosSlice";



import "../styles/productos.css";
import "../styles/skeleton.css";
import ProductCardSkeleton from "../components/ProductCardSkeleton";

import { addItem } from "../slices/cartSlice";

import { useNavigate } from "react-router-dom";
import { selectIsAuthed } from "../slices/authSlice";
import toast from "react-hot-toast";

export default function Productos() {
  const dispatch = useDispatch();
  const items = useSelector(selectProductos);
  const status = useSelector(selectProductosStatus);
  const error = useSelector(selectProductosError);
  const [tStart, setTStart] = useState(null); // performance.now()
  const [tMs, setTMs] = useState(null);       // ms finales


  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthed);
  const { accessToken } = useSelector(selectAuth);

  const cartItems = useSelector(selectCartItems);

  const [showLoginModal, setShowLoginModal] = useState(false);


  const [q, setQ] = useState("");


  useEffect(() => {
    const t = setTimeout(() => {
      const term = q.trim();
      dispatch(fetchProductos(term ? { q: term } : undefined));
    }, 250);

    return () => clearTimeout(t);
  }, [dispatch, q]);



  useEffect(() => {
    // cuando arranca loading → inicio timer
    if (status === "loading") {
      setTStart(performance.now());
      setTMs(null);
      return;
    }

    // cuando termina (ok o error) → fin timer
    if ((status === "succeeded" || status === "failed") && tStart !== null) {
      setTMs(performance.now() - tStart);
    }
  }, [status, tStart]);

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
      <div className="productos-container">
        <div className="productos-sticky">
          <div className="productos-sticky-inner">
            <div className="productos-sticky-top">
              <div className="productos-sticky-title">Catálogo</div>

              <div className="productos-sticky-meta">
                {status === "succeeded" && <span>{items.length} productos</span>}
                {tMs !== null && <span>· {(tMs / 1000).toFixed(2)}s</span>}
              </div>
            </div>

            <div className="productos-search">
              <div className="productos-search-box">
                <span className="productos-search-icon">🔍</span>

                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="productos-search-input"
                  placeholder="Buscar productos… (ej: leche, pan, azúcar)"
                  aria-label="Buscar productos"
                />

                {q && (
                  <button
                    className="productos-search-clear"
                    onClick={() => setQ("")}
                    aria-label="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>




        {status === "loading" && items.length === 0 ? (
          <div className="productos-grid" aria-busy="true" aria-live="polite">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={`sk-${i}`} />
            ))}
          </div>
        ) : status === "failed" ? (
          <p className="no-products">{error || "Error cargando productos"}</p>
        ) : items.length === 0 ? (
          <p className="no-products">
            No se encontraron productos para “{q}”
          </p>
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
