# 13 Prioritized Production Backlog

This backlog should be executed in order:

1. CI and build truth.
2. Credential and ingress hardening.
3. Cash-in and cash-out state-machine rebuild.
4. Ledger integration across all balance-moving flows.
5. Provider event processing and replay safety.
6. Daily reconciliation.
7. Observability and runbooks.
8. Staging certification.
9. Production go/no-go review.

No production release is allowed until the P0 work above is complete, tested, and signed off.
