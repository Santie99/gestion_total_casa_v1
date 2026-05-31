import Link from "next/link";
import { formatCurrency } from "@/lib/formatters";
import type { MarketPeriod } from "../types";

export function MarketPeriodList({
  periods,
  selectedPeriodId,
  totalsByPeriod,
}: {
  periods: MarketPeriod[];
  selectedPeriodId: string | null;
  totalsByPeriod: Record<string, number>;
}) {
  if (periods.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay quincenas creadas todavía.</p>;
  }

  return (
    <div className="space-y-3">
      {periods.map((period) => {
        const isSelected = period.id === selectedPeriodId;
        return (
          <Link
            key={period.id}
            href={`/mercado?period=${period.id}`}
            className={`block rounded-2xl border p-4 transition hover:bg-slate-50 ${isSelected ? "border-slate-900 bg-slate-50" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{period.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{period.starts_on} → {period.ends_on}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{period.status}</span>
            </div>
            <p className="mt-3 text-sm font-semibold">{formatCurrency(totalsByPeriod[period.id] ?? 0)}</p>
          </Link>
        );
      })}
    </div>
  );
}
