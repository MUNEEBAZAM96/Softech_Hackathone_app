import { useAuth, useUser } from "@clerk/clerk-expo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  loadFinanceSnapshot,
  type FinanceSnapshot,
  type LoadFinanceSnapshotOptions,
} from "../db/financeRepository";
import type { Category, CategoryBudget, SavingsGoal, Transaction } from "../types";

export type FinanceDataContextValue = FinanceSnapshot & {
  /** Clerk user id; null while session not resolved. */
  userId: string | null;
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
  const { userId, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const [data, setData] = useState<FinanceSnapshot>(empty);
  const [snapshotReady, setSnapshotReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadGeneration = useRef(0);

  const displayName = useMemo(() => {
    const u = clerkUser;
    return (
      u?.fullName ||
      u?.username ||
      u?.primaryEmailAddress?.emailAddress ||
      undefined
    );
  }, [clerkUser]);

  const snapshotOptions = useMemo<LoadFinanceSnapshotOptions>(
    () => ({ displayName }),
    [displayName]
  );

  const runLoad = useCallback(
    async (uid: string, gen: number) => {
      try {
        setError(null);
        const next = await loadFinanceSnapshot(uid, snapshotOptions);
        if (gen !== loadGeneration.current) return;
        setData(next);
      } catch (e) {
        if (gen !== loadGeneration.current) return;
        setError(
          e instanceof Error ? e.message : "Could not load local finance data."
        );
        setData(empty);
      } finally {
        if (gen === loadGeneration.current) {
          setSnapshotReady(true);
        }
      }
    },
    [snapshotOptions]
  );

  const refresh = useCallback(async () => {
    if (!isLoaded || !userId) {
      return;
    }
    const gen = ++loadGeneration.current;
    setSnapshotReady(false);
    await runLoad(userId, gen);
  }, [isLoaded, userId, runLoad]);

  useEffect(() => {
    if (!isLoaded) {
      setData(empty);
      setError(null);
      setSnapshotReady(false);
      return;
    }

    if (!userId) {
      loadGeneration.current += 1;
      setData(empty);
      setError(null);
      setSnapshotReady(false);
      return;
    }

    const gen = ++loadGeneration.current;
    setData(empty);
    setSnapshotReady(false);
    setError(null);
    void runLoad(userId, gen);
  }, [isLoaded, userId, runLoad]);

  const ready = isLoaded && Boolean(userId) && snapshotReady;
  const value = useMemo<FinanceDataContextValue>(
    () => ({
      ...data,
      userId: isLoaded ? userId ?? null : null,
      ready,
      refresh,
      error,
    }),
    [data, ready, refresh, error, isLoaded, userId]
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
