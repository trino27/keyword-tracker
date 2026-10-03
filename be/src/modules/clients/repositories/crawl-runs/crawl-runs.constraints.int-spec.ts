import { clients } from '@persistence/schema/tables/clients/clients.schema';
import { crawlRunItems } from '@persistence/schema/tables/crawl-run-items/crawl-run-items.schema';
import { crawlRuns } from '@persistence/schema/tables/crawl-runs/crawl-runs.schema';
import { expectPgError } from '../../../../../test/support/expect-pg-error';
import { seedTestUser } from '../../../../../test/support/sign-in';
import { createTestDatabase } from '../../../../../test/support/test-database';

const testDb = createTestDatabase();

async function seedClient(siteKey = 'yoast.com'): Promise<number> {
  const user = await seedTestUser(testDb, `owner-${siteKey}@example.com`);
  const [client] = await testDb.db
    .insert(clients)
    .values({
      userId: user.id,
      name: 'Yoast',
      websiteUrl: `https://${siteKey}`,
      siteKey,
    })
    .returning({ id: clients.id });
  return client.id;
}

describe('clients and crawl runs — schema constraints (postgres)', () => {
  beforeEach(() => testDb.reset());
  afterAll(() => testDb.close());

  it('I9: one client per (user, site key)', async () => {
    const user = await seedTestUser(testDb, 'owner@example.com');
    const client = {
      userId: user.id,
      name: 'Yoast',
      websiteUrl: 'https://yoast.com',
      siteKey: 'yoast.com',
    };
    await testDb.db.insert(clients).values(client);

    await expectPgError(
      testDb.db
        .insert(clients)
        .values({ ...client, websiteUrl: 'https://www.yoast.com' }),
      { code: '23505', constraint: 'clients_user_id_site_key_uq' },
    );
  });

  it('I9: two users may track the same site', async () => {
    const first = await seedTestUser(testDb, 'first@example.com');
    const second = await seedTestUser(testDb, 'second@example.com');
    const row = {
      name: 'Yoast',
      websiteUrl: 'https://yoast.com',
      siteKey: 'yoast.com',
    };

    await testDb.db.insert(clients).values({ ...row, userId: first.id });
    await expect(
      testDb.db.insert(clients).values({ ...row, userId: second.id }),
    ).resolves.toBeDefined();
  });

  it('I10: at most one queued or running run per client', async () => {
    const clientId = await seedClient();
    await testDb.db.insert(crawlRuns).values({ clientId, trigger: 'user' });

    await expectPgError(
      testDb.db.insert(crawlRuns).values({ clientId, trigger: 'user' }),
      { code: '23505', constraint: 'crawl_runs_client_id_active_uq' },
    );
  });

  it('I10: a finished run does not block the next one', async () => {
    const clientId = await seedClient();
    const now = new Date();
    await testDb.db.insert(crawlRuns).values({
      clientId,
      trigger: 'user',
      status: 'succeeded',
      startedAt: now,
      finishedAt: now,
    });

    await expect(
      testDb.db.insert(crawlRuns).values({ clientId, trigger: 'user' }),
    ).resolves.toBeDefined();
  });

  it('I11: a finished run must have finished_at', async () => {
    const clientId = await seedClient();
    await expectPgError(
      testDb.db.insert(crawlRuns).values({
        clientId,
        trigger: 'user',
        status: 'failed',
        startedAt: new Date(),
      }),
      { code: '23514', constraint: 'crawl_runs_finished_at_required' },
    );
  });

  it('I11: a started run must have started_at', async () => {
    const clientId = await seedClient();
    await expectPgError(
      testDb.db
        .insert(crawlRuns)
        .values({ clientId, trigger: 'user', status: 'running' }),
      { code: '23514', constraint: 'crawl_runs_started_at_required' },
    );
  });

  it('I11: attempts never exceed 3', async () => {
    const clientId = await seedClient();
    await expectPgError(
      testDb.db
        .insert(crawlRuns)
        .values({ clientId, trigger: 'user', attempts: 4 }),
      { code: '23514', constraint: 'crawl_runs_attempts_range' },
    );
  });

  it('I16: a crawled item must reference its page; a skipped one must say why', async () => {
    const clientId = await seedClient();
    const [run] = await testDb.db
      .insert(crawlRuns)
      .values({ clientId, trigger: 'user' })
      .returning({ id: crawlRuns.id });

    await expectPgError(
      testDb.db.insert(crawlRunItems).values({
        runId: run.id,
        sitemapPosition: 0,
        url: 'https://yoast.com/x/',
        status: 'crawled',
      }),
      { code: '23514', constraint: 'crawl_run_items_page_required' },
    );
    await expectPgError(
      testDb.db.insert(crawlRunItems).values({
        runId: run.id,
        sitemapPosition: 1,
        url: 'https://yoast.com/seo-blog/',
        status: 'skipped_listing',
      }),
      { code: '23514', constraint: 'crawl_run_items_reason_required' },
    );
  });
});
