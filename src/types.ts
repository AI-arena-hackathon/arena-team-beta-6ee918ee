export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type ApprovalStep = 'manager' | 'finance' | 'vp';

export type Decision = 'approve' | 'reject';

export type AuditAction = 'created' | 'approved' | 'rejected';

export interface Request {
  id: string;
  title: string;
  amount: number;
  budgetCode: string;
  status: ApprovalStatus;
  step: ApprovalStep | null;
  createdAt: string;
}

export interface AuditEntry {
  id: number;
  requestId: string;
  actor: string;
  action: AuditAction;
  ts: string;
}

export interface DecisionResult {
  request: Request;
  auditAction: AuditAction;
}
