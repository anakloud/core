/**
 * One-shot port of the services catalog from a PedConnect database into
 * Anakloud Core. PedConnect stores services per-centre; Core keeps one
 * centre-agnostic catalog row per code (first row wins on duplicates).
 *
 * Usage:
 *   PEDCONNECT_DATABASE_URL=postgresql://... bun run scripts/port-services.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { services } from "../src/db/schema/index.ts";

const sourceUrl = process.env["PEDCONNECT_DATABASE_URL"];
if (!sourceUrl) {
  console.error("PEDCONNECT_DATABASE_URL is required");
  process.exit(1);
}

const source = neon(sourceUrl);
const target = drizzle(neon(process.env["DATABASE_URL"]!));

interface SourceRow {
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  type: string | null;
  default_duration_mins: number | null;
  is_active: boolean;
  created_at: string;
}

const rows = (await source.query(
  `SELECT DISTINCT ON (code)
     code, name, description, category, type, default_duration_mins, is_active, created_at
   FROM services
   ORDER BY code, created_at ASC`,
)) as SourceRow[];

if (!rows.length) {
  console.log("No services found in the PedConnect database.");
  process.exit(0);
}

console.log(`Porting ${rows.length} services...`);
for (const r of rows) {
  await target
    .insert(services)
    .values({
      code: r.code,
      name: r.name,
      description: r.description,
      category: r.category,
      type: r.type,
      defaultDurationMins: r.default_duration_mins,
      isActive: r.is_active,
      createdAt: new Date(r.created_at),
    })
    .onConflictDoUpdate({
      target: services.code,
      set: {
        name: r.name,
        description: r.description,
        category: r.category,
        type: r.type,
        defaultDurationMins: r.default_duration_mins,
        isActive: r.is_active,
        updatedAt: new Date(),
      },
    });
  console.log(`  upserted ${r.code} — ${r.name}`);
}
console.log("Done.");
