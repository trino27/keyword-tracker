import {
  ACTIVE_ISSUE_CODES,
  LIGHTHOUSE_ISSUE_CODES,
  type TSeoIssueCode,
} from '@app/contracts';
import { PageSpeedAvailabilityService } from '@infrastructure/config/page-speed-settings/page-speed-availability/page-speed-availability.service';
import { PageSpeedRuntimeState } from '@infrastructure/config/page-speed-settings/page-speed-runtime-state';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import type { ClientsService } from '@modules/clients/services/clients/clients.service';
import type { ListPagesQueryDto } from '../../dto/list-pages-query/list-pages-query.dto';
import type {
  IPageListFilter,
  PageListRepository,
} from '../../repositories/page-list/page-list.repository';
import type { PageDetailRepository } from '../../repositories/page-detail/page-detail.repository';
import { PageNotFoundException } from '../../exceptions/pages.exceptions';
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
    // Worst first, as the repository's ORDER BY returns them: the first row fails the
    // most checks and each later row fails fewer.
    checksApplicable: 18,
    checksFailed: Math.min(18, Math.max(0, rowCount - 1 - i)),
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
    siteWideCountsForPages: () => {
      calls.push('siteWide');
      // Two of page 1's three findings are on another page of the client too.
      return Promise.resolve([{ pageId: 1, siteWide: 2 }]);
    },
  } as unknown as PageListRepository;
  const clients = {
    assertOwnedClient: jest.fn(() => Promise.resolve()),
  };
  const service = new PageReadService(
    list,
    {} as PageDetailRepository,
    clients as unknown as ClientsService,
    new PageSpeedAvailabilityService(
      { apiKey: 'k' },
      new PageSpeedRuntimeState(),
    ),
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
    // Five statements whatever the page size — never a query per row. A future "just one
    // more lookup" turns this into six and the assertion says so.
    it('makes five repository calls for 50 rows', async () => {
      const { service, calls, query } = setup(50);

      await service.listPages(scope, query());

      expect(calls.sort()).toEqual([
        'issues',
        'keywords',
        'siteWide',
        'slice',
        'total',
      ]);
    });
  });

  it('assembles best position, issue counts and the last capture per row', async () => {
    const { service, query } = setup(2);

    const response = await service.listPages(scope, query());

    expect(response.items[0]).toMatchObject({
      id: 1,
      client: { id: 7, name: 'Site' },
      bestPosition: { position: 3, term: 'audit' },
      issues: { total: 3, error: 1, warning: 0, notice: 2, siteWide: 2 },
      lastCapturedAt: AT.toISOString(),
    });
    expect(response.items[1].issues.total).toBe(0);
    // A page nobody shares a finding with says zero, not nothing.
    expect(response.items[1].issues.siteWide).toBe(0);
    expect(response).toMatchObject({ page: 1, pageSize: 50, total: 2 });
  });

  it('the items’ scores never decrease, so the list reads worst first', async () => {
    const { service, query } = setup(5);

    const response = await service.listPages(scope, query());

    const scores = response.items.map((item) => item.score.value);
    expect(scores).toEqual([...scores].sort((a, b) => a - b));
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

/** A measured row's figures, all absent: the tests below set what they read. */
const NO_SPEED_FIGURES = {
  lastError: null,
  lcpMs: null,
  lcpSource: null,
  inpMs: null,
  inpSource: null,
  cls: null,
  clsSource: null,
  performanceScore: null,
  measuredAt: null,
  ttfbMs: null,
  ttfbSource: null,
  lcpGoodShare: null,
  lcpPoorShare: null,
  inpGoodShare: null,
  inpPoorShare: null,
  clsGoodShare: null,
  clsPoorShare: null,
  ttfbGoodShare: null,
  ttfbPoorShare: null,
  lcpBreakdown: null,
  seoScore: null,
  accessibilityScore: null,
  lighthouseApplicable: null,
  lighthouseFailed: null,
};

const detailSetup = (
  overrides: Partial<{
    checksJudged: TSeoIssueCode[] | null;
    checksNotApplicable: TSeoIssueCode[] | null;
    checksApplicable: number;
    checksFailed: number;
    issueCodes: TSeoIssueCode[];
    page: unknown;
    lighthouseJudged: TSeoIssueCode[] | null;
    lighthouseNotApplicable: TSeoIssueCode[] | null;
    pageSpeed: unknown;
  }> = {},
) => {
  const issueCodes = overrides.issueCodes ?? ['LANG_MISSING', 'TITLE_MISSING'];
  const record = {
    id: 1,
    url: 'https://a.example/post/',
    finalUrl: 'https://a.example/post/',
    title: 'Post',
    metaDescription: null,
    h1: 'Post',
    lang: null,
    wordCount: 800,
    httpStatus: 200,
    responseMs: 120,
    checksApplicable: overrides.checksApplicable ?? ACTIVE_ISSUE_CODES.length,
    checksFailed: overrides.checksFailed ?? issueCodes.length,
    checksJudged:
      overrides.checksJudged === undefined
        ? [...ACTIVE_ISSUE_CODES]
        : overrides.checksJudged,
    checksNotApplicable:
      overrides.checksNotApplicable === undefined
        ? []
        : overrides.checksNotApplicable,
    crawledAt: AT,
    clientId: 7,
    clientName: 'Site',
    clientWebsiteUrl: 'https://a.example',
    clientCurrentPages: 15,
    lighthouseJudged: overrides.lighthouseJudged ?? null,
    lighthouseNotApplicable: overrides.lighthouseNotApplicable ?? null,
    pageSpeed: overrides.pageSpeed ?? null,
  };
  const detail = {
    findCurrentPage: () =>
      Promise.resolve('page' in overrides ? overrides.page : record),
    // Deliberately unsorted, so the service's catalogue ordering is what is observed.
    issuesForPage: () =>
      Promise.resolve(
        [...issueCodes].reverse().map((code) => ({
          code,
          severity: 'notice' as const,
          details: {},
          pagesAffected: 1,
        })),
      ),
  } as unknown as PageDetailRepository;
  const list = {
    keywordsForPages: () => Promise.resolve([]),
  } as unknown as PageListRepository;
  const latestRun = { id: 3, status: 'succeeded' as const };
  const clients = {
    getClient: jest.fn(() => Promise.resolve({ latestRun })),
  };
  const runtime = new PageSpeedRuntimeState();
  const service = new PageReadService(
    list,
    detail,
    clients as unknown as ClientsService,
    new PageSpeedAvailabilityService({ apiKey: 'k' }, runtime),
  );
  return { service, clients, latestRun, runtime };
};

describe('PageReadService.getPage', () => {
  /** D27: one function answers every read path, so the screens cannot disagree. */
  it('the availability state comes from pageSpeedAvailabilityOf', async () => {
    const { service, runtime } = detailSetup();

    expect((await service.getPage(scope, 1)).pageSpeedAvailability).toEqual({
      state: 'active',
    });
    runtime.markKeyRejected();
    expect((await service.getPage(scope, 1)).pageSpeedAvailability).toEqual({
      state: 'keyRejected',
    });
  });

  it('a page never queued for PageSpeed has no summary', async () => {
    const { service } = detailSetup();

    expect((await service.getPage(scope, 1)).pageSpeed).toBeNull();
  });

  it('refuses a page the scope cannot reach, exactly like a missing one', async () => {
    const { service } = detailSetup({ page: null });

    await expect(service.getPage(scope, 1)).rejects.toBeInstanceOf(
      PageNotFoundException,
    );
  });

  it('answers for every catalogue check', async () => {
    const { service } = detailSetup();

    const {
      checksByOwner: { crawl: checks },
    } = await service.getPage(scope, 1);

    expect(checks?.map(({ code }) => code)).toEqual(ACTIVE_ISSUE_CODES);
  });

  /** The composition reads the issue codes, so a finding is never reported as a pass. */
  it('marks a finding failed and leaves the rest passed', async () => {
    const { service } = detailSetup({ issueCodes: ['NOINDEX'] });

    const {
      checksByOwner: { crawl: checks },
    } = await service.getPage(scope, 1);
    const status = (code: string) =>
      checks?.find((check) => check.code === code)?.status;

    expect(status('NOINDEX')).toBe('failed');
    expect(status('NOT_HTTPS')).toBe('passed');
  });

  it('separates a skipped check from a passed one', async () => {
    const judged = ACTIVE_ISSUE_CODES.filter((code) => code !== 'HEADING_SKIP');
    const { service } = detailSetup({
      checksJudged: judged,
      checksNotApplicable: ['HEADING_SKIP'],
      checksApplicable: judged.length,
      issueCodes: [],
      checksFailed: 0,
    });

    const {
      checksByOwner: { crawl: checks },
      score,
    } = await service.getPage(scope, 1);

    expect(checks?.find((check) => check.code === 'HEADING_SKIP')?.status).toBe(
      'notApplicable',
    );
    expect(score.applicable).toBe(ACTIVE_ISSUE_CODES.length - 1);
  });

  /** A page whose crawl predates the record cannot be enumerated, and says so. */
  /** PAGES-012, PAGES-009: Lighthouse is a second owner of checks, and of the score. */
  it("lists Lighthouse's checks from the measurement and counts them in the score", async () => {
    const judged: TSeoIssueCode[] = LIGHTHOUSE_ISSUE_CODES.slice(0, 20);
    const { service } = detailSetup({
      issueCodes: ['TITLE_MISSING', 'LH_DOCUMENT_TITLE'],
      checksApplicable: 16,
      checksFailed: 1,
      lighthouseJudged: judged,
      lighthouseNotApplicable: LIGHTHOUSE_ISSUE_CODES.slice(20, 26),
      pageSpeed: {
        ...NO_SPEED_FIGURES,
        status: 'done',
        lighthouseApplicable: 20,
        lighthouseFailed: 1,
      },
    });

    const { checksByOwner, score } = await service.getPage(scope, 1);
    const status = (code: string) =>
      checksByOwner.lighthouse?.find((check) => check.code === code)?.status;

    expect(checksByOwner.lighthouse).toHaveLength(
      LIGHTHOUSE_ISSUE_CODES.length,
    );
    expect(status('LH_DOCUMENT_TITLE')).toBe('failed');
    expect(status(LIGHTHOUSE_ISSUE_CODES[21])).toBe('notApplicable');
    expect(status(LIGHTHOUSE_ISSUE_CODES[30])).toBe('notYetChecked');
    expect(
      checksByOwner.crawl?.find((check) => check.code === 'TITLE_MISSING')
        ?.status,
    ).toBe('failed');
    expect(score).toEqual({
      value: 94,
      applicable: 36,
      failed: 2,
      byOwner: {
        crawl: { applicable: 16, failed: 1 },
        lighthouse: { applicable: 20, failed: 1 },
      },
    });
  });

  it('scores a page Lighthouse has not measured on the crawl alone, and says so', async () => {
    const { service } = detailSetup({ checksApplicable: 16, checksFailed: 2 });

    const { score, checksByOwner } = await service.getPage(scope, 1);

    expect(score.byOwner.lighthouse).toBeNull();
    expect(score.value).toBe(88);
    expect(checksByOwner.lighthouse).toBeNull();
  });

  it('answers null when the crawl predates the record', async () => {
    const { service } = detailSetup({
      checksJudged: null,
      checksNotApplicable: null,
    });

    await expect(service.getPage(scope, 1)).resolves.toMatchObject({
      checksByOwner: { crawl: null, lighthouse: null },
    });
  });

  it('returns the issues in catalogue order, not the order stored', async () => {
    const { service } = detailSetup({
      issueCodes: ['TITLE_MISSING', 'LANG_MISSING'],
    });

    const { issues } = await service.getPage(scope, 1);

    expect(issues.map(({ code }) => code)).toEqual([
      'TITLE_MISSING',
      'LANG_MISSING',
    ]);
  });

  it('takes the last crawl from the client, not from the page', async () => {
    const { service, clients, latestRun } = detailSetup();

    const { lastCrawl } = await service.getPage(scope, 1);

    expect(clients.getClient).toHaveBeenCalled();
    expect(lastCrawl).toBe(latestRun);
  });
});
