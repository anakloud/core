import "reflect-metadata";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";
import { createOpenApiDocument, registerController } from "./utils.ts";
import { TargetAreasController } from "./target-areas/target-areas.controller.ts";
import { SubAreasController } from "./sub-areas/sub-areas.controller.ts";
import { ComponentsController } from "./components/components.controller.ts";
import { GoalsController } from "./goals/goals.controller.ts";
import { ActivitiesController } from "./activities/activities.controller.ts";
import { MailController } from "./mail/mail.controller.ts";
import { ServiceController } from "./services/service.controller.ts";
import { StorageController } from "./storage/storage.controller.ts";
import { CentersController } from "./centers/centers.controller.ts";
import mongoose from "mongoose";
import { serve } from "@hono/node-server";

const app = new Hono();
const controllers = [
  MailController,
  StorageController,
  ServiceController,
  TargetAreasController,
  SubAreasController,
  ComponentsController,
  GoalsController,
  ActivitiesController,
  CentersController,
];

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

// Swagger
app.get("/openapi.json", (c) => c.json(createOpenApiDocument(controllers)));
app.get("/docs", swaggerUI({ url: "/openapi.json" }));

const startServer = async () => {
  // Connect to MongoDB
  await mongoose
    .connect(process.env.MONGO_URI!)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

  // Register Controllers
  controllers.forEach((controller) => registerController(app, controller));

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
