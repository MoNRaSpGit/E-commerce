// src/sse/sseClient.js
/**
 * connectSse
 * Wrapper genérico para EventSource:
 * - arma URL con token por query
 * - registra listeners por evento
 * - maneja onOpen / onError
 * - auto-reconnect con backoff
 * - cleanup prolijo
 */
export function connectSse({
  baseUrl,
  path,
  token,
  handlers = {},
  onOpen,
  onError,
  autoReconnect = true,
  maxBackoffMs = 15000,
}) {
  const entries = Object.entries(handlers).filter(([, fn]) => typeof fn === "function");

  let es = null;
  let closed = false;
  let retryCount = 0;
  let retryTimer = null;

  const buildUrl = () =>
    `${baseUrl}${path}` + (token ? `?token=${encodeURIComponent(token)}` : "");

  const clearRetry = () => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  };

  const cleanupEs = () => {
    if (!es) return;
    for (const [eventName, fn] of entries) {
      es.removeEventListener(eventName, fn);
    }
    es.close();
    es = null;
  };

  const openEs = () => {
    if (closed) return;

    clearRetry();
    cleanupEs();

    const url = buildUrl();
    es = new EventSource(url);

    es.onopen = (ev) => {
      retryCount = 0;
      onOpen?.(ev);
    };

    es.onerror = (ev) => {
      onError?.(ev);

      if (!autoReconnect || closed) return;

      // si ya hay un retry pendiente, no programes otro
      if (retryTimer) return;

      const ms = Math.min(1000 * Math.pow(2, retryCount), maxBackoffMs);
      retryCount += 1;

      retryTimer = setTimeout(() => {
        retryTimer = null;
        openEs();
      }, ms);
    };


    for (const [eventName, fn] of entries) {
      es.addEventListener(eventName, fn);
    }
  };

  // primera conexión
  openEs();

  return {
    reconnect() {
      if (closed) return;
      retryCount = 0;
      openEs();
    },
    close() {
      closed = true;
      clearRetry();
      cleanupEs();
    },
  };
}
