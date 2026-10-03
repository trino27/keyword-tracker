import { sql } from 'drizzle-orm';
import type { TCrawlRunStatus } from '@app/contracts';
import { clients } from '@persistence/schema/tables/clients/clients.schema';
import { crawlRuns } from '@persistence/schema/tables/crawl-runs/crawl-runs.schema';
import { keywords } from '@persistence/schema/tables/keywords/keywords.schema';
import { pageKeywords } from '@persistence/schema/tables/page-keywords/page-keywords.schema';
import { pages } from '@persistence/schema/tables/pages/pages.schema';
import { rankSnapshots } from '@persistence/schema/tables/rank-snapshots/rank-snapshots.schema';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import { seedTestUser } from '../../../../../test/support/sign-in';
import { createTestDatabase } from '../../../../../test/support/test-database';
import {
  PageListRepository,
  type IPageListFilter,
} from './page-list.repository';

const testDb = createTestDatabase();
const repository = new PageListRepository(testDb.db);

const scopeOf = (userId: number) =>
  ({ userId, timeZone: 'America/Toronto' }) as IUserScope;

let site = 0;
async function addClient(userId: number, name: string) {
  site += 1;
  const [client] = await testDb.db
    .insert(clients)
    .values({
      userId,
      name,
      websiteUrl: `https://site-${site}.example`,
      siteKey: `site-${site}.example`,
    })
    .returning();
  return client;
}

let minute = 0;
async function addRun(clientId: number, status: TCrawlRunStatus) {
  minute += 1;
  const finishedAt = new Date(Date.UTC(2026, 9, 1, 0, minute));
  const [run] = await testDb.db
    .insert(crawlRuns)
    .values({
      clientId,
      trigger: 'user',
      status,
      startedAt: finishedAt,
      finishedAt:
        status === 'queued' || status === 'running' ? null : finishedAt,
    })
    .returning();
  return run;
}

async function addPage(
  clientId: number,
  runId: number,
  url: string,
  sitemapPosition: number,
) {
  const [page] = await testDb.db
    .insert(pages)
    .values({
      clientId,
      url,
      finalUrl: url,
      title: `Title of ${url}`,
      wordCount: 500,
      httpStatus: 200,
      responseMs: 100,
      htmlBytes: 1000,
      sitemapPosition,
      lastSeenRunId: runId,
      crawledAt: new Date(),
    })
    .returning();
  return page;
}

async function addKeyword(
  pageId: number,
  runId: number,
  term: string,
  relevance = 1,
) {
  const [keyword] = await testDb.db
    .insert(keywords)
    .values({ term })
    .onConflictDoUpdate({ target: keywords.term, set: { term } })
    .returning();
  await testDb.db
    .insert(pageKeywords)
    .values({ pageId, keywordId: keyword.id, relevance, lastSeenRunId: runId });
  return keyword;
}

const slice = (userId: number, filter: IPageListFilter = {}) =>
  repository.listSlice(scopeOf(userId), filter, 50, 0);
const search = (text: string) => ({
  search: { urlPattern: `%${text}%`, termPattern: `%${text}%` },
});

