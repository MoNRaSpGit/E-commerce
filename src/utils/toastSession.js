import toast from "react-hot-toast";

export const TOAST_SESSION_EXPIRED = "session-expired";

export function showSessionExpiredToast() {
  toast.dismiss(TOAST_SESSION_EXPIRED); // por si quedó uno viejo
  toast.error("Tu sesión expiró. Iniciá sesión de nuevo.", {
    id: TOAST_SESSION_EXPIRED, // ✅ evita duplicados
    duration: 3500,            // ✅ que se vaya sí o sí
  });
}

export function clearSessionToasts() {
  toast.dismiss(TOAST_SESSION_EXPIRED);
}
