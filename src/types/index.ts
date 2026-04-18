export type TransactionKind = "income" | "expense";

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: TransactionKind;
};

export type Transaction = {
  id: string;
  kind: TransactionKind;
  amount: number;
  categoryId: string;
  note?: string;
  date: string;
  createdAt: string;
};

export type FinancialSummary = {
  balance: number;
  income: number;
  expense: number;
  byCategory: Array<{
    categoryId: string;
    total: number;
    percent: number;
  }>;
};

export type Insight = {
  id: string;
  title: string;
  description: string;
  sentiment: "positive" | "neutral" | "warning";
};

/** User-managed savings target — progress uses net-based allocation by default. */
export type SavingsGoalStatus = "active" | "completed" | "archived";

export type SavingsGoal = {
  id: string;
  title: string;
  /** Target amount in account currency (e.g. PKR). */
  targetAmount: number;
  /** ISO date — end of goal period. */
  deadline: string;
  /** Optional lump sum already counted toward the goal. */
  startingAmount?: number;
  /** Optional monthly savings intent (display / coaching only). */
  monthlyContributionGoal?: number;
  createdAt: string;
  status: SavingsGoalStatus;
};

/** Linear pace vs schedule from createdAt → deadline (deterministic). */
export type GoalPaceKind = "ahead" | "on_track" | "behind" | "completed";

export type SavingsGoalAnalytics = {
  goalId: string;
  title: string;
  targetAmount: number;
  /** Amount attributed to this goal (net allocation + optional starting). */
  savedAmount: number;
  progressPct: number;
  remaining: number;
  daysLeft: number;
  requiredPerDay: number;
  pace: GoalPaceKind;
  deadline: string;
};

export type CategoryBudget = {
  id: string;
  categoryId: string;
  /** `YYYY-MM` */
  monthKey: string;
  limitAmount: number;
  createdAt: string;
};

export type BudgetAlertLevel = "safe" | "early" | "warning" | "exceeded";

export type BudgetAlertItem = {
  id: string;
  categoryId: string;
  monthKey: string;
  level: BudgetAlertLevel;
  message: string;
  forecastMessage?: string;
  usagePct: number;
  spent: number;
  limitAmount: number;
  /** ISO — generated time for ordering */
  generatedAt: string;
};

export type BudgetAlertPreferences = {
  /** When true, include 70%+ “early” alerts when enough month remains. */
  showEarlyWarningAt70: boolean;
};
