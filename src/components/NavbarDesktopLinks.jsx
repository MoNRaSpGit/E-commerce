import { NavLink, useLocation, useSearchParams } from "react-router-dom";
import { ShoppingCart, Package } from "lucide-react";
import NavbarUserMenu from "./NavbarUserMenu";
import { useEffect, useState, useCallback } from "react";





export default function NavbarDesktopLinks({
    user,
    isAuthed,
    cartCount,
    menuRef,
    open,
    setOpen,
    displayName,
    doLogout,
    goLogin,
    goRegister,
    pushReady,
    pushDismissed,
    onEnablePush,
    onDisablePush,
    onDismissPush,
}) {


    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const isProductos = location.pathname.startsWith("/productos");
    // --- Semáforo "Operario activo" (público + toggle operario/admin) ---
    const [opActivo, setOpActivo] = useState(null); // null = cargando/desconocido
    const [opBusy, setOpBusy] = useState(false);

    const fetchOperarioStatus = useCallback(async () => {
        try {
            const apiBaseUrl = import.meta.env.VITE_API_URL;
            const res = await fetch(`${apiBaseUrl}/api/analytics/operario-status`);
            const data = await res.json().catch(() => null);
            if (res.ok && data?.ok) {
                setOpActivo(!!data.activo);
            }
        } catch {
            // si falla no rompemos la navbar
        }
    }, []);

    useEffect(() => {
        fetchOperarioStatus();

        const t = setInterval(fetchOperarioStatus, 20000); // 20s
        const onVis = () => {
            if (document.visibilityState === "visible") fetchOperarioStatus();
        };
        document.addEventListener("visibilitychange", onVis);

        return () => {
            clearInterval(t);
            document.removeEventListener("visibilitychange", onVis);
        };
    }, [fetchOperarioStatus]);

    async function toggleOperarioStatus() {
        if (opBusy) return;
        if (typeof opActivo !== "boolean") return;

        try {
            setOpBusy(true);

            const raw = localStorage.getItem("eco_auth");
            const stored = raw ? JSON.parse(raw) : null;
            const accessToken = stored?.accessToken;

            if (!accessToken) return;

            const apiBaseUrl = import.meta.env.VITE_API_URL;
            const next = !opActivo;

            const res = await fetch(`${apiBaseUrl}/api/analytics/operario-status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ activo: next }),
            });

            const data = await res.json().catch(() => null);
            if (res.ok && data?.ok) {
                setOpActivo(!!data.activo);
            }
        } finally {
            setOpBusy(false);
        }
    }

    const canToggle = isAuthed && (user?.rol === "operario" || user?.rol === "admin");

    const qParam = searchParams.get("q") || "";
    const [qInput, setQInput] = useState(qParam);

    // si cambia la URL (back/forward o alguien pega link), sincronizamos input
    useEffect(() => {
        setQInput(qParam);
    }, [qParam]);

    // debounce: recién acá tocamos la URL
    useEffect(() => {
        if (!isProductos) return;

        const t = setTimeout(() => {
            // ✅ siempre partimos de lo último que hay en la URL
            const nextParams = new URLSearchParams(searchParams);

            if (!qInput) nextParams.delete("q");
            else nextParams.set("q", qInput);

            // ✅ solo escribimos si cambia realmente
            if (nextParams.toString() !== searchParams.toString()) {
                setSearchParams(nextParams, { replace: true });
            }
        }, 250);

        return () => clearTimeout(t);
    }, [qInput, isProductos, searchParams, setSearchParams]);








    return (
        <nav
            className={`nav-links nav-desktop ${isProductos ? "nav-desktop--productos" : ""
                } ${!isAuthed ? "nav-desktop--guest" : ""}`}
        >
            {isProductos && (
                <div className="nav-search-box">
                    <span className="nav-search-icon">🔍</span>

                    <input
                        className="nav-search-input"
                        value={qInput}
                        onChange={(e) => setQInput(e.target.value)}
                        placeholder="Buscar productos…"
                        aria-label="Buscar productos"
                    />

                    {qInput && (
                        <button
                            className="nav-search-clear"
                            type="button"
                            onClick={() => setQInput("")}
                            aria-label="Limpiar búsqueda"
                        >
                            ✕
                        </button>
                    )}
                </div>
            )}

            {(user?.rol === "cliente" || user?.rol === "operario" || user?.rol === "admin") && (
                <NavLink
                    to="/productos"
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                >
                    <Package size={18} />
                    <span>Productos</span>

                



                    
                    
                </NavLink>
            )}


            {user?.rol === "cliente" && (
                <NavLink
                    to="/carrito"
                    className={({ isActive }) => `nav-item cart-link ${isActive ? "active" : ""}`}
                >
                    <span className="cart-icon-wrap">
                        <ShoppingCart size={18} />
                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                    </span>
                    <span>Carrito</span>
                </NavLink>
            )}

            {isAuthed && (user?.rol === "cliente" || user?.rol === "admin") && (
                <NavLink
                    to="/mis-pedidos"
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                >
                    <span>Mis pedidos</span>
                </NavLink>
            )}

            {isAuthed && (user?.rol === "operario" || user?.rol === "admin") && (
                <NavLink
                    to="/operario/pedidos"
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                >
                    <span>Panel pedidos</span>
                </NavLink>
            )}

            {isAuthed && (user?.rol === "operario" || user?.rol === "admin") && (
                <NavLink
                    to="/admin/productos"
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                >
                    <span>Categorías</span>
                </NavLink>
            )}




            {isAuthed && (user?.rol === "operario" || user?.rol === "admin") && (
                <NavLink
                    to="/operario/escaneo"
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                >
                    <span>Escaneo</span>
                </NavLink>
            )}

            {isAuthed && (user?.rol === "operario" || user?.rol === "admin") && (
                <NavLink
                    to="/operario/precio-999"
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                >
                    <span>Precio 999</span>
                </NavLink>
            )}










            <NavbarUserMenu
                menuRef={menuRef}
                open={open}
                setOpen={setOpen}
                isAuthed={isAuthed}
                user={user}
                displayName={displayName}
                doLogout={doLogout}
                goLogin={goLogin}
                goRegister={goRegister}
                pushReady={pushReady}
                pushDismissed={pushDismissed}
                onEnablePush={onEnablePush}
                onDisablePush={onDisablePush}
                onDismissPush={onDismissPush}
            />

        </nav>
    );
}
