import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAuth, selectIsAuthed } from "./slices/authSlice";

import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import useAfkLogout from "./hooks/useAfkLogout";

export default function App() {
  const dispatch = useDispatch();
  //useAfkLogout({ minutes: 0.1667, offlineMinutes: 0.3333 });


  const isAuthed = useSelector(selectIsAuthed);




  // ✅ Rehidratar sesión desde localStorage (recordar cuenta)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("eco_auth");
      if (!raw) return;
      const saved = JSON.parse(raw);

      if (saved?.accessToken && saved?.refreshToken && saved?.user) {
        dispatch(setAuth(saved));
      }
    } catch { }
  }, [dispatch]);



  // 🔥 Warm-up backend (Render free)
  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_URL;
    if (!apiBaseUrl) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch(`${apiBaseUrl}/health`, {
      method: "GET",
      signal: controller.signal,
    })
      .catch(() => {
        // warm-up silencioso (no toast, no logs)
      })
      .finally(() => {
        clearTimeout(timeout);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);


  // ✅ Keep-alive de sesión: evita “logout por inactividad” manteniendo vivo el refresh
  useEffect(() => {
    if (!isAuthed) return;

    const apiBaseUrl = import.meta.env.VITE_API_URL;
    if (!apiBaseUrl) return;

    let alive = true;

    const tick = async () => {
      try {
        const raw = localStorage.getItem("eco_auth");
        if (!raw) return;
        const saved = JSON.parse(raw);
        const refreshToken = saved?.refreshToken;
        if (!refreshToken) return;

        const res = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        const data = await res.json().catch(() => null);
        if (!alive) return;

        if (res.ok && data?.ok && data?.accessToken) {
          dispatch(
            setAuth({
              user: data.user ?? saved.user ?? null,
              accessToken: data.accessToken,
              refreshToken,
            })
          );
        }
        // ⚠️ Si falla, NO deslogueamos (tu regla: solo manual).
        // Quedará “logueado” pero al primer request importante te va a saltar 401 igual.
        // Si querés, después hacemos un modal “Requiere re-login” sin auto-logout.
      } catch {
        // silencioso
      }
    };

    // cada 5 minutos
    const id = setInterval(tick, 5 * 60 * 1000);
    // y uno inmediato al montar
    tick();

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [dispatch, isAuthed]);

  return (
    <>
      <Toaster position="top-right" />
      <Navbar />
      <AppRoutes />
    </>
  );
}
