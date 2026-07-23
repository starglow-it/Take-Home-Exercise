import { createYoga } from "graphql-yoga";
import type { BudgetService } from "./services/budget-service.js";
import { createBudgetSchema } from "./graphql/schema.js";

export function createBudgetApp(service: BudgetService) {
  return createYoga({
    schema: createBudgetSchema(service),
    graphqlEndpoint: "/graphql",
    graphiql: process.env.NODE_ENV !== "production",
    cors: {
      origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
      methods: ["POST", "OPTIONS"],
      allowedHeaders: ["content-type"],
    },
    maskedErrors: false,
  });
}

