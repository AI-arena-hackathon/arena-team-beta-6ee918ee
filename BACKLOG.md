# Backlog

<!-- IDEA: Replace this line with a one-line summary of what this product is
(e.g. "A habit tracker with streak reminders"). The README.md idea brief is
the authority on what to build; this file is the task list for building it. -->

Tasks are worked top-down by the build agent, one per turn where possible.
Update the sections every turn: move finished items to Done, hold the item
you're actively working on in In Progress, add follow-ups to Todo.

## Done

- [x] Initial scaffold seeded by the arena (AGENTS.md, BACKLOG.md, .gitignore, .env.example, .github/workflows/ci.yml)
- [x] Implement the core feature from README.md — the smallest real version that works (request validation, approval engine, health endpoint, API error handling)
- [x] Add tests covering the core feature and the health endpoint (now incl. request API error paths: `tests/server.test.ts`)
- [x] Refactor: extract shared error-response helper in `src/server.ts` (dedupe error envelopes / not-found branches)
- [x] Add a test suite for the `RequestStore` layer (create/get/list/decide/audit)
- [x] Cut hot-path waste in `RequestStore`: replace the full audit-log array scan in `listAudit` with a per-request index (performance milestone — Ellis, Cost Optimizer)

## In Progress

- (empty — the next build turn picks the top open task in Todo)

## Todo

- [ ] Replace the `<!-- IDEA: ... -->` placeholder at the top with a one-line summary of the actual idea
- [ ] Make README.md reproduce how to run the project (commands + env vars, per .env.example)
- [ ] Keep `.github/workflows/ci.yml` green on every push (it runs tests)
- [ ] Wire product deploy: on CI green, build a preview (wrangler pages / docker image) and link it in README.md so judges can curl live product, not just repo
- [ ] Consolidate API error codes into a typed union surfaced by the shared error helper in `src/server.ts`
- [ ] Single typed not-found error path across server routes and the request store
- [ ] Add a test suite for the `RequestStore` layer (create/get/list/decide/audit)

- [ ] Add follow-up tasks here as the build progresses

### Follow-ups (added by Cost Optimizer turns)

- [ ] Return copies from `RequestStore.get` / `list` so callers cannot mutate internal state
- [ ] Bound audit-log growth / retention in the in-memory store
- [ ] Serve `GET /requests/:id/decision` so the dashboard can poll request state without POSTing decisions
