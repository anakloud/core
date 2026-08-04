import "reflect-metadata";
import type { Context, Hono } from "hono";
import { timingSafeEqual } from "node:crypto";

const ROUTES_KEY = Symbol("routes");
const PREFIX_KEY = Symbol("prefix");
const PUBLIC_KEY = Symbol("public");

interface RouteMetadata {
  method: "get" | "post" | "put" | "delete" | "patch";
  path: string;
  handlerName: string | symbol;
  isPublic: boolean;
}

export function Controller(prefix: string = "") {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    Reflect.defineMetadata(PREFIX_KEY, prefix, constructor);
    return constructor;
  };
}

function createMethodDecorator(method: RouteMetadata["method"]) {
  return (path: string = "") => {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, target.constructor) || [];
      const isPublic = Reflect.getMetadata(PUBLIC_KEY, target, propertyKey) || false;
      routes.push({
        method,
        path,
        handlerName: propertyKey,
        isPublic,
      });
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
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(PUBLIC_KEY, true, target, propertyKey);
    return descriptor;
  };
}

export function registerController(app: Hono, controllerClass: any) {
  const instance = new controllerClass();
  const prefix: string = Reflect.getMetadata(PREFIX_KEY, controllerClass) || "";
  const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, controllerClass) || [];

  routes.forEach((route) => {
    const fullPath = `${prefix}${route.path}`;

    app[route.method](fullPath, async (c: Context, next) => {
      if (!route.isPublic) {
        const expectedKey = process.env["API_KEY"] || process.env["CORE_API_KEY"];
        const apiKey = c.req.header("x-api-key") || c.req.header("x-service-key");
        const expectedBuffer = expectedKey ? Buffer.from(expectedKey) : null;
        const providedBuffer = apiKey ? Buffer.from(apiKey) : null;
        const authenticated = Boolean(
          expectedBuffer
          && providedBuffer
          && expectedBuffer.length === providedBuffer.length
          && timingSafeEqual(expectedBuffer, providedBuffer),
        );
        if (!authenticated) {
          return c.json({ error: "Unauthenticated: missing or invalid x-api-key header" }, 401);
        }
      }
      return instance[route.handlerName](c, next);
    });
  });
}
