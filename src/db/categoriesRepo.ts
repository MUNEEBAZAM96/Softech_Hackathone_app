import type { SQLiteDatabase } from "expo-sqlite";

import type { Category, TransactionKind } from "../types";
import { requireFinanceUserId } from "./userIdGuard";

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
  userId: string
): Promise<Category[]> {
  const uid = requireFinanceUserId(userId);
  const rows = await db.getAllAsync<CategoryRow>(
    `SELECT id, user_id, name, type, icon, color, created_at, updated_at
     FROM categories
     WHERE user_id = ?
     ORDER BY type ASC, name ASC`,
    [uid]
  );
  return rows.map(mapRow);
}

export async function countCategories(
  db: SQLiteDatabase,
  userId: string
): Promise<number> {
  const uid = requireFinanceUserId(userId);
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(1) as c FROM categories WHERE user_id = ?",
    [uid]
  );
  return Number(row?.c ?? 0);
}

export async function insertCategory(
  db: SQLiteDatabase,
  category: Category,
  userId: string
): Promise<void> {
  const uid = requireFinanceUserId(userId);
  const when = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO categories
      (id, user_id, name, type, icon, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      category.id,
      uid,
      category.name,
      category.kind,
      category.icon,
      category.color,
      when,
      when,
    ]
  );
}

export async function insertManyCategories(
  db: SQLiteDatabase,
  categories: Category[],
  userId: string
): Promise<void> {
  const uid = requireFinanceUserId(userId);
  const when = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const category of categories) {
      await txn.runAsync(
        `INSERT OR IGNORE INTO categories
          (id, user_id, name, type, icon, color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          category.id,
          uid,
          category.name,
          category.kind,
          category.icon,
          category.color,
          when,
          when,
        ]
      );
    }
  });
}

export async function categoryExistsByNameAndKind(
  db: SQLiteDatabase,
  name: string,
  kind: TransactionKind,
  userId: string
): Promise<boolean> {
  const uid = requireFinanceUserId(userId);
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(1) as c
     FROM categories
     WHERE user_id = ? AND type = ? AND LOWER(name) = LOWER(?)`,
    [uid, kind, name.trim()]
  );
  return Number(row?.c ?? 0) > 0;
}

export async function countCategoryUsage(
  db: SQLiteDatabase,
  categoryId: string,
  userId: string
): Promise<{ transactions: number; budgets: number }> {
  const uid = requireFinanceUserId(userId);
  const [txRow, budgetRow] = await Promise.all([
    db.getFirstAsync<{ c: number }>(
      "SELECT COUNT(1) as c FROM transactions WHERE user_id = ? AND category_id = ?",
      [uid, categoryId]
    ),
    db.getFirstAsync<{ c: number }>(
      "SELECT COUNT(1) as c FROM budgets WHERE user_id = ? AND category_id = ?",
      [uid, categoryId]
    ),
  ]);
  return {
    transactions: Number(txRow?.c ?? 0),
    budgets: Number(budgetRow?.c ?? 0),
  };
}

export async function deleteCategoryById(
  db: SQLiteDatabase,
  categoryId: string,
  userId: string
): Promise<void> {
  const uid = requireFinanceUserId(userId);
  await db.runAsync("DELETE FROM categories WHERE id = ? AND user_id = ?", [
    categoryId,
    uid,
  ]);
}
