import { toDateInputValue } from "@/lib/dates";
import type { CarExpense } from "@/modules/car/types";
import type { BudgetExecution, FinanceEntry } from "@/modules/finance/types";
import type { MarketPurchase, MarketPurchaseItem, StockItem } from "@/modules/market/types";
import type { Asset, Debt } from "@/modules/wealth/types";
import type { FinancialGoal, GoalContribution } from "@/modules/planning/types";
import type { ShoppingList, ShoppingListItem } from "@/modules/shopping/types";
import type {
  AuditRecord,
  CarCategoryReportRow,
  CategoryBreakdownRow,
  CsvRow,
  MonthlyHistoryRow,
  ProductReportRow,
  ReportMonthRange,
  ReportSummary,
  VendorReportRow,
} from "./types";

type FinanceEntryWithAudit = FinanceEntry & {
  created_at?: string | null;
  source_module?: string | null;
};

type MarketPurchaseItemWithPurchase = MarketPurchaseItem & {
  market_purchases?: Pick<MarketPurchase, "purchased_on" | "market_period_id" | "vendor"> | null;
};

export function getMonthRangeFromInput(monthInput: string): ReportMonthRange {
  const safeMonth = /^\d{4}-\d{2}$/.test(monthInput) ? monthInput : toDateInputValue(new Date()).slice(0, 7);
  const [yearText, monthText] = safeMonth.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);

  return {
    monthInput: safeMonth,
    monthStart: toDateInputValue(start),
    start: toDateInputValue(start),
    end: toDateInputValue(end),
    label: new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(start),
  };
}

export function addMonthsToMonthInput(monthInput: string, offset: number) {
  const [yearText, monthText] = monthInput.split("-");
  const date = new Date(Number(yearText), Number(monthText) - 1 + offset, 1);
  return toDateInputValue(date).slice(0, 7);
}

export function getRecentMonthRanges(monthInput: string, count = 6): ReportMonthRange[] {
  return Array.from({ length: count }, (_, index) => addMonthsToMonthInput(monthInput, index - (count - 1))).map((month) => getMonthRangeFromInput(month));
}

export function getReportSummary({
  income,
  manualExpenses,
  marketExpenses,
  carExpenses,
}: {
  income: number;
  manualExpenses: number;
  marketExpenses: number;
  carExpenses: number;
}): ReportSummary {
  const consolidatedExpenses = manualExpenses + marketExpenses + carExpenses;
  const netFlow = income - consolidatedExpenses;
  const savingsRate = income > 0 ? netFlow / income : 0;

  return {
    income,
    manualExpenses,
    marketExpenses,
    carExpenses,
    consolidatedExpenses,
    netFlow,
    savingsRate,
  };
}

