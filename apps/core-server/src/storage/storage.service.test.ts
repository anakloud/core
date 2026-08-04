import { afterEach, describe, expect, test } from "bun:test";
import { StorageService } from "./storage.service.ts";

const originalEnv = {
  accountId: process.env["R2_ACCOUNT_ID"],
  bucket: process.env["R2_BUCKET_NAME"],
  publicUrl: process.env["R2_PUBLIC_URL"],
};

afterEach(() => {
  for (const [name, value] of Object.entries({
    R2_ACCOUNT_ID: originalEnv.accountId,
    R2_BUCKET_NAME: originalEnv.bucket,
    R2_PUBLIC_URL: originalEnv.publicUrl,
  })) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

function serviceWithFakeSigner() {
  const service = new StorageService();
  service.getPresignedDownloadUrl = async (key) => `https://signed.example/${key}`;
  return service;
}

describe("StorageService.resolveReference", () => {
  test("resolves a durable object key", async () => {
    const result = await serviceWithFakeSigner().resolveReference(
      "pending-credentials/credential.jpg",
    );

    expect(result).toEqual({
      key: "pending-credentials/credential.jpg",
      url: "https://signed.example/pending-credentials/credential.jpg",
    });
  });

  test("refreshes a legacy R2 presigned URL", async () => {
    process.env["R2_ACCOUNT_ID"] = "account";
    process.env["R2_BUCKET_NAME"] = "assets";
    const result = await serviceWithFakeSigner().resolveReference(
      "https://account.r2.cloudflarestorage.com/assets/users/avatar.webp?X-Amz-Signature=expired",
    );

    expect(result.key).toBe("users/avatar.webp");
    expect(result.url).toBe("https://signed.example/users/avatar.webp");
  });

  test("passes unrelated external URLs through", async () => {
    const result = await serviceWithFakeSigner().resolveReference(
      "https://images.example/avatar.webp",
    );

    expect(result).toEqual({ key: null, url: "https://images.example/avatar.webp" });
  });
});
