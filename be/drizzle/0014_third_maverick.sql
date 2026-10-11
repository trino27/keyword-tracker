CREATE TYPE "public"."cwv_source_enum" AS ENUM('url', 'origin', 'lab');--> statement-breakpoint
CREATE TYPE "public"."page_speed_status_enum" AS ENUM('queued', 'running', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "page_speed" (
	"page_id" bigint PRIMARY KEY NOT NULL,
	"status" "page_speed_status_enum" DEFAULT 'queued' NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_until" timestamp with time zone,
	"last_error" varchar(64),
	"lcp_ms" integer,
	"lcp_source" "cwv_source_enum",
	"inp_ms" integer,
	"inp_source" "cwv_source_enum",
	"cls" real,
	"cls_source" "cwv_source_enum",
	"performance_score" smallint,
	"measured_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "page_speed_attempts_range" CHECK ("page_speed"."attempts" between 0 and 5),
	CONSTRAINT "page_speed_running_is_leased" CHECK ("page_speed"."status" <> 'running' or "page_speed"."locked_until" is not null),
	CONSTRAINT "page_speed_failed_says_why" CHECK ("page_speed"."status" <> 'failed' or "page_speed"."last_error" is not null),
	CONSTRAINT "page_speed_done_is_measured" CHECK ("page_speed"."status" <> 'done' or "page_speed"."measured_at" is not null),
	CONSTRAINT "page_speed_measurement_whole" CHECK (("page_speed"."measured_at" is null) = ("page_speed"."lcp_ms" is null)
        and ("page_speed"."measured_at" is null) = ("page_speed"."lcp_source" is null)
        and ("page_speed"."measured_at" is null) = ("page_speed"."cls" is null)
        and ("page_speed"."measured_at" is null) = ("page_speed"."cls_source" is null)
        and ("page_speed"."measured_at" is null) = ("page_speed"."performance_score" is null)),
	CONSTRAINT "page_speed_inp_pair" CHECK (("page_speed"."inp_ms" is null) = ("page_speed"."inp_source" is null)
        and ("page_speed"."inp_ms" is null or "page_speed"."measured_at" is not null)),
	CONSTRAINT "page_speed_inp_field_only" CHECK ("page_speed"."inp_source" is null or "page_speed"."inp_source" <> 'lab'),
	CONSTRAINT "page_speed_values_range" CHECK (("page_speed"."lcp_ms" is null or "page_speed"."lcp_ms" >= 0)
        and ("page_speed"."inp_ms" is null or "page_speed"."inp_ms" >= 0)
        and ("page_speed"."cls" is null or "page_speed"."cls" >= 0)
        and ("page_speed"."performance_score" is null or "page_speed"."performance_score" between 0 and 100))
);
--> statement-breakpoint
ALTER TABLE "page_speed" ADD CONSTRAINT "page_speed_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "page_speed_claim_idx" ON "page_speed" USING btree ("next_attempt_at") WHERE "page_speed"."status" in ('queued', 'running');