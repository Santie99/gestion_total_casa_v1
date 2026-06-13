export const dynamic = "force-dynamic";

import Link from "next/link";
import { FileSpreadsheet, Filter, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";
import { sumEntries, groupEntriesByCategory, getBudgetExecutions, getBudgetStatusLabel } from "@/modules/finance/calculations";
import type { BudgetExecution, FinanceEntry, MonthlyBudget } from "@/modules/finance/types";
import { sumCarExpenses } from "@/modules/car/calculations";
import type { CarExpense } from "@/modules/car/types";
import { sumItemsByPurchase } from "@/modules/market/calculations";
import type { MarketPurchase, MarketPurchaseItem, StockItem } from "@/modules/market/types";
import { getCurrentFamily } from "@/modules/household/queries";
import { getWealthSummary } from "@/modules/wealth/calculations";
import type { Asset, Debt } from "@/modules/wealth/types";
import { getGoalProgressRows, getGoalSummary } from "@/modules/planning/calculations";
import type { FinancialGoal, GoalContribution } from "@/modules/planning/types";
import type { ShoppingList, ShoppingListItem } from "@/modules/shopping/types";
import { CsvDownloadButton } from "@/modules/reporting/components/csv-download-button";
import { AuditTimeline } from "@/modules/reporting/components/audit-timeline";
import { MonthlyHistoryList } from "@/modules/reporting/components/monthly-history-list";
import { ReportSummaryCard } from "@/modules/reporting/components/report-summary-card";
import { ReportTable } from "@/modules/reporting/components/report-table";
import {
  auditRecordsToCsv,
  getAuditRecords,
  getBreakdownRows,
  getCarCategoryRows,
  getMarketProductRows,
  getMarketVendorRows,
  getMonthRangeFromInput,
  getMonthlyHistoryRows,
  getRecentMonthRanges,
  getReportSummary,
  historyRowsToCsv,
} from "@/modules/reporting/calculations";
import type { CsvRow } from "@/modules/reporting/types";

type FinanceEntryWithAudit = FinanceEntry & {
  created_at: string | null;
  source_module?: string | null;
};

type ReportsSearchParams = Promise<{ month?: string }>;

function budgetStatusClass(status: BudgetExecution["status"]) {
  if (status === "exceeded") return "text-red-700";
  if (status === "warning") return "text-amber-700";
  return "text-emerald-700";
}

function currentMonthInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function summaryToCsv(summary: ReturnType<typeof getReportSummary>, label: string): CsvRow[] {
  return [
    { periodo: label, metrica: "Ingresos", valor: summary.income },
    { periodo: label, metrica: "Gastos manuales", valor: summary.manualExpenses },
    { periodo: label, metrica: "Mercado", valor: summary.marketExpenses },
    { periodo: label, metrica: "Carro", valor: summary.carExpenses },
    { periodo: label, metrica: "Gasto consolidado", valor: summary.consolidatedExpenses },
    { periodo: label, metrica: "Flujo neto", valor: summary.netFlow },
    { periodo: label, metrica: "Tasa de ahorro", valor: summary.savingsRate },
  ];
}

function financeMovementsToCsv(incomes: FinanceEntryWithAudit[], expenses: FinanceEntryWithAudit[]): CsvRow[] {
  return [
    ...incomes.map((entry) => ({
      tipo: "Ingreso",
      fecha: entry.occurred_on,
      categoria: entry.categories?.name ?? "Sin categoría",
      descripcion: entry.description,
      valor: Number(entry.amount ?? 0),
      creado_en: entry.created_at,
    })),
    ...expenses.map((entry) => ({
      tipo: "Gasto manual",
      fecha: entry.occurred_on,
      categoria: entry.categories?.name ?? "Sin categoría",
      descripcion: entry.description,
      valor: Number(entry.amount ?? 0),
      creado_en: entry.created_at,
    })),
  ].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
}

function marketItemsToCsv(items: MarketPurchaseItem[], purchaseById: Map<string, MarketPurchase>): CsvRow[] {
  return items.map((item) => {
    const purchase = purchaseById.get(item.market_purchase_id);
    return {
      fecha: purchase?.purchased_on ?? null,
      proveedor: purchase?.vendor ?? "Sin proveedor",
      tipo_compra: purchase?.purchase_type ?? null,
      producto: item.product_name,
      categoria: item.category_name,
      cantidad: item.quantity,
      unidad: item.unit,
      precio_total: item.total_price,
      precio_unitario: item.unit_price,
      actualiza_stock: item.updates_stock,
      creado_en: item.created_at,
    };
  });
}

function carExpensesToCsv(expenses: CarExpense[]): CsvRow[] {
  return expenses.map((expense) => ({
    fecha: expense.occurred_on,
    categoria: expense.category,
    proveedor: expense.vendor,
    valor: expense.amount,
    odometro_km: expense.odometer_km,
    notas: expense.notes,
    creado_en: expense.created_at,
  }));
}

export default async function ReportsPage({ searchParams }: { searchParams?: ReportsSearchParams }) {
  const params = searchParams ? await searchParams : {};
  const month = getMonthRangeFromInput(params.month ?? currentMonthInput());
  const historyMonths = getRecentMonthRanges(month.monthInput, 6);
  const historyStart = historyMonths[0]?.start ?? month.start;

  const context = await getCurrentFamily();
  const supabase = await createClient();

  const [
    { data: incomeEntriesData },
    { data: manualExpenseEntriesData },
    { data: historicalIncomeEntriesData },
    { data: historicalManualExpenseEntriesData },
    { data: monthMarketPurchasesData },
    { data: historicalMarketPurchasesData },
    { data: carExpensesData },
    { data: historicalCarExpensesData },
    { data: budgetsData },
    { data: stockItemsData },
    { data: shoppingListsData },
    { data: debtsData },
    { data: assetsData },
    { data: goalsData },
    { data: goalContributionsData },
  ] = await Promise.all([
    supabase
      .from("income_entries")
      .select("id, amount, occurred_on, description, category_id, created_at, categories(name)")
      .eq("family_id", context.familyId)
      .gte("occurred_on", month.start)
      .lte("occurred_on", month.end)
      .order("occurred_on", { ascending: false }),
    supabase
      .from("expense_entries")
      .select("id, amount, occurred_on, description, category_id, source_module, created_at, categories(name)")
      .eq("family_id", context.familyId)
      .eq("source_module", "manual")
      .gte("occurred_on", month.start)
      .lte("occurred_on", month.end)
      .order("occurred_on", { ascending: false }),
    supabase
      .from("income_entries")
      .select("id, amount, occurred_on, description, category_id, created_at, categories(name)")
      .eq("family_id", context.familyId)
      .gte("occurred_on", historyStart)
      .lte("occurred_on", month.end),
    supabase
      .from("expense_entries")
      .select("id, amount, occurred_on, description, category_id, source_module, created_at, categories(name)")
      .eq("family_id", context.familyId)
      .eq("source_module", "manual")
      .gte("occurred_on", historyStart)
      .lte("occurred_on", month.end),
    supabase
      .from("market_purchases")
      .select("id, family_id, market_period_id, invoice_id, purchased_on, vendor, purchase_type, notes, created_at")
      .eq("family_id", context.familyId)
      .gte("purchased_on", month.start)
      .lte("purchased_on", month.end)
      .order("purchased_on", { ascending: false }),
    supabase
      .from("market_purchases")
      .select("id, family_id, market_period_id, invoice_id, purchased_on, vendor, purchase_type, notes, created_at")
      .eq("family_id", context.familyId)
      .gte("purchased_on", historyStart)
      .lte("purchased_on", month.end),
    supabase
      .from("car_expenses")
      .select("id, family_id, vehicle_id, category, amount, occurred_on, monthly_period, vendor, odometer_km, notes, created_at")
      .eq("family_id", context.familyId)
      .gte("occurred_on", month.start)
      .lte("occurred_on", month.end)
      .order("occurred_on", { ascending: false }),
    supabase
      .from("car_expenses")
      .select("id, family_id, vehicle_id, category, amount, occurred_on, monthly_period, vendor, odometer_km, notes, created_at")
      .eq("family_id", context.familyId)
      .gte("occurred_on", historyStart)
      .lte("occurred_on", month.end),
    supabase
      .from("monthly_budgets")
      .select("id, family_id, budget_month, scope, category_name, amount, notes, created_at")
      .eq("family_id", context.familyId)
      .eq("budget_month", month.monthStart)
      .order("created_at", { ascending: false }),
    supabase
      .from("stock_items")
      .select("id, family_id, product_id, product_name, category_name, unit, quantity, min_quantity, is_active, last_updated_at, created_at")
      .eq("family_id", context.familyId),
    supabase
      .from("shopping_lists")
      .select("id, family_id, name, period_start, period_end, status, notes, converted_market_purchase_id, converted_at, created_at")
      .eq("family_id", context.familyId)
      .lte("period_start", month.end)
      .gte("period_end", month.start)
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
  ]);

  const incomeEntries = (incomeEntriesData ?? []) as unknown as FinanceEntryWithAudit[];
  const manualExpenseEntries = (manualExpenseEntriesData ?? []) as unknown as FinanceEntryWithAudit[];
  const historicalIncomeEntries = (historicalIncomeEntriesData ?? []) as unknown as FinanceEntryWithAudit[];
  const historicalManualExpenseEntries = (historicalManualExpenseEntriesData ?? []) as unknown as FinanceEntryWithAudit[];
  const monthMarketPurchases = (monthMarketPurchasesData ?? []) as MarketPurchase[];
  const historicalMarketPurchases = (historicalMarketPurchasesData ?? []) as MarketPurchase[];
  const carExpenses = (carExpensesData ?? []) as unknown as CarExpense[];
  const historicalCarExpenses = (historicalCarExpensesData ?? []) as unknown as CarExpense[];
  const budgets = (budgetsData ?? []) as unknown as MonthlyBudget[];
  const stockItems = (stockItemsData ?? []) as StockItem[];
  const shoppingLists = (shoppingListsData ?? []) as ShoppingList[];
  const debts = (debtsData ?? []) as unknown as Debt[];
  const assets = (assetsData ?? []) as unknown as Asset[];
  const goals = (goalsData ?? []) as unknown as FinancialGoal[];
  const goalContributions = (goalContributionsData ?? []) as unknown as GoalContribution[];

  const monthMarketPurchaseIds = monthMarketPurchases.map((purchase) => purchase.id);
  const historicalMarketPurchaseIds = historicalMarketPurchases.map((purchase) => purchase.id);
  const shoppingListIds = shoppingLists.map((list) => list.id);

  const [{ data: monthMarketItemsData }, { data: historicalMarketItemsData }, { data: shoppingItemsData }] = await Promise.all([
    monthMarketPurchaseIds.length
      ? supabase
          .from("market_purchase_items")
          .select("id, family_id, market_purchase_id, product_id, product_name, category_name, quantity, unit, total_price, unit_price, updates_stock, created_at")
          .eq("family_id", context.familyId)
          .in("market_purchase_id", monthMarketPurchaseIds)
      : Promise.resolve({ data: [] }),
    historicalMarketPurchaseIds.length
      ? supabase
          .from("market_purchase_items")
          .select("id, family_id, market_purchase_id, product_id, product_name, category_name, quantity, unit, total_price, unit_price, updates_stock, created_at")
          .eq("family_id", context.familyId)
          .in("market_purchase_id", historicalMarketPurchaseIds)
      : Promise.resolve({ data: [] }),
    shoppingListIds.length
      ? supabase
          .from("shopping_list_items")
          .select("id, family_id, shopping_list_id, product_id, product_name, category_name, needed_quantity, current_stock_quantity, suggested_purchase_quantity, actual_purchase_quantity, actual_unit, actual_total_price, preferred_vendor, converted_to_market_item_id, unit, source, priority, is_purchased, notes, created_at")
          .eq("family_id", context.familyId)
          .in("shopping_list_id", shoppingListIds)
      : Promise.resolve({ data: [] }),
  ]);

  const monthMarketItems = (monthMarketItemsData ?? []) as MarketPurchaseItem[];
  const historicalMarketItems = (historicalMarketItemsData ?? []) as MarketPurchaseItem[];
  const shoppingItems = (shoppingItemsData ?? []) as ShoppingListItem[];
  const monthMarketPurchaseById = new Map(monthMarketPurchases.map((purchase) => [purchase.id, purchase]));
  const historicalMarketTotalsByPurchase = sumItemsByPurchase(monthMarketItems);
  const marketMonthTotal = monthMarketPurchases.reduce((total, purchase) => total + (historicalMarketTotalsByPurchase[purchase.id] ?? 0), 0);
  const manualMonthTotal = sumEntries(manualExpenseEntries);
  const incomeTotal = sumEntries(incomeEntries);
  const carMonthTotal = sumCarExpenses(carExpenses);
  const reportSummary = getReportSummary({ income: incomeTotal, manualExpenses: manualMonthTotal, marketExpenses: marketMonthTotal, carExpenses: carMonthTotal });
  const budgetExecutions = getBudgetExecutions(budgets, {
    total: reportSummary.consolidatedExpenses,
    manual: reportSummary.manualExpenses,
    market: reportSummary.marketExpenses,
    car: reportSummary.carExpenses,
  });
  const manualCategoryRows = getBreakdownRows(groupEntriesByCategory(manualExpenseEntries), manualMonthTotal);
  const marketVendorRows = getMarketVendorRows(monthMarketPurchases, historicalMarketTotalsByPurchase);
  const marketProductRows = getMarketProductRows(monthMarketItems).slice(0, 12);
  const carCategoryRows = getCarCategoryRows(carExpenses);
  const wealthSummary = getWealthSummary(debts, assets);
  const goalRows = getGoalProgressRows(goals, goalContributions);
  const goalSummary = getGoalSummary(goalRows);
  const activeStock = stockItems.filter((item) => item.is_active);
  const lowStockCount = activeStock.filter((item) => Number(item.quantity) <= Number(item.min_quantity)).length;
  const activeShoppingLists = shoppingLists.filter((list) => list.status !== "completed").length;
  const purchasedShoppingItems = shoppingItems.filter((item) => item.is_purchased).length;
  const convertedShoppingItems = shoppingItems.filter((item) => item.converted_to_market_item_id).length;
  const monthlyHistoryRows = getMonthlyHistoryRows({
    monthRanges: historyMonths,
    incomeEntries: historicalIncomeEntries,
    manualExpenseEntries: historicalManualExpenseEntries,
    marketPurchases: historicalMarketPurchases,
    marketItems: historicalMarketItems,
    carExpenses: historicalCarExpenses,
  });
  const auditRecords = getAuditRecords({
    incomeEntries,
    manualExpenseEntries,
    marketPurchases: monthMarketPurchases,
    marketItems: monthMarketItems.map((item) => ({ ...item, market_purchases: monthMarketPurchaseById.get(item.market_purchase_id) ?? null })),
    carExpenses,
    budgets: budgetExecutions,
    stockItems,
    shoppingLists,
    shoppingItems,
    debts,
    assets,
    goals,
    goalContributions,
  });

  const summaryCsv = summaryToCsv(reportSummary, month.label);
  const financeCsv = financeMovementsToCsv(incomeEntries, manualExpenseEntries);
  const marketCsv = marketItemsToCsv(monthMarketItems, monthMarketPurchaseById);
  const carCsv = carExpensesToCsv(carExpenses);
  const historyCsv = historyRowsToCsv(monthlyHistoryRows);
  const auditCsv = auditRecordsToCsv(auditRecords);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Reportes, exportaciones y auditoría</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300 md:text-base">
              Vista mensual consolidada para revisar finanzas, operación del hogar, histórico reciente y registros auditables sin modificar datos existentes.
            </p>
          </div>
          <form className="rounded-3xl bg-white/10 p-4" action="/reportes">
            <label htmlFor="month" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              <Filter className="h-4 w-4" /> Periodo
            </label>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input id="month" name="month" type="month" defaultValue={month.monthInput} className="rounded-2xl border border-white/20 bg-white px-3 py-2 text-sm text-slate-950" />
              <button type="submit" className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                Aplicar
              </button>
            </div>
          </form>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-3xl border bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Periodo seleccionado</p>
          <p className="mt-1 text-lg font-bold capitalize">{month.label}</p>
          <p className="text-sm text-muted-foreground">{month.start} a {month.end}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CsvDownloadButton filename={`reporte-resumen-${month.monthInput}.csv`} rows={summaryCsv} label="Resumen CSV" />
          <CsvDownloadButton filename={`reporte-historico-${month.monthInput}.csv`} rows={historyCsv} label="Histórico CSV" />
          <CsvDownloadButton filename={`auditoria-${month.monthInput}.csv`} rows={auditCsv} label="Auditoría CSV" />
        </div>
      </div>

      <ReportSummaryCard summary={reportSummary} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Control presupuestal</CardTitle>
                <CardDescription>Presupuesto mensual contra ejecución real consolidada.</CardDescription>
              </div>
              <CsvDownloadButton
                filename={`presupuestos-${month.monthInput}.csv`}
                rows={budgetExecutions.map((execution) => ({
                  presupuesto: execution.label,
                  alcance: execution.scope,
                  presupuestado: execution.budgeted,
                  real: execution.actual,
                  variacion: execution.variance,
                  uso: execution.usageRate,
                  estado: execution.status,
                }))}
              />
            </div>
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
                      <div className="h-2 rounded-full bg-slate-950" style={{ width: `${Math.min(execution.usageRate * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay presupuestos creados para este periodo.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Gasto manual por categoría</CardTitle>
                <CardDescription>Distribución de gastos cargados directamente en Gastos.</CardDescription>
              </div>
              <CsvDownloadButton
                filename={`gastos-categorias-${month.monthInput}.csv`}
                rows={manualCategoryRows.map((row) => ({ categoria: row.name, valor: row.amount, participacion: row.percentage }))}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ReportTable
              rows={manualCategoryRows.slice(0, 8)}
              emptyMessage="No hay gastos manuales para este periodo."
              columns={[
                { key: "name", label: "Categoría" },
                { key: "amount", label: "Valor", type: "amount" },
                { key: "percentage", label: "%", type: "percentage" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Reporte de Mercado</CardTitle>
                <CardDescription>Proveedores y productos más relevantes del periodo.</CardDescription>
              </div>
              <CsvDownloadButton filename={`mercado-${month.monthInput}.csv`} rows={marketCsv} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <ReportTable
                rows={marketVendorRows.slice(0, 6)}
                emptyMessage="No hay compras de Mercado para este periodo."
                columns={[
                  { key: "vendor", label: "Proveedor" },
                  { key: "purchaseCount", label: "Compras" },
                  { key: "totalAmount", label: "Total", type: "amount" },
                  { key: "percentage", label: "%", type: "percentage" },
                ]}
              />
              <ReportTable
                rows={marketProductRows}
                emptyMessage="No hay productos de Mercado para este periodo."
                columns={[
                  { key: "productName", label: "Producto" },
                  { key: "quantity", label: "Cantidad" },
                  { key: "unit", label: "Unidad" },
                  { key: "totalAmount", label: "Total", type: "amount" },
                  { key: "averageUnitPrice", label: "Prom. unitario", type: "currencyOrNull" },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Reporte de Carro</CardTitle>
                <CardDescription>Gastos vehiculares agrupados por categoría.</CardDescription>
              </div>
              <CsvDownloadButton filename={`carro-${month.monthInput}.csv`} rows={carCsv} />
            </div>
          </CardHeader>
          <CardContent>
            <ReportTable
              rows={carCategoryRows}
              emptyMessage="No hay gastos de Carro para este periodo."
              columns={[
                { key: "category", label: "Categoría" },
                { key: "count", label: "Registros" },
                { key: "amount", label: "Valor", type: "amount" },
                { key: "percentage", label: "%", type: "percentage" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Histórico reciente</CardTitle>
                <CardDescription>Comparativo de los últimos seis meses hasta el periodo seleccionado.</CardDescription>
              </div>
              <CsvDownloadButton filename={`historico-6m-${month.monthInput}.csv`} rows={historyCsv} />
            </div>
          </CardHeader>
          <CardContent>
            <MonthlyHistoryList rows={monthlyHistoryRows} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operación y patrimonio</CardTitle>
            <CardDescription>Foto rápida de módulos activos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-muted-foreground">Stock activo</p>
                <p className="mt-1 text-xl font-bold">{activeStock.length}</p>
                <p className="text-xs text-muted-foreground">{lowStockCount} productos en bajo stock o agotados.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-muted-foreground">Compras</p>
                <p className="mt-1 text-xl font-bold">{activeShoppingLists} listas activas</p>
                <p className="text-xs text-muted-foreground">{purchasedShoppingItems} ítems comprados · {convertedShoppingItems} convertidos a Mercado.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-muted-foreground">Patrimonio neto</p>
                <p className="mt-1 text-xl font-bold">{formatCurrency(wealthSummary.netWorth)}</p>
                <p className="text-xs text-muted-foreground">Activos {formatCurrency(wealthSummary.totalAssets)} · Deudas {formatCurrency(wealthSummary.totalDebts)}.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-muted-foreground">Objetivos</p>
                <p className="mt-1 text-xl font-bold">{goalSummary.activeGoals} activos</p>
                <p className="text-xs text-muted-foreground">Avance promedio {formatPercent(goalSummary.averageProgressRate)}.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Movimientos financieros exportables</CardTitle>
              <CardDescription>Ingresos y gastos manuales del periodo. Mercado y Carro se exportan por separado para evitar duplicidad.</CardDescription>
            </div>
            <CsvDownloadButton filename={`movimientos-financieros-${month.monthInput}.csv`} rows={financeCsv} />
          </div>
        </CardHeader>
        <CardContent>
          <ReportTable
            rows={financeCsv.slice(0, 12)}
            emptyMessage="No hay movimientos financieros para este periodo."
            columns={[
              { key: "tipo", label: "Tipo" },
              { key: "fecha", label: "Fecha" },
              { key: "categoria", label: "Categoría" },
              { key: "descripcion", label: "Descripción" },
              { key: "valor", label: "Valor", type: "amount" },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-slate-300 bg-slate-50">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Auditoría de datos</CardTitle>
              <CardDescription>Últimos registros creados o actualizados visibles para revisar origen, fecha, estado y valor.</CardDescription>
            </div>
            <CsvDownloadButton filename={`auditoria-completa-${month.monthInput}.csv`} rows={auditCsv} />
          </div>
        </CardHeader>
        <CardContent>
          <AuditTimeline records={auditRecords} />
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> Próxima mejora pendiente</CardTitle>
          <CardDescription>La exportación CSV queda operativa. PDF simple queda preparado como mejora posterior si se requiere formalizar reportes imprimibles.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-blue-950">
              Para tomar decisiones, cruza este reporte con Insights y Proyecciones: Reportes muestra lo ocurrido, Insights prioriza acciones y Proyecciones simula el futuro.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/insights" className="rounded-2xl bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-800">
                Ver insights
              </Link>
              <Link href="/proyecciones" className="rounded-2xl border bg-white px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                Ver proyecciones
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
