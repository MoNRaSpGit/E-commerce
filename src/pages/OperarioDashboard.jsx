import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import VentasChart from "../components/VentasChart";

import TopProductosBar from "../components/TopProductosBar";
import "../styles/topProductosBar.css";
import "../styles/operarioDashboard.css";

import {
    fetchTopProducts,
    fetchAnalyticsSummary,
    selectTopProducts,
    selectTopStatus,
    selectTopError,
    selectSummary,
    selectSummaryStatus,
} from "../slices/analyticsSlice";

export default function OperarioDashboard() {
    const dispatch = useDispatch();

    const [days, setDays] = useState(7);

    const top = useSelector(selectTopProducts);
    const topStatus = useSelector(selectTopStatus);
    const topError = useSelector(selectTopError);

    const summary = useSelector(selectSummary);
    const summaryStatus = useSelector(selectSummaryStatus);

    useEffect(() => {
        dispatch(fetchTopProducts({ days, limit: 10 }));
        dispatch(fetchAnalyticsSummary({ days }));
    }, [dispatch, days]);

    if (topStatus === "loading" || summaryStatus === "loading") {
        return (
            <div className="container py-4">
                <h1 className="dash-title">Dashboard</h1>
                <p>Cargando métricas…</p>
            </div>
        );
    }

    if (topStatus === "failed") {
        return (
            <div className="container py-4">
                <h1 className="dash-title">Dashboard</h1>
                <p className="dash-error">{topError || "Error cargando métricas"}</p>
                <button
                    onClick={() => {
                        dispatch(fetchTopProducts({ days, limit: 10 }));
                        dispatch(fetchAnalyticsSummary({ days }));
                    }}
                >
                    Reintentar
                </button>
            </div>
        );
    }

    const pct = summary?.diff?.unidadesPct;

    return (
        <div className="container py-4">
            <h1 className="dash-title">Dashboard</h1>

            {/* Selector de rango */}
            <div className="dash-range">
                <button onClick={() => setDays(7)} disabled={days === 7}>
                    7 días
                </button>
                <button onClick={() => setDays(30)} disabled={days === 30}>
                    30 días
                </button>
            </div>

            {/* Summary */}
            {summary && (
                <div className="dash-card">
                    <p>
                        <b>Unidades vendidas:</b> {summary.current.unidadesTotales}
                    </p>
                    <p>
                        <b>Pedidos:</b> {summary.current.pedidosTotales}
                    </p>
                    <p>
                        <b>Ingresos:</b> ${summary.current.ingresosTotales}
                    </p>

                    {pct !== null && pct !== undefined && (
                        <p>
                            Semana anterior:{" "}
                            <b className={pct >= 0 ? "dash-pct-up" : "dash-pct-down"}>
                                {Number(pct).toFixed(1)}%
                            </b>
                        </p>
                    )}
                </div>
            )}

            {/* Chart */}
            <div className="dash-card">
                <h2 className="dash-h2">Ventas últimos días</h2>

                {pct !== null && pct !== undefined && (
                    <div className="dash-badge">
                        <span className={pct >= 0 ? "dash-pct-up" : "dash-pct-down"}>
                            {pct >= 0 ? "▲" : "▼"} {Number(pct).toFixed(1)}% vs período anterior
                        </span>
                    </div>
                )}

                <p className="dash-note">(Demo) Datos simulados por ahora</p>

                <div className="dash-chart">
                    <VentasChart />
                </div>
            </div>

            {/* Top 10 */}
            <div className="dash-card">
                <h2 className="dash-h2">Top 10 productos más vendidos</h2>
                <TopProductosBar items={top} />
            </div>
        </div>
    );
}
