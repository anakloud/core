# Architecture Overview
This document serves as a critical, living template designed to equip agents with a rapid and comprehensive understanding of the codebase's architecture, enabling efficient navigation and effective contribution from day one. Update this document as the codebase evolves.

## 1. Project Structure
This section provides a high-level overview of the project's directory and file structure, categorised by architectural layer or major functional area. It is essential for quickly navigating the codebase, locating relevant files, and understanding the overall organization and separation of concerns.


[Project Root]/
├── apps/                 # Applications and deployable services
│   ├── core-server/      # Main backend REST API service for Core
│   │   ├── src/          # Source code for the backend service
│   │   │   ├── lib/      # Shared utilities and helpers
│   │   │   ├── middleware/# Request middlewares
│   │   │   ├── models/   # Mongoose schemas and type definitions
│   │   │   └── services/ # Domain logic, controllers, and services (e.g., Services, Products)
│   │   ├── .env.example  # Template for environment variables
│   │   └── package.json  # Backend dependencies
│   └── core-docs/        # Astro Starlight documentation site for Core
│       ├── src/          # Source code for the documentation
│       │   ├── content/  # Markdown/MDX content files (guides, API ref)
│       │   └── styles/   # Custom CSS for the docs
│       └── astro.config.mjs # Configuration for Astro and Starlight
├── packages/             # Shared code, types, and utilities (currently empty, reserved for future)
├── docs/                 # General project documentation (now migrated to apps/core-docs)
├── turbo.json            # Turborepo configuration for monorepo tasks
├── pnpm-workspace.yaml   # pnpm workspace configuration
├── package.json          # Root package.json for monorepo management
├── README.md             # Project overview and quick start guide
├── PRD.md                # Product Requirements Document for Core
└── ARCHITECTURE.md       # This document

## 2. High-Level System Diagram

[TeachDay / PedConnect / ParentUp] <--> [Core Server (REST API)] <--> [MongoDB]
                                                  |
                                                  +--> [Cloudflare R2 (Asset Storage)]

## 3. Core Components

### 3.1. Backend Services

#### 3.1.1. Core Server

Name: Anakloud Core Server

Description: The centralized master data hub for the Anakloud ecosystem. It serves as the system of record for cross-cutting entities like session and evaluation records, and acts as the exclusive gateway for uploading and resolving asset storage URLs.

Technologies: Bun, Hono.js, Mongoose/MongoDB

Deployment: TBD (Likely Dockerized container via Cloud Run/ECS or similar)

### 3.2 Frontend

#### 3.2.1 Core Docs

Name: Core Documentation

Description: The documentation site for Anakloud Core services, including guides, API references, and architectural contracts like the Asset Storage Contract.

Technologies: Astro, Starlight

Deployment: TBD (Likely Vercel, Netlify, or similar static hosting)

## 4. Data Stores

### 4.1. Primary Database

Name: Core Master Database

Type: MongoDB

Purpose: Houses domain entities that need to be centralized across applications, primarily session and evaluation records. It references child profile data from ParentUp without duplicating it.

Key Schemas/Collections: `sessions`, `evaluations`, `services`, `products` (Based on current codebase structure)

## 5. External Integrations / APIs

Service Name 1: Cloudflare R2

Purpose: Durable object storage for all assets in the Anakloud ecosystem. Core generates short-lived presigned URLs for client uploads and downloads.

Integration Method: AWS SDK for S3 (compatible with R2)

## 6. Deployment & Infrastructure

Cloud Provider: TBD (Current configuration uses Infisical for secrets)

Key Services Used: MongoDB Atlas (or similar managed Mongo), Cloudflare R2

CI/CD Pipeline: TBD (Likely GitHub Actions given `.github` folder presence)

Monitoring & Logging: TBD

## 7. Security Considerations

Authentication: Inter-service authentication via `x-api-key`. Clients must send an API key matching the `CORE_API_KEY` environment variable. Core does not handle end-user identity directly.

Authorization: Core assumes the calling application (TeachDay, PedConnect) has already authenticated and authorized the end-user.

## 8. Development & Testing Environment

Local Setup Instructions: See `README.md`. Uses `pnpm init:dev` to sync secrets via Infisical.

Testing Frameworks: Bun's built-in test runner.

Code Quality Tools: TypeScript (`typecheck` command via Turbo)

## 9. Future Considerations / Roadmap

- Defining the exact boundary of what constitutes a "session" vs "evaluation".
- Finalizing the reporting projection rules for ParentUp.
- Implementing cross-service schema registry or validation for data flowing from other applications (like `centreId` from PedConnect).

## 10. Project Identification

Project Name: Anakloud Core

Repository URL: TBD

Primary Contact/Team: Anakloud Platform Team

Date of Last Update: 2026-08-24

## 11. Glossary / Acronyms

PRD: Product Requirements Document
R2: Cloudflare R2 (S3-compatible object storage)
