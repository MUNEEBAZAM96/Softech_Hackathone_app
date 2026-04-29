export type AppUser = {
  id: string;
  name: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

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

export type ThemeMode = "system" | "light" | "dark";

/** AI Copilot chat message (Insights tab). */
export type CopilotMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

export type CopilotQuickAction = {
  id: string;
  label: string;
  prompt: string;
};

/** Compact, deterministic snapshot sent to the copilot API (no PII beyond category names). */
export type CopilotContextSnapshot = {
  currency: string;
  monthKey: string;
  balance: number;
  income: number;
  expense: number;
  topCategories: Array<{
    categoryId: string;
    name: string;
    amount: number;
    percentOfExpense: number;
  }>;
  budgetsThisMonth: Array<{
    categoryId: string;
    name: string;
    limit: number;
    spent: number;
    usagePct: number;
    alertLevel: BudgetAlertLevel;
  }>;
  goals: Array<{
    title: string;
    targetAmount: number;
    savedAmount: number;
    remaining: number;
    progressPct: number;
    requiredPerDay: number;
    pace: GoalPaceKind;
    daysLeft: number;
  }>;
  generatedAt: string;
};

export type CopilotApiRequest = {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  context: CopilotContextSnapshot;
};

export type CopilotApiResponse = {
  reply: string;
};

/** Snapshot for `POST /api/daily-tip` — only fields present in-app (PKR). */
export type DailyTipContext = {
  currency: "PKR";
  monthKey: string;
  balance: number;
  income: number;
  expense: number;
  monthOverMonth: {
    currentMonthNet: number;
    previousMonthNet: number;
    percentChangeVsPrevious: number | null;
  };
  topCategories: Array<{
    name: string;
    amount: number;
    percentOfExpense: number;
  }>;
  budgetAlertsCount: number;
  primaryGoal: null | {
    title: string;
    progressPct: number;
    pace: GoalPaceKind;
    savedAmount: number;
    targetAmount: number;
    daysLeft: number;
  };
  /** Lets the model vary wording between requests. */
  variationSeed: number;
  generatedAt: string;
};

export type DailyTipApiResponse = {
  tip: string;
};

export type ReceiptParseCategoryContext = {
  id: string;
  name: string;
  kind: TransactionKind;
};

export type ReceiptParseRequest = {
  imageBase64: string;
  mimeType: string;
  currency?: string;
  categories?: ReceiptParseCategoryContext[];
};

export type ReceiptDraft = {
  amount: number | null;
  kind: TransactionKind;
  note: string;
  merchant?: string;
  dateIso: string | null;
  suggestedCategoryName?: string;
  suggestedCategoryKind?: TransactionKind;
  confidence: number;
};

export type ReceiptParseResponse =
  | {
      ok: true;
      draft: ReceiptDraft;
    }
  | {
      ok: false;
      code:
        | "INVALID_IMAGE"
        | "UNREADABLE_RECEIPT"
        | "AI_PARSE_FAILED"
        | "RATE_LIMITED"
        | "SERVER_ERROR";
      message: string;
    };
