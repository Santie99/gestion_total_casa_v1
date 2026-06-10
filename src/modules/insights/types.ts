export type InsightArea = "finance" | "market" | "stock" | "car" | "goals" | "risk" | "operations";
export type InsightSeverity = "positive" | "info" | "warning" | "critical";

export type HouseholdInsight = {
  id: string;
  area: InsightArea;
  severity: InsightSeverity;
  title: string;
  description: string;
  recommendation: string;
  metricLabel?: string;
  metricValue?: string;
  actionHref?: string;
  actionLabel?: string;
};

export type InsightSummary = {
  total: number;
  critical: number;
  warning: number;
  positive: number;
  info: number;
  priorityScore: number;
};

export type InsightBudgetExecution = {
  label: string;
  usageRate: number;
  variance: number;
  status: "healthy" | "warning" | "exceeded";
};

export type InsightGoalRow = {
  name: string;
  health: "on_track" | "at_risk" | "late" | "completed" | "paused";
  progressRate: number;
  remainingAmount: number;
  requiredMonthlyContribution: number | null;
};

export type InsightPriceRow = {
  productName: string;
  unit: string;
  latestPrice: number;
  previousPrice: number | null;
  variationPercent: number | null;
};

export type InsightInput = {
  incomeTotal: number;
  consolidatedExpenses: number;
  netFlow: number;
  savingsRate: number;
  manualExpenses: number;
  marketExpenses: number;
  carExpenses: number;
  debtToIncomeRatio: number;
  runwayMonths: number;
  netWorth: number;
  budgetExecutions: InsightBudgetExecution[];
  goals: InsightGoalRow[];
  priceRows: InsightPriceRow[];
  stockStats: {
    total: number;
    low: number;
    empty: number;
    healthy: number;
  };
  shoppingStats: {
    activeLists: number;
    pendingItems: number;
    highPriorityItems: number;
  };
  pendingCarReminders: number;
};
