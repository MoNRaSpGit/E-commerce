import { describe, it, expect, beforeEach, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import authReducer, { setAuth, logout, loginThunk } from "../slices/authSlice";
import { apiFetch } from "../services/apiFetch";

vi.mock("../services/apiFetch", () => ({
  apiFetch: vi.fn(),
}));

const STORAGE_KEY = "eco_auth";

function getStored() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function makeStore(preloadedState) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: preloadedState ? { auth: preloadedState } : undefined,
  });
}

function mockRes({ ok, data, status = ok ? 200 : 401 }) {
  return {
    ok,
    status,
    json: vi.fn(async () => data),
  };
}

describe("authSlice", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  describe("reducers", () => {
    it("setAuth: setea user/tokens, status succeeded y guarda en storage", () => {
      const store = makeStore({
        user: null,
        accessToken: null,
        refreshToken: null,
        status: "idle",
        error: null,
      });

      const payload = {
        user: { id: 1, email: "cliente@demo.com", rol: "cliente" },
        accessToken: "ACCESS_1",
        refreshToken: "REFRESH_1",
      };

      store.dispatch(setAuth(payload));

      const state = store.getState().auth;
      expect(state.user).toEqual(payload.user);
      expect(state.accessToken).toBe("ACCESS_1");
      expect(state.refreshToken).toBe("REFRESH_1");
      expect(state.status).toBe("succeeded");
      expect(state.error).toBe(null);

      const stored = getStored();
      expect(stored).toMatchObject(payload);
    });

    it("logout: limpia state y borra storage", () => {
      // arrancamos con algo ya guardado
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user: { id: 2, email: "x@x.com" },
          accessToken: "A",
          refreshToken: "R",
        })
      );

      const store = makeStore({
        user: { id: 2, email: "x@x.com" },
        accessToken: "A",
        refreshToken: "R",
        status: "succeeded",
        error: null,
      });

      store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.user).toBe(null);
      expect(state.accessToken).toBe(null);
      expect(state.refreshToken).toBe(null);
      expect(state.status).toBe("idle");
      expect(state.error).toBe(null);

      expect(localStorage.getItem(STORAGE_KEY)).toBe(null);
    });
  });

  describe("loginThunk", () => {
    it("pending -> fulfilled: guarda user/tokens, status succeeded y persiste en storage", async () => {
      const store = makeStore();

      apiFetch.mockResolvedValueOnce(
        mockRes({
          ok: true,
          data: {
            ok: true,
            user: { id: 10, email: "cliente@demo.com", rol: "cliente" },
            accessToken: "ACCESS_OK",
            refreshToken: "REFRESH_OK",
          },
        })
      );

      const action = store.dispatch(
        loginThunk({ email: "cliente@demo.com", password: "123" })
      );

      // durante pending
      const pendingState = store.getState().auth;
      expect(pendingState.status).toBe("loading");

      const result = await action;
      expect(result.type).toBe("auth/login/fulfilled");

      const state = store.getState().auth;
      expect(state.status).toBe("succeeded");
      expect(state.user).toMatchObject({ email: "cliente@demo.com" });
      expect(state.accessToken).toBe("ACCESS_OK");
      expect(state.refreshToken).toBe("REFRESH_OK");
      expect(state.error).toBe(null);

      const stored = getStored();
      expect(stored).toMatchObject({
        user: { id: 10, email: "cliente@demo.com", rol: "cliente" },
        accessToken: "ACCESS_OK",
        refreshToken: "REFRESH_OK",
      });

      // y se llamó apiFetch con auth:false (login público)
      expect(apiFetch).toHaveBeenCalledTimes(1);
      const [path, options, ctx] = apiFetch.mock.calls[0];
      expect(path).toBe("/api/auth/login");
      expect(options.method).toBe("POST");
      expect(ctx).toMatchObject({ auth: false });
    });

    it("rejected (login inválido): status failed y error desde backend", async () => {
      const store = makeStore();

      apiFetch.mockResolvedValueOnce(
        mockRes({
          ok: false,
          status: 401,
          data: { ok: false, error: "Login inválido" },
        })
      );

      const result = await store.dispatch(
        loginThunk({ email: "x@x.com", password: "bad" })
      );

      expect(result.type).toBe("auth/login/rejected");
      // rejectWithValue => payload
      expect(result.payload).toBe("Login inválido");

      const state = store.getState().auth;
      expect(state.status).toBe("failed");
      expect(state.error).toBe("Login inválido");
      expect(state.user).toBe(null);
      expect(state.accessToken).toBe(null);
      expect(state.refreshToken).toBe(null);

      // no debería guardar nada
      expect(localStorage.getItem(STORAGE_KEY)).toBe(null);
    });

    it("rejected (error de red): status failed con mensaje genérico", async () => {
      const store = makeStore();

      apiFetch.mockRejectedValueOnce(new Error("Network down"));

      const result = await store.dispatch(
        loginThunk({ email: "x@x.com", password: "y" })
      );

      expect(result.type).toBe("auth/login/rejected");
      expect(result.payload).toBe("No se pudo conectar con el servidor");

      const state = store.getState().auth;
      expect(state.status).toBe("failed");
      expect(state.error).toBe("No se pudo conectar con el servidor");
      expect(localStorage.getItem(STORAGE_KEY)).toBe(null);
    });
  });
});
