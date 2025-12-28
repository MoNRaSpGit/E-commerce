import { useDispatch, useSelector } from "react-redux";
import { selectAuth, selectIsAuthed } from "../slices/authSlice";
import { useNavigate } from "react-router-dom";

import PedidoDetalleModal from "../features/pedidos/PedidoDetalleModal";
import OperarioPedidosList from "../features/pedidos/OperarioPedidosList";
import { useOperarioPedidos } from "../hooks/useOperarioPedidos";

import "../styles/operarioPedidos.css";

export default function OperarioPedidos() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isAuthed = useSelector(selectIsAuthed);
  const { accessToken, user } = useSelector(selectAuth);

  const {
    ESTADOS,
    canSee,

    estadoFilter,
    setEstadoFilter,

    loading,
    rows,
    error,

    updatingId,
    cambiarEstado,
    load,

    detailOpen,
    detailLoading,
    detailError,
    detail,
    openDetalle,
    closeDetalle,
  } = useOperarioPedidos({ user, isAuthed, accessToken, dispatch, navigate });

  // Si no puede ver, el hook ya redirige; acá solo renderizamos.
  return (
    <div className="container py-4">
      <div className="op-head">
        <h1 className="op-title">Panel de pedidos</h1>

        <div className="op-tools">
          <label className="op-label">
            Estado:
            <select
              className="op-select"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              disabled={loading || !canSee}
            >
              <option value="">Todos</option>
              <option value="pendiente">pendiente</option>
              <option value="en_proceso">en_proceso</option>
              <option value="listo">listo</option>
              <option value="cancelado">cancelado</option>
            </select>
          </label>

          <button className="op-btn" type="button" onClick={load} disabled={loading || !canSee}>
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
      ) : rows.length === 0 ? (
        <div className="op-card">
          <p className="op-muted">No hay pedidos para mostrar.</p>
        </div>
      ) : (
        <OperarioPedidosList
          rows={rows}
          estados={ESTADOS}
          updatingId={updatingId}
          onVerDetalle={openDetalle}
          onCambiarEstado={cambiarEstado}
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
