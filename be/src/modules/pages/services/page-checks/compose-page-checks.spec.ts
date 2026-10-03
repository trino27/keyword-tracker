import { SEO_ISSUE_CODES, type TSeoIssueCode } from '@app/contracts';
import { composePageChecks } from './compose-page-checks';

const statusOf = (checks: ReturnType<typeof composePageChecks>, code: string) =>
  checks?.find((check) => check.code === code)?.status;

describe('composePageChecks', () => {
  it('is null when the crawl predates the record', () => {
    expect(composePageChecks(null, null, [])).toBeNull();
  });

  it('covers the catalogue exactly once, in catalogue order', () => {
    const checks = composePageChecks([...SEO_ISSUE_CODES], [], []);

    expect(checks?.map(({ code }) => code)).toEqual(SEO_ISSUE_CODES);
  });

  it('calls a judged check that did not fail passed', () => {
    const checks = composePageChecks(
      [...SEO_ISSUE_CODES],
      [],
      ['TITLE_MISSING'],
    );

    expect(statusOf(checks, 'TITLE_MISSING')).toBe('failed');
    expect(statusOf(checks, 'NOT_HTTPS')).toBe('passed');
  });

  it('separates a skipped check from a passed one', () => {
    const judged = SEO_ISSUE_CODES.filter((code) => code !== 'TITLE_LENGTH');
    const checks = composePageChecks(
      judged,
      ['TITLE_LENGTH'],
      ['TITLE_MISSING'],
    );

    expect(statusOf(checks, 'TITLE_LENGTH')).toBe('notApplicable');
    expect(statusOf(checks, 'TITLE_MISSING')).toBe('failed');
  });

  /**
   * The case the two lists exist for. A code in neither was not part of the catalogue
   * that crawl ran against, and calling it passed would credit the page for a check
   * that never happened.
   */
  it('calls a code the crawl never knew notYetChecked, not passed', () => {
    const [newest, ...known] = SEO_ISSUE_CODES;
    const checks = composePageChecks(known, [], []);

    expect(statusOf(checks, newest)).toBe('notYetChecked');
    expect(statusOf(checks, known[0])).toBe('passed');
  });

  it('drops a stored code the catalogue has retired', () => {
    const checks = composePageChecks(
      [...SEO_ISSUE_CODES, 'RETIRED_CHECK' as TSeoIssueCode],
      [],
      [],
    );

    expect(checks?.map(({ code }) => code)).toEqual(SEO_ISSUE_CODES);
  });
});
