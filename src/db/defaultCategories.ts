import type { Category } from "../types";

/**
 * One-time starter categories seeded per user when they have zero categories.
 * IDs are stable for idempotency and safe INSERT OR IGNORE behavior.
 */
export const DEFAULT_CATEGORY_CATALOG: Category[] = [
  // Expense
  { id: "seed-expense-food", name: "Food", kind: "expense", icon: "restaurant-outline", color: "#F97316" },
  { id: "seed-expense-groceries", name: "Groceries", kind: "expense", icon: "basket-outline", color: "#84CC16" },
  { id: "seed-expense-rent", name: "Rent", kind: "expense", icon: "home-outline", color: "#6366F1" },
  { id: "seed-expense-utilities", name: "Utilities", kind: "expense", icon: "flash-outline", color: "#F59E0B" },
  { id: "seed-expense-transport", name: "Transport", kind: "expense", icon: "bus-outline", color: "#0EA5E9" },
  { id: "seed-expense-fuel", name: "Fuel", kind: "expense", icon: "car-sport-outline", color: "#EF4444" },
  { id: "seed-expense-health", name: "Health", kind: "expense", icon: "medkit-outline", color: "#10B981" },
  { id: "seed-expense-insurance", name: "Insurance", kind: "expense", icon: "shield-checkmark-outline", color: "#14B8A6" },
  { id: "seed-expense-education", name: "Education", kind: "expense", icon: "school-outline", color: "#8B5CF6" },
  { id: "seed-expense-subscriptions", name: "Subscriptions", kind: "expense", icon: "repeat-outline", color: "#A855F7" },
  { id: "seed-expense-shopping", name: "Shopping", kind: "expense", icon: "cart-outline", color: "#EC4899" },
  { id: "seed-expense-entertainment", name: "Entertainment", kind: "expense", icon: "film-outline", color: "#06B6D4" },
  { id: "seed-expense-gifts", name: "Gifts", kind: "expense", icon: "gift-outline", color: "#F43F5E" },
  { id: "seed-expense-travel", name: "Travel", kind: "expense", icon: "airplane-outline", color: "#3B82F6" },
  { id: "seed-expense-savings-transfer", name: "Savings Transfer", kind: "expense", icon: "swap-horizontal-outline", color: "#22C55E" },
  { id: "seed-expense-taxes", name: "Taxes", kind: "expense", icon: "receipt-outline", color: "#B45309" },
  { id: "seed-expense-charity", name: "Charity", kind: "expense", icon: "heart-outline", color: "#E11D48" },
  { id: "seed-expense-miscellaneous", name: "Miscellaneous", kind: "expense", icon: "ellipsis-horizontal-circle-outline", color: "#64748B" },

  // Income
  { id: "seed-income-salary", name: "Salary", kind: "income", icon: "wallet-outline", color: "#10B981" },
  { id: "seed-income-freelance", name: "Freelance", kind: "income", icon: "laptop-outline", color: "#3B82F6" },
  { id: "seed-income-business", name: "Business", kind: "income", icon: "briefcase-outline", color: "#6366F1" },
  { id: "seed-income-bonus", name: "Bonus", kind: "income", icon: "ribbon-outline", color: "#22C55E" },
  { id: "seed-income-investment", name: "Investment", kind: "income", icon: "trending-up-outline", color: "#14B8A6" },
  { id: "seed-income-interest", name: "Interest", kind: "income", icon: "cash-outline", color: "#06B6D4" },
  { id: "seed-income-rental-income", name: "Rental Income", kind: "income", icon: "business-outline", color: "#0EA5E9" },
  { id: "seed-income-gift-received", name: "Gift Received", kind: "income", icon: "gift-outline", color: "#F59E0B" },
  { id: "seed-income-refund", name: "Refund", kind: "income", icon: "return-up-back-outline", color: "#8B5CF6" },
  { id: "seed-income-other-income", name: "Other Income", kind: "income", icon: "add-circle-outline", color: "#64748B" },
];
