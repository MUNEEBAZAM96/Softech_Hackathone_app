import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { loadFinanceSnapshot, type FinanceSnapshot } from "../db/financeRepository";
import type { Category, CategoryBudget, SavingsGoal, Transaction } from "../types";

export type FinanceDataContextValue = FinanceSnapshot & {
  ready: boolean;
  refresh: () => Promise<void>;
  error: string | null;
};

const empty: FinanceSnapshot = {
  user: null,
  categories: [],
  transactions: [],
  goals: [],
  budgets: [],
};

const FinanceDataContext = createContext<FinanceDataContextValue | null>(null);

export function FinanceDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<FinanceSnapshot>(empty);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const next = await loadFinanceSnapshot();
      setData(next);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load local finance data."
      );
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<FinanceDataContextValue>(
    () => ({ ...data, ready, refresh, error }),
    [data, ready, refresh, error]
  );

  return (
    <FinanceDataContext.Provider value={value}>
      {children}
    </FinanceDataContext.Provider>
  );
}

export function useFinanceData(): FinanceDataContextValue {
  const v = useContext(FinanceDataContext);
  if (!v) {
    throw new Error("useFinanceData must be used within FinanceDataProvider");
  }
  return v;
}

export function useOptionalFinanceData(): FinanceDataContextValue | null {
  return useContext(FinanceDataContext);
}

/** Re-export for screens that need types only. */
export type { Category, CategoryBudget, SavingsGoal, Transaction };
