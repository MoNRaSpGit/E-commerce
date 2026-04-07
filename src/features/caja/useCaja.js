import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../services/apiFetch";

function normalizeCaja(raw) {
  if (!raw) return null;

  return {
    ...raw,
    monto_inicial: Number(raw.monto_inicial || 0),
    monto_actual: Number(raw.monto_actual || 0),
  };
}

function normalizeMovimientos(items) {
  if (!Array.isArray(items)) return [];
  return items.map((mov) => ({
    ...mov,
    monto: Number(mov.monto || 0),
  }));
}

function normalizeResumenDia(raw) {
  if (!raw) return null;

  return {
    fecha: raw.fecha || null,
    ventas_total: Number(raw.ventas_total || 0),
    pagos_total: Number(raw.pagos_total || 0),
    monto_apertura: Number(raw.monto_apertura || 0),
    monto_cierre: Number(raw.monto_cierre || 0),
    ganancia_estimada: Number(raw.ganancia_estimada || 0),
    cantidad_ventas: Number(raw.cantidad_ventas || 0),
  };
}

function normalizeRankingItems(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    ...item,
    producto_id: Number(item.producto_id || 0),
    total_vendido: Number(item.total_vendido || 0),
    price: Number(item.price || 0),
  }));
}

export function useCaja({ dispatch, navigate, user }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [caja, setCaja] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [resumenDia, setResumenDia] = useState({ hoy: null, ayer: null });
  const [dashboardRanking, setDashboardRanking] = useState({
    fecha: null,
    items: [],
  });

  const [montoInicial, setMontoInicial] = useState("");
  const [pagoMonto, setPagoMonto] = useState("");
  const [pagoDescripcion, setPagoDescripcion] = useState("");
  const cajaEventSourceRef = useRef(null);

  const isAdmin = user?.rol === "admin";
  const canPay = user?.rol === "admin" || user?.rol === "operario";

  async function fetchCajaData({ silent = false } = {}) {
    try {
      if (!silent) setLoading(true);

      const rDashboard = await apiFetch(
        "/api/caja/dashboard",
        { method: "GET" },
        { dispatch, navigate }
      );

      const dashboardData = await rDashboard.json().catch(() => null);

      if (rDashboard.ok && dashboardData?.ok) {
        const data = dashboardData.data || {};
        const cajaRoot = data.caja || {};
        const cajaActiva =
          cajaRoot && Object.prototype.hasOwnProperty.call(cajaRoot, "activa")
            ? cajaRoot.activa
            : (data.caja_activa ?? null);
        const cajaData = normalizeCaja(cajaActiva);
        const movimientosData = normalizeMovimientos(
          cajaRoot.movimientos ?? data.movimientos ?? []
        );
        const resumenData = data.resumen || {};
        const rankingData = data.ranking || {};

        setCaja(cajaData);
        setMovimientos(movimientosData);
        setResumenDia({
          hoy: normalizeResumenDia(resumenData.hoy),
          ayer: normalizeResumenDia(resumenData.ayer),
        });
        setDashboardRanking({
          fecha: rankingData.fecha || null,
          items: normalizeRankingItems(rankingData.items),
        });
      } else {
        setCaja(null);
        setMovimientos([]);
        setResumenDia({ hoy: null, ayer: null });
        setDashboardRanking({ fecha: null, items: [] });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function loadCaja() {
    await fetchCajaData({ silent: false });
  }

  useEffect(() => {
    loadCaja();
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("eco_auth");
    const stored = raw ? JSON.parse(raw) : null;
    const accessToken = stored?.accessToken;

    if (!accessToken) return;

    const apiBaseUrl = import.meta.env.VITE_API_URL;
    const es = new EventSource(
      `${apiBaseUrl}/api/caja/dashboard/stream?token=${encodeURIComponent(accessToken)}`
    );

    cajaEventSourceRef.current = es;

    es.addEventListener("caja_dashboard_updated", () => {
      fetchCajaData({ silent: true });
    });

    es.onmessage = () => {
      fetchCajaData({ silent: true });
    };

    es.onerror = () => {
      // dejamos que EventSource reconecte solo
    };

    return () => {
      try {
        es.close();
      } catch { }
      cajaEventSourceRef.current = null;
    };
  }, []);

  async function abrirCaja() {
    const monto = Number(String(montoInicial || "").replace(",", "."));
    if (!Number.isFinite(monto) || monto < 0) {
      alert("Monto inicial inválido");
      return;
    }

    try {
      setBusy(true);

      const r = await apiFetch(
        "/api/caja/abrir",
        {
          method: "POST",
          body: JSON.stringify({ montoInicial: monto }),
        },
        { dispatch, navigate }
      );

      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.ok) {
        alert(data?.error || "No se pudo abrir la caja");
        return;
      }

      setMontoInicial("");
      await loadCaja();
    } finally {
      setBusy(false);
    }
  }

  async function registrarPago() {
    const monto = Number(String(pagoMonto || "").replace(",", "."));
    const descripcion = String(pagoDescripcion || "").trim();

    if (!Number.isFinite(monto) || monto <= 0) {
      alert("Monto inválido");
      return;
    }

    if (!descripcion) {
      alert("La descripción es obligatoria");
      return;
    }

    try {
      setBusy(true);

      const r = await apiFetch(
        "/api/caja/pago",
        {
          method: "POST",
          body: JSON.stringify({ monto, descripcion }),
        },
        { dispatch, navigate }
      );

      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.ok) {
        alert(data?.error || "No se pudo registrar el pago");
        return;
      }

      setPagoMonto("");
      setPagoDescripcion("");
      await loadCaja();
    } finally {
      setBusy(false);
    }
  }

  async function cerrarCaja() {
    const ok = window.confirm("¿Cerrar caja?");
    if (!ok) return;

    try {
      setBusy(true);

      const r = await apiFetch(
        "/api/caja/cerrar",
        { method: "POST" },
        { dispatch, navigate }
      );

      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.ok) {
        alert(data?.error || "No se pudo cerrar la caja");
        return;
      }

      await loadCaja();
    } finally {
      setBusy(false);
    }
  }

  return {
    loading,
    busy,
    caja,
    movimientos,
    montoInicial,
    setMontoInicial,
    pagoMonto,
    setPagoMonto,
    pagoDescripcion,
    setPagoDescripcion,
    isAdmin,
    canPay,
    resumenDia,
    dashboardRanking,
    loadCaja,
    abrirCaja,
    registrarPago,
    cerrarCaja,
  };
}
