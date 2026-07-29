import type { DB } from "../db/index.ts";

export interface GraphQLContext {
  db: DB;
  isAuthenticated: boolean;
  apiKey: string | null;
  actorId: string | null;
  // Kept for backward compatibility with existing resolvers
  service: string | null;
}

export function buildContext(dbInstance: DB, request: Request): GraphQLContext {
  const expectedKey = process.env["API_KEY"] || process.env["CORE_API_KEY"];
  const apiKey = request.headers.get("x-api-key") || request.headers.get("x-service-key");
  const isAuthenticated = Boolean(apiKey && expectedKey && apiKey === expectedKey);

  return {
    db: dbInstance,
    isAuthenticated,
    apiKey: apiKey ?? null,
    actorId: request.headers.get("x-actor-id"),
    service: isAuthenticated ? "authenticated-client" : null,
  };
}
