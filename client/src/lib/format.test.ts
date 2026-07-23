import { describe, expect, it } from "vitest";
import { defaultDateForMonth, formatCurrency, formatDate, formatMonth } from "./format";

describe("formatting", () => {
  it("formats integer cents without losing precision", () => {
    expect(formatCurrency(1_234)).toBe("$12.34");
    expect(formatCurrency(-500)).toBe("-$5.00");
  });

  it("formats valid dates and provides a safe fallback", () => {
    expect(formatDate("2026-07-23")).toBe("Jul 23, 2026");
    expect(formatDate("not-a-date")).toBe("Unknown date");
    expect(formatMonth("2026-07")).toBe("July 2026");
  });

  it("uses the first day for a month other than the current month", () => {
    expect(defaultDateForMonth("2030-01")).toBe("2030-01-01");
  });
});

