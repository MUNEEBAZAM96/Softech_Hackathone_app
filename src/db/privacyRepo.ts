import type { SQLiteDatabase } from "expo-sqlite";

import { requireFinanceUserId } from "./userIdGuard";

/**
 * When `true`, call `wipeFinanceDataForUser` from your sign-out flow (e.g. Profile).
 * Default off so local data remains for the same device/account switch flows.
 */
export const WIPE_LOCAL_FINANCE_DATA_ON_SIGNOUT = false;

/** Remove all finance rows for one user (children before parent). */
export async function wipeFinanceDataForUser(
  db: SQLiteDatabase,
  userId: string
): Promise<void> {
  const uid = requireFinanceUserId(userId);
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync("DELETE FROM transactions WHERE user_id = ?", [uid]);
    await txn.runAsync("DELETE FROM goals WHERE user_id = ?", [uid]);
    await txn.runAsync("DELETE FROM budgets WHERE user_id = ?", [uid]);
    await txn.runAsync("DELETE FROM categories WHERE user_id = ?", [uid]);
    await txn.runAsync("DELETE FROM users WHERE id = ?", [uid]);
  });
}
