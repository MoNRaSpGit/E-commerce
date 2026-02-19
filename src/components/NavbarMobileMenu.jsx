import { ShoppingCart, Package, Menu, X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";


export default function NavbarMobileMenu({
  mobileRef,
  user,
  isAuthed,
  displayName,
  cartCount,
  mobileOpen,
  setMobileOpen,
  go,
  goLogin,
  goRegister,
  doLogout,
  pushReady,
  pushDismissed,
  onEnablePush,
  onDisablePush,
  onDismissPush,
}) {
  const [opActivo, setOpActivo] = useState(null);
  const [opBusy, setOpBusy] = useState(false);

  const fetchOperarioStatus = useCallback(async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL;
      const res = await fetch(`${apiBaseUrl}/api/analytics/operario-status`);
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) setOpActivo(!!data.activo);
    } catch { }
  }, []);

  useEffect(() => {
    fetchOperarioStatus();
    const t = setInterval(fetchOperarioStatus, 20000);
    return () => clearInterval(t);
  }, [fetchOperarioStatus]);

  const canToggle = isAuthed && (user?.rol === "operario" || user?.rol === "admin");

  async function toggleOperarioStatus() {
    if (!canToggle) return;
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
      if (res.ok && data?.ok) setOpActivo(!!data.activo);
    } finally {
      setOpBusy(false);
    }
  }

  return (
    <div className="nav-mobile" ref={mobileRef}>
      {user?.rol === "cliente" && (
        <button
          className="icon-btn"
          type="button"
          aria-label="Ir al carrito"
          onClick={() => go("/carrito")}
        >
          <span className="cart-icon-wrap">
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </span>
        </button>
      )}

      <button
        className="burger-btn"
        type="button"
        aria-label="Abrir menú"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div className="mobile-dropdown">
          <button className="mobile-item" type="button" onClick={() => go("/productos")}>
            <Package size={18} />
            <span>Productos</span>

            <span className="op-status" title={opActivo ? "Operario: activo" : "Operario: inactivo"}>
              <span
                className={`op-dot ${opActivo === true ? "is-on" : opActivo === false ? "is-off" : ""
                  }`}
              />
            </span>


          </button>

          {canToggle && (
            <button
              className="mobile-item"
              type="button"
              onClick={toggleOperarioStatus}
              disabled={opBusy || opActivo === null}
              style={{ opacity: opBusy ? 0.7 : 1 }}
            >
              {opActivo ? "🟢 Activo (tocar para poner Inactivo)" : "🔴 Inactivo (tocar para poner Activo)"}
            </button>
          )}


          <div className="mobile-sep" />

          {isAuthed ? (
            <>
              <div className="mobile-meta">
                <div className="mobile-email">{displayName}</div>
                <div className="mobile-rol">{user?.rol}</div>
              </div>

              {!pushReady && !pushDismissed && (
                <button className="mobile-item" type="button" onClick={onEnablePush}>
                  Activar notificaciones
                </button>
              )}

              {pushReady && (
                <button className="mobile-item" type="button" onClick={onDisablePush}>
                  Desactivar notificaciones
                </button>
              )}

              {!pushReady && !pushDismissed && (
                <button className="mobile-item" type="button" onClick={onDismissPush}>
                  Ahora no
                </button>
              )}

              <div className="mobile-sep" />

              {(user?.rol === "cliente" || user?.rol === "admin") && (
                <button className="mobile-item" type="button" onClick={() => go("/mis-pedidos")}>
                  Mis pedidos
                </button>
              )}




              {(user?.rol === "operario" || user?.rol === "admin") && (
                <button className="mobile-item" type="button" onClick={() => go("/operario/escaneo")}>
                  Escaneo
                </button>
              )}

              {(user?.rol === "operario" || user?.rol === "admin") && (
                <button className="mobile-item" type="button" onClick={() => go("/operario/precio-999")}>
                  Precio 999
                </button>
              )}

              {(user?.rol === "operario" || user?.rol === "admin") && (
                <button className="mobile-item" type="button" onClick={() => go("/admin/productos")}>
                  Categorías
                </button>
              )}




              {(user?.rol === "operario" || user?.rol === "admin") && (
                <button className="mobile-item" type="button" onClick={() => go("/operario/pedidos")}>
                  Panel pedidos
                </button>
              )}




              <div className="mobile-sep" />

              <button className="mobile-item danger" type="button" onClick={doLogout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <button className="mobile-item" type="button" onClick={goLogin}>
                Iniciar sesión
              </button>
              <button className="mobile-item" type="button" onClick={goRegister}>
                Registrarse
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
