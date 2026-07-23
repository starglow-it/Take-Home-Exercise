import { ArrowRight, Target } from "lucide-react";
import { GoalDialog } from "@/components/goal-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { BudgetDashboard } from "@/graphql/budget";
import { formatCurrency, formatMonth } from "@/lib/format";

export function MonthlyGoalCard({
  month,
  dashboard,
}: {
  month: string;
  dashboard: BudgetDashboard;
}) {
  const hasGoal = dashboard.overallGoalCents != null;
  const percentage = dashboard.percentageUsed ?? 0;
  const overBudget = percentage > 100;

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-950/10">
      <CardContent className="relative p-6">
        <div className="absolute -right-10 -top-12 size-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-8 size-32 rounded-full bg-white/5" />
        <div className="relative">
          <span className="grid size-10 place-items-center rounded-xl bg-white/15">
            <Target className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-5 text-sm font-medium text-indigo-100">
            {formatMonth(month)} goal
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight">
            {hasGoal
              ? formatCurrency(dashboard.overallGoalCents!)
              : "No goal yet"}
          </p>

          {hasGoal ? (
            <>
              <div className="mt-6 flex items-center justify-between gap-4 text-xs">
                <span>{formatCurrency(dashboard.totalSpentCents)} spent</span>
                <span className={overBudget ? "font-semibold text-rose-200" : ""}>
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={percentage}
                className="mt-2 bg-white/20"
                indicatorClassName={overBudget ? "bg-rose-300" : "bg-white"}
              />
              <p className="mt-3 text-xs leading-5 text-indigo-100">
                {overBudget
                  ? `${formatCurrency(Math.abs(dashboard.remainingCents ?? 0))} over this month's goal`
                  : `${formatCurrency(dashboard.remainingCents ?? 0)} available for the rest of the month`}
              </p>
            </>
          ) : (
            <p className="mt-4 max-w-sm text-sm leading-6 text-indigo-100">
              Set a monthly target to measure progress and catch overspending early.
            </p>
          )}

          <GoalDialog
            month={month}
            dashboard={dashboard}
            trigger={
              <Button
                variant="outline"
                className="mt-6 border-white/30 bg-white/10 text-white shadow-none hover:bg-white/20"
              >
                {hasGoal ? "Adjust goals" : "Set a budget goal"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
