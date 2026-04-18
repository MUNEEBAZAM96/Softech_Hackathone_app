import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";

import type {
  GoalPaceKind,
  SavingsGoal,
  SavingsGoalAnalytics,
  Transaction,
} from "../types";
import { summarize } from "./transactionService";

/** Net “saved” pool: cumulative income − expense (same as summary balance). */
export function getNetSavedAmount(transactions: Transaction[]): number {
  return summarize(transactions).balance;
}

function activeGoals(goals: SavingsGoal[]): SavingsGoal[] {
  return goals.filter((g) => g.status === "active");
}

/**
 * Split net savings across active goals by target share.
 * Extensible: swap for manual allocation weights later.
 */
export function allocateNetToGoals(
  netSaved: number,
  goals: SavingsGoal[]
): Map<string, number> {
  const act = activeGoals(goals);
  const map = new Map<string, number>();
  if (act.length === 0 || netSaved <= 0) {
    for (const g of act) map.set(g.id, 0);
    return map;
  }
  const totalTarget = act.reduce((s, g) => s + g.targetAmount, 0);
  if (totalTarget <= 0) {
    for (const g of act) map.set(g.id, 0);
    return map;
  }
  let remaining = netSaved;
  for (let i = 0; i < act.length; i++) {
    const g = act[i]!;
    const weight = g.targetAmount / totalTarget;
    const share = i === act.length - 1 ? remaining : Math.round(netSaved * weight);
    const alloc = Math.min(share, remaining);
    map.set(g.id, alloc);
    remaining -= alloc;
  }
  return map;
}

function paceFromSchedule(
  goal: SavingsGoal,
  savedAmount: number,
  today: Date
): GoalPaceKind {
  const start = startOfDay(parseISO(goal.createdAt));
  const end = startOfDay(parseISO(goal.deadline));
  const t0 = startOfDay(today);
  const totalDays = Math.max(1, differenceInCalendarDays(end, start));
  const elapsed = Math.max(
    0,
    Math.min(totalDays, differenceInCalendarDays(t0, start))
  );
  const expected =
    goal.targetAmount > 0 ? (elapsed / totalDays) * goal.targetAmount : 0;
  if (expected <= 0) return savedAmount >= goal.targetAmount * 0.01 ? "on_track" : "behind";
  const ratio = savedAmount / expected;
  if (ratio >= 1.05) return "ahead";
  if (ratio >= 0.92) return "on_track";
  return "behind";
}

/**
 * Full analytics for one goal (net-based allocation + optional starting amount).
 */
export function getSavingsGoalAnalytics(
  transactions: Transaction[],
  goal: SavingsGoal,
  allGoals: SavingsGoal[]
): SavingsGoalAnalytics {
  const netSaved = Math.max(0, getNetSavedAmount(transactions));
  const allocMap = allocateNetToGoals(netSaved, allGoals);
  const share = allocMap.get(goal.id) ?? 0;
  const starting = goal.startingAmount ?? 0;
  const savedAmount = Math.min(
    goal.targetAmount,
    Math.max(0, share + starting)
  );
  const progressPct = Math.min(
    100,
    goal.targetAmount > 0 ? (savedAmount / goal.targetAmount) * 100 : 0
  );
  const remaining = Math.max(0, goal.targetAmount - savedAmount);
  const today = new Date();
  const end = startOfDay(parseISO(goal.deadline));
  const t0 = startOfDay(today);
  const daysLeft = Math.max(0, differenceInCalendarDays(end, t0));
  const requiredPerDay = remaining / Math.max(daysLeft, 1);
  let pace: GoalPaceKind =
    progressPct >= 100 ? "completed" : paceFromSchedule(goal, savedAmount, today);

  if (progressPct >= 100) pace = "completed";

  return {
    goalId: goal.id,
    title: goal.title,
    targetAmount: goal.targetAmount,
    savedAmount,
    progressPct,
    remaining,
    daysLeft,
    requiredPerDay,
    pace,
    deadline: goal.deadline,
  };
}

export function getAllSavingsGoalAnalytics(
  transactions: Transaction[],
  goals: SavingsGoal[]
): SavingsGoalAnalytics[] {
  return goals
    .filter((g) => g.status === "active")
    .map((g) => getSavingsGoalAnalytics(transactions, g, goals));
}

/** Primary card: first **active** goal by soonest deadline. */
export function getPrimaryGoalForDashboard(
  goals: SavingsGoal[]
): SavingsGoal | null {
  const act = activeGoals(goals);
  if (act.length === 0) return null;
  return [...act].sort(
    (a, b) =>
      parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime()
  )[0] ?? null;
}
