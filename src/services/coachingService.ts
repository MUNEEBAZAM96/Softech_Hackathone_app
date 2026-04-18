import type {
  BudgetAlertPreferences,
  CategoryBudget,
  SavingsGoal,
  SavingsGoalAnalytics,
} from "../types";
import type { Transaction } from "../types";
import { getCategoryById } from "../constants/categories";
import {
  buildBudgetAlertItem,
  formatMonthKey,
  type BudgetAlertContext,
} from "./budgetAlertService";
import {
  getPrimaryGoalForDashboard,
  getSavingsGoalAnalytics,
} from "./savingsGoalService";

export type FinancialCoaching = {
  goalLine: string | null;
  budgetLine: string | null;
  suggestion: string;
};

function categoryName(id: string): string {
  return getCategoryById(id)?.name ?? "This category";
}

const ctx: BudgetAlertContext = {
  getCategoryName: categoryName,
};

export function getFinancialCoaching(
  transactions: Transaction[],
  goals: SavingsGoal[],
  budgets: CategoryBudget[],
  prefs: BudgetAlertPreferences,
  now: Date = new Date()
): FinancialCoaching {
  const primary = getPrimaryGoalForDashboard(goals);
  let goalLine: string | null = null;
  let goalAnalytics: SavingsGoalAnalytics | null = null;

  if (primary) {
    goalAnalytics = getSavingsGoalAnalytics(transactions, primary, goals);
    const pct = Math.round(goalAnalytics.progressPct);
    if (goalAnalytics.pace === "completed") {
      goalLine = `Nice — “${goalAnalytics.title}” is complete.`;
    } else if (goalAnalytics.pace === "ahead") {
      goalLine = `You’re ahead on “${goalAnalytics.title}” (${pct}% saved). Keep the cushion.`;
    } else if (goalAnalytics.pace === "on_track") {
      goalLine = `“${goalAnalytics.title}” is on track at ${pct}% — stay steady.`;
    } else {
      goalLine = `“${goalAnalytics.title}” needs a bit more attention (${pct}% saved) — trim discretionary spend this week.`;
    }
  }

  const monthKey = formatMonthKey(now);
  const monthBudgets = budgets.filter((b) => b.monthKey === monthKey);
  let budgetLine: string | null = null;
  if (monthBudgets.length > 0) {
    const items = monthBudgets.map((b) =>
      buildBudgetAlertItem(transactions, b, prefs, ctx, now)
    );
    const worst = [...items].sort((a, b) => b.usagePct - a.usagePct)[0];
    if (worst && worst.level !== "safe") {
      budgetLine = worst.message;
    }
  }

  let suggestion =
    "Review weekly spends and move a small fixed amount toward savings on payday.";
  if (goalAnalytics && goalAnalytics.pace === "behind") {
    suggestion = `Aim to set aside about PKR ${Math.round(goalAnalytics.requiredPerDay).toLocaleString("en-PK")} per day until your goal deadline — one fewer discretionary purchase can cover it.`;
  } else if (budgetLine?.includes("exceeded")) {
    suggestion =
      "Pause non-essential purchases in that category until next month, or shift funds from a lower-priority bucket.";
  } else if (budgetLine?.includes("slow down")) {
    suggestion =
      "Batch groceries and defer one optional buy this week to stay under cap.";
  }

  return { goalLine, budgetLine, suggestion };
}
