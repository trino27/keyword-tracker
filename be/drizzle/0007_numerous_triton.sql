ALTER TABLE "pages" ADD COLUMN "checks_applicable" smallint NOT NULL;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "checks_failed" smallint NOT NULL;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_checks_applicable_positive" CHECK ("pages"."checks_applicable" > 0);--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_checks_failed_range" CHECK ("pages"."checks_failed" >= 0 and "pages"."checks_failed" <= "pages"."checks_applicable");