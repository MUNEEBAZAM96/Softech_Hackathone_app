import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { getCategoryById } from "../constants/categories";
import type {
  BudgetAlertLevel,
  BudgetAlertPreferences,
  CategoryBudget,
  Transaction,
} from "../types";
import {
  buildBudgetAlertItem,
  formatMonthKey,
  type BudgetAlertContext,
} from "./budgetAlertService";

const NOTIFY_LEVELS: ReadonlyArray<BudgetAlertLevel> = ["warning", "exceeded"];
const DEDUPE_PREFIX = "budgetNotif";
const ANDROID_CHANNEL_ID = "budget-alerts";

let initialized = false;

function dedupeKey(
  monthKey: string,
  categoryId: string,
  level: BudgetAlertLevel
): string {
  return `${DEDUPE_PREFIX}:${monthKey}:${categoryId}:${level}`;
}

/** Configure foreground behavior + Android channel. Safe to call many times. */
export async function initBudgetNotifications(): Promise<void> {
  if (initialized) return;
  initialized = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: "Budget alerts",
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: "#0F172A",
        vibrationPattern: [0, 250, 250, 250],
      });
    } catch {
      // Channel registration can fail in unsupported environments (e.g. web); ignore.
    }
  }
}

/** Ask the OS for permission. Returns true iff notifications are currently allowed. */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (
      current.granted ||
      current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    ) {
      return true;
    }
    if (!current.canAskAgain && current.status === "denied") {
      return false;
    }
    const next = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
    });
    return (
      next.granted ||
      next.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

const ctx: BudgetAlertContext = {
  getCategoryName: (id) => getCategoryById(id)?.name ?? "Category",
};

/**
 * Evaluate current-month budgets and fire at most one local notification per
 * (month, category, level) tuple for warning/exceeded alerts.
 *
 * Must only be called after persistence of the change that might alter spend.
 * No-ops when the user preference is disabled.
 */
export async function maybeNotifyBudgetAlerts(
  transactions: Transaction[],
  budgets: CategoryBudget[],
  prefs: BudgetAlertPreferences,
  options: { enabled: boolean; now?: Date } = { enabled: true }
): Promise<void> {
  if (!options.enabled) return;

  const now = options.now ?? new Date();
  const monthKey = formatMonthKey(now);
  const monthBudgets = budgets.filter((b) => b.monthKey === monthKey);
  if (monthBudgets.length === 0) return;

  const candidates = monthBudgets
    .map((b) => buildBudgetAlertItem(transactions, b, prefs, ctx, now))
    .filter((a) => NOTIFY_LEVELS.includes(a.level));
  if (candidates.length === 0) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  await initBudgetNotifications();

  for (const alert of candidates) {
    const key = dedupeKey(alert.monthKey, alert.categoryId, alert.level);
    try {
      const existing = await AsyncStorage.getItem(key);
      if (existing) continue;

      const categoryName = ctx.getCategoryName(alert.categoryId);
      const title =
        alert.level === "exceeded"
          ? `${categoryName} budget exceeded`
          : `${categoryName} budget warning`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: alert.message,
          data: {
            kind: "budget-alert",
            monthKey: alert.monthKey,
            categoryId: alert.categoryId,
            level: alert.level,
          },
        },
        trigger:
          Platform.OS === "android"
            ? { channelId: ANDROID_CHANNEL_ID }
            : null,
      });

      await AsyncStorage.setItem(key, new Date().toISOString());
    } catch {
      // Best-effort: never break the calling flow because of a notification failure.
    }
  }
}

/**
 * Remove dedupe markers so the next evaluation may re-notify. Useful after a
 * user explicitly resets / edits a budget or for testing.
 */
export async function clearBudgetNotificationDedupe(opts?: {
  monthKey?: string;
  categoryId?: string;
}): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter((k) => {
      if (!k.startsWith(`${DEDUPE_PREFIX}:`)) return false;
      const [, month, category] = k.split(":");
      if (opts?.monthKey && month !== opts.monthKey) return false;
      if (opts?.categoryId && category !== opts.categoryId) return false;
      return true;
    });
    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
    }
  } catch {
    // ignore
  }
}
