ALTER TABLE "user_tokens" DROP CONSTRAINT "user_tokens_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_whitelists" DROP CONSTRAINT "user_whitelists_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_variables" DROP CONSTRAINT "workflow_variables_workflow_id_workflows_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_user_notifs" DROP CONSTRAINT "workflow_user_notifs_workflow_id_workflows_id_fk";
--> statement-breakpoint
ALTER TABLE "workflow_whitelists" DROP CONSTRAINT "workflow_whitelists_workflow_id_workflows_id_fk";
--> statement-breakpoint
ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_whitelists" ADD CONSTRAINT "user_whitelists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_variables" ADD CONSTRAINT "workflow_variables_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_user_notifs" ADD CONSTRAINT "workflow_user_notifs_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_whitelists" ADD CONSTRAINT "workflow_whitelists_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;