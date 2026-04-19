import type { SQLiteDatabase } from "expo-sqlite";

import type { CategoryBudget } from "../types";

type BudgetRow = {
  id: string;
  category_id: string;
  month_key: string;
  limit_amount: number;
  created_at: string;
};

function mapBudgetRow(row: BudgetRow): CategoryBudget {
  return {
    id: row.id,
    categoryId: row.category_id,
    monthKey: row.month_key,
    limitAmount: Number(row.limit_amount),
    createdAt: row.created_at,
  };
}

export async function listBudgets(db: SQLiteDatabase): Promise<CategoryBudget[]> {
  const rows = await db.getAllAsync<BudgetRow>(
    `SELECT id, category_id, month_key, limit_amount, created_at
     FROM category_budgets
     ORDER BY month_key DESC, created_at DESC`
  );
  return rows.map(mapBudgetRow);
}

export async function insertBudget(
  db: SQLiteDatabase,
  budget: CategoryBudget
): Promise<void> {
  await db.runAsync(
    `INSERT INTO category_budgets
      (id, category_id, month_key, limit_amount, created_at)
      VALUES (?, ?, ?, ?, ?)`,
    [
      budget.id,
      budget.categoryId,
      budget.monthKey,
      budget.limitAmount,
      budget.createdAt,
    ]
  );
}

export async function updateBudget(
  db: SQLiteDatabase,
  budget: CategoryBudget
): Promise<void> {
  await db.runAsync(
    `UPDATE category_budgets
      SET category_id = ?, month_key = ?, limit_amount = ?
      WHERE id = ?`,
    [budget.categoryId, budget.monthKey, budget.limitAmount, budget.id]
  );
}

export async function deleteBudgetById(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync("DELETE FROM category_budgets WHERE id = ?", [id]);
}

export async function countBudgets(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM category_budgets"
  );
  return Number(row?.c ?? 0);
}
