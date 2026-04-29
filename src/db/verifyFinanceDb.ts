/**
 * Dev aid: import and run after app loads to log basic counts. Not used in production UI.
 * Example: `if (__DEV__) void verifyFinanceDb(userId);`
 */
import { getDatabase } from "./client";
import { countBudgets } from "./budgetsRepo";
import { countGoals } from "./goalsRepo";
import { countTransactions } from "./transactionsRepo";
import { runMigrations } from "./migrations";
import { requireFinanceUserId } from "./userIdGuard";

export async function verifyFinanceDb(userId: string): Promise<{
  transactions: number;
  goals: number;
  budgets: number;
}> {
  const uid = requireFinanceUserId(userId);
  const db = await getDatabase();
  await runMigrations(db);
  const [transactions, goals, budgets] = await Promise.all([
    countTransactions(db, uid),
    countGoals(db, uid),
    countBudgets(db, uid),
  ]);
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[verifyFinanceDb]", { userId: uid, transactions, goals, budgets });
  }
  return { transactions, goals, budgets };
}
