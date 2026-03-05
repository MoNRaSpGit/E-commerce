import { useEffect, useMemo, useState } from "react";
import "../styles/precios.css";

import PrecioCategoria from "../features/precios/PrecioCategoria";
import PrecioEditModal from "../features/precios/PrecioEditModal";
import toast from "react-hot-toast";


function money(n) {
    const x = Number(n || 0);
    return x.toFixed(2);
}



export default function PreciosManuales() {
    const apiBaseUrl = import.meta.env.VITE_API_URL;

    const [loading, setLoading] = useState(false);

    const [rowsByCat, setRowsByCat] = useState({});
    const [openCats, setOpenCats] = useState({});

    const [edOpen, setEdOpen] = useState(false);
    const [edId, setEdId] = useState(null);
    const [edNombre, setEdNombre] = useState("");
    const [edPrecio, setEdPrecio] = useState("");
    const [edSaving, setEdSaving] = useState(false);

    function setEditData(r) {
        setEdId(r.id);
        setEdNombre(r.nombre);
        setEdPrecio(String(r.precio ?? ""));
        setEdOpen(true);
    }

    function closeModal() {
        setEdOpen(false);
        setEdId(null);
        setEdNombre("");
        setEdPrecio("");
    }

    async function savePrecio() {
        const id = Number(edId);
        const precio = Number(
            String(edPrecio || "")
                .trim()
                .replace("$", "")
                .replace(/\s+/g, "")
                .replace(",", ".")
        );

        if (!Number.isFinite(id) || id <= 0) {
            toast.error("ID inválido");
            return;
        }
        if (!Number.isFinite(precio) || precio < 0) {
            toast.error("Precio inválido");
            return;
        }

        const raw = localStorage.getItem("eco_auth");
        const stored = raw ? JSON.parse(raw) : null;
        const accessToken = stored?.accessToken;

        if (!accessToken) {
            toast.error("No autenticado");
            return;
        }

        setEdSaving(true);
        try {
            const res = await fetch(`${apiBaseUrl}/api/precios/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ precio }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.ok) {
                toast.error(data?.error || "No se pudo actualizar");
                return;
            }

            const updated = data?.data;

            // ✅ update local sin recargar
            function updateList(listSetter) {
                listSetter((prev) =>
                    prev.map((x) => (x.id === id ? { ...x, ...updated } : x))
                );
            }

            setRowsByCat((prev) => {
                const next = { ...prev };
                for (const k of Object.keys(next)) {
                    const list = Array.isArray(next[k]) ? next[k] : [];
                    next[k] = list.map((x) => (x.id === id ? { ...x, ...updated } : x));
                }
                return next;
            });

            toast.success("Precio actualizado");
            closeModal();
        } finally {
            setEdSaving(false);
        }
    }

    const totalRows = useMemo(() => {
        const lists = Object.values(rowsByCat);
        return lists.reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
    }, [rowsByCat]);

    async function fetchCat(categoria) {
        const raw = localStorage.getItem("eco_auth");
        const stored = raw ? JSON.parse(raw) : null;
        const accessToken = stored?.accessToken;

        if (!accessToken) {
            toast.error("No autenticado");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${apiBaseUrl}/api/precios?categoria=${categoria}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.ok) {
                toast.error(data?.error || "Error al cargar precios");

                setRowsByCat((prev) => ({ ...prev, [categoria]: [] }));

                return;
            }

            const arr = Array.isArray(data.data) ? data.data : [];

            setRowsByCat((prev) => ({ ...prev, [categoria]: arr }));
        } finally {
            setLoading(false);
        }
    }

    const CATS = useMemo(
        () => [
            { key: "frutas_verduras", label: "Frutas / Verduras" },
            { key: "congelados", label: "Congelados" },
            { key: "remedios", label: "Remedios" },
            // ⬇️ Acá vas agregando las nuevas cajas cuando quieras:
            // { key: "frutas", label: "Frutas" },
            // { key: "verduras", label: "Verduras" },
            // { key: "huevos", label: "Huevos" },
        ],
        []
    );

    useEffect(() => {
        CATS.forEach((c) => fetchCat(c.key));
        // por defecto, todas cerradas:
        setOpenCats((prev) => {
            const next = { ...prev };
            CATS.forEach((c) => {
                if (typeof next[c.key] !== "boolean") next[c.key] = false;
            });
            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div style={{ padding: 16 }}>
            <h2 style={{ margin: "0 0 12px 0" }}>Precios</h2>

            <div style={{ opacity: 0.8, marginBottom: 12 }}>
                Items totales: <b>{totalRows}</b>
            </div>

            {loading && <div>Cargando…</div>}

            {!loading && totalRows === 0 && (
                <div style={{ opacity: 0.8 }}>No hay items todavía.</div>
            )}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 16,
                    alignItems: "start", // ✅ evita que las otras cards se estiren
                }}
            >
                {CATS.map((c) => {
                    const isOpen = !!openCats[c.key];
                    const list = Array.isArray(rowsByCat[c.key]) ? rowsByCat[c.key] : [];

                    return (
                        <PrecioCategoria
                            key={c.key}
                            label={c.label}
                            isOpen={isOpen}
                            count={list.length}
                            list={list}
                            onEdit={setEditData}
                            onToggle={() =>
                                setOpenCats((prev) => ({
                                    ...prev,
                                    [c.key]: !prev[c.key],
                                }))
                            }
                        />
                    );
                })}
            </div>
            <PrecioEditModal
                open={edOpen}
                onClose={closeModal}
                nombre={edNombre}
                precio={edPrecio}
                setPrecio={setEdPrecio}
                saving={edSaving}
                onSave={savePrecio}
            />


        </div>
    );
}