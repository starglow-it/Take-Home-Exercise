import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "./client";

export const EXPENSE_CATEGORIES = [
  "HOUSING",
  "FOOD",
  "TRANSPORTATION",
  "UTILITIES",
  "ENTERTAINMENT",
  "HEALTH",
  "SHOPPING",
  "OTHER",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string;
  description: string;
  amountCents: number;
  category: ExpenseCategory;
  spentAt: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface ExpenseInput {
  description: string;
  amount: string;
  category: ExpenseCategory;
  spentAt: string;
  note: string | null;
}

export interface ExpenseFilters {
  month: string;
  category: ExpenseCategory | null;
  search: string;
}

const expensesQuery = /* GraphQL */ `
  query Expenses(
    $month: String!
    $category: ExpenseCategory
    $search: String
  ) {
    expenses(month: $month, category: $category, search: $search) {
      id
      description
      amountCents
      category
      spentAt
      note
      createdAt
      updatedAt
    }
  }
`;

const dashboardQuery = /* GraphQL */ `
  query BudgetDashboard($month: String!) {
    budgetDashboard(month: $month) {
      month
      totalSpentCents
      overallGoalCents
      remainingCents
      percentageUsed
      transactionCount
      averageExpenseCents
      categoryProgress {
        category
        spentCents
        goalCents
        remainingCents
        percentageUsed
      }
    }
  }
`;

const createExpenseMutation = /* GraphQL */ `
  mutation CreateExpense($input: ExpenseInput!) {
    createExpense(input: $input) {
      id
      description
    }
  }
`;

const updateExpenseMutation = /* GraphQL */ `
  mutation UpdateExpense($id: ID!, $input: ExpenseInput!) {
    updateExpense(id: $id, input: $input) {
      id
      description
    }
  }
`;

const removeExpenseMutation = /* GraphQL */ `
  mutation RemoveExpense($id: ID!) {
    removeExpense(id: $id) {
      id
      description
    }
  }
`;

const setBudgetGoalMutation = /* GraphQL */ `
  mutation SetBudgetGoal($input: BudgetGoalInput!) {
    setBudgetGoal(input: $input) {
      id
      month
      category
      amountCents
    }
  }
`;

export const budgetKeys = {
  expenses: ["expenses"] as const,
  expenseList: (filters: ExpenseFilters) => ["expenses", filters] as const,
  dashboards: ["budget-dashboard"] as const,
  dashboard: (month: string) => ["budget-dashboard", month] as const,
};

export function useExpenses(filters: ExpenseFilters) {
  return useQuery({
    queryKey: budgetKeys.expenseList(filters),
    queryFn: async () => {
      const data = await graphqlClient.request<{ expenses: Expense[] }>(
        expensesQuery,
        {
          month: filters.month,
          category: filters.category,
          search: filters.search.trim() || null,
        },
      );

      return data.expenses;
    },
  });
}

export function useBudgetDashboard(month: string) {
  return useQuery({
    queryKey: budgetKeys.dashboard(month),
    queryFn: async () => {
      const data = await graphqlClient.request<{
        budgetDashboard: BudgetDashboard;
      }>(dashboardQuery, { month });

      return data.budgetDashboard;
    },
  });
}

function useRefreshBudget() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: budgetKeys.expenses }),
      queryClient.invalidateQueries({ queryKey: budgetKeys.dashboards }),
    ]);
  };
}

export function useCreateExpense() {
  const refreshBudget = useRefreshBudget();

  return useMutation({
    mutationFn: (input: ExpenseInput) =>
      graphqlClient.request(createExpenseMutation, { input }),
    onSuccess: refreshBudget,
  });
}

export function useUpdateExpense() {
  const refreshBudget = useRefreshBudget();

  return useMutation({
    mutationFn: (variables: { id: string; input: ExpenseInput }) =>
      graphqlClient.request(updateExpenseMutation, variables),
    onSuccess: refreshBudget,
  });
}

export function useRemoveExpense() {
  const refreshBudget = useRefreshBudget();

  return useMutation({
    mutationFn: (id: string) =>
      graphqlClient.request(removeExpenseMutation, { id }),
    onSuccess: refreshBudget,
  });
}

export function useSetBudgetGoal() {
  const refreshBudget = useRefreshBudget();

  return useMutation({
    mutationFn: (input: {
      month: string;
      category: ExpenseCategory | null;
      amount: string;
    }) => graphqlClient.request(setBudgetGoalMutation, { input }),
    onSuccess: refreshBudget,
  });
}

