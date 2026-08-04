# Pedconnect Invitation-Based Parent Intake System Design

## Summary and requirements

Pedconnect exposes `/intake-form?session=<opaque-token>` only after an Administrator or Frontdesk Officer invites a specific email. A link lasts 30 days, is single-submit, and is bound server-side to one center and normalized email. ParentUP owns the resulting parent, family, kid, relationship, and `center_kids` records. Pedconnect stores only invitation workflow metadata and later enrollment references.

The form collects one guardian and 1–10 children, shows the center name/logo and a masked read-only email, requires Cloudflare Turnstile and versioned inline consent, and creates pending center connections immediately. No intake OTP or configurable privacy URL is used. Later ParentUP claim requires Better Auth email verification.

## Architecture and ownership

| Component | Responsibility | Stored data |
| --- | --- | --- |
| Pedconnect app | Staff invitation management and session-bound form | None in the public browser |
| Pedconnect server | BFF, token validation, throttling, ParentUP calls, Core mail calls | Invitation/audit metadata only |
| Core mail | Service-key protected delivery | Delivery-provider metadata |
| ParentUP server/database | Account lookup, canonical transaction, verified signup claim | Parents, families, kids, relationships, submissions, claims, `center_kids` |

```mermaid
sequenceDiagram
    actor Staff as "Pedconnect staff"
    participant PC as "Pedconnect server"
    participant PU as "ParentUP server"
    participant Mail as "Core mail"
    actor Parent
    Staff->>PC: Create invitation(email)
    PC->>PU: publicIntakeEmailStatus(email)
    alt account exists
      PU-->>PC: hasAuthAccount=true
      PC-->>Staff: Warning; invitation blocked
    else no account
      PC->>PC: Store hashed 30-day token
      PC->>Mail: Send center-branded link
      Mail-->>Parent: /intake-form?session=token
      Parent->>PC: Load session and submit form
      PC->>PU: submitPublicIntake(bound email, center, invitation ID)
      PU->>PU: Atomic canonical write + pending center_kids
      PU-->>PC: Receipt
      PC->>PC: Mark invitation submitted
    end
```

## Components and records

`public_intake_invitations` lives in Pedconnect and contains `_id`, `centerId`, `parentupCenterId`, `emailNormalized`, SHA-256 `tokenHash`, status, delivery status/error, inviter identity, expiry, and audit timestamps. Raw tokens appear only in the emailed URL. A partial unique index on `(centerId, emailNormalized)` where status is `pending` enforces one active invitation. Resend rotates the token and extends expiry; revoke and successful submission close it.

ParentUP retains `public_intake_claims` keyed by normalized email and `public_intake_submissions` keyed uniquely by `sourceInvitationId`. Canonical writes use `parents`, `families`, `kids`, `family_parents`, `family_kids`, `parent_kids`, and `center_kids`. `(centerId, kidId)` is unique.

## API contracts

Pedconnect authenticated GraphQL:

- `publicIntakeInvitations`
- `publicIntakeEmailStatus(email)`
- `createPublicIntakeInvitation(email)`
- `resendPublicIntakeInvitation(id)`
- `revokePublicIntakeInvitation(id)`

Only Administrator and Frontdesk roles may use these operations. Email status is checked during preflight and again during creation/resend.

Pedconnect public REST:

- `GET /api/public/parent-intake/session/:token`
- `POST /api/public/parent-intake/session/:token/submission`

The GET response contains center branding, masked email, expiry, current consent version, Turnstile site key, and readiness. The POST body cannot specify email or center. Unusable links receive the same generic `LINK_UNAVAILABLE` response.

ParentUP service-authenticated GraphQL:

- `publicIntakeEmailStatus(email)` returns only `hasAuthAccount`.
- `submitPublicIntake(input)` accepts `sourceInvitationId`, `verifiedEmail`, `centerId`, guardian data without email, children, and consent.

ParentUP rechecks `auth_users` before a first write and returns `PARENTUP_ACCOUNT_EXISTS` if signup occurred after invitation creation. A committed replay still returns its original receipt.

## Security and privacy

- Tokens contain 256 random bits, are hashed at rest, rotate on resend, expire after 30 days, and are single-submit.
- Public responses use `Cache-Control: no-store` and `Referrer-Policy: no-referrer`; logs never include tokens, email, or demographics.
- Turnstile, honeypot, 64 KiB payload cap, input normalization, and database-backed IP throttling remain mandatory.
- The browser never receives ParentUP or Core service keys and cannot select a center or email.
- Inline consent names the center and covers ParentUP storage and disclosure. `PUBLIC_INTAKE_CONSENT_VERSION` versions acceptance; no `PUBLIC_INTAKE_PRIVACY_URL` exists.
- ParentUP signup uses `requireEmailVerification: true`; only a verified session may claim waiting data.

## Failure handling and observability

Failed email delivery remains visible and retryable. ParentUP submission uses `sourceInvitationId` for replay safety. If ParentUP commits but Pedconnect fails to mark submitted, retry returns the same receipt and repairs invitation status. MongoDB transactions prevent partial multi-child writes.

Track invitation creation, blocked known accounts, delivery failures, expired/revoked links, session failures, ParentUP latency/error codes, submission receipts, claim attempts, and claim failures using identifiers rather than personal data.

## Tradeoffs

The bearer link removes OTP friction but must be protected like a password-reset link. Blocking existing ParentUP accounts avoids ambiguous merges, at the cost of directing those families to the authenticated ParentUP workflow. Pedconnect-owned invitation state keeps center operations local while ParentUP remains authoritative for family demographics.

## Related documents

- [Rollout and verification](./PEDCONNECT_PUBLIC_PARENT_INTAKE_ROLLOUT.md)
- [ParentUP and Pedconnect integration](./PARENTUP_PEDCONNECT_INTEGRATION.md)
