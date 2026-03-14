import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAdminScanLive } from "../hooks/useAdminScanLive";
import "../styles/adminScanLive.css";

function money(n) {
  return Number(n || 0).toFixed(2);
}

export default function AdminScanLive() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const live = useAdminScanLive({ dispatch, navigate });

  if (live.loading) {
    return (
      <div className="admin-scan-live">
        <div className="admin-scan-live__wrap">
          <div className="admin-scan-live__loading">
            <h2 className="admin-scan-live__loading-title">Caja en vivo</h2>
            <p className="admin-scan-live__loading-text">Cargando panel en tiempo real…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-scan-live">
      <div className="admin-scan-live__wrap">
        <div className="admin-scan-live__hero">
          <div className="admin-scan-live__hero-left">
            <div className="admin-scan-live__eyebrow">Monitor en tiempo real</div>
            <h1 className="admin-scan-live__title">Caja en vivo</h1>
            <p className="admin-scan-live__subtitle">
              Mirá lo que el operario va pasando en caja, producto por producto.
            </p>
          </div>

          <div className="admin-scan-live__hero-right">
            <span
              className={`admin-scan-live__status ${
                live.connected
                  ? "admin-scan-live__status--live"
                  : "admin-scan-live__status--retry"
              }`}
            >
              <span className="admin-scan-live__status-dot" />
              {live.connected ? "En vivo" : "Reconectando"}
            </span>

            <button
              type="button"
              className="admin-scan-live__refresh"
              onClick={live.refresh}
            >
              Refrescar
            </button>
          </div>
        </div>

        {!live.session ? (
          <div className="admin-scan-live__empty">
            <h2 className="admin-scan-live__empty-title">No hay una caja activa</h2>
            <p className="admin-scan-live__empty-text">
              Cuando el operario empiece a escanear productos, el movimiento va a aparecer acá.
            </p>
          </div>
        ) : (
          <>
            <div className="admin-scan-live__metrics">
              <div className="admin-scan-live__card">
                <div className="admin-scan-live__card-label">Operario</div>
                <div className="admin-scan-live__card-value">
                  #{live.session.operarioId}
                </div>
              </div>

              <div className="admin-scan-live__card">
                <div className="admin-scan-live__card-label">Productos</div>
                <div className="admin-scan-live__card-value">
                  {live.session.totalItems}
                </div>
              </div>

              <div className="admin-scan-live__card">
                <div className="admin-scan-live__card-label">Unidades</div>
                <div className="admin-scan-live__card-value">
                  {live.session.totalUnidades}
                </div>
              </div>

              <div className="admin-scan-live__card">
                <div className="admin-scan-live__card-label">Subtotal</div>
                <div className="admin-scan-live__card-value">
                  $ {money(live.session.subtotal)}
                </div>
              </div>
            </div>

            <div className="admin-scan-live__panel">
              <div className="admin-scan-live__panel-head">
                <h2 className="admin-scan-live__panel-title">Productos escaneados</h2>
                <div className="admin-scan-live__panel-sub">
                  Actualización en tiempo real
                </div>
              </div>

              <div className="admin-scan-live__list">
                {live.session.items.map((it) => (
                  <div key={it.id} className="admin-scan-live__row">
                    <div className="admin-scan-live__namebox">
                      <div className="admin-scan-live__name">{it.name}</div>
                      <div className="admin-scan-live__meta">
                        Precio unitario
                      </div>
                    </div>

                    <div className="admin-scan-live__price">
                      $ {money(it.price)}
                    </div>

                    <div className="admin-scan-live__qty">
                      x {it.qty}
                    </div>

                    <div className="admin-scan-live__subtotal">
                      $ {money(it.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}