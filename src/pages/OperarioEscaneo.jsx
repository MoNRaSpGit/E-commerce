import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/apiFetch";
import { selectAuth } from "../slices/authSlice";
import toast from "react-hot-toast";


import "../styles/operarioEscaneo.css";

function money(n) {
    const x = Number(n || 0);
    return x.toFixed(2);
}

export default function OperarioEscaneo() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { accessToken } = useSelector(selectAuth);

    const inputRef = useRef(null);

    const focusScan = () => {
        // rAF para que funcione incluso después de setState/render
        requestAnimationFrame(() => inputRef.current?.focus?.());
    };


    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(""); // feedback simple (sin toast por ahora)
    const [items, setItems] = useState([]); // [{ id, name, price, qty, has_image, imageDataUrl? }]
    const [toUpdate, setToUpdate] = useState([]); // [{ id, markedAt }]


    useEffect(() => {
        inputRef.current?.focus?.();
    }, []);

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
            const it = prev.find((x) => x.id === id);
            if (!it) return prev;

            if ((it.qty || 0) > 1) {
                return prev.map((x) =>
                    x.id === id ? { ...x, qty: Math.max(1, (x.qty || 1) - 1) } : x
                );
            }

            return prev.filter((x) => x.id !== id);
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
                setMsg(data?.error || "No encontrado");
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

    const markForUpdate = (item) => {
        if (isMarked(item.id)) {
            toast.error("Este producto ya está para actualizar");
            focusScan();
            return;
        }

        setToUpdate((prev) => [...prev, { id: item.id, markedAt: new Date().toISOString() }]);
        toast.success("Producto listo para actualizar");
        focusScan();
    };


    return (
        <div className="container py-4 oper-scan">
            <div className="oper-scan__header">
                <h1>Escaneo (Operario)</h1>
                <p className="oper-scan__hint">
                    Escaneá un código y Enter. (El foco queda fijo en el input)
                </p>
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
                                <div className="oper-scan__meta">
                                    $ {money(it.price)} c/u
                                </div>
                            </div>

                            <button
                                type="button"
                                className={`oper-scan__upd ${isMarked(it.id) ? "is-disabled" : ""}`}
                                onClick={() => markForUpdate(it)}
                            >
                                Actualizar
                            </button>

                            <div className="oper-scan__qty">
                                <button onClick={() => dec(it.id)} className="oper-scan__qtybtn">-</button>
                                <div className="oper-scan__qtynum">{it.qty}</div>
                                <button onClick={() => inc(it.id)} className="oper-scan__qtybtn">+</button>
                            </div>

                            <div className="oper-scan__sub">
                                $ {money(it.price * it.qty)}
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
                <div>Total</div>
                <div className="oper-scan__totalval">$ {money(total)}</div>
            </div>
        </div>
    );
}
