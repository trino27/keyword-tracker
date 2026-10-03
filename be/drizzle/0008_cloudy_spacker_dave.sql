ALTER TABLE "pages" ADD COLUMN "checks_judged" varchar(64)[];--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "checks_not_applicable" varchar(64)[];--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_checks_sets_together" CHECK (("pages"."checks_judged" is null) = ("pages"."checks_not_applicable" is null));--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_checks_judged_matches_applicable" CHECK ("pages"."checks_judged" is null
          or "pages"."checks_applicable" = cardinality("pages"."checks_judged"));--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_checks_sets_disjoint" CHECK ("pages"."checks_judged" is null
          or not ("pages"."checks_judged" && "pages"."checks_not_applicable"));--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_checks_codes_nonempty" CHECK (("pages"."checks_judged" is null or not ('' = any("pages"."checks_judged")))
          and ("pages"."checks_not_applicable" is null
               or not ('' = any("pages"."checks_not_applicable"))));