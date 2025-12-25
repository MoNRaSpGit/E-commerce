import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { selectAuth, selectIsAuthed } from "../slices/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import PedidoDetalleModal from "../components/pedidos/PedidoDetalleModal";

import "../styles/operarioPedidos.css";

const ESTADOS = ["pendiente", "en_proceso", "listo", "cancelado"];

function formatUYU(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-UY", { style: "currency", currency: "UYU" });
}

export default function OperarioPedidos() {
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
    if (!isAuthed || !accessToken) {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pedidos${qs}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        toast.error("Tu sesión expiró. Iniciá sesión de nuevo.");
        navigate("/login");
        return;
      }
      if (res.status === 403) {
        toast.error("Sin permisos");
        navigate("/productos");
        return;
      }

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

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/pedidos/${pedidoId}/estado`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ estado }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        toast.error(data?.error || "No se pudo actualizar");
        return;
      }

      toast.success(`Pedido #${pedidoId} → ${estado}`);

      // update local rápido
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pedidos/${pedidoId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        toast.error("Tu sesión expiró. Iniciá sesión de nuevo.");
        navigate("/login");
        return;
      }

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
      // reintenta solo
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
      ) : rows.length === 0 ? (
        <div className="op-card">
          <p className="op-muted">No hay pedidos para mostrar.</p>
        </div>
      ) : (
        <div className="op-card">
          <div className="op-table">
            <div className="op-row op-header">
              <div className="c-id">Pedido</div>
              <div className="c-user">Usuario</div>
              <div className="c-est">Estado</div>
              <div className="c-total">Total</div>
              <div className="c-fecha">Fecha</div>
              <div className="c-acc">Acciones</div>
            </div>

            {rows.map((p) => (
              <div className="op-row" key={p.id}>
                <div className="c-id">#{p.id}</div>
                <div className="c-user">{p.usuario_email ?? p.usuario_id}</div>
                <div className="c-est">{p.estado}</div>
                <div className="c-total">{formatUYU(p.total)}</div>
                <div className="c-fecha">
                  {p.created_at ? new Date(p.created_at).toLocaleString("es-UY") : "-"}
                </div>

                <div className="c-acc">
                  <div className="op-actions">
                    <button
                      className="op-btn small"
                      type="button"
                      onClick={() => openDetalle(p.id)}
                      disabled={loading}
                    >
                      Ver
                    </button>

                    <select
                      className="op-select"
                      value={p.estado}
                      onChange={(e) => cambiarEstado(p.id, e.target.value)}
                      disabled={updatingId === p.id}
                    >
                      {ESTADOS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {updatingId && (
            <div className="op-muted mt-2">Actualizando pedido #{updatingId}...</div>
          )}
        </div>
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
