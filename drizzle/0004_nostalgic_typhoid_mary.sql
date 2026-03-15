ALTER TABLE "config_tokens" ALTER COLUMN "expires_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "app_id" text NOT NULL;