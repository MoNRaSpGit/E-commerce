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
  const res = await apiFetch("/push/vapid-public-key");
  if (!res.ok) throw new Error("No se pudo obtener VAPID key");

  const publicKey = res.publicKey;

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
  await apiFetch("/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });

  return true;
}

export async function testPushMe() {
  const res = await apiFetch("/push/test/me", { method: "POST" });
  if (!res.ok) throw new Error(res.error || "No se pudo enviar push");
  return res;
}
