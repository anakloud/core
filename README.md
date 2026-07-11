# Anakloud Core

Centralized data hub for the Anakloud ecosystem. System of record for **sessions and evaluations** across all centres and teachers. Child profiles stay in ParentUp — Core stores only `childId` references and resolves profiles via GraphQL federation.

See [PRD.md](./PRD.md) for full product context.

## Monorepo layout

pnpm + turbo workspace, same shape as the other Anakloud repos:

- `apps/anakloud-core-server` — Bun runtime, Hono + GraphQL Yoga at `/graphql`, Drizzle ORM + Neon Postgres. Subgraph schema built with `@apollo/subgraph` (exposes `_service` / `_entities`; also works standalone).
- `apps/anakloud-core-app` — Expo (expo-router, graphql-request + React Query). Bare-bones web viewer for a child's sessions/evaluations — run via `expo start --web` for now; becomes the native app later.
- `packages/` — reserved for shared code (none yet).

## Setup

```sh
pnpm install

# server env
cp apps/anakloud-core-server/.env.example apps/anakloud-core-server/.env
# fill in DATABASE_URL; SERVICE_KEYS must include {"key":"dev-pedmd","service":"pedmd"}

pnpm --filter anakloud-core-server db:generate
pnpm --filter anakloud-core-server db:run-migration
pnpm --filter anakloud-core-server seed   # prints sample childIds

pnpm dev:server   # http://localhost:3000/graphql
pnpm dev:app      # Expo web on http://localhost:8081 — paste a seeded childId
pnpm dev          # or run both via turbo
pnpm typecheck    # turbo run typecheck across workspaces
```

The app authenticates with a dev-only `x-service-key` from `EXPO_PUBLIC_SERVICE_KEY` (pedmd role = full read). `EXPO_PUBLIC_*` values are baked into the web bundle — never put a production key there.

## Auth model (interim — PRD open question #1)

Service-to-service API keys, pending a decision on the centralized identity model:

- Callers send `x-service-key`. Keys are configured in the `SERVICE_KEYS` env var (JSON array of `{ key, service, centreId? }`).
- `service` is one of `teachday | pedconnect | parentup | pedmd` and drives all access scoping.
- **PedConnect** keys are bound to a `centreId` at provisioning time — this is how Core trusts incoming centre scoping (PRD open question #5): the centreId comes from the key, never from the request.
- **TeachDay** additionally sends `x-actor-id` (the acting teacher's id), used as `authorId` on writes and as the read scope. Core trusts TeachDay's assertion — swap for signed claims when the shared auth model lands.

## Access control (PRD §7)

| Caller | Sessions (raw) | Reports | Writes |
|---|---|---|---|
| TeachDay | own authored only (`authorId = x-actor-id`) | own authored | ✅ create/update/submit |
| PedConnect | scoped to key-bound `centreId` | same scope | ❌ |
| PedMD | full read | full read | ❌ |
| ParentUp | ❌ (projection only) | `visibleToParent = true` only | ❌ |

Enforced centrally in [access.ts](apps/anakloud-core-server/src/lib/access.ts) — every session/report resolver applies the scope as a mandatory SQL filter.

## Data model

Single `sessions` table ([sessions.ts](apps/anakloud-core-server/src/db/schema/sessions.ts)). Decisions taken on PRD open questions:

- **Session vs evaluation (#2)**: one entity with a `type` enum (`Session | Evaluation`), per PRD §5. Split later if evaluation-specific structure grows — `structuredData` (jsonb) absorbs schema-TBD fields until then.
- **Report projection (#3)**: not a separate table. `parentSummary` + `visibleToParent` columns on the session; the `Report` GraphQL type is a derived projection that never exposes `notes`/`structuredData`. Field-level visibility rules can evolve without migration.
- `childId` / `authorId` / `centreId` have **no foreign keys** — they reference other services' data (federation, not duplication). Sessions therefore persist across centre/teacher changes by construction.
- **Backfill (#4)**: not handled here; if TeachDay holds legacy sessions, write a one-off import against `createSession`.

## Federation

Core's subgraph contributes to the `Child` entity (owned by ParentUp):

```graphql
type Child @key(fields: "id") {
  id: ID!
  sessions(type: SessionType, status: SessionStatus): [Session!]!
  reports: [Report!]!
}
```

`Session.child` returns a `Child` reference the router resolves against ParentUp — no profile fields are stored or served by Core. Until a router + ParentUp subgraph exist, query Core directly via `sessions` / `reports` with `childId` args.

## Example queries

```graphql
# TeachDay writes (headers: x-service-key, x-actor-id)
mutation {
  createSession(input: {
    childId: "…", centreId: "…", type: Evaluation,
    notes: "…", parentSummary: "…", visibleToParent: true
  }) { id status }
}

# PedConnect (centre scope comes from the key)
query { sessions(childId: "…") { id type status occurredAt } }

# ParentUp — Report projection only
query { reports(childId: "…") { sessionId summary occurredAt } }
```
