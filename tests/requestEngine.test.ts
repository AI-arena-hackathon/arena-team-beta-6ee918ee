import { describe, it, expect } from 'vitest';
import { ActorMismatchError, decide, RequestNotPendingError } from '../src/lib/requestEngine';
import type { Request } from '../src/types';

function pendingRequest(overrides: Partial<Request> = {}): Request {
  return {
    id: 'req-1',
    title: 'New laptop',
    amount: 1200,
    budgetCode: 'BUDGET-TECH-24',
    status: 'pending',
    step: 'manager',
    createdAt: '2026-11-19T00:00:00.000Z',
    ...overrides,
  };
}

function decidedRequest(status: Request['status'], step: Request['step']): Request {
  return pendingRequest({ status, step });
}

describe('decide', () => {
  it('routes a manager approval to the finance step', () => {
    const { request, auditAction } = decide(pendingRequest(), 'manager', 'approve');

    expect(request.status).toBe('pending');
    expect(request.step).toBe('finance');
    expect(auditAction).toBe('approved');
  });

  it('routes a finance approval to the VP step', () => {
    const { request } = decide(pendingRequest({ step: 'finance' }), 'finance', 'approve');

    expect(request.status).toBe('pending');
    expect(request.step).toBe('vp');
  });

  it('marks the request approved once the VP approves', () => {
    const { request, auditAction } = decide(pendingRequest({ step: 'vp' }), 'vp', 'approve');

    expect(request.status).toBe('approved');
    expect(request.step).toBeNull();
    expect(auditAction).toBe('approved');
  });

  it('marks the request rejected and clears the step', () => {
    const { request, auditAction } = decide(pendingRequest(), 'manager', 'reject');

    expect(request.status).toBe('rejected');
    expect(request.step).toBeNull();
    expect(auditAction).toBe('rejected');
  });

  it('rejects decisions from an actor who is not the current approver', () => {
    expect(() => decide(pendingRequest(), 'finance', 'approve')).toThrow(ActorMismatchError);
  });

  it('refuses to decide an already-decided request', () => {
    const approved = decidedRequest('approved', null);

    expect(() => decide(approved, 'manager', 'approve')).toThrow(RequestNotPendingError);
  });
});
