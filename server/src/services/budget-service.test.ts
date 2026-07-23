import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BudgetRepository, createDatabase } from "../db/database.js";
import { BudgetService } from "./budget-service.js";

const now = new Date("2026-07-23T16:00:00.000Z");
let database: Database.Database;
let repository: BudgetRepository;
let service: BudgetService;

beforeEach(() => {
  database = createDatabase(":memory:", now);
  repository = new BudgetRepository(database);
  service = new BudgetService(repository, () => now);
});

afterEach(() => {
  database.close();
});

describe("budget service", () => {
  it("calculates overall and category progress using integer cents", () => {
    service.setBudgetGoal("2030-01", null, 100_000);
    service.setBudgetGoal("2030-01", "FOOD", 20_000);
    service.createExpense({
      description: "Groceries",
      amountCents: 12_500,
      category: "FOOD",
      spentAt: "2030-01-05",
      note: null,
    });
    service.createExpense({
      description: "Train",
      amountCents: 5_000,
      category: "TRANSPORTATION",
      spentAt: "2030-01-06",
      note: null,
    });

    const dashboard = service.budgetDashboard("2030-01");

    expect(dashboard).toMatchObject({
      totalSpentCents: 17_500,
      overallGoalCents: 100_000,
      remainingCents: 82_500,
      percentageUsed: 17.5,
      transactionCount: 2,
      averageExpenseCents: 8_750,
    });
    expect(
      dashboard.categoryProgress.find((item) => item.category === "FOOD"),
    ).toMatchObject({
      spentCents: 12_500,
      goalCents: 20_000,
      remainingCents: 7_500,
      percentageUsed: 62.5,
    });
  });

  it("returns an explicit error for an unknown expense", () => {
    expect(() => service.removeExpense(999)).toThrow(
      "Expense 999 was not found.",
    );
  });
});

