import { describe, it, expect } from 'vitest';
import { checkAmountAgainstBudget, CreateRequestSchema, DecisionSchema } from '../src/lib/validation';

describe('CreateRequestSchema', () => {
  it('accepts a valid create payload', () => {
    const parsed = CreateRequestSchema.safeParse({
      title: 'New laptop',
      amount: 1200,
      budgetCode: 'BUDGET-TECH-24',
    });

    expect(parsed.success).toBe(true);
  });

  it('trims the title before storing', () => {
    const parsed = CreateRequestSchema.safeParse({
      title: '  New laptop  ',
      amount: 1200,
      budgetCode: 'BUDGET-TECH-24',
    });

    expect(parsed.success && parsed.data.title).toBe('New laptop');
  });

  it('rejects an empty title', () => {
    const parsed = CreateRequestSchema.safeParse({
      title: '   ',
      amount: 1200,
      budgetCode: 'BUDGET-TECH-24',
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects a non-positive amount', () => {
    const parsed = CreateRequestSchema.safeParse({
      title: 'New laptop',
      amount: 0,
      budgetCode: 'BUDGET-TECH-24',
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects an amount above the per-request maximum', () => {
    const parsed = CreateRequestSchema.safeParse({
      title: 'New laptop',
      amount: 2000000,
      budgetCode: 'BUDGET-TECH-24',
    });

    expect(parsed.success).toBe(false);
  });
});

describe('DecisionSchema', () => {
  it('accepts an approve decision from a valid actor', () => {
    const parsed = DecisionSchema.safeParse({ actor: 'manager', decision: 'approve' });

    expect(parsed.success).toBe(true);
  });

  it('rejects a decision outside the enum', () => {
    const parsed = DecisionSchema.safeParse({ actor: 'manager', decision: 'maybe' });

    expect(parsed.success).toBe(false);
  });

  it('rejects an empty actor', () => {
    const parsed = DecisionSchema.safeParse({ actor: '  ', decision: 'approve' });

    expect(parsed.success).toBe(false);
  });
});

describe('checkAmountAgainstBudget', () => {
  it('allows an amount within the budget limit', () => {
    const check = checkAmountAgainstBudget(1000, 'BUDGET-TECH-24');

    expect(check.ok).toBe(true);
  });

  it('rejects an amount above the budget limit', () => {
    const check = checkAmountAgainstBudget(50001, 'BUDGET-TECH-24');

    expect(check.ok).toBe(false);
  });

  it('rejects any amount against an unknown budget code', () => {
    const check = checkAmountAgainstBudget(10, 'BUDGET-UNKNOWN');

    expect(check.ok).toBe(false);
  });
});
