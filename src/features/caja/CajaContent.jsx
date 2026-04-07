function money(n) {
  return Number(n || 0).toFixed(2);
}

export default function CajaContent({ cajaState, liveState, rankingState }) {
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
    resumen,
    loadCaja,
    abrirCaja,
    registrarPago,
    cerrarCaja,
  } = cajaState;
  const live = liveState;
  const ranking = rankingState;

  return (
    <div className="caja-page">
      <div className="caja-page__wrap">
        <div className="caja-page__hero">
          <div>
            <div className="caja-page__eyebrow">Control operativo</div>
            <h1 className="caja-page__title">Caja</h1>
            <p className="caja-page__subtitle">
              Apertura, cierre, pagos, movimientos y caja en vivo desde una sola vista.
            </p>
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
            <div className="caja-metrics">
              <div className="caja-card caja-metric">
                <div className="caja-metric__label">Estado</div>
                <div className="caja-metric__value caja-metric__value--status">
                  {caja.estado}
                </div>
              </div>

              <div className="caja-card caja-metric">
                <div className="caja-metric__label">Monto inicial</div>
                <div className="caja-metric__value">
                  $ {money(caja.monto_inicial)}
                </div>
              </div>

              <div className="caja-card caja-metric">
                <div className="caja-metric__label">Monto actual</div>
                <div className="caja-metric__value">
                  $ {money(caja.monto_actual)}
                </div>
              </div>

              <div className="caja-card caja-metric">
                <div className="caja-metric__label">Ventas registradas</div>
                <div className="caja-metric__value">
                  $ {money(resumen.ventas)}
                </div>
              </div>

              <div className="caja-card caja-metric">
                <div className="caja-metric__label">Pagos registrados</div>
                <div className="caja-metric__value">
                  $ {money(resumen.pagos)}
                </div>
              </div>

              <div className="caja-card caja-metric">
                <div className="caja-metric__label">Scanner en vivo</div>
                <div className="caja-metric__value caja-metric__value--status">
                  {live.connected ? "Conectado" : "Reconectando"}
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
                        Vista operativa del escaneo activo, integrada dentro de Caja.
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
                    <h2 className="caja-card__title">Movimientos</h2>

                    <button
                      type="button"
                      className="caja-btn caja-btn--ghost"
                      onClick={loadCaja}
                      disabled={busy}
                    >
                      Refrescar
                    </button>
                  </div>

                  {movimientos.length === 0 ? (
                    <div className="caja-page__muted">No hay movimientos todavia.</div>
                  ) : (
                    <div className="caja-movements">
                      {movimientos.map((mov) => {
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
                {canPay && (
                  <div className="caja-card">
                    <h2 className="caja-card__title">Registrar pago</h2>

                    <div className="caja-pay">
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

                <div className="caja-card caja-future-card">
                  <h2 className="caja-card__title">Ranking y resumen</h2>

                  {ranking.loading ? (
                    <div className="caja-page__muted">Cargando ranking...</div>
                  ) : ranking.data.length === 0 ? (
                    <div className="caja-page__muted">Sin datos de ranking por ahora.</div>
                  ) : (
                    <div className="ranking-list">
                      {ranking.data.slice(0, 5).map((it, index) => {
                        const isTop3 = index < 3;

                        return (
                          <div
                            key={it.producto_id}
                            className={`ranking-item ${isTop3 ? "ranking-item--top" : ""}`}
                          >
                            <div className="ranking-pos">
                              {index === 0 && "1"}
                              {index === 1 && "2"}
                              {index === 2 && "3"}
                              {index > 2 && index + 1}
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
                  )}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
