import type { CategoryBudget, SavingsGoal, Transaction } from "../types";
import { createLocalId } from "../utils/id";
import { getDatabase } from "./client";
import {
  countBudgets,
  insertBudget,
  listBudgets,
} from "./budgetsRepo";
import { countGoals, insertGoal, listGoals } from "./goalsRepo";
import { runMigrations } from "./migrations";
import { buildSeedBudgets, buildSeedGoals, buildSeedTransactions } from "./seed";
import {
  countTransactions,
  insertTransaction,
  listTransactions,
} from "./transactionsRepo";

export type FinanceSnapshot = {
  transactions: Transaction[];
  goals: SavingsGoal[];
  budgets: CategoryBudget[];
};

function withMissingIds<T extends { id: string }>(
  rows: T[],
  prefix: "tx" | "goal" | "budget"
): T[] {
  return rows.map((r) => (r.id ? r : { ...r, id: createLocalId(prefix) }));
}

async function seedIfEmpty(): Promise<void> {
  const db = await getDatabase();
  const [txCount, goalCount, budgetCount] = await Promise.all([
    countTransactions(db),
    countGoals(db),
    countBudgets(db),
  ]);

  if (txCount > 0 || goalCount > 0 || budgetCount > 0) return;

  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const tx of buildSeedTransactions()) {
      await insertTransaction(txn, tx);
    }
    for (const goal of buildSeedGoals()) {
      await insertGoal(txn, goal);
    }
    for (const budget of buildSeedBudgets()) {
      await insertBudget(txn, budget);
    }
  });
}

/**
 * Initializes schema and returns canonical finance state from SQLite.
 * First install behavior: if all three core tables are empty, demo seed rows
 * are inserted exactly once.
 */
export async function initializeFinanceData(): Promise<FinanceSnapshot> {
  const db = await getDatabase();
  await runMigrations(db);
  await seedIfEmpty();

  const [transactions, goals, budgets] = await Promise.all([
    listTransactions(db),
    listGoals(db),
    listBudgets(db),
  ]);

  return {
    transactions: withMissingIds(transactions, "tx"),
    goals: withMissingIds(goals, "goal"),
    budgets: withMissingIds(budgets, "budget"),
  };
}
