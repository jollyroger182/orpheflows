CREATE TYPE "public"."whitelist_type" AS ENUM('domain');--> statement-breakpoint
CREATE TABLE "workflow_whitelists" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"type" "whitelist_type" NOT NULL,
	"value" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflow_whitelists" ADD CONSTRAINT "workflow_whitelists_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_whitelists" ADD CONSTRAINT "workflow_whitelists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workflow_whitelists_workflow_id_index" ON "workflow_whitelists" USING btree ("workflow_id");