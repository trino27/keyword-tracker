ALTER TABLE "pages" DROP CONSTRAINT "pages_checks_codes_nonempty";--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_checks_judged_clean" CHECK (array_is_clean("pages"."checks_judged"));--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_checks_not_applicable_clean" CHECK (array_is_clean("pages"."checks_not_applicable"));