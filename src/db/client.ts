import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

const DB_NAME = "budgetiq.db";

let dbPromise: Promise<SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await openDatabaseAsync(DB_NAME);
      await db.execAsync("PRAGMA foreign_keys = ON;");
      return db;
    })();
  }
  return dbPromise;
}
