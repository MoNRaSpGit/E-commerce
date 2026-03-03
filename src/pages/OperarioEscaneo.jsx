import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/apiFetch";
import { selectAuth } from "../slices/authSlice";
import toast from "react-hot-toast";


import "../styles/operarioEscaneo.css";


const STORAGE_SCAN_ITEMS = "eco_oper_scan_items_v1";

function loadScanItems() {
    try {
        const raw = localStorage.getItem(STORAGE_SCAN_ITEMS);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [];
        return arr;
    } catch {
        return [];
    }
}

function saveScanItems(items) {
    try {
        localStorage.setItem(STORAGE_SCAN_ITEMS, JSON.stringify(items));
    } catch { }
}

function clearScanItems() {
    try {
        localStorage.removeItem(STORAGE_SCAN_ITEMS);
    } catch { }
}




function money(n) {
    const x = Number(n || 0);
    return x.toFixed(2);
}



export default function OperarioEscaneo() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { accessToken } = useSelector(selectAuth);

    const inputRef = useRef(null);
    const nfNameRef = useRef(null);

    const focusScan = () => {
        // rAF para que funcione incluso después de setState/render
        requestAnimationFrame(() => inputRef.current?.focus?.());
    };

    const addManualItem = () => {
        const price = Number(String(manualPrice || "").replace(",", "."));

        if (!Number.isFinite(price) || price <= 0) {
            toast.error("Precio manual inválido");
            focusScan();
            return;
        }

        const tmpId = -Date.now(); // id negativo = item manual (no existe en DB)

        setItems((prev) => [
            ...prev,
            {
                id: tmpId,
                name: "Producto manual",
                price,
                qty: 1,
                has_image: false,
                imageDataUrl: null,
            },
        ]);

        setManualPrice("");
        focusScan();
    };


    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(""); // feedback simple (sin toast por ahora)
    const [manualPrice, setManualPrice] = useState("");
    const [items, setItems] = useState(() => {
        const stored = loadScanItems();
        // aseguramos shape mínima y NO guardamos imageDataUrl
        return stored
            .map((x) => ({
                id: Number(x.id),
                name: x.name,
                price: Number(x.price || 0),
                qty: Math.max(1, Number(x.qty || 1)),
                has_image: !!x.has_image,
                imageDataUrl: null,
            }))
            .filter((x) => Number.isFinite(x.id) && x.id > 0);
    });

    const [toUpdate, setToUpdate] = useState([]); // [{ id, markedAt }]

    // Modal alta rápida (cuando no existe el barcode)
    const [nfOpen, setNfOpen] = useState(false);
    const [nfBarcode, setNfBarcode] = useState("");
    const [nfName, setNfName] = useState("");
    const [nfPrice, setNfPrice] = useState("");
    const [nfSaving, setNfSaving] = useState(false);

    // Modal editar producto (nombre + precio)
    const [edOpen, setEdOpen] = useState(false);
    const [edId, setEdId] = useState(null);
    const [edName, setEdName] = useState("");
    const [edPrice, setEdPrice] = useState("");
    const [edSaving, setEdSaving] = useState(false);

    // Modal eliminar producto (confirmación)
    const [delOpen, setDelOpen] = useState(false);
    const [delId, setDelId] = useState(null);
    const [delName, setDelName] = useState("");
    const [delBusy, setDelBusy] = useState(false);

    const openDeleteModal = (item) => {
        setDelId(Number(item.id));
        setDelName(String(item.name || ""));
        setDelOpen(true);
    };

    const confirmDelete = async () => {
        const id = Number(delId);
        if (!id) {
            toast.error("Producto inválido");
            return;
        }

        setDelBusy(true);
        try {
            const r = await apiFetch(
                `/api/productos/${id}`,
                { method: "DELETE" },
                { dispatch, navigate }
            );

            const data = await r.json().catch(() => null);

            if (!r.ok || !data?.ok) {
                toast.error(data?.error || "No se pudo eliminar");
                return;
            }

            // ✅ sacar de la lista local
            setItems((prev) => prev.filter((x) => x.id !== id));

            toast.success("Producto eliminadooo ✅");
            setDelOpen(false);
            setDelId(null);
            setDelName("");
            focusScan();
        } catch (e) {
            toast.error(e?.message || "No se pudo eliminar");
        } finally {
            setDelBusy(false);
        }
    };


    const openEditModal = (item) => {
        setEdId(Number(item.id));
        setEdName(String(item.name || ""));
        setEdPrice(String(item.price ?? ""));
        setEdOpen(true);
    };


    const openNotFoundModal = (barcode) => {
        setNfBarcode(String(barcode || "").trim());
        setNfName("");
        setNfPrice("");
        setNfOpen(true);
        // foco al input del modal se lo damos con autoFocus

        // ✅ intenta abrir teclado enfocando el input en el siguiente tick
        setTimeout(() => nfNameRef.current?.focus?.(), 50);
    };



    useEffect(() => {
        inputRef.current?.focus?.();
    }, []);

    useEffect(() => {
        // persistimos versión liviana (sin imageDataUrl)
        const compact = items.map((x) => ({
            id: x.id,
            name: x.name,
            price: x.price,
            qty: x.qty,
            has_image: x.has_image,
        }));
        saveScanItems(compact);
    }, [items]);


    useEffect(() => {
        if (!accessToken) return;

        let alive = true;

        (async () => {
            try {
                const r = await apiFetch(
                    `/api/actualizacion?estado=pendiente`,
                    { method: "GET" },
                    { dispatch, navigate }
                );
                const data = await r.json().catch(() => null);

                if (!alive) return;

                if (!r.ok || !data?.ok) return;

                const next = Array.isArray(data.data)
                    ? data.data.map((x) => ({
                        id: Number(x.producto_id),
                        markedAt: x.marcado_at || null,
                    }))
                    : [];

                setToUpdate(next);
            } catch {
                // si falla, no rompemos UI
            }
        })();

        return () => { alive = false; };
    }, [accessToken, dispatch, navigate]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            for (const it of items) {
                if (cancelled) return;

                const id = Number(it.id);
                const hasImg = Boolean(it.has_image);

                if (!id || !hasImg) continue;
                if (it.imageDataUrl) continue;

                const url = await fetchImageIfNeeded(id);
                if (!url || cancelled) continue;

                setItems((prev) =>
                    prev.map((x) => (x.id === id ? { ...x, imageDataUrl: url } : x))
                );
            }
        })();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items]);


    const total = useMemo(() => {
        return items.reduce((acc, it) => acc + Number(it.price || 0) * (it.qty || 0), 0);
    }, [items]);

    const inc = (id) => {
        setItems((prev) =>
            prev.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x))
        );
        focusScan();
    };


    const dec = (id) => {
        setItems((prev) =>
            prev.map((x) => (x.id === id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))
        );
        focusScan();
    };


    const removeItem = (id) => {
        setItems((prev) => {
            const found = prev.find((x) => x.id === id);
            if (!found) return prev;

            const nextQty = Math.max(0, Number(found.qty || 0) - 1);

            // si queda en 0 => lo sacamos de la lista
            if (nextQty === 0) return prev.filter((x) => x.id !== id);

            // si no => solo restamos 1
            return prev.map((x) => (x.id === id ? { ...x, qty: nextQty } : x));
        });

        focusScan();
    };


    const fetchImageIfNeeded = async (productoId) => {
        try {
            const r = await apiFetch(
                `/api/productos/${productoId}/image`,
                { method: "GET" },
                { auth: false } // 👈 igual que ProductCard
            );

            const data = await r.json().catch(() => null);
            const img = normalizeImage(data?.data?.image);

            if (!r.ok || !data?.ok || !img) return null;
            return img;
        } catch {
            return null;
        }
    };


    function normalizeImage(image) {
        if (!image) return null;
        const s = String(image).trim();
        if (!s) return null;
        if (s.startsWith("http://") || s.startsWith("https://")) return s;
        if (s.startsWith("data:image/")) return s;
        return `data:image/jpeg;base64,${s}`;
    }


    const onScanEnter = async () => {
        const barcode = String(code || "").trim();
        if (!barcode) return;

        setMsg("");
        setLoading(true);

        try {
            const r = await apiFetch(
                `/api/productos/barcode/${encodeURIComponent(barcode)}`,
                {},
                { dispatch, navigate }
            );

            const data = await r.json().catch(() => null);

            if (!r.ok || !data?.ok) {
                const errText = data?.error || "No encontrado";

                // Si es 404 (no existe) => modal alta rápida
                if (r.status === 404) {
                    setMsg(""); // limpiamos mensaje en pantalla
                    setCode(""); // ✅ importante: limpia input para seguir escaneando
                    openNotFoundModal(barcode);
                    return;
                }


                setMsg(errText);
                focusScan();
                return;
            }

            const p = data.data;

            setItems((prev) => {
                const found = prev.find((x) => x.id === p.id);
                if (found) {
                    return prev.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x));
                }
                return [
                    ...prev,
                    {
                        id: p.id,
                        name: p.name,
                        price: Number(p.price || 0),
                        qty: 1,
                        has_image: !!p.has_image,
                        imageDataUrl: null,
                    },
                ];
            });

            // Limpia input y mantiene foco (clave para lector)
            setCode("");
            inputRef.current?.focus?.();

            // si tiene imagen, la buscamos en segundo plano y la pegamos
            if (p.has_image) {
                const url = await fetchImageIfNeeded(p.id);
                if (url) {
                    setItems((prev) =>
                        prev.map((x) => (x.id === p.id ? { ...x, imageDataUrl: url } : x))
                    );
                }
            }
        } finally {
            setLoading(false);
        }
    };


    const isMarked = (id) => toUpdate.some((x) => x.id === id);


    const markForUpdate = async (item) => {
        if (isMarked(item.id)) {
            toast.error("Este producto ya está para actualizar");
            inputRef.current?.focus?.();
            return;
        }

        try {
            const r = await apiFetch(
                `/api/actualizacion/marcar`,
                {
                    method: "POST",
                    body: JSON.stringify({ productoId: item.id, nota: null }),
                },
                { dispatch, navigate }
            );

            const data = await r.json().catch(() => null);

            if (!r.ok || !data?.ok) {
                // ✅ si ya existe (race / doble alta), lo traemos y lo agregamos igual
                if (r.status === 409) {
                    const r2 = await apiFetch(
                        `/api/productos/barcode/${encodeURIComponent(nfBarcode)}`,
                        { method: "GET" },
                        { dispatch, navigate }
                    );
                    const data2 = await r2.json().catch(() => null);

                    if (r2.ok && data2?.ok && data2?.data) {
                        const p2 = data2.data;

                        setItems((prev) => {
                            const found = prev.find((x) => x.id === p2.id);
                            if (found) {
                                return prev.map((x) => (x.id === p2.id ? { ...x, qty: x.qty + 1 } : x));
                            }
                            return [
                                ...prev,
                                {
                                    id: p2.id,
                                    name: p2.name,
                                    price: Number(p2.price || 0),
                                    qty: 1,
                                    has_image: !!p2.has_image,
                                    imageDataUrl: null,
                                },
                            ];
                        });

                        toast.success("Producto ya existía, agregado ✅");
                        setNfOpen(false);
                        setNfBarcode("");
                        setNfName("");
                        setNfPrice("");
                        focusScan();
                        return;
                    }
                }

                toast.error(data?.error || "No se pudo crear");
                return;
            }


            setToUpdate((prev) => [...prev, { id: item.id, markedAt: new Date().toISOString() }]);
            toast.success("Producto listo para actualizar");
            inputRef.current?.focus?.();
        } catch (e) {
            toast.error(e?.message || "No se pudo marcar para actualizar");
            inputRef.current?.focus?.();
        }
    };

    const onPagar = () => {
        // Fase 1: solo limpiar (después le metemos flujo real de pago si querés)
        setItems([]);
        setCode("");
        setMsg("");
        clearScanItems();
        toast.success("Lista finalizada ✅");
        inputRef.current?.focus?.();
    };

    const saveNotFound = async () => {
        const name = String(nfName || "").trim();
        const price = Number(String(nfPrice || "").replace(",", "."));

        if (name.length < 2) {
            toast.error("Nombre requerido");
            return;
        }
        if (!Number.isFinite(price) || price < 0) {
            toast.error("Precio inválido");
            return;
        }

        setNfSaving(true);
        try {
            const r = await apiFetch(
                `/api/productos/barcode/${encodeURIComponent(nfBarcode)}`,
                {
                    method: "POST",
                    body: JSON.stringify({ name, price }),
                },
                { dispatch, navigate }
            );

            const data = await r.json().catch(() => null);

            if (!r.ok || !data?.ok) {
                toast.error(data?.error || "No se pudo crear");
                return;
            }

            const p = data.data;

            // lo agregamos a items como un scan normal
            setItems((prev) => {
                const found = prev.find((x) => x.id === p.id);
                if (found) {
                    return prev.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x));
                }
                return [
                    ...prev,
                    {
                        id: p.id,
                        name: p.name,
                        price: Number(p.price || 0),
                        qty: 1,
                        has_image: !!p.has_image,
                        imageDataUrl: null,
                    },
                ];
            });

            toast.success("Producto creado ✅");
            setNfOpen(false);
            setNfBarcode("");
            setNfName("");
            setNfPrice("");

            setCode("");
            focusScan();
        } catch (e) {
            toast.error(e?.message || "No se pudo crear");
        } finally {
            setNfSaving(false);
        }
    };

    const saveEdit = async () => {
        const id = Number(edId);
        const name = String(edName || "").trim();
        const price = Number(String(edPrice || "").replace(",", "."));

        if (!id) {
            toast.error("Producto inválido");
            return;
        }
        if (name.length < 2) {
            toast.error("Nombre requerido");
            return;
        }
        if (!Number.isFinite(price) || price < 0) {
            toast.error("Precio inválido");
            return;
        }

        setEdSaving(true);
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
                toast.error(data?.error || "No se pudo actualizar");
                return;
            }

            // ✅ reflejar cambios en la lista
            setItems((prev) =>
                prev.map((x) =>
                    x.id === id ? { ...x, name, price: Number(price) } : x
                )
            );

            toast.success("Actualizado ✅");
            setEdOpen(false);
            setEdId(null);
            setEdName("");
            setEdPrice("");
            focusScan();
        } catch (e) {
            toast.error(e?.message || "No se pudo actualizar");
        } finally {
            setEdSaving(false);
        }
    };






    return (
        <div className="container py-4 oper-scan">
            <div className="oper-scan__header">
                <h1>Escaneo (Operario)</h1>
                <p className="oper-scan__hint">Escaneá un código y Enter. (El foco queda fijo en el input)</p>
            </div>

            <div className="oper-scan__scanbox">
                <input
                    ref={inputRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") onScanEnter();
                    }}
                    placeholder="Código de barras…"
                    className="oper-scan__input"
                    autoComplete="off"
                    inputMode="none"
                />

                <button
                    className="oper-scan__btn"
                    onClick={onScanEnter}
                    disabled={loading || !code.trim()}
                >
                    {loading ? "Buscando…" : "Agregar"}
                </button>
            </div>

            <div className="oper-scan__scanbox">
                <input
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") addManualItem();
                    }}
                    placeholder="Precio manual…"
                    className="oper-scan__input"
                    autoComplete="off"
                    inputMode="decimal"
                />

                <button
                    className="oper-scan__btn"
                    onClick={addManualItem}
                    disabled={!String(manualPrice || "").trim()}
                >
                    Agregar manual
                </button>
            </div>

            {!!msg && <p className="oper-scan__msg">{msg}</p>}

            <div className="oper-scan__list">
                {items.length === 0 ? (
                    <p className="oper-scan__empty">Todavía no escaneaste nada.</p>
                ) : (
                    items.map((it) => (
                        <div
                            key={it.id}
                            className={`oper-scan__row ${isMarked(it.id) ? "oper-scan__row--marked" : ""}`}
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
                            </div>

                            <button
                                type="button"
                                className="oper-scan__upd"
                                onClick={() => openEditModal(it)}
                            >
                                Actualizar
                            </button>

                            <div className="oper-scan__qty">
                                Cant: {it.qty || 0}
                            </div>




                            <button
                                onClick={() => removeItem(it.id)}
                                className="oper-scan__rm oper-scan__rm--danger"
                                title="Quitar de la lista"
                            >
                                ✕
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="oper-scan__total">
                <div className="oper-scan__totalLabel">Total</div>
                <div className="oper-scan__totalValue">$ {money(total)}</div>
            </div>

            {items.length > 0 && (
                <button
                    type="button"
                    className="oper-scan__pay"
                    onClick={onPagar}
                >
                    Pagar
                </button>
            )}


            {/* ✅ MODAL: producto no encontrado (alta rápida) */}
            {nfOpen && (
                <div
                    className="oper-modal__backdrop"
                    onMouseDown={() => {
                        if (nfSaving) return;
                        setNfOpen(false);
                        focusScan();
                    }}
                >
                    <div className="oper-modal__card" onMouseDown={(e) => e.stopPropagation()}>
                        <h2 className="oper-modal__title">Producto no encontrado</h2>

                        <div className="oper-modal__field">
                            <label className="oper-modal__label">Nombre</label>
                            <input
                                ref={nfNameRef}
                                className="oper-modal__input"
                                value={nfName}
                                onChange={(e) => setNfName(e.target.value)}
                                autoFocus
                            />

                        </div>

                        <div className="oper-modal__field">
                            <label className="oper-modal__label">Precio</label>
                            <input
                                className="oper-modal__input"
                                value={nfPrice}
                                onChange={(e) => setNfPrice(e.target.value)}
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                            />
                        </div>

                        <div className="oper-modal__actions">
                            <button
                                type="button"
                                className="oper-modal__btn"
                                disabled={nfSaving}
                                onClick={() => {
                                    setNfOpen(false);
                                    focusScan();
                                }}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="oper-modal__btn oper-modal__btn--primary"
                                disabled={nfSaving}
                                onClick={saveNotFound}
                            >
                                {nfSaving ? "Guardando…" : "Aceptar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ MODAL: editar producto (nombre + precio) */}
            {edOpen && (
                <div
                    className="oper-modal__backdrop"
                    onMouseDown={() => {
                        if (edSaving) return;
                        setEdOpen(false);
                        focusScan();
                    }}
                >
                    <div className="oper-modal__card" onMouseDown={(e) => e.stopPropagation()}>
                        <h2 className="oper-modal__title">Editar producto</h2>

                        <div className="oper-modal__field">
                            <label className="oper-modal__label">Nombre</label>
                            <input
                                className="oper-modal__input"
                                value={edName}
                                onChange={(e) => setEdName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="oper-modal__field">
                            <label className="oper-modal__label">Precio</label>
                            <input
                                className="oper-modal__input"
                                value={edPrice}
                                onChange={(e) => setEdPrice(e.target.value)}
                                inputMode="decimal"
                            />
                        </div>

                        <div className="oper-modal__actions">
                            <button
                                type="button"
                                className="oper-modal__btn"
                                disabled={edSaving}
                                onClick={() => {
                                    setEdOpen(false);
                                    focusScan();
                                }}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="oper-modal__btn oper-modal__btn--primary"
                                disabled={edSaving}
                                onClick={saveEdit}
                            >
                                {edSaving ? "Guardando…" : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ MODAL: confirmar eliminar */}
            {delOpen && (
                <div
                    className="oper-modal__backdrop"
                    onMouseDown={() => {
                        if (delBusy) return;
                        setDelOpen(false);
                        focusScan();
                    }}
                >
                    <div className="oper-modal__card" onMouseDown={(e) => e.stopPropagation()}>
                        <h2 className="oper-modal__title">Eliminar producto</h2>

                        <p style={{ marginTop: 6 }}>
                            ¿Seguro que querés eliminar <b>{delName || "este producto"}</b>?
                        </p>

                        <div className="oper-modal__actions">
                            <button
                                type="button"
                                className="oper-modal__btn"
                                disabled={delBusy}
                                onClick={() => {
                                    setDelOpen(false);
                                    focusScan();
                                }}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="oper-modal__btn oper-modal__btn--primary"
                                disabled={delBusy}
                                onClick={confirmDelete}
                            >
                                {delBusy ? "Eliminando…" : "Sí, eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );

}
