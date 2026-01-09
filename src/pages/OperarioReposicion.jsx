import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchReposicion } from "../slices/reposicionSlice";

export default function OperarioReposicion() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, status, error } = useSelector((state) => state.reposicion);
  const authDispatch = useDispatch(); // lo usamos como ctx.dispatch para apiFetch (mismo dispatch)

  useEffect(() => {
    dispatch(fetchReposicion({ dispatch: authDispatch, navigate }));
  }, [dispatch, authDispatch, navigate]);

  if (status === "loading") {
    return (
      <div className="container py-4">
        <h1>Reposición</h1>
        <p>Cargando…</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="container py-4">
        <h1>Reposición</h1>
        <p style={{ color: "red" }}>{error || "Error"}</p>
        <button onClick={() => dispatch(fetchReposicion({ dispatch: authDispatch, navigate }))}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1>Reposición</h1>

      {items.length === 0 ? (
        <p>No hay alertas de reposición.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Nivel</th>
                <th>Stock en evento</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.id}>
                  <td>{x.producto_nombre || x.nombre_snapshot || x.producto_id}</td>
                  <td>{x.nivel}</td>
                  <td>{x.stock_en_evento}</td>
                  <td>{x.created_at ? new Date(x.created_at).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
