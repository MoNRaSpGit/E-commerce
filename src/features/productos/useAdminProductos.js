import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { fetchProductosAdmin, patchProducto } from "../productos/productosAdminApi";   
export function useAdminProductos({ user, isAuthed, dispatch, navigate }) {
  const canSee = useMemo(() => {
    const rol = user?.rol;
    return rol === "admin" || rol === "operario";
  }, [user]);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  // modal
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    status: "pendiente", // tu enum actual: pendiente/activo
  });

  const guard = useCallback(() => {
    if (!isAuthed) {
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
  }, [isAuthed, canSee, navigate]);

  const load = useCallback(async () => {
    if (!guard()) return;

    try {
      setLoading(true);
      setError(null);

      const { res, data } = await fetchProductosAdmin({ dispatch, navigate });

      if (res.status === 401) return;
      if (!res.ok || !data?.ok) {
        setError(data?.error || "No se pudieron cargar los productos");
        return;
      }

      setRows(Array.isArray(data.data) ? data.data : []);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, [guard, dispatch, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = useCallback((p) => {
    setCurrent(p);
    setForm({
      name: p?.name ?? "",
      price: p?.price ?? "",
      status: p?.status ?? "pendiente",
    });
    setOpen(true);
  }, []);

  const closeEdit = useCallback(() => {
    setOpen(false);
    setSaving(false);
    setCurrent(null);
  }, []);

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = useCallback(async () => {
    if (!guard()) return;
    if (!current?.id) return;

    const cleanName = String(form.name || "").trim();
    if (cleanName.length < 2) return toast.error("Nombre inválido");

    const numPrice = Number(form.price);
    if (!Number.isFinite(numPrice) || numPrice < 0) return toast.error("Precio inválido");

    if (!["pendiente", "activo"].includes(form.status)) {
      return toast.error("Estado inválido");
    }

    try {
      setSaving(true);

      const payload = { name: cleanName, price: numPrice, status: form.status };
      const { res, data } = await patchProducto({
        id: current.id,
        payload,
        dispatch,
        navigate,
      });

      if (res.status === 401) return;

      if (!res.ok || !data?.ok) {
        toast.error(data?.error || "No se pudo guardar");
        return;
      }

      toast.success("Producto actualizado");

      setRows((prev) =>
        prev.map((x) => (x.id === current.id ? { ...x, ...payload } : x))
      );

      closeEdit();
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
    }
  }, [guard, current, form, dispatch, navigate, closeEdit]);

  return {
    canSee,
    loading,
    rows,
    error,
    load,

    // modal
    open,
    saving,
    current,
    form,
    setField,
    openEdit,
    closeEdit,
    save,
  };
}
