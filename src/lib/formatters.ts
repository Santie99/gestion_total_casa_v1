export function formatCurrency(value: number | string | null | undefined) {
  const numericValue = typeof value === "string" ? Number(value) : value ?? 0;

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);
}
