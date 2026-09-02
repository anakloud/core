import "reflect-metadata";
import type { Context, Hono, MiddlewareHandler } from "hono";

const ROUTES_KEY = Symbol("routes");
const PREFIX_KEY = Symbol("prefix");
const PUBLIC_KEY = Symbol("public");
const MIDDLEWARES_KEY = Symbol("middlewares");
const API_OPERATION_KEY = Symbol("apiOperation");

interface RouteMetadata {
  method: "get" | "post" | "put" | "delete" | "patch";
  path: string;
  handlerName: string | symbol;
  isPublic: boolean;
}

export interface RegisterControllerOptions {
  middlewares?: MiddlewareHandler[];
}

interface OpenApiDocumentOptions {
  title?: string;
  version?: string;
  securityScheme?: Record<string, unknown>;
}

export interface ApiOperationOptions {
  summary: string;
  description?: string;
  operationId?: string;
  deprecated?: boolean;
  tags?: string[];
}

const toOpenApiPath = (path: string) => path.replace(/:([^/]+)/g, "{$1}");

export function createOpenApiDocument(
  controllerClasses: any[],
  options: OpenApiDocumentOptions = {},
) {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const controllerClass of controllerClasses) {
    const prefix: string = Reflect.getMetadata(PREFIX_KEY, controllerClass) || "";
    const routes: RouteMetadata[] =
      Reflect.getMetadata(ROUTES_KEY, controllerClass) || [];
    const tag = prefix.split("/").filter(Boolean).join(" ") || "default";

    for (const route of routes) {
      const path = toOpenApiPath(`${prefix}${route.path}` || "/");
      const operation: ApiOperationOptions | undefined = Reflect.getMetadata(
        API_OPERATION_KEY,
        controllerClass.prototype,
        route.handlerName,
      );
      const parameters = [...path.matchAll(/\{([^}]+)\}/g)].map((match) => ({
        name: match[1],
        in: "path",
        required: true,
        schema: { type: "string" },
      }));
      const acceptsBody = ["post", "put", "patch"].includes(route.method);

      paths[path] ??= {};
      paths[path][route.method] = {
        tags: operation?.tags ?? [tag],
        operationId:
          operation?.operationId ??
          `${controllerClass.name}.${String(route.handlerName)}`,
        ...(operation?.summary ? { summary: operation.summary } : {}),
        ...(operation?.description
          ? { description: operation.description }
          : {}),
        ...(operation?.deprecated !== undefined
          ? { deprecated: operation.deprecated }
          : {}),
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
            content: { "application/json": { schema: {} } },
          },
        },
        ...(route.isPublic || !options.securityScheme
          ? {}
          : { security: [{ apiKey: [] }] }),
      };
    }
  }

  return {
    openapi: "3.0.3",
    info: {
      title: options.title ?? "API",
      version: options.version ?? "1.0.0",
    },
    paths,
    ...(options.securityScheme
      ? { components: { securitySchemes: { apiKey: options.securityScheme } } }
      : {}),
  };
}

export function Controller(prefix: string = "") {
  return function <T extends { new (...args: any[]): object }>(constructor: T) {
    Reflect.defineMetadata(PREFIX_KEY, prefix, constructor);
    return constructor;
  };
}

function createMethodDecorator(method: RouteMetadata["method"]) {
  return (path: string = "") =>
    (
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
}

export const Get = createMethodDecorator("get");
export const Post = createMethodDecorator("post");
export const Put = createMethodDecorator("put");
export const Delete = createMethodDecorator("delete");
export const Patch = createMethodDecorator("patch");

export function ApiOperation(options: ApiOperationOptions) {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(API_OPERATION_KEY, options, target, propertyKey);
    return descriptor;
  };
}

export function UseMiddleware(...middlewares: MiddlewareHandler[]) {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const existing: MiddlewareHandler[] =
      Reflect.getMetadata(MIDDLEWARES_KEY, target, propertyKey) || [];
    Reflect.defineMetadata(
      MIDDLEWARES_KEY,
      [...existing, ...middlewares],
      target,
      propertyKey,
    );
    return descriptor;
  };
}

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

export function registerController(
  app: Hono,
  controllerClass: any,
  options: RegisterControllerOptions = {},
) {
  const instance = new controllerClass();
  const prefix: string = Reflect.getMetadata(PREFIX_KEY, controllerClass) || "";
  const routes: RouteMetadata[] =
    Reflect.getMetadata(ROUTES_KEY, controllerClass) || [];

  routes.forEach((route) => {
    const fullPath = `${prefix}${route.path}`;
    const handler = async (c: Context, next: () => Promise<void>) =>
      instance[route.handlerName](c, next);
    const routeMiddlewares: MiddlewareHandler[] =
      Reflect.getMetadata(
        MIDDLEWARES_KEY,
        controllerClass.prototype,
        route.handlerName,
      ) || [];
    const middlewares = [
      ...(!route.isPublic ? (options.middlewares ?? []) : []),
      ...routeMiddlewares,
    ];

    (app[route.method] as any)(fullPath, ...middlewares, handler);
  });
}

export function registerControllers(
  app: Hono,
  controllerClasses: any[],
  options: RegisterControllerOptions = {},
) {
  controllerClasses.forEach((controllerClass) => {
    registerController(app, controllerClass, options);
  });
}
