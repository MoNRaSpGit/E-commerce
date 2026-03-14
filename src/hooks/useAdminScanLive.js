import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../services/apiFetch";
import { createScanLiveEventSource } from "../services/scanLiveSse";

function mapServerItems(items) {
  if (!Array.isArray(items)) return [];

  return items.map((it, index) => ({
    id: `${it.session_id || "s"}-${it.producto_id || it.id || index}`,
    productoId: Number(it.producto_id || 0) || null,
    name: it.nombre_snapshot || "Producto",
    price: Number(it.precio_unitario_snapshot || 0),
    qty: Math.max(1, Number(it.cantidad || 1)),
    subtotal: Number(it.subtotal || 0),
  }));
}

export function useAdminScanLive({ dispatch, navigate }) {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [session, setSession] = useState(null);
  const esRef = useRef(null);

  const loadCurrent = useCallback(async () => {
    try {
      const r = await apiFetch(
        "/api/scanlive/current",
        { method: "GET" },
        { dispatch, navigate }
      );

      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.ok) return;

      const s = data?.data || null;

      if (!s) {
        setSession(null);
        return;
      }

      setSession({
        id: Number(s.id),
        operarioId: Number(s.operario_id),
        estado: s.estado,
        totalItems: Number(s.total_items || 0),
        totalUnidades: Number(s.total_unidades || 0),
        subtotal: Number(s.subtotal || 0),
        updatedAt: s.updated_at || null,
        items: mapServerItems(s.items),
      });
    } finally {
      setLoading(false);
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    loadCurrent();
  }, [loadCurrent]);

  useEffect(() => {
    const es = createScanLiveEventSource();
    if (!es) return;

    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.onerror = () => {
      setConnected(false);
    };

    es.addEventListener("scan_session_update", async () => {
      await loadCurrent();
    });

    es.addEventListener("scan_session_closed", () => {
      setSession(null);
    });

    es.addEventListener("ping", () => {
      setConnected(true);
    });

    return () => {
      try {
        es.close();
      } catch {}
      esRef.current = null;
      setConnected(false);
    };
  }, [loadCurrent]);

  return {
    loading,
    connected,
    session,
    refresh: loadCurrent,
  };
}