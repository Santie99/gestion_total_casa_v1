import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { WealthSummary } from "../types";

export function WealthSummaryCard({ summary }: { summary: WealthSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance patrimonial</CardTitle>
        <CardDescription>Primera lectura de activos, deudas y patrimonio neto.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-muted-foreground">Activos</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{formatCurrency(summary.totalAssets)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-muted-foreground">Deudas</p>
            <p className="mt-1 text-xl font-bold text-red-700">{formatCurrency(summary.totalDebts)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-muted-foreground">Patrimonio neto</p>
            <p className={summary.netWorth >= 0 ? "mt-1 text-xl font-bold text-emerald-700" : "mt-1 text-xl font-bold text-red-700"}>{formatCurrency(summary.netWorth)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-muted-foreground">Deuda / activos</p>
            <p className="mt-1 text-xl font-bold">{formatPercent(summary.debtToAssetRatio)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
