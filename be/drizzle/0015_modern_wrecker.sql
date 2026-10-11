ALTER TABLE "page_speed" ADD COLUMN "lighthouse_judged" varchar(64)[];--> statement-breakpoint
ALTER TABLE "page_speed" ADD COLUMN "lighthouse_not_applicable" varchar(64)[];--> statement-breakpoint
ALTER TABLE "page_speed" ADD COLUMN "lighthouse_failed" smallint;--> statement-breakpoint
ALTER TABLE "page_speed" ADD COLUMN "seo_score" smallint;--> statement-breakpoint
ALTER TABLE "page_speed" ADD COLUMN "accessibility_score" smallint;--> statement-breakpoint
ALTER TABLE "page_speed" ADD COLUMN "ttfb_ms" integer;--> statement-breakpoint
ALTER TABLE "page_speed" ADD COLUMN "ttfb_source" "cwv_source_enum";--> statement-breakpoint
ALTER TABLE "page_speed" ADD COLUMN "lcp_good_share" real;--> statement-breakpoint
ALTER TABLE "page_speed" ADD COLUMN "lcp_poor_share" real;--> statement-breakpoint
ALTER TABLE "page_speed" ADD COLUMN "inp_good_share" real;--> statement-breakpoint
ALTER TABLE "page_speed" ADD COLUMN "inp_poor_share" real;--> statement-breakpoint
ALTER TABLE "page_speed" ADD COLUMN "cls_good_share" real;--> statement-breakpoint
ALTER TABLE "page_speed" ADD COLUMN "cls_poor_share" real;--> statement-breakpoint
ALTER TABLE "page_speed" ADD COLUMN "ttfb_good_share" real;--> statement-breakpoint
ALTER TABLE "page_speed" ADD COLUMN "ttfb_poor_share" real;--> statement-breakpoint
ALTER TABLE "page_speed" ADD COLUMN "lcp_breakdown_json" jsonb;--> statement-breakpoint
ALTER TABLE "page_speed" ADD CONSTRAINT "page_speed_extras_need_measurement" CHECK ("page_speed"."measured_at" is not null or (
        "page_speed"."lighthouse_judged" is null and "page_speed"."seo_score" is null
        and "page_speed"."accessibility_score" is null and "page_speed"."ttfb_ms" is null
        and "page_speed"."ttfb_good_share" is null and "page_speed"."lcp_good_share" is null
        and "page_speed"."inp_good_share" is null and "page_speed"."cls_good_share" is null
        and "page_speed"."lcp_breakdown_json" is null));--> statement-breakpoint
ALTER TABLE "page_speed" ADD CONSTRAINT "page_speed_lighthouse_sets_together" CHECK (("page_speed"."lighthouse_judged" is null) = ("page_speed"."lighthouse_not_applicable" is null)
        and ("page_speed"."lighthouse_judged" is null) = ("page_speed"."lighthouse_failed" is null));--> statement-breakpoint
ALTER TABLE "page_speed" ADD CONSTRAINT "page_speed_lighthouse_sets_disjoint" CHECK ("page_speed"."lighthouse_judged" is null
          or not ("page_speed"."lighthouse_judged" && "page_speed"."lighthouse_not_applicable"));--> statement-breakpoint
ALTER TABLE "page_speed" ADD CONSTRAINT "page_speed_lighthouse_judged_clean" CHECK (array_is_clean("page_speed"."lighthouse_judged"));--> statement-breakpoint
ALTER TABLE "page_speed" ADD CONSTRAINT "page_speed_lighthouse_not_applicable_clean" CHECK (array_is_clean("page_speed"."lighthouse_not_applicable"));--> statement-breakpoint
ALTER TABLE "page_speed" ADD CONSTRAINT "page_speed_lighthouse_failed_range" CHECK ("page_speed"."lighthouse_failed" is null or "page_speed"."lighthouse_failed"
          between 0 and cardinality("page_speed"."lighthouse_judged"));--> statement-breakpoint
ALTER TABLE "page_speed" ADD CONSTRAINT "page_speed_category_scores_range" CHECK (("page_speed"."seo_score" is null or "page_speed"."seo_score" between 0 and 100)
        and ("page_speed"."accessibility_score" is null or "page_speed"."accessibility_score" between 0 and 100));--> statement-breakpoint
ALTER TABLE "page_speed" ADD CONSTRAINT "page_speed_ttfb_pair" CHECK (("page_speed"."ttfb_ms" is null) = ("page_speed"."ttfb_source" is null)
        and ("page_speed"."ttfb_ms" is null or "page_speed"."ttfb_ms" >= 0));--> statement-breakpoint
ALTER TABLE "page_speed" ADD CONSTRAINT "page_speed_ttfb_field_only" CHECK ("page_speed"."ttfb_source" is null or "page_speed"."ttfb_source" <> 'lab');--> statement-breakpoint
ALTER TABLE "page_speed" ADD CONSTRAINT "page_speed_shares_range" CHECK (("page_speed"."lcp_good_share" is null) = ("page_speed"."lcp_poor_share" is null)
        and ("page_speed"."inp_good_share" is null) = ("page_speed"."inp_poor_share" is null)
        and ("page_speed"."cls_good_share" is null) = ("page_speed"."cls_poor_share" is null)
        and ("page_speed"."ttfb_good_share" is null) = ("page_speed"."ttfb_poor_share" is null)
        and coalesce("page_speed"."lcp_good_share" >= 0 and "page_speed"."lcp_poor_share" >= 0
          and "page_speed"."lcp_good_share" + "page_speed"."lcp_poor_share" <= 1.0001, true)
        and coalesce("page_speed"."inp_good_share" >= 0 and "page_speed"."inp_poor_share" >= 0
          and "page_speed"."inp_good_share" + "page_speed"."inp_poor_share" <= 1.0001, true)
        and coalesce("page_speed"."cls_good_share" >= 0 and "page_speed"."cls_poor_share" >= 0
          and "page_speed"."cls_good_share" + "page_speed"."cls_poor_share" <= 1.0001, true)
        and coalesce("page_speed"."ttfb_good_share" >= 0 and "page_speed"."ttfb_poor_share" >= 0
          and "page_speed"."ttfb_good_share" + "page_speed"."ttfb_poor_share" <= 1.0001, true));--> statement-breakpoint
ALTER TABLE "page_speed" ADD CONSTRAINT "page_speed_shares_field_only" CHECK (("page_speed"."lcp_good_share" is null or coalesce("page_speed"."lcp_source" in ('url', 'origin'), false))
        and ("page_speed"."inp_good_share" is null or coalesce("page_speed"."inp_source" in ('url', 'origin'), false))
        and ("page_speed"."cls_good_share" is null or coalesce("page_speed"."cls_source" in ('url', 'origin'), false))
        and ("page_speed"."ttfb_good_share" is null or coalesce("page_speed"."ttfb_source" in ('url', 'origin'), false)));