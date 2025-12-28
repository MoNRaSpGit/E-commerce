import { useState } from "react";
import { apiFetch } from "../services/apiFetch";
import TestAuthView from "../features/testAuth/TestAuthView";

export default function TestAuth() {
  const [email, setEmail] = useState("admin@eco.local");
  const [password, setPassword] = useState("admin");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [result, setResult] = useState(null);

  const safeJson = async (res) => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  const doLogin = async () => {
    setResult(null);
    try {
      const res = await apiFetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
        { auth: false }
      );

      const data = await safeJson(res);
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
      // TestAuth usa token “manual”, así que acá NO usamos auth automático.
      // Le pasamos el header a mano y auth:false para que apiFetch no meta otro.
      const res = await apiFetch(
        "/api/auth/me",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
        { auth: false }
      );

      const data = await safeJson(res);
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
      const res = await apiFetch(
        "/api/auth/refresh",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        },
        { auth: false }
      );

      const data = await safeJson(res);
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
      api={import.meta.env.VITE_API_URL}
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
