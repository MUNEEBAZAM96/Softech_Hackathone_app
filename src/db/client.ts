import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

const DB_NAME = "budgetiq.db";

let dbPromise: Promise<SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await openDatabaseAsync(DB_NAME);
      await db.execAsync("PRAGMA foreign_keys = ON;");

      if (__DEV__) {
        try {
          const row = await db.getFirstAsync<{ integrity_check: string }>(
            "PRAGMA integrity_check;"
          );
          if (row?.integrity_check !== "ok") {
            // eslint-disable-next-line no-console
            console.warn(
              "[expo-sqlite] PRAGMA integrity_check:",
              row?.integrity_check
            );
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("[expo-sqlite] integrity_check failed:", e);
        }
      }

      return db;
    })();
  }
  return dbPromise;
}
