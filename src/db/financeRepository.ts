import type { AppUser, Category, CategoryBudget, SavingsGoal, Transaction } from "../types";
import { getDatabase } from "./client";
import { listBudgets } from "./budgetsRepo";
import { countCategories, insertManyCategories, listCategoriesForUser } from "./categoriesRepo";
import { DEFAULT_CATEGORY_CATALOG } from "./defaultCategories";
import { listGoals } from "./goalsRepo";
import { reassignLegacyUserToActiveAccount } from "./legacyUserMigration";
import { runMigrations } from "./migrations";
import { listTransactions } from "./transactionsRepo";
import { ensureUserExists, getUserById } from "./usersRepo";
import { requireFinanceUserId } from "./userIdGuard";

export type FinanceSnapshot = {
  user: AppUser | null;
  categories: Category[];
  transactions: Transaction[];
  goals: SavingsGoal[];
  budgets: CategoryBudget[];
};

export type LoadFinanceSnapshotOptions = {
  /** Used only when inserting a new `users` row (first session). */
  displayName?: string | null;
};

/**
 * Open DB, migrate, scope to Clerk `userId`, ensure `users` row, load all finance entities.
 */
export async function loadFinanceSnapshot(
  userId: string,
  options?: LoadFinanceSnapshotOptions
): Promise<FinanceSnapshot> {
  const uid = requireFinanceUserId(userId);
  const db = await getDatabase();
  await runMigrations(db);
  await reassignLegacyUserToActiveAccount(db, uid);
  await ensureUserExists(db, {
    id: uid,
    name: options?.displayName?.trim() || undefined,
  });
  // First session per user: seed starter categories only if they have none.
  const categoryCount = await countCategories(db, uid);
  if (categoryCount === 0) {
    await insertManyCategories(db, DEFAULT_CATEGORY_CATALOG, uid);
  }

  const [user, categories, transactions, goals, budgets] = await Promise.all([
    getUserById(db, uid),
    listCategoriesForUser(db, uid),
    listTransactions(db, uid),
    listGoals(db, uid),
    listBudgets(db, uid),
  ]);
  return { user, categories, transactions, goals, budgets };
}
