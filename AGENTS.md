# AGENTS.md

Guidance for AI coding agents working in the **Core** repository.

## Project Overview

The Core repository is a monorepo (pnpm workspaces + Turborepo) containing the backend API for the Ankloud platform.

- **Package manager:** pnpm (single root `pnpm-lock.yaml` — do not use npm or yarn)
- **Task runner:** turbo (`turbo.json` defines `build`, `dev`, `typecheck`)
- **Workspaces:** `apps/*` and `packages/*`

```
apps/
  core-server/  # core-server — Bun + HonoJS server (Port: 3001)
```

## Getting Started

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```
2.  **Run the development servers:**
    ```bash
    pnpm dev
    ```
    This will start the `core-server`.
    - `core-server` will be available at `http://localhost:3001`


## Root Commands (run from repo root)

```bash
pnpm install          # install all workspaces
pnpm dev              # turbo run dev
pnpm dev:server       # run Bun + Hono API (port 3001)
pnpm typecheck        # turbo run typecheck across workspace
pnpm build            # turbo run build
```

---

## apps/core-server (Backend API)

- **Runtime:** Bun (`bun run --hot src/index.ts`)
- **HTTP Framework:** HonoJS `^4.12.23`
- **API:** Hono REST controllers for catalog, mail, and storage operations
- **Entry point:** `src/index.ts`

---

## Development & Environment Guidelines

- **Environment variables:** Copy `apps/core-server/.env.example` to `apps/core-server/.env` to override local dev variables.
- **Port assignments:** Always preserve the designated ports:
  - Backend (`core-server`): **3001**
- **Types:** Always run `pnpm typecheck` before pushing updates to ensure full workspace compiling alignment.

---

## Testing

No testing infrastructure has been set up yet.
