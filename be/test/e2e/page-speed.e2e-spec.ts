import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { and, eq, like } from 'drizzle-orm';
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
import { seoIssues } from '../../src/persistence/schema/tables/seo-issues/seo-issues.schema';
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

/**
 * Every page's PageSpeed requests answer with recorded fixtures: the mobile one with
 * `fixture`, the desktop one with the recorded desktop answer — or, for an error, the same
 * error, since Google refuses a key or a page on either device alike. An unanswered URL
 * would be a 404 from the fixture transport and fail the row, so both devices are named.
 */
async function answerEveryPage(
  transport: FixtureHttpTransport,
  status: number,
  fixture: string,
  desktopFixture = status === 200 ? 'url-field.desktop.json' : fixture,
) {
  const rows = await testDb.db.select({ finalUrl: pages.finalUrl }).from(pages);
  for (const { finalUrl } of rows) {
    transport.override(
      PsiClient.requestUrl(finalUrl, 'mobile'),
      psiAnswer(status, fixture),
    );
    transport.override(
      PsiClient.requestUrl(finalUrl, 'desktop'),
      psiAnswer(status, desktopFixture),
    );
  }
}

/** Every stored Lighthouse finding, as page and code, sorted. */
const lighthouseCodes = async () =>
  (
    await testDb.db
      .select({ pageId: seoIssues.pageId, code: seoIssues.code })
      .from(seoIssues)
      .where(like(seoIssues.code, 'LH\\_%'))
  )
    .map(({ pageId, code }) => `${pageId}:${code}`)
    .sort();

/** The page ids and devices of the rows, sorted, for comparing queues. */
const queueOf = async () =>
  (
    await testDb.db
      .select({ pageId: pageSpeed.pageId, strategy: pageSpeed.strategy })
      .from(pageSpeed)
  )
    .map(({ pageId, strategy }) => `${pageId}:${strategy}`)
    .sort();

async function drain(app: NestExpressApplication): Promise<number> {
  let measured = 0;
  while (await app.get(PageSpeedWorker).runOnce()) measured += 1;
  return measured;
}

interface IListItem {
  id: number;
  score: {
    value: number;
    applicable: number;
    failed: number;
    byOwner: {
      crawl: { applicable: number; failed: number };
      lighthouse: { applicable: number; failed: number } | null;
    };
  };
  issues: { total: number; notice: number; warning: number };
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

    it('a crawl queues both strategies of each page', async () => {
      const pageIds = await crawlYoast(s);

      const rows = await testDb.db.select().from(pageSpeed);
      expect(await queueOf()).toEqual(
        pageIds.flatMap((id) => [`${id}:mobile`, `${id}:desktop`]).sort(),
      );
      expect(rows.every((row) => row.status === 'queued')).toBe(true);
    });

    it('a crawl queues both strategies; each measured row has its findings', async () => {
      const [pageId] = await crawlYoast(s);
      await answerEveryPage(s.transport, 200, 'url-field.json');

      expect(await drain(s.app)).toBe(30);

      const rows = await testDb.db.select().from(pageSpeed);
      expect(rows.every((row) => row.status === 'done')).toBe(true);
      const [desktop] = rows.filter(
        (row) => row.pageId === pageId && row.strategy === 'desktop',
      );
      // The recorded desktop answer: LCP 2530 ms and CLS 0.18 need improvement.
      expect(desktop).toMatchObject({
        lcpMs: 2530,
        lighthouseJudged: null,
        seoScore: null,
        accessibilityScore: null,
      });
      const codes = (
        await testDb.db
          .select({ code: seoIssues.code })
          .from(seoIssues)
          .where(eq(seoIssues.pageId, pageId))
      )
        .map(({ code }) => code)
        .filter((code) => code.startsWith('CWV_'))
        .sort();
      expect(codes).toEqual([
        'CWV_CLS_NEEDS_IMPROVEMENT_DESKTOP',
        'CWV_INP_NEEDS_IMPROVEMENT',
        'CWV_LCP_NEEDS_IMPROVEMENT',
        'CWV_LCP_NEEDS_IMPROVEMENT_DESKTOP',
      ]);
    });

