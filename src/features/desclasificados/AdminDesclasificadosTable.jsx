function formatUYU(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-UY", { style: "currency", currency: "UYU" });
}

function getInitials(name) {
  const s = String(name || "").trim();
  if (!s) return "—";
  const parts = s.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || parts[0]?.[1] || "";
  return (first + second).toUpperCase();
}

export default function AdminDesclasificadosTable({ rows }) {
  return (
    <>
      {rows.map((p) => {
        const imgSrc =
          p.image && String(p.image).trim() ? p.image : null;

        return (
          <div className="product-card" key={p.id}>
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={p.name || "Producto"}
                className="product-img"
                style={{ marginBottom: 10 }}
              />
            ) : (
              <div
                className="product-img product-img--placeholder"
                style={{ marginBottom: 10 }}
                aria-label="Sin imagen"
              >
                <div className="product-img-ph-circle">{getInitials(p.name)}</div>
                <div className="product-img-ph-text">Sin imagen</div>
              </div>
            )}

            <h3 className="product-name">{p.name || "Sin nombre"}</h3>

            <div className="des-card-price">{formatUYU(p.price)}</div>

            <div className="product-meta" style={{ marginTop: 10 }}>
              <span className="des-badge">Desclasificado</span>
            </div>
          </div>
        );
      })}
    </>
  );
}