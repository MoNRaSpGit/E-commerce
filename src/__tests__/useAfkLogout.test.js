// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";


globalThis.IS_REACT_ACT_ENVIRONMENT = true;


// 🔧 mocks
const dispatchMock = vi.fn();
const navigateMock = vi.fn();
const toastMock = vi.fn();

vi.mock("react-redux", () => ({
    useDispatch: () => dispatchMock,
    useSelector: (selector) => selector(), // vamos a manejar selectIsAuthed mockeando el selector
}));

vi.mock("react-router-dom", () => ({
    useNavigate: () => navigateMock,
}));

vi.mock("react-hot-toast", () => ({
    default: (...args) => toastMock(...args),
}));

// mock authSlice usado por el hook
const logoutAction = { type: "auth/logout" };
let isAuthedValue = true;

vi.mock("../slices/authSlice", () => ({
    logout: () => logoutAction,
    selectIsAuthed: () => isAuthedValue,
}));

import useAfkLogout from "../hooks/useAfkLogout";

const LAST_ACTIVITY_KEY = "eco_last_activity_at";

function TestCmp({ minutes }) {
    useAfkLogout({ minutes });
    return null;
}

function mount(minutes = 15) {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);

    act(() => {
        root.render(React.createElement(TestCmp, { minutes }));
    });

    return {
        root,
        el,
        unmount() {
            act(() => root.unmount());
            el.remove();
        },
    };
}

describe("useAfkLogout", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));

        localStorage.clear();
        dispatchMock.mockClear();
        navigateMock.mockClear();
        toastMock.mockClear();
        isAuthedValue = true;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("si está autenticado: al pasar el tiempo dispara logout + toast + navigate('/login')", () => {
        mount(1); // 1 minuto

        // todavía no
        act(() => {
            vi.advanceTimersByTime(59 * 1000);
        });
        expect(dispatchMock).not.toHaveBeenCalled();

        // vence
        act(() => {
            vi.advanceTimersByTime(2 * 1000);
        });

        expect(dispatchMock).toHaveBeenCalledWith(logoutAction);
        expect(toastMock).toHaveBeenCalledWith("Sesión cerrada por inactividad", { icon: "⏳" });
        expect(navigateMock).toHaveBeenCalledWith("/login");
    });

    it("actividad resetea el timer (mousemove): no desloguea antes del nuevo plazo", () => {
        mount(1); // 1 minuto

        // pasan 40s
        act(() => {
            vi.advanceTimersByTime(40 * 1000);
        });

        // actividad => resetea lastActivity y rearma
        act(() => {
            window.dispatchEvent(new Event("mousemove"));
        });

        // pasan 30s más (total 70s desde inicio, pero solo 30 desde actividad) => NO logout
        act(() => {
            vi.advanceTimersByTime(30 * 1000);
        });
        expect(dispatchMock).not.toHaveBeenCalled();

        // pasan 31s más => ahora sí supera el minuto desde la actividad => logout
        act(() => {
            vi.advanceTimersByTime(31 * 1000);
        });
        expect(dispatchMock).toHaveBeenCalledWith(logoutAction);
    });

    it("si al iniciar ya está vencido (lastActivity viejo): logout inmediato", () => {
        // setear lastActivity viejo antes de montar
        localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now() - 2 * 60 * 1000)); // 2 min
        mount(1); // 1 minuto => vencido

        expect(dispatchMock).toHaveBeenCalledWith(logoutAction);
        expect(navigateMock).toHaveBeenCalledWith("/login");
    });

    

});
