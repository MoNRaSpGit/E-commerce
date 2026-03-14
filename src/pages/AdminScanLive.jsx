import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAdminScanLive } from "../hooks/useAdminScanLive";

function money(n) {
  return Number(n || 0).toFixed(2);
}

export default function AdminScanLive() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const live = useAdminScanLive({ dispatch, navigate });

  if (live.loading) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Caja en vivo</h2>
        <div>Cargando…</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Caja en vivo</h2>
        <span>{live.connected ? "● En vivo" : "○ Reconectando"}</span>
        <button type="button" onClick={live.refresh}>
          Refrescar
        </button>
      </div>

      {!live.session ? (
        <div>No hay una sesión activa de escaneo.</div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <div>Operario ID: {live.session.operarioId}</div>
            <div>Total productos: {live.session.totalItems}</div>
            <div>Total unidades: {live.session.totalUnidades}</div>
            <div>Subtotal: $ {money(live.session.subtotal)}</div>
          </div>

          <div>
            {live.session.items.map((it) => (
              <div
                key={it.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: "1px solid #ddd",
                }}
              >
                <div>{it.name}</div>
                <div>$ {money(it.price)}</div>
                <div>Cant: {it.qty}</div>
                <div>$ {money(it.subtotal)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}