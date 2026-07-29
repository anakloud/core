import { buildSubgraphSchema } from "@apollo/subgraph";
import type { GraphQLResolverMap } from "@apollo/subgraph/dist/schema-helper/resolverMap.js";
import { parse } from "graphql";
import { typeDefs } from "./typeDefs/index.ts";
import { resolvers } from "./resolvers/index.ts";

// Federation-capable subgraph schema: exposes _service/_entities so an
// Apollo router can compose Core with ParentUp's subgraph. Also works
// standalone as a regular GraphQL endpoint.
export const schema = buildSubgraphSchema({
  typeDefs: parse(typeDefs.join("\n")),
  resolvers: resolvers as GraphQLResolverMap<unknown>,
});
