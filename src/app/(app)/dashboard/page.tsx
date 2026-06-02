export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentMonthRange } from "@/lib/dates";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";
import { getMonthlyTotals, groupEntriesByCategory } from "@/modules/finance/calculations";
import { sumItemsByPurchase } from "@/modules/market/calculations";
import { getUpcomingReminders, sumCarExpenses } from "@/modules/car/calculations";
import type { MarketPeriod, MarketPurchase, MarketPurchaseItem } from "@/modules/market/types";
import type { CarExpense, CarReminder } from "@/modules/car/types";
import { SummaryCard } from "@/modules/finance/components/summary-card";
import type { FinanceEntry } from "@/modules/finance/types";
import { getCurrentFamily } from "@/modules/household/queries";

export default async function DashboardPage() {
  const context = await getCurrentFamily();
  const supabase = await createClient();
  const month = getCurrentMonthRange();

  const [{ data: incomeEntries }, { data: expenseEntries }, { data: marketPeriodsData }, { data: marketPurchasesData }, { data: carExpensesData }, { data: carRemindersData }] = await Promise.all([
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
    supabase
      .from("market_periods")
      .select("id, family_id, name, starts_on, ends_on, status, notes, created_at")
      .eq("family_id", context.familyId)
      .order("starts_on", { ascending: false })
      .limit(1),
    supabase
      .from("market_purchases")
      .select("id, family_id, market_period_id, invoice_id, purchased_on, vendor, purchase_type, notes, created_at")
      .eq("family_id", context.familyId)
      .order("purchased_on", { ascending: false }),
    supabase
      .from("car_expenses")
      .select("id, family_id, vehicle_id, category, amount, occurred_on, monthly_period, vendor, odometer_km, notes, created_at")
      .eq("family_id", context.familyId)
      .gte("occurred_on", month.start)
      .lte("occurred_on", month.end)
      .order("occurred_on", { ascending: false }),
    supabase
      .from("car_reminders")
      .select("id, family_id, vehicle_id, title, category, due_on, due_km, status, notes, created_at")
      .eq("family_id", context.familyId)
      .eq("status", "pending"),
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

  const marketPeriods = (marketPeriodsData ?? []) as MarketPeriod[];
  const latestMarketPeriod = marketPeriods[0] ?? null;
  const marketPurchases = (marketPurchasesData ?? []) as MarketPurchase[];
  const latestMarketPurchases = latestMarketPeriod
    ? marketPurchases.filter((purchase) => purchase.market_period_id === latestMarketPeriod.id)
    : [];
  const latestMarketPurchaseIds = latestMarketPurchases.map((purchase) => purchase.id);
  const { data: latestMarketItemsData } = latestMarketPurchaseIds.length
    ? await supabase
        .from("market_purchase_items")
        .select("id, family_id, market_purchase_id, product_id, product_name, category_name, quantity, unit, total_price, unit_price, updates_stock, created_at")
        .eq("family_id", context.familyId)
        .in("market_purchase_id", latestMarketPurchaseIds)
    : { data: [] };
  const latestMarketItems = (latestMarketItemsData ?? []) as MarketPurchaseItem[];
  const marketTotalsByPurchase = sumItemsByPurchase(latestMarketItems);
  const latestMarketTotal = latestMarketPurchases.reduce((total, purchase) => total + (marketTotalsByPurchase[purchase.id] ?? 0), 0);
  const carExpenses = (carExpensesData ?? []) as unknown as CarExpense[];
  const carReminders = getUpcomingReminders((carRemindersData ?? []) as unknown as CarReminder[]);
  const carMonthTotal = sumCarExpenses(carExpenses);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Sprint 6 · Dashboard MVP conectado a Mercado y Carro</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Mercado actual</CardTitle>
          <CardDescription>Primer enlace entre la capa financiera y la operación del hogar.</CardDescription>
        </CardHeader>
        <CardContent>
          {latestMarketPeriod ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-muted-foreground">Quincena</p>
                <p className="mt-1 font-semibold">{latestMarketPeriod.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{latestMarketPeriod.starts_on} → {latestMarketPeriod.ends_on}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-muted-foreground">Total registrado</p>
                <p className="mt-1 font-semibold">{formatCurrency(latestMarketTotal)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-muted-foreground">Compras</p>
                <p className="mt-1 font-semibold">{latestMarketPurchases.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-muted-foreground">Productos</p>
                <p className="mt-1 font-semibold">{latestMarketItems.length}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Crea una quincena en Mercado para ver su resumen en el dashboard.</p>
          )}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Carro actual</CardTitle>
          <CardDescription>Primer resumen operativo del vehículo dentro del dashboard ejecutivo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-muted-foreground">Gasto del mes</p>
              <p className="mt-1 font-semibold">{formatCurrency(carMonthTotal)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-muted-foreground">Registros</p>
              <p className="mt-1 font-semibold">{carExpenses.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-muted-foreground">Pendientes</p>
              <p className="mt-1 font-semibold">{carReminders.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
