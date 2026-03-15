function money(n) {
  return Number(n || 0).toFixed(2);
}

export default function CajaContent({ cajaState }) {
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

  return (
    <div className="caja-page">
      <div className="caja-page__wrap">
        <div className="caja-page__hero">
          <div>
            <div className="caja-page__eyebrow">Control operativo</div>
            <h1 className="caja-page__title">Caja</h1>
            <p className="caja-page__subtitle">
              Apertura, cierre, ventas automáticas y registro manual de pagos.
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
                <div className="caja-metric__label">Pagos registrados</div>
                <div className="caja-metric__value">
                  $ {money(resumen.pagos)}
                </div>
              </div>
            </div>

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
                    placeholder="Descripción del pago"
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
            )}

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
                <div className="caja-page__muted">No hay movimientos todavía.</div>
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
                            {mov.descripcion || "Sin descripción"}
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
          </>
        )}
      </div>
    </div>
  );
}