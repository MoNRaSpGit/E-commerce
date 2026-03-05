export default function PrecioItem({ r, openEdit }) {
  const nombre = String(r.nombre || "").replace(/^medicamento\s+/i, "");

  const ICONS = {
    banana: "🍌",
    manzana: "🍎",
    naranja: "🍊",
    cebolla: "🧅",
    papa: "🥔",
    morron: "🫑",
    zapallo: "🎃",
    zanahoria: "🥕",
    lechuga: "🥬",
  };

  const key = nombre.toLowerCase().split(" ")[0];
  const icon = ICONS[key];

  return (
    <div className="precio-item">

      <div className="precio-item__left">

        {r.image ? (
          <img
            className="precio-item__img"
            src={r.image}
            alt={nombre || "Producto"}
          />
        ) : icon ? (
          <div className="precio-item__emoji">
            {icon}
          </div>
        ) : (
          <div className="precio-item__img precio-item__img--placeholder" />
        )}

        <div>
          <div className="precio-item__name">
            {nombre}
          </div>

          <div className="precio-item__price">
            ${Number(r.precio).toFixed(2)} {r.unidad ? `(${r.unidad})` : ""}
          </div>
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