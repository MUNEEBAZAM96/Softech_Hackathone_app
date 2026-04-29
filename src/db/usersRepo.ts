import type { SQLiteDatabase } from "expo-sqlite";

import type { AppUser } from "../types";
import { requireFinanceUserId } from "./userIdGuard";

type UserRow = {
  id: string;
  name: string;
  currency: string;
  created_at: string;
  updated_at: string;
};

function mapUser(row: UserRow): AppUser {
  return {
    id: row.id,
    name: row.name,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Insert a `users` row if missing. Does not overwrite existing profile. */
export async function ensureUserExists(
  db: SQLiteDatabase,
  input: { id: string; name?: string; currency?: string }
): Promise<void> {
  const id = requireFinanceUserId(input.id);
  const existing = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM users WHERE id = ?",
    [id]
  );
  if (existing) return;

  const when = new Date().toISOString();
  const name = (input.name?.trim() || "Me").slice(0, 200);
  const currency = (input.currency?.trim() || "PKR").slice(0, 16);

  await db.runAsync(
    `INSERT INTO users (id, name, currency, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, name, currency, when, when]
  );
}

export async function getUserById(
  db: SQLiteDatabase,
  id: string
): Promise<AppUser | null> {
  const uid = requireFinanceUserId(id);
  const row = await db.getFirstAsync<UserRow>(
    "SELECT id, name, currency, created_at, updated_at FROM users WHERE id = ?",
    [uid]
  );
  return row ? mapUser(row) : null;
}

export async function updateUserProfile(
  db: SQLiteDatabase,
  id: string,
  input: { name?: string; currency?: string }
): Promise<void> {
  const uid = requireFinanceUserId(id);
  const when = new Date().toISOString();
  if (input.name != null) {
    await db.runAsync(
      "UPDATE users SET name = ?, updated_at = ? WHERE id = ?",
      [input.name, when, uid]
    );
  }
  if (input.currency != null) {
    await db.runAsync(
      "UPDATE users SET currency = ?, updated_at = ? WHERE id = ?",
      [input.currency, when, uid]
    );
  }
}
