import type { SQLiteDatabase } from "expo-sqlite";

import type { AppUser } from "../types";
import { LOCAL_USER_ID } from "./constants";

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

export async function getUserById(
  db: SQLiteDatabase,
  id: string = LOCAL_USER_ID
): Promise<AppUser | null> {
  const row = await db.getFirstAsync<UserRow>(
    "SELECT id, name, currency, created_at, updated_at FROM users WHERE id = ?",
    [id]
  );
  return row ? mapUser(row) : null;
}

export async function updateUserProfile(
  db: SQLiteDatabase,
  id: string,
  input: { name?: string; currency?: string }
): Promise<void> {
  const when = new Date().toISOString();
  if (input.name != null) {
    await db.runAsync(
      "UPDATE users SET name = ?, updated_at = ? WHERE id = ?",
      [input.name, when, id]
    );
  }
  if (input.currency != null) {
    await db.runAsync(
      "UPDATE users SET currency = ?, updated_at = ? WHERE id = ?",
      [input.currency, when, id]
    );
  }
}
