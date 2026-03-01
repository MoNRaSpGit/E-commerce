import SinStockItemCard from "./SinStockItemCard";
import { useSinStockItem } from "./useSinStockItem";

function getInitials(name) {
  const s = String(name || "").trim();
  if (!s) return "—";
  const parts = s.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || parts[0]?.[1] || "";
  return (first + second).toUpperCase();
}

export default function SinStockItem({ p, dispatch, navigate }) {
  const { imgSrc, value, setValue, saving, currentStock, onSave } =
    useSinStockItem({ p, dispatch, navigate });

  return (
    <SinStockItemCard
      name={p?.name || ""}
      imgSrc={imgSrc}
      initials={getInitials(p?.name)}
      currentStock={currentStock}
      value={value}
      onChangeValue={setValue}
      saving={saving}
      onSave={onSave}
    />
  );
}