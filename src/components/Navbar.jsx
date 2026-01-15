import { NavLink, useNavigate } from "react-router-dom";
import { ShoppingCart, Package, UserRound, Menu, X } from "lucide-react";
import "../styles/navbar.css";
import "../styles/userMenu.css";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectUser, selectIsAuthed } from "../slices/authSlice";
import { selectCartTotalItems } from "../slices/cartSlice";


import toast from "react-hot-toast";
import { subscribeToPush, unsubscribeFromPush } from "../services/pushClient";





export default function Navbar() {
  const [open, setOpen] = useState(false);         // dropdown user (desktop)
  const [mobileOpen, setMobileOpen] = useState(false); // panel hamburguesa (mobile)

  const menuRef = useRef(null);
  const mobileRef = useRef(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cartCount = useSelector(selectCartTotalItems);


  const user = useSelector(selectUser);
  const isAuthed = useSelector(selectIsAuthed);

  const displayName =
    (user?.nombre ? `${user.nombre}${user?.apellido ? " " + user.apellido : ""}` : "") ||
    user?.email ||
    "";


  useEffect(() => {
    const onDocClick = (e) => {
      // cerrar dropdown user
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);

      // cerrar menú mobile
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setMobileOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);



  const goLogin = () => {
    setOpen(false);
    setMobileOpen(false);
    navigate("/login");
  };

  const goRegister = () => {
    setOpen(false);
    setMobileOpen(false);
    navigate("/registrar");
  };

  const doLogout = async () => {
    setOpen(false);
    setMobileOpen(false);

    try {
      await unsubscribeFromPush();
    } catch (e) {
      console.warn("unsubscribe push error:", e);
    }

    dispatch(logout());
    navigate("/productos");

    setPushReady(false);
    setPushDismissed(localStorage.getItem("eco_push_dismissed") === "1");
  };


  const go = (path) => {
    setOpen(false);
    setMobileOpen(false);
    navigate(path);
  };

  const [pushReady, setPushReady] = useState(false);
  const [pushDismissed, setPushDismissed] = useState(
    localStorage.getItem("eco_push_dismissed") === "1"
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!("serviceWorker" in navigator)) return;
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (alive) setPushReady(!!sub);
      } catch { }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthed) return;

    let alive = true;

    (async () => {
      try {
        // si el navegador no soporta push, listo
        if (!("serviceWorker" in navigator)) return;
        if (!("PushManager" in window)) return;

        // si no hay permiso, no spameamos prompts acá (el botón lo hace)
        if (Notification.permission !== "granted") return;

        // si ya hay subscription local, la re-sincronizamos al backend
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();

        if (sub) {
          await subscribeToPush(); // reutiliza existing y hace POST /subscribe (upsert usuario_id)
          if (alive) setPushReady(true);
        } else {
          if (alive) setPushReady(false);
        }
      } catch {
        // silencioso, el botón queda como fallback
      }
    })();

    return () => {
      alive = false;
    };
  }, [isAuthed, user?.id]); // importante: cuando cambia el usuario, re-sync




  return (
    <header className="app-navbar">
      <div className="container d-flex align-items-center justify-content-between py-3">
        <NavLink to="/productos" className="brand" onClick={() => setMobileOpen(false)}>
          <span className="brand-dot" />
          <span>E-commerce</span>
        </NavLink>

        {/* ✅ LINKS DESKTOP (igual que antes) */}
        <nav className="nav-links nav-desktop">
          {/* Productos: solo cliente / admin */}
          {(user?.rol === "cliente" || user?.rol === "admin") && (
            <NavLink
              to="/productos"
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <Package size={18} />
              <span>Productos</span>
            </NavLink>
          )}


          {/* ✅ Carrito: SOLO cliente */}
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


          {/* Mis pedidos: cliente / admin */}
          {isAuthed && (user?.rol === "cliente" || user?.rol === "admin") && (
            <NavLink
              to="/mis-pedidos"
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span>Mis pedidos</span>
            </NavLink>
          )}

          {/* Panel pedidos: operario / admin */}
          {isAuthed && (user?.rol === "operario" || user?.rol === "admin") && (
            <NavLink
              to="/operario/pedidos"
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span>Panel pedidos</span>
            </NavLink>
          )}

          {/* Dashboard: operario / admin */}
          {isAuthed && (user?.rol === "operario" || user?.rol === "admin") && (
            <NavLink
              to="/operario/dashboard"
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <span>Dashboard</span>
            </NavLink>
          )}


          {/* Reposición: operario / admin */}
          {isAuthed && (user?.rol === "operario" || user?.rol === "admin") && (
            <NavLink
              to="/operario/reposicion"
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span>Reposición</span>
            </NavLink>
          )}






          {/* 👤 User menu (igual que antes) */}
          <div className="user-menu" ref={menuRef}>
            <button
              className="user-btn"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menú de usuario"
              type="button"
            >
              <UserRound size={18} />
            </button>

            {isAuthed && !pushReady && !pushDismissed && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={async () => {
                  try {
                    await subscribeToPush();
                    localStorage.removeItem("eco_push_dismissed");
                    setPushDismissed(false);
                    toast.success("Notificaciones activadas 🔔");
                    setPushReady(true);
                  } catch (e) {
                    toast.error(e.message || "No se pudo activar notificaciones");
                  }
                }}
                type="button"
              >
                Activar notificaciones
              </button>
            )}

            {isAuthed && !pushReady && !pushDismissed && (
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  localStorage.setItem("eco_push_dismissed", "1");
                  setPushDismissed(true);
                }}
                type="button"
              >
                Ahora no
              </button>
            )}

            {open && (
              <div className="user-dropdown">
                {isAuthed ? (
                  <>
                    <div className="user-meta">
                      <div className="user-email">{displayName}</div>
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
                    <button className="user-item" onClick={goRegister} type="button">
                      Registrarse
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* ✅ HAMBURGUESA (solo mobile) */}
        <div className="nav-mobile" ref={mobileRef}>
          {/* ✅ Carrito en mobile: SOLO cliente/admin */}
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

          {/* ✅ Hamburguesa */}
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
                    <button
                      className="mobile-item"
                      type="button"
                      onClick={async () => {
                        try {
                          await subscribeToPush();
                          localStorage.removeItem("eco_push_dismissed");
                          setPushDismissed(false);
                          toast.success("Notificaciones activadas 🔔");
                          setPushReady(true);
                          setMobileOpen(false);
                        } catch (e) {
                          toast.error(e.message || "No se pudo activar notificaciones");
                        }
                      }}
                    >
                      Activar notificaciones
                    </button>
                  )}

                  {!pushReady && !pushDismissed && (
                    <button
                      className="mobile-item"
                      type="button"
                      onClick={() => {
                        localStorage.setItem("eco_push_dismissed", "1");
                        setPushDismissed(true);
                        setMobileOpen(false);
                      }}
                    >
                      Ahora no
                    </button>
                  )}




                  <div className="mobile-sep" />

                  {(user?.rol === "cliente" || user?.rol === "admin") && (
                    <button
                      className="mobile-item"
                      type="button"
                      onClick={() => go("/mis-pedidos")}
                    >
                      Mis pedidos
                    </button>
                  )}

                  {(user?.rol === "operario" || user?.rol === "admin") && (
                    <button
                      className="mobile-item"
                      type="button"
                      onClick={() => go("/operario/dashboard")}
                    >
                      Dashboard
                    </button>
                  )}


                  {(user?.rol === "operario" || user?.rol === "admin") && (
                    <button
                      className="mobile-item"
                      type="button"
                      onClick={() => go("/operario/pedidos")}
                    >
                      Panel pedidos
                    </button>
                  )}

                  {(user?.rol === "operario" || user?.rol === "admin") && (
                    <button
                      className="mobile-item"
                      type="button"
                      onClick={() => go("/operario/reposicion")}
                    >
                      Reposición
                    </button>
                  )}


                  {(user?.rol === "operario" || user?.rol === "admin") && (
                    <button
                      className="mobile-item"
                      type="button"
                      onClick={() => go("/admin/productos")}
                    >
                      Admin productos
                    </button>
                  )}

                  <div className="mobile-sep" />

                  <button
                    className="mobile-item danger"
                    type="button"
                    onClick={doLogout}
                  >
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
      </div>
    </header>
  );
}
