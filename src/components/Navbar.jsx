import { NavLink, useNavigate, useLocation } from "react-router-dom";


import NavbarDesktopLinks from "../components/NavbarDesktopLinks";
import MobileBottomNav from "../components/MobileBottomNav";
import "../styles/mobileBottomNav.css";


import "../styles/navbar.css";
import "../styles/userMenu.css";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectUser, selectIsAuthed } from "../slices/authSlice";
import { selectCartTotalItems } from "../slices/cartSlice";
import { useOnClickOutside } from "../hooks/useOnClickOutside";
import NavbarMobileMenu from "../components/NavbarMobileMenu";
import NavbarMobileTopBar from "../components/NavbarMobileTopBar";
import NavbarUserMenu from "../components/NavbarUserMenu";





import { useEffect, useRef, useState } from "react";

import toast from "react-hot-toast";
import { subscribeToPush, unsubscribeFromPush } from "../services/pushClient";


export default function Navbar() {
  const [open, setOpen] = useState(false);         // dropdown user (desktop)
  const [mobileOpen, setMobileOpen] = useState(false); // panel hamburguesa (mobile)

  const desktopMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileRef = useRef(null);
  const userBtnRef = useRef(null);

  const ignoreNextOutsideRef = useRef(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const location = useLocation();
  const isCarrito = location.pathname.startsWith("/carrito");

  const isAuthRoute =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/registrar");



  const cartCount = useSelector(selectCartTotalItems);


  const user = useSelector(selectUser);
  const isAuthed = useSelector(selectIsAuthed);

  const displayName =
    (user?.nombre ? `${user.nombre}${user?.apellido ? " " + user.apellido : ""}` : "") ||
    user?.email ||
    "";


  useOnClickOutside([desktopMenuRef, mobileMenuRef, userBtnRef], () => {
    console.log("[outside] setOpen(false)");
    setOpen(false);
  }, open);

  useOnClickOutside([mobileRef], () => setMobileOpen(false), mobileOpen);




  const goLogin = () => {
    closeAll();
    navigate("/login");
  };


  const closeAll = () => {
    console.log("[outside] setOpen(false)");
    setOpen(false);
    setMobileOpen(false);
  };



  const goRegister = () => {
    closeAll();
    navigate("/registrar");
  };


  const manualLogoutRef = useRef(false);

  const doLogout = async () => {
    setOpen(false);
    setMobileOpen(false);

    manualLogoutRef.current = true;

    try {
  // ✅ No hacemos unsubscribe en logout.
  // La subscripción queda en el navegador, y al próximo login se re-sincroniza
  // con /api/push/subscribe (upsert por endpoint) para el usuario correcto.
} finally {
  // siempre limpiamos estado UI local
  setPushReady(false);
  setPushDismissed(localStorage.getItem("eco_push_dismissed") === "1");

  dispatch(logout());
  navigate("/productos");

  manualLogoutRef.current = false;
}

  };

  const enablePush = async () => {
    try {
      const r = await subscribeToPush();
      if (r?.ok === false && r?.reason === "push_disabled") {
        toast.success("Notificaciones activadas 🔔");
        setPushReady(true); // rápido UI

        // opcional: confirmar estado real
        try {
          const { hasPushSubscription } = await import("../services/pushClient"); // si preferís, import normal arriba
          const ok = await hasPushSubscription();
          setPushReady(!!ok);
        } catch { }

        return;
      }
      toast.success("Notificaciones activadas 🔔");
      setPushReady(true);

    } catch (e) {
      toast.error(e.message || "No se pudo activar notificaciones");
    }
  };

  const disablePush = async () => {
    try {
      await unsubscribeFromPush();
      toast.success("Notificaciones desactivadas 🔕");
      setPushReady(false);
      try { localStorage.setItem("eco_push_ready", "0"); } catch { }
      try { window.dispatchEvent(new Event("eco_push_changed")); } catch { }

      try {
        localStorage.setItem("eco_push_optin_cooldown_until", String(Date.now() + 20000));
      } catch { }

      try { localStorage.removeItem("eco_push_optin_done"); } catch { }
    } catch (e) {
      toast.error(e.message || "No se pudo desactivar notificaciones");
    }
  };

  const dismissPush = () => {
    localStorage.setItem("eco_push_dismissed", "1");
    setPushDismissed(true);
  };



  const go = (path) => {
    closeAll();
    navigate(path);
  };

  const [pushReady, setPushReady] = useState(false);
  const [pushDismissed, setPushDismissed] = useState(
    localStorage.getItem("eco_push_dismissed") === "1"
  );

  const wasAuthedRef = useRef(isAuthed);

  useEffect(() => {
    const wasAuthed = wasAuthedRef.current;
    wasAuthedRef.current = isAuthed;

    // Si antes estaba logueado y ahora no → logout forzado (expiró o logout por otro lado)
    if (wasAuthed && !isAuthed && !manualLogoutRef.current) {
  // ✅ No desuscribimos push por expiración.
  // El refresh/logout afecta auth, pero push es una preferencia del dispositivo.
  setPushReady(false);
}
  }, [isAuthed]);


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
    const sync = async () => {
      try {
        if (!("serviceWorker" in navigator)) return setPushReady(false);
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setPushReady(!!sub);
      } catch {
        setPushReady(false);
      }
    };

    const onChanged = () => sync();

    window.addEventListener("eco_push_changed", onChanged);

    return () => {
      window.removeEventListener("eco_push_changed", onChanged);
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
    <>
      <header className="app-navbar">
        <div className="container d-flex align-items-center justify-content-between py-3">
          <NavLink
            to="/productos"
            className="brand"
            onClick={() => setMobileOpen(false)}
          >
            <span className="brand-dot" />
            <span>E-commerce</span>
          </NavLink>

          <NavbarDesktopLinks
            user={user}
            isAuthed={isAuthed}
            cartCount={cartCount}
            menuRef={desktopMenuRef}
            open={open}
            setOpen={setOpen}
            displayName={displayName}
            doLogout={doLogout}
            goLogin={goLogin}
            goRegister={goRegister}
            pushReady={pushReady}
            pushDismissed={pushDismissed}
            onEnablePush={enablePush}
            onDisablePush={disablePush}
            onDismissPush={dismissPush}
          />


          {(() => {
            const isClienteUI = !isAuthed || user?.rol === "cliente";

            return isClienteUI ? (
              <NavbarMobileTopBar
                isAuthed={isAuthed}
                onUserPointerDown={() => {
                  // clave: se ejecuta ANTES que el outside listener del documento
                  ignoreNextOutsideRef.current = true;
                }}
                onUserClick={() => {
                  setOpen((v) => {
                    console.log("[setOpen toggle]", { from: v, to: !v });
                    return !v;
                  });

                }}
                userBtnRef={userBtnRef}
              />

            ) : (
              <NavbarMobileMenu
                mobileRef={mobileRef}
                user={user}
                isAuthed={isAuthed}
                displayName={displayName}
                cartCount={cartCount}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
                go={go}
                goLogin={goLogin}
                goRegister={goRegister}
                doLogout={doLogout}
                pushReady={pushReady}
                pushDismissed={pushDismissed}
                onEnablePush={async () => {
                  await enablePush();
                  setMobileOpen(false);
                }}
                onDisablePush={async () => {
                  await disablePush();
                  setMobileOpen(false);
                }}
                onDismissPush={() => {
                  dismissPush();
                  setMobileOpen(false);
                }}
              />
            );
          })()}


        </div>
      </header>

      {(!isAuthed || user?.rol === "cliente") && (
        <div className="nav-mobile-userdrop">
          <NavbarUserMenu
            hideTrigger={true}
            menuRef={mobileMenuRef}
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
            onEnablePush={enablePush}
            onDisablePush={disablePush}
            onDismissPush={dismissPush}
          />
        </div>
      )}



      <MobileBottomNav
        cartCount={cartCount}
        isVisible={(!isAuthed || user?.rol === "cliente") && !isCarrito && !isAuthRoute}
      />
    </>
  );

}
