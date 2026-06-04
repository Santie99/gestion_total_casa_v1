import type {
  FinancialGoal,
  FinancialHealthInput,
  FinancialHealthScore,
  GoalCategory,
  GoalContribution,
  GoalPriority,
  GoalProgress,
  GoalStatus,
  GoalSummary,
} from "./types";

export function getGoalCategoryLabel(category: GoalCategory) {
  const labels: Record<GoalCategory, string> = {
    emergency_fund: "Fondo de emergencia",
    travel: "Viaje",
    debt_payment: "Pago de deuda",
    purchase: "Compra importante",
    home_improvement: "Mejora del hogar",
    education: "Educación",
    investment: "Inversión",
    other: "Otro",
  };

  return labels[category];
}

export function getGoalPriorityLabel(priority: GoalPriority) {
  const labels: Record<GoalPriority, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
  };

  return labels[priority];
}

export function getGoalStatusLabel(status: GoalStatus) {
  const labels: Record<GoalStatus, string> = {
    active: "Activo",
    completed: "Completado",
    paused: "Pausado",
  };

  return labels[status];
}

export function sumGoalContributions(contributions: GoalContribution[]) {
  return contributions.reduce<Record<string, number>>((acc, contribution) => {
    acc[contribution.goal_id] = (acc[contribution.goal_id] ?? 0) + Number(contribution.amount ?? 0);
    return acc;
  }, {});
}

function getMonthsRemaining(targetDate: string | null) {
  if (!targetDate) return null;

  const now = new Date();
  const target = new Date(`${targetDate}T00:00:00`);
  const diffMs = target.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) return { days, months: 0 };

  return {
    days,
    months: Math.max(1, Math.ceil(days / 30)),
  };
}

export function getGoalProgressRows(goals: FinancialGoal[], contributions: GoalContribution[]): GoalProgress[] {
  const contributionsByGoal = sumGoalContributions(contributions);

  return goals
    .map((goal) => {
      const targetAmount = Number(goal.target_amount ?? 0);
      const accumulatedAmount = Number(goal.current_amount ?? 0) + Number(contributionsByGoal[goal.id] ?? 0);
      const remainingAmount = Math.max(targetAmount - accumulatedAmount, 0);
      const progressRate = targetAmount > 0 ? accumulatedAmount / targetAmount : 0;
      const remaining = getMonthsRemaining(goal.target_date);
      const requiredMonthlyContribution = remaining && remaining.months > 0 ? remainingAmount / remaining.months : null;
      const averageMonthlyContribution = Number(contributionsByGoal[goal.id] ?? 0);
      let health: GoalProgress["health"] = "on_track";

      if (goal.status === "completed" || progressRate >= 1) health = "completed";
      else if (goal.status === "paused") health = "paused";
      else if (remaining && remaining.days < 0) health = "late";
      else if (requiredMonthlyContribution !== null && averageMonthlyContribution > 0 && averageMonthlyContribution < requiredMonthlyContribution * 0.75) health = "at_risk";

      return {
        id: goal.id,
        name: goal.name,
        category: goal.category,
        categoryLabel: getGoalCategoryLabel(goal.category),
        priority: goal.priority,
        priorityLabel: getGoalPriorityLabel(goal.priority),
        status: goal.status,
        statusLabel: getGoalStatusLabel(goal.status),
        targetAmount,
        accumulatedAmount,
        remainingAmount,
        progressRate,
        targetDate: goal.target_date,
        daysRemaining: remaining?.days ?? null,
        monthsRemaining: remaining?.months ?? null,
        requiredMonthlyContribution,
        averageMonthlyContribution,
        health,
        responsibleName: goal.family_members?.full_name ?? null,
        notes: goal.notes,
      };
    })
    .sort((a, b) => {
      const priorityOrder: Record<GoalPriority, number> = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority] || (a.targetDate ?? "9999-12-31").localeCompare(b.targetDate ?? "9999-12-31");
    });
}

