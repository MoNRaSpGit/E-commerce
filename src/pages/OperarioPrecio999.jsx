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

function fmtDateFull(s) {
    if (!s) return "Sin fecha";
    try {
        const d = new Date(s);
        return d.toLocaleString("es-UY", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return String(s);
    }
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
    const [search, setSearch] = useState("");

    // modal edit
    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editPrice, setEditPrice] = useState("");
    const [editPriceOriginal, setEditPriceOriginal] = useState("");
    const [percent, setPercent] = useState(30); // default global
    const [editSaving, setEditSaving] = useState(false);
    const [editCategoria, setEditCategoria] = useState("");
    const [editSubcategoria, setEditSubcategoria] = useState("");
    const [catTouched, setCatTouched] = useState(false);
    const [subTouched, setSubTouched] = useState(false);

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
                `/api/op999/productos?solo_con_barcode=1`,
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
        setEditPriceOriginal(String(p.priceOriginal ?? ""));
        setEditCategoria(String(p.categoria || ""));
        setEditSubcategoria(String(p.subcategoria || ""));
        setCatTouched(false);
        setSubTouched(false);
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
        setEditPriceOriginal("");


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
        const price = calcFinalPrice();
        const priceOriginal = Number(String(editPriceOriginal || "").replace(",", "."));

        if (!id) return;
        if (name.length < 2) return toast.error("Nombre requerido");
        if (!Number.isFinite(price) || price < 0) return toast.error("Precio inválido");

        setEditSaving(true);
        try {
            const payload = {
                name,
                price,
                priceOriginal,
                status: "activo",
            };

            const requiereSubLocal =
                editCategoria === "bebidas" ||
                editCategoria === "mascotas" ||
                editCategoria === "helados";
            // ✅ Solo enviamos categoria/subcategoria si el usuario las tocó
            if (catTouched) {
                payload.categoria = editCategoria ? editCategoria : null;

                if (!requiereSubLocal) {
                    payload.subcategoria = null;
                }
            }

            if (subTouched) {
                payload.subcategoria = requiereSubLocal
                    ? (editSubcategoria ? editSubcategoria : null)
                    : null;
            }

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
                            ...(catTouched ? { categoria: editCategoria || null } : {}),
                            ...((subTouched || catTouched) ? { subcategoria: editSubcategoria || null } : {}),
                        };

                        return updated;
                    })
                    .filter((x) => {
                        const tieneBarcode = String(x.barcode || "").trim().length > 0;
                        return tieneBarcode;
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

    const onDesclasificar = async (p) => {
        const id = Number(p?.id);
        if (!id) return;

        const ok = window.confirm(
            `¿Desclasificar este producto?\n\n${String(p?.name || "").trim() || "(sin nombre)"}\n\nEsto lo saca del catálogo y lo guarda en eco_desclasificados.`
        );
        if (!ok) return;

        try {
            const r = await apiFetch(
                `/api/desclasificados/${id}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ motivo: "Desclasificado desde Precio 999" }),
                },
                { dispatch, navigate }
            );

            const data = await r.json().catch(() => null);

            if (!r.ok || !data?.ok) {
                toast.error(data?.error || "No se pudo desclasificar");
                return;
            }

            toast.success("Desclasificado ✅");

            // lo sacamos de la lista local
            setRows((prev) => prev.filter((x) => Number(x.id) !== id));

            // si justo estaba abierto en el modal, lo cerramos
            if (Number(editId) === id) closeEdit();
        } catch (e) {
            toast.error(e?.message || "No se pudo desclasificar");
        }
    };

    const filteredRows = useMemo(() => {
        const q = String(search || "").trim().toLowerCase();
        if (!q) return rows;

        return rows.filter((p) =>
            String(p.name || "").toLowerCase().includes(q)
        );
    }, [rows, search]);

    const count = filteredRows.length;

    const categorias = useMemo(
        () => [
            { value: "bebidas", label: "Bebidas" },
            { value: "almacen", label: "Almacén" },
            { value: "snacks", label: "Snacks" },
            { value: "cigarros", label: "Cigarros" },
            { value: "yerba", label: "Yerba" },
            { value: "galletitas", label: "Galletitas" },
            { value: "golosinas", label: "Golosinas" },
            { value: "congelados", label: "Congelados" },
            { value: "helados", label: "Helados" },
            { value: "lacteos", label: "Lácteos" },
            { value: "fiambres", label: "Fiambres" },
            { value: "panaderia", label: "Panadería" },
            { value: "limpieza", label: "Limpieza" },
            { value: "higiene_y_cuidados", label: "Higiene y cuidados" },
            { value: "medicamentos", label: "Medicamentos" },
            { value: "mascotas", label: "Mascotas" },
            { value: "otros", label: "Otros" },
        ],
        []
    );

    const subcategorias = useMemo(
        () => ({
            bebidas: [
                { value: "con_alcohol", label: "Con alcohol" },
                { value: "sin_alcohol", label: "Sin alcohol" },
            ],
            mascotas: [
                { value: "gato", label: "Gato" },
                { value: "perro", label: "Perro" },
            ],
            helados: [
                { value: "conaprole", label: "Conaprole" },
                { value: "crufi", label: "Crufi" },
            ],
        }),
        []
    );

    const calcFinalPrice = () => {
        const base = Number(String(editPriceOriginal || "").replace(",", "."));
        const pct = Number(percent);

        if (!Number.isFinite(base)) return 0;
        if (!Number.isFinite(pct)) return base;

        const final = base * (1 + pct / 100);
        return Number(final.toFixed(2));
    };

    const requiereSub =
        editCategoria === "bebidas" ||
        editCategoria === "mascotas" ||
        editCategoria === "helados";

    return (
        <div className="container py-4 oper-scan">
            <div className="oper-scan__header">
                <h1>Actualizar productos</h1>
                <p className="oper-scan__hint">
                    Productos con <strong>barcode</strong>. ({count})
                </p>
            </div>

            <div className="oper-scan__scanbox op999-toolbar">
                <input
                    className="oper-scan__input"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar producto por nombre..."
                    autoComplete="off"
                />

                <button className="oper-scan__btn" type="button" onClick={load} disabled={loading}>
                    {loading ? "Cargando…" : "Refrescar"}
                </button>
            </div>

            <div className="op999-grid">
                {loading ? (
                    <p className="oper-scan__empty">Cargando…</p>
                ) : filteredRows.length === 0 ? (
                    <p className="oper-scan__empty">
                        {search
                            ? "No se encontraron productos para esa búsqueda."
                            : "No hay productos con código de barra."}
                    </p>
                ) : (
                    filteredRows.map((p) => (
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
                            <div className="op999-meta">
                                Última actualización: {fmtDateFull(p.updated_at)}
                            </div>

                            <div className="op999-actions">
                                <button type="button" className="op999-btn" onClick={() => openEdit(p)}>
                                    Editar
                                </button>

                                <button
                                    type="button"
                                    className="op999-btn op999-btn--danger"
                                    onClick={() => onDesclasificar(p)}
                                >
                                    Desclasificar
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
                            {/* Precio original */}
                            <div className="oper-modal__field">
                                <label className="oper-modal__label">Precio original</label>
                                <input
                                    className="oper-modal__input"
                                    value={editPriceOriginal}
                                    onChange={(e) => setEditPriceOriginal(e.target.value)}
                                    inputMode="decimal"
                                />
                            </div>

                            {/* % ganancia */}
                            <div className="oper-modal__field">
                                <label className="oper-modal__label">% ganancia</label>
                                <input
                                    className="oper-modal__input"
                                    value={percent}
                                    onChange={(e) => setPercent(e.target.value)}
                                    inputMode="decimal"
                                />
                            </div>

                            {/* Precio final calculado */}
                            <div className="oper-modal__field">
                                <label className="oper-modal__label">Precio final</label>
                                <div className="oper-modal__preview">
                                    $ {money(calcFinalPrice())}
                                </div>
                            </div>
                        </div>

                        <div className="oper-modal__field">
                            <label className="oper-modal__label">Categoría</label>
                            <select
                                className="oper-modal__input"
                                value={editCategoria}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setEditCategoria(next);
                                    setEditSubcategoria(""); // reset al cambiar macro
                                    setCatTouched(true);
                                    setSubTouched(true); // porque al resetear sub, también estamos “tocándola”
                                }}
                            >
                                <option value="">Sin categoría</option>
                                {categorias.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="oper-modal__field">
                            <label className="oper-modal__label">Subcategoría</label>
                            <select
                                className="oper-modal__input"
                                value={editSubcategoria}
                                onChange={(e) => {
                                    setEditSubcategoria(e.target.value);
                                    setSubTouched(true);
                                }}
                                disabled={!requiereSub}
                            >
                                <option value="">{requiereSub ? "Elegí una…" : "No aplica"}</option>
                                {(subcategorias[editCategoria] || []).map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
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
