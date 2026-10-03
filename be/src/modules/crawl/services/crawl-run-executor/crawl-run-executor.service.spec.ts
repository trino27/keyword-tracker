import type { PinoLogger } from 'nestjs-pino';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import type { TransactionRunner } from '@persistence/connections/postgres/transaction-runner/transaction-runner';
import type {
  ICrawlRunItemRecord,
  IRunOutcome,
} from '@modules/clients/interfaces/client-record.interface';
import type { ClientCrawlRunsService } from '@modules/clients/services/client-crawl-runs/client-crawl-runs.service';
import type { CrawlResultsService } from '@modules/pages/services/crawl-results/crawl-results.service';
import { PageAnalysisService } from '@modules/page-analysis/services/page-analysis/page-analysis.service';
import { makeRuleInput } from '@modules/page-analysis/services/seo-rules/_testing/make-rule-input';
import type {
  ICrawledPage,
  ISelectedItem,
} from '../../interfaces/crawled-page.interface';
import type { PostSelectionService } from '../post-selection/post-selection.service';
import { RobotsPolicy } from '../robots-policy/robots-policy';
import type {
  SitemapDiscoveryService,
  TSitemapDiscovery,
} from '../sitemap-discovery/sitemap-discovery.service';
import {
  CrawlRunExecutorService,
  outcomeOf,
} from './crawl-run-executor.service';

const RUN = { id: 5, clientId: 9, attempts: 1 };

const crawledItem = (position: number): ISelectedItem => {
  const url = `https://a.example/p${position}/`;
  const page: ICrawledPage = {
    sitemapPosition: position,
    url,
    finalUrl: url,
    redirected: false,
    httpStatus: 200,
    headers: {},
    responseMs: 100,
    htmlBytes: 1000,
    parsed: makeRuleInput().parsed,
  };
  return {
    sitemapPosition: position,
    url,
    status: 'crawled',
    reason: null,
    httpStatus: 200,
    page,
  };
};

const setup = (options: {
  discovery?: TSitemapDiscovery;
  items?: ISelectedItem[];
  owned?: boolean;
  selectionError?: Error;
}) => {
  const finalized: { outcome: IRunOutcome; items: ICrawlRunItemRecord[] }[] =
    [];
  const applied: number[] = [];
  const runs = {
    getRunTargetForWorker: () =>
      Promise.resolve({
        clientId: 9,
        websiteUrl: 'https://a.example',
        siteKey: 'a.example',
      }),
    recordDiscoveryForWorker: jest.fn(() => Promise.resolve()),
    recordProgressForWorker: jest.fn(() => Promise.resolve()),
    lockForFinalizeForWorker: () => Promise.resolve(options.owned ?? true),
    finalizeForWorker: (
      _tx: Transaction,
      _runId: number,
      outcome: IRunOutcome,
      items: ICrawlRunItemRecord[],
    ) => {
      finalized.push({ outcome, items });
      return Promise.resolve();
    },
  } as unknown as ClientCrawlRunsService;
  const discovery = {
    discover: () =>
      Promise.resolve(
        options.discovery ?? {
          ok: true,
          robots: RobotsPolicy.allowAll(),
          sitemapUrls: ['https://a.example/post-sitemap.xml'],
          urls: ['https://a.example/p0/'],
          reason: 'Selected',
        },
      ),
  } as unknown as SitemapDiscoveryService;
  const items = options.items ?? [];
  const selection = {
    select: () =>
      options.selectionError
        ? Promise.reject(options.selectionError)
        : Promise.resolve({
            items,
            pages: items.flatMap((item) => (item.page ? [item.page] : [])),
          }),
  } as unknown as PostSelectionService;
  const results = {
    applyRunResultsForWorker: (
      _tx: Transaction,
      input: { pages: unknown[] },
    ) => {
      applied.push(input.pages.length);
      return Promise.resolve(
        new Map(items.map((item, i) => [item.url, 100 + i])),
      );
    },
  } as unknown as CrawlResultsService;
  const transactions = {
    run: (work: (tx: Transaction) => Promise<unknown>) =>
      work({} as Transaction),
  } as unknown as TransactionRunner;
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const executor = new CrawlRunExecutorService(
    runs,
    discovery,
    selection,
    new PageAnalysisService(),
    results,
    transactions,
    logger as unknown as PinoLogger,
  );
  return { executor, finalized, applied, runs };
};

describe('outcomeOf', () => {
  it.each([
    [15, 'succeeded', null],
    [14, 'partial', null],
    [1, 'partial', null],
    [0, 'failed', 'NO_POSTS_CRAWLED'],
  ])('%d posts → %s', (crawled, status, errorCode) => {
    expect(outcomeOf(crawled)).toMatchObject({ status, errorCode });
  });
});

describe('CrawlRunExecutorService', () => {
  it('stores the pages and the log, linking crawled items to their page ids', async () => {
    const items = [
      { ...crawledItem(0), status: 'skipped_listing' as const, page: null },
      crawledItem(1),
      crawledItem(2),
    ];
    const { executor, finalized, applied } = setup({ items });

    await executor.execute(RUN, new AbortController().signal);

    expect(applied).toEqual([2]);
    expect(finalized[0].outcome).toMatchObject({
      status: 'partial',
      pagesDone: 2,
    });
    expect(finalized[0].items.map((item) => item.pageId)).toEqual([
      null,
      101,
      102,
    ]);
  });

  it('a discovery failure finalizes failed with its code and no items', async () => {
    const { executor, finalized, applied } = setup({
      discovery: {
        ok: false,
        robots: RobotsPolicy.allowAll(),
        errorCode: 'BLOG_SITEMAP_NOT_FOUND',
        detail: 'none',
      },
    });

    await executor.execute(RUN, new AbortController().signal);

    expect(applied).toEqual([]);
    expect(finalized).toEqual([
      {
        outcome: expect.objectContaining({
          status: 'failed',
          errorCode: 'BLOG_SITEMAP_NOT_FOUND',
        }) as IRunOutcome,
        items: [],
      },
    ]);
  });

  it('writes nothing when a newer attempt holds the fence', async () => {
    const { executor, finalized, applied } = setup({
      items: [crawledItem(0)],
      owned: false,
    });

    await executor.execute(RUN, new AbortController().signal);

    expect(applied).toEqual([]);
    expect(finalized).toEqual([]);
  });

  it('an unexpected error finalizes CRAWL_INTERNAL_ERROR', async () => {
    const { executor, finalized } = setup({
      selectionError: new TypeError('boom'),
    });

    await executor.execute(RUN, new AbortController().signal);

    expect(finalized[0].outcome).toMatchObject({
      errorCode: 'CRAWL_INTERNAL_ERROR',
    });
  });

  it('an aborted run is left to the attempt that owns it', async () => {
    const controller = new AbortController();
    controller.abort();
    const { executor, finalized } = setup({
      selectionError: new Error('aborted'),
    });

    await executor.execute(RUN, controller.signal);

    expect(finalized).toEqual([]);
  });
});
