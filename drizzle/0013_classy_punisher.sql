ALTER TABLE "audit_logs" RENAME COLUMN "user" TO "user_id";--> statement-breakpoint
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_user_users_id_fk";
--> statement-breakpoint
DROP INDEX "audit_logs_user_index";--> statement-breakpoint
DROP INDEX "audit_logs_action_user_index";--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_index" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_user_id_index" ON "audit_logs" USING btree ("action","user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_type_resource_id_index" ON "audit_logs" USING btree ("resource_type","resource_id");