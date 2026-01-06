import "../styles/ProductCard.css";

export default function ProductCard({ producto, onAgregar, disabled }) {
  return (
    <div className="product-card">
      <img
        src={normalizeImage(producto.image) || "/placeholder.png"}
        alt={producto.name}
        className="product-img"
      />

      <h3 className="product-name">{producto.name}</h3>

      <p className="product-price">
        {formatUYU(producto.price)}
      </p>

      <p className="product-stock">
        Stock: {Number(producto?.stock ?? 0)}
      </p>

      <button
        className="btn-add"
        onClick={onAgregar}
        disabled={disabled || Number(producto?.stock ?? 0) <= 0}
      >
        {Number(producto?.stock ?? 0) <= 0 ? "Sin stock" : "Agregar al carrito"}
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
