import { NavLink, useLocation, useSearchParams } from "react-router-dom";
import { ShoppingCart, Package } from "lucide-react";
import NavbarUserMenu from "./NavbarUserMenu";
import { useEffect, useState } from "react";



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

            {(user?.rol === "cliente" || user?.rol === "admin") && (
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
                    to="/operario/dashboard"
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                >
                    <span>Dashboard</span>
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
                    to="/operario/actualizar"
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                >
                    <span>Para actualizar</span>
                </NavLink>
            )}



            {isAuthed && (user?.rol === "operario" || user?.rol === "admin") && (
                <NavLink
                    to="/operario/reposicion"
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                >
                    <span>Reposición</span>
                </NavLink>
            )}

            {isAuthed && (user?.rol === "operario" || user?.rol === "admin") && (
                <NavLink
                    to="/admin/productos"
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                >
                    <span>Admin productos</span>
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
