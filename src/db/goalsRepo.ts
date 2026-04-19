import type { SQLiteDatabase } from "expo-sqlite";

import type { SavingsGoal } from "../types";

type GoalRow = {
  id: string;
  title: string;
  target_amount: number;
  deadline: string;
  starting_amount: number | null;
  monthly_contribution_goal: number | null;
  created_at: string;
  status: SavingsGoal["status"];
};

function mapGoalRow(row: GoalRow): SavingsGoal {
  return {
    id: row.id,
    title: row.title,
    targetAmount: Number(row.target_amount),
    deadline: row.deadline,
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

export async function listGoals(db: SQLiteDatabase): Promise<SavingsGoal[]> {
  const rows = await db.getAllAsync<GoalRow>(
    `SELECT id, title, target_amount, deadline, starting_amount, monthly_contribution_goal, created_at, status
     FROM savings_goals
     ORDER BY created_at DESC`
  );
  return rows.map(mapGoalRow);
}

export async function insertGoal(db: SQLiteDatabase, goal: SavingsGoal): Promise<void> {
  await db.runAsync(
    `INSERT INTO savings_goals
      (id, title, target_amount, deadline, starting_amount, monthly_contribution_goal, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      goal.id,
      goal.title,
      goal.targetAmount,
      goal.deadline,
      goal.startingAmount ?? null,
      goal.monthlyContributionGoal ?? null,
      goal.createdAt,
      goal.status,
    ]
  );
}

export async function updateGoal(db: SQLiteDatabase, goal: SavingsGoal): Promise<void> {
  await db.runAsync(
    `UPDATE savings_goals
      SET title = ?, target_amount = ?, deadline = ?, starting_amount = ?, monthly_contribution_goal = ?, status = ?
      WHERE id = ?`,
    [
      goal.title,
      goal.targetAmount,
      goal.deadline,
      goal.startingAmount ?? null,
      goal.monthlyContributionGoal ?? null,
      goal.status,
      goal.id,
    ]
  );
}

export async function deleteGoalById(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync("DELETE FROM savings_goals WHERE id = ?", [id]);
}

export async function countGoals(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM savings_goals"
  );
  return Number(row?.c ?? 0);
}
