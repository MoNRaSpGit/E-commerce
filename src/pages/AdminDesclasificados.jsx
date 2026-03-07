import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

import { selectAuth, selectIsAuthed } from "../slices/authSlice";
import { useAdminDesclasificados } from "../features/desclasificados/useAdminDesclasificados";
import AdminDesclasificadosTable from "../features/desclasificados/AdminDesclasificadosTable";

import "../styles/productos.css";
import "../styles/adminDesclasificados.css";

export default function AdminDesclasificados() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const isAuthed = useSelector(selectIsAuthed);
    const { user } = useSelector(selectAuth);

    const { canSee, rows, loading, error, load } = useAdminDesclasificados({
        user,
        isAuthed,
        dispatch,
        navigate,
    });

    useEffect(() => {
        load();
    }, [load]);

    if (!canSee) {
        return (
            <div className="container py-4">
                <div className="op-card">
                    <p className="op-error">Sin permisos para ver este panel.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="productos-container">
            <div className="productos-sticky">
                <div className="productos-sticky-inner">
                    <div className="productos-sticky-top">
                        <div className="productos-sticky-title">Desclasificados</div>
                        <div className="productos-sticky-meta">
                            {!loading && <span>{rows.length} productos</span>}
                        </div>
                    </div>

                    <p className="op-muted mt2" style={{ marginTop: 8 }}>
                        Lista actual de productos con estado <b>desclasificado</b>.
                    </p>
                </div>
            </div>

            {loading ? (
                <p className="no-products">Cargando desclasificados…</p>
            ) : error ? (
                <p className="no-products">{error}</p>
            ) : rows.length === 0 ? (
                <p className="no-products">No hay productos desclasificados.</p>
            ) : (
                <div className="productos-grid">
                    <AdminDesclasificadosTable rows={rows} />
                </div>
            )}
        </div>
    );
}