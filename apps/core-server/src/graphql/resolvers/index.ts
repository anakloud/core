import { DateTimeResolver, JSONResolver } from "graphql-scalars";
import { serviceResolvers } from "./service.ts";

export const resolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,

  Query: {
    ...serviceResolvers.Query,
  },

  Mutation: {
    ...serviceResolvers.Mutation,
  },

  Service: serviceResolvers.Service,
};
