# PRD: Core

## 1. Overview
Core is the centralized data hub for the Anakloud ecosystem. It owns **session and evaluation records**, referencing (not duplicating) child profile data from ParentUp. It serves as the system of record that TeachDay, PedConnect, and PedMD read from and TeachDay writes to.

## 2. Goals
- Single source of truth for sessions/evaluations across all centres and teachers.
- Sessions persist independently of teacher/centre relationship changes (child can move centres/teachers without losing history).
- Attribution: every session/evaluation is traceable to a child, an author (teacher), and a centre.
- No duplication of child profile data — Core stores only platform master data and callers resolve child profile data from ParentUp when needed.

## 3. Non-Goals
- Not a control-plane / tenant-provisioning service (that stays in Anakloud's admin layer, out of scope here).
- Not an identity/auth provider (assume existing auth model is reused/extended, TBD).
- Does not own child profile creation/editing (ParentUp's responsibility).

## 4. Ecosystem Context

| App | Relationship to Core |
|---|---|
| ParentUp | Source of truth for child profiles. Parents read session **reports** (filtered view) from Core. |
| TeachDay | Writes sessions/evaluations to Core. Reads centre/child context as needed. |
| PedConnect (per-centre instance) | Reads sessions for enrolled children, scoped by `centreId`. |
| PedMD | Read-only access to sessions/evaluations for clinical review. |

## 5. Data Model (initial)

### Session
- `id`
- `childId` (ref → ParentUp)
- `authorId` (ref → TeachDay teacher)
- `centreId` (ref → PedConnect instance)
- `type` (evaluation | session)
- `status`
- `notes` / structured fields (TBD based on evaluation schema)
- `createdAt`, `updatedAt`

### Report (parent-facing view)
- Derived/filtered projection of Session data — excludes raw clinical/teacher notes not meant for parent visibility.
- `sessionId`, `childId`, `summary`, `visibleToParent: boolean`

## 6. Architecture

- **Stack**: Bun, Hono.js REST API, MongoDB — consistent with the Core server implementation.
- **Pattern**: Core exposes service-authenticated REST resources and does not own or federate child profile data.
- **DB**: Single shared Neon Postgres instance (not per-centre), since sessions follow the child across centres — avoids cross-database aggregation.

## 7. Access Control (draft — needs input)
- TeachDay: write + read (own authored sessions; read scoped by centre/child assignment).
- PedConnect: read-only, scoped by `centreId` (only children currently/previously enrolled at that centre).
- ParentUp: read-only, scoped by `childId`, limited to `Report` projection (not raw session data).
- PedMD: read-only, full session/evaluation detail (clinical need).

## 8. Open Questions
1. Auth/identity model — centralized (Anakloud) or per-app? Affects how Core authorizes cross-service requests.
2. What exactly differentiates "session" from "evaluation" in schema — same entity with `type` field, or separate types?
3. Report projection rules — which fields are parent-visible vs. teacher/doctor-only? Needs product input.
4. Historical data migration — do existing sessions (if any currently living in TeachDay) need backfilling into Core?
5. Schema registry / service discovery for PedConnect's per-centre instances — owned by Anakloud admin layer, but Core needs to trust/validate incoming `centreId`s from it.

## 9. Success Criteria
- A child's full session history is queryable in one place regardless of how many centres/teachers they've had.
- No child profile field is duplicated outside ParentUp.
- Centre/teacher/parent/doctor each get correctly scoped views without custom one-off sync jobs.
