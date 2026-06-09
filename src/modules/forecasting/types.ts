export type HistoricalMonth = {
  monthStart: string;
  label: string;
  income: number;
  manualExpenses: number;
  marketExpenses: number;
  carExpenses: number;
  consolidatedExpenses: number;
  netFlow: number;
};

export type ForecastScenarioKey = "base" | "optimistic" | "pessimistic";

export type ForecastScenario = {
  key: ForecastScenarioKey;
  name: string;
  description: string;
  incomeFactor: number;
  expenseFactor: number;
  extraMonthlyShock: number;
};

export type ForecastMonth = {
  monthStart: string;
  label: string;
  projectedIncome: number;
  projectedOperatingExpenses: number;
  projectedDebtPayments: number;
  projectedGoalCommitments: number;
  extraShock: number;
  projectedOutflow: number;
  projectedNetFlow: number;
  projectedCashPosition: number;
};

export type ForecastSummary = {
  averageIncome: number;
  averageOperatingExpenses: number;
  averageNetFlow: number;
  monthlyDebtPayments: number;
  monthlyGoalRequired: number;
  liquidAssets: number;
};

export type StressTestResult = {
  name: string;
  description: string;
  projectedMonthlyNetFlow: number;
  runwayMonths: number | null;
  severity: "healthy" | "warning" | "critical";
};
