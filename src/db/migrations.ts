import type { SQLiteDatabase } from "expo-sqlite";

import { LEGACY_LOCAL_USER_ID } from "./constants";

/** After v1→v2 migration body completes. */
const SCHEMA_VERSION_V2 = 2;
const DB_VERSION = 3;

type UserVersionRow = {
  user_version: number;
};

type TableInfo = {
  name: string;
  type: string;
};

function createSchemaV2Sql(): string {
  return `
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL DEFAULT 'Me',
      currency TEXT NOT NULL DEFAULT 'PKR',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_categories_user
      ON categories (user_id);

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount REAL NOT NULL CHECK (amount > 0),
      note TEXT,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_tx_user_date
      ON transactions (user_id, date);
    CREATE INDEX IF NOT EXISTS idx_tx_category
      ON transactions (category_id);

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL DEFAULT 0,
      due_date TEXT,
      starting_amount REAL,
      monthly_contribution_goal REAL,
      status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'archived')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_goals_user_status
      ON goals (user_id, status);

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      category_id TEXT,
      month_key TEXT NOT NULL,
      limit_amount REAL NOT NULL,
      spent_amount_cache REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_budgets_user_month
      ON budgets (user_id, month_key);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_unique_user_month_category
      ON budgets (user_id, month_key, IFNULL(category_id, ''));
  `;
}

export async function tableExists(
  db: SQLiteDatabase,
  name: string
): Promise<boolean> {
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(1) as c FROM sqlite_master WHERE type = 'table' AND name = ?",
    [name]
  );
  return Number(row?.c ?? 0) > 0;
}

async function columnNames(
  db: SQLiteDatabase,
  table: string
): Promise<Set<string>> {
  const info = await db.getAllAsync<TableInfo>(`PRAGMA table_info(${table})`);
  return new Set(info.map((c) => c.name));
}

async function insertLocalUser(
  db: SQLiteDatabase,
  when: string
): Promise<void> {
  await db.runAsync(
    `INSERT OR IGNORE INTO users (id, name, currency, created_at, updated_at)
     VALUES (?, 'Me', 'PKR', ?, ?)`,
    [LEGACY_LOCAL_USER_ID, when, when]
  );
}

async function ensureOrphanCategories(
  db: SQLiteDatabase,
  when: string
): Promise<void> {
  if (!(await tableExists(db, "transactions"))) return;

  const rows = (await tableExists(db, "category_budgets"))
    ? await db.getAllAsync<{ category_id: string }>(
        `SELECT DISTINCT category_id as category_id FROM transactions
         WHERE category_id IS NOT NULL
         UNION
         SELECT DISTINCT category_id as category_id FROM category_budgets
         WHERE category_id IS NOT NULL`
      )
    : await db.getAllAsync<{ category_id: string }>(
        "SELECT DISTINCT category_id as category_id FROM transactions WHERE category_id IS NOT NULL"
      );

  for (const r of rows) {
    const existing = await db.getFirstAsync<{ c: number }>(
      "SELECT COUNT(1) as c FROM categories WHERE id = ?",
      [r.category_id]
    );
    if (Number(existing?.c ?? 0) > 0) continue;
    await db.runAsync(
      `INSERT OR IGNORE INTO categories
        (id, user_id, name, type, icon, color, created_at, updated_at)
       VALUES (?, ?, ?, 'expense', 'ellipsis-horizontal-outline', '#64748B', ?, ?)`,
      [r.category_id, LEGACY_LOCAL_USER_ID, `Category ${r.category_id}`, when, when]
    );
  }
}

/**
 * v1: tables `transactions`, `savings_goals`, `category_budgets` without `users` / `categories`.
 */
