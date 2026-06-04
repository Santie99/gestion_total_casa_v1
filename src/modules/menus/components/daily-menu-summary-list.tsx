import { formatDate } from "@/lib/formatters";
import type { DailyMenuSummary } from "../types";

export function DailyMenuSummaryList({ summaries }: { summaries: DailyMenuSummary[] }) {
  if (!summaries.length) {
    return <p className="text-sm text-muted-foreground">Cuando crees menús, aquí verás la carga estimada por día.</p>;
  }

  return (
    <div className="space-y-3">
      {summaries.map((summary) => (
        <div key={summary.plannedOn} className="rounded-2xl border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{formatDate(summary.plannedOn)}</p>
              <p className="text-xs text-muted-foreground">{summary.mealCount} comidas planeadas</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold">{summary.estimatedCalories.toLocaleString("es-CO", { maximumFractionDigits: 0 })} kcal</p>
              <p className="text-muted-foreground">{summary.estimatedProtein.toLocaleString("es-CO", { maximumFractionDigits: 1 })} g proteína</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
