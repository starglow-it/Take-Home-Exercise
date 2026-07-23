import { GraphQLError } from "graphql";
import { createSchema } from "graphql-yoga";
import type { ExpenseCategory } from "../domain/categories.js";
import type { ExpenseWrite } from "../db/database.js";
import {
  BudgetService,
  ExpenseNotFoundError,
} from "../services/budget-service.js";
import {
  InputValidationError,
  normalizeDescription,
  normalizeNote,
  parseCategory,
  parseExpenseDate,
  parseId,
  parseMoneyToCents,
  parseMonth,
} from "../validation/input.js";

const typeDefs = /* GraphQL */ `
  enum ExpenseCategory {
    HOUSING
    FOOD
    TRANSPORTATION
    UTILITIES
    ENTERTAINMENT
    HEALTH
    SHOPPING
    OTHER
  }

  type Expense {
    id: ID!
    description: String!
    amountCents: Int!
    category: ExpenseCategory!
    spentAt: String!
    note: String
    createdAt: String!
    updatedAt: String!
  }

  type BudgetGoal {
    id: ID!
    month: String!
    category: ExpenseCategory
    amountCents: Int!
    createdAt: String!
    updatedAt: String!
  }

  type CategoryProgress {
    category: ExpenseCategory!
    spentCents: Int!
    goalCents: Int
    remainingCents: Int
    percentageUsed: Float
  }

  type BudgetDashboard {
    month: String!
    totalSpentCents: Int!
    overallGoalCents: Int
    remainingCents: Int
    percentageUsed: Float
    transactionCount: Int!
    averageExpenseCents: Int!
    categoryProgress: [CategoryProgress!]!
  }

  input ExpenseInput {
    description: String!
    amount: String!
    category: ExpenseCategory!
    spentAt: String!
    note: String
  }

  input BudgetGoalInput {
    month: String!
    category: ExpenseCategory
    amount: String!
  }

  type Query {
    expenses(
      month: String!
      category: ExpenseCategory
      search: String
    ): [Expense!]!
    budgetDashboard(month: String!): BudgetDashboard!
  }

  type Mutation {
    createExpense(input: ExpenseInput!): Expense!
    updateExpense(id: ID!, input: ExpenseInput!): Expense!
    removeExpense(id: ID!): Expense!
    setBudgetGoal(input: BudgetGoalInput!): BudgetGoal!
  }
`;

interface ExpenseInputArgs {
  input: {
    description: string;
    amount: string;
    category: ExpenseCategory;
    spentAt: string;
    note?: string | null;
  };
}

interface UpdateExpenseArgs extends ExpenseInputArgs {
  id: string;
}

interface GoalInputArgs {
  input: {
    month: string;
    category?: ExpenseCategory | null;
    amount: string;
  };
}

function normalizeExpenseInput(args: ExpenseInputArgs["input"]): ExpenseWrite {
  return {
    description: normalizeDescription(args.description),
    amountCents: parseMoneyToCents(args.amount),
    category: parseCategory(args.category),
    spentAt: parseExpenseDate(args.spentAt),
    note: normalizeNote(args.note),
  };
}

function toGraphQLError(error: unknown): never {
  if (
    error instanceof InputValidationError ||
    error instanceof ExpenseNotFoundError
  ) {
    throw new GraphQLError(error.message, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  throw error;
}

export function createBudgetSchema(service: BudgetService) {
  return createSchema({
    typeDefs,
    resolvers: {
      Query: {
        expenses: (
          _parent: unknown,
          args: {
            month: string;
            category?: ExpenseCategory | null;
            search?: string | null;
          },
        ) => {
          try {
            return service.listExpenses({
              month: parseMonth(args.month),
              category: args.category ?? null,
              search: args.search,
            });
          } catch (error) {
            return toGraphQLError(error);
          }
        },
        budgetDashboard: (_parent: unknown, args: { month: string }) => {
          try {
            return service.budgetDashboard(parseMonth(args.month));
          } catch (error) {
            return toGraphQLError(error);
          }
        },
      },
      Mutation: {
        createExpense: (_parent: unknown, args: ExpenseInputArgs) => {
          try {
            return service.createExpense(normalizeExpenseInput(args.input));
          } catch (error) {
            return toGraphQLError(error);
          }
        },
        updateExpense: (_parent: unknown, args: UpdateExpenseArgs) => {
          try {
            return service.updateExpense(
              parseId(args.id, "Expense ID"),
              normalizeExpenseInput(args.input),
            );
          } catch (error) {
            return toGraphQLError(error);
          }
        },
        removeExpense: (_parent: unknown, args: { id: string }) => {
          try {
            return service.removeExpense(parseId(args.id, "Expense ID"));
          } catch (error) {
            return toGraphQLError(error);
          }
        },
        setBudgetGoal: (_parent: unknown, args: GoalInputArgs) => {
          try {
            return service.setBudgetGoal(
              parseMonth(args.input.month),
              args.input.category
                ? parseCategory(args.input.category)
                : null,
              parseMoneyToCents(args.input.amount, "Budget goal"),
            );
          } catch (error) {
            return toGraphQLError(error);
          }
        },
      },
    },
  });
}

