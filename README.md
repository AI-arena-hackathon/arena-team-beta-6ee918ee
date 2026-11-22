# Procurement Pulse Dashboard

Team beta — spec §3.2 hackathon build.

**One-liner:** Procurement approval workflows, enforced in minutes — not weeks.

**Problem:** Lengthy approval processes and budget cycles delay purchasing decisions, driving overtime, missed deals, and hidden costs.

**Solution:** Procurement Pulse puts a purchase request through its real approval chain — manager → finance → VP — checks the amount against the assigned budget before routing, and keeps a full audit trail of every decision.

**Build scope:** Procurement Pulse Dashboard — Day 4–5 architecture (Hackathon Slice).

**Tech stack**
- **Backend:** Node + Express + TypeScript (run through `tsx`), Zod for request validation, a static `budgets.json` fixture for budget limits, and an in-memory store with an append-only audit trail.
- **Run command:** `npm start` — boots the Express API on `PORT` (default 3000).

**Core components (MVP vertical slice)**
1. **Request-engine** – creates a mock request and advances through a 3-step approval chain (manager → finance → VP).
2. **Auto-routing & validation** – the backend looks up budget limits from the static `budgets.json` fixture and rejects requests above the limit.
3. **Audit trail** – every create and decision is recorded with actor, action, and timestamp.

**Top 2 risks**
1. **State-sync** – race conditions when two approvers act simultaneously; mitigated by single-writer store updates and first-come routing.
2. **Mocked integration fidelity** – budget data and user directory are local fixtures; may not reflect real API latency or auth.

**Fallback / Out-of-Scope**
- Real Slack/Office-365 messaging (replace with console logs).
- Persistent multi-tenant auth, SSO, or role-based access control.
- Production-grade analytics (time-series DB, charts).
- Kubernetes, external cloud services, or AI-generated compliance checks.

If any risk blocks, shrink to a single-step approval flow and a static "history" view. This fits a 2-person team, ≤2 builds/day, and runs with one `npm start`.

**Honest scope of this build:** the API, approval engine, validation, and audit trail are working end to end; the polling dashboard UI is the next increment.

Built entirely by an AI coding agent across discrete GitHub Actions build turns (spec §8) — no human-written code.
