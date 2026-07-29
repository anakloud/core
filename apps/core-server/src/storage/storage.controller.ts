import type { Context } from "hono";
import { Controller, Post, Delete } from "../lib/decorators.ts";
import { storageService } from "./storage.service.ts";

@Controller("/storage")
export class StorageController {
  @Post("/upload-url")
  async getUploadUrl(c: Context) {
    try {
      const { key, contentType, expiresIn } = await c.req.json();
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
      const { key, expiresIn } = await c.req.json();
      if (!key) {
        return c.json({ error: "key is required" }, 400);
      }
      const downloadUrl = await storageService.getPresignedDownloadUrl(key, expiresIn);
      return c.json({ success: true, downloadUrl, key });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 400);
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

  @Delete("/object")
  async deleteObject(c: Context) {
    try {
      const { key } = await c.req.json();
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
