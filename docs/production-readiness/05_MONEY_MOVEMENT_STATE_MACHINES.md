# 05 Money Movement State Machines

## Core rule

Speedcash must not treat a user request, an admin approval, or a provider request acceptance as final settlement. Final money state requires a trusted backend transition, idempotency, provider evidence where applicable, balanced ledger entries, and audit logging.

## Cash-in lifecycle

Current issue: cash-in must not create spendable wallet balance from user-submitted reference data.

Target states:

```text
CREATED -> PENDING_PROVIDER_CONFIRMATION -> PROVIDER_CONFIRMED -> CREDITED
CREATED -> PENDING_PROVIDER_CONFIRMATION -> FAILED
CREATED -> PENDING_PROVIDER_CONFIRMATION -> EXPIRED
CREDITED -> DISPUTED -> CREDITED
CREDITED -> DISPUTED -> REVERSED
```

Allowed transition triggers:

| Transition | Trigger |
|---|---|
| CREATED to PENDING_PROVIDER_CONFIRMATION | authenticated user request |
| PENDING_PROVIDER_CONFIRMATION to PROVIDER_CONFIRMED | verified provider webhook or trusted status poll |
| PROVIDER_CONFIRMED to CREDITED | Money Core writes ledger and wallet projection |
| PENDING_PROVIDER_CONFIRMATION to FAILED | provider failure event |
| PENDING_PROVIDER_CONFIRMATION to EXPIRED | scheduled timeout job |
| CREDITED to DISPUTED | provider dispute event |
| DISPUTED to REVERSED | dispute loss or provider reversal |

Forbidden transitions:

- CREATED to CREDITED
- PENDING_PROVIDER_CONFIRMATION to CREDITED without provider confirmation
- FAILED to CREDITED without a new verified provider event
- EXPIRED to CREDITED without late-settlement evidence

Ledger rule:

- Cash-in request: transaction/event record only; no financial credit.
- Confirmed cash-in: provider clearing leg and user available-wallet leg must balance.

## Cash-out lifecycle

Target states:

```text
CREATED -> PENDING_APPROVAL -> APPROVED -> HELD -> SUBMITTED_TO_GATEWAY -> PROCESSING -> COMPLETED
PENDING_APPROVAL -> REJECTED
SUBMITTED_TO_GATEWAY -> FAILED -> REVERSED
PROCESSING -> FAILED -> REVERSED
HELD -> EXPIRED -> REVERSED
```

Allowed transition triggers:

| Transition | Trigger |
|---|---|
| CREATED to PENDING_APPROVAL | authenticated user request |
| PENDING_APPROVAL to REJECTED | admin review |
| PENDING_APPROVAL to APPROVED | admin review |
| APPROVED to HELD | Money Core reserves available balance |
| HELD to SUBMITTED_TO_GATEWAY | provider adapter request |
| SUBMITTED_TO_GATEWAY to PROCESSING | provider acceptance |
| PROCESSING to COMPLETED | verified provider success |
| FAILED or EXPIRED to REVERSED | Money Core releases hold |

Ledger rule:

- Cash-out hold: move user available balance to user hold balance.
- Provider success: move user hold to provider settlement clearing.
- Provider failure: move user hold back to user available balance.

## P2P lifecycle

Target states:

```text
CREATED -> VALIDATED -> COMPLETED
CREATED -> FAILED
COMPLETED -> REVERSED
```

Requirements:

- sender and receiver must be different users
- sender available balance must be sufficient
- receiver wallet must exist
- idempotency key required
- transaction and ledger entries written atomically

## Remittance lifecycle

Target states:

```text
QUOTE_CREATED -> QUOTE_CONFIRMED -> HELD -> SUBMITTED_TO_PROVIDER -> PROCESSING -> COMPLETED
QUOTE_CREATED -> EXPIRED
PROCESSING -> FAILED -> REVERSED
```

Requirements:

- quote ID
- quote expiry
- rate source
- spread
- fee
- AML/sanctions hooks
- destination validation
- provider proof before completion

## Buy load, bill pay, and partner payout

These must follow the same pattern:

```text
CREATED -> HELD -> SUBMITTED_TO_PROVIDER -> PROCESSING -> COMPLETED
PROCESSING -> FAILED -> REVERSED
```

Provider request acceptance is not completion. Completion requires verified fulfillment, webhook evidence, poll evidence, or reconciled settlement evidence.

## Universal acceptance criteria

- Every state transition is explicitly validated.
- Every state transition is idempotent.
- Every balance mutation writes balanced ledger entries.
- Every provider event is stored and deduplicated.
- Every final state can be explained from audit logs and reconciliation records.
