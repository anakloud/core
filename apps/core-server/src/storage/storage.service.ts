import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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
    return getSignedUrl(client, command, { expiresIn });
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 604800): Promise<string> {
    const client = this.getClient();
    const command = new GetObjectCommand({
      Bucket: this.getBucket(),
      Key: key,
    });
    return getSignedUrl(client, command, { expiresIn });
  }

  async signUrl(url: string | null | undefined): Promise<string | null> {
    if (!url) return null;
    if (url.includes("X-Amz-Signature=")) return url;

    const r2PublicUrl = process.env["R2_PUBLIC_URL"] || "";
    let key = "";

    if (r2PublicUrl && url.startsWith(r2PublicUrl)) {
      key = url.slice(r2PublicUrl.length).replace(/^\/+/, "");
    } else {
      const match = url.match(
        /(centers|branches|classes|students|therapists|users|files)\/[a-zA-Z0-9-]+\.[a-zA-Z0-9]+/,
      );
      if (match) {
        key = match[0];
      }
    }

    if (!key) return url;

    try {
      return await this.getPresignedDownloadUrl(key);
    } catch (err) {
      console.error("Error generating presigned GET URL for key:", key, err);
      return url;
    }
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
