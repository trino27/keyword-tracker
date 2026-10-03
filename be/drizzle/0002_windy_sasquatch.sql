CREATE TYPE "public"."seo_issue_severity_enum" AS ENUM('error', 'warning', 'notice');--> statement-breakpoint
CREATE TABLE "keywords" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"term" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_keywords" (
	"page_id" bigint NOT NULL,
	"keyword_id" bigint NOT NULL,
	"relevance" real NOT NULL,
	"last_seen_run_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "page_keywords_pk" PRIMARY KEY("page_id","keyword_id"),
	CONSTRAINT "page_keywords_relevance_range" CHECK ("page_keywords"."relevance" > 0 and "page_keywords"."relevance" <= 1)
);
--> statement-breakpoint
CREATE TABLE "seo_issues" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"page_id" bigint NOT NULL,
	"code" varchar(64) NOT NULL,
	"severity" "seo_issue_severity_enum" NOT NULL,
	"details_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "page_keywords" ADD CONSTRAINT "page_keywords_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_keywords" ADD CONSTRAINT "page_keywords_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_keywords" ADD CONSTRAINT "page_keywords_last_seen_run_id_crawl_runs_id_fk" FOREIGN KEY ("last_seen_run_id") REFERENCES "public"."crawl_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_issues" ADD CONSTRAINT "seo_issues_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "keywords_term_uq" ON "keywords" USING btree ("term");--> statement-breakpoint
CREATE INDEX "page_keywords_keyword_id_idx" ON "page_keywords" USING btree ("keyword_id");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_issues_page_id_code_uq" ON "seo_issues" USING btree ("page_id","code");