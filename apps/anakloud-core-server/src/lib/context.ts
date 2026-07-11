import type { DB } from "../db/index.ts";

export type ServiceName = "teachday" | "pedconnect" | "parentup" | "pedmd";

interface ServiceKeyEntry {
  key: string;
  service: ServiceName;
  /** Required for pedconnect keys — each per-centre instance gets a key bound to its centreId. */
  centreId?: string;
}

export interface GraphQLContext {
  db: DB;
  /** Which Anakloud app is calling, resolved from x-service-key. */
  service: ServiceName | null;
  /** Centre bound to the key (pedconnect only). */
  centreId: string | null;
  /** Acting user asserted by the calling service via x-actor-id (teacher for TeachDay). */
  actorId: string | null;
}

const DEFAULT_SERVICE_KEYS: ServiceKeyEntry[] = [
  { key: "dev-teachday", service: "teachday" },
  {
    key: "dev-pedconnect",
    service: "pedconnect",
    centreId: "00000000-0000-0000-0000-000000000000",
  },
  { key: "dev-parentup", service: "parentup" },
  { key: "dev-pedmd", service: "pedmd" },
];

function loadServiceKeys(): ServiceKeyEntry[] {
  const raw = process.env["SERVICE_KEYS"];
  if (!raw) return DEFAULT_SERVICE_KEYS;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error("SERVICE_KEYS is not valid JSON — all requests will be unauthenticated");
    return [];
  }
}

const serviceKeys = loadServiceKeys();

export function buildContext(dbInstance: DB, request: Request): GraphQLContext {
  const key = request.headers.get("x-service-key");
  const entry = key ? serviceKeys.find((e) => e.key === key) : undefined;

  return {
    db: dbInstance,
    service: entry?.service ?? null,
    centreId: entry?.centreId ?? null,
    actorId: request.headers.get("x-actor-id"),
  };
}
