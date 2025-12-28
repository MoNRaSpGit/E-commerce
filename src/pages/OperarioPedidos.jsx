import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAuth, selectIsAuthed } from "../slices/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { apiFetch } from "../services/apiFetch";

import PedidoDetalleModal from "../features/pedidos/PedidoDetalleModal";
import OperarioPedidosList from "../features/pedidos/OperarioPedidosList";

import "../styles/operarioPedidos.css";

export default function OperarioPedidos() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isAuthed = useSelector(selectIsAuthed);
  const { accessToken, user } = useSelector(selectAuth);

  const [estadoFilter, setEstadoFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Modal detalle
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [detail, setDetail] = useState(null);

  const updatingIdRef = useRef(null);
  useEffect(() => {
    updatingIdRef.current = updatingId;
  }, [updatingId]);

  const canSee = useMemo(() => {
    const rol = user?.rol;
    return rol === "operario" || rol === "admin";
  }, [user]);

  const load = async () => {
    if (!isAuthed) {
      toast.error("Tenés que iniciar sesión");
      navigate("/login");
      return;
    }
    if (!canSee) {
      toast.error("Sin permisos");
      navigate("/productos");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const qs = estadoFilter ? `?estado=${encodeURIComponent(estadoFilter)}` : "";

      const res = await apiFetch(
        `/api/pedidos${qs}`,
        { method: "GET" },
        {
          dispatch,
          navigate,
          onForbidden: () => {
            toast.error("Sin permisos");
            navigate("/productos");
          },
        }
      );

      const data = await res.json().catch(() => null);

      // apiFetch ya manejó logout/toast/navigate si falló refresh
      if (res.status === 401) return;

      if (!res.ok || !data?.ok) {
        setError(data?.error || "No se pudieron cargar los pedidos");
        return;
      }

      setRows(Array.isArray(data.data) ? data.data : []);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (pedidoId, estado) => {
    if (updatingId) return;

    try {
      setUpdatingId(pedidoId);

      const res = await apiFetch(
        `/api/pedidos/${pedidoId}/estado`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado }),
        },
        {
          dispatch,
          navigate,
          onForbidden: () => {
            toast.error("Sin permisos");
            navigate("/productos");
          },
        }
      );

      const data = await res.json().catch(() => null);

      if (res.status === 401) return;

      if (!res.ok || !data?.ok) {
        toast.error(data?.error || "No se pudo actualizar");
        return;
      }

      toast.success(`Pedido #${pedidoId} → ${estado}`);
      setRows((prev) => prev.map((p) => (p.id === pedidoId ? { ...p, estado } : p)));
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setUpdatingId(null);
    }
  };

  const openDetalle = async (pedidoId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);

    try {
      const res = await apiFetch(
        `/api/pedidos/${pedidoId}`,
        { method: "GET" },
        { dispatch, navigate }
      );

      const data = await res.json().catch(() => null);

      if (res.status === 401) return;

      if (!res.ok || !data?.ok) {
        setDetailError(data?.error || "No se pudo cargar el detalle");
        return;
      }

      setDetail(data.data);
    } catch {
      setDetailError("No se pudo conectar con el servidor");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetalle = () => {
    setDetailOpen(false);
    setDetail(null);
    setDetailError(null);
  };

  // Load inicial y al cambiar filtro
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoFilter, canSee]);

  // SSE
  useEffect(() => {
    if (!canSee) return;
    if (!accessToken) return;

    const url = `${import.meta.env.VITE_API_URL}/api/pedidos/stream?token=${encodeURIComponent(
      accessToken
    )}`;

    const es = new EventSource(url);

    const handleUpdate = () => {
      if (updatingIdRef.current) return;
      load();
    };

    es.addEventListener("pedido_creado", handleUpdate);
    es.addEventListener("pedido_estado", handleUpdate);

    es.onerror = () => {
      // si querés: podríamos mostrar un indicador "reconectando..."
      // EventSource reintenta solo
    };

    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSee, accessToken]);

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
