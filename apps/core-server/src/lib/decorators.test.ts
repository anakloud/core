import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { Controller, Get, registerController } from "./decorators.ts";

@Controller("/protected")
class ProtectedController {
  @Get("")
  get(c: any) {
    return c.json({ ok: true });
  }
}

describe("controller service authentication", () => {
  test("rejects missing and invalid service keys", async () => {
    process.env["CORE_API_KEY"] = "core-test-key";
    process.env["API_KEY"] = "core-test-key";
    const app = new Hono();
    registerController(app, ProtectedController);
    expect((await app.request("/protected")).status).toBe(401);
    expect((await app.request("/protected", { headers: { "x-service-key": "wrong" } })).status).toBe(401);
  });

  test("accepts the configured service key", async () => {
    process.env["CORE_API_KEY"] = "core-test-key";
    process.env["API_KEY"] = "core-test-key";
    const app = new Hono();
    registerController(app, ProtectedController);
    const response = await app.request("/protected", { headers: { "x-service-key": "core-test-key" } });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
