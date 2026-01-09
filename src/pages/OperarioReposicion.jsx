import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchReposicion } from "../slices/reposicionSlice";

import ReposicionCard from "../components/ReposicionCard";


import { connectPedidosStaff } from "../sse/pedidosSse";
import { selectAuth, selectIsAuthed } from "../slices/authSlice";


export default function OperarioReposicion() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, status, error } = useSelector((state) => state.reposicion);
  const isAuthed = useSelector(selectIsAuthed);
  const { accessToken } = useSelector(selectAuth);

  const authDispatch = useDispatch(); // lo usamos como ctx.dispatch para apiFetch (mismo dispatch)

  useEffect(() => {
    dispatch(fetchReposicion({ dispatch: authDispatch, navigate }));
  }, [dispatch, authDispatch, navigate]);

  useEffect(() => {
    if (!isAuthed || !accessToken) return;

    const conn = connectPedidosStaff({
      token: accessToken,
      onOpen: () => { },
      onPing: () => { },
      onPedidoCreado: () => { }, // no lo usamos acá
      onPedidoEstado: () => { }, // no lo usamos acá
      onReposicionUpdate: (e) => {
        // opcional debug:
        // console.log("reposicion_update:", e.data);
        dispatch(fetchReposicion({ dispatch: authDispatch, navigate }));
      },
      onError: () => { },
    });

    return () => conn?.close?.();
  }, [isAuthed, accessToken, dispatch, authDispatch, navigate]);


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
        <div className="repo-grid">
          {items.map((x) => (
            <ReposicionCard key={x.id} item={x} />
          ))}
        </div>
      )}

    </div>
  );
}
