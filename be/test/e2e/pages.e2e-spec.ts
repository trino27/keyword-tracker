import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { SEO_ISSUE_CODES } from '@app/contracts';
import { MAX_KEYWORDS } from '../../src/modules/page-analysis/constants/keyword-scoring.constant';
import { CrawlWorker } from '../../src/modules/crawl/workers/crawl-worker/crawl-worker';
import { createTestApp } from '../support/create-test-app';
import { seedTestUser, signIn } from '../support/sign-in';
import { createTestDatabase } from '../support/test-database';

const testDb = createTestDatabase();

describe('pages list (e2e, recorded yoast crawl)', () => {
  let app: NestExpressApplication;
  let cookie: string;
  let clientId: number;
  const http = () => request(app.getHttpServer());
  const list = (query: string) =>
    http().get(`/api/pages${query}`).set('Cookie', cookie);

  beforeAll(async () => {
    app = await createTestApp();
    await testDb.reset();
    await seedTestUser(testDb, 'manager@example.com');
    await seedTestUser(testDb, 'other@example.com');
    cookie = await signIn(app, 'manager@example.com');
    const created = await http()
      .post('/api/clients')
      .set('Cookie', cookie)
      .send({ name: 'Yoast', websiteUrl: 'yoast.com' })
      .expect(201);
    clientId = created.body.client.id as number;
    await app.get(CrawlWorker).runOnce();
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  it('pages through the 15 posts, worst first and each exactly once', async () => {
    const first = await list('?pageSize=10').expect(200);
    const second = await list('?pageSize=10&page=2').expect(200);

    expect(first.body).toMatchObject({ page: 1, pageSize: 10, total: 15 });
    expect(first.body.items).toHaveLength(10);
    expect(second.body.items).toHaveLength(5);
    expect(first.body.items[0]).toMatchObject({
      client: { id: clientId, name: 'Yoast' },
      bestPosition: null,
    });
    // Every page carries keywords, none more than the cap, and the strongest is the one
    // relevance is measured against. A fixed lower bound of five would re-assert the
    // topping-up that select-keywords deliberately does not do.
    for (const item of [...first.body.items, ...second.body.items]) {
      const relevances = (item.keywords as { relevance: number }[]).map(
        ({ relevance }) => relevance,
      );
      expect(relevances.length).toBeGreaterThanOrEqual(1);
      expect(relevances.length).toBeLessThanOrEqual(MAX_KEYWORDS);
      expect(relevances[0]).toBe(1);
      expect(relevances).toEqual([...relevances].sort((a, b) => b - a));
    }

    const scores = [...first.body.items, ...second.body.items].map(
      (item: { score: { value: number } }) => item.score.value,
    );
    expect(scores).toEqual([...scores].sort((a, b) => a - b));

    // The walk is over two real pages of a real planner: the order is total, so no post
    // repeats and none is skipped between them.
    const ids = [...first.body.items, ...second.body.items].map(
      (item: { id: number }) => item.id,
    );
    expect(new Set(ids).size).toBe(15);
  });

  it('searches by URL and by keyword', async () => {
    const byUrl = await list('?q=gutenberg').expect(200);
    const byKeyword = await list('?q=Remove%20WWW').expect(200);

    const urls = (body: { items: { url: string }[] }) =>
      body.items.map((item) => item.url);
    // Two URLs say "gutenberg"; a third post has it only as a keyword.
    expect(urls(byUrl.body)).toEqual(
      expect.arrayContaining([
        'https://yoast.com/pressing-questions-about-gutenberg-the-new-editor-in-wordpress-5-0/',
        'https://yoast.com/on-gutenberg-and-wordpress-5-0/',
      ]),
    );
    expect(byUrl.body.total).toBeGreaterThan(2);
    expect(urls(byKeyword.body)).toContain(
      'https://yoast.com/how-to-remove-www-from-your-url/',
    );
  });

  it.each([
    '?pageSize=51',
    '?page=0',
    '?clientId=abc',
    '?q=' + 'x'.repeat(201),
    '?userId=1',
  ])('%s is a 400', async (query) => {
    const response = await list(query).expect(400);

    expect(response.body).toMatchObject({ errorCode: 'BAD_REQUEST' });
  });

  it('an empty search is no search', async () => {
    await expect(list('?q=%20%20').expect(200)).resolves.toMatchObject({
      body: { total: 15 },
    });
  });

  it('every item carries a score and the denominator it came from', async () => {
    const response = await list('?pageSize=20').expect(200);

    for (const item of response.body.items as {
      score: { value: number; applicable: number; failed: number };
    }[]) {
      expect(item.score.applicable).toBeGreaterThanOrEqual(13);
      expect(item.score.applicable).toBeLessThanOrEqual(18);
      expect(item.score.failed).toBeLessThanOrEqual(item.score.applicable);
      expect(item.score.value).toBe(
        Math.round(
          (100 * (item.score.applicable - item.score.failed)) /
            item.score.applicable,
        ),
      );
    }
  });

  it('the detail carries its score, the fetch time and a measured finding', async () => {
    const { body } = await list('?q=gutenberg&pageSize=1').expect(200);
    const detail = await http()
      .get(`/api/pages/${body.items[0].id}`)
      .set('Cookie', cookie)
      .expect(200);

    expect(detail.body.score).toMatchObject({
      value: expect.any(Number),
      applicable: expect.any(Number),
      failed: expect.any(Number),
    });
    expect(detail.body.page.responseMs).toEqual(expect.any(Number));
    // A measured finding reads from its own numbers, so a screen never has to consult
    // today's catalogue to explain an old verdict.
    const measured = (
      detail.body.issues as { code: string; details: unknown }[]
    )
      .filter((issue) => issue.code === 'TITLE_LENGTH')
      .map((issue) => issue.details);
    for (const details of measured) {
      expect(details).toMatchObject({
        value: expect.any(Number),
        min: 30,
        max: 60,
      });
    }
  });

  /**
   * The one assertion that covers the crawl, the upsert, the read and the serialization
   * together: a freshly crawled page must account for every catalogue code, and its
   * passes must be exactly the ones the score's own numbers claim. Nothing short of a
   * real crawl can produce the two stored lists, so nothing short of this can prove they
   * come back as statuses.
   */
  it('the detail answers for every catalogue check, and the answers add up', async () => {
    const { body } = await list('?q=gutenberg&pageSize=1').expect(200);
    const detail = await http()
      .get(`/api/pages/${body.items[0].id}`)
      .set('Cookie', cookie)
      .expect(200);

    const checks = detail.body.checks as { code: string; status: string }[];
    expect(checks.map(({ code }) => code)).toEqual(SEO_ISSUE_CODES);

    const count = (status: string) =>
      checks.filter((check) => check.status === status).length;
    const { applicable, failed } = detail.body.score as {
      applicable: number;
      failed: number;
    };
    expect(count('passed')).toBe(applicable - failed);
    expect(count('failed')).toBe(failed);
    expect(count('passed') + count('failed')).toBe(applicable);
    // This page was crawled against today's catalogue, so nothing can be newer than it.
    expect(count('notYetChecked')).toBe(0);
  });

  it('a finding shared across the client’s pages says how many it is on', async () => {
    const { body } = await list('?pageSize=20').expect(200);
    // The page that HAS a shared finding, not whichever happens to score worst. Yoast's
    // fifteen posts come from one template, so some code is shared; which page is worst
    // depends on the catalogue and is not what this test is about.
    const withShared = (
      body.items as { id: number; issues: { siteWide: number } }[]
    ).find((item) => item.issues.siteWide > 0);
    expect(withShared).toBeDefined();
    const detail = await http()
      .get(`/api/pages/${withShared!.id}`)
      .set('Cookie', cookie)
      .expect(200);

    const issues = detail.body.issues as {
      code: string;
      pagesAffected: number;
    }[];
    expect(issues.length).toBeGreaterThan(0);
    for (const issue of issues) {
      expect(issue.pagesAffected).toBeGreaterThanOrEqual(1);
      expect(issue.pagesAffected).toBeLessThanOrEqual(15);
    }
    // Yoast's fifteen posts come from one template, so at least one finding is shared.
    expect(issues.some((issue) => issue.pagesAffected > 1)).toBe(true);
    expect(detail.body.client.currentPages).toBe(15);

    // And the list's own count agrees: it is the number of THIS page's codes that
    // another page of the client also carries.
    const shared = issues.filter((issue) => issue.pagesAffected > 1).length;
    expect(withShared!.issues.siteWide).toBe(shared);
  });

  it("another user's clientId is a 404, and their list is empty", async () => {
    const other = await signIn(app, 'other@example.com');

    const foreign = await http()
      .get(`/api/pages?clientId=${clientId}`)
      .set('Cookie', other)
      .expect(404);
    const own = await http().get('/api/pages').set('Cookie', other).expect(200);

    expect(foreign.body).toMatchObject({ errorCode: 'CLIENT_NOT_FOUND' });
    expect(own.body).toMatchObject({ items: [], total: 0 });
  });
});
