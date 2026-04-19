import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { SavingsGoal, Transaction } from "../types";
import { getAllSavingsGoalAnalytics } from "./savingsGoalService";
import {
  ensureNotificationPermission,
  initBudgetNotifications,
} from "./budgetNotificationService";

const GOAL_DEDUPE_PREFIX = "goalNotif";
const GOAL_CHANNEL_ID = "goal-milestones";
const GOAL_NEAR_MILESTONES = [80, 90] as const;

let goalChannelInitialized = false;

function milestoneKey(goalId: string, milestone: number): string {
  return `${GOAL_DEDUPE_PREFIX}:${goalId}:${milestone}`;
}

function completedKey(goalId: string): string {
  return `${GOAL_DEDUPE_PREFIX}:${goalId}:completed`;
}

async function initGoalNotificationChannel(): Promise<void> {
  await initBudgetNotifications();
  if (goalChannelInitialized) return;
  goalChannelInitialized = true;

  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync(GOAL_CHANNEL_ID, {
      name: "Goal milestones",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: "#0F172A",
      vibrationPattern: [0, 250, 250, 250],
    });
  } catch {
    // Ignore setup failures in unsupported environments.
  }
}

/** Configure goal milestone channel (Android) and shared notification handler. */
export async function initGoalNotifications(): Promise<void> {
  await initGoalNotificationChannel();
}

async function scheduleGoalNotification(
  title: string,
  body: string,
  data: Record<string, string | number>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { kind: "goal-milestone", ...data } },
    trigger: Platform.OS === "android" ? { channelId: GOAL_CHANNEL_ID } : null,
  });
}

/**
 * Evaluate active savings goals and notify once per threshold:
 * - 80% / 90% ("near goal")
 * - completed (100%)
 */
export async function maybeNotifyGoalMilestones(
  transactions: Transaction[],
  goals: SavingsGoal[],
  options: { enabled: boolean } = { enabled: true }
): Promise<void> {
  if (!options.enabled) return;

  const activeGoals = goals.filter((g) => g.status === "active");
  if (activeGoals.length === 0) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  await initGoalNotificationChannel();
  const analytics = getAllSavingsGoalAnalytics(transactions, goals);

  for (const item of analytics) {
    try {
      if (item.progressPct >= 100 || item.pace === "completed") {
        const doneKey = completedKey(item.goalId);
        const doneSent = await AsyncStorage.getItem(doneKey);
        if (!doneSent) {
          await scheduleGoalNotification(
            "Goal reached",
            `You reached “${item.title}”. Great momentum — keep going!`,
            { goalId: item.goalId, level: "completed" }
          );
          await AsyncStorage.setItem(doneKey, new Date().toISOString());
        }
        continue;
      }

      for (const milestone of GOAL_NEAR_MILESTONES) {
        if (item.progressPct < milestone) continue;
        const key = milestoneKey(item.goalId, milestone);
        const sent = await AsyncStorage.getItem(key);
        if (sent) continue;

        await scheduleGoalNotification(
          "Goal progress",
          `“${item.title}” is ${Math.round(item.progressPct)}% complete. Keep going!`,
          { goalId: item.goalId, level: String(milestone) }
        );
        await AsyncStorage.setItem(key, new Date().toISOString());
      }
    } catch {
      // Best-effort: never interrupt app flow for notification failures.
    }
  }
}
