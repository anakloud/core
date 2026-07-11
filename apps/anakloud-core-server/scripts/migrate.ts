import { neon } from "@neondatabase/serverless";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const sql = neon(process.env["DATABASE_URL"]!);

async function exec(statement: string) {
  const s = statement.trim();
  if (!s) return;
  await sql.query(s);
}

const DROP_STATEMENTS = [`DROP TABLE IF EXISTS services CASCADE`];

const drizzleDir = join(import.meta.dir, "../drizzle");
const sqlFiles = readdirSync(drizzleDir).filter((f) => f.endsWith(".sql")).sort();
if (!sqlFiles.length) { console.error("No migration files found"); process.exit(1); }

console.log("Dropping existing tables and types...");
for (const s of DROP_STATEMENTS) {
  try { await exec(s); } catch (e) { console.warn("Drop warning:", String(e).slice(0, 80)); }
}
console.log("Done.\n");

for (const file of sqlFiles) {
  const sql = readFileSync(join(drizzleDir, file), "utf-8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`Applying ${statements.length} statements from ${file}...`);
  for (let i = 0; i < statements.length; i++) {
    try {
      await exec(statements[i]!);
      process.stdout.write(`  [${i + 1}/${statements.length}]\r`);
    } catch (e) {
      console.error(`\nFailed at statement ${i + 1}:\n${statements[i]!.slice(0, 120)}`);
      console.error(e);
      process.exit(1);
    }
  }
  console.log(`  done.\n`);
}
console.log("All migrations applied.");
