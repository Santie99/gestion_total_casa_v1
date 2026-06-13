import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentMonthRange } from "@/lib/dates";
import { formatCurrency } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";
import { getBudgetExecutions } from "@/modules/finance/calculations";
import { BudgetExecutionList } from "@/modules/finance/components/budget-execution-list";
import { BudgetForm } from "@/modules/finance/components/budget-form";
import type { FinanceEntry, MonthlyBudget } from "@/modules/finance/types";
import { getCurrentFamily } from "@/modules/household/queries";
import { sumItemsByPurchase } from "@/modules/market/calculations";
import type { MarketPurchase, MarketPurchaseItem } from "@/modules/market/types";
import { sumCarExpenses } from "@/modules/car/calculations";
import type { CarExpense } from "@/modules/car/types";
import { sumEntries } from "@/modules/finance/calculations";

export default async function PresupuestosPage() {
  const context = await getCurrentFamily();
  const supabase = await createClient();
  const month = getCurrentMonthRange();

  const [{ data: manualExpenseData }, { data: marketPurchasesData }, { data: carExpenseData }, { data: budgetsData }] = await Promise.all([
    supabase
      .from("expense_entries")
      .select("id, amount, occurred_on, description, category_id, categories(name)")
      .eq("family_id", context.familyId)
      .eq("source_module", "manual")
      .gte("occurred_on", month.start)
      .lte("occurred_on", month.end),
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
      .from("monthly_budgets")
      .select("id, family_id, budget_month, scope, category_name, amount, notes, created_at")
      .eq("family_id", context.familyId)
      .eq("budget_month", month.monthStart)
      .order("created_at", { ascending: false }),
  ]);

  const marketPurchases = (marketPurchasesData ?? []) as MarketPurchase[];
  const marketPurchaseIds = marketPurchases.map((purchase) => purchase.id);
  const { data: marketItemsData } = marketPurchaseIds.length
    ? await supabase
        .from("market_purchase_items")
        .select("id, family_id, market_purchase_id, product_id, product_name, category_name, quantity, unit, total_price, unit_price, updates_stock, created_at")
        .eq("family_id", context.familyId)
        .in("market_purchase_id", marketPurchaseIds)
    : { data: [] };

  const manualTotal = sumEntries((manualExpenseData ?? []) as unknown as FinanceEntry[]);
  const marketTotalsByPurchase = sumItemsByPurchase((marketItemsData ?? []) as MarketPurchaseItem[]);
  const marketTotal = marketPurchases.reduce((total, purchase) => total + (marketTotalsByPurchase[purchase.id] ?? 0), 0);
  const carTotal = sumCarExpenses((carExpenseData ?? []) as unknown as CarExpense[]);
  const consolidatedTotal = manualTotal + marketTotal + carTotal;
  const budgets = (budgetsData ?? []) as unknown as MonthlyBudget[];
  const executions = getBudgetExecutions(budgets, {
    total: consolidatedTotal,
    manual: manualTotal,
    market: marketTotal,
    car: carTotal,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Presupuestos</h2>
        <p className="mt-2 text-muted-foreground">
          Controla límites mensuales por gasto total, gastos manuales, Mercado y Carro. Periodo actual: {month.label}.
        </p>
      </div>

      <div className="mobile-summary-carousel md:grid md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Gasto total consolidado</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(consolidatedTotal)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Manual + Mercado + Carro.</p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Mercado</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(marketTotal)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Desde compras registradas del mes.</p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Carro</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(carTotal)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Desde gastos operativos del carro.</p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Presupuestos activos</CardDescription>
            <CardTitle className="text-2xl">{budgets.length}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Límites creados para este mes.</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo presupuesto</CardTitle>
            <CardDescription>Define un límite mensual para controlar ejecución y variación.</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetForm familyId={context.familyId} defaultMonth={month.monthInput} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ejecución presupuestal</CardTitle>
            <CardDescription>Compara presupuesto contra gasto real consolidado.</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetExecutionList executions={executions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
