import type { Category } from "../types";

export const categories: Category[] = [
  { id: "food", name: "Food & Dining", icon: "fast-food-outline", color: "#F97316", kind: "expense" },
  { id: "transport", name: "Transport", icon: "car-outline", color: "#0EA5E9", kind: "expense" },
  { id: "shopping", name: "Shopping", icon: "cart-outline", color: "#EC4899", kind: "expense" },
  { id: "bills", name: "Bills & Utilities", icon: "receipt-outline", color: "#8B5CF6", kind: "expense" },
  { id: "health", name: "Health", icon: "medkit-outline", color: "#EF4444", kind: "expense" },
  { id: "entertainment", name: "Entertainment", icon: "game-controller-outline", color: "#F59E0B", kind: "expense" },
  { id: "education", name: "Education", icon: "school-outline", color: "#14B8A6", kind: "expense" },
  { id: "other_expense", name: "Other Expense", icon: "ellipsis-horizontal-outline", color: "#64748B", kind: "expense" },

  { id: "salary", name: "Salary", icon: "briefcase-outline", color: "#10B981", kind: "income" },
  { id: "freelance", name: "Freelance", icon: "laptop-outline", color: "#22D3EE", kind: "income" },
  { id: "gift", name: "Gift", icon: "gift-outline", color: "#F472B6", kind: "income" },
  { id: "other_income", name: "Other Income", icon: "wallet-outline", color: "#84CC16", kind: "income" },
];

export const getCategoryById = (id: string): Category | undefined =>
  categories.find((c) => c.id === id);

export const getCategoriesByKind = (kind: "income" | "expense"): Category[] =>
  categories.filter((c) => c.kind === kind);
