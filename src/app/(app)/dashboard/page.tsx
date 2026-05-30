import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentMonthRange } from "@/lib/dates";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";
import { getMonthlyTotals, groupEntriesByCategory } from "@/modules/finance/calculations";
import { SummaryCard } from "@/modules/finance/components/summary-card";
import type { FinanceEntry } from "@/modules/finance/types";
import { getCurrentFamily } from "@/modules/household/queries";

export default async function DashboardPage() {
  const context = await getCurrentFamily();
  const supabase = await createClient();
  const month = getCurrentMonthRange();

  const [{ data: incomeEntries }, { data: expenseEntries }] = await Promise.all([
    supabase
      .from("income_entries")
      .select("id, amount, occurred_on, description, category_id, categories(name)")
      .eq("family_id", context.familyId)
      .gte("occurred_on", month.start)
      .lte("occurred_on", month.end)
      .order("occurred_on", { ascending: false }),
    supabase
      .from("expense_entries")
      .select("id, amount, occurred_on, description, category_id, categories(name)")
      .eq("family_id", context.familyId)
      .gte("occurred_on", month.start)
      .lte("occurred_on", month.end)
      .order("occurred_on", { ascending: false }),
  ]);

  const incomes = (incomeEntries ?? []) as unknown as FinanceEntry[];
  const expenses = (expenseEntries ?? []) as unknown as FinanceEntry[];
  const totals = getMonthlyTotals(incomes, expenses);
  const expenseCategories = groupEntriesByCategory(expenses).slice(0, 6);
  const latestMovements = [
    ...incomes.map((entry) => ({ ...entry, type: "income" as const })),
    ...expenses.map((entry) => ({ ...entry, type: "expense" as const })),
  ]
    .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Sprint 2 · Dashboard MVP</p>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard ejecutivo</h2>
        <p className="mt-2 text-muted-foreground">
          Resumen de {context.familyName} para {month.label}. Esta es la primera capa financiera real.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Ingresos del mes" value={totals.income} description="Entradas registradas con fecha real dentro del mes." tone="positive" />
        <SummaryCard title="Gastos del mes" value={totals.expenses} description="Salidas registradas. Incluye gastos manuales y futuros módulos operativos." tone="negative" />
        <SummaryCard
          title="Flujo neto"
          value={totals.netFlow}
          description="Ingresos menos gastos. Es la base del Free Cash Flow Familiar."
          tone={totals.netFlow >= 0 ? "positive" : "negative"}
        />
        <Card>
          <CardHeader>
            <CardDescription>Tasa de ahorro</CardDescription>
            <CardTitle className={totals.savingsRate >= 0 ? "text-2xl text-emerald-700" : "text-2xl text-red-700"}>
              {formatPercent(totals.savingsRate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Flujo neto dividido entre ingresos. Si es negativa, el hogar gastó más de lo que entró.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Gasto por categoría</CardTitle>
            <CardDescription>Primer análisis de concentración de gasto.</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseCategories.length ? (
              <div className="space-y-4">
                {expenseCategories.map((category) => {
                  const percentage = totals.expenses > 0 ? category.amount / totals.expenses : 0;
                  return (
                    <div key={category.name} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{category.name}</span>
                        <span className="text-muted-foreground">{formatCurrency(category.amount)} · {formatPercent(percentage)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-slate-900" style={{ width: `${Math.min(percentage * 100, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Registra gastos para ver la distribución por categoría.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos movimientos</CardTitle>
            <CardDescription>Ingresos y gastos más recientes del mes.</CardDescription>
          </CardHeader>
          <CardContent>
            {latestMovements.length ? (
              <div className="space-y-3">
                {latestMovements.map((movement) => (
                  <div key={`${movement.type}-${movement.id}`} className="flex items-start justify-between gap-3 rounded-xl border p-3">
                    <div>
                      <p className="text-sm font-medium">{movement.description || "Movimiento sin descripción"}</p>
                      <p className="text-xs text-muted-foreground">{movement.categories?.name ?? "Sin categoría"} · {movement.occurred_on}</p>
                    </div>
                    <p className={movement.type === "income" ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-red-700"}>
                      {movement.type === "income" ? "+" : "-"}{formatCurrency(movement.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aún no hay movimientos este mes.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lectura CFO inicial</CardTitle>
          <CardDescription>Interpretación simple de la salud mensual del hogar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold">Free Cash Flow Familiar</p>
              <p className="mt-1 text-sm text-muted-foreground">Por ahora equivale al flujo neto mensual. Luego restaremos pagos de deuda, inversiones y compromisos estratégicos.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold">Control de gasto</p>
              <p className="mt-1 text-sm text-muted-foreground">La distribución por categoría permite detectar concentración y preparar presupuestos por rubro.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold">Siguiente capa</p>
              <p className="mt-1 text-sm text-muted-foreground">Con más datos podremos activar burn rate, runway doméstico, presupuestos y alertas.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
