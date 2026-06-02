import type { BudgetExecution, BudgetScope, ConsolidatedExpenseLayer, FinanceEntry, MonthlyBudget, MonthlyTotals } from "./types";

export function sumEntries(entries: Pick<FinanceEntry, "amount">[]) {
  return entries.reduce((total, entry) => total + Number(entry.amount ?? 0), 0);
}

export function getMonthlyTotals(incomeEntries: FinanceEntry[], expenseEntries: FinanceEntry[]): MonthlyTotals {
  const income = sumEntries(incomeEntries);
  const expenses = sumEntries(expenseEntries);
  const netFlow = income - expenses;
  const savingsRate = income > 0 ? netFlow / income : 0;

  return { income, expenses, netFlow, savingsRate };
}

export function groupEntriesByCategory(entries: FinanceEntry[]) {
  const map = new Map<string, number>();

  for (const entry of entries) {
    const categoryName = entry.categories?.name ?? "Sin categoría";
    map.set(categoryName, (map.get(categoryName) ?? 0) + Number(entry.amount ?? 0));
  }

  return Array.from(map.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function getConsolidatedExpenseLayers({
  manualExpenses,
  marketExpenses,
  carExpenses,
}: {
  manualExpenses: number;
  marketExpenses: number;
  carExpenses: number;
}): ConsolidatedExpenseLayer[] {
  return [
    {
      key: "manual",
      label: "Gastos manuales",
      amount: manualExpenses,
      description: "Gastos generales cargados directamente en la sección Gastos.",
    },
    {
      key: "market",
      label: "Mercado",
      amount: marketExpenses,
      description: "Total de productos comprados en Mercado durante el mes.",
    },
    {
      key: "car",
      label: "Carro",
      amount: carExpenses,
      description: "Gastos operativos del módulo Carro durante el mes.",
    },
  ];
}

export function sumConsolidatedExpenses(layers: ConsolidatedExpenseLayer[]) {
  return layers.reduce((total, layer) => total + layer.amount, 0);
}

export function getSavingsRate(income: number, netFlow: number) {
  return income > 0 ? netFlow / income : 0;
}

export function getBudgetExecutionStatus(usageRate: number): BudgetExecution["status"] {
  if (usageRate > 1) return "exceeded";
  if (usageRate >= 0.85) return "warning";
  return "healthy";
}

export function getActualForBudget(scope: BudgetScope, totals: Record<BudgetScope, number>) {
  return totals[scope] ?? 0;
}

export function getBudgetExecutions(budgets: MonthlyBudget[], totals: Record<BudgetScope, number>): BudgetExecution[] {
  return budgets
    .map((budget) => {
      const actual = getActualForBudget(budget.scope, totals);
      const budgeted = Number(budget.amount ?? 0);
      const usageRate = budgeted > 0 ? actual / budgeted : 0;
      const label = budget.category_name || getBudgetScopeLabel(budget.scope);

      return {
        id: budget.id,
        label,
        scope: budget.scope,
        budgeted,
        actual,
        variance: budgeted - actual,
        usageRate,
        status: getBudgetExecutionStatus(usageRate),
        notes: budget.notes,
      };
    })
    .sort((a, b) => b.usageRate - a.usageRate);
}

export function getBudgetScopeLabel(scope: BudgetScope) {
  const labels: Record<BudgetScope, string> = {
    total: "Gasto total consolidado",
    manual: "Gastos manuales",
    market: "Mercado",
    car: "Carro",
  };

  return labels[scope];
}

export function getBudgetStatusLabel(status: BudgetExecution["status"]) {
  const labels: Record<BudgetExecution["status"], string> = {
    healthy: "Sano",
    warning: "Alerta",
    exceeded: "Excedido",
  };

  return labels[status];
}
