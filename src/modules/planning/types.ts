export type GoalCategory = "emergency_fund" | "travel" | "debt_payment" | "purchase" | "home_improvement" | "education" | "investment" | "other";

export type GoalPriority = "low" | "medium" | "high";

export type GoalStatus = "active" | "completed" | "paused";

export type FinancialGoal = {
  id: string;
  family_id: string;
  name: string;
  category: GoalCategory;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  responsible_member_id: string | null;
  priority: GoalPriority;
  status: GoalStatus;
  notes: string | null;
  created_at: string;
  family_members?: { full_name: string } | null;
};

export type GoalContribution = {
  id: string;
  family_id: string;
  goal_id: string;
  contributed_on: string;
  amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  financial_goals?: Pick<FinancialGoal, "name"> | null;
};

export type GoalProgress = {
  id: string;
  name: string;
  category: GoalCategory;
  categoryLabel: string;
  priority: GoalPriority;
  priorityLabel: string;
  status: GoalStatus;
  statusLabel: string;
  targetAmount: number;
  accumulatedAmount: number;
  remainingAmount: number;
  progressRate: number;
  targetDate: string | null;
  daysRemaining: number | null;
  monthsRemaining: number | null;
  requiredMonthlyContribution: number | null;
  averageMonthlyContribution: number;
  health: "on_track" | "at_risk" | "late" | "completed" | "paused";
  responsibleName: string | null;
  notes: string | null;
};

export type GoalSummary = {
  activeGoals: number;
  completedGoals: number;
  totalTargetAmount: number;
  totalAccumulatedAmount: number;
  totalRemainingAmount: number;
  averageProgressRate: number;
  nextGoal: GoalProgress | null;
};

export type FinancialHealthInput = {
  savingsRate: number;
  debtToIncomeRatio: number;
  budgetExceededCount: number;
  budgetWarningCount: number;
  netWorth: number;
  runwayMonths: number;
};

export type FinancialHealthScore = {
  score: number;
  label: "Crítico" | "Vulnerable" | "Estable" | "Sólido";
  signals: string[];
};
