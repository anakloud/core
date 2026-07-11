import { scalarTypeDefs } from "./scalars.ts";
import { serviceTypeDefs } from "./service.ts";

const rootTypeDefs = /* GraphQL */ `
  extend schema
    @link(
      url: "https://specs.apollo.dev/federation/v2.3"
      import: ["@key", "@shareable", "@external"]
    )

  type Query
  type Mutation
`;

export const typeDefs = [rootTypeDefs, scalarTypeDefs, serviceTypeDefs];
