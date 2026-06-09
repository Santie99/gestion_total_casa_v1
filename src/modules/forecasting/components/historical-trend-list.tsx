import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import type { HistoricalMonth } from "../types";

export function HistoricalTrendList({ months }: { months: HistoricalMonth[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia reciente</CardTitle>
        <CardDescription>Base histórica usada para calcular los promedios de proyección.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-3">
            {months.map((month) => (
              <div key={month.monthStart} className="min-w-[14rem] rounded-2xl border bg-slate-50 p-4">
                <p className="text-sm font-semibold capitalize">{month.label}</p>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>Ingresos: <span className="font-semibold text-slate-800">{formatCurrency(month.income)}</span></p>
                  <p>Gastos manuales: <span className="font-semibold text-slate-800">{formatCurrency(month.manualExpenses)}</span></p>
                  <p>Mercado: <span className="font-semibold text-slate-800">{formatCurrency(month.marketExpenses)}</span></p>
                  <p>Carro: <span className="font-semibold text-slate-800">{formatCurrency(month.carExpenses)}</span></p>
                  <p>Flujo: <span className={month.netFlow >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>{formatCurrency(month.netFlow)}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
