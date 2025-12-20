import { useState } from "react";

export default function TestAuth() {
  const [email, setEmail] = useState("admin@eco.local");
  const [password, setPassword] = useState("admin");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [result, setResult] = useState(null);

  const api = import.meta.env.VITE_API_URL;

  const doLogin = async () => {
    setResult(null);
    try {
      const res = await fetch(`${api}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("LOGIN:", data);

      if (!res.ok || !data.ok) {
        setResult({ ok: false, step: "login", ...data });
        return;
      }

      setAccessToken(data.accessToken || "");
      setRefreshToken(data.refreshToken || "");
      setResult({ ok: true, step: "login", user: data.user });
    } catch (err) {
      console.error(err);
      setResult({ ok: false, step: "login", error: "Fetch falló" });
    }
  };

  const testMe = async () => {
    setResult(null);
    try {
      const res = await fetch(`${api}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();
      console.log("ME:", data);

      setResult({ status: res.status, ...data });
    } catch (err) {
      console.error(err);
      setResult({ ok: false, step: "me", error: "Fetch falló" });
    }
  };

  const doRefresh = async () => {
    setResult(null);
    try {
      const res = await fetch(`${api}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await res.json();
      console.log("REFRESH:", data);

      if (!res.ok || !data.ok) {
        setResult({ ok: false, step: "refresh", ...data });
        return;
      }

      setAccessToken(data.accessToken || "");
      setResult({ ok: true, step: "refresh", user: data.user });
    } catch (err) {
      console.error(err);
      setResult({ ok: false, step: "refresh", error: "Fetch falló" });
    }
  };

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
          <button onClick={doLogin}>1) Login</button>
          <button onClick={testMe} disabled={!accessToken}>
            2) Probar /me
          </button>
          <button onClick={doRefresh} disabled={!refreshToken}>
            3) Refresh accessToken
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          <div>
            <b>accessToken:</b>{" "}
            <span>{accessToken ? "✅ cargado" : "❌ vacío"}</span>
          </div>
          <div>
            <b>refreshToken:</b>{" "}
            <span>{refreshToken ? "✅ cargado" : "❌ vacío"}</span>
          </div>
        </div>

        {result && (
          <pre style={{ marginTop: 16 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
