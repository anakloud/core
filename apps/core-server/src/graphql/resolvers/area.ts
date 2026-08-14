import { GraphQLError } from "graphql";
import { ObjectId } from "mongodb";
import type { GraphQLContext } from "../../lib/context.ts";
import { requireService } from "../../lib/access.ts";

export const areaResolvers = {
  Query: {
    areas: async (_: unknown, { domainId }: { domainId?: string }, ctx: GraphQLContext) => {
      requireService(ctx);
      const query: Record<string, unknown> = {};
      if (domainId) {
        const domain = await findDomain(domainId, ctx);
        if (!domain) return [];
        query.domain = domain._id;
      }
      return ctx.db.collection("areas").find(query).sort({ sortOrder: 1, name: 1 }).toArray();
    },
  },
  Mutation: {
    createArea: async (
      _: unknown,
      { input }: { input: { name: string; domainId: string } },
      ctx: GraphQLContext,
    ) => {
      requireService(ctx);
      const domain = await findDomain(input.domainId, ctx);
      if (!domain) throw new GraphQLError("Domain not found");
      const name = input.name.trim();
      if (!name) throw new GraphQLError("Area name is required");
      const now = new Date();
      const lastArea = await ctx.db.collection("areas")
        .find({ domain: domain._id })
        .sort({ sortOrder: -1 })
        .limit(1)
        .next();
      const sortOrder = Number(lastArea?.sortOrder ?? 0) + 1;
      try {
        const result = await ctx.db.collection("areas").insertOne({
          name,
          domain: domain._id,
          sortOrder,
          createdAt: now,
          updatedAt: now,
        });
        return { _id: result.insertedId, name, domain: domain._id, createdAt: now, updatedAt: now };
      } catch (error: any) {
        if (error?.code === 11000) throw new GraphQLError("This area already exists for the domain");
        throw error;
      }
    },
    updateArea: async (
      _: unknown,
      { id, input }: { id: string; input: { name: string } },
      ctx: GraphQLContext,
    ) => {
      requireService(ctx);
      const name = input.name.trim();
      if (!name) throw new GraphQLError("Area name is required");
      const areaId = ObjectId.isValid(id) ? new ObjectId(id) : id;
      try {
        const result = await ctx.db.collection("areas").findOneAndUpdate(
          { $or: [{ _id: areaId as any }, { id }] } as any,
          { $set: { name, updatedAt: new Date() } },
          { returnDocument: "after" },
        );
        if (!result) throw new GraphQLError("Area not found");
        return result;
      } catch (error: any) {
        if (error?.code === 11000) throw new GraphQLError("This area already exists for the domain");
        throw error;
      }
    },
    deleteArea: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireService(ctx);
      const areaId = ObjectId.isValid(id) ? new ObjectId(id) : id;
      const result = await ctx.db.collection("areas").deleteOne(
        { $or: [{ _id: areaId as any }, { id }] } as any,
      );
      return result.deletedCount > 0;
    },
  },
  Area: {
    id: (parent: any) => parent.id ?? String(parent._id),
    domainId: (parent: any) => String(parent.domainId ?? parent.domain),
  },
};

async function findDomain(id: string, ctx: GraphQLContext) {
  const queryId = ObjectId.isValid(id) ? new ObjectId(id) : id;
  return ctx.db.collection("domains").findOne({
    $or: [{ _id: queryId as any }, { id }],
  } as any);
}
