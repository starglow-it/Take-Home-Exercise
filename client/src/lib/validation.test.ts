import { describe, expect, it } from "vitest";
import { validateMoney } from "./validation";

describe("money validation", () => {
  it("accepts positive values with up to two decimal places", () => {
    expect(validateMoney("12")).toBeNull();
    expect(validateMoney("12.3")).toBeNull();
    expect(validateMoney("12.34")).toBeNull();
  });

  it("rejects empty, zero, malformed, and oversized values", () => {
    expect(validateMoney("")).toBe("Amount is required.");
    expect(validateMoney("0")).toBe("Amount must be greater than zero.");
    expect(validateMoney("4.567")).toBe(
      "Enter a valid amount with no more than two decimal places.",
    );
    expect(validateMoney("1000000.01")).toBe(
      "Amount must be $1,000,000 or less.",
    );
  });
});

