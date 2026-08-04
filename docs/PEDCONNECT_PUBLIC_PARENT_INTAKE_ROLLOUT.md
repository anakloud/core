# Invitation-Based Parent Intake Rollout

## Deployment order

1. Confirm Core `/mail/send` remains service-key protected and deploy the Pedconnect parent-intake email template.
2. Deploy ParentUP service-only account lookup, invitation-bound submission contract, unique `sourceInvitationId` index, account-race rejection, and verified claim behavior.
3. Deploy Pedconnect invitation indexes, GraphQL management operations, session-scoped REST endpoints, and the Administrator/Frontdesk screen.
4. Deploy `/intake-form?session=...`, removing browser-entered email and the old unrestricted endpoints.
5. Run a real invitation through one center, then deploy normally to remaining center instances. There is no feature flag.

## Configuration and migration

Required Pedconnect configuration: `BASE_URL`, `PARENTUP_API_URL`, `PARENTUP_API_KEY`, `PARENTUP_CENTER_ID`, `CORE_API_URL`, `CORE_API_KEY`, `PUBLIC_INTAKE_CONSENT_VERSION`, `PUBLIC_INTAKE_RATE_LIMIT_PEPPER`, and Turnstile keys/hostnames. Remove `PUBLIC_INTAKE_PRIVACY_URL` everywhere.

Create Pedconnect indexes for unique token hash, partial-unique active center/email, center/creation listing, and rate-event TTL/lookup. Create ParentUP indexes for unique source invitation, normalized-email claim, claim/submission lookup, and unique `(centerId, kidId)`. Deploy indexes before accepting traffic.

Existing open-form submissions remain claimable. The old `idempotencyKey` index may be retained during transition, but new records use `sourceInvitationId`; remove the legacy index only after confirming no old deployment writes it.

## Verification and release gates

- Administrator and Frontdesk can create, list, resend, and revoke; Program Manager and anonymous callers cannot.
- Existing ParentUP auth email is warned and blocked, including mixed-case input and signup races.
- One pending link exists per center/email; resend invalidates the previous token and extends expiry to 30 days.
- Unknown, expired, revoked, and submitted links have the same generic response and cannot enumerate accounts.
- Form email is masked/read-only; payload attempts cannot override email or center.
- Turnstile, honeypot, throttles, body limits, consent, child count, and malformed input fail closed.
- Duplicate retries return one receipt; conflicting retries fail; multi-child writes are atomic.
- Every child appears immediately in the correct pending `center_kids` queue and Pedconnect stores no demographic copy.
- Verified ParentUP signup claims the existing family without recreating kids; unverified signup cannot claim.
- Public clients cannot invoke ParentUP service GraphQL or Core mail directly.
- Run ParentUP and Pedconnect tests/typechecks, Pedconnect GraphQL codegen, and Markdown/Mermaid/link checks.

## Monitoring and rollback

Monitor invitation delivery success, blocked-account counts, unusable-link rates, Turnstile/rate-limit rejection, ParentUP submission latency, transaction errors, receipt replay, pending-queue appearance, and claim failures. Log only IDs and error codes.

Rollback the Pedconnect UI and public routes first while leaving ParentUP’s backward-compatible stored records and indexes intact. Revoke outstanding invitations if the session boundary is compromised. Rotating or revoking tokens is sufficient because raw tokens are not stored. Never roll back by deleting canonical ParentUP families or kids created by completed submissions.

## Related documents

- [System design](./PEDCONNECT_PUBLIC_PARENT_INTAKE_SYSTEM_DESIGN.md)
- [ParentUP and Pedconnect integration](./PARENTUP_PEDCONNECT_INTEGRATION.md)