describe('PageListRepository (postgres)', () => {
  beforeEach(() => testDb.reset());
  afterAll(() => testDb.close());

  it('the trigram indexes behind the search exist', async () => {
    const { rows } = await testDb.db.execute<{ indexname: string }>(sql`
      select indexname from pg_indexes
      where indexname in ('pages_url_trgm_idx', 'keywords_term_trgm_idx')
      order by indexname
    `);

    expect(rows.map((row) => row.indexname)).toEqual([
      'keywords_term_trgm_idx',
      'pages_url_trgm_idx',
    ]);
  });

  it('lists only pages of the latest succeeded or partial run', async () => {
    const user = await seedTestUser(testDb, 'a@example.com');
    const client = await addClient(user.id, 'Site');
    const first = await addRun(client.id, 'succeeded');
    await addPage(client.id, first.id, 'https://site.example/dropped/', 0);
    const second = await addRun(client.id, 'partial');
    await addPage(client.id, second.id, 'https://site.example/kept/', 0);

    const rows = await slice(user.id);

    expect(rows.map((row) => row.url)).toEqual(['https://site.example/kept/']);
  });

  it('a failed or running re-crawl keeps showing the previous run’s pages', async () => {
    const user = await seedTestUser(testDb, 'a@example.com');
    const client = await addClient(user.id, 'Site');
    const done = await addRun(client.id, 'succeeded');
    await addPage(client.id, done.id, 'https://site.example/post/', 0);
    await addRun(client.id, 'failed');
    await addRun(client.id, 'running');

    await expect(slice(user.id)).resolves.toHaveLength(1);
  });

  it('orders by client name, then sitemap position; filters by client', async () => {
    const user = await seedTestUser(testDb, 'a@example.com');
    const zeta = await addClient(user.id, 'Zeta');
    const alpha = await addClient(user.id, 'Alpha');
    const zetaRun = await addRun(zeta.id, 'succeeded');
    const alphaRun = await addRun(alpha.id, 'succeeded');
    await addPage(zeta.id, zetaRun.id, 'https://z.example/1/', 1);
    await addPage(alpha.id, alphaRun.id, 'https://a.example/2/', 2);
    await addPage(alpha.id, alphaRun.id, 'https://a.example/0/', 0);

    expect((await slice(user.id)).map((row) => row.url)).toEqual([
      'https://a.example/0/',
      'https://a.example/2/',
      'https://z.example/1/',
    ]);
    expect(
      (await slice(user.id, { clientId: zeta.id })).map((row) => row.url),
    ).toEqual(['https://z.example/1/']);
    await expect(
      repository.countMatching(scopeOf(user.id), { clientId: alpha.id }),
    ).resolves.toBe(2);
  });

  it('never lists another user’s pages', async () => {
    const owner = await seedTestUser(testDb, 'owner@example.com');
    const intruder = await seedTestUser(testDb, 'intruder@example.com');
    const client = await addClient(owner.id, 'Site');
    const run = await addRun(client.id, 'succeeded');
    const page = await addPage(client.id, run.id, 'https://site.example/p/', 0);
    await addKeyword(page.id, run.id, 'secret');

    await expect(slice(intruder.id)).resolves.toEqual([]);
    await expect(slice(intruder.id, { clientId: client.id })).resolves.toEqual(
      [],
    );
    await expect(
      repository.keywordsForPages(scopeOf(intruder.id), [page.id]),
    ).resolves.toEqual([]);
  });

  it('search matches the URL or a current keyword, not a dropped one', async () => {
    const user = await seedTestUser(testDb, 'a@example.com');
    const client = await addClient(user.id, 'Site');
    const old = await addRun(client.id, 'succeeded');
    const run = await addRun(client.id, 'succeeded');
    const byUrl = await addPage(
      client.id,
      run.id,
      'https://site.example/link-building/',
      0,
    );
    const byKeyword = await addPage(
      client.id,
      run.id,
      'https://site.example/outreach/',
      1,
    );
    await addKeyword(byKeyword.id, run.id, 'link building');
    const stale = await addPage(
      client.id,
      run.id,
      'https://site.example/stale/',
      2,
    );
    await addKeyword(stale.id, old.id, 'link building tips');

    const matches = await slice(user.id, {
      search: { urlPattern: '%link-building%', termPattern: '%link building%' },
    });

    expect(matches.map((row) => row.id)).toEqual([byUrl.id, byKeyword.id]);
  });

  it("an escaped '%' or '_' matches only itself", async () => {
    const user = await seedTestUser(testDb, 'a@example.com');
    const client = await addClient(user.id, 'Site');
    const run = await addRun(client.id, 'succeeded');
    await addPage(client.id, run.id, 'https://site.example/snake_case/', 0);
    await addPage(client.id, run.id, 'https://site.example/snakeXcase/', 1);
    const page = await addPage(
      client.id,
      run.id,
      'https://site.example/other/',
      2,
    );
    await addKeyword(page.id, run.id, 'save 100% today');

    const percent = await slice(user.id, search('\\%'));
    const underscore = await slice(user.id, search('snake\\_case'));

    expect(percent.map((row) => row.url)).toEqual([
      'https://site.example/other/',
    ]);
    expect(underscore.map((row) => row.url)).toEqual([
      'https://site.example/snake_case/',
    ]);
  });

  it('keywords carry their latest position; issue counts group by severity', async () => {
    const user = await seedTestUser(testDb, 'a@example.com');
    const client = await addClient(user.id, 'Site');
    const run = await addRun(client.id, 'succeeded');
    const page = await addPage(client.id, run.id, 'https://site.example/p/', 0);
    const ranked = await addKeyword(page.id, run.id, 'ranked', 1);
    await addKeyword(page.id, run.id, 'unranked', 0.5);
    await testDb.db.insert(rankSnapshots).values([
      {
        pageId: page.id,
        keywordId: ranked.id,
        capturedAt: new Date('2026-10-01T12:00:00Z'),
        position: 9,
      },
      {
        pageId: page.id,
        keywordId: ranked.id,
        capturedAt: new Date('2026-10-02T12:00:00Z'),
        position: 4,
      },
    ]);
    await testDb.db.execute(sql`
      insert into seo_issues (page_id, code, severity, details_json) values
      (${page.id}, 'H1_MISSING', 'error', '{}'),
      (${page.id}, 'LANG_MISSING', 'notice', '{}'),
      (${page.id}, 'OG_TAGS_MISSING', 'notice', '{}')
    `);

    await expect(
      repository.keywordsForPages(scopeOf(user.id), [page.id]),
    ).resolves.toEqual([
      expect.objectContaining({
        term: 'ranked',
        latestPosition: 4,
        latestCapturedAt: new Date('2026-10-02T12:00:00Z'),
      }),
      expect.objectContaining({ term: 'unranked', latestPosition: null }),
    ]);
    const counts = await repository.issueCountsForPages(scopeOf(user.id), [
      page.id,
    ]);
    expect(counts.sort((a, b) => a.severity.localeCompare(b.severity))).toEqual(
      [
        { pageId: page.id, severity: 'error', count: 1 },
        { pageId: page.id, severity: 'notice', count: 2 },
      ],
    );
  });
});
