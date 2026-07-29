import { GraphQLError } from "graphql";
import type { GraphQLContext } from "./context.ts";

export function requireAuth(ctx: GraphQLContext): void {
  if (!ctx.isAuthenticated) {
    throw new GraphQLError("Unauthenticated: missing or invalid x-api-key header");
  }
}

export function requireService(ctx: GraphQLContext): string {
  requireAuth(ctx);
  return ctx.service ?? "authenticated-client";
}
