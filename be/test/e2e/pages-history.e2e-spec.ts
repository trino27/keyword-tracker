import type { NestExpressApplication } from '@nestjs/platform-express';
import { sql } from 'drizzle-orm';
import request from 'supertest';
import { rankSnapshots } from '../../src/persistence/schema/tables/rank-snapshots/rank-snapshots.schema';
import { createTestApp } from '../support/create-test-app';
import { seedCurrentPage } from '../support/seed-page';
import { seedTestUser, signIn } from '../support/sign-in';
import { createTestDatabase } from '../support/test-database';

const testDb = createTestDatabase();

describe('page detail and position history (e2e)', () => {
  let app: NestExpressApplication;
  let cookie: string;
  let page: Awaited<ReturnType<typeof seedCurrentPage>>;
  const get = (path: string, as = cookie) =>
    request(app.getHttpServer()).get(path).set('Cookie', as);

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await testDb.reset();
    const user = await seedTestUser(testDb, 'manager@example.com');
    cookie = await signIn(app, 'manager@example.com');
    page = await seedCurrentPage(testDb, user.id, ['seo audit', 'new keyword']);
    const noon = (day: string) => new Date(`${day}T12:00:00Z`);
    await testDb.db.insert(rankSnapshots).values(
      [
        '2025-11-01',
        '2025-11-02',
        '2025-11-03',
        '2026-03-07',
        '2026-03-08',
        '2026-03-09',
      ].map((day, i) => ({
        pageId: page.pageId,
        keywordId: page.keywordIds[0],
        capturedAt: noon(day),
        position: 10 + i,
      })),
    );
    await testDb.db.execute(sql`
      insert into seo_issues (page_id, code, severity, details_json) values
      (${page.pageId}, 'LANG_MISSING', 'notice', '{}'),
      (${page.pageId}, 'H1_MISSING', 'error', '{}')
    `);
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  const positions = (query: string) =>
    get(`/api/pages/${page.pageId}/positions${query}`);

  it('the fall-back day in Toronto (25 h) holds exactly its own noon point', async () => {
    const response = await positions('?from=2025-11-02&to=2025-11-02').expect(
      200,
    );

    expect(response.body).toMatchObject({
      from: '2025-11-02',
      to: '2025-11-02',
      timeZone: 'America/Toronto',
    });
    expect(response.body.series[0]).toEqual({
      keywordId: page.keywordIds[0],
      term: 'seo audit',
      points: [{ capturedAt: '2025-11-02T12:00:00.000Z', position: 11 }],
    });
  });

  it('the spring-forward day (23 h) too; a keyword without points keeps its empty series', async () => {
    const response = await positions('?from=2026-03-08&to=2026-03-08').expect(
      200,
    );

    expect(response.body.series).toEqual([
      {
        keywordId: page.keywordIds[0],
        term: 'seo audit',
        points: [{ capturedAt: '2026-03-08T12:00:00.000Z', position: 14 }],
      },
      { keywordId: page.keywordIds[1], term: 'new keyword', points: [] },
    ]);
  });

  it.each([
    ['?from=2026-03-10&to=2026-03-01', 'INVALID_DATE_RANGE'],
    ['?from=2025-01-01&to=2026-03-01', 'INVALID_DATE_RANGE'],
    ['?from=2026-02-30', 'BAD_REQUEST'],
    ['?timeZone=Asia/Tokyo', 'BAD_REQUEST'],
  ])('%s is a 400 %s', async (query, errorCode) => {
    const response = await positions(query).expect(400);

    expect(response.body).toMatchObject({ errorCode });
  });

  it('the detail carries keywords, issues in catalogue order and the last crawl', async () => {
    const response = await get(`/api/pages/${page.pageId}`).expect(200);

    expect(response.body).toMatchObject({
      page: {
        id: page.pageId,
        wordCount: 800,
        httpStatus: 200,
        responseMs: 120,
      },
      client: { id: page.clientId },
      // 15 of the seeded page's 18 applicable checks passed.
      score: { value: 83, applicable: 18, failed: 3 },
      bestPosition: { position: 15, term: 'seo audit' },
      lastCrawl: { id: page.runId, status: 'succeeded' },
    });
    expect(response.body.keywords).toHaveLength(2);
    expect(
      response.body.issues.map((issue: { code: string }) => issue.code),
    ).toEqual(['H1_MISSING', 'LANG_MISSING']);
  });

  it('a page a newer crawl no longer found is a 404, like a missing one', async () => {
    const [{ user_id: userId }] = (
      await testDb.db.execute<{ user_id: string }>(
        sql`select user_id from clients where id = ${page.clientId}`,
      )
    ).rows;
    await seedCurrentPage(testDb, Number(userId), ['other'], page.clientId);

    const dropped = await get(`/api/pages/${page.pageId}`).expect(404);
    const missing = await get('/api/pages/2000000000').expect(404);

    expect(dropped.body).toEqual(missing.body);
    await positions('').expect(404);
  });

  it('another user gets 404 for this page and its positions', async () => {
    await seedTestUser(testDb, 'other@example.com');
    const other = await signIn(app, 'other@example.com');

    const detail = await get(`/api/pages/${page.pageId}`, other).expect(404);
    const history = await get(
      `/api/pages/${page.pageId}/positions`,
      other,
    ).expect(404);

    expect(detail.body).toMatchObject({ errorCode: 'PAGE_NOT_FOUND' });
    expect(history.body).toEqual(detail.body);
  });
});
