import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setAuth } from "./slices/authSlice";

import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import useAfkLogout from "./hooks/useAfkLogout";

export default function App() {
  const dispatch = useDispatch();
  //useAfkLogout({ minutes: 0.1667, offlineMinutes: 0.3333 });




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

  return (
    <>
      <Toaster position="top-right" />
      <Navbar />
      <AppRoutes />
    </>
  );
}
