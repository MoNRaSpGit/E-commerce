import { useState } from "react";
import TestAuthView from "../features/testAuth/TestAuthView";

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

      const data = await res.json().catch(() => null);
      console.log("LOGIN:", data);

      if (!res.ok || !data?.ok) {
        setResult({ ok: false, step: "login", ...(data || { error: "Login inválido" }) });
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

      const data = await res.json().catch(() => null);
      console.log("ME:", data);

      setResult({ status: res.status, ...(data || { ok: false, error: "Respuesta inválida" }) });
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

      const data = await res.json().catch(() => null);
      console.log("REFRESH:", data);

      if (!res.ok || !data?.ok) {
        setResult({ ok: false, step: "refresh", ...(data || { error: "Refresh inválido" }) });
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
    <TestAuthView
      api={api}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      accessToken={accessToken}
      refreshToken={refreshToken}
      onLogin={doLogin}
      onTestMe={testMe}
      onRefresh={doRefresh}
      result={result}
    />
  );
}
