import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import {
  FIXTURES_ROOT,
  FixtureHttpTransport,
} from '../../src/infrastructure/remote-api/_testing/fixture-http-transport';
import { CrawlWorker } from '../../src/modules/crawl/workers/crawl-worker/crawl-worker';
import { pages } from '../../src/persistence/schema/tables/pages/pages.schema';
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
    const stored = await testDb.db
      .select()
      .from(pages)
      .where(eq(pages.clientId, client.id));
    expect(stored).toHaveLength(15);
    expect(stored.every((page) => page.lastSeenRunId === run.id)).toBe(true);
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
