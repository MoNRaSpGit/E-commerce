import { useEffect } from "react";
import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import useAfkLogout from "./hooks/useAfkLogout";

export default function App() {
  useAfkLogout({ minutes: 10, offlineMinutes: 20 });

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
