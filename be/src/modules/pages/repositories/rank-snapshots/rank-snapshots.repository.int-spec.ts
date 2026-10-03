import { eq } from 'drizzle-orm';
import { clients } from '@persistence/schema/tables/clients/clients.schema';
import { crawlRuns } from '@persistence/schema/tables/crawl-runs/crawl-runs.schema';
import { keywords } from '@persistence/schema/tables/keywords/keywords.schema';
import { pageKeywords } from '@persistence/schema/tables/page-keywords/page-keywords.schema';
import { pages } from '@persistence/schema/tables/pages/pages.schema';
import { rankSnapshots } from '@persistence/schema/tables/rank-snapshots/rank-snapshots.schema';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import { expectPgError } from '../../../../../test/support/expect-pg-error';
import { seedTestUser } from '../../../../../test/support/sign-in';
import { createTestDatabase } from '../../../../../test/support/test-database';
import { RankSnapshotsRepository } from './rank-snapshots.repository';

const testDb = createTestDatabase();
const repository = new RankSnapshotsRepository(testDb.db);

const DAY = 24 * 60 * 60 * 1000;
const noon = (daysAgo: number) =>
  new Date(Date.UTC(2026, 8, 30, 12) - daysAgo * DAY);

const scopeOf = (userId: number) =>
  ({ userId, timeZone: 'America/Toronto' }) as IUserScope;

/**
 * A client with an old and a current run; one page with a current and a stale pair.
 * `suffix` keeps the terms apart: a keyword term is global, not one user's.
 */
async function seedPairs(email = 'owner@example.com', suffix = '') {
  const user = await seedTestUser(testDb, email);
  const [client] = await testDb.db
    .insert(clients)
    .values({
      userId: user.id,
      name: 'Site',
      websiteUrl: 'https://a.example',
      siteKey: 'a.example',
    })
    .returning();
  const finished = {
    clientId: client.id,
    trigger: 'user' as const,
    status: 'succeeded' as const,
    startedAt: new Date(),
    finishedAt: new Date(),
  };
  const [oldRun] = await testDb.db
    .insert(crawlRuns)
    .values(finished)
    .returning();
  const [currentRun] = await testDb.db
    .insert(crawlRuns)
    .values(finished)
    .returning();
  const [page] = await testDb.db
    .insert(pages)
    .values({
      clientId: client.id,
      url: 'https://a.example/post/',
      finalUrl: 'https://a.example/post/',
      wordCount: 500,
      httpStatus: 200,
      responseMs: 100,
      htmlBytes: 1000,
      sitemapPosition: 0,
      lastSeenRunId: currentRun.id,
      crawledAt: new Date(),
    })
    .returning();
  const [current, stale] = await testDb.db
    .insert(keywords)
    .values([
      { term: `current term${suffix}` },
      { term: `stale term${suffix}` },
    ])
    .returning();
  await testDb.db.insert(pageKeywords).values([
    {
      pageId: page.id,
      keywordId: current.id,
      relevance: 1,
      lastSeenRunId: currentRun.id,
    },
    {
      pageId: page.id,
      keywordId: stale.id,
      relevance: 0.5,
      lastSeenRunId: oldRun.id,
    },
  ]);
  return {
    userId: user.id,
    clientId: client.id,
    pageId: page.id,
    currentId: current.id,
    staleId: stale.id,
  };
}

describe('RankSnapshotsRepository (postgres)', () => {
  beforeEach(() => testDb.reset());
  afterAll(() => testDb.close());

  it('ON CONFLICT DO NOTHING keeps the first row and counts only new ones', async () => {
    const { pageId, currentId } = await seedPairs();
    const snapshot = {
      pageId,
      keywordId: currentId,
      capturedAt: noon(1),
      position: 7,
    };

    await expect(repository.insertManyForWorker([snapshot])).resolves.toBe(1);
    await expect(
      repository.insertManyForWorker([
        { ...snapshot, position: 50 },
        { ...snapshot, capturedAt: noon(0), position: 8 },
      ]),
    ).resolves.toBe(1);

    const rows = await testDb.db
      .select()
      .from(rankSnapshots)
      .orderBy(rankSnapshots.capturedAt);
    expect(rows.map((row) => row.position)).toEqual([7, 8]);
    await expect(repository.countForWorker()).resolves.toBe(2);
  });

  it.each([0, 101])(
    'refuses position %d (rank_snapshots_position_range)',
    async (position) => {
      const { pageId, currentId } = await seedPairs();

      await expectPgError(
        repository.insertManyForWorker([
          { pageId, keywordId: currentId, capturedAt: noon(0), position },
        ]),
        { code: '23514', constraint: 'rank_snapshots_position_range' },
      );
    },
  );

  it('refuses a snapshot for a pair the page does not have', async () => {
    const { pageId } = await seedPairs();
    const [orphan] = await testDb.db
      .insert(keywords)
      .values({ term: 'orphan' })
      .returning();

    await expectPgError(
      repository.insertManyForWorker([
        { pageId, keywordId: orphan.id, capturedAt: noon(0), position: 5 },
      ]),
      { code: '23503', constraint: 'rank_snapshots_page_keyword_fk' },
    );
  });

  it('deleting a page cascades its snapshots', async () => {
    const { pageId, currentId } = await seedPairs();
    await repository.insertManyForWorker([
      { pageId, keywordId: currentId, capturedAt: noon(0), position: 5 },
    ]);

    await testDb.db.delete(pages).where(eq(pages.id, pageId));

    await expect(repository.countForWorker()).resolves.toBe(0);
  });

  it('deleting a client removes its runs, pages, pairs and snapshots, not the keywords', async () => {
    const { clientId, pageId, currentId } = await seedPairs();
    await repository.insertManyForWorker([
      { pageId, keywordId: currentId, capturedAt: noon(0), position: 5 },
    ]);

    await testDb.db.delete(clients).where(eq(clients.id, clientId));

    expect(await testDb.db.$count(crawlRuns)).toBe(0);
    expect(await testDb.db.$count(pages)).toBe(0);
    expect(await testDb.db.$count(pageKeywords)).toBe(0);
    await expect(repository.countForWorker()).resolves.toBe(0);
    expect(await testDb.db.$count(keywords)).toBe(2);
  });

  it('lists only current pairs, with the last stored snapshot', async () => {
    const { pageId, currentId, staleId } = await seedPairs();
    await repository.insertManyForWorker([
      { pageId, keywordId: currentId, capturedAt: noon(2), position: 9 },
      { pageId, keywordId: currentId, capturedAt: noon(1), position: 11 },
      { pageId, keywordId: staleId, capturedAt: noon(1), position: 40 },
    ]);

    await expect(repository.listCurrentPairsForWorker()).resolves.toEqual([
      {
        pageId,
        keywordId: currentId,
        url: 'https://a.example/post/',
        term: 'current term',
        relevance: 1,
        lastCapturedAt: noon(1),
        lastPosition: 11,
      },
    ]);
  });

  it("scoped to a user, lists their pairs and nobody else's", async () => {
    const owner = await seedPairs();
    const other = await seedPairs('other@example.com', ' two');

    const mine = await repository.listCurrentPairs(scopeOf(owner.userId));
    const theirs = await repository.listCurrentPairs(scopeOf(other.userId));

    expect(mine.map((pair) => pair.pageId)).toEqual([owner.pageId]);
    expect(theirs.map((pair) => pair.pageId)).toEqual([other.pageId]);
    await expect(repository.listCurrentPairsForWorker()).resolves.toHaveLength(
      2,
    );
  });
});
