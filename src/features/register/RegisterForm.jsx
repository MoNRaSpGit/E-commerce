import { Link } from "react-router-dom";

export default function RegisterForm({
  nombre, setNombre,
  apellido, setApellido,
  telefono, setTelefono,
  email, setEmail,
  password, setPassword,
  error,
  isLoading,
  onSubmit,
}) {
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
