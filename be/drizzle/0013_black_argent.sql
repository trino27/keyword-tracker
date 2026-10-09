CREATE TYPE "public"."site_check_status_enum" AS ENUM('passed', 'failed', 'notApplicable');--> statement-breakpoint
CREATE TABLE "site_checks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"run_id" bigint NOT NULL,
	"code" varchar(64) NOT NULL,
	"status" "site_check_status_enum" NOT NULL,
	"severity" "seo_issue_severity_enum" NOT NULL,
	"details_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_checks" ADD CONSTRAINT "site_checks_run_id_crawl_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."crawl_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "site_checks_run_id_code_uq" ON "site_checks" USING btree ("run_id","code");