import { Hono } from "hono";
import { cors } from "hono/cors";
import { yoga } from "./graphql/index.ts";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (process.env["TRUSTED_ORIGINS"] ?? "http://localhost:8081").split(","),
    allowHeaders: ["Content-Type", "Authorization", "x-service-key", "x-actor-id"],
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.get("/", (c) => c.json({ status: "ok", service: "anakloud-core" }));
app.get("/health", (c) => c.json({ status: "ok" }));

app.use("/graphql", async (c) => {
  const res = await yoga.handleRequest(c.req.raw, {});
  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
});

const port = Number(process.env["PORT"] ?? 3000);

export default {
  port,
  fetch: app.fetch,
};
