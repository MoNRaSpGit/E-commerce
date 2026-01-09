import "../styles/reposicionCard.css";

export default function ReposicionCard({ item }) {
  const nivel = item?.nivel;

  const borde =
    nivel === "critico"
      ? "repo-card critico"
      : nivel === "bajo"
      ? "repo-card bajo"
      : "repo-card";

  const nombre =
    item?.name ||
    item?.producto_nombre ||
    item?.nombre_snapshot ||
    `Producto #${item?.producto_id ?? item?.productoId ?? "?"}`;

  return (
    <div className={borde}>
      <div className="repo-img-wrap">
        {item?.image ? (
          <img
            src={item.image}
            alt={nombre}
            loading="lazy"
          />
        ) : (
          <div className="repo-noimg">Sin imagen</div>
        )}
      </div>

      <div className="repo-body">
        <h3 className="repo-title">{nombre}</h3>

        {/* stock actual */}
        {item?.stock_actual !== undefined && (
          <p className="repo-stock">
            Stock actual: <strong>{item.stock_actual}</strong>
          </p>
        )}

        {/* stock en el momento del evento */}
        <p className="repo-stock">
          Stock en evento: <strong>{item.stock_en_evento}</strong>
        </p>

        <p className={`repo-nivel ${nivel}`}>
          Nivel: {nivel === "critico" ? "CRÍTICO" : "BAJO"}
        </p>

        <p className="repo-fecha">
          {item?.created_at
            ? new Date(item.created_at).toLocaleString()
            : "-"}
        </p>
      </div>
    </div>
  );
}
