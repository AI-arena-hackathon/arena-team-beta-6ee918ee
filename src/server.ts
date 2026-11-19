import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { checkAmountAgainstBudget, CreateRequestSchema, DecisionSchema } from './lib/validation';
import { RequestStore } from './lib/requestStore';
import { ActorMismatchError, RequestNotPendingError, decide } from './lib/requestEngine';
export const store = new RequestStore();

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.get('/requests', (_req: Request, res: Response) => {
    res.json({ requests: store.list() });
  });

  app.post('/requests', (req: Request, res: Response) => {
    const parsed = CreateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      });
    }

    const { title, amount, budgetCode } = parsed.data;
    const check = checkAmountAgainstBudget(amount, budgetCode);
    if (!check.ok) {
      return res.status(422).json({
        error: { code: 'BUDGET_EXCEEDED', budgetCode, limit: check.limit },
      });
    }

    const request = store.create({ title, amount, budgetCode });
    return res.status(201).json({ request });
  });

  app.get('/requests/:id', (req: Request, res: Response) => {
    const request = store.get(req.params.id);
    if (!request) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', requestId: req.params.id } });
    }
    return res.json({ request });
  });

  app.post('/requests/:id/decision', (req: Request, res: Response) => {
    const parsed = DecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      });
    }

    const { actor, decision } = parsed.data;
    const existing = store.get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', requestId: req.params.id } });
    }

    try {
      const { request, auditAction } = store.decide(existing.id, actor, decision);
      return res.json({ request, auditAction, audit: store.listAudit(existing.id) });
    } catch (error) {
      if (error instanceof RequestNotPendingError) {
        return res.status(409).json({ error: { code: 'REQUEST_NOT_PENDING', requestId: existing.id } });
      }
      if (error instanceof ActorMismatchError) {
        return res.status(403).json({ error: { code: 'ACTOR_MISMATCH', expectedActor: error.expectedActor } });
      }
      throw error;
    }
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid request body' } });
  });

  return app;
}

export const app = createApp();

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`Procurement Pulse listening on port ${port}`);
  });
}
