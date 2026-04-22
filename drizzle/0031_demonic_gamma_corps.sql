CREATE TYPE "public"."whitelist_scope" AS ENUM('user', 'workflow');--> statement-breakpoint
CREATE TABLE "whitelists" (
	"id" serial PRIMARY KEY NOT NULL,
	"scope" "whitelist_scope" NOT NULL,
	"workflow_id" integer,
	"user_id" text,
	"type" "whitelist_type" NOT NULL,
	"value" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "user_whitelists" CASCADE;--> statement-breakpoint
DROP TABLE "workflow_whitelists" CASCADE;--> statement-breakpoint
ALTER TABLE "whitelists" ADD CONSTRAINT "whitelists_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whitelists" ADD CONSTRAINT "whitelists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whitelists" ADD CONSTRAINT "whitelists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_whitelists_workflow_scope" ON "whitelists" USING btree ("workflow_id","type","value") WHERE scope = 'workflow';--> statement-breakpoint
CREATE INDEX "idx_whitelists_user_scope" ON "whitelists" USING btree ("user_id","type","value") WHERE scope = 'user';