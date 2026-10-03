import { SEO_ISSUE_CODES } from '@app/contracts';
import { clients } from '../../src/persistence/schema/tables/clients/clients.schema';
import { crawlRuns } from '../../src/persistence/schema/tables/crawl-runs/crawl-runs.schema';
import { keywords } from '../../src/persistence/schema/tables/keywords/keywords.schema';
import { pageKeywords } from '../../src/persistence/schema/tables/page-keywords/page-keywords.schema';
import { pages } from '../../src/persistence/schema/tables/pages/pages.schema';
import type { ITestDatabase } from './test-database';

let sequence = 0;

/**
 * A client with one succeeded run and one current page carrying the given keywords —
 * written directly, for tests about reading pages rather than crawling them.
 */
export async function seedCurrentPage(
  testDb: ITestDatabase,
  userId: number,
  terms: string[] = ['seo audit'],
  existingClientId?: number,
  /** The page's score, for a test that reads or orders by it. Default: 15 of 18 passed. */
  counters: { checksApplicable: number; checksFailed: number } = {
    checksApplicable: 18,
    checksFailed: 3,
  },
): Promise<{
  clientId: number;
  runId: number;
  pageId: number;
  keywordIds: number[];
}> {
  sequence += 1;
  let clientId = existingClientId;
  if (clientId === undefined) {
    const [client] = await testDb.db
      .insert(clients)
      .values({
        userId,
        name: `Site ${sequence}`,
        websiteUrl: `https://seeded-${sequence}.example`,
        siteKey: `seeded-${sequence}.example`,
      })
      .returning();
    clientId = client.id;
  }
  const now = new Date();
  const [run] = await testDb.db
    .insert(crawlRuns)
    .values({
      clientId,
      trigger: 'seed',
      status: 'succeeded',
      startedAt: now,
      finishedAt: now,
      pagesDone: 1,
    })
    .returning();
  const url = `https://seeded-${sequence}.example/post-${sequence}/`;
  const [page] = await testDb.db
    .insert(pages)
    .values({
      clientId,
      url,
      finalUrl: url,
      title: `Post ${sequence}`,
      wordCount: 800,
      httpStatus: 200,
      responseMs: 120,
      htmlBytes: 40_000,
      sitemapPosition: 0,
      checksApplicable: counters.checksApplicable,
      checksFailed: counters.checksFailed,
      // A current page always carries the record, because only the upsert makes a page
      // current — a directly written fixture has to hold the same line.
      checksJudged: SEO_ISSUE_CODES.slice(0, counters.checksApplicable),
      checksNotApplicable: SEO_ISSUE_CODES.slice(counters.checksApplicable),
      lastSeenRunId: run.id,
      crawledAt: now,
    })
    .returning();
  const keywordIds: number[] = [];
  for (const [i, term] of terms.entries()) {
    const [keyword] = await testDb.db
      .insert(keywords)
      .values({ term })
      .onConflictDoUpdate({ target: keywords.term, set: { term } })
      .returning();
    await testDb.db.insert(pageKeywords).values({
      pageId: page.id,
      keywordId: keyword.id,
      relevance: 1 - i * 0.2,
      lastSeenRunId: run.id,
    });
    keywordIds.push(keyword.id);
  }
  return { clientId, runId: run.id, pageId: page.id, keywordIds };
}
