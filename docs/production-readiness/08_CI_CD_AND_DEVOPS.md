# 08 CI/CD and DevOps

## Rule

Do not deploy production unless CI is green, lockfiles are deterministic, staging has passed, and a manual production approval exists.

## Branch strategy

- `main`: protected integration branch
- `feature/*`: normal implementation
- `hardening/*`: production-readiness remediation
- `release/*`: staging release candidates
- version tags: production candidates

## Required PR checks

- root install
- lint
- typecheck
- unit tests
- frontend build
- functions install
- functions tests
- functions build
- Firestore rules tests
- Storage rules tests
- dependency scan
- credential hygiene scan

## Runtime standard

- Node 20 for root app, functions, and App Hosting.
- Root lockfile committed.
- Functions lockfile committed.
- CI uses clean installs after lockfiles are valid.

## Recommended jobs

```text
verify-root
verify-functions
rules-tests
emulator-integration-tests
credential-hygiene
build-artifacts
deploy-staging
sandbox-certification
deploy-production
```

## Deployment gates

### Staging

Requires green verification, rules tests, build artifacts, and manual approval.

### Production

Requires tagged release, staging certification, provider sandbox evidence, reconciliation dry run, runbook link, and explicit go/no-go approval.

## Rollback

Rollback must restore the last known good web/backend release, pause money features if integrity is uncertain, preserve logs, and run reconciliation before replaying or correcting transactions.

## Acceptance criteria

- CI blocks merge on lint, typecheck, test, or build failure.
- Production deploy cannot run automatically from an unreviewed branch.
- Money-moving code changes require emulator and state-machine tests.
- Release notes include migration, rollback, and feature-flag plan.
