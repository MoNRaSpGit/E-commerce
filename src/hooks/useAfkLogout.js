import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectIsAuthed } from "../slices/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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

    const arm = () => {
      clear();
      if (!isAuthed) return;

      timerRef.current = setTimeout(() => {
        dispatch(logout());
        toast("Sesión cerrada por inactividad", { icon: "⏳" });
        navigate("/login");
      }, timeoutMs);
    };

    const onActivity = () => {
      // resetea timer ante cualquier actividad
      if (!isAuthed) return;
      arm();
    };

    // si no está logueado, no hacemos nada
    if (!isAuthed) {
      clear();
      return;
    }

    // arrancar timer inicial
    arm();

    // eventos de actividad (desktop + mobile)
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    return () => {
      clear();
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
    };
  }, [dispatch, navigate, isAuthed, timeoutMs]);
}
