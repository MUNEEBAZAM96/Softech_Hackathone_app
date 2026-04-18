import { atom } from "jotai";
import type {
  BudgetAlertPreferences,
  Category,
  CategoryBudget,
  SavingsGoal,
  Transaction,
} from "./types";

const today = new Date();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const seedTransactions: Transaction[] = [
  {
    id: "t1",
    kind: "income",
    amount: 75000,
    categoryId: "salary",
    note: "Monthly salary",
    date: daysAgo(2),
    createdAt: daysAgo(2),
  },
  {
    id: "t2",
    kind: "expense",
    amount: 1250,
    categoryId: "food",
    note: "Groceries",
    date: daysAgo(1),
    createdAt: daysAgo(1),
  },
  {
    id: "t3",
    kind: "expense",
    amount: 800,
    categoryId: "transport",
    note: "Fuel",
    date: daysAgo(1),
    createdAt: daysAgo(1),
  },
  {
    id: "t4",
    kind: "expense",
    amount: 2499,
    categoryId: "shopping",
    note: "New headphones",
    date: daysAgo(3),
    createdAt: daysAgo(3),
  },
  {
    id: "t5",
    kind: "income",
    amount: 12000,
    categoryId: "freelance",
    note: "Design gig",
    date: daysAgo(5),
    createdAt: daysAgo(5),
  },
  {
    id: "t6",
    kind: "expense",
    amount: 3200,
    categoryId: "bills",
    note: "Electricity",
    date: daysAgo(6),
    createdAt: daysAgo(6),
  },
];

export const transactionsAtom = atom<Transaction[]>(seedTransactions);

export const selectedCategoryAtom = atom<Category | null>(null);

const goalDeadline = new Date(today);
goalDeadline.setMonth(goalDeadline.getMonth() + 4);

const seedSavingsGoals: SavingsGoal[] = [
  {
    id: "g1",
    title: "Emergency fund",
    targetAmount: 150_000,
    deadline: goalDeadline.toISOString(),
    startingAmount: 5_000,
    monthlyContributionGoal: 8_000,
    createdAt: daysAgo(45),
    status: "active",
  },
];

const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

const seedBudgets: CategoryBudget[] = [
  {
    id: "b1",
    categoryId: "food",
    monthKey: currentMonthKey,
    limitAmount: 1_500,
    createdAt: daysAgo(10),
  },
  {
    id: "b2",
    categoryId: "shopping",
    monthKey: currentMonthKey,
    limitAmount: 5_000,
    createdAt: daysAgo(10),
  },
];

/** Local-first savings goals. */
export const savingsGoalsAtom = atom<SavingsGoal[]>(seedSavingsGoals);

/** Monthly category spend caps. */
export const categoryBudgetsAtom = atom<CategoryBudget[]>(seedBudgets);

/** Dismissed budget alert ids (from `BudgetAlertItem.id`). */
export const dismissedBudgetAlertIdsAtom = atom<Record<string, true>>({});

export const budgetAlertPreferencesAtom = atom<BudgetAlertPreferences>({
  showEarlyWarningAt70: true,
});
