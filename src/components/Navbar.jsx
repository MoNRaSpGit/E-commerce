import { NavLink, useNavigate } from "react-router-dom";

import NavbarDesktopLinks from "../components/NavbarDesktopLinks";

import "../styles/navbar.css";
import "../styles/userMenu.css";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectUser, selectIsAuthed } from "../slices/authSlice";
import { selectCartTotalItems } from "../slices/cartSlice";
import { useOnClickOutside } from "../hooks/useOnClickOutside";
import NavbarMobileMenu from "../components/NavbarMobileMenu";

import { useEffect, useRef, useState } from "react";

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


  useOnClickOutside([menuRef], () => setOpen(false), open);
  useOnClickOutside([mobileRef], () => setMobileOpen(false), mobileOpen);




  const goLogin = () => {
    closeAll();
    navigate("/login");
  };


  const closeAll = () => {
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
      await unsubscribeFromPush({ dispatch, navigate });
    } catch (e) {
      console.warn("unsubscribe push error:", e);
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
      await subscribeToPush();
      localStorage.removeItem("eco_push_dismissed");
      setPushDismissed(false);
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
      (async () => {
        try {
          await unsubscribeFromPush({ dispatch, navigate });
        } catch { }
        setPushReady(false);
      })();
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


        <NavbarDesktopLinks
          user={user}
          isAuthed={isAuthed}
          cartCount={cartCount}
          menuRef={menuRef}
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


      </div>
    </header>
  );
}
