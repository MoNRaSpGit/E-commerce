export default function SinStockItemCard({
  name,
  imgSrc,
  initials,
  currentStock,
  value,
  onChangeValue,
  saving,
  onSave,
}) {
  return (
    <div className="product-card">
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={name}
          className="product-img"
          style={{ marginBottom: 10 }}
        />
      ) : (
        <div
          className="product-img product-img--placeholder"
          style={{ marginBottom: 10 }}
          aria-label="Sin imagen"
        >
          <div className="product-img-ph-circle">{initials}</div>
          <div className="product-img-ph-text">Sin imagen</div>
        </div>
      )}

      <h3 className="product-name">{name}</h3>

      <div className="product-meta" style={{ marginBottom: 10 }}>
        <span className={`stock-badge ${currentStock <= 0 ? "out" : "ok"}`}>
          {currentStock <= 0 ? "Sin stock" : `Stock: ${currentStock}`}
        </span>
      </div>

      <label className="op-label block">
        Nuevo stock
        <input
          className="op-select"
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => onChangeValue(e.target.value)}
          disabled={saving}
        />
      </label>

      <button
        className="btn-add"
        type="button"
        onClick={onSave}
        disabled={saving}
        style={{ marginTop: 10 }}
      >
        {saving ? "Actualizando..." : "Actualizar stock"}
      </button>
    </div>
  );
}