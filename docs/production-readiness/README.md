# Speedcash Production-Readiness Pack

This folder is the operating plan for turning Speedcash from a pre-production fintech prototype into a production-reviewable platform.

Start here:

1. [00 Executive Verdict](00_EXECUTIVE_VERDICT.md)
2. [01 Current Architecture Map](01_CURRENT_ARCHITECTURE_MAP.md)
3. [02 Target Architecture](02_TARGET_ARCHITECTURE.md)
4. [03 Infrastructure and Environments](03_INFRASTRUCTURE_AND_ENVIRONMENTS.md)
5. [04 Authorization and Security](04_AUTHORIZATION_AND_SECURITY.md)
6. [05 Money Movement State Machines](05_MONEY_MOVEMENT_STATE_MACHINES.md)
7. [06 Double-Entry Ledger Model](06_DOUBLE_ENTRY_LEDGER_MODEL.md)
8. [07 Provider and Webhook Architecture](07_PROVIDER_AND_WEBHOOK_ARCHITECTURE.md)
9. [08 CI/CD and DevOps](08_CI_CD_AND_DEVOPS.md)
10. [09 Observability and Runbooks](09_OBSERVABILITY_AND_RUNBOOKS.md)
11. [10 Compliance Readiness](10_COMPLIANCE_READINESS.md)
12. [11 Test Strategy](11_TEST_STRATEGY.md)
13. [12 90-Day Production Roadmap](12_90_DAY_ROADMAP.md)
14. [13 Prioritized Production Backlog](13_PRIORITIZED_BACKLOG.md)
15. [14 Production Go/No-Go Checklist](14_PRODUCTION_GO_NO_GO_CHECKLIST.md)

## Current verdict

No production deployment until the go/no-go checklist is complete with evidence.

## How to use this pack

1. Convert the backlog into GitHub issues.
2. Execute phases in roadmap order.
3. Keep CI green before money-flow work.
4. Fix secrets and ingress before provider testing.
5. Rebuild cash-in/cash-out state machines before real provider credentials.
6. Wire ledger and reconciliation before staging certification.
