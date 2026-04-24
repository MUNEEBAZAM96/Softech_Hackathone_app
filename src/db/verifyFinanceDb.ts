/**
 * Dev aid: import and run after app loads to log basic counts. Not used in production UI.
 * Example: in a useEffect, `if (__DEV__) void verifyFinanceDb();`
 */
import { getDatabase } from "./client";
import { countBudgets } from "./budgetsRepo";
import { countGoals } from "./goalsRepo";
import { countTransactions } from "./transactionsRepo";
import { runMigrations } from "./migrations";

export async function verifyFinanceDb(): Promise<{
  transactions: number;
  goals: number;
  budgets: number;
}> {
  const db = await getDatabase();
  await runMigrations(db);
  const [transactions, goals, budgets] = await Promise.all([
    countTransactions(db),
    countGoals(db),
    countBudgets(db),
  ]);
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[verifyFinanceDb]", { transactions, goals, budgets });
  }
  return { transactions, goals, budgets };
}
