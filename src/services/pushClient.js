import { apiFetch } from "./apiFetch";

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const raw = window.atob(base64);
    return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export async function subscribeToPush() {
    if (!("serviceWorker" in navigator)) {
        throw new Error("Service Worker no soportado");
    }

    if (!("PushManager" in window)) {
        throw new Error("Push no soportado en este navegador");
    }

    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
        throw new Error("Permiso de notificaciones denegado");
    }

    // 1) pedir public key al backend
    const res = await apiFetch("/api/push/vapid-public-key", {}, { auth: false });
    if (!res.ok) throw new Error("No se pudo obtener VAPID key");

    const data = await res.json().catch(() => null);
    if (!data?.ok || !data?.publicKey) throw new Error("VAPID key inválida");

    const publicKey = data.publicKey;


    // 2) esperar SW
    const reg = await navigator.serviceWorker.ready;

    // 3) suscribirse (si ya existe, reutilizar)
    const existing = await reg.pushManager.getSubscription();

    const sub =
        existing ||
        (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

    // 4) mandar al backend
    const subRes = await apiFetch(
        "/api/push/subscribe",
        {
            method: "POST",
            body: JSON.stringify(sub),
        },
        { auth: true } // requiere auth
    );

    const subData = await subRes.json().catch(() => null);
    if (!subRes.ok || !subData?.ok) {
        throw new Error(subData?.error || "No se pudo guardar la suscripción");
    }


    return true;
}

export async function testPushMe() {
    const res = await apiFetch("/api/push/test/me", { method: "POST" }, { auth: true });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) throw new Error(data?.error || "No se pudo enviar push");
    return data;

}

export async function hasPushSubscription() {
  if (!("serviceWorker" in navigator)) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

export async function getCurrentPushEndpoint() {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return sub?.endpoint || null;
}

export async function unsubscribeFromPush() {
  const endpoint = await getCurrentPushEndpoint();
  if (!endpoint) return { ok: true, skipped: true };

  const res = await apiFetch(
    "/api/push/unsubscribe",
    {
      method: "POST",
      body: JSON.stringify({ endpoint }),
    },
    { auth: true }
  );

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || "No se pudo eliminar suscripción");
  }

  return data;
}



