import { getCategoryById } from "../constants/categories";
import type { FinancialSummary, Insight, Transaction } from "../types";
import { summarize } from "./transactionService";

/**
 * Local rule-based insight generator. Swap this out later with a call to
 * Gemini (or any other LLM) — the UI only needs an array of Insight objects.
 */
export const generateInsights = (transactions: Transaction[]): Insight[] => {
  const summary: FinancialSummary = summarize(transactions);
  const insights: Insight[] = [];

  if (summary.balance < 0) {
    insights.push({
      id: "balance-negative",
      title: "You're spending more than you earn",
      description:
        "Your expenses have exceeded your income this period. Consider cutting back on non-essential categories.",
      sentiment: "warning",
    });
  } else if (summary.income > 0) {
    const savingsRate = (summary.balance / summary.income) * 100;
    if (savingsRate >= 30) {
      insights.push({
        id: "savings-strong",
        title: "Great savings rate",
        description: `You're saving about ${Math.round(savingsRate)}% of your income. Keep it up!`,
        sentiment: "positive",
      });
    } else if (savingsRate > 0) {
      insights.push({
        id: "savings-low",
        title: "Savings could be higher",
        description: `You're saving only ${Math.round(savingsRate)}% of your income. Aim for 20%+.`,
        sentiment: "neutral",
      });
    }
  }

  const top = summary.byCategory[0];
  if (top) {
    const category = getCategoryById(top.categoryId);
    if (category) {
      insights.push({
        id: `top-${category.id}`,
        title: `Top spending: ${category.name}`,
        description: `${top.percent}% of your expenses went to ${category.name.toLowerCase()}. Review whether this aligns with your goals.`,
        sentiment: top.percent > 40 ? "warning" : "neutral",
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: "empty",
      title: "Add a few transactions to get started",
      description:
        "Once you log some income and expenses, BudgetIQ will highlight trends and suggest where you can save.",
      sentiment: "neutral",
    });
  }

  return insights;
};
