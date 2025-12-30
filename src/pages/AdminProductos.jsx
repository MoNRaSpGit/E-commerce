import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { selectAuth, selectIsAuthed } from "../slices/authSlice";
import { useAdminProductos } from "../features/productos/useAdminProductos";

import ProductosAdminHeader from "../features/productos/ProductosAdminHeader";
import ProductosAdminTable from "../features/productos/ProductosAdminTable";
import ProductoEditModal from "../features/productos/ProductoEditModal";

import "../styles/adminProductos.css";

export default function AdminProductos() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isAuthed = useSelector(selectIsAuthed);
  const { user } = useSelector(selectAuth);

  const {
    canSee,
    loading,
    rows,
    error,
    load,

    open,
    saving,
    current,
    form,
    setField,
    openEdit,
    closeEdit,
    save,
  } = useAdminProductos({ user, isAuthed, dispatch, navigate });

  if (!canSee) {
    return (
      <div className="container py-4">
        <div className="op-card">
          <p className="op-error">Sin permisos para ver este panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <ProductosAdminHeader loading={loading} onRefresh={load} />

      {loading ? (
        <div className="op-card">
          <p className="op-muted">Cargando productos...</p>
        </div>
      ) : error ? (
        <div className="op-card">
          <p className="op-error">{error}</p>
          <button className="op-btn" type="button" onClick={load}>
            Reintentar
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="op-card">
          <p className="op-muted">No hay productos para mostrar.</p>
        </div>
      ) : (
        <ProductosAdminTable rows={rows} onEdit={openEdit} />
      )}

      <ProductoEditModal
        open={open}
        saving={saving}
        current={current}
        form={form}
        setField={setField}
        onClose={closeEdit}
        onSave={save}
      />
    </div>
  );
}
