import { UserRound } from "lucide-react";

export default function NavbarUserMenu({
    hideTrigger = false,
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
            {!hideTrigger && (
                <button
                    className="user-btn"
                    onClick={() => setOpen((v) => !v)}
                    aria-label="Menú de usuario"
                    type="button"
                >
                    <UserRound size={18} />
                </button>
            )}




            {open && (
                <div className="user-dropdown" onMouseDown={(e) => e.stopPropagation()}>
                    {isAuthed ? (
                        <>
                            <div className="user-meta">

                                <div className="user-email">{displayName}</div>
                                <div className="user-rol">{user?.rol}</div>
                            </div>
                            <div className="user-sep" />

                            <button
                                className="user-item"
                                type="button"
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (pushReady) await onDisablePush();
                                    else await onEnablePush();
                                }}
                            >


                                <div className="user-item-row">
                                    <span>Notificaciones</span>
                                    <span className={`pill ${pushReady ? "on" : "off"}`}>
                                        {pushReady ? "Activadas" : "Desactivadas"}
                                    </span>
                                </div>
                            </button>

                            {!pushReady && !pushDismissed && (
                                <button className="user-item subtle" type="button" onClick={onDismissPush}>
                                    No mostrar esto
                                </button>
                            )}


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
