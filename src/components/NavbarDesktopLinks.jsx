import { NavLink } from "react-router-dom";
import { ShoppingCart, Package } from "lucide-react";
import NavbarUserMenu from "./NavbarUserMenu";

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
  return (
    <nav className="nav-links nav-desktop">
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
