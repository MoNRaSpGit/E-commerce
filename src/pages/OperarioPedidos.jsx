import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { selectAuth, selectIsAuthed } from "../slices/authSlice";
import { useOperarioPedidos } from "../hooks/useOperarioPedidos";

import PedidoDetalleModal from "../features/pedidos/PedidoDetalleModal";
import OperarioPedidosList from "../features/pedidos/OperarioPedidosList";

import "../styles/operarioPedidos.css";

export default function OperarioPedidos() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isAuthed = useSelector(selectIsAuthed);
  const { accessToken, user } = useSelector(selectAuth);

  const {
    canSee,

    estadoFilter,
    setEstadoFilter,

    loading,
    rows,
    error,

    updatingId,
    cambiarEstado,
    archivarPedido,
    load,

    detailOpen,
    detailLoading,
    detailError,
    detail,
    openDetalle,
    closeDetalle,
    sseStatus,
  } = useOperarioPedidos({
    user,
    isAuthed,
    accessToken,
    dispatch,
    navigate,
  });

  // Guard visual opcional (el hook ya redirige y tira toast)
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
      <div className="op-head">
        <h1 className="op-title">Panel de pedidos</h1>
        
        {/* SSE chip oculto (solo UI). La funcionalidad SSE queda activa. */}

        <div className="op-tools">
          <label className="op-label">
            Estado:
            <select
              className="op-select"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              disabled={loading}
            >
              <option value="">Todos</option>
              <option value="pendiente">pendiente</option>
              <option value="en_proceso">en_proceso</option>
              <option value="listo">listo</option>
              <option value="cancelado">cancelado</option>
            </select>
          </label>

          <button className="op-btn" type="button" onClick={load} disabled={loading}>
            Refrescar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="op-card">
          <p className="op-muted">Cargando pedidos...</p>
        </div>
      ) : error ? (
        <div className="op-card">
          <p className="op-error">{error}</p>
          <button className="op-btn" type="button" onClick={load}>
            Reintentar
          </button>
        </div>
      ) : (
        <OperarioPedidosList
          rows={rows}
          updatingId={updatingId}
          onVerDetalle={openDetalle}
          onCambiarEstado={cambiarEstado}
          onArchivar={archivarPedido}
          loadingDisabled={loading}
        />
      )}

      <PedidoDetalleModal
        open={detailOpen}
        onClose={closeDetalle}
        loading={detailLoading}
        error={detailError}
        detail={detail}
      />
    </div>
  );
}
