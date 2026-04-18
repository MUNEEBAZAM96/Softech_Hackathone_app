import { endOfMonth, parseISO, startOfMonth, subMonths } from "date-fns";
import type { FinancialSummary, Transaction } from "../types";

/** Net cash flow for a calendar month (income − expenses). */
function netForMonth(transactions: Transaction[], monthAnchor: Date): number {
  const start = startOfMonth(monthAnchor);
  const end = endOfMonth(monthAnchor);
  return transactions.reduce((acc, t) => {
    const d = parseISO(t.date);
    if (d < start || d > end) return acc;
    return acc + (t.kind === "income" ? t.amount : -t.amount);
  }, 0);
}

export type MonthOverMonthResult = {
  currentMonthNet: number;
  previousMonthNet: number;
  /** null if not comparable (e.g. prior month was zero) */
  percentChangeVsPrevious: number | null;
};

export function getMonthOverMonthNet(
  transactions: Transaction[]
): MonthOverMonthResult {
  const now = new Date();
  const currentMonthNet = netForMonth(transactions, now);
  const previousMonthNet = netForMonth(transactions, subMonths(now, 1));

  let percentChangeVsPrevious: number | null = null;
  if (previousMonthNet !== 0) {
    percentChangeVsPrevious =
      ((currentMonthNet - previousMonthNet) / Math.abs(previousMonthNet)) *
      100;
  } else if (currentMonthNet !== 0 && previousMonthNet === 0) {
    percentChangeVsPrevious = null;
  }

  return {
    currentMonthNet,
    previousMonthNet,
    percentChangeVsPrevious,
  };
}

export const createTransactionId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const summarize = (transactions: Transaction[]): FinancialSummary => {
  const income = transactions
    .filter((t) => t.kind === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter((t) => t.kind === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalsByCategory = new Map<string, number>();
  transactions
    .filter((t) => t.kind === "expense")
    .forEach((t) => {
      totalsByCategory.set(
        t.categoryId,
        (totalsByCategory.get(t.categoryId) ?? 0) + t.amount
      );
    });

  const byCategory = Array.from(totalsByCategory.entries())
    .map(([categoryId, total]) => ({
      categoryId,
      total,
      percent: expense > 0 ? Math.round((total / expense) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    balance: income - expense,
    income,
    expense,
    byCategory,
  };
};

export const sortByDateDesc = (transactions: Transaction[]): Transaction[] =>
  [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
