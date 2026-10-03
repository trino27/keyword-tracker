CREATE INDEX "keywords_term_trgm_idx" ON "keywords" USING gin ("term" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "pages_url_trgm_idx" ON "pages" USING gin ("url" gin_trgm_ops);