import type { AppUser, Category, CategoryBudget, SavingsGoal, Transaction } from "../types";
import { getDatabase } from "./client";
import { listBudgets } from "./budgetsRepo";
import { listCategoriesForUser } from "./categoriesRepo";
import { listGoals } from "./goalsRepo";
import { runMigrations } from "./migrations";
import { listTransactions } from "./transactionsRepo";
import { getUserById } from "./usersRepo";

export type FinanceSnapshot = {
  user: AppUser | null;
  categories: Category[];
  transactions: Transaction[];
  goals: SavingsGoal[];
  budgets: CategoryBudget[];
};

/**
 * Open DB, run migrations, return all finance rows for the local user.
 * Source of truth for the app; UI reads via `useFinanceData()`.
 */
export async function loadFinanceSnapshot(): Promise<FinanceSnapshot> {
  const db = await getDatabase();
  await runMigrations(db);
  const [user, categories, transactions, goals, budgets] = await Promise.all([
    getUserById(db),
    listCategoriesForUser(db),
    listTransactions(db),
    listGoals(db),
    listBudgets(db),
  ]);
  return { user, categories, transactions, goals, budgets };
}
