# Speedcash Hardening Status

Last updated: 2026-05-27

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
- `CI_TEMPLATE.yml` added at repo root because connector writes to `.github/workflows` were blocked.

## Current blockers

### 1. `package-lock.json`

The stale root lockfile still identified the app as `nextn`. It was removed from `main` because the connector could not safely rewrite the full 18k-line lockfile.

Run locally:

```bash
npm install --package-lock-only
```

Then commit the regenerated `package-lock.json`.

### 2. CI workflow placement

`CI_TEMPLATE.yml` exists at repo root. Move it to:

```text
.github/workflows/ci.yml
```

The connector blocked direct creation inside `.github/workflows`.

### 3. Transaction handler still needs local patching

`functions/src/transactions/handlers.ts` still needs the cash-in fix:

- `initiateCashInHandler` must not credit wallet balance immediately.
- It must create `PENDING_PROVIDER_CONFIRMATION`.
- Wallet credit must happen only through trusted provider confirmation.
- Provider reference IDs must be unique.
- P2P should be wired to immutable ledger entries.

The connector repeatedly blocked full-file writes to this file, so patch it locally or through Codex.

### 4. Dispatcher backend CORS still needs local patching

`functions/src/dispatcher.ts` still needs direct backend method/origin hardening:

- Allow only `POST` and `OPTIONS`.
- Use `CORS_ALLOWED_ORIGINS`.
- Remove wildcard CORS.
- Stop logging sensitive request data.

The frontend proxy was patched, but the backend dispatcher itself still needs a local patch.

### 5. Channel aggregator still needs local patching

`functions/src/integrations/channel-aggregator.ts` still needs:

- Removal of fallback merchant credentials.
- Fail-closed behavior when required env vars are missing.
- Log redaction for signatures, account numbers, mobile numbers, account names, emails, headers, and provider payloads.

The connector blocked this full-file rewrite.

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

- Rotated secrets.
- Git history cleanup or permanent compromise assumption.
- Regenerated lockfile.
- CI workflow enabled.
- Provider-confirmed cash-in/cash-out state machines.
- Ledger coverage across all balance-moving flows.
- Webhook idempotency.
- Daily reconciliation.
- Staging test evidence.
