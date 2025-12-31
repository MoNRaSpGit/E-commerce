// src/sse/sseClient.js
/**
 * connectSse
 * Wrapper genérico para EventSource:
 * - arma URL con token por query
 * - registra listeners por evento
 * - maneja onOpen / onError
 * - cleanup prolijo
 */
export function connectSse({ baseUrl, path, token, handlers = {}, onOpen, onError }) {
  const url =
    `${baseUrl}${path}` +
    (token ? `?token=${encodeURIComponent(token)}` : "");

  const es = new EventSource(url);

  if (typeof onOpen === "function") es.onopen = onOpen;
  if (typeof onError === "function") es.onerror = onError;

  // registrar eventos personalizados
  const entries = Object.entries(handlers).filter(([, fn]) => typeof fn === "function");
  for (const [eventName, fn] of entries) {
    es.addEventListener(eventName, fn);
  }

  return {
    close() {
      // cleanup listeners + cerrar
      for (const [eventName, fn] of entries) {
        es.removeEventListener(eventName, fn);
      }
      es.close();
    },
  };
}
