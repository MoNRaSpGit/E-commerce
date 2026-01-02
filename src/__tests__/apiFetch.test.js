import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiFetch } from "../services/apiFetch";
import { logout, setAuth } from "../slices/authSlice";

vi.mock("../utils/toastSession", () => ({
    showSessionExpiredToast: vi.fn(),
}));

import { showSessionExpiredToast } from "../utils/toastSession";

const STORAGE_KEY = "eco_auth";

function setStorageAuth(value) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function getStorageAuth() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
}

function mockResponse(status, jsonBody = null) {
    return {
        status,
        ok: status >= 200 && status < 300,
        json: vi.fn(async () => jsonBody),
    };
}

describe("apiFetch", () => {
    beforeEach(() => {
        // base URL para tests
        // (en vitest + vite suele ser escribible)
        import.meta.env.VITE_API_URL = "http://api.test";

        localStorage.clear();
        vi.resetAllMocks();
        global.fetch = vi.fn();
    });

    it("agrega Authorization automáticamente si hay accessToken (auth=true por defecto)", async () => {
        setStorageAuth({
            user: { id: 1, email: "a@a.com" },
            accessToken: "ACCESS_1",
            refreshToken: "REFRESH_1",
        });

        global.fetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));

        await apiFetch("/api/productos", { method: "GET" });

        expect(global.fetch).toHaveBeenCalledTimes(1);

        const [url, opts] = global.fetch.mock.calls[0];
        expect(url).toBe("http://api.test/api/productos");
        expect(opts.headers.get("Authorization")).toBe("Bearer ACCESS_1");
    });

    it("si ctx.auth === false NO agrega Authorization (ej: login público)", async () => {
        setStorageAuth({
            user: null,
            accessToken: "ACCESS_1",
            refreshToken: "REFRESH_1",
        });

        global.fetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));

        await apiFetch(
            "/api/auth/login",
            { method: "POST", body: JSON.stringify({ email: "x", password: "y" }) },
            { auth: false }
        );

        const [, opts] = global.fetch.mock.calls[0];
        expect(opts.headers.get("Authorization")).toBe(null);
        // y Content-Type se setea solo si hay body
        expect(opts.headers.get("Content-Type")).toBe("application/json");
    });

    it("si 403 llama onForbidden y NO hace logout", async () => {
        setStorageAuth({
            user: { id: 1 },
            accessToken: "ACCESS_1",
            refreshToken: "REFRESH_1",
        });

        const onForbidden = vi.fn();
        global.fetch.mockResolvedValueOnce(mockResponse(403, { ok: false }));

        const res = await apiFetch("/api/admin", { method: "GET" }, { onForbidden });

        expect(res.status).toBe(403);
        expect(onForbidden).toHaveBeenCalledTimes(1);
        expect(showSessionExpiredToast).not.toHaveBeenCalled();
    });

    it("si 401 y NO hay refreshToken o NO hay dispatch => limpia storage y devuelve 401 (sin logout redux)", async () => {
        // caso: refreshToken null
        setStorageAuth({
            user: { id: 1 },
            accessToken: "ACCESS_1",
            refreshToken: null,
        });

        global.fetch.mockResolvedValueOnce(mockResponse(401, { ok: false }));

        const res = await apiFetch("/api/pedidos", { method: "GET" }, { dispatch: vi.fn() });

        expect(res.status).toBe(401);
        expect(localStorage.getItem(STORAGE_KEY)).toBe(null);
    });

    it("si 401 y refresh OK => reintenta con nuevo token, actualiza storage y dispara setAuth", async () => {
        setStorageAuth({
            user: { id: 7, email: "u@u.com" },
            accessToken: "ACCESS_OLD",
            refreshToken: "REFRESH_1",
        });

        const dispatch = vi.fn();

        // 1) request original => 401
        global.fetch.mockResolvedValueOnce(mockResponse(401, { ok: false }));

        // 2) refresh => ok:true accessToken nuevo
        global.fetch.mockResolvedValueOnce(
            mockResponse(200, { ok: true, accessToken: "ACCESS_NEW", user: { id: 7, email: "u@u.com" } })
        );

        // 3) reintento request original => 200
        global.fetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));

        const res = await apiFetch("/api/pedidos", { method: "GET" }, { dispatch });

        expect(res.status).toBe(200);
        expect(global.fetch).toHaveBeenCalledTimes(3);

        // chequeo: 2da llamada fue al refresh
        const [refreshUrl] = global.fetch.mock.calls[1];
        expect(refreshUrl).toBe("http://api.test/api/auth/refresh");

        // chequeo: 3er llamada (reintento) lleva Bearer ACCESS_NEW
        const [, retryOpts] = global.fetch.mock.calls[2];
        expect(retryOpts.headers.get("Authorization")).toBe("Bearer ACCESS_NEW");

        // storage actualizado
        const stored = getStorageAuth();
        expect(stored.accessToken).toBe("ACCESS_NEW");
        expect(stored.refreshToken).toBe("REFRESH_1");

        // redux actualizado
        expect(dispatch).toHaveBeenCalledWith(
            setAuth({
                user: { id: 7, email: "u@u.com" },
                accessToken: "ACCESS_NEW",
                refreshToken: "REFRESH_1",
            })
        );
    });

    it("si 401 y refresh falla => clear storage + dispatch(logout) + toast + navigate('/login')", async () => {
        setStorageAuth({
            user: { id: 2, email: "x@x.com" },
            accessToken: "ACCESS_OLD",
            refreshToken: "REFRESH_BAD",
        });

        const dispatch = vi.fn();
        const navigate = vi.fn();

        // 1) request original => 401
        global.fetch.mockResolvedValueOnce(mockResponse(401, { ok: false }));

        // 2) refresh => 401 o ok:false
        global.fetch.mockResolvedValueOnce(mockResponse(401, { ok: false, error: "Refresh inválido" }));

        const res = await apiFetch("/api/pedidos", { method: "GET" }, { dispatch, navigate });

        expect(res.status).toBe(401);

        // limpió storage
        expect(localStorage.getItem(STORAGE_KEY)).toBe(null);

        // logout redux
        expect(dispatch).toHaveBeenCalledWith(logout());

        // toast + redirect
        expect(showSessionExpiredToast).toHaveBeenCalledTimes(1);
        expect(navigate).toHaveBeenCalledWith("/login");
    });

    it("refresh lock: dos requests 401 simultáneas usan UN solo refresh", async () => {
        setStorageAuth({
            user: { id: 9 },
            accessToken: "ACCESS_OLD",
            refreshToken: "REFRESH_1",
        });

        const dispatch = vi.fn();

        // 1) dos requests => ambas 401
        global.fetch
            .mockResolvedValueOnce(mockResponse(401))
            .mockResolvedValueOnce(mockResponse(401))
            // 2) refresh (una sola vez) => ok
            .mockResolvedValueOnce(mockResponse(200, { ok: true, accessToken: "ACCESS_NEW", user: { id: 9 } }))
            // 3) reintentos (2) => ok
            .mockResolvedValueOnce(mockResponse(200))
            .mockResolvedValueOnce(mockResponse(200));

        const p1 = apiFetch("/api/a", { method: "GET" }, { dispatch });
        const p2 = apiFetch("/api/b", { method: "GET" }, { dispatch });

        const [r1, r2] = await Promise.all([p1, p2]);

        expect(r1.status).toBe(200);
        expect(r2.status).toBe(200);

        // refresh endpoint llamado 1 vez
        const refreshCalls = global.fetch.mock.calls.filter(([url]) =>
            String(url).includes("/api/auth/refresh")
        );
        expect(refreshCalls).toHaveLength(1);
    });
});
