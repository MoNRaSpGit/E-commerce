import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

import "../styles/register.css";
import { selectIsAuthed, setAuth } from "../slices/authSlice";
import { apiFetch } from "../services/apiFetch"; // ✅ nuevo

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthed);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [status, setStatus] = useState("idle"); // idle | loading
  const [error, setError] = useState(null);

  const isLoading = status === "loading";
  const cleanEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  useEffect(() => {
    if (isAuthed) navigate("/productos");
  }, [isAuthed, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanNombre = nombre.trim();
    const cleanApellido = apellido.trim();
    const cleanTelefono = telefono.trim();

    if (cleanNombre.length < 2) {
      setError("Nombre requerido (mínimo 2 caracteres)");
      return;
    }

    if (!cleanEmail || !password) {
      setError("Email y password son obligatorios");
      return;
    }

    setStatus("loading");

    try {
      const res = await apiFetch(
        "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            password,
            nombre: cleanNombre,
            apellido: cleanApellido || null,
            telefono: cleanTelefono || null,
          }),
        },
        { auth: false } // ✅ público
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setError(data?.error || "No se pudo registrar");
        setStatus("idle");
        return;
      }

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
            Nombre *
            <input
              className="register-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="given-name"
              disabled={isLoading}
            />
          </label>

          <label className="register-label">
            Apellido
            <input
              className="register-input"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              autoComplete="family-name"
              disabled={isLoading}
            />
          </label>

          <label className="register-label">
            Teléfono
            <input
              className="register-input"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              autoComplete="tel"
              disabled={isLoading}
            />
          </label>

          <label className="register-label">
            Email
            <input
              className="register-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </label>

          {error && <div className="register-error">{error}</div>}

          <button className="register-btn" type="submit" disabled={isLoading}>
            {isLoading ? "Creando..." : "Registrarme"}
          </button>

          <div className="register-foot">
            <span>Ya tenés cuenta?</span> <Link to="/login">Iniciar sesión</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
