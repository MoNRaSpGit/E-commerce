const STORAGE_KEY = "eco_auth";

function readAccessToken() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.accessToken || null;
  } catch {
    return null;
  }
}

export function createScanLiveEventSource() {
  const apiBaseUrl = import.meta.env.VITE_API_URL;
  const token = readAccessToken();

  if (!token) return null;

  return new EventSource(
    `${apiBaseUrl}/api/scanlive/stream?token=${encodeURIComponent(token)}`
  );
}