import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "../services/apiFetch";
import { selectAuth, selectIsAuthed } from "../slices/authSlice";

import "../styles/operarioEscaneo.css"; // reutilizamos estilos base si te sirve

function money(n) {
    const x = Number(n || 0);
    return x.toFixed(2);
}

function fmtDate(s) {
    if (!s) return "";
    try {
        const d = new Date(s);
        return d.toLocaleString("es-UY");
    } catch {
        return String(s);
    }
}

const imgCache = new Map(); // productoId -> dataUrl


function normalizeImage(image) {
    if (!image) return null;
    const s = String(image).trim();
    if (!s) return null;
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    if (s.startsWith("data:image/")) return s;
    return `data:image/jpeg;base64,${s}`;
}

export default function OperarioParaActualizar() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const isAuthed = useSelector(selectIsAuthed);
    const { accessToken } = useSelector(selectAuth);

    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [items, setItems] = useState([]);

    const [editOpen, setEditOpen] = useState(false);
    const [editItem, setEditItem] = useState(null); // item seleccionado (x)
    const [editName, setEditName] = useState("");
    const [editPrice, setEditPrice] = useState("");


    const fetchImageIfNeeded = async (productoId) => {
        const key = String(productoId);
        const cached = imgCache.get(key);
        if (cached) return cached;

        try {
            const r = await apiFetch(
                `/api/productos/${productoId}/image`,
                { method: "GET" },
                { auth: false }
            );

            const data = await r.json().catch(() => null);
            const img = normalizeImage(data?.data?.image);

            if (!r.ok || !data?.ok || !img) return null;

            imgCache.set(key, img);
            return img;
        } catch {
            return null;
        }
    };


    const fetchList = async () => {
        setError("");
        setStatus("loading");
        try {
            const r = await apiFetch(
                `/api/actualizacion?estado=pendiente`,
                { method: "GET" },
                { dispatch, navigate }
            );

            const data = await r.json().catch(() => null);

            if (!r.ok || !data?.ok) {
                setError(data?.error || "Error al cargar");
                setItems([]);
                setStatus("failed");
                return;
            }

            const base = Array.isArray(data.data) ? data.data : [];
            setItems(base.map((x) => ({ ...x, imageDataUrl: null })));

            setStatus("success");
        } catch (e) {
            setError(e?.message || "Error al cargar");
            setItems([]);
            setStatus("failed");
        }
    };

    useEffect(() => {
        if (!isAuthed || !accessToken) return;
        fetchList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthed, accessToken]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            for (const x of items) {
                if (cancelled) return;

                const id = Number(x.producto_id);
                const hasImg = Boolean(x.has_image);

                if (!id || !hasImg) continue;
                if (x.imageDataUrl) continue;

                const url = await fetchImageIfNeeded(id);
                if (!url || cancelled) continue;

                setItems((prev) =>
                    prev.map((p) => (Number(p.producto_id) === id ? { ...p, imageDataUrl: url } : p))
                );
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items]);


    const openEdit = (x) => {
        setEditItem(x);
        setEditName(String(x?.name ?? ""));
        setEditPrice(String(x?.price ?? ""));
        setEditOpen(true);
    };


    const confirm = async (productoId) => {
        try {
            const r = await apiFetch(
                `/api/actualizacion/${productoId}/confirmar`,
                { method: "POST" },
                { dispatch, navigate }
            );
            const data = await r.json().catch(() => null);

            if (!r.ok || !data?.ok) {
                toast.error(data?.error || "No se pudo confirmar");
                return;
            }

            toast.success("Marcado como actualizado");
            // refresco simple
            await fetchList();
        } catch (e) {
            toast.error(e?.message || "No se pudo confirmar");
        }
    };

    const saveEdit = async () => {
        if (!editItem) return;

        const productoId = Number(editItem.producto_id);
        const name = String(editName || "").trim();
        const price = Number(editPrice);

        if (!name || name.length < 2) {
            toast.error("Nombre inválido");
            return;
        }
        if (!Number.isFinite(price) || price < 0) {
            toast.error("Precio inválido");
            return;
        }

        try {
            const r = await apiFetch(
                `/api/productos/${productoId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, price }),
                },
                { dispatch, navigate }
            );

            const data = await r.json().catch(() => null);

            if (!r.ok || !data?.ok) {
                toast.error(data?.error || "No se pudo guardar");
                return;
            }

            toast.success("Producto actualizado en la base ✅");

            // refrescamos la lista para ver nuevo nombre/precio
            await fetchList();

            setEditOpen(false);
            setEditItem(null);
        } catch (e) {
            toast.error(e?.message || "No se pudo guardar");
        }
    };


    return (
        <div className="container py-4 oper-scan">
            <div className="oper-scan__header">
                <h1>Para actualizar</h1>
                <p className="oper-scan__hint">
                    Lista de productos marcados para actualizar (precio / foto / nombre).
                </p>
            </div>

            {status === "loading" && <p>Cargando…</p>}

            {status === "failed" && (
                <>
                    <p style={{ color: "#b00020" }}>{error || "Error"}</p>
                    <button className="oper-scan__btn" type="button" onClick={fetchList}>
                        Reintentar
                    </button>
                </>
            )}

            {status === "success" && items.length === 0 && (
                <p>No hay productos pendientes para actualizar.</p>
            )}

            {status === "success" && items.length > 0 && (
                <div className="oper-scan__list">
                    {items.map((x) => {
                        const imgSrc = x?.imageDataUrl || null;


                        return (
                            <div key={x.producto_id} className="oper-scan__row">
                                <div className="oper-scan__img">
                                    {imgSrc ? <img src={imgSrc} alt={x.name} /> : <div className="oper-scan__imgph" />}
                                </div>

                                <div className="oper-scan__info">
                                    <div className="oper-scan__name">{x.name}</div>
                                    <div className="oper-scan__meta">
                                        $ {money(x.price)} — Stock: {Number(x.stock ?? 0)}
                                    </div>
                                    <div className="oper-scan__meta">
                                        Marcado: {fmtDate(x.marcado_at)} {x.nota ? `— ${x.nota}` : ""}
                                    </div>
                                </div>

                                <button
                                    className="oper-scan__upd"
                                    type="button"
                                    onClick={() => openEdit(x)}
                                >
                                    Editar
                                </button>

                                <button
                                    className="oper-scan__upd"
                                    type="button"
                                    onClick={() => confirm(x.producto_id)}
                                >
                                    Actualizado
                                </button>

                            </div>
                        );
                    })}
                </div>
            )}


            {editOpen && (
                <div className="oper-modal__backdrop" onClick={() => setEditOpen(false)}>
                    <div className="oper-modal__card" onMouseDown={(e) => e.stopPropagation()}>
                        <h2 className="oper-modal__title">Editar producto</h2>

                        <div className="oper-modal__field">
                            <label className="oper-modal__label">Nombre</label>
                            <input
                                className="oper-modal__input"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                autoFocus
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
                            <button
                                type="button"
                                className="oper-modal__btn"
                                onClick={() => {
                                    setEditOpen(false);
                                    setEditItem(null);
                                }}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="oper-modal__btn oper-modal__btn--primary"
                                onClick={saveEdit}
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