    /**
     * Lighthouse speaks for mobile alone (lighthouse-checks D16): a desktop measurement,
     * whose answer has no Lighthouse categories, must not clear the page's Lighthouse
     * findings, nor move its score or its place in the list.
     */
    it("a desktop measurement leaves the page's Lighthouse findings, its score and its place in the list", async () => {
      await crawlYoast(s);
      await answerEveryPage(s.transport, 200, 'lighthouse-url-field.json');
      // Mobile first: the desktop rows wait until the mobile ones are measured.
      await testDb.db
        .update(pageSpeed)
        .set({ nextAttemptAt: new Date(Date.now() + 3_600_000) })
        .where(eq(pageSpeed.strategy, 'desktop'));
      await drain(s.app);
      const lighthouseBefore = await lighthouseCodes();
      const before = await listOf(s);
      expect(lighthouseBefore.length).toBeGreaterThan(0);

      await testDb.db
        .update(pageSpeed)
        .set({ nextAttemptAt: new Date(Date.now() - 1_000) })
        .where(eq(pageSpeed.strategy, 'desktop'));
      expect(await drain(s.app)).toBe(15);

      expect(await lighthouseCodes()).toEqual(lighthouseBefore);
      const after = await listOf(s);
      expect(after.map(({ id }) => id)).toEqual(before.map(({ id }) => id));
      expect(after.map(({ score }) => score)).toEqual(
        before.map(({ score }) => score),
      );
    });

    it('a measured page has its speed findings in the detail', async () => {
      const [pageId] = await crawlYoast(s);
      await answerEveryPage(s.transport, 200, 'url-field.json');

      expect(await drain(s.app)).toBe(30);

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
      // A speed code is never a check, for any owner.
      expect(
        Object.values(
          detail.checksByOwner as Record<string, { code: string }[] | null>,
        )
          .flatMap((checks) => checks ?? [])
          .some(({ code }) => code.startsWith('CWV_')),
      ).toBe(false);
      const [row] = await testDb.db
        .select()
        .from(pageSpeed)
        .where(
          and(eq(pageSpeed.pageId, pageId), eq(pageSpeed.strategy, 'mobile')),
        );
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
      // The recorded answers: on mobile LCP 3025 ms and INP 212 ms need improvement; on
      // desktop LCP 2530 ms and CLS 0.18 do. Four notices, none in the score.
      after.forEach((item, i) => {
        expect(item.issues.total).toBe(before[i].issues.total + 4);
        expect(item.issues.notice).toBe(before[i].issues.notice + 4);
      });
    });

    /**
     * D50: image delivery is a speed finding — among the issues, never in the score. The
     * answer also carries Lighthouse's own verdicts, which do count; so the check is that
     * the crawl's share is untouched, the score has no speed owner, and Lighthouse's
     * failures are exactly its own findings.
     */
    it('an image-delivery finding counts among the issues and never in the score', async () => {
      const [pageId] = await crawlYoast(s);
      const before = await listOf(s);
      await answerEveryPage(s.transport, 200, 'image-delivery-failing.json');

      await drain(s.app);
      const after = await listOf(s);

      // Lighthouse's verdicts move the order, so pages are matched by id.
      const crawlShare = (items: IListItem[]) =>
        Object.fromEntries(
          items.map(({ id, score }) => [id, score.byOwner.crawl]),
        );
      expect(crawlShare(after)).toEqual(crawlShare(before));
      const detail = (
        await request(s.app.getHttpServer())
          .get(`/api/pages/${pageId}`)
          .set('Cookie', s.cookie)
          .expect(200)
      ).body as {
        issues: { code: string; details: unknown }[];
        score: { byOwner: Record<string, { failed: number } | null> };
      };
      expect(Object.keys(detail.score.byOwner).sort()).toEqual([
        'crawl',
        'lighthouse',
      ]);
      expect(detail.score.byOwner.lighthouse?.failed).toBe(
        detail.issues.filter(({ code }) => code.startsWith('LH_')).length,
      );
      expect(detail.issues).toContainEqual(
        expect.objectContaining({
          code: 'IMAGE_DELIVERY_INEFFICIENT',
          details: expect.objectContaining({
            value: 162_175,
            min: 102_400,
          }) as unknown,
        }),
      );
    });

