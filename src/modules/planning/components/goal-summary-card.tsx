import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { GoalSummary } from "../types";

export function GoalSummaryCards({ summary }: { summary: GoalSummary }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription>Objetivos activos</CardDescription>
          <CardTitle className="text-2xl">{summary.activeGoals}</CardTitle>
        </CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Metas financieras abiertas.</p></CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Meta total activa</CardDescription>
          <CardTitle className="text-2xl">{formatCurrency(summary.totalTargetAmount)}</CardTitle>
        </CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Suma de montos objetivo activos.</p></CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Acumulado hacia metas</CardDescription>
          <CardTitle className="text-2xl text-emerald-700">{formatCurrency(summary.totalAccumulatedAmount)}</CardTitle>
        </CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Monto actual + aportes registrados.</p></CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Avance promedio</CardDescription>
          <CardTitle className="text-2xl">{formatPercent(summary.averageProgressRate)}</CardTitle>
        </CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Progreso agregado de objetivos activos.</p></CardContent>
      </Card>
    </div>
  );
}
