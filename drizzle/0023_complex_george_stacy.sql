CREATE TABLE "workflow_user_notifs" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"notified_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "workflow_user_notifs" ADD CONSTRAINT "workflow_user_notifs_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_user_notifs" ADD CONSTRAINT "workflow_user_notifs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_workflow_user_notifs_workflow_user" ON "workflow_user_notifs" USING btree ("user_id","workflow_id");