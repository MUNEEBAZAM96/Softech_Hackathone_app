import type {
  BudgetAlertPreferences,
  Category,
  CategoryBudget,
  CopilotContextSnapshot,
  SavingsGoal,
  Transaction,
} from "../types";
import { getCategoryById } from "../constants/categories";
import {
  buildBudgetAlertItem,
  formatMonthKey,
  type BudgetAlertContext,
} from "./budgetAlertService";
import { getAllSavingsGoalAnalytics } from "./savingsGoalService";
import { summarize } from "./transactionService";

/**
 * Build a compact snapshot of local finance state for the copilot model.
 * Deterministic and safe to serialize.
 */
export function buildCopilotContextSnapshot(
  transactions: Transaction[],
  goals: SavingsGoal[],
  budgets: CategoryBudget[],
  prefs: BudgetAlertPreferences,
  now: Date = new Date(),
  categories: Category[] = []
): CopilotContextSnapshot {
  const ctx: BudgetAlertContext = {
    getCategoryName: (id) => getCategoryById(id, categories)?.name ?? "Unknown",
  };
  const summary = summarize(transactions);
  const monthKey = formatMonthKey(now);
  const topCategories = summary.byCategory.slice(0, 6).map((row) => ({
    categoryId: row.categoryId,
    name: getCategoryById(row.categoryId, categories)?.name ?? row.categoryId,
    amount: row.total,
    percentOfExpense: row.percent,
  }));

  const monthBudgets = budgets.filter((b) => b.monthKey === monthKey);
  const budgetsThisMonth = monthBudgets.map((b) => {
    const alert = buildBudgetAlertItem(transactions, b, prefs, ctx, now);
    return {
      categoryId: b.categoryId,
      name: getCategoryById(b.categoryId, categories)?.name ?? b.categoryId,
      limit: b.limitAmount,
      spent: alert.spent,
      usagePct: Math.round(alert.usagePct * 10) / 10,
      alertLevel: alert.level,
    };
  });

  const goalRows = getAllSavingsGoalAnalytics(transactions, goals).map((g) => ({
    title: g.title,
    targetAmount: g.targetAmount,
    savedAmount: g.savedAmount,
    remaining: g.remaining,
    progressPct: Math.round(g.progressPct * 10) / 10,
    requiredPerDay: Math.round(g.requiredPerDay * 100) / 100,
    pace: g.pace,
    daysLeft: g.daysLeft,
  }));

  return {
    currency: "PKR",
    monthKey,
    balance: Math.round(summary.balance * 100) / 100,
    income: Math.round(summary.income * 100) / 100,
    expense: Math.round(summary.expense * 100) / 100,
    topCategories,
    budgetsThisMonth,
    goals: goalRows,
    generatedAt: now.toISOString(),
  };
}
