import type { ForecastMonth, ForecastScenario, ForecastSummary, HistoricalMonth, StressTestResult } from "./types";

export const FORECAST_SCENARIOS: ForecastScenario[] = [
  {
    key: "base",
    name: "Base",
    description: "Mantiene el promedio reciente de ingresos y gastos.",
    incomeFactor: 1,
    expenseFactor: 1,
    extraMonthlyShock: 0,
  },
  {
    key: "optimistic",
    name: "Optimista",
    description: "Ingresos 8% mayores y gastos operativos 5% menores.",
    incomeFactor: 1.08,
    expenseFactor: 0.95,
    extraMonthlyShock: 0,
  },
  {
    key: "pessimistic",
    name: "Pesimista",
    description: "Ingresos 20% menores, gastos 15% mayores y presión mensual adicional.",
    incomeFactor: 0.8,
    expenseFactor: 1.15,
    extraMonthlyShock: 300000,
  },
];

export function average(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return 0;
  return valid.reduce((total, value) => total + value, 0) / valid.length;
}

export function getForecastSummary({
  historicalMonths,
  monthlyDebtPayments,
  monthlyGoalRequired,
  liquidAssets,
}: {
  historicalMonths: HistoricalMonth[];
  monthlyDebtPayments: number;
  monthlyGoalRequired: number;
  liquidAssets: number;
}): ForecastSummary {
  const monthsWithActivity = historicalMonths.filter((month) => month.income > 0 || month.consolidatedExpenses > 0);
  const source = monthsWithActivity.length ? monthsWithActivity : historicalMonths;

  return {
    averageIncome: average(source.map((month) => month.income)),
    averageOperatingExpenses: average(source.map((month) => month.consolidatedExpenses)),
    averageNetFlow: average(source.map((month) => month.netFlow)),
    monthlyDebtPayments,
    monthlyGoalRequired,
    liquidAssets,
  };
}

function addMonths(monthStart: string, offset: number) {
  const date = new Date(`${monthStart}T00:00:00`);
  date.setMonth(date.getMonth() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function formatForecastMonthLabel(monthStart: string) {
  return new Intl.DateTimeFormat("es-CO", { month: "short", year: "numeric" }).format(new Date(`${monthStart}T00:00:00`));
}

export function getProjectionMonths({
  startMonth,
  horizonMonths,
  summary,
  scenario,
}: {
  startMonth: string;
  horizonMonths: number;
  summary: ForecastSummary;
  scenario: ForecastScenario;
}): ForecastMonth[] {
  let cashPosition = summary.liquidAssets;
  const months: ForecastMonth[] = [];

  for (let index = 0; index < horizonMonths; index += 1) {
    const monthStart = addMonths(startMonth, index);
    const projectedIncome = summary.averageIncome * scenario.incomeFactor;
    const projectedOperatingExpenses = summary.averageOperatingExpenses * scenario.expenseFactor;
    const projectedDebtPayments = summary.monthlyDebtPayments;
    const projectedGoalCommitments = summary.monthlyGoalRequired;
    const extraShock = scenario.extraMonthlyShock;
    const projectedOutflow = projectedOperatingExpenses + projectedDebtPayments + projectedGoalCommitments + extraShock;
    const projectedNetFlow = projectedIncome - projectedOutflow;

    cashPosition += projectedNetFlow;

    months.push({
      monthStart,
      label: formatForecastMonthLabel(monthStart),
      projectedIncome,
      projectedOperatingExpenses,
      projectedDebtPayments,
      projectedGoalCommitments,
      extraShock,
      projectedOutflow,
      projectedNetFlow,
      projectedCashPosition: cashPosition,
    });
  }

  return months;
}

export function getRunwayFromCash(cash: number, monthlyOutflow: number) {
  if (monthlyOutflow <= 0) return null;
  return cash / monthlyOutflow;
}

function severityFromRunway(runwayMonths: number | null, netFlow: number): StressTestResult["severity"] {
  if (netFlow >= 0 && (runwayMonths === null || runwayMonths >= 6)) return "healthy";
  if ((runwayMonths ?? 0) >= 3) return "warning";
  return "critical";
}

export function getStressTests(summary: ForecastSummary): StressTestResult[] {
  const tests = [
    {
      name: "Ingreso -20%",
      description: "Simula una caída parcial de ingresos durante un mes típico.",
      income: summary.averageIncome * 0.8,
      outflow: summary.averageOperatingExpenses + summary.monthlyDebtPayments + summary.monthlyGoalRequired,
    },
    {
      name: "Mercado/gastos +15%",
      description: "Simula inflación o aumento de gastos operativos.",
      income: summary.averageIncome,
      outflow: summary.averageOperatingExpenses * 1.15 + summary.monthlyDebtPayments + summary.monthlyGoalRequired,
    },
    {
      name: "Imprevisto $1.000.000",
      description: "Agrega un gasto extraordinario mensual para medir resiliencia.",
      income: summary.averageIncome,
      outflow: summary.averageOperatingExpenses + summary.monthlyDebtPayments + summary.monthlyGoalRequired + 1000000,
    },
  ];

  return tests.map((test) => {
    const projectedMonthlyNetFlow = test.income - test.outflow;
    const runwayMonths = getRunwayFromCash(summary.liquidAssets, test.outflow);
    return {
      name: test.name,
      description: test.description,
      projectedMonthlyNetFlow,
      runwayMonths,
      severity: severityFromRunway(runwayMonths, projectedMonthlyNetFlow),
    };
  });
}

export function getForecastInsight(summary: ForecastSummary) {
  const totalOutflow = summary.averageOperatingExpenses + summary.monthlyDebtPayments + summary.monthlyGoalRequired;
  const projectedNet = summary.averageIncome - totalOutflow;
  const runway = getRunwayFromCash(summary.liquidAssets, totalOutflow);

  if (summary.averageIncome <= 0 && totalOutflow <= 0) {
    return "Aún no hay suficientes datos para proyectar. Registra ingresos y gastos reales durante algunos periodos.";
  }

  if (projectedNet < 0) {
    return "La proyección base muestra flujo negativo. Revisa presupuestos, gastos operativos, deuda y aportes a objetivos antes de aumentar compromisos.";
  }

  if ((runway ?? 0) < 3) {
    return "El flujo mensual parece positivo, pero la liquidez disponible cubre menos de 3 meses de salida proyectada. Prioriza fondo de emergencia.";
  }

  return "La proyección base es estable. Mantén seguimiento de presupuesto, mercado y deuda para sostener la tendencia.";
}