export function getBreakdownRows(rows: Array<{ name: string; amount: number }>, total: number): CategoryBreakdownRow[] {
  return rows
    .map((row) => ({
      name: row.name,
      amount: Number(row.amount ?? 0),
      percentage: total > 0 ? Number(row.amount ?? 0) / total : 0,
    }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function getMarketVendorRows(purchases: MarketPurchase[], totalsByPurchase: Record<string, number>): VendorReportRow[] {
  const map = new Map<string, { vendor: string; purchaseCount: number; totalAmount: number }>();
  const total = purchases.reduce((acc, purchase) => acc + (totalsByPurchase[purchase.id] ?? 0), 0);

  for (const purchase of purchases) {
    const vendor = purchase.vendor?.trim() || "Sin proveedor";
    const current = map.get(vendor) ?? { vendor, purchaseCount: 0, totalAmount: 0 };
    current.purchaseCount += 1;
    current.totalAmount += totalsByPurchase[purchase.id] ?? 0;
    map.set(vendor, current);
  }

  return Array.from(map.values())
    .map((row) => ({ ...row, percentage: total > 0 ? row.totalAmount / total : 0 }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

export function getMarketProductRows(items: MarketPurchaseItem[]): ProductReportRow[] {
  const map = new Map<string, ProductReportRow & { weightedQuantityForPrice: number }>();

  for (const item of items) {
    const key = `${item.product_name.trim().toLowerCase()}::${item.unit.trim().toLowerCase()}`;
    const current = map.get(key) ?? {
      productName: item.product_name,
      categoryName: item.category_name,
      quantity: 0,
      unit: item.unit,
      totalAmount: 0,
      averageUnitPrice: null,
      weightedQuantityForPrice: 0,
    };

    const quantity = Number(item.quantity ?? 0);
    const totalAmount = Number(item.total_price ?? 0);
    current.quantity += quantity;
    current.totalAmount += totalAmount;
    current.weightedQuantityForPrice += quantity > 0 ? quantity : 0;
    current.averageUnitPrice = current.weightedQuantityForPrice > 0 ? current.totalAmount / current.weightedQuantityForPrice : null;
    map.set(key, current);
  }

  return Array.from(map.values())
    .map(({ weightedQuantityForPrice: _weightedQuantityForPrice, ...row }) => row)
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

export function getCarCategoryRows(expenses: CarExpense[]): CarCategoryReportRow[] {
  const map = new Map<string, { category: string; amount: number; count: number }>();
  const total = expenses.reduce((acc, expense) => acc + Number(expense.amount ?? 0), 0);

  for (const expense of expenses) {
    const category = expense.category || "other";
    const current = map.get(category) ?? { category, amount: 0, count: 0 };
    current.amount += Number(expense.amount ?? 0);
    current.count += 1;
    map.set(category, current);
  }

  return Array.from(map.values())
    .map((row) => ({ ...row, percentage: total > 0 ? row.amount / total : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

function monthKeyFromDate(value: string | null | undefined) {
  return value ? value.slice(0, 7) : "";
}

export function getMonthlyHistoryRows({
  monthRanges,
  incomeEntries,
  manualExpenseEntries,
  marketPurchases,
  marketItems,
  carExpenses,
}: {
  monthRanges: ReportMonthRange[];
  incomeEntries: FinanceEntryWithAudit[];
  manualExpenseEntries: FinanceEntryWithAudit[];
  marketPurchases: MarketPurchase[];
  marketItems: MarketPurchaseItem[];
  carExpenses: CarExpense[];
}): MonthlyHistoryRow[] {
  const marketPurchaseById = new Map(marketPurchases.map((purchase) => [purchase.id, purchase]));

  return monthRanges.map((range) => {
    const income = incomeEntries
      .filter((entry) => monthKeyFromDate(entry.occurred_on) === range.monthInput)
      .reduce((total, entry) => total + Number(entry.amount ?? 0), 0);
    const manualExpenses = manualExpenseEntries
      .filter((entry) => monthKeyFromDate(entry.occurred_on) === range.monthInput)
      .reduce((total, entry) => total + Number(entry.amount ?? 0), 0);
    const marketExpenses = marketItems
      .filter((item) => {
        const purchase = marketPurchaseById.get(item.market_purchase_id);
        return monthKeyFromDate(purchase?.purchased_on) === range.monthInput;
      })
      .reduce((total, item) => total + Number(item.total_price ?? 0), 0);
    const carMonthExpenses = carExpenses
      .filter((expense) => monthKeyFromDate(expense.occurred_on) === range.monthInput)
      .reduce((total, expense) => total + Number(expense.amount ?? 0), 0);
    const summary = getReportSummary({ income, manualExpenses, marketExpenses, carExpenses: carMonthExpenses });

    return {
      monthStart: range.monthStart,
      label: range.label,
      income,
      manualExpenses,
      marketExpenses,
      carExpenses: carMonthExpenses,
      consolidatedExpenses: summary.consolidatedExpenses,
      netFlow: summary.netFlow,
      savingsRate: summary.savingsRate,
    };
  });
}

export function getAuditRecords({
  incomeEntries,
  manualExpenseEntries,
  marketPurchases,
  marketItems,
  carExpenses,
  budgets,
  stockItems,
  shoppingLists,
  shoppingItems,
  debts,
  assets,
  goals,
  goalContributions,
}: {
  incomeEntries: FinanceEntryWithAudit[];
  manualExpenseEntries: FinanceEntryWithAudit[];
  marketPurchases: MarketPurchase[];
  marketItems: MarketPurchaseItemWithPurchase[];
  carExpenses: CarExpense[];
  budgets: BudgetExecution[];
  stockItems: StockItem[];
  shoppingLists: ShoppingList[];
  shoppingItems: ShoppingListItem[];
  debts: Debt[];
  assets: Asset[];
  goals: FinancialGoal[];
  goalContributions: GoalContribution[];
}): AuditRecord[] {
  const records: AuditRecord[] = [
    ...incomeEntries.map((entry) => ({
      id: entry.id,
      module: "Ingresos",
      title: entry.description || "Ingreso sin descripción",
      detail: entry.categories?.name ?? "Sin categoría",
      amount: Number(entry.amount ?? 0),
      status: null,
      occurredOn: entry.occurred_on,
      createdAt: entry.created_at ?? null,
    })),
    ...manualExpenseEntries.map((entry) => ({
      id: entry.id,
      module: "Gastos",
      title: entry.description || "Gasto sin descripción",
      detail: entry.categories?.name ?? "Sin categoría",
      amount: Number(entry.amount ?? 0),
      status: null,
      occurredOn: entry.occurred_on,
      createdAt: entry.created_at ?? null,
    })),
    ...marketPurchases.map((purchase) => ({
      id: purchase.id,
      module: "Mercado",
      title: purchase.vendor || "Compra sin proveedor",
      detail: purchase.purchase_type === "main" ? "Compra principal" : "Compra esporádica",
      amount: null,
      status: null,
      occurredOn: purchase.purchased_on,
      createdAt: purchase.created_at,
    })),
    ...marketItems.map((item) => ({
      id: item.id,
      module: "Mercado item",
      title: item.product_name,
      detail: `${item.quantity} ${item.unit}`,
      amount: Number(item.total_price ?? 0),
      status: item.updates_stock ? "Actualiza stock" : "No actualiza stock",
      occurredOn: item.market_purchases?.purchased_on ?? null,
      createdAt: item.created_at,
    })),
    ...carExpenses.map((expense) => ({
      id: expense.id,
      module: "Carro",
      title: expense.vendor || expense.category,
      detail: expense.category,
      amount: Number(expense.amount ?? 0),
      status: null,
      occurredOn: expense.occurred_on,
      createdAt: expense.created_at,
    })),
    ...budgets.map((budget) => ({
      id: budget.id,
      module: "Presupuestos",
      title: budget.label,
      detail: `${budget.scope} · ${budget.status}`,
      amount: budget.budgeted,
      status: budget.status,
      occurredOn: null,
      createdAt: null,
    })),
    ...stockItems.map((item) => ({
      id: item.id,
      module: "Stock",
      title: item.product_name,
      detail: `${item.quantity} ${item.unit} · mínimo ${item.min_quantity}`,
      amount: null,
      status: item.is_active ? "Activo" : "Inactivo",
      occurredOn: item.last_updated_at?.slice(0, 10) ?? null,
      createdAt: item.created_at,
    })),
    ...shoppingLists.map((list) => ({
      id: list.id,
      module: "Compras",
      title: list.name,
      detail: `${list.period_start} a ${list.period_end}`,
      amount: null,
      status: list.status,
      occurredOn: list.period_start,
      createdAt: list.created_at,
    })),
    ...shoppingItems.map((item) => ({
      id: item.id,
      module: "Compras item",
      title: item.product_name,
      detail: `${item.suggested_purchase_quantity} ${item.unit}`,
      amount: item.actual_total_price === null ? null : Number(item.actual_total_price ?? 0),
      status: item.converted_to_market_item_id ? "Convertido" : item.is_purchased ? "Comprado" : item.priority,
      occurredOn: null,
      createdAt: item.created_at,
    })),
    ...debts.map((debt) => ({
      id: debt.id,
      module: "Deudas",
      title: debt.name,
      detail: debt.entity || debt.debt_type,
      amount: Number(debt.current_balance ?? 0),
      status: debt.status,
      occurredOn: null,
      createdAt: debt.created_at,
    })),
    ...assets.map((asset) => ({
      id: asset.id,
      module: "Patrimonio",
      title: asset.name,
      detail: asset.asset_type,
      amount: Number(asset.estimated_value ?? 0),
      status: asset.status,
      occurredOn: asset.valuation_date,
      createdAt: asset.created_at,
    })),
    ...goals.map((goal) => ({
      id: goal.id,
      module: "Objetivos",
      title: goal.name,
      detail: goal.category,
      amount: Number(goal.target_amount ?? 0),
      status: goal.status,
      occurredOn: goal.target_date,
      createdAt: goal.created_at,
    })),
    ...goalContributions.map((contribution) => ({
      id: contribution.id,
      module: "Aportes objetivo",
      title: contribution.financial_goals?.name ?? "Aporte",
      detail: contribution.notes || "Sin notas",
      amount: Number(contribution.amount ?? 0),
      status: null,
      occurredOn: contribution.contributed_on,
      createdAt: contribution.created_at,
    })),
  ];

  return records.sort((a, b) => (b.createdAt ?? b.occurredOn ?? "").localeCompare(a.createdAt ?? a.occurredOn ?? ""));
}

export function auditRecordsToCsv(records: AuditRecord[]): CsvRow[] {
  return records.map((record) => ({
    modulo: record.module,
    registro: record.title,
    detalle: record.detail,
    valor: record.amount,
    estado: record.status,
    fecha_operacion: record.occurredOn,
    creado_en: record.createdAt,
  }));
}

export function historyRowsToCsv(rows: MonthlyHistoryRow[]): CsvRow[] {
  return rows.map((row) => ({
    mes: row.label,
    ingresos: row.income,
    gastos_manuales: row.manualExpenses,
    mercado: row.marketExpenses,
    carro: row.carExpenses,
    gasto_consolidado: row.consolidatedExpenses,
    flujo_neto: row.netFlow,
    tasa_ahorro: row.savingsRate,
  }));
}
