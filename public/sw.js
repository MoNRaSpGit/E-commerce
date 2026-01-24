






// v1: bump esto cuando cambies el SW
const SW_VERSION = "v2";

self.addEventListener("install", () => {
  console.log("[sw] install", SW_VERSION);
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[sw] activate", SW_VERSION);
  event.waitUntil(self.clients.claim());
});



self.addEventListener("push", (event) => {
  console.log("[sw] push received", SW_VERSION, {
    hasData: !!event.data,
  });

  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Notificación", body: event.data?.text() };
  }

  const title = data.title || "Almacen Piloto";
  const options = {
    body: data.body || data.message || "Tenés una nueva notificación",
    icon: self.registration.scope + "pwa-192.png",
    badge: self.registration.scope + "pwa-192.png",


    data,
  };
   console.log("[sw] push payload", data);
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
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
