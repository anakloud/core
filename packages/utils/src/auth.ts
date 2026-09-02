import type { MiddlewareHandler } from "hono";

export interface Auth {
  api: {
    getSession(options: { headers: Headers }): Promise<{
      user: any;
      session: any;
    } | null>;
  };
}

export function authMiddleware(auth: Auth): MiddlewareHandler {
  return async (c, next) => {
    const apiKey = c.req.header("x-api-key");
    const configuredApiKey = process.env["API_KEY"];
    if (configuredApiKey && apiKey === configuredApiKey) {
      return await next();
    }

    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    c.set("user", session.user);
    c.set("session", session.session);

    await next();
  };
}
