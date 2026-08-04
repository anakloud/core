# Core Asset Storage Contract

Core is the only service that talks directly to Cloudflare R2. Application servers request upload and download URLs from Core; browser and mobile clients never receive R2 credentials or a Core service key.

## Canonical reference

Persist the R2 object key, not a public URL or a presigned URL.

```text
pending-credentials/f29568a4-4783-4a07-a577-862081d81f2f.jpg
users/0d3f7a25-acde-4dc7-a128-a51ef713c8d4.webp
sessions/org-id/session-id/asset-id.pdf
```

Object keys are durable. Presigned URLs are temporary transport values and must never be written to application databases, Better Auth profile fields, events, or long-lived caches.

## Upload flow

1. The application server chooses and validates the object key and content type.
2. The application server calls `POST /storage/upload-url` on Core with its `x-api-key`.
3. Core returns `{ uploadUrl, key }`.
4. The client uploads bytes to `uploadUrl` using the exact content type used for signing.
5. The application persists `key`.

An application upload endpoint may additionally return a short-lived `downloadUrl` for an immediate preview. It must return `key` separately, and its mutation or database write must use `key`.

## Read flow

Before returning an asset to a browser or mobile client, the owning application server calls:

```http
POST /storage/resolve-url
Content-Type: application/json
x-api-key: <CORE_API_KEY>

{
  "reference": "pending-credentials/f29568a4-4783-4a07-a577-862081d81f2f.jpg",
  "expiresIn": 900
}
```

Core returns:

```json
{
  "success": true,
  "key": "pending-credentials/f29568a4-4783-4a07-a577-862081d81f2f.jpg",
  "url": "https://<r2-host>/<bucket>/<key>?<signature>"
}
```

`reference` may be a canonical key or a legacy Core/R2 URL. Core re-signs recognized legacy URLs and passes unrelated external HTTP(S) URLs through unchanged. `expiresIn` is clamped to 60–604800 seconds and defaults to 900 for resolution.

The older `POST /storage/sign-url` endpoint remains available for compatibility. New integrations must use `/storage/resolve-url`.

## API response rules

- Fields consumed as image or document URLs must contain the resolved temporary `url`, never a bare key.
- Optional assets should resolve to `null` when Core is unavailable; do not return a bare key that a browser will interpret as a relative URL.
- Required assets, such as credentials awaiting administrative review, should fail the server request when Core cannot resolve them so the caller can show a service-unavailable state.
- Do not cache a resolved URL beyond its expiry. Resolve it again when the owning record is read.

## Configuration

Every application server that uses assets requires:

```env
CORE_API_URL=http://localhost:3001
CORE_API_KEY=<shared service key>
```

Core requires its R2 credentials and bucket configuration. Core runs on port `3001` in local development and must be running for local asset reads and uploads.

## Legacy data

Existing presigned or R2 public URLs remain readable through `/storage/resolve-url`, but should be migrated to their extracted object keys when practical. No new writes may persist presigned URLs.
