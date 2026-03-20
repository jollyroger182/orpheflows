CREATE TABLE "workflow_variables" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"name" text NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "workflow_variables_workflow_id_name_unique" UNIQUE("workflow_id","name")
);
--> statement-breakpoint
ALTER TABLE "workflow_variables" ADD CONSTRAINT "workflow_variables_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workflow_variables_workflow_id_index" ON "workflow_variables" USING btree ("workflow_id");