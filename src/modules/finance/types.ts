export type Category = {
  id: string;
  name: string;
  kind: "income" | "expense";
  layer: "finance" | "operations";
};

export type FinanceEntry = {
  id: string;
  amount: number | string;
  occurred_on: string;
  description: string | null;
  category_id: string | null;
  categories?: {
    name: string;
  } | null;
};

export type MonthlyTotals = {
  income: number;
  expenses: number;
  netFlow: number;
  savingsRate: number;
};

export type BudgetScope = "total" | "manual" | "market" | "car";

export type MonthlyBudget = {
  id: string;
  family_id: string;
  budget_month: string;
  scope: BudgetScope;
  category_name: string | null;
  amount: number;
  notes: string | null;
  created_at: string;
};

export type ConsolidatedExpenseLayer = {
  key: BudgetScope;
  label: string;
  amount: number;
  description: string;
};

export type BudgetExecution = {
  id: string;
  label: string;
  scope: BudgetScope;
  budgeted: number;
  actual: number;
  variance: number;
  usageRate: number;
  status: "healthy" | "warning" | "exceeded";
  notes: string | null;
};
