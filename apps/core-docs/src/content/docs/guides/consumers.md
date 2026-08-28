---
title: Consumers
---

# Core API Consumers

This inventory records the in-repository services that previously called
Core's GraphQL endpoint and now consume the catalog REST API.

## Catalog REST consumers

| Consumer | Source | Core operations used | Migration requirement |
| --- | --- | --- | --- |
| Admin server | `admin/apps/admin-server/src/services/services.service.ts` | Service and target-area reads and full CRUD | Uses the corresponding Core REST endpoints. |
| PedConnect server | `pedconnect/apps/pedconnect-server/src/programs/program.service.ts` | Active-service and individual-service reads | Uses `GET /services?active=true` and `GET /services/:publicId`. |
| TeachDAY server | `teachday/apps/teachday-server/src/graphql/resolvers/core-domains.ts` | Target-area reads by service | Uses `GET /target-areas?service=...`. |

## Non-GraphQL Core consumers

The following applications use Core, but not its GraphQL endpoint:

- ParentUp uses Core's REST mail and storage endpoints.
- PedConnect and TeachDAY also use Core's REST mail and storage endpoints.

PedMD has no verified Core catalog usage. No active Apollo Router or supergraph
consumer was found in this workspace.

## Catalog API compatibility notes

The REST replacement must preserve the behavior these callers rely on:

- Authentication through `x-api-key` using Core's `CORE_API_KEY`.
- Service references use immutable public IDs such as `SRV-1001`.
- Service lookup uses the immutable `publicId`; internal Mongo identifiers are not exposed.
- Filtering services by `active`, and target areas by `service`.
- Target areas reference services directly for Admin and TeachDAY.
- Existing ordering, timestamps, validation, duplicate-name errors, and
  service-to-target-area relationships.
