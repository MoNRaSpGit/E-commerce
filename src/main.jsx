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


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("SW registrado:", reg.scope);
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
