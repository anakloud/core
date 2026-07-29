export const serviceTypeDefs = /* GraphQL */ `
  type Service @key(fields: "id") {
    id: ID!
    code: String!
    name: String!
    description: String
    category: String
    type: String
    defaultDurationMins: Int
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  extend type Query {
    service(id: ID!): Service
    services(isActive: Boolean): [Service!]!
  }

  input CreateServiceInput {
    code: String!
    name: String!
    description: String
    category: String
    type: String
    defaultDurationMins: Int
    isActive: Boolean
  }

  input UpdateServiceInput {
    code: String
    name: String
    description: String
    category: String
    type: String
    defaultDurationMins: Int
    isActive: Boolean
  }

  extend type Mutation {
    createService(input: CreateServiceInput!): Service!
    updateService(id: ID!, input: UpdateServiceInput!): Service!
    deleteService(id: ID!): Boolean!
  }
`;
