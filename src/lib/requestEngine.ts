import type { ApprovalStep, AuditAction, Decision, DecisionResult, Request } from '../types';

const NEXT_STEP: Partial<Record<ApprovalStep, ApprovalStep>> = {
  manager: 'finance',
  finance: 'vp',
};

export class RequestNotPendingError extends Error {
  constructor(public readonly requestId: string) {
    super(`Request ${requestId} is not pending`);
    this.name = 'RequestNotPendingError';
  }
}

export class ActorMismatchError extends Error {
  readonly expectedActor: string;

  constructor(expectedActor: string) {
    super(`Expected actor ${expectedActor}`);
    this.name = 'ActorMismatchError';
    this.expectedActor = expectedActor;
  }
}

export function decide(
  request: Request,
  actor: string,
  decision: Decision
): DecisionResult {
  if (request.status !== 'pending') {
    throw new RequestNotPendingError(request.id);
  }
  const expectedActor = request.step;
  if (actor !== expectedActor) {
    throw new ActorMismatchError(expectedActor ?? '');
  }

  const auditAction: AuditAction = decision === 'approve' ? 'approved' : 'rejected';

  if (decision === 'reject') {
    const rejected: Request = { ...request, status: 'rejected', step: null };
    return { request: rejected, auditAction };
  }

  const nextStep = expectedActor ? NEXT_STEP[expectedActor] ?? null : null;
  const updated: Request = nextStep
    ? { ...request, step: nextStep }
    : { ...request, status: 'approved', step: null };

  return { request: updated, auditAction };
}
