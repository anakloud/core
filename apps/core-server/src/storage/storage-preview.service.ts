import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { storageService } from "./storage.service.ts";

const MAX_SOURCE_BYTES = 50 * 1024 * 1024;
const MAX_TEXT_CHARS = 200_000;
const MAX_PAGES = 100;
const COMMAND_TIMEOUT_MS = 90_000;

export type StoragePreviewManifest = {
  kind: "image" | "audio" | "video" | "text" | "document";
  sourceKey: string;
  sourceMimeType: string;
  sourceEtag: string;
  text?: string;
  pageKeys?: string[];
  pageCount?: number;
  truncated?: boolean;
};

class PreviewSemaphore {
  private active = 0;
  private readonly waiting: Array<() => void> = [];

  constructor(private readonly limit: number) {}

  async run<T>(operation: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) await new Promise<void>((resolve) => this.waiting.push(resolve));
    this.active += 1;
    try {
      return await operation();
    } finally {
      this.active -= 1;
      this.waiting.shift()?.();
    }
  }
}

const conversions = new PreviewSemaphore(2);

function normalizedMimeType(value: string | null, key: string) {
  const mime = String(value ?? "").split(";", 1)[0]!.trim().toLowerCase();
  if (mime) return mime;
  const extension = extname(key).toLowerCase();
  return ({
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".m4a": "audio/mp4",
    ".webm": "audio/webm",
  } as Record<string, string>)[extension] ?? "application/octet-stream";
}

function safeEtag(value: string | null) {
  const result = String(value ?? "missing").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
  return result || "missing";
}

async function runCommand(command: string[], cwd: string) {
  const process = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe" });
  const timeout = setTimeout(() => process.kill(), COMMAND_TIMEOUT_MS);
  try {
    const [exitCode, stderr] = await Promise.all([
      process.exited,
      new Response(process.stderr).text(),
    ]);
    if (exitCode !== 0) throw new Error(`${basename(command[0]!)} failed: ${stderr.trim().slice(0, 500)}`);
  } finally {
    clearTimeout(timeout);
  }
}

export class StoragePreviewService {
  async createPreview(sourceKey: string, captureId: string): Promise<StoragePreviewManifest> {
    if (!sourceKey.startsWith("sessions/") || sourceKey.includes("/previews/")) {
      throw new Error("Only original session assets can be previewed");
    }
    const source = await storageService.getObjectInfo(sourceKey);
    if (source.size <= 0 || source.size > MAX_SOURCE_BYTES) throw new Error("Preview source must be 50 MB or smaller");
    const sourceMimeType = normalizedMimeType(source.contentType, sourceKey);
    const sourceEtag = safeEtag(source.etag);
    const base = sourceKey.split("/").slice(0, -1).join("/");
    const previewPrefix = `${base}/previews/${captureId}/${sourceEtag}`;

    if (sourceMimeType.startsWith("image/")) return { kind: "image", sourceKey, sourceMimeType, sourceEtag };
    if (sourceMimeType.startsWith("audio/")) return { kind: "audio", sourceKey, sourceMimeType, sourceEtag };
    if (sourceMimeType.startsWith("video/")) return { kind: "video", sourceKey, sourceMimeType, sourceEtag };
    if (sourceMimeType === "text/plain") {
      const bytes = await storageService.downloadObject(sourceKey);
      return {
        kind: "text",
        sourceKey,
        sourceMimeType,
        sourceEtag,
        text: new TextDecoder("utf-8", { fatal: false }).decode(bytes).replace(/\u0000/g, "").slice(0, MAX_TEXT_CHARS),
      };
    }

    const supportedDocument = sourceMimeType === "application/pdf"
      || sourceMimeType === "application/msword"
      || sourceMimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (!supportedDocument) throw new Error(`Unsupported preview type: ${sourceMimeType}`);

    const manifestKey = `${previewPrefix}/manifest.json`;
    try {
      await storageService.getObjectInfo(manifestKey);
      return JSON.parse(new TextDecoder().decode(await storageService.downloadObject(manifestKey))) as StoragePreviewManifest;
    } catch (error: any) {
      if (error?.name !== "NotFound" && error?.$metadata?.httpStatusCode !== 404) throw error;
    }

    return conversions.run(async () => {
      const workdir = await mkdtemp(join(tmpdir(), "core-preview-"));
      try {
        const extension = extname(sourceKey).toLowerCase() || (sourceMimeType === "application/pdf" ? ".pdf" : ".docx");
        const sourcePath = join(workdir, `source${extension}`);
        await writeFile(sourcePath, await storageService.downloadObject(sourceKey));
        let pdfPath = sourcePath;
        if (sourceMimeType !== "application/pdf") {
          await runCommand(["libreoffice", "--headless", "--convert-to", "pdf", "--outdir", workdir, sourcePath], workdir);
          pdfPath = join(workdir, "source.pdf");
        }

        let pageCount = MAX_PAGES;
        let truncated = false;
        try {
          const info = Bun.spawn(["pdfinfo", pdfPath], { stdout: "pipe", stderr: "pipe" });
          const output = await new Response(info.stdout).text();
          if (await info.exited === 0) {
            const actual = Number(output.match(/^Pages:\s+(\d+)/m)?.[1] ?? MAX_PAGES);
            pageCount = Math.min(MAX_PAGES, actual);
            truncated = actual > MAX_PAGES;
          }
        } catch {
          // pdftoppm remains the source of truth when metadata is unavailable.
        }
        await runCommand([
          "pdftoppm", "-jpeg", "-f", "1", "-l", String(MAX_PAGES),
          "-scale-to-x", "1600", "-scale-to-y", "-1", "-jpegopt", "quality=82",
          pdfPath, join(workdir, "page"),
        ], workdir);
        const files = (await readdir(workdir)).filter((name) => /^page-\d+\.jpg$/.test(name)).sort((a, b) => {
          return Number(a.match(/(\d+)/)?.[1]) - Number(b.match(/(\d+)/)?.[1]);
        }).slice(0, MAX_PAGES);
        if (!files.length) throw new Error("Document conversion produced no preview pages");
        const pageKeys: string[] = [];
        for (let index = 0; index < files.length; index += 1) {
          const key = `${previewPrefix}/page-${String(index + 1).padStart(3, "0")}.jpg`;
          await storageService.uploadObject(key, "image/jpeg", new Uint8Array(await readFile(join(workdir, files[index]!))));
          pageKeys.push(key);
        }
        const manifest: StoragePreviewManifest = {
          kind: "document", sourceKey, sourceMimeType, sourceEtag,
          pageKeys, pageCount: Math.min(pageCount, pageKeys.length), truncated,
        };
        await storageService.uploadObject(manifestKey, "application/json", new TextEncoder().encode(JSON.stringify(manifest)));
        return manifest;
      } finally {
        await rm(workdir, { recursive: true, force: true });
      }
    });
  }
}

export const storagePreviewService = new StoragePreviewService();
