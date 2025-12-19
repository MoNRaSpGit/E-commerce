import { useEffect, useState } from "react";

export default function App() {
  const API = import.meta.env.VITE_API_URL;

  const [productos, setProductos] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        if (!API) throw new Error("Falta configurar VITE_API_URL");

        const r = await fetch(`${API}/api/productos`);
        const json = await r.json();

        if (!r.ok || !json.ok) {
          throw new Error(json.error || `Error HTTP ${r.status}`);
        }

        setProductos(json.data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, [API]);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h1>Productos (demo)</h1>
      <p>
        API: <code>{API || "(sin configurar)"}</code>
      </p>

      {cargando && <p>Cargando...</p>}
      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {!cargando && !error && (
        <ul>
          {productos.map((p, i) => (
            <li key={p.id ?? i}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(p, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
