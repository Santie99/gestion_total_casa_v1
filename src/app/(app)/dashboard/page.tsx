export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentMonthRange } from "@/lib/dates";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";
import {
  getBudgetExecutions,
  getBudgetStatusLabel,
  getConsolidatedExpenseLayers,
  getMonthlyTotals,
  getSavingsRate,
  groupEntriesByCategory,
  sumConsolidatedExpenses,
  sumEntries,
} from "@/modules/finance/calculations";
import type { FinanceEntry, MonthlyBudget } from "@/modules/finance/types";
import { SummaryCard } from "@/modules/finance/components/summary-card";
import { sumItemsByPurchase } from "@/modules/market/calculations";
import type { MarketPurchase, MarketPurchaseItem } from "@/modules/market/types";
import { getUpcomingReminders, sumCarExpenses } from "@/modules/car/calculations";
import type { CarExpense, CarReminder } from "@/modules/car/types";
import { getCurrentFamily } from "@/modules/household/queries";
import { getDebtToIncomeRatio, getWealthSummary } from "@/modules/wealth/calculations";
import type { Asset, Debt } from "@/modules/wealth/types";
import { getFinancialHealthScore, getGoalProgressRows, getGoalSummary, getRunwayMonths } from "@/modules/planning/calculations";
import { CfoMetricsCard } from "@/modules/planning/components/cfo-metrics-card";
import type { FinancialGoal, GoalContribution } from "@/modules/planning/types";

function budgetStatusClass(status: "healthy" | "warning" | "exceeded") {
  if (status === "exceeded") return "text-red-700";
  if (status === "warning") return "text-amber-700";
  return "text-emerald-700";
}

