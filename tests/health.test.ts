import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server';

describe('GET /health', () => {
  it('returns 200 with an ok status', async () => {
    const res = await request(createApp()).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
