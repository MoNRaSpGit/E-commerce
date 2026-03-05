import PrecioItem from "./PrecioItem";

export default function PrecioCategoria({
  label,
  isOpen,
  count,
  list,
  onToggle,
  onEdit,
}) {
  return (
    <div className="precios-card">

      <button
        type="button"
        className="precios-toggle"
        onClick={onToggle}
      >
        <span>{label}</span>

        <span className="precios-toggleRight">
          {count} {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <div className="precios-list">

          {list.length === 0 ? (
            <div className="precios-empty">
              No hay items.
            </div>
          ) : (
            list.map((r) => (
              <PrecioItem
                key={r.id}
                r={r}
                openEdit={onEdit}
              />
            ))
          )}

        </div>
      )}
    </div>
  );
}