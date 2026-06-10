export const dynamic = "force-dynamic";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentMonthRange } from "@/lib/dates";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";
import { sumCarExpenses } from "@/modules/car/calculations";
import type { CarExpense, CarReminder } from "@/modules/car/types";
import { getBudgetExecutions, getConsolidatedExpenseLayers, getSavingsRate, sumConsolidatedExpenses, sumEntries } from "@/modules/finance/calculations";
import type { FinanceEntry, MonthlyBudget } from "@/modules/finance/types";
import { getCurrentFamily } from "@/modules/household/queries";
import { generateDeterministicInsights, getInsightSummary } from "@/modules/insights/calculations";
import { AiReadinessCard } from "@/modules/insights/components/ai-readiness-card";
import { InsightList } from "@/modules/insights/components/insight-list";
import { InsightSummaryCard } from "@/modules/insights/components/insight-summary-card";
import type { InsightInput } from "@/modules/insights/types";
import { getPriceHistoryRows, getStockStats, sumItemsByPurchase } from "@/modules/market/calculations";
import type { MarketPeriod, MarketPurchase, MarketPurchaseItem, StockItem } from "@/modules/market/types";
import { getGoalProgressRows } from "@/modules/planning/calculations";
import type { FinancialGoal, GoalContribution } from "@/modules/planning/types";
import { getShoppingListStats } from "@/modules/shopping/calculations";
import type { ShoppingList, ShoppingListItem, ShoppingListWithItems } from "@/modules/shopping/types";
import { getDebtToIncomeRatio, getWealthSummary } from "@/modules/wealth/calculations";
import type { Asset, Debt } from "@/modules/wealth/types";

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toDateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function InsightsPage() {
  const context = await getCurrentFamily();
  const supabase = await createClient();
  const month = getCurrentMonthRange();
  const historyStart = toDateValue(addDays(new Date(), -180));

  const [
    { data: incomeEntries },
    { data: manualExpenseEntries },
    { data: budgetsData },
    { data: currentMarketPurchasesData },
    { data: carExpensesData },
    { data: carRemindersData },
    { data: debtsData },
    { data: assetsData },
    { data: goalsData },
    { data: goalContributionsData },
    { data: stockItemsData },
    { data: shoppingListsData },
    { data: shoppingItemsData },
    { data: historicalMarketItemsData },
    { data: marketPeriodsData },
  ] = await Promise.all([
    supabase
      .from("income_entries")
      .select("id, amount, occurred_on, description, category_id, categories(name)")
      .eq("family_id", context.familyId)
      .gte("occurred_on", month.start)
      .lte("occurred_on", month.end),
    supabase
      .from("expense_entries")
      .select("id, amount, occurred_on, description, category_id, categories(name)")
      .eq("family_id", context.familyId)
      .eq("source_module", "manual")
      .gte("occurred_on", month.start)
      .lte("occurred_on", month.end),
    supabase
      .from("monthly_budgets")
      .select("id, family_id, budget_month, scope, category_name, amount, notes, created_at")
      .eq("family_id", context.familyId)
      .eq("budget_month", month.monthStart),
    supabase
      .from("market_purchases")
      .select("id, family_id, market_period_id, invoice_id, purchased_on, vendor, purchase_type, notes, created_at")
      .eq("family_id", context.familyId)
      .gte("purchased_on", month.start)
      .lte("purchased_on", month.end),
    supabase
      .from("car_expenses")
      .select("id, family_id, vehicle_id, category, amount, occurred_on, monthly_period, vendor, odometer_km, notes, created_at")
      .eq("family_id", context.familyId)
      .gte("occurred_on", month.start)
      .lte("occurred_on", month.end),
    supabase
      .from("car_reminders")
      .select("id, family_id, vehicle_id, title, category, due_on, due_km, status, notes, created_at")
      .eq("family_id", context.familyId)
      .eq("status", "pending"),
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
      .from("stock_items")
      .select("id, family_id, product_id, product_name, category_name, unit, quantity, min_quantity, is_active, last_updated_at, created_at")
      .eq("family_id", context.familyId),
    supabase
      .from("shopping_lists")
      .select("id, family_id, name, period_start, period_end, status, notes, converted_market_purchase_id, converted_at, created_at")
      .eq("family_id", context.familyId)
      .neq("status", "completed"),
    supabase
      .from("shopping_list_items")
      .select("id, family_id, shopping_list_id, product_id, product_name, category_name, needed_quantity, current_stock_quantity, suggested_purchase_quantity, actual_purchase_quantity, actual_unit, actual_total_price, preferred_vendor, converted_to_market_item_id, unit, source, priority, is_purchased, notes, created_at")
      .eq("family_id", context.familyId),
    supabase
      .from("market_purchase_items")
      .select("id, family_id, market_purchase_id, product_id, product_name, category_name, quantity, unit, total_price, unit_price, updates_stock, created_at, market_purchases(purchased_on, market_period_id)")
      .eq("family_id", context.familyId)
      .gte("created_at", `${historyStart}T00:00:00`),
    supabase
      .from("market_periods")
      .select("id, family_id, name, starts_on, ends_on, status, notes, created_at")
      .eq("family_id", context.familyId),
  ]);

  const incomes = (incomeEntries ?? []) as unknown as FinanceEntry[];
  const manualExpenses = (manualExpenseEntries ?? []) as unknown as FinanceEntry[];
  const currentMarketPurchases = (currentMarketPurchasesData ?? []) as MarketPurchase[];
  const currentMarketPurchaseIds = currentMarketPurchases.map((purchase) => purchase.id);
  const { data: currentMarketItemsData } = currentMarketPurchaseIds.length
    ? await supabase
        .from("market_purchase_items")
        .select("id, family_id, market_purchase_id, product_id, product_name, category_name, quantity, unit, total_price, unit_price, updates_stock, created_at")
        .eq("family_id", context.familyId)
        .in("market_purchase_id", currentMarketPurchaseIds)
    : { data: [] };

  const currentMarketItems = (currentMarketItemsData ?? []) as MarketPurchaseItem[];
  const marketTotalsByPurchase = sumItemsByPurchase(currentMarketItems);
  const marketMonthTotal = currentMarketPurchases.reduce((total, purchase) => total + (marketTotalsByPurchase[purchase.id] ?? 0), 0);
  const carExpenses = (carExpensesData ?? []) as unknown as CarExpense[];
  const manualMonthTotal = sumEntries(manualExpenses);
  const carMonthTotal = sumCarExpenses(carExpenses);
  const layers = getConsolidatedExpenseLayers({ manualExpenses: manualMonthTotal, marketExpenses: marketMonthTotal, carExpenses: carMonthTotal });
  const consolidatedExpenses = sumConsolidatedExpenses(layers);
  const incomeTotal = sumEntries(incomes);
  const netFlow = incomeTotal - consolidatedExpenses;
  const savingsRate = getSavingsRate(incomeTotal, netFlow);
  const budgets = (budgetsData ?? []) as unknown as MonthlyBudget[];
  const budgetExecutions = getBudgetExecutions(budgets, {
    total: consolidatedExpenses,
    manual: manualMonthTotal,
    market: marketMonthTotal,
    car: carMonthTotal,
  });
  const debts = (debtsData ?? []) as unknown as Debt[];
  const assets = (assetsData ?? []) as unknown as Asset[];
  const wealthSummary = getWealthSummary(debts, assets);
  const debtToIncomeRatio = getDebtToIncomeRatio(wealthSummary.monthlyDebtPayments, incomeTotal);
  const liquidAssets = assets
    .filter((asset) => asset.status === "active" && ["cash", "bank_account", "investment"].includes(asset.asset_type))
    .reduce((total, asset) => total + Number(asset.estimated_value ?? 0), 0);
  const runwayMonths = consolidatedExpenses > 0 ? liquidAssets / consolidatedExpenses : 0;
  const goalRows = getGoalProgressRows((goalsData ?? []) as unknown as FinancialGoal[], (goalContributionsData ?? []) as unknown as GoalContribution[]);
  const stockStats = getStockStats((stockItemsData ?? []) as StockItem[]);
  const shoppingLists = (shoppingListsData ?? []) as ShoppingList[];
  const shoppingItems = (shoppingItemsData ?? []) as ShoppingListItem[];
  const shoppingListsWithItems = shoppingLists.map((list) => ({ ...list, items: shoppingItems.filter((item) => item.shopping_list_id === list.id) })) as ShoppingListWithItems[];
  const shoppingStatsRaw = getShoppingListStats(shoppingListsWithItems);
  const priceRows = getPriceHistoryRows((historicalMarketItemsData ?? []) as unknown as MarketPurchaseItem[], (marketPeriodsData ?? []) as MarketPeriod[]);

  const input: InsightInput = {
    incomeTotal,
    consolidatedExpenses,
    netFlow,
    savingsRate,
    manualExpenses: manualMonthTotal,
    marketExpenses: marketMonthTotal,
    carExpenses: carMonthTotal,
    debtToIncomeRatio,
    runwayMonths,
    netWorth: wealthSummary.netWorth,
    budgetExecutions: budgetExecutions.map((budget) => ({ label: budget.label, usageRate: budget.usageRate, variance: budget.variance, status: budget.status })),
    goals: goalRows.map((goal) => ({
      name: goal.name,
      health: goal.health,
      progressRate: goal.progressRate,
      remainingAmount: goal.remainingAmount,
      requiredMonthlyContribution: goal.requiredMonthlyContribution,
    })),
    priceRows: priceRows.map((row) => ({
      productName: row.productName,
      unit: row.unit,
      latestPrice: row.latestPrice,
      previousPrice: row.previousPrice,
      variationPercent: row.variationPercent,
    })),
    stockStats,
    shoppingStats: {
      activeLists: shoppingStatsRaw.activeLists,
      pendingItems: shoppingStatsRaw.pendingItems,
      highPriorityItems: shoppingStatsRaw.highPriorityItems,
    },
    pendingCarReminders: ((carRemindersData ?? []) as unknown as CarReminder[]).length,
  };

  const insights = generateDeterministicInsights(input);
  const summary = getInsightSummary(insights);
  const topPriority = insights.find((insight) => insight.severity === "critical") ?? insights.find((insight) => insight.severity === "warning") ?? insights[0] ?? null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm md:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Sprint 16 · Insights</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Insights y recomendaciones</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300 md:text-base">
            Señales accionables generadas con reglas determinísticas sobre finanzas, Mercado, stock, carro, objetivos y riesgo. La IA externa queda preparada, pero todavía no se usa para tomar decisiones.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl bg-white/10 p-4">
            <p className="text-xs text-slate-300">Prioridad operativa</p>
            <p className="mt-1 text-2xl font-bold">{summary.priorityScore}</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-4">
            <p className="text-xs text-slate-300">Flujo neto</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(netFlow)}</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-4">
            <p className="text-xs text-slate-300">Tasa de ahorro</p>
            <p className="mt-1 text-2xl font-bold">{formatPercent(savingsRate)}</p>
          </div>
        </div>
      </section>

      {topPriority ? (
        <Card className="border-slate-300 bg-slate-50">
          <CardHeader>
            <CardTitle>Acción más importante ahora</CardTitle>
            <CardDescription>{topPriority.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-700">{topPriority.recommendation}</p>
              {topPriority.actionHref ? (
                <Link href={topPriority.actionHref} className="rounded-2xl bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-800">
                  {topPriority.actionLabel ?? "Revisar"}
                </Link>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <InsightSummaryCard summary={summary} />
      <InsightList insights={insights} />
      <AiReadinessCard />
    </div>
  );
}
