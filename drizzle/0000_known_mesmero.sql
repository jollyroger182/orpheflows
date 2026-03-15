CREATE TABLE "workflow_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_id" integer,
	"workflow_id" integer
);
--> statement-breakpoint
CREATE TABLE "workflow_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"blocks" text,
	"code" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_versions_id_workflow_id_unique" UNIQUE("id","workflow_id")
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"blocks" text,
	"code" text DEFAULT '' NOT NULL,
	"blocks_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"code_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_version_id_workflow_id_workflow_versions_id_workflow_id_fk" FOREIGN KEY ("version_id","workflow_id") REFERENCES "public"."workflow_versions"("id","workflow_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_versions" ADD CONSTRAINT "workflow_versions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;