# Core

Centralized master data service for the Anakloud ecosystem.

See [PRD.md](./PRD.md) for product context.

## Monorepo layout

pnpm + turbo workspace:

- `apps/core-server` — Bun runtime, Hono + GraphQL Yoga at `/graphql`, MongoDB database. Subgraph schema built with `@apollo/subgraph` (exposes `_service` / `_entities`; also works standalone).
- `packages/` — reserved for shared code (none yet).

## Setup & Development

### 1. Environment Configuration
Copy the `.env.example` in `apps/core-server`:

```sh
cp apps/core-server/.env.example apps/core-server/.env
```

Configure your MongoDB connection string in `apps/core-server/.env`:
```env
PORT=3001
MONGO_URI=mongodb+srv://user:password@host/db_name
API_KEY=your_openssl_generated_api_key
```

Generate a strong API key using OpenSSL:
```sh
openssl rand -hex 32
```

### 2. Development Servers
```sh
pnpm install

pnpm dev:server   # http://localhost:3001/graphql
pnpm dev          # or run all workspaces via turbo
pnpm typecheck    # turbo run typecheck across workspaces
```

## Auth model

Inter-service authentication via `x-api-key`:

- Callers send `x-api-key` matching the `API_KEY` environment variable configured in `core-server`.
