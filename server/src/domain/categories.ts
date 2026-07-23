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

export function isExpenseCategory(value: string): value is ExpenseCategory {
  return EXPENSE_CATEGORIES.includes(value as ExpenseCategory);
}

