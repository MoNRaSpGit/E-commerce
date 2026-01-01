import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAuth, selectIsAuthed } from "../slices/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { apiFetch } from "../services/apiFetch";
import MisPedidosList from "../features/pedidos/MisPedidosList";
import PedidoDetalleModal from "../features/pedidos/PedidoDetalleModal";

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

const closeDetalle = () => {
  setDetailOpen(false);
  setDetail(null);
  setDetailError(null);
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

    const onUpdate = () => {
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);

      reloadTimerRef.current = setTimeout(() => {
        load();
        reloadTimerRef.current = null;
      }, 300);
    };

    const conn = connectPedidosMios({
      token: accessToken,
      onPedidoCreado: onUpdate,
      onPedidoEstado: onUpdate,
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
      <MisPedidosList rows={rows} onOpenDetalle={openDetalle} />
    )}

    {/* Modal detalle pedido (cliente) */}
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
