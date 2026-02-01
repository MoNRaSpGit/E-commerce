import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/apiFetch";

import { selectAuth, selectIsAuthed } from "../slices/authSlice";
import { useAdminProductos } from "../features/productos/useAdminProductos";

import ProductosAdminHeader from "../features/productos/ProductosAdminHeader";
import ProductosAdminTable from "../features/productos/ProductosAdminTable";
import ProductoEditModal from "../features/productos/ProductoEditModal";

import "../styles/adminProductos.css";

export default function AdminProductos() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isAuthed = useSelector(selectIsAuthed);
  const { user } = useSelector(selectAuth);

  const {
    canSee,
    loading,
    rows,
    setRows,
    error,
    load,

    open,
    saving,
    current,
    form,
    setField,
    openEdit,
    closeEdit,
    save,
  } = useAdminProductos({ user, isAuthed, dispatch, navigate });


  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const categorias = useMemo(
    () => [
      { value: "bebidas", label: "Bebidas" },
      { value: "almacen", label: "Almacén" },
      { value: "snacks", label: "Snacks" },
      { value: "galletitas", label: "Galletitas" },
      { value: "golosinas", label: "Golosinas" },
      { value: "congelados", label: "Congelados" },
      { value: "helados", label: "Helados" },
      { value: "lacteos", label: "Lácteos" },
      { value: "fiambres", label: "Fiambres" },
      { value: "panaderia", label: "Panadería" },
      { value: "limpieza", label: "Limpieza" },
      { value: "higiene_y_cuidados", label: "Higiene y cuidados" },
      { value: "medicamentos", label: "Medicamentos" },
      { value: "otros", label: "Otros" },
      { value: "mascotas", label: "Mascotas" },

    ],
    []
  );


  const subcategorias = useMemo(
    () => ({
      bebidas: [
        { value: "con_alcohol", label: "Con alcohol" },
        { value: "sin_alcohol", label: "Sin alcohol" },
      ],
      mascotas: [
        { value: "gato", label: "Gato" },
        { value: "perro", label: "Perro" },
      ],
      helados: [
        { value: "conaprole", label: "Conaprole" },
        { value: "crufi", label: "Crufi" },
      ],
    }),
    []
  );


  const requiereSub =
  categoria === "bebidas" ||
  categoria === "mascotas" ||
  categoria === "helados";




  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function guardarCategoriaMasiva() {
    if (!categoria) return toast.error("Elegí una categoría");
    if (requiereSub && !subcategoria) return toast.error("Elegí una subcategoría");
    if (selectedIds.size === 0) return toast.error("Seleccioná al menos 1 producto");


    try {
      const ids = Array.from(selectedIds);

      const res = await apiFetch(
        "/api/productos/categoria",
        {
          method: "PATCH",
          body: JSON.stringify({ categoria, subcategoria: requiereSub ? subcategoria : null, ids }),
        },
        { dispatch, navigate }
      );

      const data = await res.json().catch(() => null);

      if (res.status === 401) return; // apiFetch maneja logout/refresh
      if (!res.ok || !data?.ok) {
        return toast.error(data?.error || "No se pudo guardar la categoría");
      }

      toast.success("Categoría guardada");

      // ✅ actualizamos filas localmente para reflejarlo ya

      // rows viene del hook, pero no tenemos setRows acá.
      // Por ahora: recargar.
      // ✅ sacar de la lista visualmente los que ya se categorizaron
      const idsSet = new Set(ids);
      setRows((prev) => prev.filter((p) => !idsSet.has(p.id)));

      // limpiar selección (y opcionalmente resetear categoría)
      setSelectedIds(new Set());
      setSubcategoria("");

      // setCategoria(""); // opcional: si querés que se resetee el select

    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  }

  useEffect(() => {
    load({ onlyNoCategoria: true });
  }, [load]);



  if (!canSee) {
    return (
      <div className="container py-4">
        <div className="op-card">
          <p className="op-error">Sin permisos para ver este panel.</p>
        </div>
      </div>
    );
  }




  return (
    <div className="container py-4">
      <div className="adm-head">
        <h1 className="adm-title">Categorías de productos</h1>
        <button
          className="op-btn"
          type="button"
          onClick={() => load({ onlyNoCategoria: true })}
          disabled={loading}
        >
          Refrescar
        </button>
      </div>

      {loading ? (
        <div className="op-card">
          <p className="op-muted">Cargando productos...</p>
        </div>
      ) : error ? (
        <div className="op-card">
          <p className="op-error">{error}</p>
          <button
            className="op-btn"
            type="button"
            onClick={() => load({ onlyNoCategoria: true })}
          >
            Reintentar
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="op-card">
          <p className="op-muted">No hay productos para mostrar.</p>
        </div>
      ) : (
        <div className="op-card">
          <div className="adm-cat-bar">
            <label className="adm-cat-label">
              Categoría
              <select
                className="adm-cat-select"
                value={categoria}
                onChange={(e) => {
                  setCategoria(e.target.value);
                  setSubcategoria(""); // reset al cambiar macro
                  setSelectedIds(new Set()); // opcional: evita selecciones cruzadas
                }}
              >
                <option value="">Elegí una…</option>
                {categorias.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="adm-cat-label">
              Subcategoría
              <select
                className="adm-cat-select"
                value={subcategoria}
                onChange={(e) => setSubcategoria(e.target.value)}
                disabled={!requiereSub}
              >
                <option value="">
                  {requiereSub ? "Elegí una…" : "No aplica"}
                </option>

                {(subcategorias[categoria] || []).map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="op-btn"
              type="button"
              onClick={guardarCategoriaMasiva}
              disabled={loading}
            >
              Guardar ({selectedIds.size})
            </button>
          </div>



          <ProductosAdminTable
            rows={rows}
            onEdit={openEdit}
            selectable
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        </div>
      )}


      <ProductoEditModal
        open={open}
        saving={saving}
        current={current}
        form={form}
        setField={setField}
        onClose={closeEdit}
        onSave={save}
      />
    </div>
  );
}
