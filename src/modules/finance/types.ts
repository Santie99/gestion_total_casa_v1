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
