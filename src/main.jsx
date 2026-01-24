// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import "./styles/modal.css";

import App from "./App";
import { store } from "./store/store";

// Bootstrap (solo CSS)
import "bootstrap/dist/css/bootstrap.min.css";

// Estilos propios (control total)
import "./styles/globals.css";
import "./styles/layout.css";

// ✅ Registrar Service Worker (soporta base /E-commerce/)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((reg) => {
        console.log("SW registrado:", reg.scope);

        // ✅ SOLO en producción: detectar actualización del SW
        if (import.meta.env.PROD) {
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                console.log("SW actualizado, recargando para aplicar cambios…");
                window.location.reload();
              }
            });
          });
        }
      })
      .catch((err) => {
        console.error("SW error:", err);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <HashRouter>
        <App />
      </HashRouter>
    </Provider>
  </React.StrictMode>
);
