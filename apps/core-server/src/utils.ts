import "reflect-metadata";
import type { Context, Hono } from "hono";
import { apiKeyMiddleware } from "./middlewares/api-key.middleware.ts";

const ROUTES_KEY = Symbol("routes");
const PREFIX_KEY = Symbol("prefix");
const PUBLIC_KEY = Symbol("public");

interface RouteMetadata {
  method: "get" | "post" | "put" | "delete" | "patch";
  path: string;
  handlerName: string | symbol;
  isPublic: boolean;
}

const toOpenApiPath = (path: string) =>
  path.replace(/:([^/]+)/g, "{$1}");

export function createOpenApiDocument(controllerClasses: any[]) {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const controllerClass of controllerClasses) {
    const prefix: string = Reflect.getMetadata(PREFIX_KEY, controllerClass) || "";
    const routes: RouteMetadata[] =
      Reflect.getMetadata(ROUTES_KEY, controllerClass) || [];
    const tag = prefix.split("/").filter(Boolean).join(" ") || "default";

    for (const route of routes) {
      const path = toOpenApiPath(`${prefix}${route.path}` || "/");
      const parameters = [...path.matchAll(/\{([^}]+)\}/g)].map((match) => ({
        name: match[1],
        in: "path",
        required: true,
        schema: { type: "string" },
      }));
      const acceptsBody = ["post", "put", "patch"].includes(route.method);

      paths[path] ??= {};
      paths[path][route.method] = {
        tags: [tag],
        operationId: `${controllerClass.name}.${String(route.handlerName)}`,
        ...(parameters.length > 0 ? { parameters } : {}),
        ...(acceptsBody
          ? {
              requestBody: {
                required: true,
                content: {
                  "application/json": { schema: { type: "object" } },
                },
              },
            }
          : {}),
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": { schema: {} },
            },
          },
        },
        ...(route.isPublic ? {} : { security: [{ apiKey: [] }] }),
      };
    }
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "Anakloud Core API",
      version: "1.0.0",
    },
    paths,
    components: {
      securitySchemes: {
        apiKey: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
      },
    },
  };
}

export function Controller(prefix: string = "") {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    Reflect.defineMetadata(PREFIX_KEY, prefix, constructor);
    return constructor;
  };
}

function createMethodDecorator(method: RouteMetadata["method"]) {
  return (path: string = "") => {
    return (
      target: any,
      propertyKey: string | symbol,
      descriptor: PropertyDescriptor,
    ) => {
      const routes: RouteMetadata[] =
        Reflect.getMetadata(ROUTES_KEY, target.constructor) || [];
      const isPublic =
        Reflect.getMetadata(PUBLIC_KEY, target, propertyKey) || false;
      routes.push({ method, path, handlerName: propertyKey, isPublic });
      Reflect.defineMetadata(ROUTES_KEY, routes, target.constructor);
      return descriptor;
    };
  };
}

export const Get = createMethodDecorator("get");
export const Post = createMethodDecorator("post");
export const Put = createMethodDecorator("put");
export const Delete = createMethodDecorator("delete");
export const Patch = createMethodDecorator("patch");

export function Public() {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(PUBLIC_KEY, true, target, propertyKey);
    return descriptor;
  };
}

export function registerController(app: Hono, controllerClass: any) {
  const instance = new controllerClass();
  const prefix: string = Reflect.getMetadata(PREFIX_KEY, controllerClass) || "";
  const routes: RouteMetadata[] =
    Reflect.getMetadata(ROUTES_KEY, controllerClass) || [];

  routes.forEach((route) => {
    const fullPath = `${prefix}${route.path}`;
    const handler = async (c: Context, next: () => Promise<void>) =>
      instance[route.handlerName](c, next);

    if (route.isPublic) app[route.method](fullPath, handler);
    else app[route.method](fullPath, apiKeyMiddleware(), handler);
  });
}
