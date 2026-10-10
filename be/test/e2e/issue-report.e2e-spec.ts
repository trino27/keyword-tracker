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
import { PsiClient } from '../../src/modules/page-speed/services/psi-client/psi-client';
import { PageSpeedWorker } from '../../src/modules/page-speed/workers/page-speed-worker/page-speed-worker';
import { pages } from '../../src/persistence/schema/tables/pages/pages.schema';
import { siteChecks } from '../../src/persistence/schema/tables/site-checks/site-checks.schema';
import { createTestApp } from '../support/create-test-app';
import { seedTestUser, signIn } from '../support/sign-in';
import { createTestDatabase } from '../support/test-database';

jest.setTimeout(120_000);

const testDb = createTestDatabase();

interface IReport {
  client: { id: number; name: string };
  generatedFrom: { runId: number; finishedAt: string } | null;
  pageSpeedAvailability: { state: string };
  currentPages: number;
  issues: {
    code: string;
    severity: string;
    details: Record<string, unknown>;
    location:
      | { kind: 'page'; page: { id: number; url: string } }
      | { kind: 'allPages'; pageCount: number }
      | { kind: 'site' };
  }[];
}

describe('issue report (e2e)', () => {
  let app: NestExpressApplication;
  let transport: FixtureHttpTransport;
  let cookie: string;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    transport = new FixtureHttpTransport();
    app = await createTestApp({ transport, pageSpeedApiKey: 'e2e-key' });
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

  const addClient = async (websiteUrl: string) =>
    (
      await http()
        .post('/api/clients')
        .set('Cookie', cookie)
        .send({ name: 'Yoast', websiteUrl })
        .expect(201)
    ).body.client as { id: number };

  const reportOf = async (clientId: number) =>
    (
      await http()
        .get(`/api/clients/${clientId}/issues`)
        .set('Cookie', cookie)
        .expect(200)
    ).body as IReport;

  /** Crawls yoast and measures every page with Google's whole-site figures. */
  async function crawledAndMeasured(): Promise<number> {
    const { id } = await addClient('yoast.com');
    await app.get(CrawlWorker).runOnce();
    const rows = await testDb.db
      .select({ finalUrl: pages.finalUrl })
      .from(pages);
    const body = readFileSync(
      join(FIXTURES_ROOT, 'pagespeed', 'origin-only.synthesized.json'),
      'utf8',
    );
    for (const { finalUrl } of rows)
      transport.override(PsiClient.requestUrl(finalUrl), {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body,
      });
    while (await app.get(PageSpeedWorker).runOnce());
    return id;
  }

  it('returns one snapshot of page, speed and site findings', async () => {
    const clientId = await crawledAndMeasured();
    const failedSiteChecks = await testDb.db
      .select()
      .from(siteChecks)
      .where(eq(siteChecks.status, 'failed'));

    const report = await reportOf(clientId);

    expect(report.client).toEqual({ id: clientId, name: 'Yoast' });
    expect(report.generatedFrom).toMatchObject({ runId: expect.any(Number) });
    expect(report.currentPages).toBe(15);
    const kinds = new Set(report.issues.map(({ location }) => location.kind));
    expect(kinds.has('page')).toBe(true);
    expect(
      report.issues.filter(({ location }) => location.kind === 'site'),
    ).toHaveLength(failedSiteChecks.length);
  });

  it('an origin speed finding on 15 pages is one Whole site row', async () => {
    const clientId = await crawledAndMeasured();

    const report = await reportOf(clientId);
    const speedRows = report.issues
      .filter(({ code }) => code.startsWith('CWV_'))
      .sort((a, b) => a.code.localeCompare(b.code));

    // The fixture's site figures: LCP 2.9 s and INP 210 ms need improvement, CLS is good.
    expect(speedRows).toEqual([
      expect.objectContaining({
        code: 'CWV_INP_NEEDS_IMPROVEMENT',
        details: { value: 210, max: 200, source: 'origin' },
        location: { kind: 'allPages', pageCount: 15 },
      }),
      expect.objectContaining({
        code: 'CWV_LCP_NEEDS_IMPROVEMENT',
        details: { value: 2900, max: 2500, source: 'origin' },
        location: { kind: 'allPages', pageCount: 15 },
      }),
    ]);
  });

  it('a client with no finished crawl has generatedFrom null and no issues', async () => {
    const { id } = await addClient('yoast.com');

    expect(await reportOf(id)).toMatchObject({
      generatedFrom: null,
      currentPages: 0,
      issues: [],
    });
  });

  it('the report carries the PageSpeed state', async () => {
    const { id } = await addClient('yoast.com');

    expect((await reportOf(id)).pageSpeedAvailability).toEqual({
      state: 'active',
    });
  });

  it('a missing client is a 404', async () => {
    const response = await http()
      .get('/api/clients/2000000000/issues')
      .set('Cookie', cookie);

    expect(response.status).toBe(404);
  });
});
