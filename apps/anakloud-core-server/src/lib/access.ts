import { GraphQLError } from "graphql";
import type { GraphQLContext, ServiceName } from "./context.ts";

export function requireService(ctx: GraphQLContext): ServiceName {
  if (!ctx.service) {
    throw new GraphQLError("Unauthenticated: missing or invalid x-service-key header");
  }
  return ctx.service;
}
