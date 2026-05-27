# 01 Current Architecture Map

## Current implementation

Speedcash is a Firebase-first fintech prototype with a Next.js frontend, Firebase Authentication, Firestore, Firebase Storage, Firebase Cloud Functions, Next.js API routes, and multiple provider-integration paths.

## Component inventory

| Area | Current component | Current role | Production concern |
|---|---|---|---|
| Frontend | `src/app/**` | Consumer, admin, partner, KYC, send, remit, withdraw screens | Good shell; backend contracts and tests still incomplete |
| Shared UI | `src/components/**` | Dashboards, activity feed, AI chat, admin/partner widgets | Mostly UI; needs contract-safe types |
| Auth | Firebase Auth + `functions/src/auth/triggers.ts` | Provisions user profile and PHP/KRW wallets | Good baseline; backend ownership checks must remain source of truth |
| Client API | `src/hooks/useApi.ts` | Sends authenticated action requests to dispatcher | Needs shared typed contracts |
| Primary backend | `functions/src/dispatcher.ts` | Single HTTP dispatcher for many action names | Too broad; ingress/CORS and logging need hardening |
| Admin backend | `functions/src/admin/handlers.ts` | Admin stats, users, partners, cash-out review | Better after hardening; still needs settlement lifecycle integration |
| Money handlers | `functions/src/transactions/handlers.ts` | P2P, cash-in, cash-out, remittance, load, bills | Main production blocker |
| KYC/KYB | `functions/src/kyc/**`, storage paths | User and partner verification workflows | Needs stronger document audit/retention/malware scanning |
| Partner flows | `functions/src/partners/**`, `src/app/partner/**` | Partner onboarding, payout/test flows, teams | Needs partner settlement ledger and backend ownership checks |
| Provider adapters | `functions/src/integrations/**` | Channel aggregator, gateway abstractions, eMango files | Secrets and provider contract risk |
| SpeedyPay route | `src/app/api/speedypay/payout/route.ts` | Direct payout integration path | Must not bypass Money Core/provider adapter model |
| Webhooks | integration and partner webhook files | Provider event receipt | Needs idempotent state engine |
| Ledger | `functions/src/ledger/entries.ts` | Basic ledger entry helper and balance assertion | Not wired across flows |
| Rules | `firestore.rules`, `storage.rules` | Client perimeter controls | Good direction; needs emulator test evidence |
| CI/CD | `.github/workflows/ci.yml`, lockfiles | Build/test/deploy lane | Must be green, Node 20 aligned, and deterministic |

## Trust boundaries today

1. Browser to Next.js frontend.
2. Frontend to `cpayDispatcher` or Next.js API routes.
3. Dispatcher to Firestore, Storage, integrations, and handler modules.
4. Provider adapter to external payment providers.
5. Webhook ingress from public provider callbacks.
6. Admin/partner/consumer role boundary.
7. Firestore/Storage rules boundary for client access.

## Architectural drift

The system currently has two backend ingress patterns:

1. Cloud Functions `cpayDispatcher`.
2. Next.js `src/app/api/**` server routes.

This must be rationalized so that money movement uses one controlled Money Core and one provider abstraction, not scattered direct route logic.

## Current source-of-truth problem

The code is currently the real source of truth. Some docs still describe older CPay/API-key patterns that do not match the actual Firebase ID-token dispatcher model. Those docs must be rewritten before partner or investor due diligence.
