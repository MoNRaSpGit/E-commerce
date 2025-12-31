import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectIsAuthed } from "../slices/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const TOAST_AFK = "afk-logout";

export default function useAfkLogout({ minutes = 15 } = {}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthed);

  const timerRef = useRef(null);
  const timeoutMs = minutes * 60 * 1000;

  useEffect(() => {
    const options = { passive: true }; // ✅ mismas options para add/remove

    const clear = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    const arm = () => {
      clear();
      if (!isAuthed) return;

      timerRef.current = setTimeout(() => {
        dispatch(logout());

        toast.dismiss(TOAST_AFK);
        toast("Sesión cerrada por inactividad", {
          id: TOAST_AFK,
          icon: "⏳",
          duration: 3000,
        });

        navigate("/login");
      }, timeoutMs);
    };

    const onActivity = () => {
      if (!isAuthed) return;
      arm();
    };

    if (!isAuthed) {
      clear();
      return;
    }

    arm();

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, onActivity, options));

    return () => {
      clear();
      events.forEach((ev) => window.removeEventListener(ev, onActivity, options));
    };
  }, [dispatch, navigate, isAuthed, timeoutMs]);
}
