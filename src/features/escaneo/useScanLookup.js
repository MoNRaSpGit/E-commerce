import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../../services/apiFetch";
import { normalizeImage } from "./scanFormat";

const productCacheStore = new Map();
const imageCacheStore = new Map();

export function useScanLookup({ dispatch, navigate, items, setItems }) {
  const inputRef = useRef(null);
  const productCacheRef = useRef(productCacheStore);
  const imageCacheRef = useRef(imageCacheStore);

  const focusScan = useCallback(() => {
    requestAnimationFrame(() => inputRef.current?.focus?.());
  }, []);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [metrics, setMetrics] = useState({
    lastBarcode: "",
    lastSource: "",
    lastDurationMs: null,
    lastImageDurationMs: null,
    history: [],
  });

  useEffect(() => {
    inputRef.current?.focus?.();
  }, []);

  const fetchImageIfNeeded = useCallback(async (productoId) => {
    if (imageCacheRef.current.has(productoId)) {
      return imageCacheRef.current.get(productoId);
    }

    try {
      const r = await apiFetch(
        `/api/productos/${productoId}/image`,
        { method: "GET" },
        { auth: false }
      );

      const data = await r.json().catch(() => null);
      const img = normalizeImage(data?.data?.image);

      if (!r.ok || !data?.ok || !img) return null;
      imageCacheRef.current.set(productoId, img);
      return img;
    } catch {
      return null;
    }
  }, []);

  const invalidateCachedProduct = useCallback((productoId) => {
    const numericId = Number(productoId);
    if (!numericId) return;

    for (const [barcode, cachedProduct] of productCacheRef.current.entries()) {
      if (Number(cachedProduct?.id) === numericId) {
        productCacheRef.current.delete(barcode);
      }
    }

    imageCacheRef.current.delete(numericId);
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
  const onScanEnter = async ({ onNotFoundBarcode, rawCode } = {}) => {
    const barcode = String((rawCode ?? inputRef.current?.value ?? code) || "").trim();
    if (!barcode) return;

    const startedAt = performance.now();
    setMsg("");
    setLoading(true);

    try {
      const cachedProduct = productCacheRef.current.get(barcode);
      if (cachedProduct) {
        const productDurationMs = performance.now() - startedAt;

        setItems((prev) => {
          const found = prev.find((x) => x.id === cachedProduct.id);
          if (found) {
            return prev.map((x) =>
              x.id === cachedProduct.id ? { ...x, qty: (x.qty || 0) + 1 } : x
            );
          }
          return [
            ...prev,
            {
              id: cachedProduct.id,
              name: cachedProduct.name,
              price: Number(cachedProduct.price || 0),
              qty: 1,
              has_image: !!cachedProduct.has_image,
              imageDataUrl: cachedProduct.imageDataUrl || null,
            },
          ];
        });

        setMetrics((current) => ({
          lastBarcode: barcode,
          lastSource: "cache",
          lastDurationMs: productDurationMs,
          lastImageDurationMs: cachedProduct.imageDataUrl ? 0 : current.lastImageDurationMs,
          history: [
            {
              barcode,
              source: "cache",
              durationMs: productDurationMs,
              imageDurationMs: cachedProduct.imageDataUrl ? 0 : current.lastImageDurationMs,
            },
            ...current.history,
          ].slice(0, 8),
        }));

        setCode("");
        inputRef.current?.focus?.();
        return;
      }

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
      const productDurationMs = performance.now() - startedAt;
      const cachedBaseProduct = {
        id: p.id,
        name: p.name,
        price: Number(p.price || 0),
        has_image: !!p.has_image,
        imageDataUrl: null,
      };

      productCacheRef.current.set(barcode, cachedBaseProduct);

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

      setMetrics((current) => ({
        lastBarcode: barcode,
        lastSource: "api",
        lastDurationMs: productDurationMs,
        lastImageDurationMs: p.has_image ? 0 : null,
        history: [
          {
            barcode,
            source: "api",
            durationMs: productDurationMs,
            imageDurationMs: p.has_image ? 0 : null,
          },
          ...current.history,
        ].slice(0, 8),
      }));

      setCode("");
      inputRef.current?.focus?.();

      if (p.has_image) {
        const imageStartedAt = performance.now();
        const url = await fetchImageIfNeeded(p.id);
        if (url) {
          const imageDurationMs = performance.now() - imageStartedAt;
          setItems((prev) =>
            prev.map((x) => (x.id === p.id ? { ...x, imageDataUrl: url } : x))
          );
          setMetrics((current) => ({
            ...current,
            lastImageDurationMs: imageDurationMs,
            history: current.history.map((entry, index) =>
              index === 0 && entry.barcode === barcode
                ? { ...entry, imageDurationMs }
                : entry
            ),
          }));
          productCacheRef.current.set(barcode, {
            ...cachedBaseProduct,
            imageDataUrl: url,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    inputRef,
    focusScan,
    code,
    setCode,
    loading,
    msg,
    setMsg,
    onScanEnter,
    metrics,
    invalidateCachedProduct,
  };
}
