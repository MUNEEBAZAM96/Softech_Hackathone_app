import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

const DB_NAME = "budgetiq.db";

let dbPromise: Promise<SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}
