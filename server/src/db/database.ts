import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExpenseCategory } from "../domain/categories.js";

export interface Expense {
  id: number;
  description: string;
  amountCents: number;
  category: ExpenseCategory;
  spentAt: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetGoal {
  id: number;
  month: string;
  category: ExpenseCategory | null;
  amountCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseWrite {
  description: string;
  amountCents: number;
  category: ExpenseCategory;
  spentAt: string;
  note: string | null;
}

export interface ExpenseFilters {
  month: string;
  category?: ExpenseCategory | null;
  search?: string | null;
}

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_DATABASE_PATH = resolve(
  moduleDirectory,
  "../../data/clarity.db",
);

const schema = `
  CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    category TEXT NOT NULL,
    spent_at TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS budget_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT NOT NULL,
    category TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(month, category)
  );

  CREATE INDEX IF NOT EXISTS idx_expenses_month_date
    ON expenses(substr(spent_at, 1, 7), spent_at DESC);

  CREATE INDEX IF NOT EXISTS idx_expenses_category
    ON expenses(category);
`;

function dateInCurrentMonth(now: Date, daysAgo: number): string {
  const day = Math.max(1, now.getUTCDate() - daysAgo);
  return [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function currentMonth(now: Date): string {
  return now.toISOString().slice(0, 7);
}

export function seedDemoData(database: Database.Database, now = new Date()): void {
  const seedMarker = database
    .prepare("SELECT value FROM app_metadata WHERE key = 'demo_seeded'")
    .get() as { value: string } | undefined;

  if (seedMarker) {
    return;
  }

  const existing = database
    .prepare("SELECT COUNT(*) AS count FROM expenses")
    .get() as { count: number };

  if (existing.count > 0) {
    database
      .prepare(
        "INSERT INTO app_metadata (key, value) VALUES ('demo_seeded', ?)",
      )
      .run(now.toISOString());
    return;
  }

  const timestamp = now.toISOString();
  const insertExpense = database.prepare(
    `INSERT INTO expenses
      (description, amount_cents, category, spent_at, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertGoal = database.prepare(
    `INSERT INTO budget_goals
      (month, category, amount_cents, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
  );
  const month = currentMonth(now);

  database.transaction(() => {
    insertExpense.run(
      "Apartment rent",
      145_000,
      "HOUSING",
      dateInCurrentMonth(now, 18),
      "Monthly rent",
      timestamp,
      timestamp,
    );
    insertExpense.run(
      "Weekly groceries",
      8_642,
      "FOOD",
      dateInCurrentMonth(now, 7),
      null,
      timestamp,
      timestamp,
    );
    insertExpense.run(
      "Transit pass",
      7_200,
      "TRANSPORTATION",
      dateInCurrentMonth(now, 12),
      null,
      timestamp,
      timestamp,
    );
    insertExpense.run(
      "Streaming subscription",
      1_899,
      "ENTERTAINMENT",
      dateInCurrentMonth(now, 4),
      null,
      timestamp,
      timestamp,
    );
    insertExpense.run(
      "Pharmacy",
      2_415,
      "HEALTH",
      dateInCurrentMonth(now, 2),
      null,
      timestamp,
      timestamp,
    );

    insertGoal.run(month, "OVERALL", 300_000, timestamp, timestamp);
    insertGoal.run(month, "FOOD", 45_000, timestamp, timestamp);
    insertGoal.run(month, "TRANSPORTATION", 20_000, timestamp, timestamp);
    insertGoal.run(month, "ENTERTAINMENT", 15_000, timestamp, timestamp);
    database
      .prepare(
        "INSERT INTO app_metadata (key, value) VALUES ('demo_seeded', ?)",
      )
      .run(timestamp);
  })();
}

export function createDatabase(
  filename = process.env.DATABASE_PATH ?? DEFAULT_DATABASE_PATH,
  now = new Date(),
): Database.Database {
  if (filename !== ":memory:") {
    mkdirSync(dirname(filename), { recursive: true });
  }

  const database = new Database(filename);
  database.pragma("foreign_keys = ON");

  if (filename !== ":memory:") {
    database.pragma("journal_mode = WAL");
  }

  database.exec(schema);
  seedDemoData(database, now);
  return database;
}

function mapGoal(row: Omit<BudgetGoal, "category"> & { category: string }): BudgetGoal {
  return {
    ...row,
    category:
      row.category === "OVERALL"
        ? null
        : (row.category as ExpenseCategory),
  };
}

export class BudgetRepository {
  constructor(private readonly database: Database.Database) {}

  listExpenses(filters: ExpenseFilters): Expense[] {
    const conditions = ["substr(spent_at, 1, 7) = ?"];
    const parameters: Array<string> = [filters.month];

    if (filters.category) {
      conditions.push("category = ?");
      parameters.push(filters.category);
    }

    const search = filters.search?.trim();
    if (search) {
      conditions.push("(description LIKE ? OR COALESCE(note, '') LIKE ?)");
      const pattern = `%${search}%`;
      parameters.push(pattern, pattern);
    }

    return this.database
      .prepare(
        `SELECT
           id,
           description,
           amount_cents AS amountCents,
           category,
           spent_at AS spentAt,
           note,
           created_at AS createdAt,
           updated_at AS updatedAt
         FROM expenses
         WHERE ${conditions.join(" AND ")}
         ORDER BY spent_at DESC, id DESC`,
      )
      .all(...parameters) as Expense[];
  }

  findExpense(id: number): Expense | undefined {
    return this.database
      .prepare(
        `SELECT
           id,
           description,
           amount_cents AS amountCents,
           category,
           spent_at AS spentAt,
           note,
           created_at AS createdAt,
           updated_at AS updatedAt
         FROM expenses
         WHERE id = ?`,
      )
      .get(id) as Expense | undefined;
  }

  createExpense(input: ExpenseWrite, timestamp: string): Expense {
    const result = this.database
      .prepare(
        `INSERT INTO expenses
          (description, amount_cents, category, spent_at, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.description,
        input.amountCents,
        input.category,
        input.spentAt,
        input.note,
        timestamp,
        timestamp,
      );

    return this.findExpense(Number(result.lastInsertRowid))!;
  }

  updateExpense(id: number, input: ExpenseWrite, timestamp: string): Expense {
    this.database
      .prepare(
        `UPDATE expenses
         SET description = ?,
             amount_cents = ?,
             category = ?,
             spent_at = ?,
             note = ?,
             updated_at = ?
         WHERE id = ?`,
      )
      .run(
        input.description,
        input.amountCents,
        input.category,
        input.spentAt,
        input.note,
        timestamp,
        id,
      );

    return this.findExpense(id)!;
  }

  removeExpense(id: number): Expense | undefined {
    const expense = this.findExpense(id);

    if (expense) {
      this.database.prepare("DELETE FROM expenses WHERE id = ?").run(id);
    }

    return expense;
  }

  listBudgetGoals(month: string): BudgetGoal[] {
    const rows = this.database
      .prepare(
        `SELECT
           id,
           month,
           category,
           amount_cents AS amountCents,
           created_at AS createdAt,
           updated_at AS updatedAt
         FROM budget_goals
         WHERE month = ?
         ORDER BY category`,
      )
      .all(month) as Array<Omit<BudgetGoal, "category"> & { category: string }>;

    return rows.map(mapGoal);
  }

  setBudgetGoal(
    month: string,
    category: ExpenseCategory | null,
    amountCents: number,
    timestamp: string,
  ): BudgetGoal {
    const storedCategory = category ?? "OVERALL";

    this.database
      .prepare(
        `INSERT INTO budget_goals
          (month, category, amount_cents, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(month, category) DO UPDATE SET
           amount_cents = excluded.amount_cents,
           updated_at = excluded.updated_at`,
      )
      .run(month, storedCategory, amountCents, timestamp, timestamp);

    const row = this.database
      .prepare(
        `SELECT
           id,
           month,
           category,
           amount_cents AS amountCents,
           created_at AS createdAt,
           updated_at AS updatedAt
         FROM budget_goals
         WHERE month = ? AND category = ?`,
      )
      .get(month, storedCategory) as Omit<BudgetGoal, "category"> & {
      category: string;
    };

    return mapGoal(row);
  }
}
