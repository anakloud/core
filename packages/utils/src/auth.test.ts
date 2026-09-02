import { afterEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { authMiddleware } from "./auth.ts";
import { Controller, Get, Public, registerControllers } from "./controller.ts";

const originalApiKey = process.env["API_KEY"];

afterEach(() => {
  if (originalApiKey === undefined) delete process.env["API_KEY"];
  else process.env["API_KEY"] = originalApiKey;
});

function createAuth(session: { user: { id: string }; session: { id: string } } | null) {
  return {
    api: {
      async getSession() {
        return session;
      },
    },
  };
}

describe("authMiddleware", () => {
  test("sets the authenticated user and session", async () => {
    const app = new Hono();
    const middleware = authMiddleware(
      createAuth({ user: { id: "user-1" }, session: { id: "session-1" } }),
    );
    app.get("/", middleware, (c) =>
      c.json({
        user: (c as any).get("user"),
        session: (c as any).get("session"),
      }),
    );

    const response = await app.request("/");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      user: { id: "user-1" },
      session: { id: "session-1" },
    });
  });

  test("rejects a request without a session", async () => {
    delete process.env["API_KEY"];
    const app = new Hono();
    app.get("/", authMiddleware(createAuth(null)), (c) => c.text("ok"));

    const response = await app.request("/");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  test("accepts a configured API key", async () => {
    process.env["API_KEY"] = "secret";
    const app = new Hono();
    app.get("/", authMiddleware(createAuth(null)), (c) => c.text("ok"));

    const response = await app.request("/", {
      headers: { "x-api-key": "secret" },
    });

    expect(response.status).toBe(200);
  });
});

describe("controller authentication", () => {
  @Controller()
  class TestController {
    @Get("/private")
    privateRoute(c: any) {
      return c.text("private");
    }

    @Get("/public")
    @Public()
    publicRoute(c: any) {
      return c.text("public");
    }
  }

  test("applies authentication to every route except Public routes", async () => {
    const app = new Hono();
    registerControllers(app, [TestController], {
      middlewares: [authMiddleware(createAuth(null))],
    });

    expect((await app.request("/private")).status).toBe(401);
    expect((await app.request("/public")).status).toBe(200);
  });

  test("registers controllers when middleware is omitted", async () => {
    const app = new Hono();
    registerControllers(app, [TestController]);

    expect((await app.request("/private")).status).toBe(200);
  });
});
