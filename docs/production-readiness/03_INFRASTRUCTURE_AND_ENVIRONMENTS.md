# 03 Infrastructure and Environments

## Environment layout

Use three isolated Firebase/GCP projects:

| Environment | Project | Purpose | Real money? |
|---|---|---|---|
| Development | `speedcash-dev` | Local/dev testing, emulator work, mock providers | No |
| Staging | `speedcash-stg` | Provider sandbox certification and release candidate validation | No |
| Production | `speedcash-prd` | Live operations after go/no-go approval | Yes, only after controls pass |

## Hosting

- Use Firebase App Hosting for the Next.js app.
- Keep environment-specific `apphosting.yaml` values.
- Never put production secrets into committed config.
- Production deploys must only occur from protected release tags.

## Cloud Functions

Use Cloud Functions for:

- `cpayDispatcher`
- auth provisioning trigger
- webhook ingress functions
- scheduled reconciliation jobs
- provider polling jobs
- settlement import jobs
- alerting/monitoring support jobs

All functions must standardize on Node 20.

## Firestore

Firestore remains valid for operational transaction documents, user state, KYC records, webhook events, admin queues, and audit events.

Required collections:

```text
users/{uid}
users/{uid}/wallets/{currency}
transactions/{transactionId}
cashout_requests/{transactionId}
ledger_transactions/{ledgerTransactionId}
ledger_entries/{ledgerEntryId}
idempotency_keys/{key}
webhook_events/{eventId}
provider_requests/{providerRequestId}
provider_settlements/{settlementId}
reconciliation_reports/{reportId}
audit_logs/{logId}
system_logs/{logId}
rate_limits/{key}
```

## Storage

Use separate logical paths:

```text
kyc/{uid}/...
kyb/{partnerId}/...
reports/{reportId}/...
provider_settlement_files/{provider}/{date}/...
```

Production requirements:

- owner/role scoped access
- malware scanning for uploads
- retention policy
- audit trail for review/download/delete
- no public objects

## Secret Manager

All secrets must live in Secret Manager or Firebase secret parameters:

- provider credentials
- webhook secrets
- signing keys
- encryption keys
- JWT/session secrets
- API credentials
- admin service credentials

Rules:

1. no `process.env.X || hardcoded_default`
2. fail closed if required secret is missing
3. least privilege per function
4. rotate immediately if ever committed
5. separate dev/stg/prd secrets

## IAM and service accounts

Create separate service accounts:

| Service account | Permissions |
|---|---|
| frontend-runtime | minimal app runtime access |
| dispatcher-runtime | Firestore transaction read/write, audit log write |
| webhook-runtime | webhook events, transaction state transitions, ledger write |
| reconciliation-runtime | ledger/transactions/provider settlement read/write, reports write |
| admin-tools-runtime | restricted admin operations |
| deployer-ci | deployment only, no broad owner role |

## Feature flags / kill switches

Required flags:

```text
ENABLE_PAYMENT_GATEWAYS=false
ENABLE_CASH_IN=false
ENABLE_CASH_OUT=false
ENABLE_REMITTANCE=false
ENABLE_PARTNER_PAYOUTS=false
ENABLE_PROVIDER_WEBHOOK_PROCESSING=false
AUTO_SETTLEMENT_ENABLED=false
```

Production rule: new money rails ship disabled by default and are enabled only after staging certification.

## Backup and disaster recovery

Minimum plan:

- Firestore scheduled exports.
- Storage lifecycle and backup policy.
- Provider settlement file backups.
- Ledger immutable retention.
- Daily reconciliation reports stored immutably.
- Restore drill at least quarterly.

## Acceptance criteria

- Dev/stg/prd project separation exists.
- All secrets use Secret Manager.
- CI deploys only to staging unless manually approved.
- Production deploy requires tag, green checks, and runbook link.
- Backups and restore drills are documented.
