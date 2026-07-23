import { CircleDollarSign } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { CategoryProgress } from "@/graphql/budget";
import { categoryConfig } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";

export function CategoryBreakdown({
  categories,
}: {
  categories: CategoryProgress[];
}) {
  const activeCategories = categories.filter(
    (category) => category.spentCents > 0 || category.goalCents != null,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-950">Spending by category</h2>
            <p className="mt-1 text-sm text-slate-500">
              Compare actual spending with category goals.
            </p>
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
            <CircleDollarSign className="size-5" aria-hidden="true" />
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {activeCategories.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Add an expense or category goal to see a breakdown.
          </p>
        ) : (
          <div className="space-y-5">
            {activeCategories.map((category) => {
              const config = categoryConfig[category.category];
              const Icon = config.icon;
              const percentage = category.percentageUsed ?? 0;
              const overBudget = percentage > 100;

              return (
                <div key={category.category}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-lg",
                          config.iconBackground,
                          config.iconClass,
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {config.label}
                        </p>
                        <p
                          className={cn(
                            "text-xs text-slate-500",
                            overBudget && "font-medium text-rose-600",
                          )}
                        >
                          {category.goalCents == null
                            ? "No category goal"
                            : overBudget
                              ? `${formatCurrency(Math.abs(category.remainingCents ?? 0))} over`
                              : `${formatCurrency(category.remainingCents ?? 0)} left`}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-right text-sm font-semibold text-slate-900">
                      {formatCurrency(category.spentCents)}
                      {category.goalCents != null && (
                        <span className="font-normal text-slate-400">
                          {" "}
                          / {formatCurrency(category.goalCents)}
                        </span>
                      )}
                    </p>
                  </div>
                  <Progress
                    value={percentage}
                    className="ml-11"
                    indicatorClassName={
                      overBudget ? "bg-rose-500" : config.progressClass
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

