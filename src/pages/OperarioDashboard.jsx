import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import TopProductosBar from "../components/TopProductosBar";
import "../styles/topProductosBar.css";


import {
    fetchTopProducts,
    fetchAnalyticsSummary,
    selectTopProducts,
    selectTopStatus,
    selectTopError,
    selectSummary,
    selectSummaryStatus,
} from "../slices/analyticsSlice";

import { selectAuth, selectIsAuthed } from "../slices/authSlice";

export default function OperarioDashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [days, setDays] = useState(7);

    const top = useSelector(selectTopProducts);
    const topStatus = useSelector(selectTopStatus);
    const topError = useSelector(selectTopError);

    const summary = useSelector(selectSummary);
    const summaryStatus = useSelector(selectSummaryStatus);

    const isAuthed = useSelector(selectIsAuthed);
    const { accessToken } = useSelector(selectAuth);

    const authDispatch = useDispatch();

    useEffect(() => {
        dispatch(fetchTopProducts({ days, limit: 10 }));
        dispatch(fetchAnalyticsSummary({ days }));
    }, [dispatch, days]);

    if (topStatus === "loading" || summaryStatus === "loading") {
        return (
            <div className="container py-4">
                <h1>Dashboard</h1>
                <p>Cargando métricas…</p>
            </div>
        );
    }

    if (topStatus === "failed") {
        return (
            <div className="container py-4">
                <h1>Dashboard</h1>
                <p style={{ color: "red" }}>{topError || "Error cargando métricas"}</p>
                <button onClick={() => {
                    dispatch(fetchTopProducts({ days, limit: 10 }));
                    dispatch(fetchAnalyticsSummary({ days }));
                }}>
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <h1>Dashboard</h1>

            {/* Selector de rango */}
            <div style={{ marginBottom: 16 }}>
                <button onClick={() => setDays(7)} disabled={days === 7}>7 días</button>
                <button onClick={() => setDays(30)} disabled={days === 30} style={{ marginLeft: 8 }}>30 días</button>
            </div>

            {/* Summary */}
            {summary && (
                <div style={{ marginBottom: 20 }}>
                    <p><b>Unidades vendidas:</b> {summary.current.unidadesTotales}</p>
                    <p><b>Pedidos:</b> {summary.current.pedidosTotales}</p>
                    <p><b>Ingresos:</b> ${summary.current.ingresosTotales}</p>

                    {summary.diff.unidadesPct !== null && (
                        <p>
                            Semana anterior:{" "}
                            <b style={{ color: summary.diff.unidadesPct >= 0 ? "green" : "red" }}>
                                {summary.diff.unidadesPct.toFixed(1)}%
                            </b>
                        </p>
                    )}
                </div>
            )}

            {/* Acá después metemos el Top 10 visual */}
            <h2>Top 10 productos más vendidos</h2>
            <TopProductosBar items={top} />
        </div>
    );
}
