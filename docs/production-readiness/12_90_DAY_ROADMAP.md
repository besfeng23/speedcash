# 12 90-Day Production Roadmap

## Phase 0 — Freeze and truth baseline

Objective: stop branch chaos and establish the current truth.

Likely files:

- `README.md`
- `SPEEDCASH_HARDENING_STATUS.md`
- `.github/workflows/ci.yml`
- `package-lock.json`
- `functions/package-lock.json`

Deliverables:

- current branch confirmed
- lockfiles committed
- lint/typecheck/build status known
- production blockers documented

Acceptance criteria:

- CI can run deterministically
- no stale branch report confusion
- repo status docs match actual code

Estimated effort: 3 to 5 days

## Phase 1 — CI/build/lint/typecheck/test cleanup

Objective: make the repository mechanically reliable.

Deliverables:

- lint passes
- typecheck passes
- tests run
- frontend builds
- functions build
- Node 20 standardization

Acceptance criteria:

- every PR has required checks
- root and functions install cleanly
- no production work proceeds while CI is red

Estimated effort: 1 to 2 weeks

## Phase 2 — Secrets and ingress hardening

Objective: remove credential and ingress risk.

Likely files:

- `functions/src/dispatcher.ts`
- `functions/src/integrations/channel-aggregator.ts`
- `src/app/api/speedypay/payout/route.ts`
- `functions/src/partners/speedypay-webhook.ts`
- scripts and env docs

Deliverables:

- no hard-coded provider fallbacks
- Secret Manager usage
- strict CORS and methods
- safe logging
- tracked secret cleanup plan

Estimated effort: 1 to 2 weeks

## Phase 3 — Cash-in and cash-out rebuild

Objective: make money states safe.

Likely files:

- `functions/src/transactions/handlers.ts`
- `functions/src/admin/handlers.ts`
- new Money Core service files
- provider adapters

Deliverables:

- cash-in pending confirmation
- cash-out hold model
- provider-confirmed completion
- failure and reversal paths
- state-machine tests

Estimated effort: 2 to 4 weeks

## Phase 4 — Ledger and reconciliation

Objective: make accounting provable.

Deliverables:

- shared ledger service
- ledger entries for all balance-moving flows
- daily reconciliation jobs
- reconciliation reports
- imbalance alerts

Estimated effort: 3 to 4 weeks

## Phase 5 — Provider and webhook hardening

Objective: make provider events safe and idempotent.

Deliverables:

- provider adapter boundary
- webhook event store
- replay protection
- status normalization
- provider settlement import

Estimated effort: 2 to 3 weeks

## Phase 6 — Observability and incident response

Objective: make the system operable.

Deliverables:

- dashboards
- alert thresholds
- runbooks
- stuck transaction monitoring
- incident response process

Estimated effort: 1 to 2 weeks

## Phase 7 — Staging certification

Objective: prove readiness without real money.

Deliverables:

- isolated staging project
- sandbox provider tests
- emulator tests
- reconciliation dry runs
- staging sign-off

Estimated effort: 2 weeks

## Phase 8 — Production go/no-go

Objective: decide using evidence, not optimism.

Deliverables:

- go/no-go checklist complete
- production secrets rotated
- release tag
- rollback plan
- sign-off record

Acceptance criteria:

- all P0/P1 issues closed
- CI green
- staging certified
- reconciliation clean
- incident runbook ready

Estimated effort: 1 week
