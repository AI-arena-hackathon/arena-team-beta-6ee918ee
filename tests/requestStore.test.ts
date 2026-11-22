import { describe, it, expect } from 'vitest';
import { RequestStore } from '../src/lib/requestStore';
import { ActorMismatchError, RequestNotPendingError } from '../src/lib/requestEngine';

function freshStore(): RequestStore {
  return new RequestStore();
}

describe('RequestStore.create', () => {
  it('creates a pending request at the manager step', () => {
    const store = freshStore();
    const created = store.create({ title: 'New laptop', amount: 1200, budgetCode: 'BUDGET-TECH-24' });

    expect(created.status).toBe('pending');
    expect(created.step).toBe('manager');
    expect(created.title).toBe('New laptop');
  });

  it('appends a created audit entry for the new request', () => {
    const store = freshStore();
    const created = store.create({ title: 'New laptop', amount: 1200, budgetCode: 'BUDGET-TECH-24' });

    const audit = store.listAudit(created.id);
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ requestId: created.id, actor: 'system', action: 'created' });
  });

  it('records the consent timestamp when consent is provided', () => {
    const store = freshStore();
    const created = store.create({
      title: 'New laptop',
      amount: 1200,
      budgetCode: 'BUDGET-TECH-24',
      consentedAt: '2026-11-21T00:00:00.000Z',
    });

    expect(created.consentedAt).toBe('2026-11-21T00:00:00.000Z');
  });
});

describe('RequestStore audit retention', () => {
  it('bounds the audit log to the configured retention', () => {
    const store = new RequestStore({ auditRetention: 2 });
    const created = store.create({ title: 'New laptop', amount: 1200, budgetCode: 'BUDGET-TECH-24' });

    store.decide(created.id, 'manager', 'approve');
    expect(store.listAudit(created.id)).toHaveLength(2);

    store.decide(created.id, 'finance', 'approve');

    const audit = store.listAudit(created.id);
    expect(audit).toHaveLength(2);
    expect(audit.map((entry) => entry.action)).toEqual(['approved', 'approved']);
  });
});

describe('RequestStore.get and list', () => {
  it('returns undefined for an unknown request id', () => {
    expect(freshStore().get('req-does-not-exist')).toBeUndefined();
  });

  it('lists the created requests', () => {
    const store = freshStore();
    const first = store.create({ title: 'First', amount: 10, budgetCode: 'BUDGET-TECH-24' });
    const second = store.create({ title: 'Second', amount: 20, budgetCode: 'BUDGET-TECH-24' });

    expect(store.list().map((r) => r.id)).toEqual([first.id, second.id]);
  });
});

describe('RequestStore.decide', () => {
  it('routes a manager approval to the finance step', () => {
    const store = freshStore();
    const created = store.create({ title: 'New laptop', amount: 1200, budgetCode: 'BUDGET-TECH-24' });

    const { request, auditAction } = store.decide(created.id, 'manager', 'approve');

    expect(request.status).toBe('pending');
    expect(request.step).toBe('finance');
    expect(auditAction).toBe('approved');
  });

  it('marks a VP approval as approved and clears the step', () => {
    const store = freshStore();
    const created = store.create({ title: 'New laptop', amount: 1200, budgetCode: 'BUDGET-TECH-24' });
    store.decide(created.id, 'manager', 'approve');
    store.decide(created.id, 'finance', 'approve');

    const { request } = store.decide(created.id, 'vp', 'approve');

    expect(request.status).toBe('approved');
    expect(request.step).toBeNull();
  });

  it('marks a rejection as terminal and clears the step', () => {
    const store = freshStore();
    const created = store.create({ title: 'New laptop', amount: 1200, budgetCode: 'BUDGET-TECH-24' });

    const { request, auditAction } = store.decide(created.id, 'manager', 'reject');

    expect(request.status).toBe('rejected');
    expect(request.step).toBeNull();
    expect(auditAction).toBe('rejected');
  });

  it('refuses decisions from an actor who is not the current approver', () => {
    const store = freshStore();
    const created = store.create({ title: 'New laptop', amount: 1200, budgetCode: 'BUDGET-TECH-24' });

    expect(() => store.decide(created.id, 'finance', 'approve')).toThrow(ActorMismatchError);
  });

  it('refuses to decide an already-decided request', () => {
    const store = freshStore();
    const created = store.create({ title: 'New laptop', amount: 1200, budgetCode: 'BUDGET-TECH-24' });
    store.decide(created.id, 'manager', 'reject');

    expect(() => store.decide(created.id, 'manager', 'approve')).toThrow(RequestNotPendingError);
  });
});

describe('RequestStore.listAudit', () => {
  it('returns only the audit entries for the requested request', () => {
    const store = freshStore();
    const first = store.create({ title: 'First', amount: 10, budgetCode: 'BUDGET-TECH-24' });
    const second = store.create({ title: 'Second', amount: 20, budgetCode: 'BUDGET-TECH-24' });
    store.decide(first.id, 'manager', 'approve');

    const firstAudit = store.listAudit(first.id);
    const secondAudit = store.listAudit(second.id);

    expect(firstAudit).toHaveLength(2);
    expect(secondAudit).toHaveLength(1);
    expect(firstAudit.every((entry) => entry.requestId === first.id)).toBe(true);
    expect(secondAudit.every((entry) => entry.requestId === second.id)).toBe(true);
  });

  it('returns an empty list for an unknown request id', () => {
    expect(freshStore().listAudit('req-does-not-exist')).toEqual([]);
  });
});
