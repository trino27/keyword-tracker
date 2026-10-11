import { eq } from 'drizzle-orm';
import { seoIssues } from '@persistence/schema/tables/seo-issues/seo-issues.schema';
import { seedCurrentPage } from '../../../../../test/support/seed-page';
import { seedTestUser } from '../../../../../test/support/sign-in';
import { createTestDatabase } from '../../../../../test/support/test-database';
import { SeoIssuesRepository } from './seo-issues.repository';

const testDb = createTestDatabase();
const repository = new SeoIssuesRepository(testDb.db);

async function pageWithBothKinds(): Promise<number> {
  const user = await seedTestUser(testDb, 'owner@example.com');
  const { pageId } = await seedCurrentPage(testDb, user.id);
  await testDb.db.insert(seoIssues).values([
    { pageId, code: 'LANG_MISSING', severity: 'notice', details: {} },
    {
      pageId,
      code: 'CWV_LCP_POOR',
      severity: 'warning',
      details: { value: 5200, max: 4000, source: 'url' },
    },
  ]);
  return pageId;
}

const codesOf = async (pageId: number) =>
  (
    await testDb.db
      .select({ code: seoIssues.code })
      .from(seoIssues)
      .where(eq(seoIssues.pageId, pageId))
  )
    .map(({ code }) => code)
    .sort();

describe('SeoIssuesRepository', () => {
  beforeEach(() => testDb.reset());
  afterAll(() => testDb.close());

  /**
   * The crawl's replace runs minutes before a measurement lands and again on every
   * re-crawl; if it took every code of the page, a speed finding would vanish until the
   * next measurement — up to a day later.
   */
  it("a crawl's replace leaves the page's speed findings", async () => {
    const pageId = await pageWithBothKinds();

    await testDb.db.transaction((tx) =>
      repository.replaceCrawlFindingsForWorker(tx, [pageId], []),
    );

    expect(await codesOf(pageId)).toEqual(['CWV_LCP_POOR']);
  });

  it("a crawl's replace writes its own findings in place of the old ones", async () => {
    const pageId = await pageWithBothKinds();

    await testDb.db.transaction((tx) =>
      repository.replaceCrawlFindingsForWorker(
        tx,
        [pageId],
        [{ pageId, code: 'H1_MISSING', severity: 'error', details: {} }],
      ),
    );

    expect(await codesOf(pageId)).toEqual(['CWV_LCP_POOR', 'H1_MISSING']);
  });

  it("a speed replace leaves the page's crawl findings", async () => {
    const pageId = await pageWithBothKinds();

    await testDb.db.transaction((tx) =>
      repository.replacePageSpeedFindingsForWorker(tx, pageId, [
        {
          pageId,
          code: 'CWV_CLS_NEEDS_IMPROVEMENT',
          severity: 'notice',
          details: { value: 0.18, max: 0.1, source: 'lab' },
        },
      ]),
    );

    expect(await codesOf(pageId)).toEqual([
      'CWV_CLS_NEEDS_IMPROVEMENT',
      'LANG_MISSING',
    ]);
  });

  /**
   * Lighthouse is a third writer: its replace runs in the same transaction as the speed
   * one, and must take neither the crawl's findings nor the Core Web Vitals'. A crawl and
   * a Lighthouse finding on the same fact are both kept (D11).
   */
  it("a Lighthouse replace leaves the page's crawl and speed findings, and is left by theirs", async () => {
    const pageId = await pageWithBothKinds();
    await testDb.db.insert(seoIssues).values({
      pageId,
      code: 'LH_HTML_HAS_LANG',
      severity: 'warning',
      details: {},
    });

    await testDb.db.transaction((tx) =>
      repository.replaceLighthouseFindingsForWorker(tx, pageId, [
        { pageId, code: 'LH_COLOR_CONTRAST', severity: 'warning', details: {} },
      ]),
    );
    expect(await codesOf(pageId)).toEqual([
      'CWV_LCP_POOR',
      'LANG_MISSING',
      'LH_COLOR_CONTRAST',
    ]);

    await testDb.db.transaction(async (tx) => {
      await repository.replaceCrawlFindingsForWorker(tx, [pageId], []);
      await repository.replacePageSpeedFindingsForWorker(tx, pageId, []);
    });
    expect(await codesOf(pageId)).toEqual(['LH_COLOR_CONTRAST']);
  });

  /** D20: an answer without the categories passes no findings, and clears the old ones. */
  it('an empty Lighthouse replace clears the earlier Lighthouse findings', async () => {
    const pageId = await pageWithBothKinds();
    await testDb.db.insert(seoIssues).values({
      pageId,
      code: 'LH_COLOR_CONTRAST',
      severity: 'warning',
      details: {},
    });

    await testDb.db.transaction((tx) =>
      repository.replaceLighthouseFindingsForWorker(tx, pageId, []),
    );

    expect(await codesOf(pageId)).toEqual(['CWV_LCP_POOR', 'LANG_MISSING']);
  });
});
