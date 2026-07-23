import { createServer } from "node:http";
import { createBudgetApp } from "./app.js";
import { BudgetRepository, createDatabase } from "./db/database.js";
import { BudgetService } from "./services/budget-service.js";

const port = Number(process.env.PORT ?? 4000);
const database = createDatabase();
const repository = new BudgetRepository(database);
const service = new BudgetService(repository);
const app = createBudgetApp(service);
const server = createServer(app);

server.listen(port, () => {
  console.log(`Clarity API listening on http://localhost:${port}/graphql`);
});

function shutdown() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

