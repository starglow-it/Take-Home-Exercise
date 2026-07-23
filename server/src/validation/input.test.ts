import { describe, expect, it } from "vitest";
import {
  normalizeDescription,
  parseExpenseDate,
  parseMoneyToCents,
  parseMonth,
} from "./input.js";

describe("input validation", () => {
  it("converts decimal money strings to integer cents", () => {
    expect(parseMoneyToCents("12")).toBe(1_200);
    expect(parseMoneyToCents("12.3")).toBe(1_230);
    expect(parseMoneyToCents("12.34")).toBe(1_234);
  });

  it("rejects invalid or unsafe money values", () => {
    expect(() => parseMoneyToCents("0")).toThrow(
      "Amount must be greater than zero.",
    );
    expect(() => parseMoneyToCents("-4.50")).toThrow();
    expect(() => parseMoneyToCents("4.567")).toThrow();
    expect(() => parseMoneyToCents("1000000.01")).toThrow(
      "Amount must be $1,000,000 or less.",
    );
  });

  it("normalizes descriptions and validates calendar inputs", () => {
    expect(normalizeDescription("  Coffee   beans ")).toBe("Coffee beans");
    expect(parseExpenseDate("2026-07-23")).toBe("2026-07-23");
    expect(parseMonth("2026-07")).toBe("2026-07");
    expect(() => parseExpenseDate("2026-02-30")).toThrow(
      "Date must be a valid calendar date.",
    );
    expect(() => parseMonth("2026-13")).toThrow(
      "Month must use the YYYY-MM format.",
    );
  });
});

