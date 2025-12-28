export default function TestAuthView({
  api,
  email,
  setEmail,
  password,
  setPassword,
  accessToken,
  refreshToken,
  onLogin,
  onTestMe,
  onRefresh,
  result,
}) {
  return (
    <div style={{ padding: "2rem", maxWidth: 720 }}>
      <h2>Test Auth / CORS (Render)</h2>
      <p>
        API: <code>{api}</code>
      </p>

      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onLogin}>1) Login</button>

          <button onClick={onTestMe} disabled={!accessToken}>
            2) Probar /me
          </button>

          <button onClick={onRefresh} disabled={!refreshToken}>
            3) Refresh accessToken
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          <div>
            <b>accessToken:</b> <span>{accessToken ? "✅ cargado" : "❌ vacío"}</span>
          </div>
          <div>
            <b>refreshToken:</b> <span>{refreshToken ? "✅ cargado" : "❌ vacío"}</span>
          </div>
        </div>

        {result && <pre style={{ marginTop: 16 }}>{JSON.stringify(result, null, 2)}</pre>}
      </div>
    </div>
  );
}
