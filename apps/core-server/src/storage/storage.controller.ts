import type { Context } from "hono";
import { Controller, Post, Delete } from "../lib/decorators.ts";
import { storageService } from "./storage.service.ts";

@Controller("/storage")
export class StorageController {
  private validateKey(key: unknown): string {
    const value = typeof key === "string" ? key.trim().replace(/^\/+/, "") : "";
    if (!value || value.length > 1024 || value.includes("..") || /[\u0000-\u001f]/.test(value)) {
      throw new Error("Invalid storage key");
    }
    return value;
  }

  private validateContentType(contentType: unknown): string {
    const value = typeof contentType === "string" ? contentType.trim().toLowerCase() : "";
    if (!value || value.length > 255 || !/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(value)) {
      throw new Error("Invalid content type");
    }
    return value;
  }

  @Post("/object")
  async uploadObject(c: Context) {
    try {
      const key = c.req.query("key");
      const contentType = c.req.header("content-type");
      if (!key || !contentType) {
        return c.json({ error: "key and Content-Type are required" }, 400);
      }

      const body = new Uint8Array(await c.req.arrayBuffer());
      if (body.byteLength === 0) {
        return c.json({ error: "Upload body is required" }, 400);
      }
      if (body.byteLength > 10 * 1024 * 1024) {
        return c.json({ error: "Upload exceeds the 10 MB limit" }, 413);
      }

      await storageService.uploadObject(key, contentType, body);
      return c.json({ success: true, key });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 400);
    }
  }

  @Post("/upload-url")
  async getUploadUrl(c: Context) {
    try {
      const { key: requestedKey, contentType: requestedContentType, expiresIn } = await c.req.json();
      const key = this.validateKey(requestedKey);
      const contentType = this.validateContentType(requestedContentType);
      if (!key || !contentType) {
        return c.json({ error: "key and contentType are required" }, 400);
      }
      const uploadUrl = await storageService.getPresignedUploadUrl(key, contentType, expiresIn);
      return c.json({ success: true, uploadUrl, key });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 400);
    }
  }

  @Post("/download-url")
  async getDownloadUrl(c: Context) {
    try {
      const { key: requestedKey, expiresIn } = await c.req.json();
      const key = this.validateKey(requestedKey);
      if (!key) {
        return c.json({ error: "key is required" }, 400);
      }
      const downloadUrl = await storageService.getPresignedDownloadUrl(key, expiresIn);
      return c.json({ success: true, downloadUrl, key });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 400);
    }
  }

  @Post("/object-info")
  async getObjectInfo(c: Context) {
    try {
      const { key: requestedKey } = await c.req.json();
      const key = this.validateKey(requestedKey);
      const info = await storageService.getObjectInfo(key);
      return c.json({ success: true, ...info });
    } catch (err: any) {
      const status = err?.name === "NotFound" || err?.$metadata?.httpStatusCode === 404 ? 404 : 400;
      return c.json({ success: false, error: err?.message ?? "Unable to inspect object" }, status);
    }
  }

  @Post("/sign-url")
  async signUrl(c: Context) {
    try {
      const { url } = await c.req.json();
      const signedUrl = await storageService.signUrl(url);
      return c.json({ success: true, signedUrl });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 400);
    }
  }

  @Post("/resolve-url")
  async resolveUrl(c: Context) {
    try {
      const { reference, expiresIn } = await c.req.json();
      const resolved = await storageService.resolveReference(reference, expiresIn);
      return c.json({ success: true, ...resolved });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 400);
    }
  }

  @Delete("/object")
  async deleteObject(c: Context) {
    try {
      const { key: requestedKey } = await c.req.json();
      const key = this.validateKey(requestedKey);
      if (!key) {
        return c.json({ error: "key is required" }, 400);
      }
      await storageService.deleteObject(key);
      return c.json({ success: true });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 400);
    }
  }
}
