# Speedcash Hardening Status

Last updated: 2026-05-27

## Production-readiness documentation pack

A full production-readiness documentation pack now exists under:

```text
docs/production-readiness/
```

Start with:

- `docs/production-readiness/README.md`
- `docs/production-readiness/00_EXECUTIVE_VERDICT.md`
- `docs/production-readiness/05_MONEY_MOVEMENT_STATE_MACHINES.md`
- `docs/production-readiness/12_90_DAY_ROADMAP.md`
- `docs/production-readiness/14_PRODUCTION_GO_NO_GO_CHECKLIST.md`

This docs pack is the current operating plan for moving Speedcash from pre-production prototype to production-reviewable fintech platform.

## What has landed on `main`

- App metadata renamed from CPay Investor Demo to Speedcash.
- Root `package.json` renamed to `speedcash`.
- `functions/package.json` renamed to `speedcash-functions`.
- `env.example` sanitized with placeholders only.
- `apphosting.yaml` sanitized and moved toward Secret Manager references.
- `.gitignore` now blocks local environment files.
- Firebase Storage rules changed from authenticated wildcard access to owner/role scoped KYC/KYB access with default deny.
- Firestore rules block direct client writes to wallets, transactions, ledger entries, cashout requests, logs, webhook events, and FX quotes.
- Partner layout now requires `partner`, `admin`, or `superadmin` role.
- Frontend API hook normalizes dispatcher URL and redacts sensitive logs.
- CORS proxy restricts origins/methods and stops logging response bodies.
- Auth trigger provisions user profile and PHP/KRW wallets on signup.
- Auth trigger is exported from `functions/src/index.ts`.
- Admin withdrawal approval no longer marks payout as `COMPLETED`; it moves to provider-submission status.
- Admin dashboard stats now return both `pendingKyc` / `pendingWithdrawals` and legacy `pendingKycCount` / `pendingWithdrawalsCount`.
- Ledger helper added under `functions/src/ledger/entries.ts`.
- Root Jest command no longer uses `--passWithNoTests`.
- Production-readiness architecture docs added under `docs/production-readiness/`.

## Current blockers

### 1. Build / CI truth

Confirm the active branch has:

- valid root `package-lock.json`
- valid functions lockfile
- `.github/workflows/ci.yml`
- Node 20 alignment
- green lint, typecheck, tests, frontend build, and functions build

### 2. Transaction handler still needs production money-state patching

`functions/src/transactions/handlers.ts` still needs the cash-in fix:

- `initiateCashInHandler` must not credit wallet balance immediately.
- It must create `PENDING_PROVIDER_CONFIRMATION`.
- Wallet credit must happen only through trusted provider confirmation.
- Provider reference IDs must be unique.
- P2P should be wired to immutable ledger entries.

### 3. Dispatcher backend CORS still needs local patching

`functions/src/dispatcher.ts` still needs direct backend method/origin hardening:

- Allow only `POST` and `OPTIONS`.
- Use `CORS_ALLOWED_ORIGINS`.
- Remove wildcard CORS.
- Stop logging sensitive request data.

The frontend proxy was patched, but the backend dispatcher itself still needs a local patch.

### 4. Channel aggregator still needs local patching

`functions/src/integrations/channel-aggregator.ts` still needs:

- Removal of fallback merchant credentials.
- Fail-closed behavior when required env vars are missing.
- Log redaction for signatures, account numbers, mobile numbers, account names, emails, headers, and provider payloads.

### 5. Provider and webhook control plane is incomplete

Speedcash still needs:

- webhook event persistence
- provider event dedupe
- idempotent state transitions
- provider status normalization
- dead-letter handling
- provider settlement file ingestion

### 6. Reconciliation is missing

Speedcash still needs:

- scheduled reconciliation jobs
- wallet vs ledger comparison
- provider clearing comparison
- variance reports
- escalation for unexplained variance

## Required local verification commands

After the blocked local patches are applied:

```bash
npm install
npm run typecheck
npm run lint
npm test -- --watchAll=false
npm run build
cd functions && npm install && npm run build
```

## Production warning

Do not deploy this as live fintech yet. The repo is hardened compared with the starting point, but real production readiness still requires:

- rotated secrets
- git history cleanup or permanent compromise assumption
- green CI
- provider-confirmed cash-in/cash-out state machines
- ledger coverage across all balance-moving flows
- webhook idempotency
- daily reconciliation
- staging test evidence
- production go/no-go checklist completion
