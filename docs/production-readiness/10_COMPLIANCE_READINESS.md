# 10 Compliance Readiness

## Scope

This document is architecture readiness only. It is not legal advice and does not certify regulatory compliance.

## Control themes

Speedcash should be designed around these fintech control themes:

- customer identification
- KYC and KYB review
- transaction limits by tier
- auditability
- immutable accounting evidence
- provider settlement proof
- privacy and data protection
- internal admin controls
- vendor/provider due diligence
- incident response and reporting

## KYC and KYB

Required controls:

- KYC status tied to transaction limits.
- KYB status tied to partner capabilities.
- Admin review actions logged.
- Document access logged.
- Rejection reasons retained.
- Retention and deletion policy documented.

## AML and sanctions hooks

Architecture must support:

- sender screening
- recipient screening
- destination-country checks
- velocity limits
- suspicious pattern flags
- manual review queues
- enhanced due diligence flags

## Transaction limits

Example model:

| Tier | Capabilities |
|---|---|
| BASIC | limited profile, restricted transaction limits |
| VERIFIED | higher limits, cash-in/out allowed after controls pass |
| ENHANCED | larger limits, manual review rules, extra monitoring |

## PCI-DSS scope minimization

Speedcash should avoid storing cardholder data. If card rails are introduced, use provider-hosted payment pages or tokenized provider flows to keep PCI scope limited.

## Internal controls

- dual approval for high-value payouts
- role change monitoring
- admin action logs
- emergency feature kill switches
- reconciliation sign-off
- production change approvals

## Acceptance criteria

- KYC tier maps to limits in code and tests.
- Every admin review action is auditable.
- Money movement has daily reconciliation evidence.
- Provider onboarding checklist exists.
- Incident response playbook exists.
- Compliance docs clearly say architecture readiness, not legal certification.
