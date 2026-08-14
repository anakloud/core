export const domainTypeDefs = /* GraphQL */ `
  type Domain {
    id: ID!
    name: String!
    description: String
    serviceId: ID!
    areas: [Area!]!
    createdAt: DateTime
    updatedAt: DateTime
  }

  extend type Query {
    domains(serviceId: ID, serviceCode: String): [Domain!]!
  }

  input CreateDomainInput {
    name: String!
    serviceId: ID!
  }

  input UpdateDomainInput {
    name: String!
  }

  extend type Mutation {
    createDomain(input: CreateDomainInput!): Domain!
    updateDomain(id: ID!, input: UpdateDomainInput!): Domain!
    deleteDomain(id: ID!): Boolean!
  }
`;
