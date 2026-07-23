import { LoaderCircle, Trash2 } from "lucide-react";
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
import { useRemoveExpense, type Expense } from "@/graphql/budget";
import { getErrorMessage } from "@/graphql/client";
import { formatCurrency } from "@/lib/format";

export function DeleteExpenseDialog({
  expense,
  trigger,
}: {
  expense: Expense;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const removeExpense = useRemoveExpense();

  function handleOpenChange(nextOpen: boolean) {
    if (!removeExpense.isPending) {
      setOpen(nextOpen);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await removeExpense.mutateAsync(expense.id);
      toast.success(`${expense.description} was removed.`);
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Delete this expense?</DialogTitle>
            <DialogDescription>
              This transaction will be permanently removed from your monthly
              totals. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="font-semibold text-rose-950">{expense.description}</p>
            <p className="mt-1 text-sm text-rose-800">
              {formatCurrency(expense.amountCents)}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={removeExpense.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={removeExpense.isPending}
            >
              {removeExpense.isPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              {removeExpense.isPending ? "Deleting..." : "Delete expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

