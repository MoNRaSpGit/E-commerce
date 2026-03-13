import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../../services/apiFetch";

export function useNotFoundCreate({ dispatch, navigate, setItems, focusScan }) {
  const nfNameRef = useRef(null);

  const [nfOpen, setNfOpen] = useState(false);
  const [nfBarcode, setNfBarcode] = useState("");
  const [nfName, setNfName] = useState("");
  const [nfPrice, setNfPrice] = useState("");
  const [nfSaving, setNfSaving] = useState(false);

  const openNotFound = (barcode) => {
    setNfBarcode(String(barcode || "").trim());
    setNfName("");
    setNfPrice("");
    setNfOpen(true);
    setTimeout(() => nfNameRef.current?.focus?.(), 50);
  };

  const saveNotFound = async () => {


    const name = "Producto Manual";
    const price = Number(String(nfPrice || "").replace(",", "."));

    if (!Number.isFinite(price) || price < 0) {
      toast.error("Precio inválido");
      return;
    }


    setNfSaving(true);
    try {
      const r = await apiFetch(
        `/api/productos/barcode/${encodeURIComponent(nfBarcode)}`,
        { method: "POST", body: JSON.stringify({ name, price }) },
        { dispatch, navigate }
      );

      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.ok) {
        toast.error(data?.error || "No se pudo crear");
        return;
      }

      const p = data.data;

      setItems((prev) => {
        const found = prev.find((x) => x.id === p.id);
        if (found) {
          return prev.map((x) =>
            x.id === p.id ? { ...x, qty: (x.qty || 0) + 1 } : x
          );
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
      focusScan?.();
    } catch (e) {
      toast.error(e?.message || "No se pudo crear");
    } finally {
      setNfSaving(false);
    }
  };

  return {
    nfNameRef,
    nfOpen,
    nfBarcode,
    nfName,
    nfPrice,
    nfSaving,
    setNfOpen,
    setNfName,
    setNfPrice,
    openNotFound,
    saveNotFound,
  };
}