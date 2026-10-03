import { Test, type TestingModule } from '@nestjs/testing';
import { and, eq, sql } from 'drizzle-orm';
import { setTimeout as delay } from 'node:timers/promises';
import { FixtureHttpTransport } from '@infrastructure/remote-api/_testing/fixture-http-transport';
import { HTTP_TRANSPORT } from '@infrastructure/remote-api/http-transport/http-transport.interface';
import { ClientCrawlRunsService } from '@modules/clients/services/client-crawl-runs/client-crawl-runs.service';
import { CrawlWorker } from '@modules/crawl/workers/crawl-worker/crawl-worker';
import { clients } from '@persistence/schema/tables/clients/clients.schema';
import { crawlRuns } from '@persistence/schema/tables/crawl-runs/crawl-runs.schema';
import { pages } from '@persistence/schema/tables/pages/pages.schema';
import { rankSnapshots } from '@persistence/schema/tables/rank-snapshots/rank-snapshots.schema';
import { users } from '@persistence/schema/tables/users/users.schema';
import { createTestDatabase } from '../../../test/support/test-database';
import { SeedModule } from '../seed.module';
import { SeedFailedError } from './seed-failed.error';
import { SeedRunner } from './seed-runner.service';

jest.setTimeout(180_000);

const testDb = createTestDatabase();
const PASSWORD = 'seed-test-password';

describe('SeedRunner (postgres, recorded sites)', () => {
  let moduleRef: TestingModule;
  let transport: FixtureHttpTransport;
  const seed = (positionsOnly = false) =>
    moduleRef.get(SeedRunner).run({ password: PASSWORD, positionsOnly });

  beforeAll(async () => {
    await testDb.reset();
    transport = new FixtureHttpTransport();
    moduleRef = await Test.createTestingModule({ imports: [SeedModule] })
      .overrideProvider(HTTP_TRANSPORT)
      .useValue(transport)
      .compile();
    await moduleRef.init();
    await moduleRef.get(CrawlWorker).start();
  });

  afterAll(async () => {
    await moduleRef.close();
    await testDb.close();
  });

  it('first run: two users, two clients crawled by seed runs, ≥ 50 000 noon snapshots', async () => {
    const report = await seed();

    expect(report.crawls.map(({ client, status }) => [client, status])).toEqual(
      [
        ['Semrush', 'succeeded'],
        ['Yoast', 'succeeded'],
      ],
    );
    expect(await testDb.db.$count(users)).toBe(2);
    expect(await testDb.db.$count(clients)).toBe(2);
    expect(
      await testDb.db.$count(crawlRuns, eq(crawlRuns.trigger, 'seed')),
    ).toBe(2);
    expect(report.positions.total).toBeGreaterThanOrEqual(50_000);
    expect(
      await testDb.db.$count(
        rankSnapshots,
        sql`extract(hour from ${rankSnapshots.capturedAt} at time zone 'UTC') <> 12 or ${rankSnapshots.capturedAt} > now()`,
      ),
    ).toBe(0);
  });

  it('a second run on the same day adds no rows and crawls nothing', async () => {
    const report = await seed();

    expect(report.positions.rowsAdded).toBe(0);
    expect(report.crawls.every((crawl) => crawl.status === 'skipped')).toBe(
      true,
    );
    expect(await testDb.db.$count(crawlRuns)).toBe(2);
  });

  it('a client added through the UI gets a full history on the next run', async () => {
    const runs = moduleRef.get(ClientCrawlRunsService);
    const [owner] = await testDb.db.select().from(users).limit(1);
    const client = await runs.upsertClientForWorker({
      userId: owner.id,
      name: 'Root blog',
      websiteUrl: 'https://root-blog-no-feed.example',
    });
    const runId = await runs.enqueueForWorker(client.id, 'user');
    for (let i = 0; i < 60; i += 1) {
      const run = await runs.getRunStatusForWorker(runId);
      if (run?.status !== 'queued' && run?.status !== 'running') break;
      await delay(500);
    }

    const report = await seed();

    const [{ rows, pairs }] = await testDb.db
      .select({
        rows: sql<number>`count(*)::int`,
        pairs: sql<number>`count(distinct (${rankSnapshots.pageId}, ${rankSnapshots.keywordId}))::int`,
      })
      .from(rankSnapshots)
      .innerJoin(pages, eq(pages.id, rankSnapshots.pageId))
      .where(eq(pages.clientId, client.id));
    expect(pairs).toBeGreaterThan(0);
    expect(rows).toBe(pairs * report.positions.days);
  });

  it('--positions-only creates no crawl run and no account', async () => {
    const before = await testDb.db.$count(crawlRuns);

    await seed(true);

    expect(await testDb.db.$count(crawlRuns)).toBe(before);
    expect(await testDb.db.$count(users)).toBe(2);
  });

  it('a failed crawl makes the seed fail with its error code', async () => {
    await testDb.reset();
    const missing = { status: 404 } as const;
    transport.override('https://yoast.com/robots.txt', missing);
    transport.override('https://yoast.com/sitemap_index.xml', missing);

    await expect(seed()).rejects.toThrow(
      new SeedFailedError('The crawl of Yoast failed (SITEMAP_NOT_FOUND).'),
    );
    expect(
      await testDb.db.$count(
        crawlRuns,
        and(eq(crawlRuns.trigger, 'seed'), eq(crawlRuns.status, 'failed')),
      ),
    ).toBe(1);
  });
});
