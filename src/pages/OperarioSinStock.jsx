import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "../services/apiFetch";
import SinStockItem from "../features/sinstock/SinStockItem";

import "../styles/productos.css";

export default function OperarioSinStock() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr("");

      try {
        const r = await apiFetch(
          "/api/sinstock",
          { method: "GET" },
          { dispatch, navigate }
        );

        const data = await r.json().catch(() => null);

        if (!r.ok || !data?.ok) {
          const msg = data?.error || "No se pudo cargar la lista";
          if (!cancelled) setErr(msg);
          return;
        }

        if (!cancelled) setRows(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Error cargando la lista");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [dispatch, navigate]);

  const sinStock = rows;

  return (
    <div className="productos-container">
      <div className="productos-sticky">
        <div className="productos-sticky-inner">
          <div className="productos-sticky-top">
            <div className="productos-sticky-title">Sin stock</div>
            <div className="productos-sticky-meta">
              {!loading && <span>{sinStock.length} productos</span>}
            </div>
          </div>

          <p className="op-muted mt2" style={{ marginTop: 8 }}>
            Lista operativa: productos con <b>stock = 0</b>. Puede incluir productos{" "}
            <b>pendiente</b> y <b>activo</b>.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="no-products">Cargando…</p>
      ) : err ? (
        <p className="no-products">{err}</p>
      ) : sinStock.length === 0 ? (
        <p className="no-products">No hay productos sin stock 🎉</p>
      ) : (
        <div className="productos-grid">
          {sinStock.map((p) => (
            <SinStockItem
              key={p.id}
              p={p}
              dispatch={dispatch}
              navigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}