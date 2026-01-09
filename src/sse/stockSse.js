// frontend/src/sse/stockSse.js
import { connectSse } from "./sseClient";

const API = import.meta.env.VITE_API_URL;

export function connectStock({ token, onPing, onStockUpdate, onOpen, onError }) {
  return connectSse({
    baseUrl: API,
    path: "/api/stock/stream",
    token,
    onOpen,
    onError,
    handlers: {
      ping: onPing,
      stock_update: onStockUpdate,
    },
  });
}
