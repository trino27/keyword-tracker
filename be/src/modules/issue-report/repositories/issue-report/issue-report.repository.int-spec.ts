import { crawlRuns } from '@persistence/schema/tables/crawl-runs/crawl-runs.schema';
import { seoIssues } from '@persistence/schema/tables/seo-issues/seo-issues.schema';
import { siteChecks } from '@persistence/schema/tables/site-checks/site-checks.schema';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import { seedCurrentPage } from '../../../../../test/support/seed-page';
import { seedTestUser } from '../../../../../test/support/sign-in';
import { createTestDatabase } from '../../../../../test/support/test-database';
import { IssueReportRepository } from './issue-report.repository';

const testDb = createTestDatabase();
const repository = new IssueReportRepository(testDb.db);

const scopeOf = (userId: number) =>
  ({ userId, timeZone: 'America/Toronto' }) as IUserScope;

async function owner() {
  const user = await seedTestUser(testDb, 'owner@example.com');
  return { user, scope: scopeOf(user.id) };
}

async function siteCheck(
  runId: number,
  code: 'ROBOTS_TXT_TRUNCATED' | 'SOFT_404' | 'HOST_REDIRECT_CHAIN',
  status: 'passed' | 'failed' | 'notApplicable',
) {
  await testDb.db.insert(siteChecks).values({
    runId,
    code,
    status,
    severity: 'warning',
    details: {},
  });
}

describe('IssueReportRepository', () => {
  beforeEach(() => testDb.reset());
  afterAll(() => testDb.close());

  it('reads site checks of the current run only — not of a newer failed run', async () => {
    const { user, scope } = await owner();
    const { clientId, runId } = await seedCurrentPage(testDb, user.id);
    await siteCheck(runId, 'SOFT_404', 'failed');
    const later = new Date(Date.now() + 60_000);
    const [failedRun] = await testDb.db
      .insert(crawlRuns)
      .values({
        clientId,
        trigger: 'user',
        status: 'failed',
        startedAt: later,
        finishedAt: later,
        errorCode: 'SITE_UNREACHABLE',
      })
      .returning();
    await siteCheck(failedRun.id, 'HOST_REDIRECT_CHAIN', 'failed');

    const current = await repository.currentRun(scope, clientId);
    const found = await repository.failedSiteChecks(scope, current!.runId);

    expect(current?.runId).toBe(runId);
    expect(found.map(({ code }) => code)).toEqual(['SOFT_404']);
  });

  it('reads only failed site checks', async () => {
    const { user, scope } = await owner();
    const { runId } = await seedCurrentPage(testDb, user.id);
    await siteCheck(runId, 'SOFT_404', 'passed');
    await siteCheck(runId, 'ROBOTS_TXT_TRUNCATED', 'notApplicable');
    await siteCheck(runId, 'HOST_REDIRECT_CHAIN', 'failed');

    expect(
      (await repository.failedSiteChecks(scope, runId)).map(({ code }) => code),
    ).toEqual(['HOST_REDIRECT_CHAIN']);
  });

  it("reads only current pages' findings", async () => {
    const { user, scope } = await owner();
    const old = await seedCurrentPage(testDb, user.id);
    const current = await seedCurrentPage(testDb, user.id, ['x'], old.clientId);
    await testDb.db.insert(seoIssues).values([
      {
        pageId: old.pageId,
        code: 'H1_MISSING',
        severity: 'error',
        details: {},
      },
      {
        pageId: current.pageId,
        code: 'LANG_MISSING',
        severity: 'notice',
        details: {},
      },
    ]);

    const run = await repository.currentRun(scope, old.clientId);
    const findings = await repository.pageFindings(
      scope,
      old.clientId,
      run!.runId,
    );

    expect(run).toMatchObject({ runId: current.runId, pages: 1 });
    expect(findings.map(({ issue, page }) => [issue.code, page.id])).toEqual([
      ['LANG_MISSING', current.pageId],
    ]);
  });

  it("answers another user's client with nothing", async () => {
    const { user } = await owner();
    const { clientId, runId, pageId } = await seedCurrentPage(testDb, user.id);
    await testDb.db
      .insert(seoIssues)
      .values({ pageId, code: 'H1_MISSING', severity: 'error', details: {} });
    await siteCheck(runId, 'SOFT_404', 'failed');
    const intruder = await seedTestUser(testDb, 'intruder@example.com');
    const scope = scopeOf(intruder.id);

    expect(await repository.currentRun(scope, clientId)).toBeNull();
    expect(await repository.pageFindings(scope, clientId, runId)).toEqual([]);
    expect(await repository.failedSiteChecks(scope, runId)).toEqual([]);
  });
});
