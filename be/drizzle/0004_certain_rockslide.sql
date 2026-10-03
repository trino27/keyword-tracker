ALTER TABLE "page_keywords" DROP CONSTRAINT "page_keywords_last_seen_run_id_crawl_runs_id_fk";
--> statement-breakpoint
ALTER TABLE "pages" DROP CONSTRAINT "pages_last_seen_run_id_crawl_runs_id_fk";
--> statement-breakpoint
ALTER TABLE "page_keywords" ADD CONSTRAINT "page_keywords_last_seen_run_id_crawl_runs_id_fk" FOREIGN KEY ("last_seen_run_id") REFERENCES "public"."crawl_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_last_seen_run_id_crawl_runs_id_fk" FOREIGN KEY ("last_seen_run_id") REFERENCES "public"."crawl_runs"("id") ON DELETE cascade ON UPDATE no action;