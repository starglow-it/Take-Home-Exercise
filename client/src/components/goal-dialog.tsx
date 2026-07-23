import { LoaderCircle, Target } from "lucide-react";
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
import {
  EXPENSE_CATEGORIES,
  useSetBudgetGoal,
  type BudgetDashboard,
  type ExpenseCategory,
} from "@/graphql/budget";
import { getErrorMessage } from "@/graphql/client";
import { categoryConfig } from "@/lib/categories";
import { formatCurrency, formatMonth } from "@/lib/format";
import { validateMoney } from "@/lib/validation";

type GoalScope = ExpenseCategory | "OVERALL";

export function GoalDialog({
  month,
  dashboard,
  trigger,
}: {
  month: string;
  dashboard: BudgetDashboard;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<GoalScope>("OVERALL");
  const [amount, setAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const setBudgetGoal = useSetBudgetGoal();
  const validationError = validateMoney(amount);
  const visibleError = (submitted ? validationError : null) ?? serverError;

  function currentAmount(nextScope: GoalScope): string {
    const cents =
      nextScope === "OVERALL"
        ? dashboard.overallGoalCents
        : dashboard.categoryProgress.find(
            (category) => category.category === nextScope,
          )?.goalCents;

    return cents == null ? "" : (cents / 100).toFixed(2);
  }

  function resetForm() {
    setScope("OVERALL");
    setAmount(currentAmount("OVERALL"));
    setSubmitted(false);
    setServerError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!setBudgetGoal.isPending) {
      setOpen(nextOpen);
      if (nextOpen) {
        resetForm();
      }
    }
  }

  function handleScopeChange(value: string) {
    const nextScope = value as GoalScope;
    setScope(nextScope);
    setAmount(currentAmount(nextScope));
    setSubmitted(false);
    setServerError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setServerError(null);

    if (validationError) return;

    try {
      await setBudgetGoal.mutateAsync({
        month,
        category: scope === "OVERALL" ? null : scope,
        amount: amount.trim(),
      });
      const label =
        scope === "OVERALL" ? "Monthly" : categoryConfig[scope].label;
      toast.success(`${label} budget goal saved.`);
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
            <DialogTitle>Set a budget goal</DialogTitle>
            <DialogDescription>
              Set an overall or category target for {formatMonth(month)}.
              Existing goals are updated instead of duplicated.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="goal-scope">Goal type</Label>
              <select
                id="goal-scope"
                value={scope}
                onChange={(event) => handleScopeChange(event.target.value)}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="OVERALL">Overall monthly budget</option>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {categoryConfig[category].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-amount">Budget amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  $
                </span>
                <Input
                  id="goal-amount"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setServerError(null);
                  }}
                  inputMode="decimal"
                  autoComplete="off"
                  autoFocus
                  className="pl-7"
                  placeholder="2500.00"
                  aria-invalid={Boolean(visibleError)}
                  aria-describedby="goal-amount-help"
                />
              </div>
              <p
                id="goal-amount-help"
                role={visibleError ? "alert" : undefined}
                className={
                  visibleError
                    ? "text-xs text-rose-600"
                    : "text-xs text-slate-500"
                }
              >
                {visibleError ??
                  `Current spending: ${
                    scope === "OVERALL"
                      ? formatCurrency(dashboard.totalSpentCents)
                      : formatCurrency(
                          dashboard.categoryProgress.find(
                            (category) => category.category === scope,
                          )?.spentCents ?? 0,
                        )
                  }`}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={setBudgetGoal.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={setBudgetGoal.isPending}>
              {setBudgetGoal.isPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Target className="size-4" aria-hidden="true" />
              )}
              {setBudgetGoal.isPending ? "Saving..." : "Save goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

