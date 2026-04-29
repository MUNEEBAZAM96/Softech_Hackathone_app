/**
 * @deprecated Use `loadFinanceSnapshot(userId, options?)` from `financeRepository` or `useFinanceData()`.
 * Kept for any legacy imports; aliases the canonical loader.
 */
export { loadFinanceSnapshot as initializeFinanceData } from "./financeRepository";
export type { FinanceSnapshot } from "./financeRepository";
