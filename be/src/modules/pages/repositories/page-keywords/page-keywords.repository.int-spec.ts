import { eq } from 'drizzle-orm';
import { clients } from '@persistence/schema/tables/clients/clients.schema';
import { crawlRuns } from '@persistence/schema/tables/crawl-runs/crawl-runs.schema';
import { keywords } from '@persistence/schema/tables/keywords/keywords.schema';
import { pageKeywords } from '@persistence/schema/tables/page-keywords/page-keywords.schema';
import { pages } from '@persistence/schema/tables/pages/pages.schema';
import { seoIssues } from '@persistence/schema/tables/seo-issues/seo-issues.schema';
import { expectPgError } from '../../../../../test/support/expect-pg-error';
import { seedTestUser } from '../../../../../test/support/sign-in';
import { createTestDatabase } from '../../../../../test/support/test-database';
import { KeywordsRepository } from '../keywords/keywords.repository';
import { SeoIssuesRepository } from '../seo-issues/seo-issues.repository';
import { PageKeywordsRepository } from './page-keywords.repository';

const testDb = createTestDatabase();
const keywordsRepository = new KeywordsRepository(testDb.db);
const pairs = new PageKeywordsRepository(testDb.db);
const issues = new SeoIssuesRepository(testDb.db);

async function seedPage(): Promise<{
  pageId: number;
  firstRunId: number;
  secondRunId: number;
}> {
  const user = await seedTestUser(testDb, 'owner@example.com');
  const [client] = await testDb.db
    .insert(clients)
    .values({
      userId: user.id,
      name: 'Site',
      websiteUrl: 'https://a.example',
      siteKey: 'a.example',
    })
    .returning({ id: clients.id });
  const now = new Date();
  const run = {
    clientId: client.id,
    trigger: 'user' as const,
    status: 'succeeded' as const,
    startedAt: now,
    finishedAt: now,
  };
  const [first] = await testDb.db.insert(crawlRuns).values(run).returning();
  const [second] = await testDb.db.insert(crawlRuns).values(run).returning();
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
      lastSeenRunId: first.id,
      crawledAt: now,
    })
    .returning({ id: pages.id });
  return { pageId: page.id, firstRunId: first.id, secondRunId: second.id };
}

const inTx = <T>(work: Parameters<typeof testDb.db.transaction<T>>[0]) =>
  testDb.db.transaction(work);

describe('keywords, page_keywords and seo_issues (postgres)', () => {
  beforeEach(() => testDb.reset());
  afterAll(() => testDb.close());

  it('an upsert by term returns the existing id', async () => {
    const first = await inTx((tx) =>
      keywordsRepository.upsertTermsForWorker(tx, [
        'seo audit',
        'link building',
      ]),
    );
    const second = await inTx((tx) =>
      keywordsRepository.upsertTermsForWorker(tx, ['seo audit', 'new term']),
    );

    expect(second.get('seo audit')).toBe(first.get('seo audit'));
    expect(second.size).toBe(2);
    expect(await testDb.db.$count(keywords)).toBe(3);
  });

  it('a surviving pair takes the new relevance and run; a dropped one keeps its old run', async () => {
    const { pageId, firstRunId, secondRunId } = await seedPage();
    const ids = await inTx((tx) =>
      keywordsRepository.upsertTermsForWorker(tx, ['kept', 'dropped']),
    );
    await inTx((tx) =>
      pairs.upsertManyForWorker(tx, [
        {
          pageId,
          keywordId: ids.get('kept')!,
          relevance: 1,
          lastSeenRunId: firstRunId,
        },
        {
          pageId,
          keywordId: ids.get('dropped')!,
          relevance: 0.5,
          lastSeenRunId: firstRunId,
        },
      ]),
    );

    await inTx((tx) =>
      pairs.upsertManyForWorker(tx, [
        {
          pageId,
          keywordId: ids.get('kept')!,
          relevance: 0.8,
          lastSeenRunId: secondRunId,
        },
      ]),
    );

    const rows = await testDb.db
      .select()
      .from(pageKeywords)
      .orderBy(pageKeywords.relevance);
    expect(
      rows.map((row) => [row.keywordId, row.relevance, row.lastSeenRunId]),
    ).toEqual([
      [ids.get('dropped'), 0.5, firstRunId],
      [ids.get('kept'), 0.8, secondRunId],
    ]);
  });

  it.each([0, 1.01, -0.1])(
    'refuses relevance %d (page_keywords_relevance_range)',
    async (relevance) => {
      const { pageId, firstRunId } = await seedPage();
      const ids = await inTx((tx) =>
        keywordsRepository.upsertTermsForWorker(tx, ['x']),
      );

      await expectPgError(
        inTx((tx) =>
          pairs.upsertManyForWorker(tx, [
            {
              pageId,
              keywordId: ids.get('x')!,
              relevance,
              lastSeenRunId: firstRunId,
            },
          ]),
        ),
        { code: '23514', constraint: 'page_keywords_relevance_range' },
      );
    },
  );

  it('one issue per (page, code), and a replace swaps the whole set', async () => {
    const { pageId } = await seedPage();
    const issue = {
      pageId,
      code: 'H1_MISSING' as const,
      severity: 'error' as const,
      details: {},
    };

    await expectPgError(
      inTx((tx) =>
        issues.replaceForPagesForWorker(tx, [pageId], [issue, issue]),
      ),
      { code: '23505', constraint: 'seo_issues_page_id_code_uq' },
    );
    await inTx((tx) => issues.replaceForPagesForWorker(tx, [pageId], [issue]));
    await inTx((tx) =>
      issues.replaceForPagesForWorker(
        tx,
        [pageId],
        [
          {
            pageId,
            code: 'THIN_CONTENT',
            severity: 'warning',
            details: { words: 120, min: 300 },
          },
        ],
      ),
    );

    const rows = await testDb.db.select().from(seoIssues);
    expect(rows).toMatchObject([
      { code: 'THIN_CONTENT', details: { words: 120, min: 300 } },
    ]);
  });

  it('deleting a page cascades its pairs and issues, never the shared keyword', async () => {
    const { pageId, firstRunId } = await seedPage();
    const ids = await inTx((tx) =>
      keywordsRepository.upsertTermsForWorker(tx, ['shared']),
    );
    await inTx(async (tx) => {
      await pairs.upsertManyForWorker(tx, [
        {
          pageId,
          keywordId: ids.get('shared')!,
          relevance: 1,
          lastSeenRunId: firstRunId,
        },
      ]);
      await issues.replaceForPagesForWorker(
        tx,
        [pageId],
        [{ pageId, code: 'LANG_MISSING', severity: 'notice', details: {} }],
      );
    });

    await testDb.db.delete(pages).where(eq(pages.id, pageId));

    expect(await testDb.db.$count(pageKeywords)).toBe(0);
    expect(await testDb.db.$count(seoIssues)).toBe(0);
    expect(await testDb.db.$count(keywords)).toBe(1);
  });
});
