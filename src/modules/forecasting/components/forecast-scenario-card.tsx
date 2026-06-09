import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import type { ForecastMonth, ForecastScenario } from "../types";

function scenarioClass(key: ForecastScenario["key"]) {
  if (key === "optimistic") return "border-emerald-200 bg-emerald-50/60";
  if (key === "pessimistic") return "border-red-200 bg-red-50/60";
  return "border-slate-200 bg-white";
}

export function ForecastScenarioCard({
  scenario,
  months,
}: {
  scenario: ForecastScenario;
  months: ForecastMonth[];
}) {
  const lastMonth = months[months.length - 1];
  const firstNegative = months.find((month) => month.projectedCashPosition < 0);

  return (
    <Card className={scenarioClass(scenario.key)}>
      <CardHeader>
        <CardTitle>{scenario.name}</CardTitle>
        <CardDescription>{scenario.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/75 p-4">
            <p className="text-xs text-muted-foreground">Flujo del primer mes</p>
            <p className={`mt-1 text-lg font-bold ${months[0]?.projectedNetFlow >= 0 ? "text-emerald-700" : "text-red-700"}`}>
              {formatCurrency(months[0]?.projectedNetFlow ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl bg-white/75 p-4">
            <p className="text-xs text-muted-foreground">Caja estimada al final</p>
            <p className={`mt-1 text-lg font-bold ${(lastMonth?.projectedCashPosition ?? 0) >= 0 ? "text-slate-950" : "text-red-700"}`}>
              {formatCurrency(lastMonth?.projectedCashPosition ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl bg-white/75 p-4">
            <p className="text-xs text-muted-foreground">Riesgo</p>
            <p className={`mt-1 text-sm font-bold ${firstNegative ? "text-red-700" : "text-emerald-700"}`}>
              {firstNegative ? `Caja negativa en ${firstNegative.label}` : "Sin caja negativa"}
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-3">
            {months.map((month) => (
              <div key={`${scenario.key}-${month.monthStart}`} className="min-w-[13rem] rounded-2xl border bg-white/80 p-4">
                <p className="text-sm font-semibold capitalize">{month.label}</p>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>Ingreso: <span className="font-semibold text-slate-800">{formatCurrency(month.projectedIncome)}</span></p>
                  <p>Salida: <span className="font-semibold text-slate-800">{formatCurrency(month.projectedOutflow)}</span></p>
                  <p>Flujo: <span className={month.projectedNetFlow >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>{formatCurrency(month.projectedNetFlow)}</span></p>
                  <p>Caja: <span className="font-semibold text-slate-800">{formatCurrency(month.projectedCashPosition)}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
