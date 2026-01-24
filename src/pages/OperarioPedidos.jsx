import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";


import { subscribeToPush, hasPushSubscription } from "../services/pushClient";



import { selectAuth, selectIsAuthed } from "../slices/authSlice";
import { useOperarioPedidos } from "../hooks/useOperarioPedidos";

import PedidoDetalleModal from "../features/pedidos/PedidoDetalleModal";
import OperarioPedidosList from "../features/pedidos/OperarioPedidosList";

import "../styles/operarioPedidos.css";

export default function OperarioPedidos() {

  const [needPush, setNeedPush] = useState(false);
  const [checkingPush, setCheckingPush] = useState(true);
  const [enablingPush, setEnablingPush] = useState(false);

  const checkOperarioPush = async () => {
    if (!isOperario) return;

    try {
      const perm = Notification.permission;
      const hasSub = perm === "granted" ? await hasPushSubscription() : false;

      // 👉 si no está granted o no hay sub, el operario NECESITA activar
      setNeedPush(!(perm === "granted" && hasSub));
    } catch {
      setNeedPush(true);
    } finally {
      setCheckingPush(false);
    }
  };

const handleEnablePush = async () => {
  setEnablingPush(true);
  setCheckingPush(true);

  try {
    await subscribeToPush();

    // ✅ sincroniza el Navbar/UserMenu inmediatamente
    window.dispatchEvent(new Event("eco_push_changed"));

    // ✅ cerramos el modal ya (optimista) y después confirmamos con el check
    setNeedPush(false);

    await checkOperarioPush(); // recalcula needPush con estado real
  } catch (e) {
    setCheckingPush(false);
    alert("No se pudieron activar las notificaciones. Revisá permisos del navegador.");
  } finally {
    setEnablingPush(false);
  }
};



  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isAuthed = useSelector(selectIsAuthed);
  const { accessToken, user } = useSelector(selectAuth);
  const isOperario = user?.rol === "operario";



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


  useEffect(() => {
    if (canSee && isOperario) {
      checkOperarioPush();
    }
  }, [canSee, isOperario]);


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

      {/* 🚨 Operario sin notificaciones */}
      {isOperario && !checkingPush && needPush && (
        <div className="op-push-overlay">
          <div className="op-push-modal">
            <h3 className="op-push-modal-title">🔔 Activar notificaciones</h3>

            <p className="op-push-modal-text">
              Este panel necesita notificaciones activas para avisarte cuando entra un pedido.
            </p>

            {Notification.permission === "denied" ? (
              <p className="op-push-modal-help">
                Las notificaciones están <strong>bloqueadas</strong>. Activálas desde el candado al lado de la URL
                → Notificaciones → Permitir, y luego recargá.
              </p>
            ) : (
              <button
                className="op-btn op-push-cta"
                onClick={handleEnablePush}
                disabled={enablingPush}
              >
                {enablingPush ? "Activando..." : "Activar notificaciones"}
              </button>
            )}

            {/* Solo si querés permitir seguir sin push */}
            <button
              className="op-btn op-btn-ghost op-push-skip"
              type="button"
              onClick={() => setNeedPush(false)}
            >
              Seguir sin notificaciones (no recomendado)
            </button>
          </div>
        </div>
      )}



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
