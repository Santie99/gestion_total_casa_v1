import type { HouseholdInsight, InsightInput, InsightSeverity, InsightSummary } from "./types";

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function severityWeight(severity: InsightSeverity) {
  const weights: Record<InsightSeverity, number> = {
    critical: 4,
    warning: 3,
    info: 2,
    positive: 1,
  };
  return weights[severity];
}

function addInsight(insights: HouseholdInsight[], insight: HouseholdInsight) {
  insights.push(insight);
}

export function getInsightSummary(insights: HouseholdInsight[]): InsightSummary {
  const critical = insights.filter((insight) => insight.severity === "critical").length;
  const warning = insights.filter((insight) => insight.severity === "warning").length;
  const positive = insights.filter((insight) => insight.severity === "positive").length;
  const info = insights.filter((insight) => insight.severity === "info").length;
  const priorityScore = critical * 3 + warning * 2 + info;

  return {
    total: insights.length,
    critical,
    warning,
    positive,
    info,
    priorityScore,
  };
}

export function getSeverityLabel(severity: InsightSeverity) {
  const labels: Record<InsightSeverity, string> = {
    critical: "Crítico",
    warning: "Alerta",
    info: "Informativo",
    positive: "Positivo",
  };
  return labels[severity];
}

export function getAreaLabel(area: HouseholdInsight["area"]) {
  const labels: Record<HouseholdInsight["area"], string> = {
    finance: "Finanzas",
    market: "Mercado",
    stock: "Stock",
    car: "Carro",
    goals: "Objetivos",
    risk: "Riesgo",
    operations: "Operación",
  };
  return labels[area];
}

