import { and, eq, sql } from 'drizzle-orm';
import { pageSpeed } from '@persistence/schema/tables/page-speed/page-speed.schema';
import { pages } from '@persistence/schema/tables/pages/pages.schema';
import { expectPgError } from '../../../../../test/support/expect-pg-error';
import { seedCurrentPage } from '../../../../../test/support/seed-page';
import { seedTestUser } from '../../../../../test/support/sign-in';
import type { TPsiStrategy } from '@app/contracts';
import { createTestDatabase } from '../../../../../test/support/test-database';
import type { IPageSpeedMeasurementWrite } from '../../interfaces/page-speed.interface';
import { PageSpeedRepository } from './page-speed.repository';

const testDb = createTestDatabase();
const repository = new PageSpeedRepository(testDb.db);
const LEASE_MS = 180_000;
const DAY_MS = 24 * 60 * 60 * 1000;

const MEASUREMENT: IPageSpeedMeasurementWrite = {
  lcpMs: 3100,
  lcpSource: 'url',
  inpMs: 180,
  inpSource: 'origin',
  cls: 0.02,
  clsSource: 'url',
  performanceScore: 72,
  measuredAt: new Date('2026-10-01T12:00:00Z'),
  ttfbMs: null,
  ttfbSource: null,
  lcpGoodShare: null,
  lcpPoorShare: null,
  inpGoodShare: null,
  inpPoorShare: null,
  clsGoodShare: null,
  clsPoorShare: null,
  ttfbGoodShare: null,
  ttfbPoorShare: null,
  lcpBreakdown: null,
  lighthouseJudged: null,
  lighthouseNotApplicable: null,
  lighthouseFailed: null,
  seoScore: null,
  accessibilityScore: null,
};

let userId: number;

async function currentPage(clientId?: number) {
  return seedCurrentPage(testDb, userId, ['seo audit'], clientId);
}

const rowOf = async (pageId: number, strategy: TPsiStrategy = 'mobile') => {
  const [row] = await testDb.db
    .select()
    .from(pageSpeed)
    .where(and(eq(pageSpeed.pageId, pageId), eq(pageSpeed.strategy, strategy)));
  return row;
};

const measurementOf = async (pageId: number) => {
  const row = await rowOf(pageId);
  return {
    lcpMs: row.lcpMs,
    lcpSource: row.lcpSource,
    inpMs: row.inpMs,
    inpSource: row.inpSource,
    cls: row.cls,
    clsSource: row.clsSource,
    performanceScore: row.performanceScore,
    measuredAt: row.measuredAt,
  };
};

const enqueue = (
  pageIds: number[],
  staleBefore = new Date(Date.now() - DAY_MS),
  strategies: readonly TPsiStrategy[] = ['mobile'],
) =>
  testDb.db.transaction((tx) =>
    repository.enqueueForWorker(tx, pageIds, strategies, staleBefore),
  );

/** A row as a past measurement left it: done, with the given figures and time. */
async function measured(
  pageId: number,
  measuredAt: Date,
  strategy: TPsiStrategy = 'mobile',
) {
  await testDb.db
    .insert(pageSpeed)
    .values({ pageId, strategy, status: 'done', ...MEASUREMENT, measuredAt });
}

/** A new client of `ownerId` whose latest run holds `count` current pages, oldest first. */
async function clientWithPages(ownerId: number, count: number) {
  const first = await seedCurrentPage(testDb, ownerId);
  const pageIds = [first.pageId];
  for (let i = 1; i < count; i += 1)
    pageIds.push(
      (await seedCurrentPage(testDb, ownerId, [], first.clientId)).pageId,
    );
  // Each seeded page brought its own run; make the newest run hold all of them.
  const latest = await seedCurrentPage(testDb, ownerId, [], first.clientId);
  await testDb.db
    .update(pages)
    .set({ lastSeenRunId: latest.runId })
    .where(eq(pages.clientId, first.clientId));
  await testDb.db.delete(pages).where(eq(pages.id, latest.pageId));
  return pageIds;
}

