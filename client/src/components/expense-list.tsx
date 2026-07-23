import { Pencil, ReceiptText, Trash2 } from "lucide-react";
import { CategoryBadge } from "@/components/category-badge";
import { DeleteExpenseDialog } from "@/components/delete-expense-dialog";
import { ExpenseDialog } from "@/components/expense-dialog";
import { Button } from "@/components/ui/button";
import type { Expense } from "@/graphql/budget";
import { formatCurrency, formatDate } from "@/lib/format";

function ExpenseActions({
  expense,
  month,
}: {
  expense: Expense;
  month: string;
}) {
  return (
    <div className="flex items-center gap-1 sm:justify-end">
      <ExpenseDialog
        month={month}
        expense={expense}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            aria-label={`Edit ${expense.description}`}
            title={`Edit ${expense.description}`}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
        }
      />
      <DeleteExpenseDialog
        expense={expense}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            aria-label={`Delete ${expense.description}`}
            title={`Delete ${expense.description}`}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        }
      />
    </div>
  );
}

export function ExpenseList({
  expenses,
  month,
  hasFilters,
}: {
  expenses: Expense[];
  month: string;
  hasFilters: boolean;
}) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-14 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
          <ReceiptText className="size-5" aria-hidden="true" />
        </span>
        <h3 className="mt-4 font-semibold text-slate-950">
          {hasFilters ? "No matching expenses" : "No expenses this month"}
        </h3>
        <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
          {hasFilters
            ? "Try a different search or category."
            : "Add the first expense to start tracking this month."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full table-fixed text-sm">
          <thead className="border-y border-slate-200 bg-slate-50/70">
            <tr>
              <th className="w-[32%] px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Expense
              </th>
              <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
              </th>
              <th className="w-[18%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date
              </th>
              <th className="w-[18%] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Amount
              </th>
              <th className="w-[12%] px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((expense) => (
              <tr
                key={expense.id}
                className="transition-colors hover:bg-slate-50/60"
              >
                <td className="px-6 py-4 align-middle">
                  <p className="truncate font-semibold text-slate-950">
                    {expense.description}
                  </p>
                  {expense.note && (
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {expense.note}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4 align-middle">
                  <CategoryBadge category={expense.category} />
                </td>
                <td className="px-4 py-4 align-middle text-slate-600">
                  {formatDate(expense.spentAt)}
                </td>
                <td className="px-4 py-4 text-right align-middle font-bold text-slate-950">
                  {formatCurrency(expense.amountCents)}
                </td>
                <td className="px-6 py-4 align-middle">
                  <ExpenseActions expense={expense} month={month} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 lg:hidden">
        {expenses.map((expense) => (
          <article key={expense.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-slate-950">
                  {expense.description}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(expense.spentAt)}
                </p>
              </div>
              <p className="shrink-0 font-bold text-slate-950">
                {formatCurrency(expense.amountCents)}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <CategoryBadge category={expense.category} />
              <ExpenseActions expense={expense} month={month} />
            </div>
            {expense.note && (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                {expense.note}
              </p>
            )}
          </article>
        ))}
      </div>
    </>
  );
}

