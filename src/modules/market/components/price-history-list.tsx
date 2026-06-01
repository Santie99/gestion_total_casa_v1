import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { PriceHistoryRow } from "../types";

export function PriceHistoryList({ rows }: { rows: PriceHistoryRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay suficientes productos comparables. Registra al menos una compra con cantidad, unidad y precio total.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.slice(0, 12).map((row) => {
        const hasVariation = row.variationAmount !== null && row.variationPercent !== null;
        const variationLabel = hasVariation
          ? `${row.variationAmount! >= 0 ? "+" : ""}${formatCurrency(row.variationAmount!)} · ${row.variationPercent! >= 0 ? "+" : ""}${formatPercent(row.variationPercent!)}`
          : "Sin compra anterior";

        return (
          <div key={row.key} className="rounded-2xl border p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold">{row.productName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.categoryName ?? "Sin categoría"} · Unidad comparable: {row.unit}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm font-semibold">{formatCurrency(row.latestPrice)} / {row.unit}</p>
                <p className="mt-1 text-xs text-muted-foreground">Última compra: {row.latestDate}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Precio anterior</p>
                <p className="font-medium">{row.previousPrice !== null ? `${formatCurrency(row.previousPrice)} / ${row.unit}` : "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Variación</p>
                <p className={hasVariation && row.variationAmount! > 0 ? "font-medium text-red-700" : "font-medium text-emerald-700"}>{variationLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Comparación</p>
                <p className="font-medium">{row.previousDate ? `${row.previousDate} → ${row.latestDate}` : "Falta histórico"}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
