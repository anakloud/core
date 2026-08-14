import { ObjectId } from "mongodb";
import { GraphQLError } from "graphql";
import type { GraphQLContext } from "../../lib/context.ts";
import { requireService } from "../../lib/access.ts";

export const domainResolvers = {
  Query: {
    domains: async (
      _: unknown,
      { serviceId, serviceCode }: { serviceId?: string; serviceCode?: string },
      ctx: GraphQLContext,
    ) => {
      requireService(ctx);
      const query: Record<string, unknown> = {};
      if (serviceId) {
        const service = await findService(serviceId, ctx);
        if (!service) return [];
        query.service = service._id;
      } else if (serviceCode) {
        const service = await ctx.db.collection("services").findOne({
          code: serviceCode.toUpperCase(),
        });
        if (!service) return [];
        query.service = service._id;
      }
      return ctx.db.collection("domains").find(query).sort({ sortOrder: 1, name: 1 }).toArray();
    },
  },
  Mutation: {
    createDomain: async (
      _: unknown,
      { input }: { input: { name: string; serviceId: string } },
      ctx: GraphQLContext,
    ) => {
      requireService(ctx);
      const service = await findService(input.serviceId, ctx);
      if (!service) throw new GraphQLError("Service not found");
      const name = input.name.trim();
      if (!name) throw new GraphQLError("Domain name is required");
      const now = new Date();
      const lastDomain = await ctx.db.collection("domains")
        .find({ service: service._id })
        .sort({ sortOrder: -1 })
        .limit(1)
        .next();
      const sortOrder = Number(lastDomain?.sortOrder ?? 0) + 1;
      try {
        const result = await ctx.db.collection("domains").insertOne({
          name,
          service: service._id,
          sortOrder,
          createdAt: now,
          updatedAt: now,
        });
        return { _id: result.insertedId, name, service: service._id, createdAt: now, updatedAt: now };
      } catch (error: any) {
        if (error?.code === 11000) throw new GraphQLError("This domain already exists for the service");
        throw error;
      }
    },
    updateDomain: async (
      _: unknown,
      { id, input }: { id: string; input: { name: string } },
      ctx: GraphQLContext,
    ) => {
      requireService(ctx);
      const name = input.name.trim();
      if (!name) throw new GraphQLError("Domain name is required");
      const domainId = ObjectId.isValid(id) ? new ObjectId(id) : id;
      try {
        const result = await ctx.db.collection("domains").findOneAndUpdate(
          { $or: [{ _id: domainId as any }, { id }] } as any,
          { $set: { name, updatedAt: new Date() } },
          { returnDocument: "after" },
        );
        if (!result) throw new GraphQLError("Domain not found");
        return result;
      } catch (error: any) {
        if (error?.code === 11000) throw new GraphQLError("This domain already exists for the service");
        throw error;
      }
    },
    deleteDomain: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireService(ctx);
      const domainId = ObjectId.isValid(id) ? new ObjectId(id) : id;
      const domain = await ctx.db.collection("domains").findOne(
        { $or: [{ _id: domainId as any }, { id }] } as any,
      );
      if (!domain) return false;
      const result = await ctx.db.collection("domains").deleteOne({ _id: domain._id });
      if (result.deletedCount > 0) {
        await ctx.db.collection("areas").deleteMany({ domain: domain._id });
      }
      return result.deletedCount > 0;
    },
  },
  Domain: {
    id: (parent: any) => parent.id ?? String(parent._id),
    serviceId: async (parent: any, _: unknown, ctx: GraphQLContext) => {
      if (parent.serviceId) return String(parent.serviceId);
      const service = await ctx.db.collection("services").findOne({ _id: parent.service });
      return service?.id ?? String(parent.service);
    },
    areas: (parent: any, _: unknown, ctx: GraphQLContext) =>
      ctx.db.collection("areas").find({ domain: parent._id }).sort({ sortOrder: 1, name: 1 }).toArray(),
  },
};

async function findService(id: string, ctx: GraphQLContext) {
  const queryId = ObjectId.isValid(id) ? new ObjectId(id) : id;
  return ctx.db.collection("services").findOne({
    $or: [{ _id: queryId as any }, { id }],
  } as any);
}
