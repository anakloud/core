import { GraphQLClient } from "graphql-request";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export const gqlClient = new GraphQLClient(`${API_URL}/graphql`, {
  headers: () => ({
    "x-service-key": process.env.EXPO_PUBLIC_SERVICE_KEY ?? "dev-pedmd",
  }),
});