async function migrateV1toV2(db: SQLiteDatabase): Promise<void> {
  const when = new Date().toISOString();
  const txCol = (await tableExists(db, "transactions"))
    ? await columnNames(db, "transactions")
    : new Set<string>();
  if (txCol.has("user_id") && (await tableExists(db, "users"))) {
    const row = await db.getFirstAsync<UserVersionRow>("PRAGMA user_version");
    const uv = row?.user_version ?? 0;
    if (uv < SCHEMA_VERSION_V2) {
      await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION_V2};`);
    }
    return;
  }

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync("PRAGMA foreign_keys = ON;");
    await txn.execAsync(
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL DEFAULT 'Me',
        currency TEXT NOT NULL DEFAULT 'PKR',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );`
    );
    await insertLocalUser(txn, when);
    await ensureOrphanCategories(txn, when);

    const hasTx = await tableExists(
      txn as unknown as SQLiteDatabase,
      "transactions"
    );
    if (hasTx) {
      const legacyCols = await columnNames(
        txn as unknown as SQLiteDatabase,
        "transactions"
      );
      if (!legacyCols.has("user_id")) {
        const kindOrType = legacyCols.has("kind")
          ? "kind"
          : legacyCols.has("type")
            ? "type"
            : "type";
        await txn.execAsync(
          `CREATE TABLE transactions_v2 (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL,
            category_id TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
            amount REAL NOT NULL CHECK (amount > 0),
            note TEXT,
            date TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT
          );
          INSERT INTO transactions_v2
            (id, user_id, category_id, type, amount, note, date, created_at, updated_at)
          SELECT
            id, '${LEGACY_LOCAL_USER_ID}', category_id, ${kindOrType},
            amount, note, date, created_at, created_at
          FROM transactions;
          DROP TABLE transactions;
          ALTER TABLE transactions_v2 RENAME TO transactions;`
        );
        await txn.execAsync(
          `CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions (user_id, date);
           CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions (category_id);`
        );
      }
    }

    if (await tableExists(txn as unknown as SQLiteDatabase, "savings_goals")) {
      if (!(await tableExists(txn as unknown as SQLiteDatabase, "goals"))) {
        await txn.execAsync(
          `CREATE TABLE goals (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            target_amount REAL NOT NULL,
            current_amount REAL NOT NULL DEFAULT 0,
            due_date TEXT,
            starting_amount REAL,
            monthly_contribution_goal REAL,
            status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'archived')),
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          );
          INSERT INTO goals
            (id, user_id, title, target_amount, current_amount, due_date, starting_amount, monthly_contribution_goal, status, created_at, updated_at)
          SELECT
            id, '${LEGACY_LOCAL_USER_ID}', title, target_amount, 0, deadline, starting_amount, monthly_contribution_goal, status, created_at, created_at
          FROM savings_goals;
          DROP TABLE savings_goals;`
        );
        await txn.execAsync(
          "CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals (user_id, status);"
        );
      }
    }

    if (await tableExists(txn as unknown as SQLiteDatabase, "category_budgets")) {
      if (!(await tableExists(txn as unknown as SQLiteDatabase, "budgets"))) {
        await txn.execAsync(
          `CREATE TABLE budgets (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL,
            category_id TEXT,
            month_key TEXT NOT NULL,
            limit_amount REAL NOT NULL,
            spent_amount_cache REAL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
          );
          INSERT INTO budgets
            (id, user_id, category_id, month_key, limit_amount, spent_amount_cache, created_at, updated_at)
          SELECT
            id, '${LEGACY_LOCAL_USER_ID}', category_id, month_key, limit_amount, NULL, created_at, created_at
          FROM category_budgets;
          DROP TABLE category_budgets;`
        );
        await txn.execAsync(
          "CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets (user_id, month_key);"
        );
      }
    }

    await txn.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION_V2};`);
  });
}

/** New install: schema only; Clerk user row is created by `ensureUserExists` on first session. */
async function createFreshInstall(db: SQLiteDatabase): Promise<void> {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync(createSchemaV2Sql());
    await txn.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
  });
}

/**
 * v3: optional uniqueness for budgets per user/month/category (ignores duplicate rows if any).
 */
async function migrateV2toV3(db: SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_unique_user_month_category
      ON budgets (user_id, month_key, IFNULL(category_id, ''));
    `);
  } catch (e) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        "[migrations] Could not create idx_budgets_unique_user_month_category (duplicate budgets?).",
        e
      );
    }
  }
  await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
}

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  let row = await db.getFirstAsync<UserVersionRow>("PRAGMA user_version");
  let current = row?.user_version ?? 0;
  if (current >= DB_VERSION) return;

  const hasV1Tx = await tableExists(db, "transactions");

  if (current === 0 && !hasV1Tx) {
    await createFreshInstall(db);
    return;
  }

  if (current < SCHEMA_VERSION_V2) {
    await migrateV1toV2(db);
  }

  row = await db.getFirstAsync<UserVersionRow>("PRAGMA user_version");
  current = row?.user_version ?? 0;
  if (current < DB_VERSION) {
    await migrateV2toV3(db);
  }
}
