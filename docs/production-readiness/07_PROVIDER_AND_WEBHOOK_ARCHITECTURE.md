# 07 Provider and Webhook Architecture

## Target design

All provider communication must go through a provider abstraction layer. No UI, admin page, or scattered API route should call provider rails directly.

## Provider adapter interface

Each provider adapter must expose:

- `createTransferRequest`
- `getTransferStatus`
- `verifyWebhookSignature`
- `normalizeWebhookEvent`
- `getHealth`
- `parseSettlementFile`

## Provider adapters

| Adapter | Purpose | Rule |
|---|---|---|
| Channel Aggregator | Multi-rail transfer integration | no fallback credentials, redacted logs |
| SpeedyPay | SpeedyPay payout/webhook integration | must not bypass Money Core |
| eMango | legacy or auxiliary microservice | either formalize or remove from production path |

## Provider capability registry

Maintain a provider registry:

```text
providerId
supportedRails
supportedCurrencies
supportsWebhook
supportsPolling
settlementFileFormat
sandboxEndpoint
productionEndpoint
secretNames
slaMinutes
statusMap
```

## Provider request records

Every outbound provider call creates a `provider_requests/{id}` document with:

- internal transaction ID
- provider ID
- provider request ID
- idempotency key
- normalized request fields
- redacted payload hash
- status
- createdAt
- updatedAt

## Webhook events

Every webhook creates a `webhook_events/{id}` record before state mutation:

- provider
- providerEventId
- receivedAt
- signatureVerified
- normalizedType
- normalizedStatus
- internalTransactionId
- payloadHash
- processingStatus
- errorMessage

## Idempotency

- Deduplicate by provider event ID when available.
- Otherwise deduplicate by deterministic hash of provider, transaction reference, status, amount, currency, and timestamp window.
- Never let duplicate webhook events create duplicate ledger entries.

## State transition rule

Webhooks do not write wallet balances directly. They call the Money Core state transition service, which validates the current state, target state, idempotency key, and ledger entries.

## Dead-letter queue

Invalid, malformed, duplicate-changing, or unverifiable webhook events move to a dead-letter queue and trigger alerts.

## Acceptance criteria

- No provider adapter has hard-coded fallback secrets.
- Every provider event is stored before processing.
- Every provider event is idempotent.
- All provider statuses are normalized.
- Provider acceptance is not treated as final completion.
- Settlement file ingestion reconciles provider reports against ledger state.
