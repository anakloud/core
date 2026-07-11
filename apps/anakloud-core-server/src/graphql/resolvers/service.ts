import { asc, eq } from "drizzle-orm";
import { GraphQLError } from "graphql";
import { services } from "../../db/schema/index.ts";
import type { GraphQLContext } from "../../lib/context.ts";
import { requireService } from "../../lib/access.ts";

type ServiceRow = typeof services.$inferSelect;

export const serviceResolvers = {
  Query: {
    service: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireService(ctx);
      const [row] = await ctx.db.select().from(services).where(eq(services.id, id));
      return row ?? null;
    },
    services: async (
      _: unknown,
      args: { isActive?: boolean },
      ctx: GraphQLContext,
    ) => {
      requireService(ctx);
      return ctx.db
        .select()
        .from(services)
        .where(args.isActive === undefined ? undefined : eq(services.isActive, args.isActive))
        .orderBy(asc(services.code));
    },
  },

  Mutation: {
    createService: async (
      _: unknown,
      { input }: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) => {
      requireService(ctx);
      const [row] = await ctx.db
        .insert(services)
        .values(input as typeof services.$inferInsert)
        .returning();
      return row;
    },

    updateService: async (
      _: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) => {
      requireService(ctx);
      const [row] = await ctx.db
        .update(services)
        .set({ ...input, updatedAt: new Date() } as Partial<typeof services.$inferInsert>)
        .where(eq(services.id, id))
        .returning();
      if (!row) throw new GraphQLError("Service not found");
      return row;
    },

    deleteService: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireService(ctx);
      const rows = await ctx.db.delete(services).where(eq(services.id, id)).returning();
      return rows.length > 0;
    },
  },

  Service: {
    __resolveReference: async (ref: { id: string }, ctx: GraphQLContext) => {
      const [row] = await ctx.db.select().from(services).where(eq(services.id, ref.id));
      return row ?? null;
    },
  },
};

export type { ServiceRow };
