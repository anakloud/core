import { afterEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { registerController } from "../lib/utils.ts";
import { StorageController } from "./storage.controller.ts";
import { storageService } from "./storage.service.ts";

const originalApiKey = process.env["CORE_API_KEY"];
const originalGetObjectInfo = storageService.getObjectInfo;

afterEach(() => {
  if (originalApiKey === undefined) delete process.env["CORE_API_KEY"];
  else process.env["CORE_API_KEY"] = originalApiKey;
  storageService.getObjectInfo = originalGetObjectInfo;
});

describe("POST /storage/object-info", () => {
  test("requires service authentication", async () => {
    process.env["CORE_API_KEY"] = "core-test-key";
    const app = new Hono();
    registerController(app, StorageController);

    expect((await app.request("/storage/object-info", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: "sessions/center/session/capture.m4a" }),
    })).status).toBe(401);
    expect((await app.request("/storage/object-info", {
      method: "POST",
      headers: { "content-type": "application/json", "x-service-key": "core-test-key" },
      body: JSON.stringify({ key: "sessions/center/session/capture.m4a" }),
    })).status).toBe(401);
  });

  test("returns durable object metadata", async () => {
    process.env["CORE_API_KEY"] = "core-test-key";
    storageService.getObjectInfo = async (key) => ({
      key,
      contentType: "audio/mp4",
      size: 2048,
      etag: "etag",
      lastModified: new Date("2026-08-04T00:00:00.000Z"),
    });
    const app = new Hono();
    registerController(app, StorageController);

    const response = await app.request("/storage/object-info", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": "core-test-key" },
      body: JSON.stringify({ key: "sessions/center/session/capture.m4a" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      key: "sessions/center/session/capture.m4a",
      contentType: "audio/mp4",
      size: 2048,
    });
  });
});
