import { formatCurrency, formatDate, formatPercent } from "@/lib/formatters";
import { getGoalHealthLabel } from "../calculations";
import type { GoalProgress } from "../types";

function healthClass(health: GoalProgress["health"]) {
  if (health === "completed") return "text-emerald-700";
  if (health === "late") return "text-red-700";
  if (health === "at_risk") return "text-amber-700";
  if (health === "paused") return "text-slate-500";
  return "text-emerald-700";
}

export function GoalList({ goals }: { goals: GoalProgress[] }) {
  if (!goals.length) {
    return <p className="text-sm text-muted-foreground">Aún no hay objetivos financieros. Crea el primero para empezar a medir progreso.</p>;
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <div key={goal.id} className="rounded-2xl border p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{goal.name}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{goal.categoryLabel}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">Prioridad {goal.priorityLabel}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Responsable: {goal.responsibleName ?? "Sin responsable"} · Fecha objetivo: {formatDate(goal.targetDate)}
              </p>
            </div>
            <p className={`text-sm font-semibold ${healthClass(goal.health)}`}>{getGoalHealthLabel(goal.health)}</p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-muted-foreground">Acumulado</p>
              <p className="font-semibold">{formatCurrency(goal.accumulatedAmount)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-muted-foreground">Faltante</p>
              <p className="font-semibold">{formatCurrency(goal.remainingAmount)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-muted-foreground">Aporte mensual requerido</p>
              <p className="font-semibold">{goal.requiredMonthlyContribution !== null ? formatCurrency(goal.requiredMonthlyContribution) : "Sin fecha"}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(goal.accumulatedAmount)} de {formatCurrency(goal.targetAmount)}</span>
              <span>{formatPercent(goal.progressRate)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-slate-900" style={{ width: `${Math.min(goal.progressRate * 100, 100)}%` }} />
            </div>
          </div>

          {goal.notes ? <p className="mt-3 text-sm text-muted-foreground">{goal.notes}</p> : null}
        </div>
      ))}
    </div>
  );
}
