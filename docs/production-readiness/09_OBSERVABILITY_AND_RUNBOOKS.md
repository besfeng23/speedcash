# 09 Observability and Runbooks

## Purpose

Speedcash production operations must prove what happened to every transaction, who initiated it, which backend service processed it, which provider event affected it, and whether the ledger remains balanced.

## Required telemetry

- request ID
- trace ID
- actor UID and role
- action name
- transaction ID
- ledger transaction ID
- provider name
- provider reference
- normalized status
- duration
- severity
- environment

## Dashboards

Required dashboards:

1. transaction volume by rail and status
2. cash-in pending age
3. cash-out hold age
4. provider success and failure ratio
5. webhook processing status
6. duplicate provider event attempts
7. ledger imbalance by currency
8. reconciliation variance
9. admin actions
10. function error rate

## Alert classes

| Signal | Severity |
|---|---|
| ledger imbalance | Sev 1 |
| wallet credit without provider proof | Sev 1 |
| duplicate event changes financial state | Sev 1 |
| stuck cash-out hold beyond SLA | Sev 2 |
| provider failure spike | Sev 2 |
| repeated webhook verification failure | Sev 2 |
| audit write failure | Sev 2 |

## Incident runbook

1. Pause affected money feature flags.
2. Preserve audit and provider event records.
3. Stop automated replay if duplicated settlement is possible.
4. Run reconciliation for the affected period.
5. Identify impacted transaction IDs.
6. Decide whether to replay, reverse, manually correct, or escalate to provider.
7. Record timeline, root cause, customer impact, and corrective actions.

## Reconciliation runbook

1. Compare wallet projections with ledger-derived balances.
2. Compare provider clearing totals with provider reports.
3. Identify open holds and pending states.
4. Mark each variance as explained or unexplained.
5. Escalate unexplained variance immediately.

## Acceptance criteria

- Every money event has traceable IDs.
- Dashboards exist before staging certification.
- Alerts exist before production go/no-go.
- Runbooks are linked from release approvals.
