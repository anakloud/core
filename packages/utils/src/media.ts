export interface MediaOptions {
  namespace: string;
  basePath?: string;
  coreUrl?: string;
  apiKey?: string;
  publicUrl?: string;
}

export function createMedia(options: MediaOptions) {
  const namespace = options.namespace.replace(/^\/+|\/+$/g, "");
  const basePath = `/${(options.basePath ?? "media").replace(/^\/+|\/+$/g, "")}`;

  if (!namespace || namespace.includes("..") || !/^[a-zA-Z0-9/_-]+$/.test(namespace)) {
    throw new Error("A valid media namespace is required");
  }

  const coreRequest = async (path: string, body: Record<string, unknown>) => {
    const coreUrl = options.coreUrl ?? process.env["CORE_API_URL"] ?? "http://localhost:3001";
    const apiKey = options.apiKey ?? process.env["CORE_API_KEY"];
    if (!apiKey) throw new Error("CORE_API_KEY is missing");

    const response = await fetch(`${coreUrl.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => null)) as any;
    if (!response.ok || !data?.success) {
      throw new Error(data?.error ?? "Media request failed");
    }
    return data;
  };

  const handler = async (request: Request) => {
    const url = new URL(request.url);
    const route = url.pathname.slice(basePath.length).replace(/^\//, "");

    if (route === "upload") {
      const contentType = url.searchParams.get("contentType")?.trim();
      const extension = url.searchParams
        .get("extension")
        ?.trim()
        .replace(/^\./, "")
        .toLowerCase();

      if (!contentType || !extension) {
        return Response.json(
          { error: "contentType and extension query parameters are required" },
          { status: 400 },
        );
      }
      if (!/^[a-z0-9]+$/.test(extension)) {
        return Response.json({ error: "Invalid extension" }, { status: 400 });
      }

      try {
        const key = `${namespace}/${crypto.randomUUID()}.${extension}`;
        const { uploadUrl } = await coreRequest("/storage/upload-url", {
          key,
          contentType,
        });
        const publicBase = options.publicUrl
          ? options.publicUrl.replace(/\/$/, "")
          : `${url.origin}${basePath}`;

        return Response.json({
          success: true,
          uploadUrl,
          key,
          publicUrl: `${publicBase}/${key}`,
        });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Upload failure" },
          { status: 500 },
        );
      }
    }

    if (!route) return new Response("Not found", { status: 404 });

    try {
      const { downloadUrl } = await coreRequest("/storage/download-url", {
        key: decodeURIComponent(route),
      });
      return Response.redirect(downloadUrl);
    } catch {
      return new Response("Media not found or inaccessible", { status: 404 });
    }
  };

  return { handler };
}
