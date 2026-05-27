# 11 Test Strategy

## Purpose

Speedcash needs proof, not assumptions. Production readiness requires automated tests for auth, roles, rules, money-state transitions, provider events, ledger balance, and reconciliation.

## Test layers

- Unit tests for pure helpers and state-transition rules.
- Service tests for Money Core, Ledger Service, Provider Adapter Service, and Webhook Service.
- Firebase emulator tests for Auth, Firestore, Storage, and Functions.
- Provider sandbox tests for each active rail.
- End-to-end staging tests for user, admin, partner, and provider flows.
- Load and recovery tests before production approval.

## Required matrix

| Area | Required proof |
|---|---|
| Auth/RBAC | users, partners, admins, and superadmins can access only allowed resources |
| Firestore rules | clients cannot write wallet, transaction, ledger, cashout, webhook, or log records |
| Storage rules | KYC/KYB files are owner/role scoped |
| Cash-in | request does not create spendable balance before provider proof |
| Cash-out | value moves through approval, hold, provider submission, success/failure, and release states |
| P2P | balanced ledger entries exist for each completed transfer |
| Provider events | duplicate and invalid events do not change financial state |
| Ledger | unbalanced events are rejected |
| Reconciliation | wallet projections match ledger and provider reports |
| CI/CD | lint, typecheck, tests, builds, and rules tests block merge |

## Acceptance criteria

- No money-flow PR merges without state-machine tests.
- No rules change merges without emulator tests.
- No provider integration merges without sandbox fixtures.
- Production go/no-go includes a test evidence summary.
