import "reflect-metadata";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { registerController } from "./utils.ts";
import { TargetAreasController } from "./target-areas/target-areas.controller.ts";
import { SubAreasController } from "./sub-areas/sub-areas.controller.ts";
import { ComponentsController } from "./components/components.controller.ts";
import { GoalsController } from "./goals/goals.controller.ts";
import { ActivitiesController } from "./activities/activities.controller.ts";
import { MailController } from "./mail/mail.controller.ts";
import { ServicesController } from "./services/services.controller.ts";
import { StorageController } from "./storage/storage.controller.ts";
import { CentersController } from "./centers/centers.controller.ts";
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
  registerController(app, TargetAreasController);
  registerController(app, SubAreasController);
  registerController(app, ComponentsController);
  registerController(app, GoalsController);
  registerController(app, ActivitiesController);
  registerController(app, CentersController);

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
