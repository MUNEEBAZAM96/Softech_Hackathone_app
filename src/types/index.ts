export type TransactionKind = "income" | "expense";

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: TransactionKind;
};

export type Transaction = {
  id: string;
  kind: TransactionKind;
  amount: number;
  categoryId: string;
  note?: string;
  date: string;
  createdAt: string;
};

export type FinancialSummary = {
  balance: number;
  income: number;
  expense: number;
  byCategory: Array<{
    categoryId: string;
    total: number;
    percent: number;
  }>;
};

export type Insight = {
  id: string;
  title: string;
  description: string;
  sentiment: "positive" | "neutral" | "warning";
};
