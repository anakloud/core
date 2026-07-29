import { createYoga } from "graphql-yoga";
import { schema } from "./schema.ts";
import { db } from "../db/index.ts";
import { buildContext } from "../lib/context.ts";

export const yoga = createYoga({
  schema,
  context: ({ request }) => buildContext(db, request),
  graphqlEndpoint: "/graphql",
  landingPage: false,
});
