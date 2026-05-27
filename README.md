# Speedcash - Controlled Fintech Platform Prototype

Speedcash is a pre-production fintech application for wallets, user onboarding, partner operations, admin review workflows, and staged payment integrations.

This repository is **not production-ready for real money movement yet**. Treat it as a strong prototype / staging hardening codebase until the safety gates below are complete.

## Current Status

| Area | Status | Notes |
| --- | --- | --- |
| Authentication | Functional demo | Firebase Auth is wired. New-user provisioning is implemented through an auth trigger. |
| User wallets | Staging hardening | Client-side wallet writes are blocked by Firestore rules. Backend transaction correctness still needs full ledger/reconciliation proof. |
| P2P transfers | Prototype | Existing backend flow works structurally but still needs ledger-backed invariant tests. |
| Cash-in | Unsafe until provider-confirmed | Do not credit wallets from user-submitted reference data. Provider callback/polling confirmation is required before production. |
| Cash-out | Unsafe until provider-confirmed | Do not mark payouts completed from admin approval alone. Gateway submission, status polling/callbacks, and failure/reversal handling are required. |
| Remittance | Sandbox only | Fixed-rate/remittance assumptions must be replaced by quote IDs, expiry, spread/fee capture, and compliance checks. |
| Admin dashboard | Functional demo | Good structure, but stats/contracts and permission tests must be hardened. |
| Partner portal | Functional demo | Partner route now requires partner/admin/superadmin role. Backend ownership checks must remain the source of truth. |
| AI assistant | Optional demo | Must not be used for compliance decisions or transaction authorization. |
| External integrations | Disabled for production | Enable only after provider sandbox tests, callback verification, idempotency, and reconciliation pass. |

## Non-Negotiable Production Safety Gates

Speedcash must not be treated as live fintech until all of these are done:

1. Rotate every secret that was ever committed.
2. Rewrite Git history or assume exposed credentials are permanently compromised.
3. Store real secrets in Google Secret Manager, not committed config files.
4. Deploy locked Firestore and Storage rules.
5. Use an immutable ledger for every balance mutation.
6. Make cash-in pending until provider confirmation.
7. Make cash-out pending/submitted/processing until provider confirmation.
8. Make webhook processing idempotent and state-transition aware.
9. Add daily reconciliation for balances, ledger entries, failed transactions, and settlement accounts.
10. Add emulator integration tests for wallet, cash-in, cash-out, KYC, roles, webhooks, and insufficient-balance cases.
11. Make CI block merges on typecheck, lint, tests, frontend build, and functions build.
12. Verify staging with sandbox provider credentials before any production credential is connected.

## Development Requirements

- Node.js 20+
- npm
- Firebase CLI
- Firebase project access
- Secret Manager access for non-local environments

## Local Setup

```bash
npm install
cd functions && npm install && cd ..
cp env.example .env.local
npm run dev
```

`env.example` contains placeholders only. Do not put live keys, webhook secrets, signing secrets, or gateway credentials into committed files.

## Common Commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run build:functions
```

## Deployment Notes

Use Firebase App Hosting or a single clearly chosen production hosting target. Do not mix contradictory static `.next` hosting assumptions with SSR/App Hosting deployment paths.

For production-like environments:

- Use Node 20 everywhere.
- Set `NEXT_PUBLIC_API_BASE_URL` to the full dispatcher URL or a base Cloud Functions URL that the app can normalize to `/cpayDispatcher`.
- Set `CORS_ALLOWED_ORIGINS` to explicit trusted origins only.
- Keep real-money feature flags disabled until provider confirmations and reconciliation are proven.

## Security Notes

- Storage is scoped by owner path for KYC/KYB files.
- Firestore blocks client writes to wallet, transaction, ledger, cashout, webhook, FX quote, and log records.
- Users can request actions through authenticated backend functions; they must not mutate money records directly.
- Logs must not contain full account numbers, mobile numbers, signatures, tokens, or provider payloads.

## Project Structure

```text
src/                 Next.js frontend
functions/           Firebase Cloud Functions
docs/                Architecture and readiness notes
scripts/             Utility scripts
firestore.rules      Firestore access rules
storage.rules        Cloud Storage access rules
apphosting.yaml      Firebase App Hosting configuration
```

## Bottom Line

Speedcash has useful bones. It is not production fintech yet. The next correct move is boring discipline: secrets rotated, rules deployed, ledger added, provider-confirmed state machines implemented, reconciliation tested, and CI enforced.
