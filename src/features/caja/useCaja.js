import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../services/apiFetch";

export function useCaja({ dispatch, navigate, user }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [caja, setCaja] = useState(null);
  const [movimientos, setMovimientos] = useState([]);

  const [montoInicial, setMontoInicial] = useState("");
  const [pagoMonto, setPagoMonto] = useState("");
  const [pagoDescripcion, setPagoDescripcion] = useState("");
  const cajaEventSourceRef = useRef(null);

  const isAdmin = user?.rol === "admin";
  const canPay = user?.rol === "admin" || user?.rol === "operario";

  const resumen = useMemo(() => {
    let ventas = 0;
    let pagos = 0;

    for (const mov of movimientos) {
      const monto = Number(mov.monto || 0);
      if (mov.tipo === "venta" || mov.tipo === "apertura") ventas += monto;
      if (mov.tipo === "pago") pagos += monto;
    }

    return { ventas, pagos };
  }, [movimientos]);


  async function fetchCajaData({ silent = false } = {}) {
    try {
      if (!silent) setLoading(true);

      const [rCaja, rMovs] = await Promise.all([
        apiFetch("/api/caja/activa", { method: "GET" }, { dispatch, navigate }),
        apiFetch("/api/caja/activa/movimientos", { method: "GET" }, { dispatch, navigate }),
      ]);

      const cajaData = await rCaja.json().catch(() => null);
      const movData = await rMovs.json().catch(() => null);

      if (rCaja.ok && cajaData?.ok) {
        setCaja(cajaData.data || null);
      } else {
        setCaja(null);
      }

      if (rMovs.ok && movData?.ok) {
        setMovimientos(movData?.data?.movimientos || []);
      } else {
        setMovimientos([]);
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
      `${apiBaseUrl}/api/caja/stream?token=${encodeURIComponent(accessToken)}`
    );

    cajaEventSourceRef.current = es;

    es.addEventListener("caja_updated", () => {
      fetchCajaData({ silent: true });
    });

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
    resumen,
    loadCaja,
    abrirCaja,
    registrarPago,
    cerrarCaja,
  };
}