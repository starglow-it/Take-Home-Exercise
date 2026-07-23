import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "../domain/categories.js";
import type {
  BudgetGoal,
  BudgetRepository,
  Expense,
  ExpenseFilters,
  ExpenseWrite,
} from "../db/database.js";

export class ExpenseNotFoundError extends Error {
  constructor(id: number) {
    super(`Expense ${id} was not found.`);
    this.name = "ExpenseNotFoundError";
  }
}

export interface CategoryProgress {
  category: ExpenseCategory;
  spentCents: number;
  goalCents: number | null;
  remainingCents: number | null;
  percentageUsed: number | null;
}

export interface BudgetDashboard {
  month: string;
  totalSpentCents: number;
  overallGoalCents: number | null;
  remainingCents: number | null;
  percentageUsed: number | null;
  transactionCount: number;
  averageExpenseCents: number;
  categoryProgress: CategoryProgress[];
}

function percentage(spent: number, goal: number | null): number | null {
  if (goal == null) {
    return null;
  }

  return Math.round((spent / goal) * 1_000) / 10;
}

export class BudgetService {
  constructor(
    private readonly repository: BudgetRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  listExpenses(filters: ExpenseFilters): Expense[] {
    return this.repository.listExpenses(filters);
  }

  budgetDashboard(month: string): BudgetDashboard {
    const expenses = this.repository.listExpenses({ month });
    const goals = this.repository.listBudgetGoals(month);
    const overallGoal =
      goals.find((goal) => goal.category === null)?.amountCents ?? null;
    const totalSpent = expenses.reduce(
      (total, expense) => total + expense.amountCents,
      0,
    );
    const spentByCategory = new Map<ExpenseCategory, number>();

    for (const expense of expenses) {
      spentByCategory.set(
        expense.category,
        (spentByCategory.get(expense.category) ?? 0) + expense.amountCents,
      );
    }

    const goalsByCategory = new Map<ExpenseCategory, BudgetGoal>();
    for (const goal of goals) {
      if (goal.category) {
        goalsByCategory.set(goal.category, goal);
      }
    }

    const categoryProgress = EXPENSE_CATEGORIES.map((category) => {
      const spentCents = spentByCategory.get(category) ?? 0;
      const goalCents = goalsByCategory.get(category)?.amountCents ?? null;

      return {
        category,
        spentCents,
        goalCents,
        remainingCents: goalCents == null ? null : goalCents - spentCents,
        percentageUsed: percentage(spentCents, goalCents),
      };
    }).sort(
      (left, right) =>
        right.spentCents - left.spentCents ||
        left.category.localeCompare(right.category),
    );

    return {
      month,
      totalSpentCents: totalSpent,
      overallGoalCents: overallGoal,
      remainingCents:
        overallGoal == null ? null : overallGoal - totalSpent,
      percentageUsed: percentage(totalSpent, overallGoal),
      transactionCount: expenses.length,
      averageExpenseCents:
        expenses.length === 0 ? 0 : Math.round(totalSpent / expenses.length),
      categoryProgress,
    };
  }

  createExpense(input: ExpenseWrite): Expense {
    return this.repository.createExpense(input, this.now().toISOString());
  }

  updateExpense(id: number, input: ExpenseWrite): Expense {
    this.assertExpenseExists(id);
    return this.repository.updateExpense(id, input, this.now().toISOString());
  }

  removeExpense(id: number): Expense {
    const expense = this.repository.removeExpense(id);

    if (!expense) {
      throw new ExpenseNotFoundError(id);
    }

    return expense;
  }

  setBudgetGoal(
    month: string,
    category: ExpenseCategory | null,
    amountCents: number,
  ): BudgetGoal {
    return this.repository.setBudgetGoal(
      month,
      category,
      amountCents,
      this.now().toISOString(),
    );
  }

  private assertExpenseExists(id: number): void {
    if (!this.repository.findExpense(id)) {
      throw new ExpenseNotFoundError(id);
    }
  }
}

