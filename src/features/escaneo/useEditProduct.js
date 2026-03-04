import { useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../../services/apiFetch";

export function useEditProduct({ dispatch, navigate, setItems, focusScan }) {
  const [edOpen, setEdOpen] = useState(false);
  const [edId, setEdId] = useState(null);
  const [edName, setEdName] = useState("");
  const [edPrice, setEdPrice] = useState("");
  const [edSaving, setEdSaving] = useState(false);

  const openEditModal = (item) => {
    setEdId(Number(item.id));
    setEdName(String(item.name || ""));
    setEdPrice(String(item.price ?? ""));
    setEdOpen(true);
  };

  const saveEdit = async () => {
    const id = Number(edId);
    const name = String(edName || "").trim();
    const price = Number(String(edPrice || "").replace(",", "."));

    if (!id) return toast.error("Producto inválido");
    if (name.length < 2) return toast.error("Nombre requerido");
    if (!Number.isFinite(price) || price < 0) return toast.error("Precio inválido");

    setEdSaving(true);
    try {
      const r = await apiFetch(
        `/api/productos/${id}`,
        { method: "PATCH", body: JSON.stringify({ name, price }) },
        { dispatch, navigate }
      );

      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.ok) {
        toast.error(data?.error || "No se pudo actualizar");
        return;
      }

      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, name, price: Number(price) } : x))
      );

      toast.success("Actualizado ✅");
      setEdOpen(false);
      setEdId(null);
      setEdName("");
      setEdPrice("");
      focusScan?.();
    } catch (e) {
      toast.error(e?.message || "No se pudo actualizar");
    } finally {
      setEdSaving(false);
    }
  };

  return { edOpen, setEdOpen, edName, setEdName, edPrice, setEdPrice, edSaving, openEditModal, saveEdit };
}