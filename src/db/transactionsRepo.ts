import type { SQLiteDatabase } from "expo-sqlite";

import type { Transaction, TransactionKind } from "../types";

type TransactionRow = {
  id: string;
  kind: TransactionKind;
  amount: number;
  category_id: string;
  note: string | null;
  date: string;
  created_at: string;
};

function mapTransactionRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    kind: row.kind,
    amount: Number(row.amount),
    categoryId: row.category_id,
    note: row.note ?? undefined,
    date: row.date,
    createdAt: row.created_at,
  };
}

export async function listTransactions(db: SQLiteDatabase): Promise<Transaction[]> {
  const rows = await db.getAllAsync<TransactionRow>(
    "SELECT id, kind, amount, category_id, note, date, created_at FROM transactions ORDER BY date DESC"
  );
  return rows.map(mapTransactionRow);
}

export async function insertTransaction(
  db: SQLiteDatabase,
  tx: Transaction
): Promise<void> {
  await db.runAsync(
    `INSERT INTO transactions
      (id, kind, amount, category_id, note, date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      tx.id,
      tx.kind,
      tx.amount,
      tx.categoryId,
      tx.note ?? null,
      tx.date,
      tx.createdAt,
    ]
  );
}

export async function deleteTransactionById(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
}

export async function countTransactions(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM transactions"
  );
  return Number(row?.c ?? 0);
}
