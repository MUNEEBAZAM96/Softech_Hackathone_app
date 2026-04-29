import type { SQLiteDatabase } from "expo-sqlite";

import { LEGACY_LOCAL_USER_ID } from "./constants";
import { assertFinanceUserId } from "./userIdGuard";

/**
 * One-time: move rows from pre-Clerk `LEGACY_LOCAL_USER_ID` to the signed-in Clerk user.
 * Skips if there is no legacy user row, if the target user already exists, or if ids match.
 */
export async function reassignLegacyUserToActiveAccount(
  db: SQLiteDatabase,
  clerkUserId: string
): Promise<void> {
  assertFinanceUserId(clerkUserId);
  if (clerkUserId === LEGACY_LOCAL_USER_ID) return;

  const legacy = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM users WHERE id = ?",
    [LEGACY_LOCAL_USER_ID]
  );
  if (!legacy) return;

  const existingClerk = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM users WHERE id = ?",
    [clerkUserId]
  );
  if (existingClerk) return;

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      "UPDATE categories SET user_id = ? WHERE user_id = ?",
      [clerkUserId, LEGACY_LOCAL_USER_ID]
    );
    await txn.runAsync(
      "UPDATE transactions SET user_id = ? WHERE user_id = ?",
      [clerkUserId, LEGACY_LOCAL_USER_ID]
    );
    await txn.runAsync(
      "UPDATE goals SET user_id = ? WHERE user_id = ?",
      [clerkUserId, LEGACY_LOCAL_USER_ID]
    );
    await txn.runAsync(
      "UPDATE budgets SET user_id = ? WHERE user_id = ?",
      [clerkUserId, LEGACY_LOCAL_USER_ID]
    );
    await txn.runAsync("UPDATE users SET id = ? WHERE id = ?", [
      clerkUserId,
      LEGACY_LOCAL_USER_ID,
    ]);
  });
}
