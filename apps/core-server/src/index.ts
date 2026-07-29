import "./patch.ts";
import "reflect-metadata";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { yoga } from "./graphql/index.ts";
import { registerController } from "./lib/decorators.ts";
import { MailController } from "./mail/mail.controller.ts";
import { StorageController } from "./storage/storage.controller.ts";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "x-api-key", "x-service-key", "x-actor-id"],
    allowMethods: ["GET", "POST", "OPTIONS", "DELETE"],
  }),
);

app.get("/", (c) => c.json({ status: "ok", service: "core" }));
app.get("/health", (c) => c.json({ status: "ok" }));

// Register Controllers
registerController(app, MailController);
registerController(app, StorageController);

app.use("/graphql", async (c) => {
  const res = await yoga.handleRequest(c.req.raw, {});
  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
});

const port = Number(process.env["PORT"] ?? 3001);

export default {
  port,
  fetch: app.fetch,
};
