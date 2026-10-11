CREATE TYPE "public"."psi_strategy_enum" AS ENUM('mobile', 'desktop');--> statement-breakpoint
ALTER TABLE "page_speed" ADD COLUMN "strategy" "psi_strategy_enum" DEFAULT 'mobile' NOT NULL;--> statement-breakpoint
ALTER TABLE "page_speed" ADD CONSTRAINT "page_speed_lighthouse_mobile_only" CHECK ("page_speed"."strategy" = 'mobile' or (
        "page_speed"."lighthouse_judged" is null and "page_speed"."lighthouse_not_applicable" is null
        and "page_speed"."lighthouse_failed" is null
        and "page_speed"."seo_score" is null and "page_speed"."accessibility_score" is null));