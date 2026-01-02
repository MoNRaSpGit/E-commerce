// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { connectSse } from "../sse/sseClient";

describe("sseClient - connectSse", () => {
    let esMock;

    beforeEach(() => {
        esMock = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            close: vi.fn(),
            onopen: null,
            onerror: null,
        };

        // mock global EventSource (debe ser "constructible" porque el código usa `new EventSource()`)
        global.EventSource = function (url) {
            global.EventSource._lastUrl = url; // guardamos la URL para asserts
            return esMock;
        };
    });

    it("crea EventSource con url correcta sin token", () => {
        connectSse({
            baseUrl: "http://api.test",
            path: "/stream",
        });

        expect(global.EventSource._lastUrl).toBe("http://api.test/stream");
    });

    it("crea EventSource con url correcta con token", () => {
        connectSse({
            baseUrl: "http://api.test",
            path: "/stream",
            token: "ABC 123",
        });

        expect(global.EventSource._lastUrl).toBe("http://api.test/stream?token=ABC%20123");
    });

    it("registra handlers de eventos personalizados", () => {
        const onPing = vi.fn();
        const onPedido = vi.fn();

        connectSse({
            baseUrl: "http://api.test",
            path: "/stream",
            handlers: {
                ping: onPing,
                pedido_creado: onPedido,
                invalido: null, // no debería registrarse
            },
        });

        expect(esMock.addEventListener).toHaveBeenCalledTimes(2);
        expect(esMock.addEventListener).toHaveBeenCalledWith("ping", onPing);
        expect(esMock.addEventListener).toHaveBeenCalledWith(
            "pedido_creado",
            onPedido
        );
    });

    it("asigna onOpen y onError si se pasan", () => {
        const onOpen = vi.fn();
        const onError = vi.fn();

        connectSse({
            baseUrl: "http://api.test",
            path: "/stream",
            onOpen,
            onError,
        });

        expect(esMock.onopen).toBe(onOpen);
        expect(esMock.onerror).toBe(onError);
    });

    it("close(): remueve listeners y cierra EventSource", () => {
        const onPing = vi.fn();
        const onPedido = vi.fn();

        const conn = connectSse({
            baseUrl: "http://api.test",
            path: "/stream",
            handlers: {
                ping: onPing,
                pedido_estado: onPedido,
            },
        });

        conn.close();

        expect(esMock.removeEventListener).toHaveBeenCalledWith("ping", onPing);
        expect(esMock.removeEventListener).toHaveBeenCalledWith(
            "pedido_estado",
            onPedido
        );
        expect(esMock.close).toHaveBeenCalledTimes(1);
    });
});
