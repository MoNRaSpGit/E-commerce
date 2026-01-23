import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/apiFetch";
import { connectPedidosStaff } from "../sse/pedidosSse";
import { fetchReposicion } from "../slices/reposicionSlice";



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
  const sseConnRef = useRef(null);
  const resyncLockRef = useRef(false);

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
  // SSE: pedidos en tiempo real (staff: operario/admin)

  const safeParseEvent = (e) => {
    try {
      return JSON.parse(e?.data || "{}");
    } catch {
      return null;
    }
  };

  const upsertPedido = (prev, pedido) => {
    if (!pedido?.id) return prev;
    const idNum = Number(pedido.id);
    const idx = prev.findIndex((x) => Number(x.id) === idNum);

    if (idx === -1) return [pedido, ...prev];

    const copy = prev.slice();
    copy[idx] = { ...copy[idx], ...pedido };
    return copy;
  };

  const patchPedidoEstado = (prev, pedidoId, estado, updated_at) => {
    const idNum = Number(pedidoId);
    const idx = prev.findIndex((x) => Number(x.id) === idNum);
    if (idx === -1) return null;

    const copy = prev.slice();
    copy[idx] = {
      ...copy[idx],
      estado: estado ?? copy[idx].estado,
      ...(updated_at ? { updated_at } : {}),
    };
    return copy;
  };




  /* Usefect del SEE*/

  useEffect(() => {
    if (!canSee) return;
    if (!accessToken) return;

    setSseStatus("connecting");

    const onPedidoCreado = (e) => {
      if (updatingIdRef.current) return;

      const payload = safeParseEvent(e);
      if (!payload?.pedidoId) return;

      const nuevoEstado = payload.estado || "pendiente";
      if (estadoFilter && estadoFilter !== nuevoEstado) return;

      const nuevo = {
        id: Number(payload.pedidoId),
        usuario_id: payload.usuarioId ? Number(payload.usuarioId) : null,
        usuario_email: payload.usuarioEmail || null,
        nombre: payload.nombre || null,
        estado: nuevoEstado,
        total: payload.total ?? 0,
        moneda: payload.moneda || "UYU",
        created_at: payload.created_at || null,
        updated_at: payload.updated_at || null,
      };

      setRows((prev) => upsertPedido(prev, nuevo));
    };

    const onPedidoEstado = (e) => {
      if (updatingIdRef.current) return;

      const payload = safeParseEvent(e);
      if (!payload?.pedidoId) return;

      setRows((prev) => {
        const next = patchPedidoEstado(
          prev,
          payload.pedidoId,
          payload.estado,
          payload.updated_at
        );

        if (!next) {
          if (!reloadTimerRef.current) {
            reloadTimerRef.current = setTimeout(() => {
              load();
              reloadTimerRef.current = null;
            }, 200);
          }
          return prev;
        }

        if (estadoFilter && payload.estado && payload.estado !== estadoFilter) {
          return next.filter((p) => Number(p.id) !== Number(payload.pedidoId));
        }

        return next;
      });
    };

    const conn = connectPedidosStaff({
      token: accessToken,
      onOpen: () => setSseStatus("connected"),
      onPing: () => setSseStatus("connected"),
      onPedidoCreado,
      onPedidoEstado,
      onReposicionUpdate: () => dispatch(fetchReposicion()),
      onError: () => {
        setSseStatus("reconnecting");
        // No fetch acá: el resume se encarga del resync
      },
    });

    sseConnRef.current = conn;

    return () => {
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = null;
      }

      sseConnRef.current = null;
      conn.close();
      setSseStatus("idle");
    };
  }, [canSee, accessToken, estadoFilter, load, dispatch, navigate]);


  const resyncLockRef = useRef(false);

  useEffect(() => {
    if (!canSee) return;
    if (!accessToken) return;

    const resync = () => {
      if (updatingIdRef.current) return;
      if (resyncLockRef.current) return;

      resyncLockRef.current = true;
      setTimeout(() => {
        resyncLockRef.current = false;
      }, 600);

      sseConnRef.current?.reconnect?.();
      load();
    };

    const onVis = () => {
      if (document.visibilityState === "visible") resync();
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", resync);
    window.addEventListener("pageshow", resync);
    window.addEventListener("online", resync);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", resync);
      window.removeEventListener("pageshow", resync);
      window.removeEventListener("online", resync);
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
