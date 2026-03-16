ALTER TABLE "workflow_executions" ADD COLUMN "data" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_installations" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workflow_executions_created_at_index" ON "workflow_executions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "workflow_executions_workflow_id_created_at_index" ON "workflow_executions" USING btree ("workflow_id","created_at");--> statement-breakpoint
CREATE INDEX "workflow_versions_workflow_id_created_at_index" ON "workflow_versions" USING btree ("workflow_id","created_at");--> statement-breakpoint
ALTER TABLE "workflow_installations" ADD CONSTRAINT "workflow_installations_workflow_id_unique" UNIQUE("workflow_id");