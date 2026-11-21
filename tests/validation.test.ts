import { describe, it, expect } from 'vitest';
import { checkAmountAgainstBudget, CreateRequestSchema, DecisionSchema } from '../src/lib/validation';

describe('CreateRequestSchema', () => {
  const validPayload = {
    title: 'New laptop',
    amount: 1200,
    budgetCode: 'BUDGET-TECH-24',
    consent: true,
  };

  it('accepts a valid create payload with explicit consent', () => {
    const parsed = CreateRequestSchema.safeParse(validPayload);

    expect(parsed.success).toBe(true);
  });

  it('rejects a create payload without explicit consent', () => {
    const parsed = CreateRequestSchema.safeParse({
      title: 'New laptop',
      amount: 1200,
      budgetCode: 'BUDGET-TECH-24',
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects a create payload that does not consent to data processing', () => {
    const parsed = CreateRequestSchema.safeParse({ ...validPayload, consent: false });

    expect(parsed.success).toBe(false);
  });

  it('trims the title before storing', () => {
    const parsed = CreateRequestSchema.safeParse({
      ...validPayload,
      title: '  New laptop  ',
    });

    expect(parsed.success && parsed.data.title).toBe('New laptop');
  });

  it('rejects an empty title', () => {
    const parsed = CreateRequestSchema.safeParse({
      ...validPayload,
      title: '   ',
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects a non-positive amount', () => {
    const parsed = CreateRequestSchema.safeParse({
      ...validPayload,
      amount: 0,
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects an amount above the per-request maximum', () => {
    const parsed = CreateRequestSchema.safeParse({
      ...validPayload,
      amount: 2000000,
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
