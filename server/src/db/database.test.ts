import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BudgetRepository, createDatabase, seedDemoData } from "./database.js";

const now = new Date("2026-07-23T16:00:00.000Z");
let database: Database.Database;
let repository: BudgetRepository;

beforeEach(() => {
  database = createDatabase(":memory:", now);
  repository = new BudgetRepository(database);
});

afterEach(() => {
  database.close();
});

describe("budget repository", () => {
  it("seeds the demo data once", () => {
    expect(repository.listExpenses({ month: "2026-07" })).toHaveLength(5);

    seedDemoData(database, now);

    expect(repository.listExpenses({ month: "2026-07" })).toHaveLength(5);
  });

  it("creates, updates, filters, and removes an expense", () => {
    const created = repository.createExpense(
      {
        description: "Coffee beans",
        amountCents: 1_599,
        category: "FOOD",
        spentAt: "2030-01-03",
        note: "Two bags",
      },
      now.toISOString(),
    );

    expect(
      repository.listExpenses({
        month: "2030-01",
        category: "FOOD",
        search: "beans",
      }),
    ).toEqual([created]);

    const updated = repository.updateExpense(
      created.id,
      { ...created, description: "Coffee subscription", amountCents: 1_799 },
      new Date(now.getTime() + 1_000).toISOString(),
    );

    expect(updated.description).toBe("Coffee subscription");
    expect(updated.amountCents).toBe(1_799);
    expect(repository.removeExpense(created.id)).toEqual(updated);
    expect(repository.findExpense(created.id)).toBeUndefined();
  });

  it("upserts one overall and one category goal per month", () => {
    const overall = repository.setBudgetGoal(
      "2030-01",
      null,
      250_000,
      now.toISOString(),
    );
    repository.setBudgetGoal(
      "2030-01",
      null,
      275_000,
      new Date(now.getTime() + 1_000).toISOString(),
    );
    repository.setBudgetGoal(
      "2030-01",
      "FOOD",
      40_000,
      now.toISOString(),
    );

    const goals = repository.listBudgetGoals("2030-01");

    expect(goals).toHaveLength(2);
    expect(goals.find((goal) => goal.category === null)).toMatchObject({
      id: overall.id,
      amountCents: 275_000,
    });
  });
});

