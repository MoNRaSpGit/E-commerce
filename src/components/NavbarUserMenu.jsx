import { UserRound } from "lucide-react";

export default function NavbarUserMenu({
  menuRef,
  open,
  setOpen,
  isAuthed,
  user,
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
        <button className="btn btn-sm btn-outline-primary" onClick={onEnablePush} type="button">
          Activar notificaciones
        </button>
      )}

      {isAuthed && pushReady && (
        <button className="btn btn-sm btn-outline-secondary" onClick={onDisablePush} type="button">
          Desactivar notificaciones
        </button>
      )}

      {isAuthed && !pushReady && !pushDismissed && (
        <button className="btn btn-sm btn-outline-secondary" onClick={onDismissPush} type="button">
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
  );
}
