import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAuth, selectIsAuthed } from "../slices/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { apiFetch } from "../services/apiFetch";
import MisPedidosList from "../features/pedidos/MisPedidosList";
import PedidoDetalleModal from "../features/pedidos/PedidoDetalleModal";
import ConfirmActionModal from "../components/ConfirmActionModal";


import { connectPedidosMios } from "../sse/pedidosSse";


import "../styles/misPedidos.css";

export default function MisPedidos() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const reloadTimerRef = useRef(null);

  const isAuthed = useSelector(selectIsAuthed);
  const { user, accessToken } = useSelector(selectAuth);


  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  // Detalle modal (cliente)
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [detail, setDetail] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, estado }






  const load = async () => {
    if (!isAuthed) {
      toast.error("Tenés que iniciar sesión");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await apiFetch(
        "/api/pedidos/mios",
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

  const openDetalle = async (pedidoId) => {
    if (!isAuthed) {
      toast.error("Tenés que iniciar sesión");
      navigate("/login");
      return;
    }

    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);

    try {
      const res = await apiFetch(
        `/api/pedidos/${pedidoId}`,
        { method: "GET" },
        {
          dispatch,
          navigate,
          onForbidden: () => {
            toast.error("Sin permisos");
            setDetailOpen(false);
          },
        }
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

  const eliminarPedido = (pedidoId, estado) => {
    if (!isAuthed) {
      toast.error("Tenés que iniciar sesión");
      navigate("/login");
      return;
    }

    if (estado !== "listo" && estado !== "cancelado") {
      toast.error("Solo podés eliminar pedidos listos o cancelados");
      return;
    }

    setConfirmTarget({ id: pedidoId, estado });
    setConfirmOpen(true);
  };

  const confirmarEliminar = async () => {
    const pedidoId = confirmTarget?.id;
    if (!pedidoId) return;

    try {
      const res = await apiFetch(
        `/api/pedidos/${pedidoId}/archivar`,
        { method: "PATCH" },
        { dispatch, navigate }
      );

      const data = await res.json().catch(() => null);
      if (res.status === 401) return;

      if (!res.ok || !data?.ok) {
        toast.error(data?.error || "No se pudo eliminar");
        return;
      }

      toast.success("Pedido eliminado de la lista");
      setRows((prev) => prev.filter((p) => Number(p.id) !== Number(pedidoId)));
      setConfirmOpen(false);
      setConfirmTarget(null);
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  const cancelarEliminar = () => {
    setConfirmOpen(false);
    setConfirmTarget(null);
  };








  const closeDetalle = () => {
    setDetailOpen(false);
    setDetail(null);
    setDetailError(null);
  };

  const safeParseEvent = (e) => {
    try {
      // e.data viene como string JSON
      return JSON.parse(e?.data || "{}");
    } catch {
      return null;
    }
  };

  const upsertPedido = (prev, pedido) => {
    if (!pedido?.id) return prev;
    const idNum = Number(pedido.id);

    const idx = prev.findIndex((x) => Number(x.id) === idNum);
    if (idx === -1) return [pedido, ...prev];

    const copy = prev.slice();
    copy[idx] = { ...copy[idx], ...pedido };
    return copy;
  };

  const patchPedidoEstado = (prev, pedidoId, estado, updated_at) => {
    const idNum = Number(pedidoId);
    const idx = prev.findIndex((x) => Number(x.id) === idNum);
    if (idx === -1) return null; // para decidir fallback

    const copy = prev.slice();
    copy[idx] = {
      ...copy[idx],
      estado: estado ?? copy[idx].estado,
      ...(updated_at ? { updated_at } : {}),
    };
    return copy;
  };



  // 1) load inicial
  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  // 2) SSE: refresca cuando cambia el estado o se crea un pedido tuyo
  // 2) SSE: refresca cuando cambia el estado o se crea un pedido tuyo
  useEffect(() => {
    if (!isAuthed) return;
    if (!accessToken) return;

    const onPedidoCreado = (e) => {
      const payload = safeParseEvent(e);
      if (!payload?.pedidoId) return;

      // armamos un row compatible con la tabla
      const nuevo = {
        id: Number(payload.pedidoId),
        estado: payload.estado || "pendiente",
        total: payload.total ?? 0,
        moneda: payload.moneda || "UYU",
        created_at: payload.created_at || null,
        updated_at: payload.updated_at || null,
      };

      setRows((prev) => upsertPedido(prev, nuevo));
    };

    const onPedidoEstado = (e) => {
      const payload = safeParseEvent(e);
      if (!payload?.pedidoId) return;

      setRows((prev) => {
        const next = patchPedidoEstado(prev, payload.pedidoId, payload.estado, payload.updated_at);
        // si no encontramos el pedido en memoria (caso raro), fallback a load
        if (!next) {
          // evitamos spamear: solo 1 fallback corto
          if (!reloadTimerRef.current) {
            reloadTimerRef.current = setTimeout(() => {
              load();
              reloadTimerRef.current = null;
            }, 150);
          }
          return prev;
        }
        return next;
      });
    };


    const conn = connectPedidosMios({
      token: accessToken,
      onPedidoCreado: onPedidoCreado,
      onPedidoEstado: onPedidoEstado,
      onError: async () => {
        try {
          await apiFetch("/api/pedidos/mios", { method: "GET" }, { dispatch, navigate });
        } catch { }
      },
    });

    return () => {
      conn.close();
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = null;
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, accessToken]);


  return (
    <div className="container py-4">
      <div className="ped-head">
        <h1 className="ped-title">Mis pedidos</h1>
        {(user?.nombre || user?.email) && (
          <div className="ped-sub">
            {(user?.nombre
              ? `${user.nombre}${user?.apellido ? " " + user.apellido : ""}`
              : user?.email) || ""}
          </div>
        )}
      </div>

      {loading ? (
        <div className="ped-card">
          <p className="ped-muted">Cargando pedidos...</p>
        </div>
      ) : error ? (
        <div className="ped-card">
          <p className="ped-error">{error}</p>
          <button className="ped-btn" onClick={load}>
            Reintentar
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="ped-card">
          <p className="ped-muted">Todavía no tenés pedidos.</p>
          <button className="ped-btn" onClick={() => navigate("/productos")}>
            Ver productos
          </button>
        </div>
      ) : (
        <MisPedidosList
          rows={rows}
          onOpenDetalle={openDetalle}
          onEliminarPedido={eliminarPedido}
        />

      )}

      {/* Modal detalle pedido (cliente) */}
      <PedidoDetalleModal
        open={detailOpen}
        onClose={closeDetalle}
        loading={detailLoading}
        error={detailError}
        detail={detail}
      />


      <ConfirmActionModal
        open={confirmOpen}
        title="Eliminar pedido"
        text="¿Querés eliminar este pedido de la lista?"
        cancelText="Cancelar"
        confirmText="Eliminar"
        danger
        onCancel={cancelarEliminar}
        onConfirm={confirmarEliminar}
      />

    </div>


  );
}
