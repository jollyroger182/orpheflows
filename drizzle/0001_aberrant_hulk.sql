CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflows" RENAME COLUMN "user_id" TO "author_id";--> statement-breakpoint
ALTER TABLE "workflow_executions" DROP CONSTRAINT "workflow_executions_version_id_workflow_id_workflow_versions_id_workflow_id_fk";
--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "description" text DEFAULT 'A brand new workflow' NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_versions_id_workflow_id_fk" FOREIGN KEY ("version_id","workflow_id") REFERENCES "public"."workflow_versions"("id","workflow_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;