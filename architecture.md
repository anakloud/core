# Core Architecture

Core serves as the centralized master data hub for the Anakloud ecosystem. This document outlines its primary architectural components, deployment context, and interaction patterns with other services.

## Overview

Core exposes a service-authenticated REST API that functions as the system of record for critical cross-cutting entities (like session and evaluation records). By centralizing this data, Core ensures that:
- Sessions persist independently of teacher/centre relationship changes.
- Every session/evaluation is traceable to a child, an author (teacher), and a centre.
- Application servers (like TeachDay, PedConnect, and PedMD) avoid building complex cross-database aggregations.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Hono.js](https://hono.dev/) for fast, lightweight REST API routing.
- **Database**: **MongoDB**. Core utilizes a single shared MongoDB instance to house its domain entities.
- **Monorepo Management**: **pnpm** and **TurboRepo** orchestrate the application workspaces (`apps/core-server` and `apps/core-docs`).

## Auth Model

Core does not handle end-user (parent/teacher/doctor) identity. It uses inter-service authentication via the `x-api-key` header.
- Calling services (TeachDay, PedConnect, etc.) send an API key matching `CORE_API_KEY`.
- Core assumes the calling service has already authenticated the end-user and validated their permissions before requesting or modifying records.

## Key Sub-Systems

### 1. Master Data & Sessions
Core owns session and evaluation records, referencing child profile data from ParentUp. It does not duplicate child profile fields. Callers must resolve the canonical child profile details from ParentUp if they need to render them.

### 2. Asset Storage
Core acts as the exclusive gateway to **Cloudflare R2** for file uploads across Anakloud applications. 
- Applications request presigned upload URLs from Core.
- Browsers/mobile clients upload directly to R2.
- Applications store the durable object key, and query Core to dynamically resolve short-lived download URLs before serving records.
- For more details, see the [Asset Storage Contract](apps/core-docs/src/content/docs/guides/ASSET_STORAGE_CONTRACT.md).

## Ecosystem Interactions

- **ParentUp**: Source of truth for child profiles. Fetches parent-facing report projections from Core.
- **TeachDay**: Writes session and evaluation data to Core. 
- **PedConnect** (per-centre instances): Reads sessions for enrolled children at specific centres.
- **PedMD**: Maintains read-only access to full session/evaluation histories for clinical review.

## Configuration & Environments

Configuration is managed via **Infisical**. During development, `pnpm init:dev` sets up local `.env` variables required by `apps/core-server`.
