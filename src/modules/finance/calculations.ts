import type { FinanceEntry, MonthlyTotals } from "./types";

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