    /**
     * PAGES-016: a Lighthouse finding counts like a crawl finding — among the issues, in
     * the client-wide spread and in the score — and its record is listed as checks.
     */
    it('a Lighthouse finding counts among the issues, in the spread and in the score', async () => {
      const [pageId] = await crawlYoast(s);
      const before = await listOf(s);
      await answerEveryPage(s.transport, 200, 'lighthouse-url-field.json');

      await drain(s.app);
      const after = await listOf(s);

      after.forEach((item) => {
        const was = before.find(({ id }) => id === item.id)!;
        // The recorded mobile answer: LCP and INP need improvement (two notices);
        // Lighthouse fails robots-txt (a notice). Its color-contrast and link-name failures
        // are accessibility audits, retired from the checks (lighthouse-checks D24). The
        // desktop answer adds LCP and CLS needing improvement (two notices).
        expect(item.issues.total).toBe(was.issues.total + 5);
        expect(item.issues.notice).toBe(was.issues.notice + 5);
        expect(item.issues.warning).toBe(was.issues.warning);
        const lighthouse = item.score.byOwner.lighthouse!;
        expect(lighthouse.failed).toBe(1);
        expect(item.score.applicable).toBe(
          was.score.applicable + lighthouse.applicable,
        );
        expect(item.score.failed).toBe(was.score.failed + 1);
      });

      const detail = (
        await request(s.app.getHttpServer())
          .get(`/api/pages/${pageId}`)
          .set('Cookie', s.cookie)
          .expect(200)
      ).body as {
        issues: { code: string; pagesAffected: number }[];
        checksByOwner: {
          lighthouse: { code: string; status: string }[] | null;
        };
      };
      expect(detail.issues).toContainEqual(
        expect.objectContaining({ code: 'LH_ROBOTS_TXT', pagesAffected: 15 }),
      );
      expect(
        detail.checksByOwner.lighthouse?.find(
          ({ code }) => code === 'LH_ROBOTS_TXT',
        )?.status,
      ).toBe('failed');
    });

    /** Plan I16: a coloured badge and its finding can never disagree. */
    it('every non-good badge in the list has its finding in the detail, and no good one does', async () => {
      await crawlYoast(s);
      const rows = await testDb.db
        .select({ finalUrl: pages.finalUrl })
        .from(pages);
      // Three different answers, so good, needs-improvement and poor all occur.
      const fixtures = ['url-field.json', 'origin-only.json', 'lab-only.json'];
      rows.forEach(({ finalUrl }, i) => {
        s.transport.override(
          PsiClient.requestUrl(finalUrl, 'mobile'),
          psiAnswer(200, fixtures[i % fixtures.length]),
        );
        s.transport.override(
          PsiClient.requestUrl(finalUrl, 'desktop'),
          psiAnswer(200, 'url-field.desktop.json'),
        );
      });
      await drain(s.app);

      for (const item of await listOf(s)) {
        const detail = (
          await request(s.app.getHttpServer())
            .get(`/api/pages/${item.id}`)
            .set('Cookie', s.cookie)
            .expect(200)
        ).body as { issues: { code: string }[] };
        // The list's badges are mobile; so are the codes they must agree with.
        const speedCodes = detail.issues
          .map(({ code }) => code)
          .filter(
            (code) => code.startsWith('CWV_') && !code.endsWith('_DESKTOP'),
          )
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

    /** Plan I16, per device: a desktop card and its desktop finding never disagree. */
    it('every non-good desktop card has its desktop finding', async () => {
      await crawlYoast(s);
      await answerEveryPage(s.transport, 200, 'url-field.json');
      await drain(s.app);

      for (const item of await listOf(s)) {
        const detail = (
          await request(s.app.getHttpServer())
            .get(`/api/pages/${item.id}`)
            .set('Cookie', s.cookie)
            .expect(200)
        ).body as {
          issues: { code: string }[];
          pageSpeedByStrategy: {
            desktop: {
              measurement: Record<
                'lcp' | 'inp' | 'cls',
                { band: string } | null
              > | null;
            } | null;
          };
        };
        const desktopCodes = detail.issues
          .map(({ code }) => code)
          .filter((code) => code.endsWith('_DESKTOP'))
          .sort();
        const measurement = detail.pageSpeedByStrategy.desktop?.measurement;
        const expected = (['lcp', 'inp', 'cls'] as const)
          .flatMap((metric) => {
            const reading = measurement?.[metric];
            return reading && reading.band !== 'good'
              ? [`${CODE_OF[metric][reading.band]}_DESKTOP`]
              : [];
          })
          .sort();
        expect(measurement).not.toBeNull();
        expect(desktopCodes).toEqual(expected);
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
      expect(detail.pageSpeedByStrategy).toMatchObject({
        mobile: { status: 'queued' },
        desktop: { status: 'queued' },
      });
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
        expect(rows).toHaveLength(30);
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
