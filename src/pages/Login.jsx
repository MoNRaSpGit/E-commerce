import { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { loginThunk, selectAuth, selectIsAuthed } from "../slices/authSlice";
import { useNavigate, Link } from "react-router-dom";

import "../styles/login.css";




import DemoLoginButtons from "../features/login/DemoLoginButtons";
import { DEMO_USERS } from "../features/login/demoUsers";


export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { status, error, user } = useSelector(selectAuth);

  const isAuthed = useSelector(selectIsAuthed);


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoOpen, setDemoOpen] = useState(false);




  const goByRole = (u) => {
    const rol = u?.rol;
    if (rol === "operario" || rol === "admin") return navigate("/operario/pedidos");

    return navigate("/productos");
  };


  useEffect(() => {
    if (isAuthed) goByRole(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, user]);






  const disabled = status === "loading";

  const doLogin = async (payload) => {
    const res = await dispatch(loginThunk(payload));
    if (res.meta.requestStatus === "fulfilled") {
      const u = res.payload?.user;
      goByRole(u);
    }

  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await doLogin({ email, password });
  };

  const quickLogin = async (role) => {
    const creds = DEMO_USERS[role];
    if (!creds) return;

    setEmail(creds.email);
    setPassword(creds.password);

    await doLogin({ email: creds.email, password: creds.password });
  };







  return (
    <div className="login-wrap">
      <div className="login-card">
        <h2 className="login-title">Iniciar sesión</h2>








        <form onSubmit={onSubmit}>
          <label className="login-label">
            Email
            <input
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label className="login-label">
            Password
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button className="login-btn" type="submit" disabled={disabled}>
            {disabled ? "Ingresando..." : "Ingresar"}
          </button>

          <div className="login-foot">
            <div className="login-foot-row">
              <span>No tenés cuenta?</span> <Link to="/registrar">Registrarse</Link>
            </div>

            <div className="login-foot-row login-foot-row--demo">
              <span>¿Solo querés probar?</span>{" "}
              <button
                type="button"
                className="login-demo-link"
                onClick={() => setDemoOpen(true)}
                disabled={disabled}
              >
                Usá una cuenta demo
              </button>
            </div>
          </div>

        </form>
        {demoOpen && (
          <div
            className="demo-modal-backdrop"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setDemoOpen(false);
            }}
          >
            <div className="demo-modal">
              <div className="demo-modal-head">
                <span className="demo-modal-title">Acceso rápido</span>
              </div>

              <div className="demo-modal-body">
                <p>Entrá con usuarios de demostración para probar los roles sin registrarte.</p>
              </div>

              <DemoLoginButtons
                demoUsers={DEMO_USERS}
                disabled={disabled}
                onQuickLogin={async (role) => {
                  await quickLogin(role);
                  setDemoOpen(false);
                }}
              />

              <div className="demo-modal-actions">
                <button
                  type="button"
                  className="demo-modal-btn"
                  onClick={() => setDemoOpen(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
