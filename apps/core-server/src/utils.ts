import {
  createOpenApiDocument as createDocument,
  registerController as register,
} from "@anakloud/utils";
import type { Hono } from "hono";
import { apiKeyMiddleware } from "./middlewares/api-key.middleware.ts";

export {
  ApiOperation,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Public,
  Put,
  UseMiddleware,
} from "@anakloud/utils";

export function createOpenApiDocument(controllerClasses: any[]) {
  return createDocument(controllerClasses, {
    title: "Anakloud Core API",
    version: "1.0.0",
    securityScheme: {
      type: "apiKey",
      in: "header",
      name: "x-api-key",
    },
  });
}

export function registerController(app: Hono, controllerClass: any) {
  return register(app, controllerClass, {
    middleware: apiKeyMiddleware(),
  });
}
