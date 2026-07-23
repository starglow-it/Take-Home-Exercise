import {
  CalendarDays,
  CircleDollarSign,
  PiggyBank,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Target,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { CategoryBreakdown } from "@/components/category-breakdown";
import { ExpenseDialog } from "@/components/expense-dialog";
import { ExpenseList } from "@/components/expense-list";
import { GoalDialog } from "@/components/goal-dialog";
import { MonthlyGoalCard } from "@/components/monthly-goal-card";
import { SummaryCard } from "@/components/summary-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EXPENSE_CATEGORIES,
  useBudgetDashboard,
  useExpenses,
  type ExpenseCategory,
} from "@/graphql/budget";
import { getErrorMessage } from "@/graphql/client";
import { categoryConfig } from "@/lib/categories";
import {
  currentMonth,
  formatCurrency,
  formatMonth,
} from "@/lib/format";

type CategoryFilter = ExpenseCategory | "ALL";

function DashboardLoading() {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardContent className="space-y-4 p-6">
          <Skeleton className="size-10 rounded-xl" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-4 w-52" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-5 p-6">
          <Skeleton className="h-5 w-44" />
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ExpenseLoading() {
  return (
    <div className="space-y-1 p-5">
      {[0, 1, 2, 3, 4].map((item) => (
        <div key={item} className="flex items-center gap-4 border-b border-slate-100 py-4 last:border-0">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="hidden h-7 w-24 rounded-full sm:block" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [month, setMonth] = useState(currentMonth);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const filters = {
    month,
    search,
    category: category === "ALL" ? null : category,
  };
  const expenses = useExpenses(filters);
  const dashboard = useBudgetDashboard(month);
  const error = expenses.error ?? dashboard.error;
  const hasFilters = search.trim().length > 0 || category !== "ALL";
  const data = dashboard.data;
  const overBudget = (data?.remainingCents ?? 0) < 0;

  function clearFilters() {
    setSearch("");
    setCategory("ALL");
  }

  async function retry() {
    await Promise.all([expenses.refetch(), dashboard.refetch()]);
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
              <WalletCards className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight text-slate-950">
                Clarity
              </p>
              <p className="text-xs text-slate-500">Personal budget tracker</p>
            </div>
          </div>
          <p className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Saved locally
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              Monthly overview
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Make every dollar intentional
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Track expenses, understand where your money goes, and stay close
              to the goals you set.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:w-44">
              <Label htmlFor="budget-month" className="mb-1.5 block text-xs text-slate-500">
                Budget month
              </Label>
              <div className="relative">
                <CalendarDays
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <Input
                  id="budget-month"
                  type="month"
                  value={month}
                  onChange={(event) => {
                    if (event.target.value) setMonth(event.target.value);
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            {data && (
              <GoalDialog
                month={month}
                dashboard={data}
                trigger={
                  <Button variant="outline">
                    <Target className="size-4" aria-hidden="true" />
                    Set goal
                  </Button>
                }
              />
            )}
            <ExpenseDialog
              month={month}
              trigger={
                <Button>
                  <Plus className="size-4" aria-hidden="true" />
                  Add expense
                </Button>
              }
            />
          </div>
        </div>

        {error && (
          <Alert className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Your budget could not be loaded.</p>
                <p className="mt-1 text-rose-800">{getErrorMessage(error)}</p>
              </div>
              <Button variant="outline" size="sm" onClick={retry}>
                <RefreshCw className="size-4" aria-hidden="true" />
                Try again
              </Button>
            </div>
          </Alert>
        )}

        <section
          aria-label={`${formatMonth(month)} summary`}
          className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <SummaryCard
            label="Total spent"
            value={formatCurrency(data?.totalSpentCents ?? 0)}
            note={`${data?.transactionCount ?? 0} ${
              data?.transactionCount === 1 ? "transaction" : "transactions"
            }`}
            icon={CircleDollarSign}
            tone="indigo"
            loading={dashboard.isPending}
          />
          <SummaryCard
            label="Monthly goal"
            value={
              data?.overallGoalCents == null
                ? "Not set"
                : formatCurrency(data.overallGoalCents)
            }
            note={
              data?.percentageUsed == null
                ? "Set a target for this month"
                : `${data.percentageUsed.toFixed(1)}% used`
            }
            icon={Target}
            tone="amber"
            loading={dashboard.isPending}
          />
          <SummaryCard
            label={overBudget ? "Over budget" : "Remaining"}
            value={
              data?.remainingCents == null
                ? "—"
                : formatCurrency(Math.abs(data.remainingCents))
            }
            note={
              data?.remainingCents == null
                ? "Add a monthly goal to calculate"
                : overBudget
                  ? "Consider adjusting upcoming spending"
                  : "Available within this month's goal"
            }
            icon={PiggyBank}
            tone={overBudget ? "amber" : "emerald"}
            loading={dashboard.isPending}
          />
          <SummaryCard
            label="Average expense"
            value={formatCurrency(data?.averageExpenseCents ?? 0)}
            note="Average across this month"
            icon={Receipt}
            tone="slate"
            loading={dashboard.isPending}
          />
        </section>

        <section aria-label="Budget progress" className="mt-5">
          {dashboard.isPending || !data ? (
            <DashboardLoading />
          ) : (
            <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <MonthlyGoalCard month={month} dashboard={data} />
              <CategoryBreakdown categories={data.categoryProgress} />
            </div>
          )}
        </section>

        <section aria-labelledby="expenses-heading" className="mt-5">
          <Card className="overflow-hidden">
            <CardHeader className="pb-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 id="expenses-heading" className="font-bold text-slate-950">
                    Expenses
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Transactions recorded for {formatMonth(month)}.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                  <div className="relative w-full sm:w-72">
                    <Label htmlFor="expense-search" className="sr-only">
                      Search expenses
                    </Label>
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <Input
                      id="expense-search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search expenses"
                      className="pl-9"
                    />
                  </div>

                  <div className="w-full sm:w-52">
                    <Label htmlFor="category-filter" className="sr-only">
                      Filter by category
                    </Label>
                    <Select
                      value={category}
                      onValueChange={(value) =>
                        setCategory(value as CategoryFilter)
                      }
                    >
                      <SelectTrigger
                        id="category-filter"
                        aria-label="Filter expenses by category"
                      >
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All categories</SelectItem>
                        {EXPENSE_CATEGORIES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {categoryConfig[item].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {hasFilters && (
                    <Button variant="ghost" onClick={clearFilters}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {expenses.isPending ? (
              <ExpenseLoading />
            ) : (
              <ExpenseList
                expenses={expenses.data ?? []}
                month={month}
                hasFilters={hasFilters}
              />
            )}
          </Card>
        </section>
      </main>

      <footer className="mt-10 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-slate-500 sm:px-6 lg:px-8">
          Clarity stores this demonstration’s fictional budget data in a local
          SQLite database.
        </div>
      </footer>
    </div>
  );
}

