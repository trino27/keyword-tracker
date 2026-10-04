import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { TSeoIssueCode } from '@app/contracts';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import { pages } from '@persistence/schema/tables/pages/pages.schema';

/** What a crawl run writes for one post. */
export interface IUpsertPage {
  clientId: number;
  url: string;
  finalUrl: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  lang: string | null;
  wordCount: number;
  httpStatus: number;
  responseMs: number;
  htmlBytes: number;
  sitemapPosition: number;
  /** The score's denominator and its failed count, from the same pass as the issues. */
  checksApplicable: number;
  checksFailed: number;
  /** And which checks those were — same pass, same statement. */
  checksJudged: TSeoIssueCode[];
  checksNotApplicable: TSeoIssueCode[];
  lastSeenRunId: number;
  crawledAt: Date;
}

@Injectable()
export class PagesRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * Upserts a run's posts on (client_id, url). A re-crawl keeps the page id — and with
   * it the page's keyword pairs and their position history — and moves
   * last_seen_run_id to the new run. Nothing is ever deleted here.
   */
  async upsertManyForWorker(
    tx: Transaction,
    rows: IUpsertPage[],
  ): Promise<{ id: number; url: string }[]> {
    if (rows.length === 0) return [];
    return tx
      .insert(pages)
      .values(rows)
      .onConflictDoUpdate({
        target: [pages.clientId, pages.url],
        set: {
          finalUrl: sql`excluded.final_url`,
          title: sql`excluded.title`,
          metaDescription: sql`excluded.meta_description`,
          h1: sql`excluded.h1`,
          lang: sql`excluded.lang`,
          wordCount: sql`excluded.word_count`,
          httpStatus: sql`excluded.http_status`,
          responseMs: sql`excluded.response_ms`,
          htmlBytes: sql`excluded.html_bytes`,
          sitemapPosition: sql`excluded.sitemap_position`,
          // Refreshed with the issues: counters left at their first value would produce a
          // score that contradicts the issue list beside it.
          checksApplicable: sql`excluded.checks_applicable`,
          checksFailed: sql`excluded.checks_failed`,
          // Overwritten, never merged: a page that had two skips and now has none must
          // come back with an empty list, or the screen keeps naming a check as skipped
          // that this crawl judged.
          checksJudged: sql`excluded.checks_judged`,
          checksNotApplicable: sql`excluded.checks_not_applicable`,
          lastSeenRunId: sql`excluded.last_seen_run_id`,
          crawledAt: sql`excluded.crawled_at`,
        },
      })
      .returning({ id: pages.id, url: pages.url });
  }
}
