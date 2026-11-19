import type {
  AuditAction,
  AuditEntry,
  Decision,
  DecisionResult,
  Request,
} from '../types';
import { decide } from './requestEngine';

export class RequestStore {
  private readonly requests = new Map<string, Request>();
  private readonly auditLog: AuditEntry[] = [];
  private seq = 0;
  private auditSeq = 1;

  create(input: {
    title: string;
    amount: number;
    budgetCode: string;
  }): Request {
    const request: Request = {
      id: `req-${++this.seq}`,
      title: input.title,
      amount: input.amount,
      budgetCode: input.budgetCode,
      status: 'pending',
      step: 'manager',
      createdAt: new Date().toISOString(),
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
    return this.auditLog.filter((entry) => entry.requestId === requestId);
  }

  private appendAudit(
    requestId: string,
    actor: string,
    action: AuditAction
  ): void {
    this.auditLog.push({
      id: this.auditSeq++,
      requestId,
      actor,
      action,
      ts: new Date().toISOString(),
    });
  }
}
