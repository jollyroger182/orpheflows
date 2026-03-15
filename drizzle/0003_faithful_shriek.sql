CREATE TABLE "config_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_installations" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"token" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflow_versions" DROP CONSTRAINT "workflow_versions_workflow_id_workflows_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_executions" ALTER COLUMN "version_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_executions" ALTER COLUMN "workflow_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "client_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "client_secret" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "verification_token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "signing_secret" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_installations" ADD CONSTRAINT "workflow_installations_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "config_tokens_created_at_index" ON "config_tokens" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "workflow_versions" ADD CONSTRAINT "workflow_versions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workflow_executions_workflow_id_index" ON "workflow_executions" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_executions_version_id_index" ON "workflow_executions" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "workflow_versions_workflow_id_index" ON "workflow_versions" USING btree ("workflow_id");