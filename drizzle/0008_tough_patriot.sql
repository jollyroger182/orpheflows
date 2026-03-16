ALTER TABLE "workflows" ALTER COLUMN "name" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "workflows" ALTER COLUMN "description" SET DATA TYPE varchar(200);--> statement-breakpoint
ALTER TABLE "workflows" ALTER COLUMN "description" SET DEFAULT 'A brand new workflow';