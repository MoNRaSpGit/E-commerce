export function formatUYU(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-UY", {
    style: "currency",
    currency: "UYU",
  });
}
