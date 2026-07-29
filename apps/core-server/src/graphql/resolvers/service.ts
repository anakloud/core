import { ObjectId } from "mongodb";
import { GraphQLError } from "graphql";
import type { GraphQLContext } from "../../lib/context.ts";
import { requireService } from "../../lib/access.ts";

export const serviceResolvers = {
  Query: {
    service: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireService(ctx);
      const queryId = ObjectId.isValid(id) ? new ObjectId(id) : id;
      const row = await ctx.db.collection("services").findOne({
        $or: [
          { _id: queryId as any },
          { id: id }
        ]
      });
      return row ?? null;
    },
    services: async (
      _: unknown,
      args: { isActive?: boolean },
      ctx: GraphQLContext,
    ) => {
      requireService(ctx);
      const query: Record<string, any> = {};
      if (args.isActive !== undefined) {
        query.isActive = args.isActive;
      }
      return ctx.db
        .collection("services")
        .find(query)
        .sort({ code: 1 })
        .toArray();
    },
  },

  Mutation: {
    createService: async (
      _: unknown,
      { input }: { input: Record<string, any> },
      ctx: GraphQLContext,
    ) => {
      requireService(ctx);
      const doc = {
        ...input,
        isActive: input.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await ctx.db.collection("services").insertOne(doc);
      return {
        _id: result.insertedId,
        ...doc,
      };
    },

    updateService: async (
      _: unknown,
      { id, input }: { id: string; input: Record<string, any> },
      ctx: GraphQLContext,
    ) => {
      requireService(ctx);
      const queryId = ObjectId.isValid(id) ? new ObjectId(id) : id;
      const updateData = {
        ...input,
        updatedAt: new Date(),
      };
      const result = await ctx.db.collection("services").findOneAndUpdate(
        { $or: [{ _id: queryId as any }, { id: id }] } as any,
        { $set: updateData },
        { returnDocument: "after" }
      );
      if (!result) {
        throw new GraphQLError("Service not found");
      }
      return result;
    },

    deleteService: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireService(ctx);
      const queryId = ObjectId.isValid(id) ? new ObjectId(id) : id;
      const result = await ctx.db.collection("services").deleteOne({
        $or: [{ _id: queryId as any }, { id: id }]
      } as any);
      return result.deletedCount > 0;
    },
  },

  Service: {
    id: (parent: any) => parent.id ?? String(parent._id),
    __resolveReference: async (ref: { id: string }, ctx: GraphQLContext) => {
      const queryId = ObjectId.isValid(ref.id) ? new ObjectId(ref.id) : ref.id;
      const row = await ctx.db.collection("services").findOne({
        $or: [{ _id: queryId as any }, { id: ref.id }]
      } as any);
      return row ?? null;
    },
  },
};
