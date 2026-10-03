import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import type { KeywordsRepository } from '../../repositories/keywords/keywords.repository';
import type {
  IUpsertPageKeyword,
  PageKeywordsRepository,
} from '../../repositories/page-keywords/page-keywords.repository';
import type {
  IUpsertPage,
  PagesRepository,
} from '../../repositories/pages/pages.repository';
import type {
  TNewSeoIssue,
  SeoIssuesRepository,
} from '../../repositories/seo-issues/seo-issues.repository';
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
  keywords: [
    { term: 'link building', relevance: 1 },
    { term: 'outreach', relevance: 0.4 },
  ],
  issues: [{ code: 'LANG_MISSING', severity: 'notice', details: {} }],
  ...overrides,
});

describe('CrawlResultsService', () => {
  const setup = () => {
    const calls = {
      pages: [] as IUpsertPage[][],
      pairs: [] as IUpsertPageKeyword[][],
      issues: [] as { pageIds: number[]; rows: TNewSeoIssue[] }[],
    };
    const pages = {
      upsertManyForWorker: (_tx: Transaction, rows: IUpsertPage[]) => {
        calls.pages.push(rows);
        return Promise.resolve(
          rows.map((row, i) => ({ id: 10 + i, url: row.url })),
        );
      },
    } as unknown as PagesRepository;
    const keywords = {
      upsertTermsForWorker: (_tx: Transaction, terms: string[]) =>
        Promise.resolve(
          new Map([...new Set(terms)].map((term, i) => [term, 100 + i])),
        ),
    } as unknown as KeywordsRepository;
    const pageKeywords = {
      upsertManyForWorker: (_tx: Transaction, rows: IUpsertPageKeyword[]) => {
        calls.pairs.push(rows);
        return Promise.resolve();
      },
    } as unknown as PageKeywordsRepository;
    const seoIssues = {
      replaceForPagesForWorker: (
        _tx: Transaction,
        pageIds: number[],
        rows: TNewSeoIssue[],
      ) => {
        calls.issues.push({ pageIds, rows });
        return Promise.resolve();
      },
    } as unknown as SeoIssuesRepository;
    return {
      service: new CrawlResultsService(
        pages,
        keywords,
        pageKeywords,
        seoIssues,
      ),
      calls,
    };
  };
  const tx = {} as Transaction;
  const crawledAt = new Date('2026-10-03T12:00:00Z');

  it('stores each page with the run as its last sighting and returns ids by URL', async () => {
    const { service, calls } = setup();

    const ids = await service.applyRunResultsForWorker(tx, {
      clientId: 7,
      runId: 42,
      crawledAt,
      pages: [page(), page({ url: 'https://a.example/two/' })],
    });

    expect(calls.pages[0][0]).toMatchObject({
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

  it('upserts every pair with the new relevance and run — and deletes none', async () => {
    const { service, calls } = setup();

    await service.applyRunResultsForWorker(tx, {
      clientId: 7,
      runId: 42,
      crawledAt,
      pages: [page()],
    });

    expect(calls.pairs[0]).toEqual([
      { pageId: 10, keywordId: 100, relevance: 1, lastSeenRunId: 42 },
      { pageId: 10, keywordId: 101, relevance: 0.4, lastSeenRunId: 42 },
    ]);
  });

  it('replaces the issues of every re-fetched page, even a page with none now', async () => {
    const { service, calls } = setup();

    await service.applyRunResultsForWorker(tx, {
      clientId: 7,
      runId: 42,
      crawledAt,
      pages: [page(), page({ url: 'https://a.example/clean/', issues: [] })],
    });

    expect(calls.issues).toEqual([
      {
        pageIds: [10, 11],
        rows: [
          { pageId: 10, code: 'LANG_MISSING', severity: 'notice', details: {} },
        ],
      },
    ]);
  });

  it('clips hostile field lengths to the column widths', async () => {
    const { service, calls } = setup();

    await service.applyRunResultsForWorker(tx, {
      clientId: 7,
      runId: 42,
      crawledAt,
      pages: [page({ title: 'x'.repeat(5_000), lang: 'y'.repeat(100) })],
    });

    expect(calls.pages[0][0].title).toHaveLength(1000);
    expect(calls.pages[0][0].lang).toHaveLength(35);
  });
});
