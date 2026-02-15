import { ShoppingCart, Package, Menu, X } from "lucide-react";

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
          </button>

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
