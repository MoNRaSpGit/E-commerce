import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectIsAuthed, selectUser } from "../slices/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { unlinkPushServerSide } from "../services/pushClient";


const LAST_ACTIVITY_KEY = "eco_last_activity_at";

export default function useAfkLogout({ minutes = 10, offlineMinutes = 20 } = {}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthed);
  const user = useSelector(selectUser);


  const timerRef = useRef(null);
  const timeoutMs = minutes * 60 * 1000;              // app abierta
  const offlineTimeoutMs = offlineMinutes * 60 * 1000; // al volver a abrir

  useEffect(() => {
    const clear = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    const setLastActivityNow = () => {
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      } catch { }
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

    const doLogout = async () => {
      try {
        // ✅ igual que logout manual: cortar pushes del user anterior
        await unlinkPushServerSide();
      } catch (e) {
        console.warn("[push] unlink server-side (AFK) failed:", e?.message || e);
      }

      dispatch(logout());
      toast("Sesión cerrada por inactividad", { icon: "⏳" });
      navigate("/login");
    };


    const checkExpired = (limitMs = timeoutMs) => {
      const last = getLastActivity();
      if (!last) return false;
      const elapsed = Date.now() - last;
      if (elapsed >= limitMs) {
        doLogout();
        return true;
      }
      return false;
    };


    const arm = () => {
      clear();
      if (!isAuthed) return;

      // setear actividad inicial si no hay
      //if (!getLastActivity()) setLastActivityNow();

      // si ya venció (mobile volvió de background), cerrar
      //if (checkExpired()) return;

      // programar timeout restante
      let last = getLastActivity();
      if (!last) {
        setLastActivityNow();
        last = getLastActivity();
      }
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

    if (!isAuthed || user?.role !== "cliente") {
      clear();
      return;
    }

    // arrancar
    // ✅ NO pisar lastActivity al montar: primero validar si ya venció
    const last = getLastActivity();
    if (!last) {
      setLastActivityNow();
    } else {
      // ✅ al iniciar, usamos el límite "offline"
      if (checkExpired(offlineTimeoutMs)) return;
    }
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
  }, [dispatch, navigate, isAuthed, timeoutMs, offlineTimeoutMs]);
}
