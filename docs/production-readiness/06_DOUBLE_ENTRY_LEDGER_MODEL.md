# 06 Double-Entry Ledger Model

## Production rule

Wallet balances must be projections of an append-only ledger. Direct balance changes without a matching ledger transaction are not production-safe.

## Required ledger records

- `ledger_transactions`: one logical financial event.
- `ledger_entries`: the accounting legs for that event.
- `idempotency_keys`: replay and duplicate protection.
- `balance_snapshots`: periodic wallet projections.
- `reconciliation_reports`: daily financial control evidence.

## Required account groups

- user available wallet accounts
- user hold wallet accounts
- provider clearing accounts
- fee revenue accounts
- suspense accounts
- reversal accounts

## Required invariants

1. Every financial event must balance by currency.
2. Ledger entries are append-only.
3. Wallet documents are projections, not source of truth.
4. A final transaction must have provider proof or reconciliation proof.
5. A reversal must reference the original event.
6. Any unexplained variance is a Sev 1 incident.

## Rail treatment

| Flow | Required production treatment |
|---|---|
| P2P | move value from sender available to receiver available |
| Cash-in request | record request only; do not credit user yet |
| Cash-in confirmation | credit user only after trusted provider proof |
| Cash-out request | reserve value into hold state |
| Cash-out success | release hold to provider clearing |
| Cash-out failure | return hold to available state |
| Remittance | separate principal, provider clearing, and fee revenue |
| Bill pay / load | reserve value, submit to provider, finalize only with proof |

## Acceptance criteria

- All balance-moving handlers use the ledger service.
- Unit tests reject unbalanced events.
- Emulator tests prove wallet and ledger are written together.
- Daily reconciliation compares wallet projections, ledger totals, holds, and provider reports.
- No production deploy until these checks pass in staging.
