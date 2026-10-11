import { Injectable } from '@nestjs/common';
import {
  pageScoreOf,
  SEO_ISSUE_CODES,
  type IKeywordPosition,
  type IPageDetail,
  type IPageIssueCounts,
  type IPageListResponse,
  type IPageScore,
} from '@app/contracts';
import { escapeLike } from '@core/utils/escape-like/escape-like';
import { PageSpeedAvailabilityService } from '@infrastructure/config/page-speed-settings/page-speed-availability/page-speed-availability.service';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import { ClientsService } from '@modules/clients/services/clients/clients.service';
import { normalizeText } from '@modules/page-analysis/services/text/normalize-text/normalize-text';
import type { ListPagesQueryDto } from '../../dto/list-pages-query/list-pages-query.dto';
import { PageNotFoundException } from '../../exceptions/pages.exceptions';
import { PageDetailRepository } from '../../repositories/page-detail/page-detail.repository';
import type { IPageSpeedRow } from '../../repositories/page-speed/page-speed-read';
import {
  PageListRepository,
  type IPageKeywordRow,
  type IPageListFilter,
} from '../../repositories/page-list/page-list.repository';
import { pickBestPosition } from '../best-position/pick-best-position';
import { composePageChecks } from '../page-checks/compose-page-checks';
import { pageSpeedSummaryOf } from '../page-speed-summary/page-speed-summary-of';

const contains = (text: string) => `%${escapeLike(text)}%`;

export function toKeywordPosition(row: IPageKeywordRow): IKeywordPosition {
  return {
    keywordId: row.keywordId,
    term: row.term,
    relevance: row.relevance,
    latestPosition: row.latestPosition,
    latestCapturedAt: row.latestCapturedAt?.toISOString() ?? null,
  };
}

/** The latest snapshot instant among a page's keywords. */
export function lastCapturedAtOf(keywords: IKeywordPosition[]): string | null {
  return keywords.reduce<string | null>(
    (latest, keyword) =>
      keyword.latestCapturedAt !== null &&
      (latest === null || keyword.latestCapturedAt > latest)
        ? keyword.latestCapturedAt
        : latest,
    null,
  );
}

@Injectable()
export class PageReadService {
  constructor(
    private readonly list: PageListRepository,
    private readonly detail: PageDetailRepository,
    private readonly clients: ClientsService,
    private readonly pageSpeed: PageSpeedAvailabilityService,
  ) {}

  /**
   * Four statements whatever the page size — never a query per row. A foreign or
   * missing `clientId` is a 404, the same answer as everywhere else.
   */
  async listPages(
    scope: IUserScope,
    query: ListPagesQueryDto,
  ): Promise<IPageListResponse> {
    if (query.clientId !== undefined)
      await this.clients.assertOwnedClient(scope, query.clientId);

    const filter: IPageListFilter = { clientId: query.clientId };
    if (query.q !== undefined) {
      // Keywords are stored normalized ("link building"); the URL is matched as typed.
      filter.search = {
        urlPattern: contains(query.q),
        termPattern: contains(normalizeText(query.q) || query.q),
      };
    }

    const offset = (query.page - 1) * query.pageSize;
    const [rows, total] = await Promise.all([
      this.list.listSlice(scope, filter, query.pageSize, offset),
      this.list.countMatching(scope, filter),
    ]);
    const pageIds = rows.map((row) => row.id);
    const [keywordRows, issueRows, siteWideRows] = await Promise.all([
      this.list.keywordsForPages(scope, pageIds),
      this.list.issueCountsForPages(scope, pageIds),
      this.list.siteWideCountsForPages(scope, pageIds),
    ]);
    const siteWideByPage = new Map(
      siteWideRows.map((row) => [row.pageId, row.siteWide]),
    );

    const keywordsByPage = new Map<number, IKeywordPosition[]>();
    for (const row of keywordRows) {
      const keywords = keywordsByPage.get(row.pageId) ?? [];
      keywords.push(toKeywordPosition(row));
      keywordsByPage.set(row.pageId, keywords);
    }
    const issuesByPage = new Map<number, IPageIssueCounts>();
    for (const row of issueRows) {
      const counts = issuesByPage.get(row.pageId) ?? {
        total: 0,
        error: 0,
        warning: 0,
        notice: 0,
        siteWide: siteWideByPage.get(row.pageId) ?? 0,
      };
      counts[row.severity] += row.count;
      counts.total += row.count;
      issuesByPage.set(row.pageId, counts);
    }

    return {
      items: rows.map((row) => {
        const keywords = keywordsByPage.get(row.id) ?? [];
        return {
          id: row.id,
          url: row.url,
          title: row.title,
          client: { id: row.clientId, name: row.clientName },
          keywords,
          bestPosition: pickBestPosition(keywords),
          score: scoreOf(row),
          // A page nobody shares a finding with says zero, not nothing.
          issues: issuesByPage.get(row.id) ?? {
            total: 0,
            error: 0,
            warning: 0,
            notice: 0,
            siteWide: 0,
          },
          pageSpeed: pageSpeedSummaryOf(row.pageSpeed),
          lastCapturedAt: lastCapturedAtOf(keywords),
        };
      }),
      page: query.page,
      pageSize: query.pageSize,
      total,
      pageSpeedAvailability: this.pageSpeed.current(),
    };
  }

