import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import { PageNotFoundException } from '../../exceptions/pages.exceptions';
import type {
  ICurrentPageRecord,
  IHistoryRow,
  PageDetailRepository,
} from '../../repositories/page-detail/page-detail.repository';
import { PositionHistoryService } from './position-history.service';

const scope = { userId: 1, timeZone: 'America/Toronto' } as IUserScope;
const NOW = new Date('2026-11-02T03:30:00Z');

const setup = (
  page: Partial<ICurrentPageRecord> | null,
  rows: IHistoryRow[],
) => {
  const bounds: string[][] = [];
  const repository = {
    findCurrentPage: () => Promise.resolve(page),
    historyForPage: (
      _scope: IUserScope,
      _pageId: number,
      fromUtc: string,
      toUtcExclusive: string,
    ) => {
      bounds.push([fromUtc, toUtcExclusive]);
      return Promise.resolve(rows);
    },
  } as unknown as PageDetailRepository;
  return { service: new PositionHistoryService(repository), bounds };
};

describe('PositionHistoryService', () => {
  it('reads the user’s days as UTC bounds in their zone (a 25-hour day here)', async () => {
    const { service, bounds } = setup({ id: 42 }, []);

    const history = await service.getHistory(
      scope,
      42,
      { from: '2026-11-01', to: '2026-11-01' },
      NOW,
    );

    expect(bounds).toEqual([
      ['2026-11-01T04:00:00.000Z', '2026-11-02T05:00:00.000Z'],
    ]);
    expect(history).toMatchObject({
      from: '2026-11-01',
      to: '2026-11-01',
      timeZone: 'America/Toronto',
    });
  });

  it('groups points per keyword and keeps a keyword without points', async () => {
    const at = (day: string) => new Date(`${day}T12:00:00Z`);
    const { service } = setup({ id: 42 }, [
      { keywordId: 1, term: 'seo', capturedAt: at('2026-10-30'), position: 5 },
      { keywordId: 1, term: 'seo', capturedAt: at('2026-10-31'), position: 4 },
      { keywordId: 2, term: 'new', capturedAt: null, position: null },
    ]);

    const history = await service.getHistory(scope, 42, {}, NOW);

    expect(history.series).toEqual([
      {
        keywordId: 1,
        term: 'seo',
        points: [
          { capturedAt: '2026-10-30T12:00:00.000Z', position: 5 },
          { capturedAt: '2026-10-31T12:00:00.000Z', position: 4 },
        ],
      },
      { keywordId: 2, term: 'new', points: [] },
    ]);
  });

  it('a page that is not current (or not the user’s) is a 404', async () => {
    const { service } = setup(null, []);

    await expect(service.getHistory(scope, 42, {}, NOW)).rejects.toBeInstanceOf(
      PageNotFoundException,
    );
  });
});
