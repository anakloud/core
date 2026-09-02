import { describe, expect, test } from "bun:test";
import { createApiClient } from "./api-client.ts";

describe("createApiClient", () => {
  test("creates a credentialed Axios client from an explicit URL", () => {
    const client = createApiClient({
      port: 3005,
      baseURL: "https://pedmd.api.anakloud.com/",
    });

    expect(client.defaults.baseURL).toBe("https://pedmd.api.anakloud.com");
    expect(client.defaults.withCredentials).toBe(true);
  });
});
