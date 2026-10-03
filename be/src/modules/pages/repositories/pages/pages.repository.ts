import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
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
          lastSeenRunId: sql`excluded.last_seen_run_id`,
          crawledAt: sql`excluded.crawled_at`,
          updatedAt: new Date(),
        },
      })
      .returning({ id: pages.id, url: pages.url });
  }
}