  /** A current page of the user's, with its keywords, issues and the client's last crawl. */
  async getPage(scope: IUserScope, pageId: number): Promise<IPageDetail> {
    const page = await this.detail.findCurrentPage(scope, pageId);
    if (!page) throw new PageNotFoundException({ pageId });

    const [keywordRows, issues, client] = await Promise.all([
      this.list.keywordsForPages(scope, [pageId]),
      this.detail.issuesForPage(scope, pageId),
      this.clients.getClient(scope, page.clientId),
    ]);
    const keywords = keywordRows.map(toKeywordPosition);
    const issueCodes = issues.map(({ code }) => code);

    return {
      page: {
        id: page.id,
        url: page.url,
        finalUrl: page.finalUrl,
        title: page.title,
        metaDescription: page.metaDescription,
        h1: page.h1,
        lang: page.lang,
        wordCount: page.wordCount,
        httpStatus: page.httpStatus,
        responseMs: page.responseMs,
        crawledAt: page.crawledAt.toISOString(),
      },
      client: {
        id: page.clientId,
        name: page.clientName,
        websiteUrl: page.clientWebsiteUrl,
        currentPages: page.clientCurrentPages,
      },
      keywords,
      bestPosition: pickBestPosition(keywords),
      score: scoreOf(page),
      checksByOwner: {
        crawl: composePageChecks(
          'crawl',
          page.checksJudged,
          page.checksNotApplicable,
          issueCodes,
        ),
        lighthouse: composePageChecks(
          'lighthouse',
          page.lighthouseJudged,
          page.lighthouseNotApplicable,
          issueCodes,
        ),
      },
      issues: [...issues].sort(
        (a, b) =>
          SEO_ISSUE_CODES.indexOf(a.code) - SEO_ISSUE_CODES.indexOf(b.code),
      ),
      lastCrawl: client.latestRun,
      pageSpeed: pageSpeedSummaryOf(page.pageSpeed),
      pageSpeedAvailability: this.pageSpeed.current(),
    };
  }
}

/**
 * The page's score over every scored owner: the crawl's stored counters, and Lighthouse's
 * judged list and failed count from the measurement — absent until it has been measured
 * with Lighthouse's categories (lighthouse-checks D9).
 */
function scoreOf(page: {
  checksApplicable: number;
  checksFailed: number;
  pageSpeed: IPageSpeedRow | null;
}): IPageScore {
  const applicable = page.pageSpeed?.lighthouseApplicable ?? null;
  const failed = page.pageSpeed?.lighthouseFailed ?? null;
  return pageScoreOf({
    crawl: { applicable: page.checksApplicable, failed: page.checksFailed },
    lighthouse:
      applicable === null || failed === null ? null : { applicable, failed },
  });
}
