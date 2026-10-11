import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { PageSpeedRuntimeState } from '../../src/infrastructure/config/page-speed-settings/page-speed-runtime-state';
import {
  FIXTURES_ROOT,
  FixtureHttpTransport,
} from '../../src/infrastructure/remote-api/_testing/fixture-http-transport';
import { CrawlWorker } from '../../src/modules/crawl/workers/crawl-worker/crawl-worker';
import { PsiClient } from '../../src/modules/page-speed/services/psi-client/psi-client';
import { PageSpeedWorker } from '../../src/modules/page-speed/workers/page-speed-worker/page-speed-worker';
import { pageSpeed } from '../../src/persistence/schema/tables/page-speed/page-speed.schema';
import { pages } from '../../src/persistence/schema/tables/pages/pages.schema';
import { createTestApp } from '../support/create-test-app';
import { seedTestUser, signIn } from '../support/sign-in';
import { createTestDatabase } from '../support/test-database';

jest.setTimeout(120_000);

const testDb = createTestDatabase();
const KEY = 'e2e-pagespeed-key';
const isGoogle = (url: string) => url.startsWith('https://www.googleapis.com/');

const psiAnswer = (status: number, fixture: string) => ({
  status,
  headers: { 'content-type': 'application/json' },
  body: readFileSync(join(FIXTURES_ROOT, 'pagespeed', fixture), 'utf8'),
});

interface ITestStack {
  app: NestExpressApplication;
  transport: FixtureHttpTransport;
  cookie: string;
}

async function stack(pageSpeedApiKey?: string): Promise<ITestStack> {
  const transport = new FixtureHttpTransport();
  const app = await createTestApp({
    transport,
    ...(pageSpeedApiKey ? { pageSpeedApiKey } : {}),
  });
  await seedTestUser(testDb, 'manager@example.com');
  const cookie = await signIn(app, 'manager@example.com');
  return { app, transport, cookie };
}

/** Adds yoast.com and runs its crawl to the end: 15 current pages. */
async function crawlYoast({ app, cookie }: ITestStack): Promise<number[]> {
  await request(app.getHttpServer())
    .post('/api/clients')
    .set('Cookie', cookie)
    .send({ name: 'Yoast', websiteUrl: 'yoast.com' })
    .expect(201);
  await expect(app.get(CrawlWorker).runOnce()).resolves.toBe(true);
  const rows = await testDb.db.select({ id: pages.id }).from(pages);
  return rows.map(({ id }) => id);
}

/** Every page's PageSpeed request answers with the same recorded fixture. */
async function answerEveryPage(
  transport: FixtureHttpTransport,
  status: number,
  fixture: string,
) {
  const rows = await testDb.db.select({ finalUrl: pages.finalUrl }).from(pages);
  for (const { finalUrl } of rows)
    transport.override(
      PsiClient.requestUrl(finalUrl),
      psiAnswer(status, fixture),
    );
}

async function drain(app: NestExpressApplication): Promise<number> {
  let measured = 0;
  while (await app.get(PageSpeedWorker).runOnce()) measured += 1;
  return measured;
}

interface IListItem {
  id: number;
  score: { value: number };
  issues: { total: number; notice: number };
  pageSpeed: {
    status: string;
    measurement: Record<
      'lcp' | 'inp' | 'cls',
      { value: number; band: string; source: string } | null
    > | null;
  } | null;
}

const listBodyOf = async ({ app, cookie }: ITestStack) =>
  (
    await request(app.getHttpServer())
      .get('/api/pages?pageSize=50')
      .set('Cookie', cookie)
      .expect(200)
  ).body as { items: IListItem[]; pageSpeedAvailability: { state: string } };

const listOf = async (s: ITestStack) => (await listBodyOf(s)).items;

const CODE_OF: Record<string, Record<string, string>> = {
  lcp: { needsImprovement: 'CWV_LCP_NEEDS_IMPROVEMENT', poor: 'CWV_LCP_POOR' },
  inp: { needsImprovement: 'CWV_INP_NEEDS_IMPROVEMENT', poor: 'CWV_INP_POOR' },
  cls: { needsImprovement: 'CWV_CLS_NEEDS_IMPROVEMENT', poor: 'CWV_CLS_POOR' },
};

