import "../styles/ProductCard.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../services/apiFetch";



const imageCache = new Map(); // key: productoId(string) -> imgSrc (data/url)


export default function ProductCard({ producto, onAgregar, disabled }) {
  const cardRef = useRef(null);

  // cache simple en memoria (por sesión)
  const cacheKey = useMemo(() => String(producto?.id ?? ""), [producto?.id]);

  const [imgSrc, setImgSrc] = useState(() => {
    // si viene image (por ejemplo URL), úsala; si no, placeholder
    const initial = normalizeImage(producto?.image);
    return initial || "/placeholder.png";
  });

  useEffect(() => {
    // si cambia de producto (re-render por lista), reset inicial
    const initial = normalizeImage(producto?.image);
    setImgSrc(initial || "/placeholder.png");
  }, [producto?.id, producto?.image]);

  useEffect(() => {
    const id = Number(producto?.id);
    const hasImage = Boolean(producto?.has_image);

    // si no hay imagen, listo
    if (!id || !hasImage) return;

    // si ya vino URL/data en producto.image, no pedir aparte
    const already = normalizeImage(producto?.image);
    if (already) return;

    // si ya está en cache, usarla
    const cached = imageCache.get(cacheKey);
    if (cached) {
      setImgSrc(cached);
      return;
    }

    let cancelled = false;

    const el = cardRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        // disparamos una vez
        obs.disconnect();

        try {
          const res = await apiFetch(
            `/api/productos/${id}/image`,
            { method: "GET" },
            { auth: false }
          );

          const data = await res.json().catch(() => null);
          const img = normalizeImage(data?.data?.image);

          if (!cancelled && res.ok && data?.ok && img) {
            imageCache.set(cacheKey, img);
            setImgSrc(img);
          }
        } catch {
          // si falla, dejamos placeholder
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.01 }
    );

    obs.observe(el);

    return () => {
      cancelled = true;
      obs.disconnect();
    };
  }, [producto?.id, producto?.has_image, producto?.image, cacheKey]);

  const stock = Number(producto?.stock ?? 0);


  return (
    <div className="product-card" ref={cardRef}>
      <img
        src={imgSrc}
        alt={producto.name}
        className="product-img"
        loading="lazy"
      />

      <h3 className="product-name">{producto.name}</h3>

      <p className="product-price">{formatUYU(producto.price)}</p>

      <div className="product-meta">
        <span className={`stock-badge ${stock <= 0 ? "out" : stock <= 3 ? "few" : "ok"}`}>
          {stock <= 0 ? "Sin stock" : stock <= 3 ? `Últimas ${stock}` : `Stock: ${stock}`}
        </span>
      </div>


      <button
        className="btn-add"
        onClick={onAgregar}
        disabled={disabled || stock <= 0}

      >
        {stock <= 0 ? "Sin stock" : "Agregar al carrito"}

      </button>
    </div>
  );
}

function formatUYU(value) {
  const n = Number(value);
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



