import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../../services/apiFetch";
import { normalizeImage } from "./scanFormat";

export function useScanLookup({ dispatch, navigate, items, setItems }) {
  const inputRef = useRef(null);

  const focusScan = useCallback(() => {
    requestAnimationFrame(() => inputRef.current?.focus?.());
  }, []);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    inputRef.current?.focus?.();
  }, []);

  const fetchImageIfNeeded = useCallback(async (productoId) => {
    try {
      const r = await apiFetch(
        `/api/productos/${productoId}/image`,
        { method: "GET" },
        { auth: false }
      );

      const data = await r.json().catch(() => null);
      const img = normalizeImage(data?.data?.image);

      if (!r.ok || !data?.ok || !img) return null;
      return img;
    } catch {
      return null;
    }
  }, []);

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

    return () => {
      cancelled = true;
    };
  }, [items, fetchImageIfNeeded, setItems]);

  // devuelve {ok, notFoundBarcode} cuando es 404, para que el otro hook abra el modal
  const onScanEnter = async ({ onNotFoundBarcode }) => {
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

        if (r.status === 404) {
          setMsg("");
          setCode("");
          onNotFoundBarcode?.(barcode);
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

      setCode("");
      inputRef.current?.focus?.();

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

  return { inputRef, focusScan, code, setCode, loading, msg, setMsg, onScanEnter };
}