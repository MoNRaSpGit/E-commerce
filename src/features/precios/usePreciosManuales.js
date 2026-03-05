import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

function getAccessToken() {
  const raw = localStorage.getItem("eco_auth");
  const stored = raw ? JSON.parse(raw) : null;
  return stored?.accessToken || null;
}

export function usePreciosManuales() {
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  const [loading, setLoading] = useState(false);

  const [rowsByCat, setRowsByCat] = useState({});
  const [openCats, setOpenCats] = useState({});

  const [edOpen, setEdOpen] = useState(false);
  const [edId, setEdId] = useState(null);
  const [edNombre, setEdNombre] = useState("");
  const [edPrecio, setEdPrecio] = useState("");
  const [edSaving, setEdSaving] = useState(false);

  const CATS = useMemo(
    () => [
      { key: "frutas_verduras", label: "Frutas / Verduras" },
      { key: "congelados", label: "Congelados" },
      { key: "remedios", label: "Remedios" },
      // ⬇️ Acá vas agregando nuevas cajas
    ],
    []
  );

  const totalRows = useMemo(() => {
    const lists = Object.values(rowsByCat);
    return lists.reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
  }, [rowsByCat]);

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

  async function fetchCat(categoria) {
    const accessToken = getAccessToken();
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

    const accessToken = getAccessToken();
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

  useEffect(() => {
    CATS.forEach((c) => fetchCat(c.key));

    setOpenCats((prev) => {
      const next = { ...prev };
      CATS.forEach((c) => {
        if (typeof next[c.key] !== "boolean") next[c.key] = false;
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    CATS,
    loading,
    rowsByCat,
    openCats,
    setOpenCats,
    totalRows,

    edOpen,
    edNombre,
    edPrecio,
    setEdPrecio,
    edSaving,

    setEditData,
    closeModal,
    savePrecio,
  };
}