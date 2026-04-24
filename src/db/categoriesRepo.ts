import type { SQLiteDatabase } from "expo-sqlite";

import type { Category, TransactionKind } from "../types";
import { LOCAL_USER_ID } from "./constants";

type CategoryRow = {
  id: string;
  user_id: string;
  name: string;
  type: TransactionKind;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    kind: row.type,
    icon: row.icon,
    color: row.color,
  };
}

export async function listCategoriesForUser(
  db: SQLiteDatabase,
  userId: string = LOCAL_USER_ID
): Promise<Category[]> {
  const rows = await db.getAllAsync<CategoryRow>(
    `SELECT id, user_id, name, type, icon, color, created_at, updated_at
     FROM categories
     WHERE user_id = ?
     ORDER BY type ASC, name ASC`,
    [userId]
  );
  return rows.map(mapRow);
}

export async function countCategories(
  db: SQLiteDatabase,
  userId: string = LOCAL_USER_ID
): Promise<number> {
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(1) as c FROM categories WHERE user_id = ?",
    [userId]
  );
  return Number(row?.c ?? 0);
}

export async function insertCategory(
  db: SQLiteDatabase,
  category: Category,
  userId: string = LOCAL_USER_ID
): Promise<void> {
  const when = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO categories
      (id, user_id, name, type, icon, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      category.id,
      userId,
      category.name,
      category.kind,
      category.icon,
      category.color,
      when,
      when,
    ]
  );
}
