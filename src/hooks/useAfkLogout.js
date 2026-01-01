import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectIsAuthed } from "../slices/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const LAST_ACTIVITY_KEY = "eco_last_activity_at";

export default function useAfkLogout({ minutes = 15 } = {}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthed);

  const timerRef = useRef(null);
  const timeoutMs = minutes * 60 * 1000;

  useEffect(() => {
    const clear = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    const setLastActivityNow = () => {
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      } catch {}
    };

    const getLastActivity = () => {
      try {
        const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
        const n = raw ? Number(raw) : 0;
        return Number.isFinite(n) ? n : 0;
      } catch {
        return 0;
      }
    };

    const doLogout = () => {
      dispatch(logout());
      toast("Sesión cerrada por inactividad", { icon: "⏳" });
      navigate("/login");
    };

    const checkExpired = () => {
      const last = getLastActivity();
      if (!last) return false;
      const elapsed = Date.now() - last;
      if (elapsed >= timeoutMs) {
        doLogout();
        return true;
      }
      return false;
    };

    const arm = () => {
      clear();
      if (!isAuthed) return;

      // setear actividad inicial si no hay
      if (!getLastActivity()) setLastActivityNow();

      // si ya venció (mobile volvió de background), cerrar
      if (checkExpired()) return;

      // programar timeout restante
      const last = getLastActivity();
      const remaining = Math.max(0, timeoutMs - (Date.now() - last));

      timerRef.current = setTimeout(() => {
        doLogout();
      }, remaining);
    };

    const onActivity = () => {
      if (!isAuthed) return;
      setLastActivityNow();
      arm();
    };

    const onVisibilityOrFocus = () => {
      if (!isAuthed) return;
      // al volver a foco/visible, chequear vencimiento aunque timers se hayan congelado
      if (checkExpired()) return;
      arm();
    };

    if (!isAuthed) {
      clear();
      try {
        localStorage.removeItem(LAST_ACTIVITY_KEY);
      } catch {}
      return;
    }

    // arrancar
    setLastActivityNow();
    arm();

    // actividad (desktop + mobile)
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    // mobile-safe: cuando vuelve del background
    document.addEventListener("visibilitychange", onVisibilityOrFocus);
    window.addEventListener("focus", onVisibilityOrFocus);

    return () => {
      clear();
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
      window.removeEventListener("focus", onVisibilityOrFocus);
    };
  }, [dispatch, navigate, isAuthed, timeoutMs]);
}
