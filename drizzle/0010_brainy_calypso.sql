CREATE TABLE "listeners" (
	"id" serial PRIMARY KEY NOT NULL,
	"triggers_workflow_id" integer,
	"event" text NOT NULL,
	"param" text,
	"param_num" real,
	"handler" text NOT NULL,
	"data" text,
	CONSTRAINT "listeners_triggers_workflow_id_unique" UNIQUE("triggers_workflow_id")
);
--> statement-breakpoint
ALTER TABLE "listeners" ADD CONSTRAINT "listeners_triggers_workflow_id_workflows_id_fk" FOREIGN KEY ("triggers_workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listeners_event_param_index" ON "listeners" USING btree ("event","param");--> statement-breakpoint
CREATE INDEX "listeners_event_param_num_index" ON "listeners" USING btree ("event","param_num");