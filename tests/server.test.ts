import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server';
import { COMPLIANCE_DISCLAIMER } from '../src/lib/copy';

describe('GET /requests/:id', () => {
  it('returns 404 NOT_FOUND for an unknown request', async () => {
    const res = await request(createApp()).get('/requests/req-does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', requestId: 'req-does-not-exist' } });
  });
});

describe('POST /requests', () => {
  it('returns 422 VALIDATION_ERROR for an empty title', async () => {
    const res = await request(createApp()).post('/requests').send({
      title: '   ',
      amount: 10,
      budgetCode: 'BUDGET-TECH-24',
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 BUDGET_EXCEEDED when the amount exceeds the budget limit', async () => {
    const res = await request(createApp()).post('/requests').send({
      title: 'Way over budget',
      amount: 50001,
      budgetCode: 'BUDGET-TECH-24',
    });

    expect(res.status).toBe(422);
    expect(res.body).toEqual({
      error: { code: 'BUDGET_EXCEEDED', budgetCode: 'BUDGET-TECH-24', limit: 50000 },
    });
  });

  it('returns 422 CONSENT_REQUIRED when consent is not given', async () => {
    const res = await request(createApp()).post('/requests').send({
      title: 'No consent given',
      amount: 10,
      budgetCode: 'BUDGET-TECH-24',
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('CONSENT_REQUIRED');
  });

  it('creates a consented request and returns the compliance disclaimer', async () => {
    const res = await request(createApp()).post('/requests').send({
      title: 'Consented laptop',
      amount: 10,
      budgetCode: 'BUDGET-TECH-24',
      consent: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.request.consentedAt).toBeDefined();
    expect(res.body.disclaimer).toBe(COMPLIANCE_DISCLAIMER);
  });
});

describe('POST /requests/:id/decision', () => {
  it('returns 403 ACTOR_MISMATCH when the actor is not the current approver', async () => {
    const created = await request(createApp()).post('/requests').send({
      title: 'Late refactor',
      amount: 10,
      budgetCode: 'BUDGET-TECH-24',
      consent: true,
    });
    const id = created.body.request.id;

    const res = await request(createApp()).post(`/requests/${id}/decision`).send({
      actor: 'finance',
      decision: 'approve',
    });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: { code: 'ACTOR_MISMATCH', expectedActor: 'manager' } });
  });

  it('returns 409 REQUEST_NOT_PENDING when the request was already decided', async () => {
    const created = await request(createApp()).post('/requests').send({
      title: 'Second late refactor',
      amount: 10,
      budgetCode: 'BUDGET-TECH-24',
      consent: true,
    });
    const id = created.body.request.id;

    const first = await request(createApp()).post(`/requests/${id}/decision`).send({
      actor: 'manager',
      decision: 'reject',
    });
    expect(first.status).toBe(200);

    const res = await request(createApp()).post(`/requests/${id}/decision`).send({
      actor: 'manager',
      decision: 'approve',
    });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: { code: 'REQUEST_NOT_PENDING', requestId: id } });
  });
});
