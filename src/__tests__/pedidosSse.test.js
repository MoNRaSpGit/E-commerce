import { describe, it, expect, beforeEach, vi } from "vitest";
import { connectSse } from "../sse/sseClient";
import { connectPedidosStaff, connectPedidosMios } from "../sse/pedidosSse";

vi.mock("../sse/sseClient", () => ({
    connectSse: vi.fn(),
}));

describe("pedidosSse", () => {
    beforeEach(() => {
        vi.resetAllMocks();

    });

    it("connectPedidosStaff: llama connectSse con path staff y handlers (ping/pedido_creado/pedido_estado)", () => {
        const token = "TOKEN_1";
        const onPing = vi.fn();
        const onPedidoCreado = vi.fn();
        const onPedidoEstado = vi.fn();
        const onOpen = vi.fn();
        const onError = vi.fn();

        const fakeConn = { close: vi.fn() };
        connectSse.mockReturnValue(fakeConn);

        const res = connectPedidosStaff({
            token,
            onPing,
            onPedidoCreado,
            onPedidoEstado,
            onOpen,
            onError,
        });

        expect(connectSse).toHaveBeenCalledTimes(1);

        const args = connectSse.mock.calls[0][0];
        expect(typeof args.baseUrl).toBe("string");
        expect(args.baseUrl).toMatch(/^https?:\/\//);
        expect(args.path).toBe("/api/pedidos/stream");
        expect(args.token).toBe(token);
        expect(args.onOpen).toBe(onOpen);
        expect(args.onError).toBe(onError);

        // handlers correctos
        expect(args.handlers).toMatchObject({
            ping: onPing,
            pedido_creado: onPedidoCreado,
            pedido_estado: onPedidoEstado,
        });

        // devuelve lo mismo que connectSse
        expect(res).toBe(fakeConn);
    });

    it("connectPedidosMios: llama connectSse con path mios y handlers (pedido_creado/pedido_estado)", () => {
        const token = "TOKEN_2";
        const onPedidoCreado = vi.fn();
        const onPedidoEstado = vi.fn();
        const onOpen = vi.fn();
        const onError = vi.fn();

        const fakeConn = { close: vi.fn() };
        connectSse.mockReturnValue(fakeConn);

        const res = connectPedidosMios({
            token,
            onPedidoCreado,
            onPedidoEstado,
            onOpen,
            onError,
        });

        expect(connectSse).toHaveBeenCalledTimes(1);

        const args = connectSse.mock.calls[0][0];
        expect(typeof args.baseUrl).toBe("string");
        expect(args.baseUrl).toMatch(/^https?:\/\//);
        expect(args.path).toBe("/api/pedidos/mios/stream");
        expect(args.token).toBe(token);
        expect(args.onOpen).toBe(onOpen);
        expect(args.onError).toBe(onError);

        expect(args.handlers).toMatchObject({
            pedido_creado: onPedidoCreado,
            pedido_estado: onPedidoEstado,
        });

        // y NO debería tener ping en mios
        expect(args.handlers.ping).toBeUndefined();

        expect(res).toBe(fakeConn);
    });
});
