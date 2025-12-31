import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAuth, selectIsAuthed } from "../slices/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { apiFetch } from "../services/apiFetch";
import MisPedidosList from "../features/pedidos/MisPedidosList";

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

  // 1) load inicial
  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  // 2) SSE: refresca cuando cambia el estado o se crea un pedido tuyo
  useEffect(() => {
    if (!isAuthed) return;
    if (!accessToken) return;

    const url = `${import.meta.env.VITE_API_URL}/api/pedidos/mios/stream?token=${encodeURIComponent(
      accessToken
    )}`;

    const es = new EventSource(url);

    const onUpdate = () => {
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }

      reloadTimerRef.current = setTimeout(() => {
        load();
        reloadTimerRef.current = null;
      }, 300); // debounce 300ms
    };


    es.addEventListener("pedido_estado", onUpdate);
    es.addEventListener("pedido_creado", onUpdate);

    es.onerror = async () => {
      try {
        await apiFetch("/api/pedidos/mios", { method: "GET" }, { dispatch, navigate });
      } catch { }
    };


    return () => {
      es.close();
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
        {user?.email && <div className="ped-sub">{user.email}</div>}
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
        <MisPedidosList rows={rows} />
      )}
    </div>
  );
}
