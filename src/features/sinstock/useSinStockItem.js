import { useEffect, useState } from "react";
import { apiFetch } from "../../services/apiFetch";

export function useSinStockItem({ p, dispatch, navigate }) {
  const currentStock = Number(p?.stock ?? 0);

  const [value, setValue] = useState(String(currentStock));
  const [saving, setSaving] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    setValue(String(currentStock));
  }, [p?.id, currentStock]);

  useEffect(() => {
    let cancelled = false;

    async function loadImage() {
      setImgSrc(null);
      if (!p?.id || !p?.has_image) return;

      try {
        const r = await apiFetch(
          `/api/productos/${Number(p.id)}/image`,
          { method: "GET" },
          { auth: false }
        );

        const data = await r.json().catch(() => null);
        const image = data?.data?.image;

        if (!cancelled && r.ok && data?.ok && image) {
          if (image.startsWith("http") || image.startsWith("data:image/")) {
            setImgSrc(image);
          } else {
            setImgSrc(`data:image/jpeg;base64,${image}`);
          }
        }
      } catch {
        // silencio
      }
    }

    loadImage();
    return () => {
      cancelled = true;
    };
  }, [p?.id, p?.has_image]);

  async function onSave() {
    const nextStock = Number(String(value).replace(",", "."));

    if (!Number.isFinite(nextStock) || nextStock < 0) {
      alert("Stock inválido");
      return;
    }

    if (nextStock === currentStock) return;

    const delta = nextStock - currentStock;

    try {
      setSaving(true);

      const r = await apiFetch(
        `/api/productos/${Number(p.id)}/stock`,
        {
          method: "PATCH",
          body: JSON.stringify({ delta }),
        },
        { dispatch, navigate }
      );

      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.ok) {
        alert(data?.error || "No se pudo actualizar el stock");
        return;
      }

      window.location.reload();
    } catch (e) {
      alert(e?.message || "No se pudo actualizar el stock");
    } finally {
      setSaving(false);
    }
  }

  return { imgSrc, value, setValue, saving, currentStock, onSave };
}