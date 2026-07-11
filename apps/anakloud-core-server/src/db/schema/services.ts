import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Central service catalog — the system-of-record consumer apps (PedConnect
// et al.) sync from. Centre-agnostic: per-centre enablement lives in the
// consuming app, never here.
export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    type: varchar("type", { length: 100 }),
    defaultDurationMins: integer("default_duration_mins"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("services_code_idx").on(t.code)],
);
