import { z } from 'zod';
import { getLimitFor } from './budgets';

export const CreateRequestSchema = z.object({
  title: z
    .string({ error: 'Title must be a string' })
    .trim()
    .min(1, 'Title is required')
    .max(120, 'Title must be at most 120 characters'),
  amount: z
    .number({ error: 'Amount must be a number' })
    .positive('Amount must be greater than zero')
    .max(1000000, 'Amount exceeds the per-request maximum'),
  budgetCode: z.string().min(1, 'Budget code is required'),
  consent: z
    .boolean({ error: 'Consent is required' })
    .refine((value) => value === true, { message: 'Consent is required' }),
});

export const DecisionSchema = z.object({
  actor: z.string().trim().min(2, 'Actor is required').max(60),
  decision: z.enum(['approve', 'reject'] as const, {
    error: 'Decision must be either approve or reject',
  }),
});

export type CreateRequestInput = z.infer<typeof CreateRequestSchema>;
export type DecisionInput = z.infer<typeof DecisionSchema>;

export type BudgetCheck =
  | { ok: true; limit: number }
  | { ok: false; limit: number };

export function checkAmountAgainstBudget(
  amount: number,
  budgetCode: string
): BudgetCheck {
  const limit = getLimitFor(budgetCode);
  if (limit === undefined) {
    return { ok: false, limit: 0 };
  }
  return amount > limit ? { ok: false, limit } : { ok: true, limit };
}
