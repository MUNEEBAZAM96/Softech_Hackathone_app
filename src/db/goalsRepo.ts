import type { SQLiteDatabase } from "expo-sqlite";

import type { SavingsGoal } from "../types";
import { requireFinanceUserId } from "./userIdGuard";

type GoalRow = {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  due_date: string | null;
  starting_amount: number | null;
  monthly_contribution_goal: number | null;
  created_at: string;
  updated_at: string;
  status: SavingsGoal["status"];
};

function mapGoalRow(row: GoalRow): SavingsGoal {
  return {
    id: row.id,
    title: row.title,
    targetAmount: Number(row.target_amount),
    deadline:
      row.due_date && row.due_date.length > 0
        ? row.due_date
        : row.created_at,
    startingAmount:
      row.starting_amount == null ? undefined : Number(row.starting_amount),
    monthlyContributionGoal:
      row.monthly_contribution_goal == null
        ? undefined
        : Number(row.monthly_contribution_goal),
    createdAt: row.created_at,
    status: row.status,
  };
}

export async function listGoals(
  db: SQLiteDatabase,
  userId: string
): Promise<SavingsGoal[]> {
  const uid = requireFinanceUserId(userId);
  const rows = await db.getAllAsync<GoalRow>(
    `SELECT id, title, target_amount, current_amount, due_date, starting_amount, monthly_contribution_goal, created_at, updated_at, status
     FROM goals
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [uid]
  );
  return rows.map(mapGoalRow);
}

function goalToRow(goal: SavingsGoal) {
  return {
    id: goal.id,
    title: goal.title,
    targetAmount: goal.targetAmount,
    currentAmount: 0,
    dueDate: goal.deadline,
    startingAmount: goal.startingAmount ?? null,
    monthly: goal.monthlyContributionGoal ?? null,
    status: goal.status,
    createdAt: goal.createdAt,
  };
}

export async function insertGoal(
  db: SQLiteDatabase,
  goal: SavingsGoal,
  userId: string
): Promise<void> {
  const uid = requireFinanceUserId(userId);
  const g = goalToRow(goal);
  const updatedAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO goals
      (id, user_id, title, target_amount, current_amount, due_date, starting_amount, monthly_contribution_goal, created_at, updated_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      g.id,
      uid,
      g.title,
      g.targetAmount,
      g.currentAmount,
      g.dueDate,
      g.startingAmount,
      g.monthly,
      g.createdAt,
      updatedAt,
      g.status,
    ]
  );
}

export async function updateGoal(
  db: SQLiteDatabase,
  goal: SavingsGoal,
  userId: string
): Promise<void> {
  const uid = requireFinanceUserId(userId);
  const updatedAt = new Date().toISOString();
  await db.runAsync(
    `UPDATE goals
     SET title = ?, target_amount = ?, due_date = ?, starting_amount = ?, monthly_contribution_goal = ?, status = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [
      goal.title,
      goal.targetAmount,
      goal.deadline,
      goal.startingAmount ?? null,
      goal.monthlyContributionGoal ?? null,
      goal.status,
      updatedAt,
      goal.id,
      uid,
    ]
  );
}

export async function deleteGoalById(
  db: SQLiteDatabase,
  id: string,
  userId: string
): Promise<void> {
  const uid = requireFinanceUserId(userId);
  await db.runAsync("DELETE FROM goals WHERE id = ? AND user_id = ?", [
    id,
    uid,
  ]);
}

export async function countGoals(
  db: SQLiteDatabase,
  userId: string
): Promise<number> {
  const uid = requireFinanceUserId(userId);
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(1) as c FROM goals WHERE user_id = ?",
    [uid]
  );
  return Number(row?.c ?? 0);
}