/** The page ids of the next `count` claims, one after another. */
async function claimOrder(count: number) {
  const order: number[] = [];
  for (let i = 0; i < count; i += 1)
    order.push((await repository.claimNextForWorker(LEASE_MS))!.pageId);
  return order;
}

/** The (page, strategy) of the next `count` claims, one after another. */
async function claimRows(count: number) {
  const order: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const claim = (await repository.claimNextForWorker(LEASE_MS))!;
    order.push(`${claim.pageId}:${claim.strategy}`);
  }
  return order;
}

async function claimOwn(pageId: number) {
  const claimed = await repository.claimNextForWorker(LEASE_MS);
  expect(claimed?.pageId).toBe(pageId);
  return claimed!;
}

describe('PageSpeedRepository', () => {
  beforeEach(async () => {
    await testDb.reset();
    userId = (await seedTestUser(testDb, 'owner@example.com')).id;
  });
  afterAll(() => testDb.close());

  describe('the table refuses what cannot be true', () => {
    it.each([
      [
        'a half measurement',
        'page_speed_measurement_whole',
        { status: 'queued' as const, lcpMs: 3100, lcpSource: 'url' as const },
      ],
      [
        'a lab INP',
        'page_speed_inp_field_only',
        {
          status: 'done' as const,
          ...MEASUREMENT,
          inpSource: 'lab' as const,
        },
      ],
      [
        'an INP without its source',
        'page_speed_inp_pair',
        { status: 'done' as const, ...MEASUREMENT, inpSource: null },
      ],
      [
        'a running row without a lease',
        'page_speed_running_is_leased',
        { status: 'running' as const },
      ],
      [
        'a failed row that does not say why',
        'page_speed_failed_says_why',
        { status: 'failed' as const },
      ],
      [
        'a done row with no measurement',
        'page_speed_done_is_measured',
        { status: 'done' as const },
      ],
      [
        'attempts 6',
        'page_speed_attempts_range',
        { status: 'queued' as const, attempts: 6 },
      ],
      [
        'a negative LCP',
        'page_speed_values_range',
        { status: 'done' as const, ...MEASUREMENT, lcpMs: -1 },
      ],
      [
        'a performance score over 100',
        'page_speed_values_range',
        { status: 'done' as const, ...MEASUREMENT, performanceScore: 101 },
      ],
      [
        'Lighthouse lists set one without the other',
        'page_speed_lighthouse_sets_together',
        {
          status: 'done' as const,
          ...MEASUREMENT,
          lighthouseJudged: ['LH_CANONICAL'],
          lighthouseFailed: 0,
        },
      ],
      [
        'a code in both Lighthouse lists',
        'page_speed_lighthouse_sets_disjoint',
        {
          status: 'done' as const,
          ...MEASUREMENT,
          lighthouseJudged: ['LH_CANONICAL'],
          lighthouseNotApplicable: ['LH_CANONICAL'],
          lighthouseFailed: 0,
        },
      ],
      [
        'a duplicate in the judged list',
        'page_speed_lighthouse_judged_clean',
        {
          status: 'done' as const,
          ...MEASUREMENT,
          lighthouseJudged: ['LH_CANONICAL', 'LH_CANONICAL'],
          lighthouseNotApplicable: [],
          lighthouseFailed: 0,
        },
      ],
      [
        'a failed count above the judged list',
        'page_speed_lighthouse_failed_range',
        {
          status: 'done' as const,
          ...MEASUREMENT,
          lighthouseJudged: ['LH_CANONICAL'],
          lighthouseNotApplicable: [],
          lighthouseFailed: 2,
        },
      ],
      [
        'Lighthouse verdicts without a measurement',
        'page_speed_extras_need_measurement',
        {
          status: 'queued' as const,
          lighthouseJudged: [],
          lighthouseNotApplicable: [],
          lighthouseFailed: 0,
        },
      ],
      [
        'an SEO score over 100',
        'page_speed_category_scores_range',
        { status: 'done' as const, ...MEASUREMENT, seoScore: 101 },
      ],
      [
        'a TTFB without its source',
        'page_speed_ttfb_pair',
        { status: 'done' as const, ...MEASUREMENT, ttfbMs: 620 },
      ],
      [
        'a lab TTFB',
        'page_speed_ttfb_field_only',
        {
          status: 'done' as const,
          ...MEASUREMENT,
          ttfbMs: 620,
          ttfbSource: 'lab' as const,
        },
      ],
      [
        'shares that add up to more than every visit',
        'page_speed_shares_range',
        {
          status: 'done' as const,
          ...MEASUREMENT,
          lcpGoodShare: 0.7,
          lcpPoorShare: 0.4,
        },
      ],
      [
        'a good share without its poor share',
        'page_speed_shares_range',
        { status: 'done' as const, ...MEASUREMENT, clsGoodShare: 0.9 },
      ],
      [
        'shares on a lab metric',
        'page_speed_shares_field_only',
        {
          status: 'done' as const,
          ...MEASUREMENT,
          lcpSource: 'lab' as const,
          lcpGoodShare: 0.6,
          lcpPoorShare: 0.1,
        },
      ],
      [
        'shares on an absent TTFB',
        'page_speed_shares_field_only',
        {
          status: 'done' as const,
          ...MEASUREMENT,
          ttfbGoodShare: 0.8,
          ttfbPoorShare: 0.06,
        },
      ],
    ])('refuses %s (%s)', async (_, constraint, values) => {
      const { pageId } = await currentPage();

      await expectPgError(
        testDb.db
          .insert(pageSpeed)
          .values({ pageId, strategy: 'mobile', ...values }),
        { code: '23514', constraint },
      );
    });

    /**
     * Shares of 0.8011 and 0.1989 with nothing in between sum to 1 only up to `real`'s
     * precision; the bound tolerates that rather than refusing Google's own figures.
     */
    it('accepts a whole measurement with every new part, and one without any', async () => {
      const { pageId: full } = await currentPage();
      const { pageId: bare } = await currentPage();

      await testDb.db.insert(pageSpeed).values([
        {
          pageId: full,
          strategy: 'mobile' as const,
          status: 'done' as const,
          ...MEASUREMENT,
          lighthouseJudged: ['LH_CANONICAL', 'LH_ROBOTS_TXT'],
          lighthouseNotApplicable: ['LH_HREFLANG'],
          lighthouseFailed: 1,
          seoScore: 92,
          accessibilityScore: 94,
          ttfbMs: 652,
          ttfbSource: 'url' as const,
          lcpGoodShare: 0.68,
          lcpPoorShare: 0.11,
          inpGoodShare: 0.9,
          inpPoorShare: 0.02,
          clsGoodShare: 0.95,
          clsPoorShare: 0.01,
          ttfbGoodShare: 0.8011,
          ttfbPoorShare: 0.1989,
          lcpBreakdown: {
            element: { selector: 'main img', snippet: '<img alt="">' },
            phases: [{ phase: 'timeToFirstByte' as const, ms: 6 }],
          },
        },
        {
          pageId: bare,
          strategy: 'mobile' as const,
          status: 'done' as const,
          ...MEASUREMENT,
        },
      ]);

      expect((await rowOf(full)).lighthouseFailed).toBe(1);
      expect((await rowOf(bare)).lighthouseJudged).toBeNull();
    });

    it('holds one row per page and strategy', async () => {
      const { pageId } = await currentPage();
      await testDb.db.insert(pageSpeed).values([
        { pageId, strategy: 'mobile' },
        { pageId, strategy: 'desktop' },
      ]);

      await expectPgError(
        testDb.db.insert(pageSpeed).values({ pageId, strategy: 'desktop' }),
        { code: '23505', constraint: 'page_speed_pk' },
      );
    });

    it('refuses a row without a strategy', async () => {
      const { pageId } = await currentPage();

      await expectPgError(
        testDb.db.execute(
          sql`insert into page_speed (page_id) values (${pageId})`,
        ),
        { code: '23502', column: 'strategy' },
      );
    });

    it.each([
      [
        'a judged list',
        {
          lighthouseJudged: [],
          lighthouseNotApplicable: [],
          lighthouseFailed: 0,
        },
      ],
      ['an SEO score', { seoScore: 90 }],
      ['an accessibility score', { accessibilityScore: 90 }],
    ])('refuses a desktop row with %s', async (_, lighthouse) => {
      const { pageId } = await currentPage();

      await expectPgError(
        testDb.db.insert(pageSpeed).values({
          pageId,
          strategy: 'desktop',
          status: 'done',
          ...MEASUREMENT,
          ...lighthouse,
        }),
        { code: '23514', constraint: 'page_speed_lighthouse_mobile_only' },
      );
    });

    it('deleting a page deletes both rows', async () => {
      const { pageId } = await currentPage();
      await enqueue([pageId], undefined, ['mobile', 'desktop']);

      await testDb.db.delete(pages).where(eq(pages.id, pageId));

      expect(await rowOf(pageId, 'mobile')).toBeUndefined();
      expect(await rowOf(pageId, 'desktop')).toBeUndefined();
    });
  });

  describe('enqueueForWorker', () => {
    it('queues a page that has no row', async () => {
      const { pageId } = await currentPage();

      expect(await enqueue([pageId])).toBe(1);
      expect(await rowOf(pageId)).toMatchObject({
        status: 'queued',
        attempts: 0,
        measuredAt: null,
      });
    });

    it('re-queues a measurement exactly 24 h old, not one 1 s younger', async () => {
      const staleBefore = new Date('2026-10-09T12:00:00Z');
      const old = await currentPage();
      const fresh = await currentPage();
      await measured(old.pageId, staleBefore);
      await measured(fresh.pageId, new Date(staleBefore.getTime() + 1_000));

      await enqueue([old.pageId, fresh.pageId], staleBefore);

      expect((await rowOf(old.pageId)).status).toBe('queued');
      expect((await rowOf(fresh.pageId)).status).toBe('done');
    });

    it('re-queues a failed row with its attempts reset', async () => {
      const { pageId } = await currentPage();
      await testDb.db.insert(pageSpeed).values({
        pageId,
        strategy: 'mobile',
        status: 'failed',
        attempts: 5,
        lastError: 'PSI_UNAVAILABLE',
      });

      await enqueue([pageId]);

      expect(await rowOf(pageId)).toMatchObject({
        status: 'queued',
        attempts: 0,
        lastError: null,
      });
    });

    it('leaves a queued or running row alone', async () => {
      const queued = await currentPage();
      const running = await currentPage();
      await testDb.db.insert(pageSpeed).values([
        {
          pageId: queued.pageId,
          strategy: 'mobile',
          status: 'queued',
          attempts: 2,
        },
        {
          pageId: running.pageId,
          strategy: 'mobile',
          status: 'running',
          attempts: 1,
          lockedUntil: new Date(Date.now() + LEASE_MS),
        },
      ]);

      expect(await enqueue([queued.pageId, running.pageId])).toBe(0);
      expect(await rowOf(queued.pageId)).toMatchObject({ attempts: 2 });
      expect(await rowOf(running.pageId)).toMatchObject({
        status: 'running',
        attempts: 1,
      });
    });

    it('enqueue with both strategies queues both rows of a new page', async () => {
      const { pageId } = await currentPage();

      expect(await enqueue([pageId], undefined, ['mobile', 'desktop'])).toBe(2);
      expect((await rowOf(pageId, 'mobile')).status).toBe('queued');
      expect((await rowOf(pageId, 'desktop')).status).toBe('queued');
    });

    it('re-queues a strategy measured exactly 24 h ago and leaves the other', async () => {
      const staleBefore = new Date('2026-10-09T12:00:00Z');
      const { pageId } = await currentPage();
      await measured(pageId, staleBefore, 'desktop');
      await measured(pageId, new Date(staleBefore.getTime() + 1_000), 'mobile');

      expect(await enqueue([pageId], staleBefore, ['mobile', 'desktop'])).toBe(
        1,
      );
      expect((await rowOf(pageId, 'desktop')).status).toBe('queued');
      expect((await rowOf(pageId, 'mobile')).status).toBe('done');
    });

    it('keeps the measurement when re-queued', async () => {
      const { pageId } = await currentPage();
      await measured(pageId, new Date(Date.now() - 2 * DAY_MS));
      const before = await measurementOf(pageId);

      await enqueue([pageId]);

      expect((await rowOf(pageId)).status).toBe('queued');
      expect(await measurementOf(pageId)).toEqual(before);
    });
  });

  describe('claimNextForWorker', () => {
    it("claims a due row with the page's final URL as attempt 1", async () => {
      const { pageId } = await currentPage();
      await enqueue([pageId]);
      const [page] = await testDb.db
        .select({ finalUrl: pages.finalUrl })
        .from(pages)
        .where(eq(pages.id, pageId));

      expect(await repository.claimNextForWorker(LEASE_MS)).toEqual({
        pageId,
        strategy: 'mobile',
        attempt: 1,
        url: page.finalUrl,
      });
      expect(await rowOf(pageId)).toMatchObject({ status: 'running' });
    });

    it('does not claim a row before its not-before time', async () => {
      const { pageId } = await currentPage();
      await testDb.db.insert(pageSpeed).values({
        pageId,
        strategy: 'mobile',
        nextAttemptAt: new Date(Date.now() + 60_000),
      });

      expect(await repository.claimNextForWorker(LEASE_MS)).toBeNull();
    });

    it('two concurrent claims take two different rows (SKIP LOCKED)', async () => {
      const a = await currentPage();
      const b = await currentPage();
      await enqueue([a.pageId, b.pageId]);

      const claims = await Promise.all([
        repository.claimNextForWorker(LEASE_MS),
        repository.claimNextForWorker(LEASE_MS),
      ]);

      expect(claims.map((claim) => claim?.pageId).sort()).toEqual(
        [a.pageId, b.pageId].sort(),
      );
    });

    it("never claims a page its client's current run no longer has", async () => {
      const dropped = await currentPage();
      await enqueue([dropped.pageId]);
      // A newer run of the same client that did not find the page again.
      await currentPage(dropped.clientId);

      expect(await repository.claimNextForWorker(LEASE_MS)).toBeNull();
    });

    it("a client queued later takes turns with another client's backlog", async () => {
      const backlog = await clientWithPages(userId, 3);
      await enqueue(backlog);
      const [late] = await clientWithPages(userId, 1);
      await enqueue([late]);

      expect(await claimOrder(4)).toEqual([
        backlog[0],
        late,
        backlog[1],
        backlog[2],
      ]);
    });

    it('a user with many clients does not stand in front of another user', async () => {
      const busy = [
        ...(await clientWithPages(userId, 1)),
        ...(await clientWithPages(userId, 1)),
        ...(await clientWithPages(userId, 1)),
      ];
      await enqueue(busy);
      const other = (await seedTestUser(testDb, 'other@example.com')).id;
      const [late] = await clientWithPages(other, 1);
      await enqueue([late]);

      expect(await claimOrder(4)).toEqual([busy[0], late, busy[1], busy[2]]);
    });

    it('a user measured recently waits behind one not served yet', async () => {
      const [done] = await clientWithPages(userId, 1);
      await measured(done, new Date());
      const [mine] = await clientWithPages(userId, 1);
      await enqueue([mine]);
      const other = (await seedTestUser(testDb, 'other@example.com')).id;
      const [theirs] = await clientWithPages(other, 1);
      await enqueue([theirs]);

      expect(await claimOrder(2)).toEqual([theirs, mine]);
    });

    it('claims a desktop row with its strategy', async () => {
      const { pageId } = await currentPage();
      await testDb.db.insert(pageSpeed).values({ pageId, strategy: 'desktop' });

      expect(await repository.claimNextForWorker(LEASE_MS)).toMatchObject({
        pageId,
        strategy: 'desktop',
        attempt: 1,
      });
      expect((await rowOf(pageId, 'desktop')).status).toBe('running');
    });

    it("a claim of a client's desktop row serves the client", async () => {
      const [served] = await clientWithPages(userId, 1);
      await testDb.db.insert(pageSpeed).values({
        pageId: served,
        strategy: 'desktop',
        status: 'done',
        ...MEASUREMENT,
        measuredAt: new Date(),
      });
      const [mine] = await clientWithPages(userId, 1);
      await enqueue([served, mine]);

      // The client whose desktop row was claimed has been served; the other has not.
      expect(await claimOrder(2)).toEqual([mine, served]);
    });

    it('within one client, due mobile rows are claimed before its desktop rows', async () => {
      const [first, second] = await clientWithPages(userId, 2);
      await enqueue([first, second], undefined, ['mobile', 'desktop']);

      expect(await claimRows(4)).toEqual([
        `${first}:mobile`,
        `${second}:mobile`,
        `${first}:desktop`,
        `${second}:desktop`,
      ]);
    });

    it('reclaims a running row whose lease expired, as the next attempt', async () => {
      const { pageId } = await currentPage();
      await testDb.db.insert(pageSpeed).values({
        pageId,
        strategy: 'mobile',
        status: 'running',
        attempts: 2,
        lockedUntil: new Date(Date.now() - 1_000),
      });

      expect((await repository.claimNextForWorker(LEASE_MS))?.attempt).toBe(3);
    });
  });

  describe('the fence and the measurement', () => {
    it('writes a completion and marks the row done', async () => {
      const { pageId } = await currentPage();
      await enqueue([pageId]);
      const { attempt } = await claimOwn(pageId);

      const written = await testDb.db.transaction((tx) =>
        repository.completeForWorker(
          tx,
          pageId,
          'mobile',
          attempt,
          MEASUREMENT,
        ),
      );

      expect(written).toBe(true);
      expect(await rowOf(pageId)).toMatchObject({
        status: 'done',
        lockedUntil: null,
        lastError: null,
        lcpMs: 3100,
      });
    });

    it("a stale attempt's completion and failure write nothing", async () => {
      const { pageId } = await currentPage();
      await enqueue([pageId]);
      const { attempt } = await claimOwn(pageId);
      // The lease expired and another slot took the row as the next attempt.
      await testDb.db
        .update(pageSpeed)
        .set({ attempts: attempt + 1 })
        .where(eq(pageSpeed.pageId, pageId));

      const completed = await testDb.db.transaction((tx) =>
        repository.completeForWorker(
          tx,
          pageId,
          'mobile',
          attempt,
          MEASUREMENT,
        ),
      );
      const failed = await repository.recordFailureForWorker(
        pageId,
        'mobile',
        attempt,
        {
          status: 'failed',
          lastError: 'PSI_REJECTED',
        },
      );

      expect([completed, failed]).toEqual([false, false]);
      expect(await rowOf(pageId)).toMatchObject({
        status: 'running',
        measuredAt: null,
        lastError: null,
      });
    });

    it('a failure, a release and an abandonment leave the measurement byte-for-byte', async () => {
      const { pageId } = await currentPage();
      await measured(pageId, new Date(Date.now() - 2 * DAY_MS));
      const before = await measurementOf(pageId);
      await enqueue([pageId]);

      let claim = await claimOwn(pageId);
      await repository.recordFailureForWorker(pageId, 'mobile', claim.attempt, {
        status: 'queued',
        nextAttemptAt: new Date(Date.now() - 1),
        lastError: 'PSI_UNAVAILABLE',
      });
      expect(await measurementOf(pageId)).toEqual(before);

      claim = await claimOwn(pageId);
      await repository.releaseForWorker(
        pageId,
        'mobile',
        claim.attempt,
        new Date(),
      );
      expect(await measurementOf(pageId)).toEqual(before);

      await testDb.db
        .update(pageSpeed)
        .set({
          status: 'running',
          attempts: 5,
          lockedUntil: new Date(Date.now() - 1_000),
        })
        .where(eq(pageSpeed.pageId, pageId));
      await repository.failAbandonedForWorker();
      expect(await measurementOf(pageId)).toEqual(before);
    });

    it('a stale attempt on the desktop row writes nothing to the mobile row of the same page and attempt number', async () => {
      const { pageId } = await currentPage();
      await testDb.db.insert(pageSpeed).values([
        {
          pageId,
          strategy: 'mobile',
          status: 'running',
          attempts: 1,
          lockedUntil: new Date(Date.now() + LEASE_MS),
        },
        { pageId, strategy: 'desktop', status: 'queued', attempts: 0 },
      ]);

      const completed = await testDb.db.transaction((tx) =>
        repository.completeForWorker(tx, pageId, 'desktop', 1, MEASUREMENT),
      );
      const released = await repository.releaseForWorker(
        pageId,
        'desktop',
        1,
        new Date(),
      );

      expect([completed, released]).toEqual([false, false]);
      expect(await rowOf(pageId, 'mobile')).toMatchObject({
        status: 'running',
        attempts: 1,
        measuredAt: null,
      });
      expect(await rowOf(pageId, 'desktop')).toMatchObject({
        status: 'queued',
        attempts: 0,
      });
    });

    it('a release gives back the attempt', async () => {
      const { pageId } = await currentPage();
      await enqueue([pageId]);
      const { attempt } = await claimOwn(pageId);
      const notBefore = new Date(Date.now() + 120_000);

      await repository.releaseForWorker(pageId, 'mobile', attempt, notBefore);

      expect(await rowOf(pageId)).toMatchObject({
        status: 'queued',
        attempts: attempt - 1,
        lockedUntil: null,
        nextAttemptAt: notBefore,
      });
    });

    it('fails a row abandoned at attempt 5 with ABANDONED, and never claims it', async () => {
      const { pageId } = await currentPage();
      await testDb.db.insert(pageSpeed).values({
        pageId,
        strategy: 'mobile',
        status: 'running',
        attempts: 5,
        lockedUntil: new Date(Date.now() - 1_000),
      });

      expect(await repository.claimNextForWorker(LEASE_MS)).toBeNull();
      expect(await repository.failAbandonedForWorker()).toBe(1);
      expect(await rowOf(pageId)).toMatchObject({
        status: 'failed',
        lastError: 'ABANDONED',
        lockedUntil: null,
      });
    });
  });

  describe('backfillCurrentForWorker', () => {
    it('queues each current page once, and a second run queues none', async () => {
      const dropped = await currentPage();
      const current = await currentPage(dropped.clientId);
      const other = await currentPage();

      expect(await repository.backfillCurrentForWorker(['mobile'])).toBe(2);
      expect(await repository.backfillCurrentForWorker(['mobile'])).toBe(0);
      const rows = await testDb.db
        .select({ pageId: pageSpeed.pageId })
        .from(pageSpeed)
        .orderBy(sql`${pageSpeed.pageId}`);
      expect(rows.map((row) => row.pageId)).toEqual(
        [current.pageId, other.pageId].sort((a, b) => a - b),
      );
    });
  });
});
