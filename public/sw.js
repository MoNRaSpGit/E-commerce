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
    icon: self.registration.scope + "icon-192.png",
    badge: self.registration.scope + "icon-192.png",
    requireInteraction: true, // 🔥 para que en desktop NO se “pierda”

    data,
  };

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
