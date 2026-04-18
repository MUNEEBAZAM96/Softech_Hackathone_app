import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  parse,
  parseISO,
  startOfMonth,
} from "date-fns";

import type {
  BudgetAlertItem,
  BudgetAlertLevel,
  BudgetAlertPreferences,
  CategoryBudget,
} from "../types";
import type { Transaction } from "../types";

export function formatMonthKey(d: Date): string {
  return format(d, "yyyy-MM");
}

export function parseMonthKeyToStart(monthKey: string): Date {
  return startOfMonth(parse(monthKey, "yyyy-MM", new Date()));
}

/** Sum expenses for category in calendar month of `monthKey`. */
export function sumExpenseInMonthForCategory(
  transactions: Transaction[],
  monthKey: string,
  categoryId: string
): number {
  const anchor = parseMonthKeyToStart(monthKey);
  const start = startOfMonth(anchor);
  const end = endOfMonth(anchor);
  let sum = 0;
  for (const t of transactions) {
    if (t.kind !== "expense" || t.categoryId !== categoryId) continue;
    const d = parseISO(t.date);
    if (d >= start && d <= end) sum += t.amount;
  }
  return sum;
}

function daysElapsedInMonth(monthAnchor: Date, today: Date): number {
  const start = startOfMonth(monthAnchor);
  const end = endOfMonth(monthAnchor);
  if (today < start) return 0;
  const cap = today > end ? end : today;
  return Math.max(1, differenceInCalendarDays(cap, start) + 1);
}

function totalDaysInMonth(monthAnchor: Date): number {
  return eachDayOfInterval({
    start: startOfMonth(monthAnchor),
    end: endOfMonth(monthAnchor),
  }).length;
}

function fractionOfMonthRemaining(today: Date, monthAnchor: Date): number {
  const end = endOfMonth(monthAnchor);
  if (today > end) return 0;
  const total = totalDaysInMonth(monthAnchor);
  const rest = Math.max(0, differenceInCalendarDays(end, today));
  return total > 0 ? rest / total : 0;
}

function resolveAlertLevel(
  usagePct: number,
  prefs: BudgetAlertPreferences,
  monthAnchor: Date,
  today: Date
): BudgetAlertLevel {
  if (usagePct >= 100) return "exceeded";
  if (usagePct >= 80) return "warning";
  if (
    prefs.showEarlyWarningAt70 &&
    usagePct >= 70 &&
    fractionOfMonthRemaining(today, monthAnchor) >= 0.25
  ) {
    return "early";
  }
  return "safe";
}

function buildForecastMessage(
  categoryName: string,
  spent: number,
  limitAmount: number,
  monthAnchor: Date,
  today: Date
): string | undefined {
  const daysElapsed = daysElapsedInMonth(monthAnchor, today);
  const dim = totalDaysInMonth(monthAnchor);
  if (dim <= 0 || daysElapsed <= 0 || spent <= 0) return undefined;
  const pace = spent / daysElapsed;
  const projected = pace * dim;
  if (projected <= limitAmount * 1.02) return undefined;
  const overPct = Math.max(0, ((projected - limitAmount) / limitAmount) * 100);
  const rounded = Math.round(projected);
  return `At current pace, ${categoryName} may end at PKR ${rounded.toLocaleString("en-PK")} (${Math.round(overPct)}% over budget).`;
}

function buildMessage(
  categoryName: string,
  level: BudgetAlertLevel,
  usagePct: number,
  spent: number,
  limitAmount: number
): string {
  const pct = Math.round(usagePct);
  if (level === "exceeded") {
    const overPct = Math.max(0, usagePct - 100);
    const overAmt = Math.max(0, spent - limitAmount);
    return `You exceeded ${categoryName} budget by ${Math.round(overPct)}% (PKR ${Math.round(overAmt).toLocaleString("en-PK")}).`;
  }
  if (level === "warning") {
    return `${categoryName} budget ${pct}% used — slow down this week.`;
  }
  if (level === "early") {
    return `${categoryName} budget ${pct}% used — watch spending for the rest of the month.`;
  }
  return `${categoryName} budget ${pct}% used — you're in a safe range.`;
}

export type BudgetAlertContext = {
  getCategoryName: (categoryId: string) => string;
};

export function buildBudgetAlertItem(
  transactions: Transaction[],
  budget: CategoryBudget,
  prefs: BudgetAlertPreferences,
  ctx: BudgetAlertContext,
  now: Date = new Date()
): BudgetAlertItem {
  const spent = sumExpenseInMonthForCategory(
    transactions,
    budget.monthKey,
    budget.categoryId
  );
  const limitAmount = budget.limitAmount;
  const usagePct =
    limitAmount > 0 ? (spent / limitAmount) * 100 : spent > 0 ? 999 : 0;
  const monthAnchor = parseMonthKeyToStart(budget.monthKey);
  const level = resolveAlertLevel(usagePct, prefs, monthAnchor, now);
  const name = ctx.getCategoryName(budget.categoryId);
  const message = buildMessage(name, level, usagePct, spent, limitAmount);
  const forecastMessage = ["early", "warning", "exceeded"].includes(level)
    ? buildForecastMessage(name, spent, limitAmount, monthAnchor, now)
    : undefined;
  return {
    id: `budget-${budget.monthKey}-${budget.categoryId}`,
    categoryId: budget.categoryId,
    monthKey: budget.monthKey,
    level,
    message,
    forecastMessage,
    usagePct,
    spent,
    limitAmount,
    generatedAt: now.toISOString(),
  };
}

export function getBudgetAlertsForMonth(
  transactions: Transaction[],
  budgets: CategoryBudget[],
  prefs: BudgetAlertPreferences,
  ctx: BudgetAlertContext,
  monthKey: string,
  now: Date = new Date()
): BudgetAlertItem[] {
  return budgets
    .filter((b) => b.monthKey === monthKey)
    .map((b) => buildBudgetAlertItem(transactions, b, prefs, ctx, now))
    .sort((a, b) => b.usagePct - a.usagePct);
}

/** Dashboard: non-safe alerts (optionally exclude `early` via flag). */
export function filterDashboardBudgetAlerts(
  alerts: BudgetAlertItem[],
  options: { includeEarly: boolean }
): BudgetAlertItem[] {
  return alerts.filter((a) => {
    if (a.level === "safe") return false;
    if (a.level === "early" && !options.includeEarly) return false;
    return true;
  });
}
