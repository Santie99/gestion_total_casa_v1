import { formatCurrency, formatPercent } from "@/lib/formatters";
import { getBudgetScopeLabel, getBudgetStatusLabel } from "../calculations";
import type { BudgetExecution } from "../types";

function statusClass(status: BudgetExecution["status"]) {
  if (status === "exceeded") return "bg-red-50 text-red-700 border-red-100";
  if (status === "warning") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-emerald-50 text-emerald-700 border-emerald-100";
}

export function BudgetExecutionList({ executions }: { executions: BudgetExecution[] }) {
  if (!executions.length) {
    return <p className="text-sm text-muted-foreground">Aún no hay presupuestos para este mes.</p>;
  }

  return (
    <div className="space-y-3">
      {executions.map((execution) => (
        <div key={execution.id} className="rounded-2xl border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold">{execution.label}</p>
              <p className="text-xs text-muted-foreground">{getBudgetScopeLabel(execution.scope)}</p>
            </div>
            <span className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${statusClass(execution.status)}`}>
              {getBudgetStatusLabel(execution.status)}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-muted-foreground">Presupuesto</p>
              <p className="font-semibold">{formatCurrency(execution.budgeted)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-muted-foreground">Real</p>
              <p className="font-semibold">{formatCurrency(execution.actual)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-muted-foreground">Diferencia</p>
              <p className={execution.variance >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>
                {formatCurrency(execution.variance)}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Ejecución</span>
              <span>{formatPercent(execution.usageRate)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-slate-900" style={{ width: `${Math.min(execution.usageRate * 100, 100)}%` }} />
            </div>
          </div>

          {execution.notes ? <p className="mt-3 text-sm text-muted-foreground">{execution.notes}</p> : null}
        </div>
      ))}
    </div>
  );
}
