import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InsightSummary } from "../types";

export function InsightSummaryCard({ summary }: { summary: InsightSummary }) {
  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle>Resumen de insights</CardTitle>
        <CardDescription>Señales generadas por reglas determinísticas. No usan IA externa todavía.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-xs text-slate-300">Total</p>
            <p className="mt-1 text-2xl font-bold">{summary.total}</p>
          </div>
          <div className="rounded-2xl bg-red-50 p-4 text-red-800">
            <p className="text-xs">Críticos</p>
            <p className="mt-1 text-2xl font-bold">{summary.critical}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4 text-amber-800">
            <p className="text-xs">Alertas</p>
            <p className="mt-1 text-2xl font-bold">{summary.warning}</p>
          </div>
          <div className="rounded-2xl bg-blue-50 p-4 text-blue-800">
            <p className="text-xs">Informativos</p>
            <p className="mt-1 text-2xl font-bold">{summary.info}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-800">
            <p className="text-xs">Positivos</p>
            <p className="mt-1 text-2xl font-bold">{summary.positive}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
