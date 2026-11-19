import budgets from '../../budgets.json';

export interface Budget {
  code: string;
  label: string;
  limit: number;
}

const budgetByCode = new Map<string, Budget>(
  budgets.map((b) => [b.code, b] as const)
);

export function getBudget(code: string): Budget | undefined {
  return budgetByCode.get(code);
}

export function getLimitFor(code: string): number | undefined {
  return budgetByCode.get(code)?.limit;
}
