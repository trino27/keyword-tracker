import { clients } from '@persistence/schema/tables/clients/clients.schema';
import { crawlRuns } from '@persistence/schema/tables/crawl-runs/crawl-runs.schema';
import { seedTestUser } from '../../../../../test/support/sign-in';
import { createTestDatabase } from '../../../../../test/support/test-database';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import { SiteChecksRepository } from './site-checks.repository';

const scopeOf = (userId: number) =>
  ({ userId, timeZone: 'America/Toronto' }) as IUserScope;

const testDb = createTestDatabase();
const repository = new SiteChecksRepository(testDb.db);

async function seedRun(
  email: string,
): Promise<{ userId: number; runId: number }> {
  const user = await seedTestUser(testDb, email);
  const [client] = await testDb.db
    .insert(clients)
    .values({
      userId: user.id,
      name: 'Yoast',
      websiteUrl: 'https://yoast.com',
      siteKey: 'yoast.com',
    })
    .returning({ id: clients.id });
  const [run] = await testDb.db
    .insert(crawlRuns)
    .values({
      clientId: client.id,
      trigger: 'user',
      status: 'succeeded',
      startedAt: new Date(),
      finishedAt: new Date(),
    })
    .returning({ id: crawlRuns.id });
  return { userId: user.id, runId: run.id };
}

const SOFT_404 = {
  code: 'SOFT_404' as const,
  status: 'failed' as const,
  severity: 'warning' as const,
  details: { evidence: ['GET https://yoast.com/x/ answered 200'] },
};

describe('SiteChecksRepository (postgres)', () => {
  beforeEach(() => testDb.reset());
  afterAll(() => testDb.close());

  it('stores a run’s site checks and reads them back for its owner', async () => {
    const own = await seedRun('owner@example.com');
    await testDb.db.transaction((tx) =>
      repository.replaceForWorker(tx, own.runId, [SOFT_404]),
    );

    await expect(
      repository.listByRun(scopeOf(own.userId), own.runId),
    ).resolves.toEqual([SOFT_404]);
  });

  // The owner is in the query: another user's run id answers nothing.
  it('reads nothing for a run another user owns', async () => {
    const own = await seedRun('owner@example.com');
    const stranger = await seedRun('stranger@example.com');
    await testDb.db.transaction((tx) =>
      repository.replaceForWorker(tx, own.runId, [SOFT_404]),
    );

    await expect(
      repository.listByRun(scopeOf(stranger.userId), own.runId),
    ).resolves.toEqual([]);
  });

  // A retried attempt of the same run replaces what the earlier attempt wrote.
  it('replaces rather than adds on a second write', async () => {
    const own = await seedRun('owner@example.com');
    await testDb.db.transaction(async (tx) => {
      await repository.replaceForWorker(tx, own.runId, [SOFT_404]);
      await repository.replaceForWorker(tx, own.runId, [
        { ...SOFT_404, status: 'passed', details: {} },
      ]);
    });

    await expect(
      repository.listByRun(scopeOf(own.userId), own.runId),
    ).resolves.toEqual([{ ...SOFT_404, status: 'passed', details: {} }]);
  });
});
