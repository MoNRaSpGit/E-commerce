export default function PrecioItem({ r, openEdit }) {
  return (
    <div className="precio-item">
      <div>
        <div className="precio-item__name">
          {r.nombre}
        </div>

        <div className="precio-item__price">
          ${Number(r.precio).toFixed(2)}{" "}
          {r.unidad ? `(${r.unidad})` : ""}
        </div>
      </div>

      <button
        type="button"
        className="precio-item__btn"
        onClick={() => openEdit(r)}
      >
        Actualizar
      </button>
    </div>
  );
}