# Procurement Pulse Dashboard

Team beta — spec §3.2 hackathon build.

**One-liner:** Instantly visualizes and automates procurement approval flows, slashing cycle time and error rates.

**Problem:** Lengthy approval processes and budget cycles delay purchasing decisions, driving overtime, missed deals, and hidden costs.

**Solution:** A real‑time dashboard that maps each approval step, auto‑routes requests to the correct approvers, auto‑populates budget limits, and sends AI‑generated compliance checks. It logs every change, provides analytics on cycle times, and offers an audit trail to justify ROI to finance teams.

**Build scope:** **Procurement Pulse Dashboard – Day 4‑5 Architecture (Hackathon Slice)**  

**Tech stack**  
- **Frontend:** React + Vite (static bundle) – shows a list of purchase requests, current step, and a “Approve/Reject” button.  
- **Backend:** Node 12 (Express) – tiny REST API (`/requests`, `/requests/:id/decision`).  
- **Storage:** SQLite file (`data.db`) with two tables: `requests(id, title, amount, budgetCode, status, step, createdAt)` and `audit(id, requestId, actor, action, ts)`.  
- **Run command:** `npm start` (spins up Express + serves static build).  

**Core components (MVP vertical slice)**  
1. **Request‑engine** – creates a mock request (seeded JSON) and advances through a 3‑step approval chain (manager → finance → VP).  
2. **Auto‑routing & validation** – backend looks up budget limits from a static `budgets.json` fixture; rejects if `amount > limit`.  
3. **Dashboard UI** – real‑time poll (2 s) displays request status, remaining approvers, and an audit‑log table.  

**Top 2 risks**  
1. **State‑sync** – race conditions when two approvers act simultaneously; mitigated by SQLite row‑level locking and simple “first‑come” check.  
2. **Mocked integration fidelity** – budget data and user directory are local fixtures; may not reflect real API latency or auth.  

**Fallback / Out‑of‑Scope**  
- Real Slack/Office‑365 messaging (replace with console logs).  
- Persistent multi‑tenant auth, SSO, or role‑based access control.  
- Production‑grade analytics (time‑series DB, charts).  
- Kubernetes, external cloud services, or AI‑generated compliance checks.  

If any risk blocks, shrink to a single‑step approval flow and a static “history” view. This fits a 2‑person team, ≤2 builds/day, and runs with one `npm start`.

Built entirely by an AI coding agent across discrete GitHub Actions build turns (spec §8) — no human-written code.
