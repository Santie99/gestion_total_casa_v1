export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentMonthRange, toDateInputValue } from "@/lib/dates";
import { formatCurrency } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";
import { sumEntries } from "@/modules/finance/calculations";
import type { FinanceEntry } from "@/modules/finance/types";
import { sumItemsByPurchase } from "@/modules/market/calculations";
import type { MarketPurchase, MarketPurchaseItem } from "@/modules/market/types";
import { sumCarExpenses } from "@/modules/car/calculations";
import type { CarExpense } from "@/modules/car/types";
import { getCurrentFamily } from "@/modules/household/queries";
import { getWealthSummary } from "@/modules/wealth/calculations";
import type { Asset, Debt } from "@/modules/wealth/types";
import { getGoalProgressRows } from "@/modules/planning/calculations";
import type { FinancialGoal, GoalContribution } from "@/modules/planning/types";
import {
  FORECAST_SCENARIOS,
  formatForecastMonthLabel,
  getForecastInsight,
  getForecastSummary,
  getProjectionMonths,
  getStressTests,
} from "@/modules/forecasting/calculations";
import { ForecastScenarioCard } from "@/modules/forecasting/components/forecast-scenario-card";
import { ForecastSummaryCard } from "@/modules/forecasting/components/forecast-summary-card";
import { HistoricalTrendList } from "@/modules/forecasting/components/historical-trend-list";
import { StressTestList } from "@/modules/forecasting/components/stress-test-list";
import type { HistoricalMonth } from "@/modules/forecasting/types";

function addMonths(date: Date, offset: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + offset);
  return copy;
}

function getMonthStartFromDate(date: Date) {
  return toDateInputValue(new Date(date.getFullYear(), date.getMonth(), 1));
}

