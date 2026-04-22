CREATE TABLE "user_whitelists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "whitelist_type" NOT NULL,
	"value" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "workflow_whitelists_workflow_id_index";--> statement-breakpoint
ALTER TABLE "user_whitelists" ADD CONSTRAINT "user_whitelists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_whitelists" ADD CONSTRAINT "user_whitelists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_whitelists_user_id_type_value_index" ON "user_whitelists" USING btree ("user_id","type","value");--> statement-breakpoint
CREATE INDEX "workflow_whitelists_workflow_id_type_value_index" ON "workflow_whitelists" USING btree ("workflow_id","type","value");