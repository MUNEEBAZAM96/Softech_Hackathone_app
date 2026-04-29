import type { SQLiteDatabase } from "expo-sqlite";

import type { CategoryBudget } from "../types";
import { requireFinanceUserId } from "./userIdGuard";

type BudgetRow = {
  id: string;
  category_id: string | null;
  month_key: string;
  limit_amount: number;
  created_at: string;
  updated_at: string;
};

function mapBudgetRow(row: BudgetRow): CategoryBudget {
  return {
    id: row.id,
    categoryId: row.category_id ?? "",
    monthKey: row.month_key,
    limitAmount: Number(row.limit_amount),
    createdAt: row.created_at,
  };
}

export async function listBudgets(
  db: SQLiteDatabase,
  userId: string
): Promise<CategoryBudget[]> {
  const uid = requireFinanceUserId(userId);
  const rows = await db.getAllAsync<BudgetRow>(
    `SELECT id, category_id, month_key, limit_amount, created_at, updated_at
     FROM budgets
     WHERE user_id = ?
     ORDER BY month_key DESC, created_at DESC`,
    [uid]
  );
  return rows
    .filter((r) => r.category_id != null)
    .map(mapBudgetRow);
}

export async function insertBudget(
  db: SQLiteDatabase,
  budget: CategoryBudget,
  userId: string
): Promise<void> {
  const uid = requireFinanceUserId(userId);
  const updatedAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO budgets
      (id, user_id, category_id, month_key, limit_amount, spent_amount_cache, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
    [
      budget.id,
      uid,
      budget.categoryId,
      budget.monthKey,
      budget.limitAmount,
      budget.createdAt,
      updatedAt,
    ]
  );
}

export async function updateBudget(
  db: SQLiteDatabase,
  budget: CategoryBudget,
  userId: string
): Promise<void> {
  const uid = requireFinanceUserId(userId);
  const updatedAt = new Date().toISOString();
  await db.runAsync(
    `UPDATE budgets
     SET category_id = ?, month_key = ?, limit_amount = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [
      budget.categoryId,
      budget.monthKey,
      budget.limitAmount,
      updatedAt,
      budget.id,
      uid,
    ]
  );
}

export async function deleteBudgetById(
  db: SQLiteDatabase,
  id: string,
  userId: string
): Promise<void> {
  const uid = requireFinanceUserId(userId);
  await db.runAsync("DELETE FROM budgets WHERE id = ? AND user_id = ?", [
    id,
    uid,
  ]);
}

export async function countBudgets(
  db: SQLiteDatabase,
  userId: string
): Promise<number> {
  const uid = requireFinanceUserId(userId);
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(1) as c FROM budgets WHERE user_id = ?",
    [uid]
  );
  return Number(row?.c ?? 0);
}
