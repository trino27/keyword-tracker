import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import type { ClientsService } from '@modules/clients/services/clients/clients.service';
import type { ListPagesQueryDto } from '../../dto/list-pages-query/list-pages-query.dto';
import type {
  IPageListFilter,
  PageListRepository,
} from '../../repositories/page-list/page-list.repository';
import { PageReadService } from './page-read.service';

const scope = { userId: 1, timeZone: 'America/Toronto' } as IUserScope;
const AT = new Date('2026-10-03T12:00:00Z');

const setup = (rowCount: number) => {
  const calls: string[] = [];
  const filters: IPageListFilter[] = [];
  const rows = Array.from({ length: rowCount }, (_, i) => ({
    id: i + 1,
    url: `https://a.example/p${i}/`,
    title: `Post ${i}`,
    clientId: 7,
    clientName: 'Site',
  }));
  const list = {
    listSlice: (_scope: IUserScope, filter: IPageListFilter) => {
      calls.push('slice');
      filters.push(filter);
      return Promise.resolve(rows);
    },
    countMatching: () => {
      calls.push('total');
      return Promise.resolve(rowCount);
    },
    keywordsForPages: (_scope: IUserScope, ids: number[]) => {
      calls.push('keywords');
      return Promise.resolve(
        ids.flatMap((pageId) => [
          {
            pageId,
            keywordId: 1,
            term: 'seo',
            relevance: 1,
            latestPosition: 9,
            latestCapturedAt: AT,
          },
          {
            pageId,
            keywordId: 2,
            term: 'audit',
            relevance: 0.4,
            latestPosition: 3,
            latestCapturedAt: AT,
          },
        ]),
      );
    },
    issueCountsForPages: () => {
      calls.push('issues');
      return Promise.resolve([
        { pageId: 1, severity: 'error' as const, count: 1 },
        { pageId: 1, severity: 'notice' as const, count: 2 },
      ]);
    },
  } as unknown as PageListRepository;
  const clients = {
    assertOwnedClient: jest.fn(() => Promise.resolve()),
  };
  const service = new PageReadService(
    list,
    clients as unknown as ClientsService,
  );
  const query = (overrides: Partial<ListPagesQueryDto> = {}) => ({
    page: 1,
    pageSize: 50,
    ...overrides,
  });
  return { service, calls, filters, clients, query };
};

describe('PageReadService.listPages', () => {
  describe('cost', () => {
    it('makes four repository calls for 50 rows', async () => {
      const { service, calls, query } = setup(50);

      await service.listPages(scope, query());

      expect(calls.sort()).toEqual(['issues', 'keywords', 'slice', 'total']);
    });
  });

  it('assembles best position, issue counts and the last capture per row', async () => {
    const { service, query } = setup(2);

    const response = await service.listPages(scope, query());

    expect(response.items[0]).toMatchObject({
      id: 1,
      client: { id: 7, name: 'Site' },
      bestPosition: { position: 3, term: 'audit' },
      issues: { total: 3, error: 1, warning: 0, notice: 2 },
      lastCapturedAt: AT.toISOString(),
    });
    expect(response.items[1].issues.total).toBe(0);
    expect(response).toMatchObject({ page: 1, pageSize: 50, total: 2 });
  });

  it('checks a clientId belongs to the user before listing', async () => {
    const { service, clients, query } = setup(0);

    await service.listPages(scope, query({ clientId: 7 }));

    expect(clients.assertOwnedClient).toHaveBeenCalledWith(scope, 7);
  });

  it('escapes the search, and matches keywords in their stored form', async () => {
    const { service, filters, query } = setup(0);

    await service.listPages(scope, query({ q: 'Link-Building 100%' }));

    expect(filters[0].search).toEqual({
      urlPattern: '%Link-Building 100\\%%',
      termPattern: '%link building 100%',
    });
  });
});
