export const areaTypeDefs = /* GraphQL */ `
  type Area {
    id: ID!
    name: String!
    domainId: ID!
    createdAt: DateTime
    updatedAt: DateTime
  }

  input CreateAreaInput {
    name: String!
    domainId: ID!
  }

  input UpdateAreaInput {
    name: String!
  }

  extend type Query {
    areas(domainId: ID): [Area!]!
  }

  extend type Mutation {
    createArea(input: CreateAreaInput!): Area!
    updateArea(id: ID!, input: UpdateAreaInput!): Area!
    deleteArea(id: ID!): Boolean!
  }
`;
