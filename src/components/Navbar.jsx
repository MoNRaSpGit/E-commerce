import { NavLink } from "react-router-dom";
import { ShoppingCart, Package } from "lucide-react";
import "../styles/navbar.css";

export default function Navbar() {
  return (
    <header className="app-navbar">
      <div className="container d-flex align-items-center justify-content-between py-3">
        <NavLink to="/productos" className="brand">
          <span className="brand-dot" />
          <span>E-commerce</span>
        </NavLink>

        <nav className="nav-links">
          <NavLink
            to="/productos"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Package size={18} />
            <span>Productos</span>
          </NavLink>

          <NavLink
            to="/carrito"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <ShoppingCart size={18} />
            <span>Carrito</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
