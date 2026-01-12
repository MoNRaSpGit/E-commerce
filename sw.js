self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Notificación", body: event.data?.text() };
  }

  const title = data.title || "E-commerce Demo";
  const options = {
    body: data.body || "Tenés una nueva notificación",
    icon: "/icon-192.png", // opcional, después si querés lo agregamos
    badge: "/icon-192.png",
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
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});
