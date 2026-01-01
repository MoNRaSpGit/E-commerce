import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginThunk, selectAuth, selectIsAuthed } from "../slices/authSlice";
import { useNavigate, Link } from "react-router-dom";

import DemoLoginButtons from "../features/login/DemoLoginButtons";
import { DEMO_USERS } from "../features/login/demoUsers";

import "../styles/login.css";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { status, error, user } = useSelector(selectAuth);

  const isAuthed = useSelector(selectIsAuthed);

  const [email, setEmail] = useState("operario@eco.local");
  const [password, setPassword] = useState("operario");

  const goByRole = (u) => {
    const rol = u?.rol;
    if (rol === "operario" || rol === "admin") return navigate("/operario/pedidos");
    return navigate("/productos");
  };


  useEffect(() => {
    if (isAuthed) goByRole(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);


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

        <DemoLoginButtons
          demoUsers={DEMO_USERS}
          disabled={disabled}
          onQuickLogin={quickLogin}
        />

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
            <span>No tenés cuenta?</span> <Link to="/registrar">Registrarse</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
