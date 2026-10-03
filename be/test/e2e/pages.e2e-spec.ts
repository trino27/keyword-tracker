import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
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

  it('pages through the 15 posts, in sitemap order', async () => {
    const first = await list('?pageSize=10').expect(200);
    const second = await list('?pageSize=10&page=2').expect(200);

    expect(first.body).toMatchObject({ page: 1, pageSize: 10, total: 15 });
    expect(first.body.items).toHaveLength(10);
    expect(second.body.items).toHaveLength(5);
    expect(first.body.items[0]).toMatchObject({
      url: 'https://yoast.com/how-to-remove-www-from-your-url/',
      client: { id: clientId, name: 'Yoast' },
      bestPosition: null,
    });
    expect(first.body.items[0].keywords.length).toBeGreaterThanOrEqual(5);
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
