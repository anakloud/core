import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class StorageService {
  private client: S3Client | null = null;

  private getClient(): S3Client {
    if (this.client) return this.client;

    const accountId = process.env["R2_ACCOUNT_ID"];
    const accessKeyId = process.env["R2_ACCESS_KEY_ID"];
    const secretAccessKey = process.env["R2_SECRET_ACCESS_KEY"];

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "Cloudflare R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are missing from environment variables",
      );
    }

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });

    return this.client;
  }

  private getBucket(): string {
    const bucket = process.env["R2_BUCKET_NAME"];
    if (!bucket) {
      throw new Error("R2_BUCKET_NAME is missing from environment variables");
    }
    return bucket;
  }

  async getPresignedUploadUrl(key: string, contentType: string, expiresIn = 300): Promise<string> {
    const client = this.getClient();
    const command = new PutObjectCommand({
      Bucket: this.getBucket(),
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(client, command, { expiresIn: this.clampExpiry(expiresIn, 300) });
  }

  async uploadObject(key: string, contentType: string, body: Uint8Array): Promise<void> {
    const client = this.getClient();
    const command = new PutObjectCommand({
      Bucket: this.getBucket(),
      Key: key,
      ContentType: contentType,
      Body: body,
    });
    await client.send(command);
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 604800): Promise<string> {
    const client = this.getClient();
    const command = new GetObjectCommand({
      Bucket: this.getBucket(),
      Key: key,
    });
    return getSignedUrl(client, command, { expiresIn: this.clampExpiry(expiresIn, 604800) });
  }

  async getObjectInfo(key: string): Promise<{
    key: string;
    contentType: string | null;
    size: number;
    etag: string | null;
    lastModified: Date | null;
  }> {
    const result = await this.getClient().send(
      new HeadObjectCommand({ Bucket: this.getBucket(), Key: key }),
    );
    return {
      key,
      contentType: result.ContentType ?? null,
      size: Number(result.ContentLength ?? 0),
      etag: result.ETag?.replace(/^"|"$/g, "") ?? null,
      lastModified: result.LastModified ?? null,
    };
  }

  private clampExpiry(value: unknown, fallback: number): number {
    const seconds = Number(value);
    if (!Number.isFinite(seconds)) return fallback;
    return Math.min(604800, Math.max(60, Math.floor(seconds)));
  }

  private validateReferenceKey(value: string): string {
    const key = value.trim().replace(/^\/+/, "");
    if (!key || key.length > 1024 || key.includes("..") || /[\u0000-\u001f]/.test(key)) {
      throw new Error("Invalid storage reference");
    }
    return key;
  }

  private keyFromUrl(value: string): string | null {
    const parsed = new URL(value);
    const accountId = process.env["R2_ACCOUNT_ID"];
    const r2Host = accountId ? `${accountId}.r2.cloudflarestorage.com` : "";
    const publicUrl = process.env["R2_PUBLIC_URL"];

    if (publicUrl) {
      const configured = new URL(publicUrl);
      if (parsed.origin === configured.origin) {
        const prefix = configured.pathname.replace(/\/+$/, "");
        if (prefix && !parsed.pathname.startsWith(`${prefix}/`)) return null;
        return this.validateReferenceKey(decodeURIComponent(parsed.pathname.slice(prefix.length)));
      }
    }

    if (r2Host && parsed.host === r2Host) {
      const bucketPrefix = `/${this.getBucket()}/`;
      const pathname = decodeURIComponent(parsed.pathname);
      return this.validateReferenceKey(
        pathname.startsWith(bucketPrefix) ? pathname.slice(bucketPrefix.length) : pathname,
      );
    }

    return null;
  }

  async resolveReference(
    reference: string | null | undefined,
    expiresIn = 900,
  ): Promise<{ key: string | null; url: string | null }> {
    const value = String(reference || "").trim();
    if (!value) return { key: null, url: null };

    if (!/^https?:\/\//i.test(value)) {
      const key = this.validateReferenceKey(value);
      return { key, url: await this.getPresignedDownloadUrl(key, expiresIn) };
    }

    const key = this.keyFromUrl(value);
    if (!key) return { key: null, url: value };
    return { key, url: await this.getPresignedDownloadUrl(key, expiresIn) };
  }

  async signUrl(url: string | null | undefined): Promise<string | null> {
    return (await this.resolveReference(url)).url;
  }

  async deleteObject(key: string): Promise<boolean> {
    const client = this.getClient();
    const command = new DeleteObjectCommand({
      Bucket: this.getBucket(),
      Key: key,
    });
    await client.send(command);
    return true;
  }
}

export const storageService = new StorageService();