function getMonthEndFromDate(date: Date) {
  return toDateInputValue(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function createEmptyHistoricalMonths(startDate: Date, count: number): HistoricalMonth[] {
  return Array.from({ length: count }).map((_, index) => {
    const date = addMonths(startDate, index);
    const monthStart = getMonthStartFromDate(date);
    return {
      monthStart,
      label: formatForecastMonthLabel(monthStart),
      income: 0,
      manualExpenses: 0,
      marketExpenses: 0,
      carExpenses: 0,
      consolidatedExpenses: 0,
      netFlow: 0,
    };
  });
}

function monthKeyFromDate(value: string) {
  return `${value.slice(0, 7)}-01`;
}

export default async function ProyeccionesPage() {
  const context = await getCurrentFamily();
  const supabase = await createClient();
  const currentMonth = getCurrentMonthRange();
  const now = new Date();
  const historicalStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const historicalStart = getMonthStartFromDate(historicalStartDate);
  const historicalEnd = getMonthEndFromDate(now);

  const [
    { data: incomeData },
    { data: manualExpenseData },
    { data: marketPurchasesData },
    { data: carExpenseData },
    { data: debtsData },
    { data: assetsData },
    { data: goalsData },
    { data: contributionsData },
  ] = await Promise.all([
    supabase
      .from("income_entries")
      .select("id, amount, occurred_on, description, category_id, categories(name)")
      .eq("family_id", context.familyId)
      .gte("occurred_on", historicalStart)
      .lte("occurred_on", historicalEnd),
    supabase
      .from("expense_entries")
      .select("id, amount, occurred_on, description, category_id, categories(name)")
      .eq("family_id", context.familyId)
      .eq("source_module", "manual")
      .gte("occurred_on", historicalStart)
      .lte("occurred_on", historicalEnd),
    supabase
      .from("market_purchases")
      .select("id, family_id, market_period_id, invoice_id, purchased_on, vendor, purchase_type, notes, created_at")
      .eq("family_id", context.familyId)
      .gte("purchased_on", historicalStart)
      .lte("purchased_on", historicalEnd),
    supabase
      .from("car_expenses")
      .select("id, family_id, vehicle_id, category, amount, occurred_on, monthly_period, vendor, odometer_km, notes, created_at")
      .eq("family_id", context.familyId)
      .gte("occurred_on", historicalStart)
      .lte("occurred_on", historicalEnd),
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
  ]);

  const historicalMonths = createEmptyHistoricalMonths(historicalStartDate, 6);
  const monthMap = new Map(historicalMonths.map((month) => [month.monthStart, month]));

  const incomes = (incomeData ?? []) as unknown as FinanceEntry[];
  const manualExpenses = (manualExpenseData ?? []) as unknown as FinanceEntry[];
  const carExpenses = (carExpenseData ?? []) as unknown as CarExpense[];
  const marketPurchases = (marketPurchasesData ?? []) as MarketPurchase[];
  const marketPurchaseIds = marketPurchases.map((purchase) => purchase.id);
  const { data: marketItemsData } = marketPurchaseIds.length
    ? await supabase
        .from("market_purchase_items")
        .select("id, family_id, market_purchase_id, product_id, product_name, category_name, quantity, unit, total_price, unit_price, updates_stock, created_at")
        .eq("family_id", context.familyId)
        .in("market_purchase_id", marketPurchaseIds)
    : { data: [] };

  for (const entry of incomes) {
    const month = monthMap.get(monthKeyFromDate(entry.occurred_on));
    if (month) month.income += Number(entry.amount ?? 0);
  }

  for (const entry of manualExpenses) {
    const month = monthMap.get(monthKeyFromDate(entry.occurred_on));
    if (month) month.manualExpenses += Number(entry.amount ?? 0);
  }

  const marketItems = (marketItemsData ?? []) as MarketPurchaseItem[];
  const marketTotalsByPurchase = sumItemsByPurchase(marketItems);
  for (const purchase of marketPurchases) {
    const month = monthMap.get(monthKeyFromDate(purchase.purchased_on));
    if (month) month.marketExpenses += marketTotalsByPurchase[purchase.id] ?? 0;
  }

  for (const expense of carExpenses) {
    const month = monthMap.get(monthKeyFromDate(expense.occurred_on));
    if (month) month.carExpenses += Number(expense.amount ?? 0);
  }

  for (const month of historicalMonths) {
    month.consolidatedExpenses = month.manualExpenses + month.marketExpenses + month.carExpenses;
    month.netFlow = month.income - month.consolidatedExpenses;
  }

  const debts = (debtsData ?? []) as unknown as Debt[];
  const assets = (assetsData ?? []) as unknown as Asset[];
  const wealthSummary = getWealthSummary(debts, assets);
  const liquidAssets = assets
    .filter((asset) => asset.status === "active" && ["cash", "bank_account", "investment"].includes(asset.asset_type))
    .reduce((total, asset) => total + Number(asset.estimated_value ?? 0), 0);

  const goalRows = getGoalProgressRows((goalsData ?? []) as unknown as FinancialGoal[], (contributionsData ?? []) as unknown as GoalContribution[]);
  const monthlyGoalRequired = goalRows
    .filter((goal) => goal.status !== "completed" && goal.requiredMonthlyContribution !== null)
    .reduce((total, goal) => total + Number(goal.requiredMonthlyContribution ?? 0), 0);

  const summary = getForecastSummary({
    historicalMonths,
    monthlyDebtPayments: wealthSummary.monthlyDebtPayments,
    monthlyGoalRequired,
    liquidAssets,
  });

  const scenarios = FORECAST_SCENARIOS.map((scenario) => ({
    scenario,
    months: getProjectionMonths({
      startMonth: currentMonth.monthStart,
      horizonMonths: 6,
      summary,
      scenario,
    }),
  }));

  const stressTests = getStressTests(summary);
  const insight = getForecastInsight(summary);
  const baseScenario = scenarios.find((item) => item.scenario.key === "base");
  const baseFinalCash = baseScenario?.months.at(-1)?.projectedCashPosition ?? summary.liquidAssets;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm md:p-8">
        <div className="max-w-3xl">
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Proyecciones y simulaciones</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300 md:text-base">
            Estima los próximos 6 meses usando ingresos, gastos consolidados, deuda, objetivos y liquidez actual. Es una herramienta de planeación, no una predicción garantizada.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl bg-white/10 p-4">
            <p className="text-xs text-slate-300">Caja líquida actual</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(summary.liquidAssets)}</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-4">
            <p className="text-xs text-slate-300">Caja estimada base a 6 meses</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(baseFinalCash)}</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-4">
            <p className="text-xs text-slate-300">Compromisos mensuales</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(summary.monthlyDebtPayments + summary.monthlyGoalRequired)}</p>
          </div>
        </div>
      </section>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle>Lectura CFO</CardTitle>
          <CardDescription>{insight}</CardDescription>
        </CardHeader>
      </Card>

      <ForecastSummaryCard summary={summary} />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Escenarios de 6 meses</h2>
          <p className="text-sm text-muted-foreground">Compara caja y flujo bajo escenario base, optimista y pesimista.</p>
        </div>
        <div className="grid gap-4">
          {scenarios.map(({ scenario, months }) => (
            <ForecastScenarioCard key={scenario.key} scenario={scenario} months={months} />
          ))}
        </div>
      </section>

      <StressTestList tests={stressTests} />

      <HistoricalTrendList months={historicalMonths} />
    </div>
  );
}
