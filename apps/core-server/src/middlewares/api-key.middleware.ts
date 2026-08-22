import type { MiddlewareHandler } from "hono";
import { timingSafeEqual } from "node:crypto";

function keysMatch(expectedKey: string | undefined, providedKey: string | undefined) {
  if (!expectedKey || !providedKey) return false;

  const expected = Buffer.from(expectedKey);
  const provided = Buffer.from(providedKey);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export function apiKeyMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const expectedKey = process.env["CORE_API_KEY"];
    const providedKey = c.req.header("x-api-key");

    if (!keysMatch(expectedKey, providedKey)) {
      return c.json({ error: "Unauthenticated: missing or invalid x-api-key header" }, 401);
    }

    await next();
  };
}
