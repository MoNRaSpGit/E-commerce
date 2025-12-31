// src/services/apiFetch.js
import { logout, setAuth } from "../slices/authSlice";
import { showSessionExpiredToast } from "../utils/toastSession";

const STORAGE_KEY = "eco_auth";
function clearAuthStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { }
}


// --- Storage helpers ---
function readAuthStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeAuthStorage(next) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: next.user ?? null,
        accessToken: next.accessToken ?? null,
        refreshToken: next.refreshToken ?? null,
      })
    );
  } catch { }
}

// --- Refresh lock (evita 5 refresh simultáneos) ---
let refreshPromise = null;

async function refreshAccessToken({ apiBaseUrl, refreshToken }) {
  const res = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.ok || !data?.accessToken) {
    return { ok: false, error: data?.error || "Refresh inválido" };
  }

  // backend devuelve: { ok:true, accessToken, user }
  return { ok: true, accessToken: data.accessToken, user: data.user };
}

/**
 * apiFetch
 * - agrega Authorization automáticamente si hay accessToken
 * - si 401: intenta refresh (1 vez) y reintenta la request
 * - si refresh falla: logout + toast único + redirect
 *
 * Uso recomendado:
 *   const res = await apiFetch("/api/pedidos/mios", {}, { dispatch, navigate });
 *   const data = await res.json();
 */
export async function apiFetch(path, options = {}, ctx = {}) {
  const apiBaseUrl = import.meta.env.VITE_API_URL;
  const dispatch = ctx.dispatch; // requerido si querés auto-logout/setAuth
  const navigate = ctx.navigate; // opcional para redirigir
  const onForbidden = ctx.onForbidden; // opcional (403)
  const shouldAuth = ctx.auth !== false; // por defecto true

  // 1) leer tokens desde storage (fuente de verdad)
  const stored = readAuthStorage();
  const accessToken = stored?.accessToken || null;
  const refreshToken = stored?.refreshToken || null;

  // 2) armar headers
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (shouldAuth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // 3) hacer request
  const doRequest = () =>
    fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
    });

  let res = await doRequest();

  // 4) 403 => sin permisos (NO logout)
  if (res.status === 403) {
    if (typeof onForbidden === "function") onForbidden();
    return res;
  }

  // 5) si no es 401, devolver
  if (res.status !== 401) return res;

  // 6) si 401 y no hay refresh token => logout directo
  if (!refreshToken || !dispatch) {
    clearAuthStorage(); // ✅ evita que Navbar muestre user/rol viejo
    return res;
  }

  // 7) intentar refresh con lock (solo 1 refresh a la vez)
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const r = await refreshAccessToken({ apiBaseUrl, refreshToken });
      return r;
    })().finally(() => {
      // liberar lock
      refreshPromise = null;
    });
  }

  const refreshed = await refreshPromise;

  if (!refreshed.ok) {
    // refresh falló => limpiar sesión global
    clearAuthStorage(); // ✅ extra seguridad
    dispatch(logout());
    showSessionExpiredToast();
    if (typeof navigate === "function") navigate("/login");
    return res;
  }

  // 8) refresh OK => actualizar storage + redux
  const nextAuth = {
    user: refreshed.user ?? stored?.user ?? null,
    accessToken: refreshed.accessToken,
    refreshToken: refreshToken, // en tu backend NO rota, así que se mantiene
  };

  writeAuthStorage(nextAuth);
  dispatch(setAuth(nextAuth));

  // 9) reintentar request original con nuevo access token
  headers.set("Authorization", `Bearer ${refreshed.accessToken}`);
  res = await doRequest();
  return res;
}
