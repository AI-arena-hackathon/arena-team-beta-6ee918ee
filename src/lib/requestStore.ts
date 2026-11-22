import type {
  AuditAction,
  AuditEntry,
  Decision,
  DecisionResult,
  Request,
} from '../types';
import { decide } from './requestEngine';

const DEFAULT_AUDIT_RETENTION = 100;

export interface RequestStoreOptions {
  auditRetention?: number;
}

export class RequestStore {
  private readonly requests = new Map<string, Request>();
  private readonly auditsByRequest = new Map<string, AuditEntry[]>();
  private readonly auditRetention: number;
  private seq = 0;
  private auditSeq = 1;

  constructor(options: RequestStoreOptions = {}) {
    this.auditRetention = options.auditRetention ?? DEFAULT_AUDIT_RETENTION;
  }

  create(input: {
    title: string;
    amount: number;
    budgetCode: string;
    consentedAt?: string;
  }): Request {
    const request: Request = {
      id: `req-${++this.seq}`,
      title: input.title,
      amount: input.amount,
      budgetCode: input.budgetCode,
      status: 'pending',
      step: 'manager',
      createdAt: new Date().toISOString(),
      consentedAt: input.consentedAt ?? new Date().toISOString(),
    };
    this.requests.set(request.id, request);
    this.appendAudit(request.id, 'system', 'created');
    return { ...request };
  }

  get(id: string): Request | undefined {
    return this.requests.get(id);
  }

  list(): Request[] {
    return Array.from(this.requests.values());
  }

  decide(id: string, actor: string, decision: Decision): DecisionResult {
    const request = this.requests.get(id);
    if (!request) {
      throw new Error(`Request ${id} not found`);
    }
    const { request: updated, auditAction } = decide(request, actor, decision);
    this.requests.set(id, updated);
    this.appendAudit(id, actor, auditAction);
    return { request: { ...updated }, auditAction };
  }

  listAudit(requestId: string): AuditEntry[] {
    const entries = this.auditsByRequest.get(requestId);
    if (!entries) {
      return [];
    }
    return entries.length > this.auditRetention
      ? entries.slice(-this.auditRetention)
      : [...entries];
  }

  private appendAudit(
    requestId: string,
    actor: string,
    action: AuditAction
  ): void {
    const entries = this.auditsByRequest.get(requestId) ?? [];
    entries.push({
      id: this.auditSeq++,
      requestId,
      actor,
      action,
      ts: new Date().toISOString(),
    });
    this.auditsByRequest.set(requestId, entries);
  }
}
