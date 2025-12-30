import { apiFetch } from "../../services/apiFetch";

export async function fetchProductosAdmin({ dispatch, navigate }) {
  const res = await apiFetch(
    "/api/productos/admin",
    { method: "GET" },
    { dispatch, navigate }
  );

  const data = await res.json().catch(() => null);
  return { res, data };
}

export async function patchProducto({ id, payload, dispatch, navigate }) {
  const res = await apiFetch(
    `/api/productos/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    { dispatch, navigate }
  );

  const data = await res.json().catch(() => null);
  return { res, data };
}
