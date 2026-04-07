import { useState } from "react";

function money(n) {
  return Number(n || 0).toFixed(2);
}

function dayKey(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function compareVsYesterday(todayValue, yesterdayValue) {
  if (!yesterdayValue) return null;
  return ((todayValue - yesterdayValue) / yesterdayValue) * 100;
}

export default function CajaContent({
  cajaState,
  liveState,
  rankingState,
  rankingDate,
  setRankingDate,
}) {
  const {
    loading,
    busy,
    caja,
    movimientos,
    montoInicial,
    setMontoInicial,
    pagoMonto,
    setPagoMonto,
    pagoDescripcion,
    setPagoDescripcion,
    isAdmin,
    canPay,
    resumenDia,
    loadCaja,
    abrirCaja,
    registrarPago,
    cerrarCaja,
  } = cajaState;
  const live = liveState;
  const ranking = rankingState;

  const [showAllMovements, setShowAllMovements] = useState(false);
  const [showAllRanking, setShowAllRanking] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const ventasFallback = movimientos
    .filter((mov) => mov.tipo === "venta" && dayKey(mov.created_at) === today)
    .reduce((acc, mov) => acc + Number(mov.monto || 0), 0);
  const pagosFallback = movimientos
    .filter((mov) => mov.tipo === "pago" && dayKey(mov.created_at) === today)
    .reduce((acc, mov) => acc + Number(mov.monto || 0), 0);

  const ventasHoy = resumenDia?.hoy
    ? Number(resumenDia.hoy.ventas_total || 0)
    : ventasFallback;
  const ventasAyer = Number(resumenDia?.ayer?.ventas_total || 0);
  const pagosHoy = resumenDia?.hoy
    ? Number(resumenDia.hoy.pagos_total || 0)
    : pagosFallback;
  const estimatedProfitBase = Math.max(0, ventasHoy - pagosHoy);
  const estimatedProfit = estimatedProfitBase * 0.3;

  const comparePct = compareVsYesterday(ventasHoy, ventasAyer);
  const visibleMovements = showAllMovements ? movimientos : movimientos.slice(0, 3);
  const visibleRanking = showAllRanking ? ranking.data : ranking.data.slice(0, 5);

  return (
    <div className="caja-page">
      <div className="caja-page__wrap">
        <div className="caja-page__hero caja-page__hero--dashboard">
          <div>
            <div className="caja-page__eyebrow">Control operativo</div>
            <h1 className="caja-page__title">Caja</h1>
            <p className="caja-page__subtitle">
              Unificamos caja, scanner en vivo, ranking y movimientos en una sola vista de trabajo.
            </p>
          </div>

          <div className="caja-hero-badge">
            <span className={`caja-live-status ${live.connected ? "is-live" : "is-retry"}`}>
              <span className="caja-live-status__dot" />
              {live.connected ? "Scanner conectado" : "Reconectando scanner"}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="caja-page__loading">Cargando caja...</div>
        ) : !caja ? (
          <div className="caja-card">
            <h2 className="caja-card__title">No hay caja abierta</h2>

            {isAdmin ? (
              <div className="caja-open">
                <input
                  className="caja-input"
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  placeholder="Monto inicial"
                  inputMode="decimal"
                />

                <button
                  type="button"
                  className="caja-btn caja-btn--primary"
                  onClick={abrirCaja}
                  disabled={busy}
                >
                  Abrir caja
                </button>
              </div>
            ) : (
              <p className="caja-page__muted">
                Esperando que un admin abra la caja.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="caja-metrics caja-metrics--hero">
              <div className="caja-card caja-metric caja-metric--featured">
                <div className="caja-metric__label">Ganancia estimada</div>
                <div className="caja-metric__value">$ {money(estimatedProfit)}</div>
                <div className="caja-metric__hint">
                  {resumenDia?.hoy?.fecha ? `Resumen ${resumenDia.hoy.fecha}` : "Calculado desde movimientos actuales"}
                </div>
              </div>

              <div className="caja-card caja-metric">
                <div className="caja-metric__label">Monto actual</div>
                <div className="caja-metric__value">$ {money(caja.monto_actual)}</div>
                <div className="caja-metric__hint">Caja {caja.estado}</div>
              </div>

              <div className="caja-card caja-metric">
                <div className="caja-metric__label">Ventas de hoy</div>
                <div className="caja-metric__value">$ {money(ventasHoy)}</div>
                <div className="caja-metric__hint">
                  {comparePct == null
                    ? "Sin comparativa con ayer"
                    : `${comparePct >= 0 ? "+" : ""}${comparePct.toFixed(1)}% vs ayer`}
                </div>
              </div>

              <div className="caja-card caja-metric">
                <div className="caja-metric__label">Pagos registrados</div>
                <div className="caja-metric__value">$ {money(pagosHoy)}</div>
                <div className="caja-metric__hint">Ventas totales $ {money(ventasHoy)}</div>
              </div>

              <div className="caja-card caja-metric">
                <div className="caja-metric__label">Scanner en vivo</div>
                <div className="caja-metric__value caja-metric__value--status">
                  {live.session ? `${live.session.totalItems} items` : "Sin sesion"}
                </div>
                <div className="caja-metric__hint">
                  {live.session ? `${live.session.totalUnidades} unidades` : "Esperando actividad"}
                </div>
              </div>
            </div>

            <div className="caja-dashboard">
              <div className="caja-dashboard__main">
                <div className="caja-card caja-live-card">
                  <div className="caja-card__head">
                    <div>
                      <h2 className="caja-card__title">Caja en vivo</h2>
                      <div className="caja-page__muted">
                        Lo que el operario esta pasando ahora mismo por el scanner.
                      </div>
                    </div>

                    <div className={`caja-live-status ${live.connected ? "is-live" : "is-retry"}`}>
                      <span className="caja-live-status__dot" />
                      {live.connected ? "En vivo" : "Reconectando"}
                    </div>
                  </div>

                  {!live.session ? (
                    <div className="caja-page__muted">
                      No hay una sesion activa de escaneo en este momento.
                    </div>
                  ) : (
                    <>
                      <div className="caja-live-metrics">
                        <div className="caja-live-metric">
                          <div className="caja-live-metric__label">Operario</div>
                          <div className="caja-live-metric__value">#{live.session.operarioId}</div>
                        </div>

                        <div className="caja-live-metric">
                          <div className="caja-live-metric__label">Productos</div>
                          <div className="caja-live-metric__value">{live.session.totalItems}</div>
                        </div>

                        <div className="caja-live-metric">
                          <div className="caja-live-metric__label">Unidades</div>
                          <div className="caja-live-metric__value">{live.session.totalUnidades}</div>
                        </div>

                        <div className="caja-live-metric">
                          <div className="caja-live-metric__label">Subtotal</div>
                          <div className="caja-live-metric__value">$ {money(live.session.subtotal)}</div>
                        </div>
                      </div>

                      <div className="caja-live-list">
                        {live.session.items.length === 0 ? (
                          <div className="caja-page__muted">
                            La sesion esta activa pero todavia no tiene items.
                          </div>
                        ) : (
                          live.session.items.map((it) => (
                            <div key={it.id} className="caja-live-item">
                              <div className="caja-live-item__body">
                                <div className="caja-live-item__name">{it.name}</div>
                                <div className="caja-live-item__meta">$ {money(it.price)} c/u</div>
                              </div>

                              <div className="caja-live-item__qty">x {it.qty}</div>
                              <div className="caja-live-item__subtotal">$ {money(it.subtotal)}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="caja-card">
                  <div className="caja-card__head">
                    <div>
                      <h2 className="caja-card__title">Movimientos recientes</h2>
                      <div className="caja-page__muted">
                        Mostramos los ultimos movimientos y podes expandir para ver todo.
                      </div>
                    </div>

                    <div className="caja-card__actions">
                      <button
                        type="button"
                        className="caja-btn caja-btn--ghost"
                        onClick={loadCaja}
                        disabled={busy}
                      >
                        Refrescar
                      </button>
                      {movimientos.length > 3 && (
                        <button
                          type="button"
                          className="caja-btn caja-btn--ghost"
                          onClick={() => setShowAllMovements((v) => !v)}
                        >
                          {showAllMovements ? "Ver menos" : "Ver mas"}
                        </button>
                      )}
                    </div>
                  </div>

                  {movimientos.length === 0 ? (
                    <div className="caja-page__muted">No hay movimientos todavia.</div>
                  ) : (
                    <div className="caja-movements">
                      {visibleMovements.map((mov) => {
                        const isPago = mov.tipo === "pago";
                        const sign = isPago ? "-" : "+";

                        return (
                          <div key={mov.id} className="caja-movement">
                            <div className="caja-movement__type">
                              {mov.tipo}
                            </div>

                            <div className="caja-movement__body">
                              <div className="caja-movement__desc">
                                {mov.descripcion || "Sin descripcion"}
                              </div>
                              <div className="caja-movement__meta">
                                {mov.nombre || mov.email || "Usuario"} ·{" "}
                                {new Date(mov.created_at).toLocaleString()}
                              </div>
                            </div>

                            <div
                              className={`caja-movement__amount ${
                                isPago
                                  ? "caja-movement__amount--minus"
                                  : "caja-movement__amount--plus"
                              }`}
                            >
                              {sign} $ {money(mov.monto)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <aside className="caja-dashboard__side">
                <div className="caja-card caja-ranking-card">
                  <div className="caja-card__head">
                    <div>
                      <h2 className="caja-card__title">Ranking por fecha</h2>
                      <div className="caja-page__muted">
                        Elegi un dia y mira el top vendido de esa fecha.
                      </div>
                    </div>
                  </div>

                  <input
                    className="caja-input"
                    type="date"
                    value={rankingDate}
                    onChange={(e) => {
                      setRankingDate(e.target.value);
                      setShowAllRanking(false);
                    }}
                  />

                  {ranking.loading ? (
                    <div className="caja-page__muted">Cargando ranking...</div>
                  ) : ranking.data.length === 0 ? (
                    <div className="caja-page__muted">Sin ventas para esa fecha.</div>
                  ) : (
                    <>
                      <div className="ranking-list">
                        {visibleRanking.map((it, index) => {
                          const isTop3 = index < 3;

                          return (
                            <div
                              key={it.producto_id}
                              className={`ranking-item ${isTop3 ? "ranking-item--top" : ""}`}
                            >
                              <div className="ranking-pos">
                                {index + 1}
                              </div>

                              <div className="ranking-img">
                                {it.image ? (
                                  <img src={it.image} alt={it.name} />
                                ) : (
                                  <div className="ranking-imgph" />
                                )}
                              </div>

                              <div className="ranking-info">
                                <div className="ranking-name">{it.name}</div>
                                <div className="ranking-price">$ {it.price}</div>
                              </div>

                              <div className="ranking-qty">{it.total_vendido}</div>
                            </div>
                          );
                        })}
                      </div>

                      {ranking.data.length > 5 && (
                        <button
                          type="button"
                          className="caja-btn caja-btn--ghost caja-section-btn"
                          onClick={() => setShowAllRanking((v) => !v)}
                        >
                          {showAllRanking ? "Ver menos" : "Ver mas"}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {canPay && (
                  <div className="caja-card caja-pay-card">
                    <h2 className="caja-card__title">Registrar pago</h2>
                    <div className="caja-page__muted">
                      Carga pagos manuales sin salir del tablero principal.
                    </div>

                    <div className="caja-pay caja-pay--stack">
                      <input
                        className="caja-input"
                        value={pagoMonto}
                        onChange={(e) => setPagoMonto(e.target.value)}
                        placeholder="Monto"
                        inputMode="decimal"
                      />

                      <input
                        className="caja-input"
                        value={pagoDescripcion}
                        onChange={(e) => setPagoDescripcion(e.target.value)}
                        placeholder="Descripcion del pago"
                      />

                      <button
                        type="button"
                        className="caja-btn caja-btn--primary"
                        onClick={registrarPago}
                        disabled={busy}
                      >
                        Agregar pago
                      </button>
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className="caja-card caja-actions-card">
                    <h2 className="caja-card__title">Acciones</h2>
                    <div className="caja-page__muted">
                      Acciones sensibles de la caja operativa.
                    </div>

                    <div className="caja-actions">
                      <button
                        type="button"
                        className="caja-btn caja-btn--danger"
                        onClick={cerrarCaja}
                        disabled={busy}
                      >
                        Cerrar caja
                      </button>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
