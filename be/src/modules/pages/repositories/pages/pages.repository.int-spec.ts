import { clients } from '@persistence/schema/tables/clients/clients.schema';
import { crawlRuns } from '@persistence/schema/tables/crawl-runs/crawl-runs.schema';
import { pages } from '@persistence/schema/tables/pages/pages.schema';
import { expectPgError } from '../../../../../test/support/expect-pg-error';
import { seedTestUser } from '../../../../../test/support/sign-in';
import { createTestDatabase } from '../../../../../test/support/test-database';
import { PagesRepository, type IUpsertPage } from './pages.repository';

const testDb = createTestDatabase();
const repository = new PagesRepository(testDb.db);

async function seedClientWithRuns(): Promise<{
  clientId: number;
  firstRunId: number;
  secondRunId: number;
}> {
  const user = await seedTestUser(testDb, 'owner@example.com');
  const [client] = await testDb.db
    .insert(clients)
    .values({
      userId: user.id,
      name: 'Yoast',
      websiteUrl: 'https://yoast.com',
      siteKey: 'yoast.com',
    })
    .returning({ id: clients.id });
  const now = new Date();
  const finished = {
    clientId: client.id,
    trigger: 'user' as const,
    status: 'succeeded' as const,
    startedAt: now,
    finishedAt: now,
  };
  const [first] = await testDb.db
    .insert(crawlRuns)
    .values(finished)
    .returning({ id: crawlRuns.id });
  const [second] = await testDb.db
    .insert(crawlRuns)
    .values(finished)
    .returning({ id: crawlRuns.id });
  return { clientId: client.id, firstRunId: first.id, secondRunId: second.id };
}

const page = (
  clientId: number,
  runId: number,
  overrides: Partial<IUpsertPage> = {},
): IUpsertPage => ({
  clientId,
  url: 'https://yoast.com/how-to-remove-www-from-your-url/',
  finalUrl: 'https://yoast.com/how-to-remove-www-from-your-url/',
  title: 'How to remove www',
  metaDescription: null,
  h1: 'How to remove www',
  lang: 'en',
  wordCount: 900,
  httpStatus: 200,
  responseMs: 120,
  htmlBytes: 190_000,
  checksApplicable: 18,
  checksFailed: 3,
  sitemapPosition: 1,
  lastSeenRunId: runId,
  crawledAt: new Date(),
  ...overrides,
});

describe('PagesRepository (postgres)', () => {
  beforeEach(() => testDb.reset());
  afterAll(() => testDb.close());

  it('upserts on (client_id, url): a re-crawl keeps the id and moves last_seen_run_id', async () => {
    const { clientId, firstRunId, secondRunId } = await seedClientWithRuns();

    const [first] = await testDb.db.transaction((tx) =>
      repository.upsertManyForWorker(tx, [page(clientId, firstRunId)]),
    );
    const [second] = await testDb.db.transaction((tx) =>
      repository.upsertManyForWorker(tx, [
        page(clientId, secondRunId, { title: 'Updated title' }),
      ]),
    );

    expect(second.id).toBe(first.id);
    const rows = await testDb.db.select().from(pages);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      lastSeenRunId: secondRunId,
      title: 'Updated title',
    });
  });

  it('a re-crawl refreshes the check counters with the issues, not only the page', async () => {
    const { clientId, firstRunId, secondRunId } = await seedClientWithRuns();

    await testDb.db.transaction((tx) =>
      repository.upsertManyForWorker(tx, [
        page(clientId, firstRunId, { checksApplicable: 18, checksFailed: 7 }),
      ]),
    );
    await testDb.db.transaction((tx) =>
      repository.upsertManyForWorker(tx, [
        page(clientId, secondRunId, { checksApplicable: 16, checksFailed: 2 }),
      ]),
    );

    // Left at their first value, the score would contradict the issue list beside it.
    const rows = await testDb.db.select().from(pages);
    expect(rows[0]).toMatchObject({ checksApplicable: 16, checksFailed: 2 });
  });

  it('refuses a page with more failures than applicable checks', async () => {
    const { clientId, firstRunId } = await seedClientWithRuns();

    await expectPgError(
      testDb.db.transaction((tx) =>
        repository.upsertManyForWorker(tx, [
          page(clientId, firstRunId, {
            checksApplicable: 16,
            checksFailed: 17,
          }),
        ]),
      ),
      { code: '23514', constraint: 'pages_checks_failed_range' },
    );
  });

  it('refuses a page with no applicable checks, because a score cannot divide by zero', async () => {
    const { clientId, firstRunId } = await seedClientWithRuns();

    await expectPgError(
      testDb.db.transaction((tx) =>
        repository.upsertManyForWorker(tx, [
          page(clientId, firstRunId, { checksApplicable: 0, checksFailed: 0 }),
        ]),
      ),
      { code: '23514', constraint: 'pages_checks_applicable_positive' },
    );
  });

  it('refuses a page inserted without the counters', async () => {
    const { clientId, firstRunId } = await seedClientWithRuns();
    const { checksApplicable, checksFailed, ...withoutCounters } = page(
      clientId,
      firstRunId,
    );
    void checksApplicable;
    void checksFailed;

    await expectPgError(
      testDb.db.insert(pages).values(withoutCounters as IUpsertPage),
      { code: '23502', column: 'checks_applicable' },
    );
  });
});
