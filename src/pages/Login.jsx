import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginThunk, selectAuth, selectIsAuthed } from "../slices/authSlice";
import { useNavigate, Link } from "react-router-dom";
import "../styles/login.css";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector(selectAuth);
  const isAuthed = useSelector(selectIsAuthed);

  const [email, setEmail] = useState("admin@eco.local");
  const [password, setPassword] = useState("admin");

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

          <button
            className="login-btn"
            type="submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Ingresando..." : "Ingresar"}
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
