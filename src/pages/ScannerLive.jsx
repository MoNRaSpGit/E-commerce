import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/apiFetch";
import { normalizeImage } from "../features/escaneo/scanFormat";

function normalizeItem(item) {
    return {
        producto_id: item.productoId ?? item.producto_id ?? item.id,
        barcode: item.barcode ?? "",
        nombre_snapshot: item.nombre_snapshot ?? item.name,
        precio_unitario_snapshot: Number(item.precio_unitario_snapshot ?? item.price ?? 0),
        cantidad: Math.max(1, Number(item.cantidad ?? item.qty ?? 1)),
        has_image: Boolean(item.has_image),
        imageDataUrl: item.imageDataUrl ?? null,
    };
}

function buildSyncItems(items) {
    return items.map((item) => ({
        producto_id: item.producto_id,
        barcode: item.barcode,
        nombre_snapshot: item.nombre_snapshot,
        precio_unitario_snapshot: Number(item.precio_unitario_snapshot || 0),
        cantidad: Math.max(1, Number(item.cantidad || 1)),
    }));
}

function debounce(fn, wait) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), wait);
    };
}

function formatMs(value) {
    return `${Math.round(Number(value || 0))} ms`;
}

export default function ScannerLive() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const hydratedRef = useRef(false);
    const cacheRef = useRef(new Map());
    const pendingMetricRef = useRef(null);

    const [code, setCode] = useState("");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);
    const [scanMessage, setScanMessage] = useState("");
    const [cacheVersion, setCacheVersion] = useState(0);
    const [metrics, setMetrics] = useState({
        lastBarcode: "",
        lastSource: "",
        lastDurationMs: 0,
        lastImageDurationMs: 0,
        hits: 0,
        misses: 0,
        history: [],
    });

    const focusScanInput = () => {
        requestAnimationFrame(() => {
            inputRef.current?.focus?.();
            inputRef.current?.select?.();
        });
    };

    const syncSession = async (nextItems) => {
        console.log("syncSession -> PUT /api/scanlive/sync", nextItems);
        setSyncing(true);
        setError(null);

        try {
            const res = await apiFetch(
                "/api/scanlive/sync",
                {
                    method: "PUT",
                    body: JSON.stringify({ items: buildSyncItems(nextItems) }),
                },
                { dispatch, navigate }
            );

            console.log("syncSession response", res.status);
            if (!res.ok) throw new Error("Sync fallo");
        } catch (err) {
            setError("Error al sincronizar la sesion");
            console.error("syncSession error", err);
        } finally {
            setSyncing(false);
        }
    };

    const debouncedSync = useMemo(() => debounce(syncSession, 600), [dispatch, navigate]);

    useEffect(() => {
        focusScanInput();
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadCurrent() {
            console.log("loadCurrent -> GET /api/scanlive/current");
            try {
                const res = await apiFetch(
                    "/api/scanlive/current",
                    { method: "GET" },
                    { dispatch, navigate }
                );
                console.log("loadCurrent response", res.status);
                const data = await res.json().catch(() => null);
                console.log("loadCurrent data", data);

                if (cancelled) return;

                if (!res.ok) {
                    throw new Error(data?.error || `GET /api/scanlive/current -> ${res.status}`);
                }

                const nextItems = Array.isArray(data?.items)
                    ? data.items
                    : Array.isArray(data?.data?.items)
                        ? data.data.items
                        : [];

                const normalized = nextItems.map(normalizeItem);
                hydratedRef.current = true;
                setItems(normalized);

                normalized.forEach((item) => {
                    if (!item.barcode) return;
                    cacheRef.current.set(item.barcode, {
                        producto_id: item.producto_id,
                        barcode: item.barcode,
                        nombre_snapshot: item.nombre_snapshot,
                        precio_unitario_snapshot: item.precio_unitario_snapshot,
                    });
                });
                setCacheVersion((v) => v + 1);
            } catch (err) {
                if (cancelled) return;
                setError("No se pudo cargar la sesion actual");
                console.error("loadCurrent error", err);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadCurrent();

        return () => {
            cancelled = true;
        };
    }, [dispatch, navigate]);

    useEffect(() => {
        if (!hydratedRef.current) return;
        debouncedSync(items);
    }, [items, debouncedSync]);

    useEffect(() => {
        let cancelled = false;

        async function loadMissingImages() {
            const pendingItems = items.filter(
                (item) =>
                    Number(item.producto_id) > 0 &&
                    Boolean(item.has_image) &&
                    !item.imageDataUrl
            );

            for (const item of pendingItems) {
                if (cancelled) return;

                const startedAt = performance.now();

                try {
                    const res = await apiFetch(
                        `/api/productos/${item.producto_id}/image`,
                        { method: "GET" },
                        { auth: false }
                    );
                    const data = await res.json().catch(() => null);
                    const imageUrl = normalizeImage(data?.data?.image);

                    if (!res.ok || !imageUrl || cancelled) continue;

                    const imageDurationMs = performance.now() - startedAt;

                    setItems((current) =>
                        current.map((currentItem) =>
                            currentItem.producto_id === item.producto_id
                                ? { ...currentItem, imageDataUrl: imageUrl }
                                : currentItem
                        )
                    );

                    setMetrics((current) => ({
                        ...current,
                        lastImageDurationMs: imageDurationMs,
                        history: current.history.map((entry, index) =>
                            index === 0 && entry.producto_id === item.producto_id
                                ? { ...entry, imageDurationMs }
                                : entry
                        ),
                    }));
                } catch {
                }
            }
        }

        loadMissingImages();

        return () => {
            cancelled = true;
        };
    }, [items]);

    useEffect(() => {
        const pending = pendingMetricRef.current;
        if (!pending) return;

        const exists = items.some((item) => item.producto_id === pending.producto_id);
        if (!exists) return;

        pendingMetricRef.current = null;
        requestAnimationFrame(() => {
            const durationMs = performance.now() - pending.startedAt;
            setMetrics((current) => ({
                lastBarcode: pending.barcode,
                lastSource: pending.source,
                lastDurationMs: durationMs,
                hits: current.hits + (pending.source === "cache" ? 1 : 0),
                misses: current.misses + (pending.source === "api" ? 1 : 0),
                history: [
                    {
                        barcode: pending.barcode,
                        producto_id: pending.producto_id,
                        source: pending.source,
                        durationMs,
                        imageDurationMs: 0,
                    },
                    ...current.history,
                ].slice(0, 8),
            }));
        });
    }, [items]);

    const addOrIncrementItem = (product, source, startedAt) => {
        const normalized = normalizeItem(product);
        pendingMetricRef.current = {
            producto_id: normalized.producto_id,
            barcode: normalized.barcode,
            source,
            startedAt,
        };

        setItems((current) => {
            const existing = current.find((item) => item.producto_id === normalized.producto_id);
            if (existing) {
                return current.map((item) =>
                    item.producto_id === normalized.producto_id
                        ? { ...item, cantidad: Number(item.cantidad || 0) + 1 }
                        : item
                );
            }

            return [...current, { ...normalized, cantidad: 1 }];
        });
    };

    const handleScan = async () => {
        const barcode = String(code || "").trim();
        if (!barcode || scanning) return;

        const startedAt = performance.now();
        setScanning(true);
        setError(null);
        setScanMessage("");

        const cachedProduct = cacheRef.current.get(barcode);
        if (cachedProduct) {
            console.log("scanner-live cache hit", barcode);
            addOrIncrementItem(cachedProduct, "cache", startedAt);
            setScanMessage(`Cache hit para ${barcode}`);
            setCode("");
            setScanning(false);
            focusScanInput();
            return;
        }

        console.log("scanner-live cache miss", barcode);

        try {
            const res = await apiFetch(
                `/api/productos/barcode/${encodeURIComponent(barcode)}`,
                { method: "GET" },
                { dispatch, navigate }
            );

            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.ok || !data?.data) {
                throw new Error(data?.error || `Producto no encontrado (${res.status})`);
            }

            const product = {
                producto_id: data.data.id,
                barcode,
                nombre_snapshot: data.data.name,
                precio_unitario_snapshot: Number(data.data.price || 0),
                has_image: Boolean(data.data.has_image),
                imageDataUrl: null,
            };

            cacheRef.current.set(barcode, product);
            setCacheVersion((v) => v + 1);

            addOrIncrementItem(product, "api", startedAt);
            setScanMessage(`Cache miss para ${barcode}; se agrego al store local`);
            setCode("");
        } catch (err) {
            setError(err.message || "No se pudo obtener el producto");
            console.error("handleScan error", err);
        } finally {
            setScanning(false);
            focusScanInput();
        }
    };

    const updateItemField = (producto_id, field, value) => {
        setItems((current) =>
            current.map((item) =>
                item.producto_id === producto_id ? { ...item, [field]: value } : item
            )
        );
    };

    const removeItem = (producto_id) => {
        setItems((current) => current.filter((item) => item.producto_id !== producto_id));
        focusScanInput();
    };

    const clearLocalCache = () => {
        cacheRef.current.clear();
        setCacheVersion((v) => v + 1);
        setScanMessage("Cache local limpiada");
        focusScanInput();
    };

    const closeSession = async () => {
        console.log("closeSession -> POST /api/scanlive/close");
        try {
            const res = await apiFetch(
                "/api/scanlive/close",
                { method: "POST" },
                { dispatch, navigate }
            );
            console.log("closeSession response", res.status);
            if (!res.ok) throw new Error("Close fallo");
            setItems([]);
            clearLocalCache();
        } catch (err) {
            setError("No se pudo cerrar la sesion");
            console.error("closeSession error", err);
            focusScanInput();
        }
    };

    const subtotal = useMemo(
        () =>
            items.reduce(
                (acc, item) => acc + Number(item.precio_unitario_snapshot || 0) * Number(item.cantidad || 0),
                0
            ),
        [items]
    );

    const cacheEntries = Array.from(cacheRef.current.values());

    return (
        <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
            <h1>Escaneo en vivo</h1>
            <p style={{ marginTop: 0, color: "#555" }}>
                Laboratorio para medir cache hit, cache miss y tiempo de respuesta antes de migrarlo al escaner real.
            </p>

            {loading && <div>Cargando sesion...</div>}
            {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

            {!loading && (
                <>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={code}
                            placeholder="Escanea o escribe un barcode"
                            onChange={(e) => setCode(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleScan();
                                }
                            }}
                            style={{ flex: "1 1 320px", minHeight: 42, padding: "0 12px" }}
                        />
                        <button onClick={handleScan} disabled={scanning || !code.trim()}>
                            {scanning ? "Buscando..." : "Probar escaneo"}
                        </button>
                        <button onClick={clearLocalCache} type="button">
                            Limpiar cache local
                        </button>
                        <button onClick={closeSession} disabled={syncing} type="button">
                            Cerrar sesion
                        </button>
                    </div>

                    {scanMessage && <div style={{ marginBottom: 12, color: "#0a5" }}>{scanMessage}</div>}
                    {syncing && <div style={{ marginBottom: 12 }}>Sincronizando...</div>}

                    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 20 }}>
                        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                            <div style={{ fontSize: 12, color: "#666" }}>Ultimo escaneo</div>
                            <div style={{ fontWeight: 700 }}>{metrics.lastBarcode || "-"}</div>
                            <div>{metrics.lastSource ? `${metrics.lastSource} - ${formatMs(metrics.lastDurationMs)}` : "Sin datos"}</div>
                            <div style={{ fontSize: 12, color: "#666" }}>
                                Imagen: {metrics.lastImageDurationMs ? formatMs(metrics.lastImageDurationMs) : "pendiente/sin imagen"}
                            </div>
                        </div>
                        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                            <div style={{ fontSize: 12, color: "#666" }}>Cache hits</div>
                            <div style={{ fontWeight: 700 }}>{metrics.hits}</div>
                        </div>
                        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                            <div style={{ fontSize: 12, color: "#666" }}>Cache misses</div>
                            <div style={{ fontWeight: 700 }}>{metrics.misses}</div>
                        </div>
                        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                            <div style={{ fontSize: 12, color: "#666" }}>Productos en cache</div>
                            <div style={{ fontWeight: 700 }}>{cacheEntries.length}</div>
                            <div style={{ fontSize: 12, color: "#666" }}>version {cacheVersion}</div>
                        </div>
                    </div>

                    <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)" }}>
                        <div>
                            <h2>Items de la sesion</h2>
                            <div style={{ marginBottom: 8, color: "#555" }}>
                                {items.length} items distintos | subtotal ${subtotal.toFixed(2)}
                            </div>

                            {items.length === 0 && <div>No hay productos cargados todavia.</div>}

                            {items.map((item) => (
                                <div
                                    key={item.producto_id}
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        marginBottom: 8,
                                        alignItems: "center",
                                        border: "1px solid #eee",
                                        borderRadius: 10,
                                        padding: 10,
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600 }}>{item.nombre_snapshot}</div>
                                        <div style={{ fontSize: 12, color: "#666" }}>
                                            ID {item.producto_id} {item.barcode ? `| barcode ${item.barcode}` : ""}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            width: 52,
                                            height: 52,
                                            borderRadius: 8,
                                            overflow: "hidden",
                                            background: "#f3f3f3",
                                            display: "grid",
                                            placeItems: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {item.imageDataUrl ? (
                                            <img
                                                src={item.imageDataUrl}
                                                alt={item.nombre_snapshot}
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: 11, color: "#777", textAlign: "center" }}>
                                                {item.has_image ? "Cargando" : "Sin img"}
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.cantidad}
                                        onChange={(e) =>
                                            updateItemField(item.producto_id, "cantidad", Number(e.target.value))
                                        }
                                        style={{ width: 80 }}
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.precio_unitario_snapshot}
                                        onChange={(e) =>
                                            updateItemField(
                                                item.producto_id,
                                                "precio_unitario_snapshot",
                                                Number(e.target.value)
                                            )
                                        }
                                        style={{ width: 120 }}
                                    />
                                    <button onClick={() => removeItem(item.producto_id)}>Eliminar</button>
                                </div>
                            ))}
                        </div>

                        <div>
                            <h2>Panel laboratorio</h2>

                            <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                                <div style={{ fontWeight: 600, marginBottom: 8 }}>Historial</div>
                                {metrics.history.length === 0 && <div style={{ color: "#666" }}>Todavia no hay mediciones.</div>}
                                {metrics.history.map((entry, index) => (
                                    <div key={`${entry.barcode}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                                        <span>{entry.barcode}</span>
                                        <span>{entry.source}</span>
                                        <span>{formatMs(entry.durationMs)}</span>
                                        <span style={{ color: "#666" }}>
                                            img {entry.imageDurationMs ? formatMs(entry.imageDurationMs) : "-"}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                                <div style={{ fontWeight: 600, marginBottom: 8 }}>Store local</div>
                                {cacheEntries.length === 0 && <div style={{ color: "#666" }}>Cache vacia.</div>}
                                {cacheEntries.map((entry) => (
                                    <div key={entry.barcode || entry.producto_id} style={{ marginBottom: 8 }}>
                                        <div style={{ fontWeight: 600 }}>{entry.nombre_snapshot}</div>
                                        <div style={{ fontSize: 12, color: "#666" }}>
                                            {entry.barcode || "sin barcode"} | ${Number(entry.precio_unitario_snapshot || 0).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
