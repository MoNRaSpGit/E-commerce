import { useEffect, useRef } from "react";
import { apiFetch } from "../services/apiFetch";

function mapServerItemsToScanItems(items) {
  if (!Array.isArray(items)) return [];

  return items.map((it) => ({
    id: Number(it.producto_id ?? it.id ?? 0) || -Date.now() - Math.floor(Math.random() * 1000),
    name: it.nombre_snapshot || "Producto",
    price: Number(it.precio_unitario_snapshot || 0),
    qty: Math.max(1, Number(it.cantidad || 1)),
    has_image: false,
    imageDataUrl: null,
  }));
}

function buildPayload(items) {
  return (Array.isArray(items) ? items : []).map((it) => ({
    productoId: Number(it.id) > 0 ? Number(it.id) : null,
    name: it.name,
    price: Number(it.price || 0),
    qty: Math.max(1, Number(it.qty || 1)),
  }));
}

export function useScanLiveSync({ items, setItems, dispatch, navigate }) {
  const hydratedRef = useRef(false);
  const syncTimeoutRef = useRef(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrent() {
      try {
        const r = await apiFetch(
          "/api/scanlive/current",
          { method: "GET" },
          { dispatch, navigate }
        );

        const data = await r.json().catch(() => null);
        if (cancelled) return;
        if (!r.ok || !data?.ok) {
          hydratedRef.current = true;
          return;
        }

        const serverItems = mapServerItemsToScanItems(data?.data?.items || []);
        if (serverItems.length > 0) {
          setItems(serverItems);
        }

        hydratedRef.current = true;
      } catch {
        hydratedRef.current = true;
      }
    }

    loadCurrent();

    return () => {
      cancelled = true;
    };
  }, [dispatch, navigate, setItems]);

  useEffect(() => {
    if (!hydratedRef.current) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      if (syncingRef.current) return;
      syncingRef.current = true;

      try {
        await apiFetch(
          "/api/scanlive/sync",
          {
            method: "PUT",
            body: JSON.stringify({
              items: buildPayload(items),
            }),
          },
          { dispatch, navigate }
        );
      } catch {
      } finally {
        syncingRef.current = false;
      }
    }, 250);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [items, dispatch, navigate]);

  const closeScanLiveSession = async () => {
    try {
      await apiFetch(
        "/api/scanlive/close",
        { method: "POST" },
        { dispatch, navigate }
      );
    } catch (err) {
      console.error("Error en closeScanLiveSession:", err);
    }
  };

  return { closeScanLiveSession };
}