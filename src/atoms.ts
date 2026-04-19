import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  BudgetAlertPreferences,
  Category,
  CategoryBudget,
  CopilotMessage,
  SavingsGoal,
  ThemeMode,
  Transaction,
} from "./types";

export const transactionsAtom = atom<Transaction[]>([]);

export const selectedCategoryAtom = atom<Category | null>(null);

/** Local-first savings goals. */
export const savingsGoalsAtom = atom<SavingsGoal[]>([]);

/** Monthly category spend caps. */
export const categoryBudgetsAtom = atom<CategoryBudget[]>([]);

/** Becomes true when finance rows are hydrated from SQLite. */
export const financeHydratedAtom = atom(false);

/** Dismissed budget alert ids (from `BudgetAlertItem.id`). */
export const dismissedBudgetAlertIdsAtom = atom<Record<string, true>>({});

export const budgetAlertPreferencesAtom = atom<BudgetAlertPreferences>({
  showEarlyWarningAt70: true,
});

const budgetNotificationsStorage = createJSONStorage<boolean>(
  () => AsyncStorage
);

/** User toggle: push a local notification when a budget crosses warning/exceeded. */
export const budgetNotificationsEnabledAtom = atomWithStorage<boolean>(
  "budgetiq-budget-notifications-enabled",
  true,
  budgetNotificationsStorage
);

const goalNotificationsStorage = createJSONStorage<boolean>(() => AsyncStorage);

/** User toggle: push a local notification for savings-goal milestones. */
export const goalNotificationsEnabledAtom = atomWithStorage<boolean>(
  "budgetiq-goal-notifications-enabled",
  true,
  goalNotificationsStorage
);

const themeStorage = createJSONStorage<ThemeMode>(() => AsyncStorage);

/** User preference: `system` follows OS appearance. */
export const themeModeAtom = atomWithStorage<ThemeMode>(
  "budgetiq-theme-mode",
  "system",
  themeStorage
);

export const copilotMessagesAtom = atom<CopilotMessage[]>([]);

export const copilotIsTypingAtom = atom(false);

export const copilotErrorAtom = atom<string | null>(null);

/** Draft text for Insights Copilot input (not persisted). */
export const copilotInputDraftAtom = atom("");
