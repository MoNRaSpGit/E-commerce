const SW_VERSION = "v4"; // bump cuando deployes cambios del SW

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim())
);

// ✅ usuario activo en este navegador (seteado desde la app via postMessage)
let ACTIVE_USER_ID = null;

self.addEventListener("message", (event) => {
  const msg = event.data || {};
  if (msg.type === "ECO_SET_ACTIVE_USER") {
    ACTIVE_USER_ID = msg.userId ?? null;
  }
});

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Notificación", body: event.data?.text() };
  }

  const title = data.title || "Almacen Piloto";
  const options = {
    body: data.body || "Tenés una nueva notificación",
    icon: new URL("pwa-192.png", self.registration.scope).href,
    badge: new URL("badge.png", self.registration.scope).href,

    // ✅ desktop: ayuda a que no se “pierda” en background
    tag: data.tag || "eco-push",
    renotify: true,
    requireInteraction: true,

    data,
  };

  event.waitUntil(
    (async () => {
      // ✅ si viene targetUserId, solo mostramos si coincide con el usuario activo del navegador
      if (data?.targetUserId != null) {
        if (
          !ACTIVE_USER_ID ||
          String(ACTIVE_USER_ID) !== String(data.targetUserId)
        ) {
          return; // ignorar noti que no corresponde al usuario activo
        }
      }

      await self.registration.showNotification(title, options);
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.includes("#") && "focus" in client) {
            return client.focus();
          }
        }

        const target = event.notification?.data?.url || "#/productos";
        const base = self.registration.scope; // ej: http://localhost:5173/E-commerce/
        if (clients.openWindow) {
          return clients.openWindow(base + target);
        }
      })
  );
});
