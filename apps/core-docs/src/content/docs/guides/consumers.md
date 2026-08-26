---
title: Consumers
---

# Core API Consumers

This inventory records the in-repository services that previously called
Core's GraphQL endpoint and now consume the catalog REST API.

## Catalog REST consumers

| Consumer | Source | Core operations used | Migration requirement |
| --- | --- | --- | --- |
| Admin server | `admin/apps/admin-server/src/services/services.service.ts` | Service, domain, and area reads and full CRUD | Uses the corresponding Core REST endpoints. |
| PedConnect server | `pedconnect/apps/pedconnect-server/src/programs/program.service.ts` | Active-service and individual-service reads | Uses `GET /services?active=true` and `GET /services/:publicId`. |
| TeachDAY server | `teachday/apps/teachday-server/src/graphql/resolvers/core-domains.ts` | Domain reads by service ID or code, including areas | Uses `GET /domains?serviceId=...` or `GET /domains?serviceCode=...`. |

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
- Service lookup by immutable `publicId`, with Mongo `_id` compatibility during migration.
- Filtering services by `active`, and domains by `serviceId` or `serviceCode`.
- Domains returned with their areas for Admin and TeachDAY.
- Existing ordering, timestamps, validation, duplicate-name errors, and
  domain-to-area cascade deletion.
