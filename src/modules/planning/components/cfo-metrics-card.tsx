import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { FinancialHealthScore } from "../types";

export function CfoMetricsCard({
  freeCashFlow,
  burnRate,
  runwayMonths,
  savingsEfficiency,
  liquidityRatio,
  healthScore,
}: {
  freeCashFlow: number;
  burnRate: number;
  runwayMonths: number;
  savingsEfficiency: number;
  liquidityRatio: number;
  healthScore: FinancialHealthScore;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas CFO del hogar</CardTitle>
        <CardDescription>Lectura ejecutiva basada en flujo, liquidez, deuda, presupuesto y patrimonio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border p-4">
            <p className="text-xs text-muted-foreground">Free Cash Flow Familiar</p>
            <p className={freeCashFlow >= 0 ? "mt-2 text-xl font-bold text-emerald-700" : "mt-2 text-xl font-bold text-red-700"}>{formatCurrency(freeCashFlow)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Ingresos menos gasto consolidado.</p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-xs text-muted-foreground">Burn Rate familiar</p>
            <p className="mt-2 text-xl font-bold">{formatCurrency(burnRate)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Gasto consolidado mensual.</p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-xs text-muted-foreground">Runway doméstico</p>
            <p className="mt-2 text-xl font-bold">{runwayMonths.toFixed(1)} meses</p>
            <p className="mt-1 text-xs text-muted-foreground">Liquidez / gasto mensual.</p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-xs text-muted-foreground">Savings Efficiency</p>
            <p className="mt-2 text-xl font-bold">{formatPercent(savingsEfficiency)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Flujo libre / ingresos.</p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-xs text-muted-foreground">Liquidity Ratio</p>
            <p className="mt-2 text-xl font-bold">{liquidityRatio.toFixed(2)}x</p>
            <p className="mt-1 text-xs text-muted-foreground">Liquidez sobre gasto mensual.</p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Financial Health Score v1</p>
              <p className="text-sm text-muted-foreground">Puntaje explicable. No es diagnóstico financiero; es una señal operativa para decidir.</p>
            </div>
            <p className="text-3xl font-bold">{healthScore.score}/100 · {healthScore.label}</p>
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {healthScore.signals.slice(0, 5).map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
