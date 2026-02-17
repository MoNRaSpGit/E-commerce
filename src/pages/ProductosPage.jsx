import { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductos,
  selectProductos,
  selectProductosError,
  selectProductosStatus,
  productoStockActualizado,
} from "../slices/productosSlice";

import ProductCard from "../components/ProductCard";
import ConfirmLoginModal from "../components/ConfirmLoginModal";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import CategoriaCascadaFilter from "../components/CategoriaCascadaFilter";

import { selectCartItems, addItem } from "../slices/cartSlice";
import { selectAuth, selectIsAuthed } from "../slices/authSlice";

import { connectStock } from "../sse/stockSse";

import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import "../styles/productos.css";
import "../styles/skeleton.css";

function normCategoriaValue(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // saca tildes
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 _]/g, "")
    .replace(/\s/g, "_");
}

export default function ProductosPage() {
  const dispatch = useDispatch();
  const items = useSelector(selectProductos);
  const status = useSelector(selectProductosStatus);
  const error = useSelector(selectProductosError);

  const [tMs, setTMs] = useState(null);
  const tStartRef = useRef(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const qRaw = searchParams.get("q") || "";
  const term = qRaw.trim();

  // cat puede ser:
  //  - "" (sin filtro)
  //  - "bebidas"
  //  - "bebidas:con_alcohol"
  const catRaw = searchParams.get("cat") || "";
  const selectedCatRaw = catRaw.trim();

  const [selectedCat = "", selectedSub = ""] = selectedCatRaw.split(":");

  // ✅ Lista oficial (misma que admin)
  const categorias = useMemo(
    () => [
      { value: "bebidas", label: "Bebidas" },
      { value: "almacen", label: "Almacén" },
      { value: "cigarros", label: "Cigarros" },
      { value: "yerba", label: "Yerba" },
      { value: "snacks", label: "Snacks" },
      { value: "galletitas", label: "Galletitas" },
      { value: "golosinas", label: "Golosinas" },
      { value: "congelados", label: "Congelados" },
      { value: "higiene_y_cuidados", label: "Higiene y cuidados" },
      { value: "lacteos", label: "Lácteos" },
      { value: "limpieza", label: "Limpieza" },
      { value: "helados", label: "Helados" },
      { value: "medicamentos", label: "Medicamentos" },
      { value: "fiambres", label: "Fiambres" },
      { value: "panaderia", label: "Panadería" },
      { value: "otros", label: "Otros" },
    ],
    []
  );

  // ✅ Subcategorías (lista oficial admin)
  // (OJO: si querés que "mascotas" aparezca, acordate de tener "mascotas" en categorias también)
  const subcategorias = useMemo(
    () => ({
      bebidas: [
        { value: "con_alcohol", label: "Con alcohol" },
        { value: "sin_alcohol", label: "Sin alcohol" },
      ],
      mascotas: [
        { value: "gato", label: "Gato" },
        { value: "perro", label: "Perro" },
      ],
      helados: [
        { value: "conaprole", label: "Conaprole" },
        { value: "crufi", label: "Crufi" },
      ],
    }),
    []
  );

  const requiereSub = Boolean(subcategorias[selectedCat]);

  // ✅ Qué categorías existen realmente en los productos (normalizadas)

  console.log("DEBUG items[0]:", items?.[0]);
  console.log("DEBUG categorias sample:", (items || []).slice(0, 10).map(p => p?.categoria));


  const categoriasDisponibles = useMemo(() => {
    return new Set(
      (items || [])
        .map((p) => normCategoriaValue(p?.categoria))
        .filter(Boolean)
    );
  }, [items]);

  // ✅ Solo mostramos en el menú las categorías oficiales que existan en la data
  const categoriasParaSelect = categorias;

  // ✅ Filtrado (normaliza lo crudo de DB)
  const filteredItems = useMemo(() => {
    return (items || []).filter((p) => {
      const catOk = selectedCat
        ? normCategoriaValue(p?.categoria) === selectedCat
        : true;

      // sub solo aplica si la categoría requiere sub
      const subOk =
        requiereSub && selectedSub
          ? normCategoriaValue(p?.subcategoria) === normCategoriaValue(selectedSub)
          : true;

      return catOk && subOk;
    });
  }, [items, selectedCat, selectedSub, requiereSub]);

  // ✅ Si la categoría del URL ya no existe (ej cambió búsqueda), borramos cat
  useEffect(() => {
    if (!selectedCat) return;

    // ✅ validación contra la lista OFICIAL (no contra "categoriasParaSelect" que depende de items)
    const valid = categorias.some((c) => c.value === selectedCat);
    if (valid) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("cat");
    setSearchParams(nextParams);
  }, [selectedCat, categorias, searchParams, setSearchParams]);


  const isAuthed = useSelector(selectIsAuthed);
  const { accessToken } = useSelector(selectAuth);
  const cartItems = useSelector(selectCartItems);

  const [showLoginModal, setShowLoginModal] = useState(false);

  // Fetch productos (con debounce) respetando el buscador q
  useEffect(() => {
    const t = setTimeout(() => {
      // ✅ Regla UX:
      // - si hay categoría seleccionada, ignoramos la búsqueda (q)
      // - si NO hay categoría, usamos la búsqueda
      const shouldSearch = term && !selectedCatRaw;

      dispatch(fetchProductos(shouldSearch ? { q: term } : undefined));
    }, 250);

    return () => clearTimeout(t);
  }, [dispatch, term, selectedCatRaw]);

  // Medición de tiempo de carga
  useEffect(() => {
    if (status === "loading") {
      tStartRef.current = performance.now();
      setTMs(null);
      return;
    }

    if (status === "succeeded" || status === "failed") {
      const start = tStartRef.current;
      if (start != null) {
        setTMs(performance.now() - start);
        tStartRef.current = null;
      }
    }
  }, [status]);

  // SSE stock
  useEffect(() => {
    if (!isAuthed || !accessToken) return;

    const conn = connectStock({
      token: accessToken,
      onOpen: () => { },
      onPing: () => { },
      onStockUpdate: (e) => {
        try {
          const payload = JSON.parse(e.data);
          dispatch(productoStockActualizado(payload));
        } catch { }
      },
      onError: () => {
        // no refetch/reload: queda con el último stock conocido
      },
    });

    return () => conn?.close?.();
  }, [isAuthed, accessToken, dispatch]);

  const onAgregar = (p) => {
    const stock = Number(p?.stock ?? 0);

    if (stock <= 0) {
      toast.error("Sin stock");
      return;
    }

    if (!isAuthed) {
      setShowLoginModal(true);
      return;
    }

    const inCart = cartItems.find((x) => Number(x.id) === Number(p.id));
    const qtyEnCarrito = Number(inCart?.qty ?? 0);

    if (qtyEnCarrito >= stock) {
      toast.error("Llegaste al máximo por stock");
      return;
    }

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
                {status === "succeeded" && <span>{filteredItems.length} productos</span>}
                {tMs !== null && <span>· {(tMs / 1000).toFixed(2)}s</span>}
              </div>
            </div>

            {/* ✅ Menú cascada */}
            <div style={{ marginTop: 10 }}>
              <CategoriaCascadaFilter
                categoriasParaSelect={categoriasParaSelect}
                subcategorias={subcategorias}
                selectedCatRaw={selectedCatRaw}
                searchParams={searchParams}
                setSearchParams={setSearchParams}
                placeholder="Todas las categorías"
              />
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
        ) : filteredItems.length === 0 ? (
          <p className="no-products">
            {term ? `No se encontraron productos para “${term}”` : "No se encontraron productos"}
          </p>
        ) : (
          <div className="productos-grid">
            {filteredItems.map((p) => (
              <ProductCard key={p.id} producto={p} onAgregar={() => onAgregar(p)} />
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
