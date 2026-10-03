import { eq } from 'drizzle-orm';
import { clients } from '@persistence/schema/tables/clients/clients.schema';
import { crawlRuns } from '@persistence/schema/tables/crawl-runs/crawl-runs.schema';
import { seedTestUser } from '../../../../../test/support/sign-in';
import { createTestDatabase } from '../../../../../test/support/test-database';
import { CrawlRunsRepository } from './crawl-runs.repository';

const testDb = createTestDatabase();
const repository = new CrawlRunsRepository(testDb.db);
const LEASE_MS = 60_000;

let siteCounter = 0;
async function queueRun(): Promise<number> {
  siteCounter += 1;
  const user = await seedTestUser(testDb, `owner-${siteCounter}@example.com`);
  const [client] = await testDb.db
    .insert(clients)
    .values({
      userId: user.id,
      name: `Site ${siteCounter}`,
      websiteUrl: `https://site-${siteCounter}.example.com`,
      siteKey: `site-${siteCounter}.example.com`,
    })
    .returning({ id: clients.id });
  const [run] = await testDb.db
    .insert(crawlRuns)
    .values({ clientId: client.id, trigger: 'user' })
    .returning({ id: crawlRuns.id });
  return run.id;
}

const expireLease = (runId: number) =>
  testDb.db
    .update(crawlRuns)
    .set({ lockedUntil: new Date(Date.now() - 1000) })
    .where(eq(crawlRuns.id, runId));

const runRow = async (runId: number) =>
  (await testDb.db.select().from(crawlRuns).where(eq(crawlRuns.id, runId)))[0];

describe('crawl run queue (postgres)', () => {
  beforeEach(() => testDb.reset());
  afterAll(() => testDb.close());

  it('claims a queued run: running, attempt 1, leased', async () => {
    const runId = await queueRun();

    const claimed = await repository.claimNextForWorker(LEASE_MS);

    expect(claimed).toMatchObject({ id: runId, attempts: 1 });
    expect(await runRow(runId)).toMatchObject({
      status: 'running',
      attempts: 1,
    });
    expect((await runRow(runId)).lockedUntil!.getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it('two concurrent claims take two different runs (SKIP LOCKED)', async () => {
    await queueRun();
    await queueRun();

    const [first, second] = await Promise.all([
      repository.claimNextForWorker(LEASE_MS),
      repository.claimNextForWorker(LEASE_MS),
    ]);

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first!.id).not.toBe(second!.id);
  });

  it('answers null when nothing is claimable', async () => {
    await expect(repository.claimNextForWorker(LEASE_MS)).resolves.toBeNull();
  });

  it('reclaims a running run whose lease expired, as attempt 2', async () => {
    const runId = await queueRun();
    await repository.claimNextForWorker(LEASE_MS);
    await expireLease(runId);

    const reclaimed = await repository.claimNextForWorker(LEASE_MS);

    expect(reclaimed).toMatchObject({ id: runId, attempts: 2 });
  });

  it('fails a run abandoned at attempt 3 with CRAWL_ABANDONED, and never claims it', async () => {
    const runId = await queueRun();
    for (let attempt = 0; attempt < 3; attempt++) {
      await repository.claimNextForWorker(LEASE_MS);
      await expireLease(runId);
    }

    await expect(repository.claimNextForWorker(LEASE_MS)).resolves.toBeNull();
    await repository.failAbandonedForWorker();

    expect(await runRow(runId)).toMatchObject({
      status: 'failed',
      errorCode: 'CRAWL_ABANDONED',
      lockedUntil: null,
    });
    expect((await runRow(runId)).finishedAt).not.toBeNull();
  });

  it('renewLease with a stale attempt updates nothing', async () => {
    const runId = await queueRun();
    await repository.claimNextForWorker(LEASE_MS);
    await expireLease(runId);
    await repository.claimNextForWorker(LEASE_MS); // attempt 2 owns it now

    await expect(
      repository.renewLeaseForWorker(runId, 1, LEASE_MS),
    ).resolves.toBe(false);
    await expect(
      repository.renewLeaseForWorker(runId, 2, LEASE_MS),
    ).resolves.toBe(true);
  });

  it('a stale attempt cannot lock the run for finalize', async () => {
    const runId = await queueRun();
    await repository.claimNextForWorker(LEASE_MS);
    await expireLease(runId);
    await repository.claimNextForWorker(LEASE_MS);

    const stale = await testDb.db.transaction((tx) =>
      repository.lockForFinalizeForWorker(tx, runId, 1),
    );
    const current = await testDb.db.transaction((tx) =>
      repository.lockForFinalizeForWorker(tx, runId, 2),
    );

    expect(stale).toBe(false);
    expect(current).toBe(true);
  });

  it('finalize records the outcome and releases the lease', async () => {
    const runId = await queueRun();
    await repository.claimNextForWorker(LEASE_MS);

    await testDb.db.transaction((tx) =>
      repository.finalizeForWorker(tx, runId, {
        status: 'partial',
        pagesDone: 9,
        errorCode: null,
        errorMessage: null,
      }),
    );

    expect(await runRow(runId)).toMatchObject({
      status: 'partial',
      pagesDone: 9,
      lockedUntil: null,
    });
  });
});
