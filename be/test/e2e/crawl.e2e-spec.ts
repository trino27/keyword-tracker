import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ACTIVE_ISSUE_CODES,
  CONDITIONAL_ISSUE_CODES,
  SITE_CHECK_CODES,
} from '@app/contracts';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { count, eq } from 'drizzle-orm';
import { MAX_KEYWORDS } from '../../src/modules/page-analysis/constants/keyword-scoring.constant';
import request from 'supertest';
import {
  FIXTURES_ROOT,
  FixtureHttpTransport,
} from '../../src/infrastructure/remote-api/_testing/fixture-http-transport';
import { CrawlWorker } from '../../src/modules/crawl/workers/crawl-worker/crawl-worker';
import { pageKeywords } from '../../src/persistence/schema/tables/page-keywords/page-keywords.schema';
import { pages } from '../../src/persistence/schema/tables/pages/pages.schema';
import { seoIssues } from '../../src/persistence/schema/tables/seo-issues/seo-issues.schema';
import { createTestApp } from '../support/create-test-app';
import { seedTestUser, signIn } from '../support/sign-in';
import { createTestDatabase } from '../support/test-database';

const testDb = createTestDatabase();

describe('crawl (e2e, recorded sites)', () => {
  let app: NestExpressApplication;
  let transport: FixtureHttpTransport;
  let cookie: string;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    transport = new FixtureHttpTransport();
    app = await createTestApp({ transport });
  });

  beforeEach(async () => {
    await testDb.reset();
    await seedTestUser(testDb, 'manager@example.com');
    cookie = await signIn(app, 'manager@example.com');
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  const addClient = async (websiteUrl: string) => {
    const response = await http()
      .post('/api/clients')
      .set('Cookie', cookie)
      .send({ name: 'Client', websiteUrl })
      .expect(201);
    return response.body.client as { id: number; latestRun: { id: number } };
  };
  const runDetail = async (runId: number) =>
    (
      await http()
        .get(`/api/crawl-runs/${runId}`)
        .set('Cookie', cookie)
        .expect(200)
    ).body.run;

  it('crawls yoast: 15 posts, 16 log lines, /seo-blog/ skipped as a listing', async () => {
    const client = await addClient('yoast.com');

    await expect(app.get(CrawlWorker).runOnce()).resolves.toBe(true);

    const run = await runDetail(client.latestRun.id);
    expect(run).toMatchObject({
      status: 'succeeded',
      pagesDone: 15,
      sitemapUrl: 'https://yoast.com/post-sitemap.xml',
      errorCode: null,
    });
    expect(run.items).toHaveLength(16);
    expect(run.items[0]).toMatchObject({
      sitemapPosition: 0,
      url: 'https://yoast.com/seo-blog/',
      status: 'skipped_listing',
    });
    // Every site check, in catalogue order, judged against yoast's recorded answers:
    // each host variant is one 301 to https://yoast.com/ and a made-up page is a 404.
    expect(
      (run.siteChecks as { code: string; status: string }[]).map(
        ({ code, status }) => [code, status],
      ),
    ).toEqual(
      SITE_CHECK_CODES.map((code) => [
        code,
        expect.stringMatching(/^(passed|failed|notApplicable)$/),
      ]),
    );
    const siteStatus = Object.fromEntries(
      (run.siteChecks as { code: string; status: string }[]).map(
        ({ code, status }) => [code, status],
      ),
    );
    expect(siteStatus).toMatchObject({
      HOST_VARIANT_SERVES_CONTENT: 'passed',
      HOST_REDIRECT_CHAIN: 'passed',
      SOFT_404: 'passed',
      SITEMAP_LISTS_OTHER_HOST_VARIANTS: 'passed',
    });
    const stored = await testDb.db
      .select()
      .from(pages)
      .where(eq(pages.clientId, client.id));
    expect(stored).toHaveLength(15);
    expect(stored.every((page) => page.lastSeenRunId === run.id)).toBe(true);

    const pairCounts = await testDb.db
      .select({ pageId: pageKeywords.pageId, pairs: count() })
      .from(pageKeywords)
      .groupBy(pageKeywords.pageId);
    expect(pairCounts).toHaveLength(15);
    for (const { pairs } of pairCounts) {
      // At least one, no more than the cap. The lower bound is 1 and not 5 because
      // selection takes the candidates above the floor and stops: "a page with one
      // subject returns one keyword" (select-keywords.ts). Topping a short list up to a
      // minimum is what PAGE_ANALYSIS_MODULE.md records as rejected — it produced five
      // keywords for a page with one, four below the floor the scoring had just applied.
      // A test demanding five demands that back.
      expect(pairs).toBeGreaterThanOrEqual(1);
      expect(pairs).toBeLessThanOrEqual(MAX_KEYWORDS);
    }
    expect(await testDb.db.$count(seoIssues)).toBeGreaterThan(0);

    // The write path, end to end: every page carries a denominator a score can divide by,
    // and a failed count that agrees with the issue rows written in the same transaction.
    const issueCounts = await testDb.db
      .select({ pageId: seoIssues.pageId, found: count() })
      .from(seoIssues)
      .groupBy(seoIssues.pageId);
    const failedByPage = new Map(
      issueCounts.map(({ pageId, found }) => [pageId, found]),
    );
    for (const page of stored) {
      expect(page.checksApplicable).toBeGreaterThanOrEqual(
        ACTIVE_ISSUE_CODES.length - CONDITIONAL_ISSUE_CODES.length,
      );
      expect(page.checksApplicable).toBeLessThanOrEqual(
        ACTIVE_ISSUE_CODES.length,
      );
      expect(page.checksFailed).toBe(failedByPage.get(page.id) ?? 0);
    }
  });

  it('flags STRUCTURED_DATA_MISSING on a post that declares no article markup', async () => {
    const post = 'https://root-blog-no-feed.example/post-number-2/';
    const paragraph =
      'Widget pricing depends on volume. Widget pricing tiers explained. '.repeat(
        40,
      );
    transport.override(post, {
      status: 200,
      headers: { 'content-type': 'text/html' },
      body: `<html lang="en"><head><title>Widget pricing explained, tier by tier</title><script type="application/ld+json">{"@type":"Organization","name":"Acme"}</script></head><body><main><h1>Widget pricing</h1><p>${paragraph}</p></main></body></html>`,
    });
    const client = await addClient('root-blog-no-feed.example');

    await app.get(CrawlWorker).runOnce();

    const [page] = await testDb.db
      .select({ id: pages.id })
      .from(pages)
      .where(eq(pages.url, post));
    const issues = await testDb.db
      .select({ code: seoIssues.code, details: seoIssues.details })
      .from(seoIssues)
      .where(eq(seoIssues.pageId, page.id));
    // Stored with the proof the finding quoted, so the screen can show it later.
    expect(issues).toContainEqual({
      code: 'STRUCTURED_DATA_MISSING',
      details: {
        types: ['Organization'],
        evidence: ['JSON-LD types on the page: Organization'],
      },
    });
    await expect(runDetail(client.latestRun.id)).resolves.toMatchObject({
      status: 'succeeded',
    });
  });

  it('a re-crawl keeps a post the sitemap no longer lists, at its old run', async () => {
    const client = await addClient('yoast.com');
    await app.get(CrawlWorker).runOnce();
    const dropped = 'https://yoast.com/how-to-remove-www-from-your-url/';
    const sitemap = readFileSync(
      join(FIXTURES_ROOT, 'sites', 'yoast/post-sitemap.xml'),
      'utf8',
    );
    transport.override('https://yoast.com/post-sitemap.xml', {
      status: 200,
      headers: { 'content-type': 'application/xml' },
      body: sitemap.replace(
        `<loc>${dropped}</loc>`,
        '<loc>https://yoast.com/</loc>',
      ),
    });

    try {
      const recrawl = await http()
        .post(`/api/clients/${client.id}/crawl-runs`)
        .set('Content-Type', 'application/json')
        .set('Cookie', cookie)
        .expect(201);
      await app.get(CrawlWorker).runOnce();

      const [kept] = await testDb.db
        .select()
        .from(pages)
        .where(eq(pages.url, dropped));
      expect(kept.lastSeenRunId).toBe(client.latestRun.id);
      const second = await runDetail(recrawl.body.run.id as number);
      expect(second.status).toBe('succeeded');
    } finally {
      transport.override('https://yoast.com/post-sitemap.xml', {
        status: 200,
        headers: { 'content-type': 'application/xml' },
        body: sitemap,
      });
    }
  });

  it('a site with no sitemap finalizes failed SITEMAP_NOT_FOUND', async () => {
    const client = await addClient('no-sitemap.example');

    await app.get(CrawlWorker).runOnce();

    await expect(runDetail(client.latestRun.id)).resolves.toMatchObject({
      status: 'failed',
      errorCode: 'SITEMAP_NOT_FOUND',
      items: [],
    });
  });
});
