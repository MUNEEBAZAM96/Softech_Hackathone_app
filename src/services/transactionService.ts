import type { FinancialSummary, Transaction } from "../types";

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
