import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/apiFetch";



const ESTADOS = ["pendiente", "en_proceso", "listo", "cancelado"];

export function useOperarioPedidos({ user, isAuthed, accessToken, dispatch, navigate }) {
  const [estadoFilter, setEstadoFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Detalle modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [detail, setDetail] = useState(null);
  const reloadTimerRef = useRef(null);
  const [sseStatus, setSseStatus] = useState("idle");
  // idle | connecting | connected | reconnecting | error

  const updatingIdRef = useRef(null);
  useEffect(() => {
    updatingIdRef.current = updatingId;
  }, [updatingId]);

  const canSee = useMemo(() => {
    const rol = user?.rol;
    return rol === "operario" || rol === "admin";
  }, [user]);

  const guard = useCallback(() => {
    if (!isAuthed || !accessToken) {
      toast.error("Tenés que iniciar sesión");
      navigate("/login");
      return false;
    }
    if (!canSee) {
      toast.error("Sin permisos");
      navigate("/productos");
      return false;
    }
    return true;
  }, [isAuthed, accessToken, canSee, navigate]);

  const load = useCallback(async () => {
    if (!guard()) return;

    try {
      setLoading(true);
      setError(null);

      const qs = estadoFilter ? `?estado=${encodeURIComponent(estadoFilter)}` : "";
      const res = await apiFetch(
        `/api/pedidos${qs}`,
        { method: "GET" },
        {
          dispatch,
          navigate,
          onForbidden: () => {
            toast.error("Sin permisos");
            navigate("/productos");
          },
        }
      );

      const data = await res.json().catch(() => null);

      // Si apiFetch hizo logout por refresh fallido, puede quedar 401
      if (res.status === 401) return;

      if (!res.ok || !data?.ok) {
        setError(data?.error || "No se pudieron cargar los pedidos");
        return;
      }

      setRows(Array.isArray(data.data) ? data.data : []);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, [guard, estadoFilter, dispatch, navigate]);

  const cambiarEstado = useCallback(
    async (pedidoId, estado) => {
      if (!guard()) return;
      if (updatingId) return;

      try {
        setUpdatingId(pedidoId);

        const res = await apiFetch(
          `/api/pedidos/${pedidoId}/estado`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado }),
          },
          {
            dispatch,
            navigate,
            onForbidden: () => {
              toast.error("Sin permisos");
              navigate("/productos");
            },
          }
        );

        const data = await res.json().catch(() => null);

        if (res.status === 401) return; // apiFetch ya manejó logout/toast/redirect si correspondía

        if (!res.ok || !data?.ok) {
          toast.error(data?.error || "No se pudo actualizar");
          return;
        }

        toast.success(`Pedido #${pedidoId} → ${estado}`);
        setRows((prev) => prev.map((p) => (p.id === pedidoId ? { ...p, estado } : p)));
      } catch {
        toast.error("No se pudo conectar con el servidor");
      } finally {
        setUpdatingId(null);
      }
    },
    [guard, updatingId, dispatch, navigate]
  );

  const archivarPedido = useCallback(
    async (pedidoId) => {
      if (!guard()) return;
      if (updatingId) return;

      try {
        setUpdatingId(pedidoId);

        const res = await apiFetch(
          `/api/pedidos/${pedidoId}/archivar`,
          { method: "PATCH" },
          {
            dispatch,
            navigate,
            onForbidden: () => {
              toast.error("Sin permisos");
              navigate("/productos");
            },
          }
        );

        const data = await res.json().catch(() => null);

        if (res.status === 401) return;

        if (!res.ok || !data?.ok) {
          toast.error(data?.error || "No se pudo archivar");
          return;
        }

        toast.success(`Pedido #${pedidoId} archivado`);

        // ✅ sacarlo localmente (para que se note ya)
        setRows((prev) => prev.filter((p) => p.id !== pedidoId));
      } catch {
        toast.error("No se pudo conectar con el servidor");
      } finally {
        setUpdatingId(null);
      }
    },
    [guard, updatingId, dispatch, navigate]
  );



  const openDetalle = useCallback(
    async (pedidoId) => {
      if (!guard()) return;

      setDetailOpen(true);
      setDetailLoading(true);
      setDetailError(null);
      setDetail(null);

      try {
        const res = await apiFetch(
          `/api/pedidos/${pedidoId}`,
          { method: "GET" },
          {
            dispatch,
            navigate,
            onForbidden: () => {
              toast.error("Sin permisos");
              navigate("/productos");
            },
          }
        );

        const data = await res.json().catch(() => null);

        if (res.status === 401) return;

        if (!res.ok || !data?.ok) {
          setDetailError(data?.error || "No se pudo cargar el detalle");
          return;
        }

        setDetail(data.data);
      } catch {
        setDetailError("No se pudo conectar con el servidor");
      } finally {
        setDetailLoading(false);
      }
    },
    [guard, dispatch, navigate]
  );

  const closeDetalle = useCallback(() => {
    setDetailOpen(false);
    setDetail(null);
    setDetailError(null);
  }, []);

  // Load inicial + al cambiar filtro / rol
  useEffect(() => {
    load();
  }, [load]);

  // SSE: pedidos en tiempo real (usa accessToken por query param)
  useEffect(() => {
    if (!canSee) return;
    if (!accessToken) return;

    setSseStatus("connecting");

    const url = `${import.meta.env.VITE_API_URL}/api/pedidos/stream?token=${encodeURIComponent(
      accessToken
    )}`;

    const es = new EventSource(url);

    // ✅ si abre la conexión
    es.onopen = () => {
      setSseStatus("connected");
    };

    // ✅ tu backend manda "ping", sirve para confirmar que está viva
    es.addEventListener("ping", () => {
      setSseStatus("connected");
    });

    const handleUpdate = () => {
      if (updatingIdRef.current) return;

      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }

      reloadTimerRef.current = setTimeout(() => {
        load();
        reloadTimerRef.current = null;
      }, 300);
    };

    es.addEventListener("pedido_creado", handleUpdate);
    es.addEventListener("pedido_estado", handleUpdate);

    // ✅ si se corta, EventSource reintenta solo
    es.onerror = async () => {
      setSseStatus("reconnecting");
      // ✅ fuerza refresh/logout si el token venció (apiFetch maneja todo)
      try {
        await apiFetch("/api/pedidos", { method: "GET" }, { dispatch, navigate });
      } catch { }
    };

    return () => {
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = null;
      }
      es.close();
      setSseStatus("idle");
    };
  }, [canSee, accessToken, load]);


  return {
    ESTADOS,
    canSee,


    estadoFilter,
    setEstadoFilter,

    loading,
    rows,
    error,

    updatingId,
    cambiarEstado,
    archivarPedido,

    load,

    // detalle
    detailOpen,
    detailLoading,
    detailError,
    detail,
    openDetalle,
    closeDetalle,
    sseStatus,
  };
}
