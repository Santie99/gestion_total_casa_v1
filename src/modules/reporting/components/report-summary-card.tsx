import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { ReportSummary } from "../types";

export function ReportSummaryCard({ summary }: { summary: ReportSummary }) {
  const metrics = [
    { label: "Ingresos", value: formatCurrency(summary.income), tone: "text-emerald-700" },
    { label: "Gasto consolidado", value: formatCurrency(summary.consolidatedExpenses), tone: "text-slate-950" },
    { label: "Flujo neto", value: formatCurrency(summary.netFlow), tone: summary.netFlow >= 0 ? "text-emerald-700" : "text-red-700" },
    { label: "Tasa de ahorro", value: formatPercent(summary.savingsRate), tone: summary.savingsRate >= 0 ? "text-emerald-700" : "text-red-700" },
  ];

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle>Resumen financiero mensual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className={`mt-1 text-xl font-bold ${metric.tone}`}>{metric.value}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border p-4">
            <p className="text-xs text-muted-foreground">Gastos manuales</p>
            <p className="mt-1 font-semibold">{formatCurrency(summary.manualExpenses)}</p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-xs text-muted-foreground">Mercado</p>
            <p className="mt-1 font-semibold">{formatCurrency(summary.marketExpenses)}</p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-xs text-muted-foreground">Carro</p>
            <p className="mt-1 font-semibold">{formatCurrency(summary.carExpenses)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
