import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { useOperarioEscaneo } from "../features/escaneo/useOperarioEscaneo";
import { money } from "../features/escaneo/scanFormat";
import ManualCategoryButtons from "../features/escaneo/ManualCategoryButtons";
import "../styles/operarioEscaneo.css";

function formatMs(value) {
    if (value == null) return "Sin datos";
    return `${Math.max(1, Math.round(Number(value)))} ms`;
}

export default function OperarioEscaneo() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // accessToken hoy no es necesario para el escáner (lo dejé por compatibilidad del hook)
    const raw = localStorage.getItem("eco_auth");
    const stored = raw ? JSON.parse(raw) : null;
    const accessToken = stored?.accessToken || null;

    const esc = useOperarioEscaneo({ dispatch, navigate });





    return (
        <div style={{ padding: 16 }}>


            {/* Scan barcode */}
            <div className="oper-scan__scanbox">
                <input
                    ref={esc.inputRef}
                    className="oper-scan__input"
                    value={esc.code}
                    onChange={(e) => esc.setCode(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            esc.onScanEnter({ rawCode: e.currentTarget.value });
                        }
                    }}
                    placeholder="Código de barra…"
                    autoComplete="off"
                    inputMode="none"



                />


            </div>

            {!!esc.msg && <div className="oper-scan__msg">{esc.msg}</div>}

            <div
                style={{
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    marginBottom: 16,
                }}
            >
                <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 12, background: "#fff" }}>
                    <div style={{ fontSize: 12, color: "#666" }}>Ultimo barcode</div>
                    <div style={{ fontWeight: 700 }}>{esc.metrics.lastBarcode || "-"}</div>
                </div>
                <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 12, background: "#fff" }}>
                    <div style={{ fontSize: 12, color: "#666" }}>Producto visible</div>
                    <div style={{ fontWeight: 700 }}>
                        {formatMs(esc.metrics.lastDurationMs)}
                    </div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                        {esc.metrics.lastSource || "Sin origen"}
                    </div>
                </div>
                <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 12, background: "#fff" }}>
                    <div style={{ fontSize: 12, color: "#666" }}>Imagen</div>
                    <div style={{ fontWeight: 700 }}>
                        {esc.metrics.lastImageDurationMs == null ? "Pendiente/sin imagen" : formatMs(esc.metrics.lastImageDurationMs)}
                    </div>
                </div>
                <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 12, background: "#fff" }}>
                    <div style={{ fontSize: 12, color: "#666" }}>Cobrar total</div>
                    <div style={{ fontWeight: 700 }}>
                        {esc.payMetrics.totalDurationMs == null ? "Sin datos" : formatMs(esc.payMetrics.totalDurationMs)}
                    </div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                        close {esc.payMetrics.closeDurationMs == null ? "-" : formatMs(esc.payMetrics.closeDurationMs)} | clear {esc.payMetrics.clearDurationMs == null ? "-" : formatMs(esc.payMetrics.clearDurationMs)}
                    </div>
                </div>
            </div>


            <ManualCategoryButtons
                onAdd={({ label, price }) => esc.addManualItem({ label, price })}
                onAfterAdd={esc.focusScan}
            />


            {/* Lista */}
            <div className="oper-section">
                <div className="oper-section__title">PRODUCTOS</div>

                <div className="oper-scan__list">
                    {esc.items.map((it, index) => {
                        const subtotal = Number(it.price || 0) * Number(it.qty || 0);

                        return (
                            <div
                                key={it.id}
                                className={`oper-scan__row ${index === esc.items.length - 1 ? "oper-scan__row--last" : ""}`}
                            >
                                <div className="oper-scan__img">
                                    {it.imageDataUrl ? (
                                        <img src={it.imageDataUrl} alt={it.name} />
                                    ) : (
                                        <div className="oper-scan__imgph" />
                                    )}
                                </div>

                                <div className="oper-scan__info">
                                    <div className="oper-scan__name">{it.name}</div>
                                    <div className="oper-scan__meta">$ {money(it.price)} c/u</div>

                                    {Number(it.id) > 0 && (
                                        <button
                                            type="button"
                                            className="oper-scan__update"
                                            onClick={() => esc.openEditModal(it)}
                                            title="Actualizar producto"
                                        >
                                            Actualizar
                                        </button>
                                    )}
                                </div>

                                <div className="oper-scan__qty">
                                    Cant: {it.qty || 0}
                                </div>

                                <div className="oper-scan__sub">$ {money(subtotal)}</div>

                                {/* ✕ resta 1 y borra en 0 */}
                                <button
                                    type="button"
                                    className="oper-scan__rm oper-scan__rm--danger"
                                    onClick={() => esc.removeItem(it.id)}
                                    title="Restar 1"
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Total */}
            {esc.items.length > 0 && (
                <div className="oper-scan__total">
                    <div>Total</div>
                    <div className="oper-scan__totalval">$ {money(esc.total)}</div>
                </div>
            )}

            {esc.items.length > 0 && (
                <button type="button" className="oper-scan__pay" onClick={esc.onPagar} disabled={esc.payLoading}>
                    {esc.payLoading ? "Cobrando..." : "Cobrar"}
                </button>
            )}

            {esc.payOpen && (
                <div
                    className="oper-modal__backdrop"
                    onMouseDown={esc.cancelPagar}
                >
                    <div className="oper-modal__card" onMouseDown={(e) => e.stopPropagation()}>
                        <h2 className="oper-modal__title">Confirmar cobro</h2>

                        <div className="oper-modal__field">
                            <label className="oper-modal__label">Total a cobrar</label>
                            <div className="oper-scan__payPreview">$ {money(esc.total)}</div>
                        </div>

                        <div className="oper-modal__actions">
                            <button
                                type="button"
                                className="oper-modal__btn"
                                onClick={esc.cancelPagar}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="oper-modal__btn oper-modal__btn--primary"
                                onClick={esc.confirmPagar}
                                disabled={esc.payLoading}
                            >
                                {esc.payLoading ? "Procesando..." : "Confirmar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Otros  -> crear */}
            {esc.nfOpen && (
                <div
                    className="oper-modal__backdrop"
                    onMouseDown={() => {
                        esc.setNfOpen(false);
                        esc.focusScan();
                    }}
                >
                    <div className="oper-modal__card" onMouseDown={(e) => e.stopPropagation()}>
                        <h2 className="oper-modal__title">Ingrese el precio</h2>



                        { /* <div className="oper-modal__field">
                            <label className="oper-modal__label">Nombre</label>
                            <input
                                ref={esc.nfNameRef}
                                className="oper-modal__input"
                                value={esc.nfName}
                                onChange={(e) => esc.setNfName(e.target.value)}
                                autoComplete="off"
                            />
                        </div>*/}

                        <div className="oper-modal__field">
                            <label className="oper-modal__label">Precio</label>
                            <input
                                ref={esc.nfNameRef}
                                className="oper-modal__input"
                                value={esc.nfPrice}
                                onChange={(e) => esc.setNfPrice(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        esc.saveNotFound();
                                    }
                                }}
                                autoComplete="off"
                                inputMode="decimal"
                            />
                        </div>

                        <div className="oper-modal__actions">
                            <button
                                type="button"
                                className="oper-modal__btn"
                                onClick={() => {
                                    esc.setNfOpen(false);
                                    esc.focusScan();
                                }}
                                disabled={esc.nfSaving}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="oper-modal__btn oper-modal__btn--primary"
                                onClick={esc.saveNotFound}
                                disabled={esc.nfSaving}
                            >
                                {esc.nfSaving ? "Guardando…" : "Crear"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: editar producto */}
            {esc.edOpen && (
                <div
                    className="oper-modal__backdrop"
                    onMouseDown={() => {
                        esc.setEdOpen(false);
                        esc.focusScan();
                    }}
                >
                    <div className="oper-modal__card" onMouseDown={(e) => e.stopPropagation()}>
                        <h2 className="oper-modal__title">Actualizar producto</h2>

                        <div className="oper-modal__field">
                            <label className="oper-modal__label">Nombre</label>
                            <input
                                className="oper-modal__input"
                                value={esc.edName}
                                onChange={(e) => esc.setEdName(e.target.value)}
                                autoComplete="off"
                            />
                        </div>

                        <div className="oper-modal__field">
                            <label className="oper-modal__label">Precio</label>
                            <input
                                className="oper-modal__input"
                                value={esc.edPrice}
                                onChange={(e) => esc.setEdPrice(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        esc.saveEdit();
                                    }
                                }}
                                autoComplete="off"
                                inputMode="decimal"
                            />
                        </div>

                        <div className="oper-modal__actions">
                            <button
                                type="button"
                                className="oper-modal__btn"
                                onClick={() => {
                                    esc.setEdOpen(false);
                                    esc.focusScan();
                                }}
                                disabled={esc.edSaving}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="oper-modal__btn oper-modal__btn--primary"
                                onClick={esc.saveEdit}
                                disabled={esc.edSaving}
                            >
                                {esc.edSaving ? "Guardando…" : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
