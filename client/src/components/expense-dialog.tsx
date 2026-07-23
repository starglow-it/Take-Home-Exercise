import { LoaderCircle, Pencil, Plus } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  EXPENSE_CATEGORIES,
  useCreateExpense,
  useUpdateExpense,
  type Expense,
  type ExpenseCategory,
} from "@/graphql/budget";
import { getErrorMessage } from "@/graphql/client";
import { categoryConfig } from "@/lib/categories";
import { defaultDateForMonth } from "@/lib/format";
import { validateMoney } from "@/lib/validation";

interface ExpenseDialogProps {
  month: string;
  expense?: Expense;
  trigger: ReactNode;
}

interface FormState {
  description: string;
  amount: string;
  category: ExpenseCategory;
  spentAt: string;
  note: string;
}

function initialState(month: string, expense?: Expense): FormState {
  return expense
    ? {
        description: expense.description,
        amount: (expense.amountCents / 100).toFixed(2),
        category: expense.category,
        spentAt: expense.spentAt,
        note: expense.note ?? "",
      }
    : {
        description: "",
        amount: "",
        category: "FOOD",
        spentAt: defaultDateForMonth(month),
        note: "",
      };
}

export function ExpenseDialog({
  month,
  expense,
  trigger,
}: ExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => initialState(month, expense));
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const mutation = expense ? updateExpense : createExpense;
  const description = form.description.trim().replace(/\s+/g, " ");
  const errors = {
    description:
      description.length === 0
        ? "Description is required."
        : description.length > 100
          ? "Description must be 100 characters or fewer."
          : null,
    amount: validateMoney(form.amount),
    date: /^\d{4}-\d{2}-\d{2}$/.test(form.spentAt)
      ? null
      : "Choose a valid date.",
    note:
      form.note.length > 300 ? "Note must be 300 characters or fewer." : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setServerError(null);
  }

  function resetForm() {
    setForm(initialState(month, expense));
    setSubmitted(false);
    setServerError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!mutation.isPending) {
      setOpen(nextOpen);
      if (nextOpen) resetForm();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setServerError(null);

    if (hasErrors) return;

    const input = {
      description,
      amount: form.amount.trim(),
      category: form.category,
      spentAt: form.spentAt,
      note: form.note.trim() || null,
    };

    try {
      if (expense) {
        await updateExpense.mutateAsync({ id: expense.id, input });
        toast.success(`${description} was updated.`);
      } else {
        await createExpense.mutateAsync(input);
        toast.success(`${description} was added.`);
      }

      setOpen(false);
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {expense ? "Edit expense" : "Add an expense"}
            </DialogTitle>
            <DialogDescription>
              {expense
                ? "Update this transaction. Monthly totals will refresh automatically."
                : "Record a purchase and assign it to a category."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor={`expense-description-${expense?.id ?? "new"}`}>
                Description
              </Label>
              <Input
                id={`expense-description-${expense?.id ?? "new"}`}
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                autoFocus
                placeholder="e.g. Weekly groceries"
                aria-invalid={submitted && Boolean(errors.description)}
              />
              {submitted && errors.description && (
                <p className="text-xs text-rose-600" role="alert">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`expense-amount-${expense?.id ?? "new"}`}>
                  Amount
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    $
                  </span>
                  <Input
                    id={`expense-amount-${expense?.id ?? "new"}`}
                    value={form.amount}
                    onChange={(event) => updateField("amount", event.target.value)}
                    inputMode="decimal"
                    autoComplete="off"
                    className="pl-7"
                    placeholder="0.00"
                    aria-invalid={submitted && Boolean(errors.amount)}
                  />
                </div>
                {submitted && errors.amount && (
                  <p className="text-xs text-rose-600" role="alert">
                    {errors.amount}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`expense-date-${expense?.id ?? "new"}`}>
                  Date
                </Label>
                <Input
                  id={`expense-date-${expense?.id ?? "new"}`}
                  type="date"
                  value={form.spentAt}
                  onChange={(event) => updateField("spentAt", event.target.value)}
                  aria-invalid={submitted && Boolean(errors.date)}
                />
                {submitted && errors.date && (
                  <p className="text-xs text-rose-600" role="alert">
                    {errors.date}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`expense-category-${expense?.id ?? "new"}`}>
                Category
              </Label>
              <select
                id={`expense-category-${expense?.id ?? "new"}`}
                value={form.category}
                onChange={(event) =>
                  updateField(
                    "category",
                    event.target.value as ExpenseCategory,
                  )
                }
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {categoryConfig[category].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor={`expense-note-${expense?.id ?? "new"}`}>
                  Note <span className="font-normal text-slate-400">(optional)</span>
                </Label>
                <span
                  className={
                    errors.note ? "text-xs text-rose-600" : "text-xs text-slate-400"
                  }
                >
                  {form.note.length}/300
                </span>
              </div>
              <Textarea
                id={`expense-note-${expense?.id ?? "new"}`}
                value={form.note}
                onChange={(event) => updateField("note", event.target.value)}
                placeholder="Add useful context..."
                aria-invalid={Boolean(errors.note)}
              />
              {errors.note && (
                <p className="text-xs text-rose-600" role="alert">
                  {errors.note}
                </p>
              )}
            </div>

            {serverError && (
              <p
                className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                role="alert"
              >
                {serverError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : expense ? (
                <Pencil className="size-4" aria-hidden="true" />
              ) : (
                <Plus className="size-4" aria-hidden="true" />
              )}
              {mutation.isPending
                ? "Saving..."
                : expense
                  ? "Save changes"
                  : "Add expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

