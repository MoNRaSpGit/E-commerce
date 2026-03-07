import { useCallback, useMemo, useState } from "react";
import { apiFetch } from "../../services/apiFetch";

export function useAdminDesclasificados({ user, isAuthed, dispatch, navigate }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canSee = useMemo(() => {
    return isAuthed && user?.rol === "admin";
  }, [isAuthed, user]);

  const load = useCallback(async () => {
    if (!canSee) {
      setRows([]);
      setError("Sin permisos para ver este panel.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await apiFetch(
        "/api/desclasificados",
        { method: "GET" },
        { dispatch, navigate }
      );

      const data = await res.json().catch(() => null);

      if (res.status === 401) return;
      if (!res.ok || !data?.ok) {
        setRows([]);
        setError(data?.error || "No se pudo cargar la lista de desclasificados");
        return;
      }

      setRows(Array.isArray(data.data) ? data.data : []);
    } catch {
      setRows([]);
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, [canSee, dispatch, navigate]);

  return {
    canSee,
    rows,
    setRows,
    loading,
    error,
    load,
  };
}