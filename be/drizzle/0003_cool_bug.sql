CREATE TABLE "rank_snapshots" (
	"page_id" bigint NOT NULL,
	"keyword_id" bigint NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"position" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rank_snapshots_pk" PRIMARY KEY("page_id","keyword_id","captured_at"),
	CONSTRAINT "rank_snapshots_position_range" CHECK ("rank_snapshots"."position" between 1 and 100)
);
--> statement-breakpoint
ALTER TABLE "rank_snapshots" ADD CONSTRAINT "rank_snapshots_page_keyword_fk" FOREIGN KEY ("page_id","keyword_id") REFERENCES "public"."page_keywords"("page_id","keyword_id") ON DELETE cascade ON UPDATE no action;