# 04 Authorization and Security

## Authentication model

Speedcash uses Firebase Auth as the identity provider. The backend must treat Firebase ID tokens as the only trusted user authentication material for app users, partners, and admins.

## Roles

| Role | Purpose | Required controls |
|---|---|---|
| `user` | Consumer wallet user | Own-profile and own-wallet reads only |
| `partner` | Partner operator | Requires `partnerId` custom claim and backend ownership checks |
| `admin` | Operations/admin staff | Can review users, KYC, payouts, support queues |
| `superadmin` | Privileged system administrator | Can manage roles, sensitive config, emergency actions |

## Custom claims

Required claims:

```ts
interface SpeedcashClaims {
  role: 'user' | 'partner' | 'admin' | 'superadmin';
  partnerId?: string;
  kycTier?: 'BASIC' | 'VERIFIED' | 'ENHANCED';
}
```

## Authorization rules

- UI checks are convenience only.
- Backend checks are mandatory.
- Firestore/Storage rules are perimeter defense, not business authorization.
- All money-moving actions must validate owner, role, KYC tier, limit, and account state.
- Partner routes must validate both role and `partnerId` ownership.
- Admin operations must write audit logs with actor, action, target, timestamp, reason, and request ID.

## Secrets and credential controls

Immediate rules:

1. Remove hard-coded fallback secrets.
2. Remove tracked `.env` files.
3. Rotate every historically committed credential.
4. Treat exposed values as permanently compromised unless proven otherwise.
5. Use Secret Manager / Firebase secret parameters.
6. Fail closed when required secrets are missing.

## Secure logging

Never log:

- bearer tokens
- webhook signatures
- account numbers
- mobile numbers in full
- KYC document URLs
- provider raw payloads
- signing keys
- provider credentials

Log only:

- request ID
- actor UID
- action name
- transaction ID
- provider reference
- normalized status
- duration
- severity

## KYC/KYB data controls

- Storage paths must remain owner/partner/admin scoped.
- KYC/KYB downloads must be audited.
- Deletions must be soft-deleted or audit-backed.
- Uploads should be malware scanned.
- Retention policy must be documented.

## Security acceptance criteria

- No secret fallback values in provider code.
- No tracked `.env` or service account JSON files.
- Secret scan passes in CI.
- All admin actions generate audit logs.
- All partner reads/writes enforce `partnerId` ownership server-side.
- Firestore and Storage emulator tests prove denied access cases.
