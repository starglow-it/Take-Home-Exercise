export function validateMoney(value: string): string | null {
  const normalized = value.trim();

  if (normalized.length === 0) {
    return "Amount is required.";
  }

  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalized)) {
    return "Enter a valid amount with no more than two decimal places.";
  }

  const amount = Number(normalized);

  if (amount <= 0) {
    return "Amount must be greater than zero.";
  }

  if (amount > 1_000_000) {
    return "Amount must be $1,000,000 or less.";
  }

  return null;
}

