import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { MonthlyHistoryRow } from "../types";

export function MonthlyHistoryList({ rows }: { rows: MonthlyHistoryRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No hay información histórica suficiente.</p>;
  }

  const maxExpense = Math.max(...rows.map((row) => row.consolidatedExpenses), 1);

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.monthStart} className="rounded-2xl border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold capitalize">{row.label}</p>
              <p className="text-xs text-muted-foreground">Ahorro {formatPercent(row.savingsRate)} · Flujo {formatCurrency(row.netFlow)}</p>
            </div>
            <p className={row.netFlow >= 0 ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-red-700"}>{formatCurrency(row.netFlow)}</p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-slate-950" style={{ width: `${Math.min((row.consolidatedExpenses / maxExpense) * 100, 100)}%` }} />
          </div>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
            <span>Ingresos: {formatCurrency(row.income)}</span>
            <span>Manual: {formatCurrency(row.manualExpenses)}</span>
            <span>Mercado: {formatCurrency(row.marketExpenses)}</span>
            <span>Carro: {formatCurrency(row.carExpenses)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
