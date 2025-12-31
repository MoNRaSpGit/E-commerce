// src/sse/pedidosSse.js
import { connectSse } from "./sseClient";

const API = import.meta.env.VITE_API_URL;

export function connectPedidosStaff({ token, onPing, onPedidoCreado, onPedidoEstado, onOpen, onError }) {
  return connectSse({
    baseUrl: API,
    path: "/api/pedidos/stream",
    token,
    onOpen,
    onError,
    handlers: {
      ping: onPing,
      pedido_creado: onPedidoCreado,
      pedido_estado: onPedidoEstado,
    },
  });
}

export function connectPedidosMios({ token, onPedidoCreado, onPedidoEstado, onOpen, onError }) {
  return connectSse({
    baseUrl: API,
    path: "/api/pedidos/mios/stream",
    token,
    onOpen,
    onError,
    handlers: {
      pedido_creado: onPedidoCreado,
      pedido_estado: onPedidoEstado,
    },
  });
}
