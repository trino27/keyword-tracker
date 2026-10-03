import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import type {
  IUpsertPage,
  PagesRepository,
} from '../../repositories/pages/pages.repository';
import { CrawlResultsService, type IRunPage } from './crawl-results.service';

const page = (overrides: Partial<IRunPage> = {}): IRunPage => ({
  url: 'https://a.example/post/',
  finalUrl: 'https://a.example/post/',
  title: 'Title',
  metaDescription: null,
  h1: 'Heading',
  lang: 'en',
  wordCount: 500,
  httpStatus: 200,
  responseMs: 120,
  htmlBytes: 40_000,
  sitemapPosition: 3,
  ...overrides,
});

describe('CrawlResultsService', () => {
  const setup = () => {
    const upserted: IUpsertPage[][] = [];
    const repository = {
      upsertManyForWorker: (_tx: Transaction, rows: IUpsertPage[]) => {
        upserted.push(rows);
        return Promise.resolve(
          rows.map((row, i) => ({ id: 10 + i, url: row.url })),
        );
      },
    } as unknown as PagesRepository;
    return { service: new CrawlResultsService(repository), upserted };
  };
  const tx = {} as Transaction;
  const crawledAt = new Date('2026-10-03T12:00:00Z');

  it('stores each page with the run as its last sighting and returns ids by URL', async () => {
    const { service, upserted } = setup();

    const ids = await service.applyRunResultsForWorker(tx, {
      clientId: 7,
      runId: 42,
      crawledAt,
      pages: [page(), page({ url: 'https://a.example/two/' })],
    });

    expect(upserted[0][0]).toMatchObject({
      clientId: 7,
      lastSeenRunId: 42,
      crawledAt,
      sitemapPosition: 3,
    });
    expect([...ids]).toEqual([
      ['https://a.example/post/', 10],
      ['https://a.example/two/', 11],
    ]);
  });

  it('clips hostile field lengths to the column widths', async () => {
    const { service, upserted } = setup();

    await service.applyRunResultsForWorker(tx, {
      clientId: 7,
      runId: 42,
      crawledAt,
      pages: [page({ title: 'x'.repeat(5_000), lang: 'y'.repeat(100) })],
    });

    expect(upserted[0][0].title).toHaveLength(1000);
    expect(upserted[0][0].lang).toHaveLength(35);
  });
});
