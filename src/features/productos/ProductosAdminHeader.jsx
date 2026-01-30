export default function ProductosAdminHeader({
  loading,
  onRefresh,
  tab,
  setTab,
}) {
  return (
    <div className="adm-head">
      <div>
        <h1 className="adm-title">Gestión de productos</h1>

        <div className="adm-tabs">
          <button
            type="button"
            className={`adm-tab ${tab === "productos" ? "is-active" : ""}`}
            onClick={() => setTab("productos")}
          >
            Productos
          </button>

          <button
            type="button"
            className={`adm-tab ${tab === "categorias" ? "is-active" : ""}`}
            onClick={() => setTab("categorias")}
          >
            Categorías
          </button>
        </div>
      </div>

      <button
        className="op-btn"
        type="button"
        onClick={onRefresh}
        disabled={loading}
      >
        Refrescar
      </button>
    </div>
  );
}

