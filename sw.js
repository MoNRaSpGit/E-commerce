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

    icon: self.registration.scope + "pwa-192.png",
    badge: self.registration.scope + "pwa-192.png",

    // ✅ PRO desktop: que no desaparezca al toque (Windows suele respetarlo)
    requireInteraction: true,

    // ✅ evita spam: reemplaza la noti anterior de “staff”
    tag: data.tag || (data.type ? `eco_${data.type}` : "eco_staff"),
    renotify: true,

    // ✅ que Windows no la marque como silenciosa
    silent: false,

    data: {
      ...data,
      url: data.url || "#/operario/pedidos",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (list) => {
      const target = event.notification?.data?.url || "#/productos";
      const base = self.registration.scope; // ej: http://localhost:5173/E-commerce/

      for (const client of list) {
        if ("focus" in client) {
          await client.focus();

          if ("navigate" in client) {
            try {
              await client.navigate(base + target);
            } catch { }
          }

          return;
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(base + target);
      }
    })
  );

});
