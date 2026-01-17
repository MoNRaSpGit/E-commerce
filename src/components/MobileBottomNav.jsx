import { NavLink } from "react-router-dom";
import { Home, ShoppingCart, Receipt } from "lucide-react";

export default function MobileBottomNav({ cartCount, isVisible = true }) {
  if (!isVisible) return null;

  return (
    <nav className="mobile-bottom-nav" aria-label="Navegación inferior">
      <NavLink
        to="/productos"
        className={({ isActive }) => `mbn-item ${isActive ? "active" : ""}`}
      >
        <Home size={20} />
        <span>Inicio</span>
      </NavLink>

      <NavLink
        to="/carrito"
        className={({ isActive }) => `mbn-item ${isActive ? "active" : ""}`}
      >
        <span className="mbn-icon-wrap">
          <ShoppingCart size={20} />
          {cartCount > 0 && <span className="mbn-badge">{cartCount}</span>}
        </span>
        <span>Carrito</span>
      </NavLink>

      <NavLink
        to="/mis-pedidos"
        className={({ isActive }) => `mbn-item ${isActive ? "active" : ""}`}
      >
        <Receipt size={20} />
        <span>Pedidos</span>
      </NavLink>
    </nav>
  );
}
