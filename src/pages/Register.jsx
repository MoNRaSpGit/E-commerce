import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

import "../styles/register.css";
import { selectIsAuthed, setAuth } from "../slices/authSlice";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthed);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [status, setStatus] = useState("idle"); // idle | loading
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthed) navigate("/productos");
  }, [isAuthed, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError("Email y password son obligatorios");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setError(data?.error || "No se pudo registrar");
        setStatus("idle");
        return;
      }

      // ✅ Auto-login: guardar tokens y user
      dispatch(
        setAuth({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        })
      );

      toast.success("Te registraste con éxito");
      navigate("/productos");
    } catch {
      setError("Error de conexión con el servidor");
      setStatus("idle");
    }
  };

  return (
    <div className="register-wrap">
      <div className="register-card">
        <h2 className="register-title">Crear cuenta</h2>

        <form onSubmit={onSubmit}>
          <label className="register-label">
            Email
            <input
              className="register-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label className="register-label">
            Password
            <input
              className="register-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          {error && <div className="register-error">{error}</div>}

          <button className="register-btn" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Creando..." : "Registrarme"}
          </button>

          <div className="register-foot">
            <span>Ya tenés cuenta?</span>{" "}
            <Link to="/login">Iniciar sesión</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
