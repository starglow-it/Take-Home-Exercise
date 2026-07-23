import {
  isExpenseCategory,
  type ExpenseCategory,
} from "../domain/categories.js";

export class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputValidationError";
  }
}

export function parseId(value: string, label: string): number {
  if (!/^\d+$/.test(value)) {
    throw new InputValidationError(`${label} must be a positive integer.`);
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new InputValidationError(`${label} must be a positive integer.`);
  }

  return id;
}

export function normalizeDescription(value: string): string {
  const description = value.trim().replace(/\s+/g, " ");

  if (description.length === 0) {
    throw new InputValidationError("Description is required.");
  }

  if (description.length > 100) {
    throw new InputValidationError(
      "Description must be 100 characters or fewer.",
    );
  }

  return description;
}

export function normalizeNote(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const note = value.trim();

  if (note.length > 300) {
    throw new InputValidationError("Note must be 300 characters or fewer.");
  }

  return note.length === 0 ? null : note;
}

export function parseMoneyToCents(value: string, label = "Amount"): number {
  const normalized = value.trim();

  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalized)) {
    throw new InputValidationError(
      `${label} must be a positive number with no more than two decimal places.`,
    );
  }

  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

  if (!Number.isSafeInteger(cents) || cents <= 0) {
    throw new InputValidationError(`${label} must be greater than zero.`);
  }

  if (cents > 100_000_000) {
    throw new InputValidationError(`${label} must be $1,000,000 or less.`);
  }

  return cents;
}

export function parseExpenseDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new InputValidationError("Date must use the YYYY-MM-DD format.");
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new InputValidationError("Date must be a valid calendar date.");
  }

  return value;
}

export function parseMonth(value: string): string {
  if (!/^\d{4}-(?:0[1-9]|1[0-2])$/.test(value)) {
    throw new InputValidationError("Month must use the YYYY-MM format.");
  }

  return value;
}

export function parseCategory(value: string): ExpenseCategory {
  if (!isExpenseCategory(value)) {
    throw new InputValidationError("Choose a valid expense category.");
  }

  return value;
}

