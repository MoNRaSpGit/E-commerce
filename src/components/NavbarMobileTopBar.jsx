import { UserRound } from "lucide-react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function NavbarMobileTopBar({
    isAuthed,
    onUserClick,
    userBtnRef
}) {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const isProductos = location.pathname.startsWith("/productos");

    const qParam = searchParams.get("q") || "";
    const [qInput, setQInput] = useState(qParam);

    // sync si cambia la URL (back/forward)
    useEffect(() => {
        setQInput(qParam);
    }, [qParam]);

    // debounce: escribir fluido, URL se actualiza suave
    useEffect(() => {
        if (!isProductos) return;

        const t = setTimeout(() => {
            const nextParams = new URLSearchParams(searchParams);

            if (!qInput) nextParams.delete("q");
            else nextParams.set("q", qInput);

            setSearchParams(nextParams, { replace: true });
        }, 250);

        return () => clearTimeout(t);
    }, [qInput, isProductos]); // NO metas searchParams

    return (
        <div className="nav-mobile-top">
            {isProductos ? (
                <div className="nav-search-box nav-search-box--mobile">
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
            ) : (
                <div className="nav-mobile-title">
                    {location.pathname.startsWith("/carrito") ? "Carrito" : "Mis pedidos"}
                </div>
            )}

            <button
                ref={userBtnRef}
                className="user-btn"
                type="button"
                aria-label={isAuthed ? "Menú de usuario" : "Iniciar sesión"}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                    e.stopPropagation();
                    onUserClick();
                }}
            >
                <UserRound size={20} />
            </button>


        </div>
    );
}
