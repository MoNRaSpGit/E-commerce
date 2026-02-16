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

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
        reader.onload = () => resolve(String(reader.result || ""));
        reader.readAsDataURL(file);
    });
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

    const [editHasImage, setEditHasImage] = useState(false);

    const [editImgFile, setEditImgFile] = useState(null);
    const [editImgPreview, setEditImgPreview] = useState("");     // dataURL para previsualizar
    const [editImgBase64, setEditImgBase64] = useState("");       // lo que mandamos al backend
    const [removeImage, setRemoveImage] = useState(false);        // opcional: borrar imagen
    const [imgTick, setImgTick] = useState(0);                    // cache bust para /image


    const nameRef = useRef(null);



    const fileRef = useRef(null);

    const load = async () => {
        setLoading(true);
        try {
            const r = await apiFetch(
                `/api/op999/productos?solo_con_barcode=1&price_eq=999`,
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
        setEditHasImage(!!p.has_image);

        // reset imagen
        setEditImgFile(null);
        setEditImgPreview("");
        setEditImgBase64("");
        setRemoveImage(false);

        setEditOpen(true);
        requestAnimationFrame(() => nameRef.current?.focus?.());
    };


    const closeEdit = () => {
        if (editSaving) return;
        setEditOpen(false);
        setEditId(null);
        setEditName("");
        setEditPrice("");


        setEditImgFile(null);
        setEditImgPreview("");
        setEditImgBase64("");
        setRemoveImage(false);

    };

    const onPickImage = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // validaciones simples
        const okType = ["image/png", "image/jpeg", "image/webp"].includes(file.type);
        if (!okType) {
            toast.error("Formato inválido. Usá PNG/JPG/WEBP.");
            e.target.value = "";
            return;
        }

        // ojo con tamaño (base64 crece). Ajustá si querés.
        const maxBytes = 900 * 1024; // 900 KB
        if (file.size > maxBytes) {
            toast.error("Imagen muy pesada. Probá una más liviana (<= 900KB).");
            e.target.value = "";
            return;
        }

        try {
            const dataUrl = await readFileAsDataURL(file);

            setEditImgFile(file);
            setEditImgPreview(dataUrl);
            setEditImgBase64(dataUrl);

            // si el user marca “borrar”, al subir nueva imagen lo desmarcamos
            setRemoveImage(false);
        } catch (err) {
            toast.error(err?.message || "No se pudo cargar la imagen");
        } finally {
            // permite elegir la misma imagen otra vez
            e.target.value = "";
        }
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
            const payload = { name, price, status: "activo" };

            // si marcó borrar, mandamos image vacío (tu backend decide si lo interpreta como null)
            if (removeImage) payload.image = "";

            // si eligió imagen, la mandamos (dataURL base64)
            if (editImgBase64) payload.image = editImgBase64;

            const r = await apiFetch(
                `/api/op999/productos/${id}`,
                {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                },
                { dispatch, navigate }
            );


            // ✅ si eligió imagen, la subimos aparte (multipart)


            const data = await r.json().catch(() => null);

            if (!r.ok || !data?.ok) {
                toast.error(data?.error || "No se pudo guardar");
                return;
            }

            toast.success("Actualizado ✅");

            // ✅ actualiza lista local:
            const nextHasImage = removeImage ? 0 : (editImgBase64 ? 1 : undefined);

            setRows((prev) =>
                prev
                    .map((x) => {
                        if (x.id !== id) return x;

                        const updated = {
                            ...x,
                            name,
                            price,
                            status: "activo",
                            ...(typeof nextHasImage === "number" ? { has_image: nextHasImage } : {}),
                        };

                        return updated;
                    })
                    .filter((x) => {
                        const p999 = Number(x.price) === 999;
                        const sinImg = Number(x.has_image) === 0;
                        const pendiente = String(x.status || "") === "pendiente";
                        return p999 || sinImg || pendiente;
                    })
            );


            // cache bust para que /image muestre lo nuevo
            setImgTick((t) => t + 1);


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
                                    <img src={`${import.meta.env.VITE_API_URL}/api/op999/productos/${p.id}/image?tick=${imgTick}`} />

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

                        <div className="oper-modal__field">
                            <label className="oper-modal__label">Imagen</label>

                            <input
                                ref={fileRef}
                                className="oper-modal__input"
                                type="file"
                                accept="image/*"
                                onChange={onPickImage}
                            />

                            {/* Preview */}
                            <div style={{ marginTop: 10 }}>
                                {editImgPreview ? (
                                    <img
                                        src={editImgPreview}
                                        alt="Preview"
                                        style={{
                                            width: "100%",
                                            maxHeight: 220,
                                            objectFit: "cover",
                                            borderRadius: 12,
                                            border: "1px solid rgba(0,0,0,0.12)",
                                        }}
                                    />
                                ) : editHasImage && editId ? (
                                    <img
                                        src={`${import.meta.env.VITE_API_URL}/api/op999/productos/${editId}/image?tick=${imgTick}`}
                                        alt="Actual"

                                        style={{
                                            width: "100%",
                                            maxHeight: 220,
                                            objectFit: "cover",
                                            borderRadius: 12,
                                            borderRadius: 12,
                                            border: "1px solid rgba(0,0,0,0.12)",
                                        }}
                                    />
                                ) : (
                                    <div style={{ opacity: 0.7, fontSize: 14 }}>
                                        No hay imagen.
                                    </div>
                                )}

                            </div>
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
