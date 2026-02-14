import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { apiFetch } from "../services/apiFetch";
import { selectAuth } from "../slices/authSlice";

import "../styles/operarioEscaneo.css"; // reusamos look
import "../styles/operarioPrecio999.css";


function money(n) {
    const x = Number(n || 0);
    return x.toFixed(2);
}

export default function OperarioPrecio999() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { accessToken } = useSelector(selectAuth);

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);

    // modal edit
    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editPrice, setEditPrice] = useState("");
    const [editSaving, setEditSaving] = useState(false);

    const nameRef = useRef(null);

    const load = async () => {
        setLoading(true);
        try {
            const r = await apiFetch(
                `/api/productos/admin?solo_con_barcode=1&price_eq=999`,
                { method: "GET" },
                { dispatch, navigate }
            );
            const data = await r.json().catch(() => null);

            if (!r.ok || !data?.ok) {
                toast.error(data?.error || "No se pudo cargar la lista");
                return;
            }

            setRows(Array.isArray(data.data) ? data.data : []);
        } catch (e) {
            toast.error(e?.message || "No se pudo cargar la lista");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!accessToken) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken]);

    const openEdit = (p) => {
        setEditId(Number(p.id));
        setEditName(String(p.name || ""));
        setEditPrice(String(p.price ?? ""));
        setEditOpen(true);

        requestAnimationFrame(() => nameRef.current?.focus?.());
    };

    const closeEdit = () => {
        if (editSaving) return;
        setEditOpen(false);
        setEditId(null);
        setEditName("");
        setEditPrice("");
    };

    const saveEdit = async () => {
        const id = Number(editId);
        const name = String(editName || "").trim();
        const price = Number(String(editPrice || "").replace(",", "."));

        if (!id) return;
        if (name.length < 2) return toast.error("Nombre requerido");
        if (!Number.isFinite(price) || price < 0) return toast.error("Precio inválido");

        setEditSaving(true);
        try {
            const r = await apiFetch(
                `/api/productos/${id}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ name, price }),
                },
                { dispatch, navigate }
            );
            const data = await r.json().catch(() => null);

            if (!r.ok || !data?.ok) {
                toast.error(data?.error || "No se pudo guardar");
                return;
            }

            toast.success("Actualizado ✅");

            // ✅ actualiza lista local:
            setRows((prev) =>
                prev
                    .map((x) => (x.id === id ? { ...x, name, price } : x))
                    // si el precio deja de ser 999, lo sacamos de esta lista
                    .filter((x) => Number(x.price) === 999)
            );

            closeEdit();
        } catch (e) {
            toast.error(e?.message || "No se pudo guardar");
        } finally {
            setEditSaving(false);
        }
    };

    const count = useMemo(() => rows.length, [rows]);

    return (
        <div className="container py-4 oper-scan">
            <div className="oper-scan__header">
                <h1>Precio 999</h1>
                <p className="oper-scan__hint">
                    Productos con <strong>barcode</strong> y <strong>precio = 999</strong>. ({count})
                </p>
            </div>

            <div className="oper-scan__scanbox">
                <button className="oper-scan__btn" type="button" onClick={load} disabled={loading}>
                    {loading ? "Cargando…" : "Refrescar"}
                </button>
            </div>

            <div className="op999-grid">
                {loading ? (
                    <p className="oper-scan__empty">Cargando…</p>
                ) : rows.length === 0 ? (
                    <p className="oper-scan__empty">No hay productos con precio 999.</p>
                ) : (
                    rows.map((p) => (
                        <div key={p.id} className="op999-card">
                            <div className="op999-imgwrap">
                                {p.has_image ? (
                                    <img src={`/api/productos/${p.id}/image`} alt={p.name} />
                                ) : (
                                    <div className="op999-noimg">Sin imagen</div>
                                )}
                            </div>

                            <div className="op999-name">{p.name}</div>
                            <div className="op999-price">$ {money(p.price)}</div>

                            <div className="op999-actions">
                                <button type="button" className="op999-btn" onClick={() => openEdit(p)}>
                                    Editar
                                </button>
                            </div>
                        </div>
                    ))

                )}
            </div>

            {editOpen && (
                <div className="oper-modal__backdrop" onMouseDown={closeEdit}>
                    <div className="oper-modal__card" onMouseDown={(e) => e.stopPropagation()}>
                        <h2 className="oper-modal__title">Editar producto</h2>

                        <div className="oper-modal__field">
                            <label className="oper-modal__label">Nombre</label>
                            <input
                                ref={nameRef}
                                className="oper-modal__input"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                        </div>

                        <div className="oper-modal__field">
                            <label className="oper-modal__label">Precio</label>
                            <input
                                className="oper-modal__input"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                inputMode="decimal"
                            />
                        </div>

                        <div className="oper-modal__actions">
                            <button className="oper-modal__btn" type="button" disabled={editSaving} onClick={closeEdit}>
                                Cancelar
                            </button>
                            <button
                                className="oper-modal__btn oper-modal__btn--primary"
                                type="button"
                                disabled={editSaving}
                                onClick={saveEdit}
                            >
                                {editSaving ? "Guardando…" : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
