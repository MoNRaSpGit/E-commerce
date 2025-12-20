import { NavLink, useNavigate } from "react-router-dom";
import { ShoppingCart, Package, UserRound } from "lucide-react";
import "../styles/navbar.css";
import "../styles/userMenu.css";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectUser, selectIsAuthed } from "../slices/authSlice";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector(selectUser);
  const isAuthed = useSelector(selectIsAuthed);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const goLogin = () => {
    setOpen(false);
    navigate("/login");
  };

  const doLogout = () => {
    setOpen(false);
    dispatch(logout());
    navigate("/productos");
  };

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

          {/* 👤 User menu */}
          <div className="user-menu" ref={menuRef}>
            <button
              className="user-btn"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menú de usuario"
              type="button"
            >
              <UserRound size={18} />
            </button>

            {open && (
              <div className="user-dropdown">
                {isAuthed ? (
                  <>
                    <div className="user-meta">
                      <div className="user-email">{user?.email}</div>
                      <div className="user-rol">{user?.rol}</div>
                    </div>
                    <button className="user-item" onClick={doLogout} type="button">
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <button className="user-item" onClick={goLogin} type="button">
                      Iniciar sesión
                    </button>
                    <button
                      className="user-item"
                      onClick={() => {
                        setOpen(false);
                        navigate("/registrar");
                      }}
                      type="button"
                    >
                      Registrarse
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
