import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import {
  CRAWL_ISSUE_CODES,
  LIGHTHOUSE_ISSUE_CODES,
  PAGE_SPEED_ISSUE_CODES,
  type TCrawlSeoIssue,
  type TLighthouseSeoIssue,
  type TPageSpeedSeoIssue,
} from '@app/contracts';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import { seoIssues } from '@persistence/schema/tables/seo-issues/seo-issues.schema';

/** A crawl finding as the catalogue types it, addressed to a page. */
export type TNewCrawlIssue = TCrawlSeoIssue & { pageId: number };

/** A speed finding addressed to a page. */
export type TNewPageSpeedIssue = TPageSpeedSeoIssue & { pageId: number };

/** A Lighthouse finding addressed to a page. */
export type TNewLighthouseIssue = TLighthouseSeoIssue & { pageId: number };

@Injectable()
export class SeoIssuesRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * A crawl's findings describe its latest fetch only: the fetched pages' CRAWL findings
   * are replaced whole. Speed findings are left alone — the PageSpeed worker owns them,
   * and they land minutes after this runs. Each writer has its own named method with its
   * code set baked in, so no caller can pass the wrong one.
   */
  async replaceCrawlFindingsForWorker(
    tx: Transaction,
    pageIds: number[],
    rows: TNewCrawlIssue[],
  ): Promise<void> {
    if (pageIds.length === 0) return;
    await tx
      .delete(seoIssues)
      .where(
        and(
          inArray(seoIssues.pageId, pageIds),
          inArray(seoIssues.code, CRAWL_ISSUE_CODES),
        ),
      );
    if (rows.length > 0) await tx.insert(seoIssues).values(rows);
  }

  /**
   * A measurement's findings replace the page's previous SPEED findings, in the same
   * transaction as the measurement itself. Crawl findings are left alone.
   */
  async replacePageSpeedFindingsForWorker(
    tx: Transaction,
    pageId: number,
    rows: TNewPageSpeedIssue[],
  ): Promise<void> {
    await tx
      .delete(seoIssues)
      .where(
        and(
          eq(seoIssues.pageId, pageId),
          inArray(seoIssues.code, PAGE_SPEED_ISSUE_CODES),
        ),
      );
    if (rows.length > 0) await tx.insert(seoIssues).values(rows);
  }

  /**
   * A measurement's Lighthouse findings replace the page's previous ones, in the same
   * transaction as the measurement. An answer without the categories passes none, which
   * clears them: a finding with no Lighthouse record behind it could not be shown as a
   * check (lighthouse-checks D20). Crawl and Core Web Vitals findings are left alone.
   */
  async replaceLighthouseFindingsForWorker(
    tx: Transaction,
    pageId: number,
    rows: TNewLighthouseIssue[],
  ): Promise<void> {
    await tx
      .delete(seoIssues)
      .where(
        and(
          eq(seoIssues.pageId, pageId),
          inArray(seoIssues.code, LIGHTHOUSE_ISSUE_CODES),
        ),
      );
    if (rows.length > 0) await tx.insert(seoIssues).values(rows);
  }
}
