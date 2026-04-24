import type { SQLiteDatabase } from "expo-sqlite";

import type { Transaction, TransactionKind } from "../types";
import { LOCAL_USER_ID } from "./constants";

type TransactionRow = {
  id: string;
  type: TransactionKind;
  amount: number;
  category_id: string;
  note: string | null;
  date: string;
  created_at: string;
  updated_at: string;
};

function mapTransactionRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    kind: row.type,
    amount: Number(row.amount),
    categoryId: row.category_id,
    note: row.note ?? undefined,
    date: row.date,
    createdAt: row.created_at,
  };
}

export async function listTransactions(
  db: SQLiteDatabase,
  userId: string = LOCAL_USER_ID
): Promise<Transaction[]> {
  const rows = await db.getAllAsync<TransactionRow>(
    `SELECT id, type, amount, category_id, note, date, created_at, updated_at
     FROM transactions
     WHERE user_id = ?
     ORDER BY date DESC`,
    [userId]
  );
  return rows.map(mapTransactionRow);
}

export async function insertTransaction(
  db: SQLiteDatabase,
  tx: Transaction,
  userId: string = LOCAL_USER_ID
): Promise<void> {
  const updatedAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO transactions
      (id, user_id, category_id, type, amount, note, date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tx.id,
      userId,
      tx.categoryId,
      tx.kind,
      tx.amount,
      tx.note ?? null,
      tx.date,
      tx.createdAt,
      updatedAt,
    ]
  );
}

export async function updateTransaction(
  db: SQLiteDatabase,
  tx: Transaction,
  userId: string = LOCAL_USER_ID
): Promise<void> {
  const updatedAt = new Date().toISOString();
  await db.runAsync(
    `UPDATE transactions
     SET category_id = ?, type = ?, amount = ?, note = ?, date = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [
      tx.categoryId,
      tx.kind,
      tx.amount,
      tx.note ?? null,
      tx.date,
      updatedAt,
      tx.id,
      userId,
    ]
  );
}

export async function deleteTransactionById(
  db: SQLiteDatabase,
  id: string,
  userId: string = LOCAL_USER_ID
): Promise<void> {
  await db.runAsync("DELETE FROM transactions WHERE id = ? AND user_id = ?", [
    id,
    userId,
  ]);
}

export async function countTransactions(
  db: SQLiteDatabase,
  userId: string = LOCAL_USER_ID
): Promise<number> {
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(1) as c FROM transactions WHERE user_id = ?",
    [userId]
  );
  return Number(row?.c ?? 0);
}
