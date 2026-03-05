import { useState } from "react";
import { useScanItems } from "./useScanItems";
import { useScanLookup } from "./useScanLookup";
import { useNotFoundCreate } from "./useNotFoundCreate";
import { useEditProduct } from "./useEditProduct";

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
        name: `${cleanLabel} (manual)`,
        price: p,
        qty: 1,
        has_image: false,
        imageDataUrl: null,
      },
    ]);

    scan.focusScan();
  };

  const onPagar = () => clearAll(scan.focusScan, scan.setCode, scan.setMsg);

  const onScanEnter = () =>
    scan.onScanEnter({
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

    // items
    items,
    total,

    // actions
    onScanEnter,
    removeItem: (id) => removeItem(id, scan.focusScan),
    onPagar,
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