export function getGoalSummary(rows: GoalProgress[]): GoalSummary {
  const activeRows = rows.filter((row) => row.status === "active");
  const completedRows = rows.filter((row) => row.status === "completed" || row.progressRate >= 1);
  const totalTargetAmount = activeRows.reduce((total, row) => total + row.targetAmount, 0);
  const totalAccumulatedAmount = activeRows.reduce((total, row) => total + row.accumulatedAmount, 0);
  const totalRemainingAmount = Math.max(totalTargetAmount - totalAccumulatedAmount, 0);
  const averageProgressRate = totalTargetAmount > 0 ? totalAccumulatedAmount / totalTargetAmount : 0;
  const nextGoal = activeRows
    .filter((row) => row.targetDate)
    .sort((a, b) => (a.targetDate ?? "9999-12-31").localeCompare(b.targetDate ?? "9999-12-31"))[0] ?? null;

  return {
    activeGoals: activeRows.length,
    completedGoals: completedRows.length,
    totalTargetAmount,
    totalAccumulatedAmount,
    totalRemainingAmount,
    averageProgressRate,
    nextGoal,
  };
}

export function getGoalHealthLabel(health: GoalProgress["health"]) {
  const labels: Record<GoalProgress["health"], string> = {
    on_track: "En curso",
    at_risk: "En riesgo",
    late: "Atrasado",
    completed: "Completado",
    paused: "Pausado",
  };

  return labels[health];
}

export function getRunwayMonths(liquidAssets: number, monthlyBurnRate: number) {
  return monthlyBurnRate > 0 ? liquidAssets / monthlyBurnRate : 0;
}

export function getFinancialHealthScore(input: FinancialHealthInput): FinancialHealthScore {
  let score = 50;
  const signals: string[] = [];

  if (input.savingsRate >= 0.2) {
    score += 18;
    signals.push("La tasa de ahorro consolidada está en rango fuerte.");
  } else if (input.savingsRate >= 0.05) {
    score += 8;
    signals.push("La tasa de ahorro es positiva, pero todavía puede mejorar.");
  } else {
    score -= 18;
    signals.push("El flujo neto consolidado está bajo presión o negativo.");
  }

  if (input.debtToIncomeRatio <= 0.25) {
    score += 14;
    signals.push("La carga mensual de deuda es manejable frente a ingresos.");
  } else if (input.debtToIncomeRatio <= 0.35) {
    score -= 4;
    signals.push("La deuda mensual está en zona de vigilancia.");
  } else {
    score -= 18;
    signals.push("La deuda mensual pesa demasiado frente a los ingresos.");
  }

  if (input.runwayMonths >= 6) {
    score += 14;
    signals.push("La liquidez cubre al menos seis meses de gasto consolidado.");
  } else if (input.runwayMonths >= 3) {
    score += 6;
    signals.push("La liquidez cubre al menos tres meses de operación del hogar.");
  } else {
    score -= 12;
    signals.push("La liquidez disponible no cubre tres meses de gasto consolidado.");
  }

  if (input.budgetExceededCount > 0) {
    score -= input.budgetExceededCount * 7;
    signals.push("Hay presupuestos excedidos este mes.");
  } else if (input.budgetWarningCount > 0) {
    score -= input.budgetWarningCount * 3;
    signals.push("Hay presupuestos cerca del límite.");
  } else {
    score += 6;
    signals.push("No hay presupuestos excedidos registrados para este mes.");
  }

  if (input.netWorth > 0) {
    score += 8;
    signals.push("El patrimonio neto registrado es positivo.");
  } else {
    score -= 8;
    signals.push("El patrimonio neto registrado no es positivo todavía.");
  }

  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const label: FinancialHealthScore["label"] = normalizedScore >= 80 ? "Sólido" : normalizedScore >= 60 ? "Estable" : normalizedScore >= 40 ? "Vulnerable" : "Crítico";

  return { score: normalizedScore, label, signals };
}
