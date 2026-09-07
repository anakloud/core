import { AsyncLocalStorage } from "node:async_hooks";
import type { MiddlewareHandler } from "hono";

/**
 * Request-scoped context data accessible from anywhere in the call stack
 * without needing to pass the Hono context through function parameters.
 *
 * Only `user` and `session` are set by the core authMiddleware.
 * Use `setRequestContextValue()` to add app-specific data like tenantId, parentId, etc.
 *
 * @example
 * ```ts
 * // In any service file
 * import { getRequestContext } from "@anakloud/utils";
 *
 * class UserService {
 *   async getProfile() {
 *     const { user } = getRequestContext();
 *     if (!user) throw new Error("Not authenticated");
 *     return this.model.findById(user.id);
 *   }
 * }
 * ```
 */
export interface RequestContextData {
  /** The authenticated user object (set by authMiddleware) */
  user?: Record<string, unknown>;
  /** The session object (set by authMiddleware) */
  session?: Record<string, unknown>;
  /** Custom data - use setRequestContextValue() for app-specific context */
  [key: string]: unknown;
}

const storage = new AsyncLocalStorage<RequestContextData>();

/**
 * Middleware that initializes the request context.
 * Must be registered BEFORE any middleware that sets context values (like authMiddleware).
 *
 * @example
 * ```ts
 * import { requestContextMiddleware, authMiddleware } from "@anakloud/utils";
 *
 * const app = new Hono();
 * app.use("*", requestContextMiddleware);  // Must be first!
 * app.use("*", cors({ ... }));
 * // authMiddleware will automatically set user/session in request context
 * ```
 */
export const requestContextMiddleware: MiddlewareHandler = async (
  _context,
  next,
) => {
  await new Promise<void>((resolve, reject) => {
    storage.run({}, () => next().then(resolve, reject));
  });
};

/**
 * Set the authenticated user in the request context.
 * Called automatically by authMiddleware after successful authentication.
 */
export function setRequestUser(user: Record<string, unknown>): void {
  const context = storage.getStore();
  if (context && user) {
    context.user = user;
  }
}

/**
 * Set the session in the request context.
 * Called automatically by authMiddleware after successful authentication.
 */
export function setRequestSession(session: Record<string, unknown>): void {
  const context = storage.getStore();
  if (context) {
    context.session = session;
  }
}

/**
 * Set a custom value in the request context.
 * Use this for app-specific data like parentId, tenantId, organizationId, etc.
 *
 * @example
 * ```ts
 * // In your app's middleware
 * import { setRequestContextValue } from "@anakloud/utils";
 *
 * export async function tenantMiddleware(c: Context, next: Next) {
 *   const tenant = await getTenantFromHeader(c);
 *   setRequestContextValue("tenantId", tenant.id);
 *   setRequestContextValue("tenant", tenant);
 *   await next();
 * }
 *
 * // In your service
 * const { tenantId } = getRequestContext();
 * ```
 */
export function setRequestContextValue(key: string, value: unknown): void {
  const context = storage.getStore();
  if (context) {
    context[key] = value;
  }
}

/**
 * Get the current request context.
 * Returns an empty object if called outside of a request.
 *
 * @example
 * ```ts
 * import { getRequestContext } from "@anakloud/utils";
 *
 * class OrderService {
 *   async createOrder(items: Item[]) {
 *     const { userId, tenantId } = getRequestContext();
 *     if (!userId) throw new Error("Not authenticated");
 *
 *     return this.model.create({
 *       items,
 *       createdBy: userId,
 *       tenant: tenantId,
 *     });
 *   }
 * }
 * ```
 */
export function getRequestContext(): RequestContextData {
  return storage.getStore() ?? {};
}

/**
 * Get a specific value from the request context with type safety.
 *
 * @example
 * ```ts
 * const userId = getRequestContextValue<string>("userId");
 * const tenant = getRequestContextValue<Tenant>("tenant");
 * ```
 */
export function getRequestContextValue<T>(key: string): T | undefined {
  const context = storage.getStore();
  return context?.[key] as T | undefined;
}

/**
 * Check if currently running within a request context.
 * Useful for code that may run both in request handlers and background jobs.
 */
export function hasRequestContext(): boolean {
  return storage.getStore() !== undefined;
}

/**
 * Class wrapper for dependency injection patterns.
 * Useful if you prefer class-based services with constructor injection.
 *
 * @example
 * ```ts
 * class UserService {
 *   constructor(private readonly requestContext: RequestContext) {}
 *
 *   async getProfile() {
 *     const user = this.requestContext.user;
 *     // ...
 *   }
 * }
 * ```
 */
export class RequestContext {
  getContext(): RequestContextData {
    return getRequestContext();
  }

  get<T>(key: string): T | undefined {
    return getRequestContextValue<T>(key);
  }

  get user(): Record<string, unknown> | undefined {
    return getRequestContext().user;
  }

  get session(): Record<string, unknown> | undefined {
    return getRequestContext().session;
  }
}
