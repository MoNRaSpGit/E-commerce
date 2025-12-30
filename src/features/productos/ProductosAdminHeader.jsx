export default function ProductosAdminHeader({ loading, onRefresh }) {
  return (
    <div className="adm-head">
      <h1 className="adm-title">Gestión de productos</h1>
      <button className="op-btn" type="button" onClick={onRefresh} disabled={loading}>
        Refrescar
      </button>
    </div>
  );
}
