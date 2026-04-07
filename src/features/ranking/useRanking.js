import { useEffect, useState } from "react";
import { apiFetch } from "../../services/apiFetch";

export function useRanking({ dispatch, navigate, desde, hasta, enabled = true }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setData([]);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    async function load() {
      setLoading(true);

      try {
        let url = "/api/ranking/top";

        const params = new URLSearchParams();
        if (desde) params.append("desde", desde);
        if (hasta) params.append("hasta", hasta);

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const r = await apiFetch(url, { method: "GET" }, { dispatch, navigate });
        const json = await r.json();

        if (!cancelled && json?.ok) {
          setData(json.data || []);
        }
      } catch (err) {
        console.error("Error cargando ranking:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [dispatch, navigate, desde, hasta, enabled]);

  return { data, loading };
}
