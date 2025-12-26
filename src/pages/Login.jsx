import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginThunk, selectAuth, selectIsAuthed } from "../slices/authSlice";
import { useNavigate, Link } from "react-router-dom";
import "../styles/login.css";

const DEMO_USERS = {
  admin: {
    label: "🛠️ Entrar como Admin",
    email: "admin@eco.local",
    password: "admin",
  },
  operario: {
    label: "🔧 Entrar como Operario",
    email: "operario@eco.local",
    password: "operario",
  },
  cliente: {
    label: "🧑 Entrar como Cliente",
    email: "cliente@eco.local",
    password: "cliente",
  },
};

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector(selectAuth);
  const isAuthed = useSelector(selectIsAuthed);

  const [email, setEmail] = useState("operario@eco.local");
  const [password, setPassword] = useState("operario");

  useEffect(() => {
    if (isAuthed) navigate("/productos");
  }, [isAuthed, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(loginThunk({ email, password }));
    if (res.meta.requestStatus === "fulfilled") {
      navigate("/productos");
    }
  };

  const quickLogin = async (role) => {
    const creds = DEMO_USERS[role];
    if (!creds) return;

    // ✅ opcional: mostrar en inputs con qué cuenta entrás
    setEmail(creds.email);
    setPassword(creds.password);

    const res = await dispatch(
      loginThunk({
        email: creds.email,
        password: creds.password,
      })
    );

    if (res.meta.requestStatus === "fulfilled") {
      navigate("/productos");
    }
  };

  const disabled = status === "loading";

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h2 className="login-title">Iniciar sesión</h2>

        {/* ✅ Accesos rápidos DEMO */}
        <div className="login-demo">
          <p className="login-demo-title">Accesos rápidos (demo)</p>

          <div className="login-demo-actions">
            <button
              type="button"
              className="login-demo-btn admin"
              onClick={() => quickLogin("admin")}
              disabled={disabled}
            >
              {DEMO_USERS.admin.label}
            </button>

            <button
              type="button"
              className="login-demo-btn operario"
              onClick={() => quickLogin("operario")}
              disabled={disabled}
            >
              {DEMO_USERS.operario.label}
            </button>

            <button
              type="button"
              className="login-demo-btn cliente"
              onClick={() => quickLogin("cliente")}
              disabled={disabled}
            >
              {DEMO_USERS.cliente.label}
            </button>
          </div>

          <div className="login-demo-sep" />
        </div>

        {/* ✅ Login normal */}
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
            <span>No tenés cuenta?</span>{" "}
            <Link to="/registrar">Registrarse</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
