import { gql } from "graphql-request";

export const SERVICES_QUERY = gql`
  query Services {
    services {
      id
      code
      name
      description
      category
      type
      defaultDurationMins
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_SERVICE_MUTATION = gql`
  mutation CreateService($input: CreateServiceInput!) {
    createService(input: $input) {
      id
    }
  }
`;

export const UPDATE_SERVICE_MUTATION = gql`
  mutation UpdateService($id: ID!, $input: UpdateServiceInput!) {
    updateService(id: $id, input: $input) {
      id
    }
  }
`;

export const DELETE_SERVICE_MUTATION = gql`
  mutation DeleteService($id: ID!) {
    deleteService(id: $id)
  }
`;
