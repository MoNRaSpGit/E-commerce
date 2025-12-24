import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectAuth, selectIsAuthed } from "../slices/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import "../styles/misPedidos.css";

function formatUYU(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-UY", { style: "currency", currency: "UYU" });
}

function badgeClass(estado) {
  if (estado === "pendiente") return "badge badge-pendiente";
  if (estado === "en_proceso") return "badge badge-proceso";
  if (estado === "listo") return "badge badge-listo";
  if (estado === "cancelado") return "badge badge-cancelado";
  return "badge";
}

export default function MisPedidos() {
  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthed);
  const { accessToken, user } = useSelector(selectAuth);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  const load = async () => {
    if (!isAuthed || !accessToken) {
      toast.error("Tenés que iniciar sesión");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pedidos/mios`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        toast.error("Tu sesión expiró. Iniciá sesión de nuevo.");
        navigate("/login");
        return;
      }

      if (!res.ok || !data?.ok) {
        setError(data?.error || "No se pudieron cargar los pedidos");
        return;
      }

      setRows(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container py-4">
      <div className="ped-head">
        <h1 className="ped-title">Mis pedidos</h1>
        <div className="ped-sub">
          {user?.email ? <span>{user.email}</span> : null}
        </div>
      </div>

      {loading ? (
        <div className="ped-card">
          <p className="ped-muted">Cargando pedidos...</p>
        </div>
      ) : error ? (
        <div className="ped-card">
          <p className="ped-error">{error}</p>
          <button className="ped-btn" type="button" onClick={load}>
            Reintentar
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="ped-card">
          <p className="ped-muted">Todavía no tenés pedidos.</p>
          <button className="ped-btn" type="button" onClick={() => navigate("/productos")}>
            Ver productos
          </button>
        </div>
      ) : (
        <div className="ped-card">
          <div className="ped-table">
            <div className="ped-row ped-header">
              <div className="c-id">Pedido</div>
              <div className="c-est">Estado</div>
              <div className="c-total">Total</div>
              <div className="c-fecha">Fecha</div>
            </div>

            {rows.map((p) => (
              <div className="ped-row" key={p.id}>
                <div className="c-id">#{p.id}</div>
                <div className="c-est">
                  <span className={badgeClass(p.estado)}>{p.estado}</span>
                </div>
                <div className="c-total">{formatUYU(p.total)}</div>
                <div className="c-fecha">
                  {p.created_at ? new Date(p.created_at).toLocaleString("es-UY") : "-"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
