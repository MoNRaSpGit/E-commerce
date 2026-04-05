import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useRanking } from "../features/ranking/useRanking";
import "../styles/ranking.css"; // 👈 IMPORTANTE

export default function AdminRanking() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");

    const { data, loading } = useRanking({ dispatch, navigate, desde, hasta });

    return (
        <div style={{ padding: 16 }}>
            <h1>Top productos más vendidos</h1>

            {/* filtros */}
            <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
                <input
                    type="date"
                    value={desde}
                    onChange={(e) => setDesde(e.target.value)}
                />
                <input
                    type="date"
                    value={hasta}
                    onChange={(e) => setHasta(e.target.value)}
                />
            </div>

            {loading && <div>Cargando...</div>}

            {!loading && data.length === 0 && <div>Sin datos</div>}

            <div className="ranking-list">
                {data.map((it, index) => {
                    const isTop3 = index < 3;

                    return (
                        <div
                            key={it.producto_id}
                            className={`ranking-item ${isTop3 ? "ranking-item--top" : ""}`}
                        >
                            <div className="ranking-pos">
                                {index === 0 && "🥇"}
                                {index === 1 && "🥈"}
                                {index === 2 && "🥉"}
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

                            <div className="ranking-qty">
                                {it.total_vendido}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}