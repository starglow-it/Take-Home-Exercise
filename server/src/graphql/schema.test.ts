import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createBudgetApp } from "../app.js";
import { BudgetRepository, createDatabase } from "../db/database.js";
import { BudgetService } from "../services/budget-service.js";

const now = new Date("2026-07-23T16:00:00.000Z");
let database: Database.Database;

async function execute(
  app: ReturnType<typeof createBudgetApp>,
  query: string,
  variables?: Record<string, unknown>,
) {
  const response = await app.fetch("http://localhost/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  return response.json() as Promise<{
    data?: Record<string, unknown>;
    errors?: Array<{ message: string }>;
  }>;
}

beforeEach(() => {
  database = createDatabase(":memory:", now);
});

afterEach(() => {
  database.close();
});

describe("Clarity GraphQL API", () => {
  it("creates, updates, and removes an expense", async () => {
    const app = createBudgetApp(
      new BudgetService(new BudgetRepository(database), () => now),
    );
    const created = await execute(
      app,
      `mutation Create($input: ExpenseInput!) {
        createExpense(input: $input) {
          id
          description
          amountCents
          category
          spentAt
        }
      }`,
      {
        input: {
          description: "  Coffee   beans ",
          amount: "15.99",
          category: "FOOD",
          spentAt: "2030-01-03",
        },
      },
    );

    expect(created.errors).toBeUndefined();
    expect(created.data).toMatchObject({
      createExpense: {
        description: "Coffee beans",
        amountCents: 1_599,
        category: "FOOD",
        spentAt: "2030-01-03",
      },
    });

    const id = (created.data?.createExpense as { id: string }).id;
    const updated = await execute(
      app,
      `mutation Update($id: ID!, $input: ExpenseInput!) {
        updateExpense(id: $id, input: $input) { id description amountCents }
      }`,
      {
        id,
        input: {
          description: "Coffee subscription",
          amount: "17.99",
          category: "FOOD",
          spentAt: "2030-01-03",
        },
      },
    );
    const removed = await execute(
      app,
      `mutation Remove($id: ID!) {
        removeExpense(id: $id) { id description }
      }`,
      { id },
    );

    expect(updated.data).toMatchObject({
      updateExpense: {
        id,
        description: "Coffee subscription",
        amountCents: 1_799,
      },
    });
    expect(removed.data).toMatchObject({
      removeExpense: { id, description: "Coffee subscription" },
    });
  });

  it("sets a goal and exposes refreshed dashboard totals", async () => {
    const app = createBudgetApp(
      new BudgetService(new BudgetRepository(database), () => now),
    );
    const goal = await execute(
      app,
      `mutation Goal($input: BudgetGoalInput!) {
        setBudgetGoal(input: $input) { month category amountCents }
      }`,
      { input: { month: "2030-01", amount: "1000" } },
    );
    const dashboard = await execute(
      app,
      `query Dashboard($month: String!) {
        budgetDashboard(month: $month) {
          overallGoalCents
          totalSpentCents
          remainingCents
        }
      }`,
      { month: "2030-01" },
    );

    expect(goal.data).toMatchObject({
      setBudgetGoal: {
        month: "2030-01",
        category: null,
        amountCents: 100_000,
      },
    });
    expect(dashboard.data).toMatchObject({
      budgetDashboard: {
        overallGoalCents: 100_000,
        totalSpentCents: 0,
        remainingCents: 100_000,
      },
    });
  });

  it("returns useful validation errors", async () => {
    const app = createBudgetApp(
      new BudgetService(new BudgetRepository(database), () => now),
    );
    const result = await execute(
      app,
      `mutation {
        createExpense(
          input: {
            description: ""
            amount: "4.567"
            category: FOOD
            spentAt: "2026-02-30"
          }
        ) { id }
      }`,
    );

    expect(result.errors?.[0]?.message).toBe("Description is required.");
  });
});

