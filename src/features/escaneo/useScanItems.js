import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { loadScanItems, saveScanItems, clearScanItems } from "./scanStorage";

export function useScanItems() {
  const [items, setItems] = useState(() => {
    const stored = loadScanItems();
    return stored
      .map((x) => ({
        id: Number(x.id),
        name: x.name,
        price: Number(x.price || 0),
        qty: Math.max(1, Number(x.qty || 1)),
        has_image: !!x.has_image,
        imageDataUrl: null,
      }))
      .filter((x) => Number.isFinite(x.id) && x.id !== 0);
  });

  useEffect(() => {
    const compact = items.map((x) => ({
      id: x.id,
      name: x.name,
      price: x.price,
      qty: x.qty,
      has_image: x.has_image,
    }));
    saveScanItems(compact);
  }, [items]);

  const total = useMemo(() => {
    return items.reduce(
      (acc, it) => acc + Number(it.price || 0) * (it.qty || 0),
      0
    );
  }, [items]);

  const removeItem = (id, focusScan) => {
    setItems((prev) => {
      const found = prev.find((x) => x.id === id);
      if (!found) return prev;

      const nextQty = Math.max(0, Number(found.qty || 0) - 1);
      if (nextQty === 0) return prev.filter((x) => x.id !== id);

      return prev.map((x) => (x.id === id ? { ...x, qty: nextQty } : x));
    });

    focusScan?.();
  };

  const clearAll = (focusScan, setCode, setMsg) => {
    setItems([]);
    setCode?.("");
    setMsg?.("");
    clearScanItems();
    toast.success("Lista finalizada ✅");
    focusScan?.();
  };

  return { items, setItems, total, removeItem, clearAll };
}