describe('PageSpeed (e2e, recorded sites and answers)', () => {
  beforeEach(() => testDb.reset());
  afterAll(() => testDb.close());

  describe('with a key', () => {
    let s: ITestStack;
    beforeEach(async () => {
      s = await stack(KEY);
    });
    afterEach(() => s.app.close());

    it('a crawl queues its pages', async () => {
      const pageIds = await crawlYoast(s);

      const rows = await testDb.db.select().from(pageSpeed);
      expect(rows.map((row) => row.pageId).sort()).toEqual([...pageIds].sort());
      expect(rows.every((row) => row.status === 'queued')).toBe(true);
    });

    it('a measured page has its speed findings in the detail', async () => {
      const [pageId] = await crawlYoast(s);
      await answerEveryPage(s.transport, 200, 'url-field.json');

      expect(await drain(s.app)).toBe(15);

      const detail = (
        await request(s.app.getHttpServer())
          .get(`/api/pages/${pageId}`)
          .set('Cookie', s.cookie)
          .expect(200)
      ).body;
      expect(detail.issues).toContainEqual(
        expect.objectContaining({
          code: 'CWV_LCP_NEEDS_IMPROVEMENT',
          severity: 'notice',
          details: { value: 3025, max: 2500, source: 'url' },
        }),
      );
      expect(detail.issues).toContainEqual(
        expect.objectContaining({
          code: 'CWV_INP_NEEDS_IMPROVEMENT',
          severity: 'notice',
          details: { value: 212, max: 200, source: 'url' },
        }),
      );
      // A speed code is never a check.
      expect(
        (detail.checks as { code: string }[]).some(({ code }) =>
          code.startsWith('CWV_'),
        ),
      ).toBe(false);
      const [row] = await testDb.db
        .select()
        .from(pageSpeed)
        .where(eq(pageSpeed.pageId, pageId));
      expect(row).toMatchObject({
        status: 'done',
        lcpMs: 3025,
        lcpSource: 'url',
      });
    });

    it('a speed finding counts among the issues and leaves the score and the order unchanged', async () => {
      await crawlYoast(s);
      const before = await listOf(s);
      await answerEveryPage(s.transport, 200, 'url-field.json');

      await drain(s.app);
      const after = await listOf(s);

      expect(after.map(({ id }) => id)).toEqual(before.map(({ id }) => id));
      expect(after.map(({ score }) => score)).toEqual(
        before.map(({ score }) => score),
      );
      // The recorded answer: LCP 3025 ms and INP 212 ms need improvement, CLS is good.
      after.forEach((item, i) => {
        expect(item.issues.total).toBe(before[i].issues.total + 2);
        expect(item.issues.notice).toBe(before[i].issues.notice + 2);
      });
    });

    /** Plan I16: a coloured badge and its finding can never disagree. */
    it('every non-good badge in the list has its finding in the detail, and no good one does', async () => {
      await crawlYoast(s);
      const rows = await testDb.db
        .select({ finalUrl: pages.finalUrl })
        .from(pages);
      // Three different answers, so good, needs-improvement and poor all occur.
      const fixtures = ['url-field.json', 'origin-only.json', 'lab-only.json'];
      rows.forEach(({ finalUrl }, i) =>
        s.transport.override(
          PsiClient.requestUrl(finalUrl),
          psiAnswer(200, fixtures[i % fixtures.length]),
        ),
      );
      await drain(s.app);

      for (const item of await listOf(s)) {
        const detail = (
          await request(s.app.getHttpServer())
            .get(`/api/pages/${item.id}`)
            .set('Cookie', s.cookie)
            .expect(200)
        ).body as { issues: { code: string }[] };
        const speedCodes = detail.issues
          .map(({ code }) => code)
          .filter((code) => code.startsWith('CWV_'))
          .sort();
        const expected = (['lcp', 'inp', 'cls'] as const)
          .flatMap((metric) => {
            const reading = item.pageSpeed?.measurement?.[metric];
            return reading && reading.band !== 'good'
              ? [CODE_OF[metric][reading.band]]
              : [];
          })
          .sort();
        expect(speedCodes).toEqual(expected);
      }
    });

    it('the list and the detail carry the PageSpeed state', async () => {
      const [pageId] = await crawlYoast(s);

      const list = await listBodyOf(s);
      const detail = (
        await request(s.app.getHttpServer())
          .get(`/api/pages/${pageId}`)
          .set('Cookie', s.cookie)
          .expect(200)
      ).body;

      expect(list.pageSpeedAvailability).toEqual({ state: 'active' });
      expect(list.items[0].pageSpeed).toEqual({
        status: 'queued',
        measurement: null,
        lastError: null,
      });
      expect(detail.pageSpeedAvailability).toEqual({ state: 'active' });
      expect(detail.pageSpeed).toMatchObject({ status: 'queued' });
    });

    it('opening the list, the detail and the report requests nothing from PageSpeed and writes nothing', async () => {
      const [pageId] = await crawlYoast(s);
      const asked = s.transport.requests.filter(isGoogle).length;

      const [{ id: clientId }] = (
        await request(s.app.getHttpServer())
          .get('/api/clients')
          .set('Cookie', s.cookie)
          .expect(200)
      ).body.items as { id: number }[];
      const rowsBefore = await testDb.db.select().from(pageSpeed);

      await listOf(s);
      await request(s.app.getHttpServer())
        .get(`/api/pages/${pageId}`)
        .set('Cookie', s.cookie)
        .expect(200);
      await request(s.app.getHttpServer())
        .get(`/api/clients/${clientId}/issues`)
        .set('Cookie', s.cookie)
        .expect(200);

      // No request to Google, and the queue is exactly as it was: reading writes nothing.
      expect(s.transport.requests.filter(isGoogle)).toHaveLength(asked);
      expect(await testDb.db.select().from(pageSpeed)).toEqual(rowsBefore);
    });

    it('after Google rejects the key every row is still queued and the state is keyRejected', async () => {
      await crawlYoast(s);
      await answerEveryPage(s.transport, 400, 'key-invalid.json');

      expect(await drain(s.app)).toBe(1);
      expect(await s.app.get(PageSpeedWorker).runOnce()).toBe(false);

      const rows = await testDb.db.select().from(pageSpeed);
      expect(rows.every((row) => row.status === 'queued')).toBe(true);
      expect(rows.every((row) => row.attempts === 0)).toBe(true);
      expect(s.app.get(PageSpeedRuntimeState).keyRejected).toBe(true);
      expect(s.transport.requests.filter(isGoogle)).toHaveLength(1);
      expect((await listBodyOf(s)).pageSpeedAvailability).toEqual({
        state: 'keyRejected',
      });
      const [{ id: clientId }] = (
        await request(s.app.getHttpServer())
          .get('/api/clients')
          .set('Cookie', s.cookie)
          .expect(200)
      ).body.items as { id: number }[];
      const report = (
        await request(s.app.getHttpServer())
          .get(`/api/clients/${clientId}/issues`)
          .set('Cookie', s.cookie)
          .expect(200)
      ).body as { pageSpeedAvailability: { state: string } };
      expect(report.pageSpeedAvailability).toEqual({ state: 'keyRejected' });
    });
  });

  describe('without a key', () => {
    it('the rows stay queued and nothing asks Google', async () => {
      const s = await stack();
      try {
        await crawlYoast(s);

        const rows = await testDb.db.select().from(pageSpeed);
        expect(rows).toHaveLength(15);
        expect(rows.every((row) => row.status === 'queued')).toBe(true);
        expect(s.transport.requests.filter(isGoogle)).toEqual([]);
        expect((await listBodyOf(s)).pageSpeedAvailability).toEqual({
          state: 'notConfigured',
        });
      } finally {
        await s.app.close();
      }
    });
  });
});
