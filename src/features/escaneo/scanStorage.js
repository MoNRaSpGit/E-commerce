const STORAGE_SCAN_ITEMS = "eco_oper_scan_items_v1";

export function loadScanItems() {
  try {
    const raw = localStorage.getItem(STORAGE_SCAN_ITEMS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}

export function saveScanItems(items) {
  try {
    localStorage.setItem(STORAGE_SCAN_ITEMS, JSON.stringify(items));
  } catch {}
}

export function clearScanItems() {
  try {
    localStorage.removeItem(STORAGE_SCAN_ITEMS);
  } catch {}
}