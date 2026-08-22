import "reflect-metadata";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { registerController } from "./lib/utils.ts";
import { AreasController } from "./areas/areas.controller.ts";
import { DomainsController } from "./domains/domains.controller.ts";
import { MailController } from "./mail/mail.controller.ts";
import { ServicesController } from "./services/services.controller.ts";
import { StorageController } from "./storage/storage.controller.ts";
import mongoose from "mongoose";
import { serve } from "@hono/node-server";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "x-api-key"],
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS", "DELETE"],
  }),
);

app.get("/", (c) => c.json({ status: "ok", service: "core" }));
app.get("/health", (c) => c.json({ status: "ok" }));

const startServer = async () => {
  // Connect to MongoDB
  await mongoose
    .connect(process.env.MONGO_URI!)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

  // Register Controllers
  registerController(app, MailController);
  registerController(app, StorageController);
  registerController(app, ServicesController);
  registerController(app, DomainsController);
  registerController(app, AreasController);

  serve(
    {
      fetch: app.fetch,
      port: Number(process.env.PORT ?? 3001),
    },
    (info) => {
      console.log(`Server is running on http://localhost:${info.port}`);
    },
  );
};

startServer();
