import { summarize } from "../services/transactionService";
import type { Transaction, TransactionKind } from "../types";
import { getDatabase } from "./client";
import { runMigrations } from "./migrations";
import { listTransactions } from "./transactionsRepo";
import { requireFinanceUserId } from "./userIdGuard";

/** Net balance and monthly-style rollups (reuses in-app summarizer). */
export async function getTransactionSummaries(userId: string) {
  const uid = requireFinanceUserId(userId);
  const db = await getDatabase();
  await runMigrations(db);
  const list = await listTransactions(db, uid);
  return summarize(list);
}

export function totalByCategoryInMonth(
  transactions: Transaction[],
  monthKey: string,
  kind: TransactionKind
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of transactions) {
    if (t.kind !== kind) continue;
    const d = new Date(t.date);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (m !== monthKey) continue;
    out[t.categoryId] = (out[t.categoryId] ?? 0) + t.amount;
  }
  return out;
}
