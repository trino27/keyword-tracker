CREATE TYPE "public"."crawl_item_status_enum" AS ENUM('crawled', 'skipped_listing', 'skipped_robots', 'skipped_not_html', 'skipped_other_site', 'failed');--> statement-breakpoint
CREATE TYPE "public"."crawl_status_enum" AS ENUM('queued', 'running', 'succeeded', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "public"."crawl_trigger_enum" AS ENUM('seed', 'user');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"name" varchar(120) NOT NULL,
	"website_url" varchar(2048) NOT NULL,
	"site_key" varchar(253) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crawl_run_items" (
	"run_id" bigint NOT NULL,
	"sitemap_position" integer NOT NULL,
	"url" varchar(2048) NOT NULL,
	"status" "crawl_item_status_enum" NOT NULL,
	"reason" varchar(300),
	"http_status" smallint,
	"page_id" bigint,
	CONSTRAINT "crawl_run_items_pk" PRIMARY KEY("run_id","sitemap_position"),
	CONSTRAINT "crawl_run_items_page_required" CHECK ("crawl_run_items"."status" <> 'crawled' or "crawl_run_items"."page_id" is not null),
	CONSTRAINT "crawl_run_items_reason_required" CHECK ("crawl_run_items"."status" = 'crawled' or "crawl_run_items"."reason" is not null)
);
--> statement-breakpoint
CREATE TABLE "crawl_runs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"client_id" bigint NOT NULL,
	"status" "crawl_status_enum" DEFAULT 'queued' NOT NULL,
	"trigger" "crawl_trigger_enum" NOT NULL,
	"sitemap_url" varchar(2048),
	"selection_reason" varchar(500),
	"pages_found" integer DEFAULT 0 NOT NULL,
	"pages_done" integer DEFAULT 0 NOT NULL,
	"error_code" varchar(64),
	"error_message" varchar(500),
	"attempts" smallint DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crawl_runs_finished_at_required" CHECK ("crawl_runs"."status" not in ('succeeded', 'partial', 'failed') or "crawl_runs"."finished_at" is not null),
	CONSTRAINT "crawl_runs_started_at_required" CHECK ("crawl_runs"."status" = 'queued' or "crawl_runs"."started_at" is not null),
	CONSTRAINT "crawl_runs_pages_nonnegative" CHECK ("crawl_runs"."pages_done" >= 0 and "crawl_runs"."pages_found" >= 0),
	CONSTRAINT "crawl_runs_attempts_range" CHECK ("crawl_runs"."attempts" between 0 and 3)
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"client_id" bigint NOT NULL,
	"url" varchar(2048) NOT NULL,
	"final_url" varchar(2048) NOT NULL,
	"title" varchar(1000),
	"meta_description" varchar(2000),
	"h1" varchar(1000),
	"lang" varchar(35),
	"word_count" integer NOT NULL,
	"http_status" smallint NOT NULL,
	"response_ms" integer NOT NULL,
	"html_bytes" integer NOT NULL,
	"sitemap_position" integer NOT NULL,
	"last_seen_run_id" bigint NOT NULL,
	"crawled_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_run_items" ADD CONSTRAINT "crawl_run_items_run_id_crawl_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."crawl_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_run_items" ADD CONSTRAINT "crawl_run_items_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_runs" ADD CONSTRAINT "crawl_runs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_last_seen_run_id_crawl_runs_id_fk" FOREIGN KEY ("last_seen_run_id") REFERENCES "public"."crawl_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clients_user_id_site_key_uq" ON "clients" USING btree ("user_id","site_key");--> statement-breakpoint
CREATE UNIQUE INDEX "crawl_runs_client_id_active_uq" ON "crawl_runs" USING btree ("client_id") WHERE "crawl_runs"."status" in ('queued', 'running');--> statement-breakpoint
CREATE INDEX "crawl_runs_claim_idx" ON "crawl_runs" USING btree ("created_at") WHERE "crawl_runs"."status" in ('queued', 'running');--> statement-breakpoint
CREATE INDEX "crawl_runs_client_id_created_at_idx" ON "crawl_runs" USING btree ("client_id","created_at");--> statement-breakpoint
CREATE INDEX "crawl_runs_client_id_finished_at_idx" ON "crawl_runs" USING btree ("client_id","finished_at") WHERE "crawl_runs"."status" in ('succeeded', 'partial');--> statement-breakpoint
CREATE UNIQUE INDEX "pages_client_id_url_uq" ON "pages" USING btree ("client_id","url");--> statement-breakpoint
CREATE INDEX "pages_client_id_last_seen_run_id_idx" ON "pages" USING btree ("client_id","last_seen_run_id");--> statement-breakpoint
CREATE INDEX "pages_last_seen_run_id_idx" ON "pages" USING btree ("last_seen_run_id");