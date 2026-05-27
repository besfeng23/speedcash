# 02 Target Production Architecture

## Target principle

Speedcash must become a controlled wallet and payment platform where every money movement is authenticated, authorized, idempotent, provider-confirmed, ledger-backed, observable, and reconcilable.

## C4 Context diagram

```text
[Consumer User] ---> [Speedcash Web App]
[Partner Operator] ---> [Speedcash Partner Portal]
[Admin / Finance Ops] ---> [Speedcash Admin Console]

[Speedcash Platform] ---> [Firebase Auth]
[Speedcash Platform] ---> [Firestore / Ledger Store]
[Speedcash Platform] ---> [Cloud Storage KYC/KYB]
[Speedcash Platform] ---> [Secret Manager]
[Speedcash Platform] ---> [Payment Providers]
[Speedcash Platform] ---> [Monitoring / Alerting]
[Speedcash Platform] ---> [BigQuery / Reporting]
```

## C4 Container diagram

```text
Browser / Mobile Web
  -> Firebase App Hosting / Next.js
  -> Authenticated API Transport
  -> API Gateway / cpayDispatcher
  -> Domain Services
       - User Service
       - KYC/KYB Service
       - Wallet Service
       - Transaction Service
       - Ledger Service
       - Payout Service
       - Provider Adapter Service
       - Webhook Service
       - Reconciliation Service
       - Notification Service
  -> Firestore / SQL Ledger / Storage
  -> External Providers
```

## C4 Component diagram

```text
cpayDispatcher
  -> auth middleware
  -> role/ownership middleware
  -> action router
  -> service layer

Transaction Service
  -> cashIn.createRequest
  -> cashIn.confirmProviderEvent
  -> cashOut.createRequest
  -> cashOut.approve
  -> cashOut.submitToProvider
  -> cashOut.confirmProviderEvent
  -> p2p.execute
  -> remittance.quote
  -> remittance.confirm

Ledger Service
  -> createLedgerTransaction
  -> appendBalancedEntries
  -> assertBalanced
  -> projectWalletBalance
  -> reconcileWallets

Provider Adapter Service
  -> ChannelAggregatorAdapter
  -> SpeedyPayAdapter
  -> EMangoAdapter
  -> ProviderHealthRegistry

Webhook Service
  -> verifySignature
  -> normalizeProviderEvent
  -> dedupeEvent
  -> applyStateTransition
  -> emitAuditLog
```

## Service boundaries

- UI must never mutate wallet balances directly.
- API layer must only authenticate, authorize, validate, and dispatch.
- Money Core owns state transitions and ledger writes.
- Provider adapters own provider communication only, not ledger decisions.
- Webhook processors normalize events and call Money Core; they do not mutate balances directly.
- Reconciliation service verifies truth after the fact and reports deltas.

## Trust boundaries

1. Public browser boundary.
2. Authenticated API boundary.
3. Admin/partner/user RBAC boundary.
4. Money Core boundary.
5. Provider network boundary.
6. Ledger immutability boundary.
7. Reconciliation/reporting boundary.
8. Secrets and privileged service-account boundary.

## Required production invariant

No wallet balance may change unless:

1. the caller is trusted backend code,
2. the transaction state transition is valid,
3. the operation is idempotent,
4. balanced ledger entries are written in the same unit of work, and
5. the change is observable through audit and reconciliation.
