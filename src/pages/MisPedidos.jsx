import { useEffect, useState } from "react";
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

  const isAuthed = useSelector(selectIsAuthed);
  const { user } = useSelector(selectAuth);

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

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

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
