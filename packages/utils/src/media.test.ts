import { afterEach, describe, expect, test } from "bun:test";
import { createMedia } from "./media.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("createMedia", () => {
  test("creates upload and public URLs for the configured app namespace", async () => {
    globalThis.fetch = (async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const body = JSON.parse(String(init?.body));
      expect(body.key).toMatch(/^parentup\/[0-9a-f-]+\.webp$/);
      expect(body.contentType).toBe("image/webp");
      return Response.json({ success: true, uploadUrl: "https://upload.test" });
    }) as unknown as typeof fetch;
    const media = createMedia({
      namespace: "parentup",
      coreUrl: "https://core.test",
      apiKey: "secret",
    });

    const response = await media.handler(
      new Request(
        "https://parentup.api.anakloud.com/media/upload?contentType=image%2Fwebp&extension=webp",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.key).toStartWith("parentup/");
    expect(body.publicUrl).toBe(
      `https://parentup.api.anakloud.com/media/${body.key}`,
    );
  });

  test("redirects media requests to the Core download URL", async () => {
    globalThis.fetch = (async () =>
      Response.json({
        success: true,
        downloadUrl: "https://storage.test/signed",
      })) as unknown as typeof fetch;
    const media = createMedia({
      namespace: "parentup",
      coreUrl: "https://core.test",
      apiKey: "secret",
    });

    const response = await media.handler(
      new Request("https://parentup.test/media/parentup/file.webp"),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://storage.test/signed");
  });
});