export function generateDeterministicInsights(input: InsightInput): HouseholdInsight[] {
  const insights: HouseholdInsight[] = [];

  if (input.incomeTotal <= 0) {
    addInsight(insights, {
      id: "finance-no-income",
      area: "finance",
      severity: "warning",
      title: "No hay ingresos registrados este mes",
      description: "El dashboard no puede leer flujo real si el mes no tiene ingresos cargados.",
      recommendation: "Registra ingresos del periodo o confirma si este mes aún no ha recibido entradas.",
      actionHref: "/ingresos",
      actionLabel: "Registrar ingresos",
    });
  } else if (input.netFlow < 0) {
    addInsight(insights, {
      id: "finance-negative-flow",
      area: "finance",
      severity: "critical",
      title: "Flujo neto consolidado negativo",
      description: `El hogar está gastando ${formatCurrency(Math.abs(input.netFlow))} más de lo que ingresó este mes.`,
      recommendation: "Revisa gastos discrecionales, Mercado, Carro y presupuestos excedidos antes de cerrar el mes.",
      metricLabel: "Flujo neto",
      metricValue: formatCurrency(input.netFlow),
      actionHref: "/dashboard",
      actionLabel: "Ver dashboard",
    });
  } else if (input.savingsRate >= 0.2) {
    addInsight(insights, {
      id: "finance-strong-savings",
      area: "finance",
      severity: "positive",
      title: "Tasa de ahorro fuerte",
      description: `La tasa de ahorro consolidada está en ${formatPercent(input.savingsRate)}.`,
      recommendation: "Considera dirigir parte del excedente a objetivos, deuda o fondo de emergencia.",
      metricLabel: "Ahorro real",
      metricValue: formatPercent(input.savingsRate),
      actionHref: "/objetivos",
      actionLabel: "Ver objetivos",
    });
  } else if (input.savingsRate < 0.05 && input.incomeTotal > 0) {
    addInsight(insights, {
      id: "finance-low-savings",
      area: "finance",
      severity: "warning",
      title: "Tasa de ahorro baja",
      description: `La tasa de ahorro consolidada está en ${formatPercent(input.savingsRate)}.`,
      recommendation: "Define un presupuesto de gasto total y revisa categorías con mayor presión.",
      metricLabel: "Ahorro real",
      metricValue: formatPercent(input.savingsRate),
      actionHref: "/presupuestos",
      actionLabel: "Ver presupuestos",
    });
  }

  const exceededBudgets = input.budgetExecutions.filter((budget) => budget.status === "exceeded");
  const warningBudgets = input.budgetExecutions.filter((budget) => budget.status === "warning");
  if (exceededBudgets.length > 0) {
    const top = exceededBudgets[0];
    addInsight(insights, {
      id: "budget-exceeded",
      area: "finance",
      severity: "critical",
      title: "Hay presupuestos excedidos",
      description: `${top.label} está al ${formatPercent(top.usageRate)} de ejecución y supera el presupuesto en ${formatCurrency(Math.abs(top.variance))}.`,
      recommendation: "Ajusta gasto restante del mes o actualiza el presupuesto si el límite ya no es realista.",
      actionHref: "/presupuestos",
      actionLabel: "Revisar presupuestos",
    });
  } else if (warningBudgets.length > 0) {
    const top = warningBudgets[0];
    addInsight(insights, {
      id: "budget-warning",
      area: "finance",
      severity: "warning",
      title: "Presupuesto cerca del límite",
      description: `${top.label} ya está al ${formatPercent(top.usageRate)} de ejecución.`,
      recommendation: "Controla nuevas compras en esta capa hasta cerrar el mes.",
      actionHref: "/presupuestos",
      actionLabel: "Ver ejecución",
    });
  } else if (input.budgetExecutions.length === 0) {
    addInsight(insights, {
      id: "budget-missing",
      area: "finance",
      severity: "info",
      title: "No hay presupuestos para este mes",
      description: "La app puede mostrar gasto real, pero aún no tiene límites mensuales contra los cuales comparar.",
      recommendation: "Crea al menos un presupuesto para gasto total, Mercado y Carro.",
      actionHref: "/presupuestos",
      actionLabel: "Crear presupuesto",
    });
  }

  if (input.debtToIncomeRatio > 0.35) {
    addInsight(insights, {
      id: "risk-high-debt",
      area: "risk",
      severity: "critical",
      title: "Carga de deuda alta frente a ingresos",
      description: `La deuda mensual representa ${formatPercent(input.debtToIncomeRatio)} de los ingresos del mes.`,
      recommendation: "Prioriza revisar tasas, cuotas y pagos de deuda antes de asumir nuevos compromisos.",
      actionHref: "/deudas",
      actionLabel: "Ver deudas",
    });
  } else if (input.debtToIncomeRatio > 0.25) {
    addInsight(insights, {
      id: "risk-debt-watch",
      area: "risk",
      severity: "warning",
      title: "Deuda en zona de vigilancia",
      description: `La deuda mensual está en ${formatPercent(input.debtToIncomeRatio)} de los ingresos.`,
      recommendation: "Evita que la cuota mensual crezca y considera acelerar pagos si hay excedente.",
      actionHref: "/deudas",
      actionLabel: "Ver deuda",
    });
  }

  if (input.runwayMonths > 0 && input.runwayMonths < 3) {
    addInsight(insights, {
      id: "risk-low-runway",
      area: "risk",
      severity: "critical",
      title: "Liquidez menor a tres meses",
      description: `El runway doméstico estimado es de ${input.runwayMonths.toFixed(1)} meses.`,
      recommendation: "Refuerza liquidez o fondo de emergencia antes de aumentar gastos no esenciales.",
      actionHref: "/patrimonio",
      actionLabel: "Ver patrimonio",
    });
  } else if (input.runwayMonths >= 6) {
    addInsight(insights, {
      id: "risk-healthy-runway",
      area: "risk",
      severity: "positive",
      title: "Buena cobertura de liquidez",
      description: `La liquidez cubre aproximadamente ${input.runwayMonths.toFixed(1)} meses de gasto consolidado.`,
      recommendation: "Mantén esta cobertura y evalúa si el excedente puede apoyar objetivos o inversión.",
      actionHref: "/patrimonio",
      actionLabel: "Ver liquidez",
    });
  }

  if (input.stockStats.empty > 0) {
    addInsight(insights, {
      id: "stock-empty",
      area: "stock",
      severity: "critical",
      title: "Hay productos agotados en stock",
      description: `${input.stockStats.empty} producto(s) aparecen con cantidad en cero o negativa.`,
      recommendation: "Crea una lista de compras o ajusta stock si el dato físico no coincide.",
      actionHref: "/compras",
      actionLabel: "Ir a compras",
    });
  } else if (input.stockStats.low > 0) {
    addInsight(insights, {
      id: "stock-low",
      area: "stock",
      severity: "warning",
      title: "Stock bajo detectado",
      description: `${input.stockStats.low} producto(s) están en o por debajo del mínimo definido.`,
      recommendation: "Inclúyelos en la próxima lista o revisa los mínimos configurados.",
      actionHref: "/mercado",
      actionLabel: "Ver stock",
    });
  }

  const priceSpike = input.priceRows.find((row) => Number(row.variationPercent ?? 0) >= 0.25);
  const priceWarning = input.priceRows.find((row) => Number(row.variationPercent ?? 0) >= 0.12);
  if (priceSpike) {
    addInsight(insights, {
      id: `market-price-spike-${priceSpike.productName}`,
      area: "market",
      severity: "critical",
      title: "Producto con aumento fuerte de precio",
      description: `${priceSpike.productName} subió ${formatPercent(priceSpike.variationPercent ?? 0)} frente a la compra comparable anterior.`,
      recommendation: "Valida proveedor, presentación y unidad. Considera comprar en otro lugar o buscar sustituto.",
      metricLabel: `${priceSpike.productName} / ${priceSpike.unit}`,
      metricValue: formatCurrency(priceSpike.latestPrice),
      actionHref: "/mercado",
      actionLabel: "Ver histórico",
    });
  } else if (priceWarning) {
    addInsight(insights, {
      id: `market-price-warning-${priceWarning.productName}`,
      area: "market",
      severity: "warning",
      title: "Producto con aumento relevante",
      description: `${priceWarning.productName} subió ${formatPercent(priceWarning.variationPercent ?? 0)} frente a su compra anterior comparable.`,
      recommendation: "Observa si el aumento se repite en la siguiente compra antes de ajustar presupuesto.",
      actionHref: "/mercado",
      actionLabel: "Ver precios",
    });
  }

  const marketShare = input.consolidatedExpenses > 0 ? input.marketExpenses / input.consolidatedExpenses : 0;
  if (marketShare > 0.55) {
    addInsight(insights, {
      id: "market-high-share",
      area: "market",
      severity: "info",
      title: "Mercado concentra gran parte del gasto",
      description: `Mercado representa ${formatPercent(marketShare)} del gasto consolidado del mes.`,
      recommendation: "Revisa categorías principales, histórico de precios y compras esporádicas.",
      actionHref: "/mercado",
      actionLabel: "Ver mercado",
    });
  }

  if (input.shoppingStats.highPriorityItems > 0) {
    addInsight(insights, {
      id: "shopping-high-priority",
      area: "operations",
      severity: "warning",
      title: "Hay compras prioritarias pendientes",
      description: `${input.shoppingStats.highPriorityItems} producto(s) de alta prioridad siguen pendientes en listas activas.`,
      recommendation: "Revisa las listas antes de crear nuevas compras para evitar duplicados.",
      actionHref: "/compras",
      actionLabel: "Ver listas",
    });
  }

  if (input.pendingCarReminders > 0) {
    addInsight(insights, {
      id: "car-pending-reminders",
      area: "car",
      severity: "warning",
      title: "Hay pendientes del carro",
      description: `${input.pendingCarReminders} recordatorio(s) de carro siguen activos.`,
      recommendation: "Revisa vencimientos de SOAT, tecnomecánica, impuestos o mantenimiento preventivo.",
      actionHref: "/carro",
      actionLabel: "Ver carro",
    });
  }

  const lateGoal = input.goals.find((goal) => goal.health === "late");
  const riskGoal = input.goals.find((goal) => goal.health === "at_risk");
  const completedGoal = input.goals.find((goal) => goal.health === "completed");
  if (lateGoal) {
    addInsight(insights, {
      id: `goal-late-${lateGoal.name}`,
      area: "goals",
      severity: "critical",
      title: "Objetivo financiero atrasado",
      description: `${lateGoal.name} no alcanzó la meta en la fecha definida.`,
      recommendation: "Actualiza fecha, monto objetivo o aporte mensual requerido.",
      actionHref: "/objetivos",
      actionLabel: "Ver objetivo",
    });
  } else if (riskGoal) {
    addInsight(insights, {
      id: `goal-risk-${riskGoal.name}`,
      area: "goals",
      severity: "warning",
      title: "Objetivo en riesgo",
      description: `${riskGoal.name} requiere cerca de ${riskGoal.requiredMonthlyContribution ? formatCurrency(riskGoal.requiredMonthlyContribution) : "un aporte mayor"} al mes para llegar a tiempo.`,
      recommendation: "Aumenta aportes o ajusta el plazo si el flujo libre no alcanza.",
      actionHref: "/objetivos",
      actionLabel: "Ver metas",
    });
  } else if (completedGoal) {
    addInsight(insights, {
      id: `goal-completed-${completedGoal.name}`,
      area: "goals",
      severity: "positive",
      title: "Objetivo completado o cubierto",
      description: `${completedGoal.name} aparece como completado o con avance total.`,
      recommendation: "Cierra formalmente el objetivo o reasigna excedentes a una nueva meta.",
      actionHref: "/objetivos",
      actionLabel: "Ver objetivos",
    });
  }

  if (input.netWorth < 0) {
    addInsight(insights, {
      id: "wealth-negative",
      area: "risk",
      severity: "warning",
      title: "Patrimonio neto negativo",
      description: `El patrimonio neto registrado es ${formatCurrency(input.netWorth)}.`,
      recommendation: "Revisa saldos de deuda y activos registrados. Prioriza reducción de pasivos caros.",
      actionHref: "/patrimonio",
      actionLabel: "Ver patrimonio",
    });
  }

  return insights.sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity) || a.area.localeCompare(b.area));
}

export function buildAiInsightPayload(input: InsightInput, insights: HouseholdInsight[]) {
  return {
    version: "sprint_16_prepared_ai_payload",
    generatedAt: new Date().toISOString(),
    instruction: "Payload preparado para una futura capa IA. En Sprint 16 no se llama ningún proveedor externo.",
    input,
    deterministicInsights: insights,
  };
}
