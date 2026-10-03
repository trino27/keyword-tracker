import { Injectable } from '@nestjs/common';
import type {
  IKeywordPosition,
  IPageIssueCounts,
  IPageListResponse,
} from '@app/contracts';
import { escapeLike } from '@core/utils/escape-like/escape-like';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import { ClientsService } from '@modules/clients/services/clients/clients.service';
import { normalizeText } from '@modules/page-analysis/services/text/normalize-text/normalize-text';
import type { ListPagesQueryDto } from '../../dto/list-pages-query/list-pages-query.dto';
import {
  PageListRepository,
  type IPageKeywordRow,
  type IPageListFilter,
} from '../../repositories/page-list/page-list.repository';
import { pickBestPosition } from '../best-position/pick-best-position';

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
    private readonly clients: ClientsService,
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
    const [keywordRows, issueRows] = await Promise.all([
      this.list.keywordsForPages(scope, pageIds),
      this.list.issueCountsForPages(scope, pageIds),
    ]);

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
          issues: issuesByPage.get(row.id) ?? {
            total: 0,
            error: 0,
            warning: 0,
            notice: 0,
          },
          lastCapturedAt: lastCapturedAtOf(keywords),
        };
      }),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }
}
