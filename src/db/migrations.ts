import type { SQLiteDatabase } from "expo-sqlite";

const DB_VERSION = 1;

type UserVersionRow = {
  user_version: number;
};

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<UserVersionRow>("PRAGMA user_version");
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= DB_VERSION) return;

  await db.withExclusiveTransactionAsync(async (txn) => {
    if (currentVersion < 1) {
      await txn.execAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY NOT NULL,
          kind TEXT NOT NULL CHECK(kind IN ('income','expense')),
          amount REAL NOT NULL,
          category_id TEXT NOT NULL,
          note TEXT,
          date TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS savings_goals (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          target_amount REAL NOT NULL,
          deadline TEXT NOT NULL,
          starting_amount REAL,
          monthly_contribution_goal REAL,
          created_at TEXT NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('active','completed','archived'))
        );

        CREATE TABLE IF NOT EXISTS category_budgets (
          id TEXT PRIMARY KEY NOT NULL,
          category_id TEXT NOT NULL,
          month_key TEXT NOT NULL,
          limit_amount REAL NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_date
          ON transactions(date DESC);
        CREATE INDEX IF NOT EXISTS idx_category_budgets_month
          ON category_budgets(month_key);
        CREATE INDEX IF NOT EXISTS idx_category_budgets_month_category
          ON category_budgets(month_key, category_id);
      `);
    }

    await txn.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
  });
}
