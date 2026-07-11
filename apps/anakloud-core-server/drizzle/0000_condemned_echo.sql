CREATE TYPE "public"."core_session_status" AS ENUM('Draft', 'Submitted', 'Archived');--> statement-breakpoint
CREATE TYPE "public"."core_session_type" AS ENUM('Session', 'Evaluation');--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"centre_id" uuid NOT NULL,
	"type" "core_session_type" DEFAULT 'Session' NOT NULL,
	"status" "core_session_status" DEFAULT 'Draft' NOT NULL,
	"occurred_at" timestamp,
	"notes" text,
	"structured_data" jsonb,
	"parent_summary" text,
	"visible_to_parent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "sessions_child_id_idx" ON "sessions" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "sessions_centre_id_idx" ON "sessions" USING btree ("centre_id");--> statement-breakpoint
CREATE INDEX "sessions_author_id_idx" ON "sessions" USING btree ("author_id");