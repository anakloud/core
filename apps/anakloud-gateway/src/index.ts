import {
  ApolloGateway,
  IntrospectAndCompose,
  RemoteGraphQLDataSource,
  type GraphQLDataSourceProcessOptions,
} from "@apollo/gateway";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

interface GatewayContext {
  serviceKey: string | null;
  actorId: string | null;
}

// Subgraphs are auth-agnostic toward the gateway: auth stays end-to-end.
// The caller's x-service-key / x-actor-id headers pass through untouched
// and each subgraph enforces its own scoping (see core's lib/access.ts).
class AuthForwardingDataSource extends RemoteGraphQLDataSource<GatewayContext> {
  override willSendRequest({
    request,
    context,
  }: GraphQLDataSourceProcessOptions<GatewayContext>) {
    if ("serviceKey" in context && context.serviceKey) {
      request.http?.headers.set("x-service-key", context.serviceKey);
    }
    if ("actorId" in context && context.actorId) {
      request.http?.headers.set("x-actor-id", context.actorId);
    }
  }
}

function subgraphsFromEnv(): { name: string; url: string }[] {
  // SUBGRAPHS is a JSON array: [{"name":"core","url":"http://localhost:3000/graphql"}]
  const raw = process.env["SUBGRAPHS"];
  if (!raw) {
    return [{ name: "core", url: "http://localhost:3000/graphql" }];
  }
  const parsed = JSON.parse(raw) as { name: string; url: string }[];
  if (!Array.isArray(parsed) || !parsed.length) {
    throw new Error("SUBGRAPHS must be a non-empty JSON array of {name, url}");
  }
  return parsed;
}

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: subgraphsFromEnv(),
    pollIntervalInMs: 30_000,
  }),
  buildService: ({ url }) => new AuthForwardingDataSource({ url }),
});

const server = new ApolloServer<GatewayContext>({ gateway });

const port = Number(process.env["PORT"] ?? 4000);

const { url } = await startStandaloneServer(server, {
  listen: { port },
  context: async ({ req }) => ({
    serviceKey: (req.headers["x-service-key"] as string | undefined) ?? null,
    actorId: (req.headers["x-actor-id"] as string | undefined) ?? null,
  }),
});

console.log(`anakloud-gateway ready at ${url}`);
