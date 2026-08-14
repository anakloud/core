import { DateTimeResolver, JSONResolver } from "graphql-scalars";
import { serviceResolvers } from "./service.ts";
import { domainResolvers } from "./domain.ts";
import { areaResolvers } from "./area.ts";

export const resolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,

  Query: {
    ...serviceResolvers.Query,
    ...domainResolvers.Query,
    ...areaResolvers.Query,
  },

  Mutation: {
    ...serviceResolvers.Mutation,
    ...domainResolvers.Mutation,
    ...areaResolvers.Mutation,
  },

  Service: serviceResolvers.Service,
  Domain: domainResolvers.Domain,
  Area: areaResolvers.Area,
};
