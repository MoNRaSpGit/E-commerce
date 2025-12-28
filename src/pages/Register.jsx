import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import "../styles/register.css";
import { selectIsAuthed, setAuth } from "../slices/authSlice";
import RegisterForm from "../features/register/RegisterForm";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthed);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [status, setStatus] = useState("idle");
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          nombre: cleanNombre,
          apellido: cleanApellido || null,
          telefono: cleanTelefono || null,
        }),
      });

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
    <RegisterForm
      nombre={nombre}
      setNombre={setNombre}
      apellido={apellido}
      setApellido={setApellido}
      telefono={telefono}
      setTelefono={setTelefono}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      error={error}
      isLoading={isLoading}
      onSubmit={onSubmit}
    />
  );
}
