import { useState } from "react";
import { useScanItems } from "./useScanItems";
import { useScanLookup } from "./useScanLookup";
import { useNotFoundCreate } from "./useNotFoundCreate";
import { useEditProduct } from "./useEditProduct";
import { useScanLiveSync } from "../../hooks/useScanLiveSync";

// ⚠️ Nota: acá ya NO hay delete, ni /api/actualizacion (toUpdate).
export function useOperarioEscaneo({ dispatch, navigate }) {
  const { items, setItems, total, removeItem, clearAll } = useScanItems();

  const scan = useScanLookup({ dispatch, navigate, items, setItems });

  const nf = useNotFoundCreate({
    dispatch,
    navigate,
    setItems,
    focusScan: scan.focusScan,
  });

  const ed = useEditProduct({
    dispatch,
    navigate,
    setItems,
    focusScan: scan.focusScan,
    invalidateCachedProduct: scan.invalidateCachedProduct,
  });

  const { closeScanLiveSession } = useScanLiveSync({
    items,
    setItems,
    dispatch,
    navigate,
  });


  const addManualItem = ({ label, price }) => {
    const cleanLabel = String(label || "Manual").trim() || "Manual";
    const p = Number(price);

    if (!Number.isFinite(p) || p <= 0) return;

    const tmpId = -Date.now();

    setItems((prev) => [
      ...prev,
      {
        id: tmpId,
        name: "Producto manual",
        price: p,
        qty: 1,
        has_image: false,
        imageDataUrl: null,
      },
    ]);


  };

  const [payOpen, setPayOpen] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payMetrics, setPayMetrics] = useState({
    totalDurationMs: null,
    closeDurationMs: null,
    clearDurationMs: null,
  });

  const onPagar = () => setPayOpen(true);

  const confirmPagar = async () => {
    const totalStartedAt = performance.now();
    setPayOpen(false);
    setPayLoading(true);

    try {
      const closeStartedAt = performance.now();
      await closeScanLiveSession();
      const closeDurationMs = performance.now() - closeStartedAt;

      const clearStartedAt = performance.now();
      clearAll(scan.focusScan, scan.setCode, scan.setMsg);
      const clearDurationMs = performance.now() - clearStartedAt;

      setPayMetrics({
        totalDurationMs: performance.now() - totalStartedAt,
        closeDurationMs,
        clearDurationMs,
      });
    } finally {
      setPayLoading(false);
    }
  };

  const cancelPagar = () => {
    setPayOpen(false);
    scan.focusScan?.();
  };

  const onScanEnter = (opts) =>
    scan.onScanEnter({
      ...opts,
      onNotFoundBarcode: nf.openNotFound,
    });

  return {
    // refs
    inputRef: scan.inputRef,
    nfNameRef: nf.nfNameRef,

    // scan state
    code: scan.code,
    setCode: scan.setCode,
    loading: scan.loading,
    msg: scan.msg,
    metrics: scan.metrics,

    // items
    items,
    total,

    // actions
    onScanEnter,
    removeItem: (id) => removeItem(id, scan.focusScan),
    onPagar,
    confirmPagar,
    cancelPagar,
    payOpen,
    payLoading,
    payMetrics,
    setPayOpen,
    focusScan: scan.focusScan,

    // not found modal
    nfOpen: nf.nfOpen,
    nfBarcode: nf.nfBarcode,
    nfName: nf.nfName,
    nfPrice: nf.nfPrice,
    nfSaving: nf.nfSaving,
    setNfOpen: nf.setNfOpen,
    setNfName: nf.setNfName,
    setNfPrice: nf.setNfPrice,
    saveNotFound: nf.saveNotFound,

    // edit modal
    edOpen: ed.edOpen,
    setEdOpen: ed.setEdOpen,
    edName: ed.edName,
    setEdName: ed.setEdName,
    edPrice: ed.edPrice,
    setEdPrice: ed.setEdPrice,
    edSaving: ed.edSaving,
    openEditModal: ed.openEditModal,
    saveEdit: ed.saveEdit,

    addManualItem,
  };
}
