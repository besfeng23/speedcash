# 14 Production Go / No-Go Checklist

## Current verdict

No-go for production until every P0 item is complete and staging evidence exists.

## Code

- [ ] root install passes
- [ ] functions install passes
- [ ] lint passes
- [ ] typecheck passes
- [ ] unit tests pass
- [ ] frontend build passes
- [ ] functions build passes
- [ ] no branch drift or stale report confusion

## Security

- [ ] provider configuration fails closed
- [ ] no hard-coded credential fallbacks
- [ ] tracked environment files removed
- [ ] historical exposed values rotated
- [ ] admin actions audited
- [ ] partner ownership enforced server-side
- [ ] Firestore rules tested
- [ ] Storage rules tested

## Money movement

- [ ] cash-in does not credit before provider proof
- [ ] cash-out uses available and hold states
- [ ] provider success is required before completion
- [ ] failure and reversal paths exist
- [ ] P2P is idempotent and ledger-backed
- [ ] remittance uses quotes and expiry
- [ ] bill pay and load purchase require provider proof

## Ledger

- [ ] all balance-changing flows write balanced entries
- [ ] ledger entries are append-only
- [ ] wallet balances are projections or reconciled to ledger
- [ ] reversals reference original transactions
- [ ] ledger imbalance creates alert

## Provider and webhook

- [ ] provider adapters normalized
- [ ] webhook signatures verified
- [ ] duplicate provider events ignored
- [ ] provider statuses normalized
- [ ] provider settlement reports ingested
- [ ] dead-letter handling exists

## Reconciliation

- [ ] daily reconciliation job runs
- [ ] wallet projections match ledger totals
- [ ] provider clearing balances reconcile
- [ ] variance report generated
- [ ] unexplained variance escalates

## CI/CD

- [ ] Node 20 standardized
- [ ] lockfiles committed
- [ ] CI required on PRs
- [ ] staging deploy gated
- [ ] production deploy manual
- [ ] rollback plan exists

## Staging certification

- [ ] sandbox provider tests pass
- [ ] webhook replay tests pass
- [ ] cash-in/cash-out lifecycle tested
- [ ] reconciliation dry run clean
- [ ] operator runbook tested

## Documentation

- [ ] README links to production-readiness docs
- [ ] API docs match Firebase-token dispatcher model
- [ ] SDK docs updated or retired
- [ ] partner docs updated
- [ ] runbooks written

## Final production decision

Production is allowed only when every checkbox above is complete with evidence. If any money, ledger, provider, webhook, reconciliation, or CI item is incomplete, the decision is no-go.
