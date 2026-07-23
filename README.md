# Clarity Budget

Clarity is a focused personal-budgeting application for recording expenses,
understanding monthly spending, and setting overall or category-specific budget
goals.

The project deliberately keeps the workflow small and complete: one person,
one currency, monthly views, durable local data, and clear feedback after every
mutation.

## Features

- Create, edit, and delete expenses
- Categorize expenses across eight practical categories
- Search expenses by description or note
- Filter expenses by category and month
- Set an overall monthly budget goal
- Set or update category-specific goals
- Track total spending, remaining budget, average expense, and transaction count
- View category progress with clear over-budget states
- Automatic dashboard refresh after every mutation
- SQLite persistence across reloads and server restarts
- Responsive desktop table and mobile transaction cards
- Loading, empty, validation, API error, and mutation progress states
- Accessible dialogs, labels, controls, focus styles, and action descriptions

The included expenses are fictional demo data. They are seeded once for a new
database and do not return if the user deletes them.

## Technology

| Area | Choice |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Server state | TanStack Query and `graphql-request` |
| UI | Tailwind CSS, shadcn/ui patterns, Radix UI, Lucide icons |
| API | GraphQL Yoga |
| Persistence | SQLite with `better-sqlite3` |
| Tests | Vitest |

## Architecture

```text
React dashboard
      |
TanStack Query + graphql-request
      |
GraphQL Yoga resolvers
      |
BudgetService
      |
BudgetRepository
      |
SQLite
```

- `client/src/graphql/` owns GraphQL operations, query keys, and cache refresh.
- `client/src/components/` contains workflow and reusable UI components.
- `server/src/graphql/` validates the API boundary and translates expected errors.
- `server/src/services/` calculates dashboard and category progress.
- `server/src/db/` owns schema creation, seed data, parameterized SQL, and persistence.
- `server/src/validation/` normalizes and validates external input.

The browser never recalculates the budget. Dashboard totals and progress values
come from the API so every client sees the same result.

## Money and budget rules

- Monetary values are accepted as decimal strings and stored as integer cents.
- Expense amounts and goals must be greater than zero.
- Amounts support no more than two decimal places.
- Individual amounts are limited to $1,000,000.
- Overall and category goals are unique per month.
- Saving an existing goal updates it instead of creating a duplicate.
- Remaining budget may be negative to represent overspending.
- Goal progress is rounded to one decimal place.
- Expenses belong to the month represented by their spending date.

Using integer cents avoids floating-point errors such as `0.1 + 0.2`.

## Data model

Clarity uses three SQLite tables:

- `expenses` stores the description, integer-cent amount, category, date, note,
  and audit timestamps.
- `budget_goals` stores one overall or category goal per month.
- `app_metadata` records whether fictional demo data has already been seeded.

Indexes support monthly date ordering and category filtering. Database and WAL
files are generated locally and ignored by Git.

## GraphQL operations

```graphql
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
```

## Run locally

### Requirements

- Node.js 20.19 or newer; Node 22 LTS is recommended
- npm 10 or newer

### Setup

```bash
git clone https://github.com/starglow-it/Take-Home-Exercise.git
cd Take-Home-Exercise
npm ci
npm run dev
```

Open:

- Dashboard: <http://localhost:5173>
- GraphQL endpoint: <http://localhost:4000/graphql>

No environment configuration is required. The defaults are documented in
`.env.example`. To override the frontend endpoint, place `VITE_GRAPHQL_URL` in
`client/.env`. Server overrides such as `PORT`, `CLIENT_ORIGIN`, and
`DATABASE_PATH` can be exported before starting the application.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API and Vite development server |
| `npm test` | Run server and client tests once |
| `npm run typecheck` | Type-check both workspaces |
| `npm run build` | Create production builds |
| `npm start -w server` | Start the previously built API |

## Test coverage

The test suite concentrates on behavior most likely to create incorrect
financial results:

- Exact decimal-to-cent conversion
- Rejection of malformed, zero, negative, and oversized amounts
- Calendar date and month validation
- Description normalization
- Idempotent demo-data seeding
- Expense create, update, filter, and delete operations
- Budget-goal upserts
- Overall and category progress calculations
- Missing-expense errors
- GraphQL expense lifecycle
- GraphQL goal and refreshed-dashboard results
- Client currency, date, month, and money-input formatting

Run the complete verification gate:

```bash
npm run typecheck
npm test
npm run build
```

## Deliberate scope

This take-home implementation represents one user and one currency. It
intentionally omits authentication, bank connections, recurring transactions,
shared budgets, currency conversion, imports, notifications, and deployment
infrastructure.

A production version would add authentication and authorization, encrypted
secrets, migrations, audit history, pagination, recurring-expense support,
timezone and locale preferences, database backups, and formal privacy and
security review.

