import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import type { ForecastSummary } from "../types";

export function ForecastSummaryCard({ summary }: { summary: ForecastSummary }) {
  const totalCommitments = summary.averageOperatingExpenses + summary.monthlyDebtPayments + summary.monthlyGoalRequired;
  const baseNet = summary.averageIncome - totalCommitments;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Base de proyección</CardTitle>
        <CardDescription>Promedios recientes + compromisos actuales para estimar los próximos meses.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-muted-foreground">Ingreso mensual promedio</p>
            <p className="mt-1 text-xl font-bold">{formatCurrency(summary.averageIncome)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-muted-foreground">Gasto operativo promedio</p>
            <p className="mt-1 text-xl font-bold">{formatCurrency(summary.averageOperatingExpenses)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-muted-foreground">Deuda + objetivos mensuales</p>
            <p className="mt-1 text-xl font-bold">{formatCurrency(summary.monthlyDebtPayments + summary.monthlyGoalRequired)}</p>
          </div>
          <div className={`rounded-2xl p-4 ${baseNet >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
            <p className="text-xs text-muted-foreground">Flujo base proyectado</p>
            <p className={`mt-1 text-xl font-bold ${baseNet >= 0 ? "text-emerald-700" : "text-red-700"}`}>{formatCurrency(baseNet)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
