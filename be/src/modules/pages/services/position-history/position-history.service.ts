import { Injectable } from '@nestjs/common';
import {
  dayRangeToUtc,
  type IPositionHistory,
  type IPositionSeries,
} from '@app/contracts';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import type { PositionsQueryDto } from '../../dto/positions-query/positions-query.dto';
import { PageNotFoundException } from '../../exceptions/pages.exceptions';
import { PageDetailRepository } from '../../repositories/page-detail/page-detail.repository';
import { resolveHistoryRange } from './resolve-history-range';

@Injectable()
export class PositionHistoryService {
  constructor(private readonly pages: PageDetailRepository) {}

  /**
   * A page's positions over the user's calendar range, in the user's zone (D2): the
   * days become UTC bounds once, here, and the database scans one key range.
   */
  async getHistory(
    scope: IUserScope,
    pageId: number,
    query: PositionsQueryDto,
    now: Date = new Date(),
  ): Promise<IPositionHistory> {
    const range = resolveHistoryRange(query, scope.timeZone, now);
    const page = await this.pages.findCurrentPage(scope, pageId);
    if (!page) throw new PageNotFoundException({ pageId });

    const { fromUtc, toUtcExclusive } = dayRangeToUtc(
      range.from,
      range.to,
      scope.timeZone,
    );
    const rows = await this.pages.historyForPage(
      scope,
      pageId,
      fromUtc,
      toUtcExclusive,
    );

    const series: IPositionSeries[] = [];
    for (const row of rows) {
      let current = series.at(-1);
      if (current?.keywordId !== row.keywordId) {
        current = { keywordId: row.keywordId, term: row.term, points: [] };
        series.push(current);
      }
      if (row.capturedAt !== null && row.position !== null)
        current.points.push({
          capturedAt: row.capturedAt.toISOString(),
          position: row.position,
        });
    }
    return { ...range, timeZone: scope.timeZone, series };
  }
}