export default async function DashboardPage() {
  const context = await getCurrentFamily();
  const supabase = await createClient();
  const month = getCurrentMonthRange();

  const [
    { data: incomeEntries },
    { data: manualExpenseEntries },
    { data: marketPurchasesData },
    { data: carExpensesData },
    { data: carRemindersData },
    { data: budgetsData },
    { data: debtsData },
    { data: assetsData },
    { data: goalsData },
    { data: goalContributionsData },
    { data: upcomingMealPlansData },
    { data: activeShoppingListsData },
  ] = await Promise.all([
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
      .eq("source_module", "manual")
      .gte("occurred_on", month.start)
      .lte("occurred_on", month.end)
      .order("occurred_on", { ascending: false }),
    supabase
      .from("market_purchases")
      .select("id, family_id, market_period_id, invoice_id, purchased_on, vendor, purchase_type, notes, created_at")
      .eq("family_id", context.familyId)
      .gte("purchased_on", month.start)
      .lte("purchased_on", month.end)
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
    supabase
      .from("monthly_budgets")
      .select("id, family_id, budget_month, scope, category_name, amount, notes, created_at")
      .eq("family_id", context.familyId)
      .eq("budget_month", month.monthStart)
      .order("created_at", { ascending: false }),
    supabase
      .from("debts")
      .select("id, family_id, name, debt_type, entity, current_balance, monthly_payment, interest_rate, due_day, responsible_member_id, status, notes, created_at")
      .eq("family_id", context.familyId),
    supabase
      .from("assets")
      .select("id, family_id, name, asset_type, estimated_value, valuation_date, owner_member_id, status, notes, created_at")
      .eq("family_id", context.familyId),
    supabase
      .from("financial_goals")
      .select("id, family_id, name, category, target_amount, current_amount, target_date, responsible_member_id, priority, status, notes, created_at, family_members(full_name)")
      .eq("family_id", context.familyId),
    supabase
      .from("goal_contributions")
      .select("id, family_id, goal_id, contributed_on, amount, notes, created_by, created_at, financial_goals(name)")
      .eq("family_id", context.familyId),
    supabase
      .from("meal_plans")
      .select("id, planned_on, meal_type, title")
      .eq("family_id", context.familyId)
      .gte("planned_on", month.start)
      .lte("planned_on", month.end)
      .order("planned_on", { ascending: true }),
    supabase
      .from("shopping_lists")
      .select("id, name, period_start, period_end, status")
      .eq("family_id", context.familyId)
      .neq("status", "completed")
      .order("created_at", { ascending: false }),
  ]);

  const incomes = (incomeEntries ?? []) as unknown as FinanceEntry[];
  const manualExpenses = (manualExpenseEntries ?? []) as unknown as FinanceEntry[];
  const marketPurchases = (marketPurchasesData ?? []) as MarketPurchase[];
  const marketPurchaseIds = marketPurchases.map((purchase) => purchase.id);
  const { data: marketItemsData } = marketPurchaseIds.length
    ? await supabase
        .from("market_purchase_items")
        .select("id, family_id, market_purchase_id, product_id, product_name, category_name, quantity, unit, total_price, unit_price, updates_stock, created_at")
        .eq("family_id", context.familyId)
        .in("market_purchase_id", marketPurchaseIds)
    : { data: [] };

  const marketItems = (marketItemsData ?? []) as MarketPurchaseItem[];
  const marketTotalsByPurchase = sumItemsByPurchase(marketItems);
  const marketMonthTotal = marketPurchases.reduce((total, purchase) => total + (marketTotalsByPurchase[purchase.id] ?? 0), 0);
  const carExpenses = (carExpensesData ?? []) as unknown as CarExpense[];
  const carReminders = getUpcomingReminders((carRemindersData ?? []) as unknown as CarReminder[]);
  const carMonthTotal = sumCarExpenses(carExpenses);
  const manualMonthTotal = sumEntries(manualExpenses);
  const layers = getConsolidatedExpenseLayers({ manualExpenses: manualMonthTotal, marketExpenses: marketMonthTotal, carExpenses: carMonthTotal });
  const consolidatedExpenses = sumConsolidatedExpenses(layers);
  const incomeTotal = sumEntries(incomes);
  const consolidatedNetFlow = incomeTotal - consolidatedExpenses;
  const consolidatedSavingsRate = getSavingsRate(incomeTotal, consolidatedNetFlow);
  const manualTotals = getMonthlyTotals(incomes, manualExpenses);
  const manualExpenseCategories = groupEntriesByCategory(manualExpenses).slice(0, 5);
  const budgets = (budgetsData ?? []) as unknown as MonthlyBudget[];
  const debts = (debtsData ?? []) as unknown as Debt[];
  const assets = (assetsData ?? []) as unknown as Asset[];
  const wealthSummary = getWealthSummary(debts, assets);
  const debtToIncomeRatio = getDebtToIncomeRatio(wealthSummary.monthlyDebtPayments, incomeTotal);
  const liquidAssets = assets
    .filter((asset) => asset.status === "active" && ["cash", "bank_account", "investment"].includes(asset.asset_type))
    .reduce((total, asset) => total + Number(asset.estimated_value ?? 0), 0);
  const runwayMonths = getRunwayMonths(liquidAssets, consolidatedExpenses);
  const liquidityRatio = runwayMonths;
  const goals = (goalsData ?? []) as unknown as FinancialGoal[];
  const goalContributions = (goalContributionsData ?? []) as unknown as GoalContribution[];
  const upcomingMealPlans = (upcomingMealPlansData ?? []) as { id: string; planned_on: string; meal_type: string; title: string }[];
  const activeShoppingLists = (activeShoppingListsData ?? []) as { id: string; name: string; period_start: string; period_end: string; status: string }[];
  const goalRows = getGoalProgressRows(goals, goalContributions);
  const goalSummary = getGoalSummary(goalRows);
  const allBudgetExecutions = getBudgetExecutions(budgets, {
    total: consolidatedExpenses,
    manual: manualMonthTotal,
    market: marketMonthTotal,
    car: carMonthTotal,
  });
  const budgetExecutions = allBudgetExecutions.slice(0, 4);
  const financialHealthScore = getFinancialHealthScore({
    savingsRate: consolidatedSavingsRate,
    debtToIncomeRatio,
    budgetExceededCount: allBudgetExecutions.filter((execution) => execution.status === "exceeded").length,
    budgetWarningCount: allBudgetExecutions.filter((execution) => execution.status === "warning").length,
    netWorth: wealthSummary.netWorth,
    runwayMonths,
  });
  const latestMovements = [
    ...incomes.map((entry) => ({ ...entry, type: "income" as const })),
    ...manualExpenses.map((entry) => ({ ...entry, type: "expense" as const })),
  ]
    .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Sprint 14 · PWA + experiencia móvil</p>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard ejecutivo</h2>
        <p className="mt-2 text-muted-foreground">
          Resumen de {context.familyName} para {month.label}. Integra gastos manuales, Mercado y Carro sin duplicarlos en gastos generales.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Ingresos del mes" value={incomeTotal} description="Entradas registradas con fecha real dentro del mes." tone="positive" />
        <SummaryCard title="Gasto consolidado" value={consolidatedExpenses} description="Manual + Mercado + Carro. Esta es la lectura real del gasto mensual." tone="negative" />
        <SummaryCard
          title="Flujo neto consolidado"
          value={consolidatedNetFlow}
          description="Ingresos menos gasto consolidado. Base del Free Cash Flow Familiar."
          tone={consolidatedNetFlow >= 0 ? "positive" : "negative"}
        />
        <Card>
          <CardHeader>
            <CardDescription>Tasa de ahorro real</CardDescription>
            <CardTitle className={consolidatedSavingsRate >= 0 ? "text-2xl text-emerald-700" : "text-2xl text-red-700"}>
              {formatPercent(consolidatedSavingsRate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Flujo neto consolidado dividido entre ingresos.</p>
          </CardContent>
        </Card>
      </div>


      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Activos registrados</CardDescription>
            <CardTitle className="text-2xl text-emerald-700">{formatCurrency(wealthSummary.totalAssets)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Valor de activos activos registrados en Patrimonio.</p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Deuda activa</CardDescription>
            <CardTitle className="text-2xl text-red-700">{formatCurrency(wealthSummary.totalDebts)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Saldos pendientes registrados en Deudas.</p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Patrimonio neto</CardDescription>
            <CardTitle className={wealthSummary.netWorth >= 0 ? "text-2xl text-emerald-700" : "text-2xl text-red-700"}>{formatCurrency(wealthSummary.netWorth)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Activos menos deudas. Primera lectura de balance familiar.</p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Debt-to-Income</CardDescription>
            <CardTitle className={debtToIncomeRatio > 0.35 ? "text-2xl text-red-700" : debtToIncomeRatio > 0.25 ? "text-2xl text-amber-700" : "text-2xl text-emerald-700"}>{formatPercent(debtToIncomeRatio)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Cuotas mensuales de deuda / ingresos del mes.</p></CardContent>
        </Card>
      </div>

      <CfoMetricsCard
        freeCashFlow={consolidatedNetFlow}
        burnRate={consolidatedExpenses}
        runwayMonths={runwayMonths}
        savingsEfficiency={consolidatedSavingsRate}
        liquidityRatio={liquidityRatio}
        healthScore={financialHealthScore}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Objetivos activos</CardDescription>
            <CardTitle className="text-2xl">{goalSummary.activeGoals}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Metas financieras abiertas en /objetivos.</p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Avance objetivos</CardDescription>
            <CardTitle className="text-2xl">{formatPercent(goalSummary.averageProgressRate)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Progreso agregado de objetivos activos.</p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Faltante total</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(goalSummary.totalRemainingAmount)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Monto pendiente para completar metas activas.</p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Próximo objetivo</CardDescription>
            <CardTitle className="text-xl">{goalSummary.nextGoal?.name ?? "Sin fecha"}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{goalSummary.nextGoal ? `Faltan ${formatCurrency(goalSummary.nextGoal.remainingAmount)}.` : "Crea metas con fecha objetivo."}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consolidación financiera operativa</CardTitle>
          <CardDescription>Separa las capas para evitar doble conteo: lo operativo se suma al dashboard, pero no se duplica en gastos manuales.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {layers.map((layer) => {
              const percentage = consolidatedExpenses > 0 ? layer.amount / consolidatedExpenses : 0;
              return (
                <div key={layer.key} className="rounded-2xl border bg-slate-50 p-4">
                  <p className="text-sm font-semibold">{layer.label}</p>
                  <p className="mt-2 text-2xl font-bold">{formatCurrency(layer.amount)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatPercent(percentage)} del gasto consolidado.</p>
                  <p className="mt-3 text-xs text-muted-foreground">{layer.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Ejecución presupuestal</CardTitle>
            <CardDescription>Primer control de presupuesto mensual por capa financiera.</CardDescription>
          </CardHeader>
          <CardContent>
            {budgetExecutions.length ? (
              <div className="space-y-3">
                {budgetExecutions.map((execution) => (
                  <div key={execution.id} className="rounded-2xl border p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{execution.label}</p>
                        <p className="text-xs text-muted-foreground">Presupuesto {formatCurrency(execution.budgeted)} · Real {formatCurrency(execution.actual)}</p>
                      </div>
                      <p className={`text-sm font-semibold ${budgetStatusClass(execution.status)}`}>{getBudgetStatusLabel(execution.status)}</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-slate-900" style={{ width: `${Math.min(execution.usageRate * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Crea presupuestos en /presupuestos para ver ejecución en el dashboard.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen operativo</CardTitle>
            <CardDescription>Mercado y Carro dentro del mes actual.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-muted-foreground">Mercado</p>
                <p className="mt-1 font-semibold">{formatCurrency(marketMonthTotal)}</p>
                <p className="text-xs text-muted-foreground">{marketPurchases.length} compras · {marketItems.length} productos.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-muted-foreground">Carro</p>
                <p className="mt-1 font-semibold">{formatCurrency(carMonthTotal)}</p>
                <p className="text-xs text-muted-foreground">{carExpenses.length} gastos · {carReminders.length} pendientes.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-muted-foreground">Menús</p>
                <p className="mt-1 font-semibold">{upcomingMealPlans.length} comidas</p>
                <p className="text-xs text-muted-foreground">Planeadas dentro del mes actual. Base para listas inteligentes.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-muted-foreground">Compras</p>
                <p className="mt-1 font-semibold">{activeShoppingLists.length} listas activas</p>
                <p className="text-xs text-muted-foreground">Listas generadas desde menús y stock actual.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-muted-foreground">Solo gastos manuales</p>
                <p className="mt-1 font-semibold">{formatCurrency(manualTotals.expenses)}</p>
                <p className="text-xs text-muted-foreground">Se mantiene separado para evitar duplicar Mercado o Carro.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Gasto manual por categoría</CardTitle>
            <CardDescription>Solo incluye gastos cargados directamente en la sección Gastos.</CardDescription>
          </CardHeader>
          <CardContent>
            {manualExpenseCategories.length ? (
              <div className="space-y-4">
                {manualExpenseCategories.map((category) => {
                  const percentage = manualMonthTotal > 0 ? category.amount / manualMonthTotal : 0;
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
              <p className="text-sm text-muted-foreground">Registra gastos manuales para ver la distribución por categoría.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos movimientos manuales</CardTitle>
            <CardDescription>Ingresos y gastos manuales más recientes del mes.</CardDescription>
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
          <CardDescription>Interpretación simple del mes con gasto consolidado.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold">Free Cash Flow Familiar</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Este mes es {formatCurrency(consolidatedNetFlow)}. Si es positivo, el hogar generó excedente operativo; si es negativo, consumió liquidez.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold">Burn Rate familiar</p>
              <p className="mt-1 text-sm text-muted-foreground">
                El gasto consolidado del mes es {formatCurrency(consolidatedExpenses)}. Esta será la base para runway doméstico cuando registremos activos líquidos.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold">Control presupuestal</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Los presupuestos comparan límites mensuales contra gasto real de cada capa, sin duplicar módulos operativos.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold">Balance familiar</p>
              <p className="mt-1 text-sm text-muted-foreground">
                El patrimonio neto registrado es {formatCurrency(wealthSummary.netWorth)}. La deuda activa representa {formatPercent(wealthSummary.debtToAssetRatio)} de los activos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
