import { ACTIVE_ISSUE_CODES, type TSeoIssueCode } from '@app/contracts';
import { composePageChecks } from './compose-page-checks';

const statusOf = (checks: ReturnType<typeof composePageChecks>, code: string) =>
  checks?.find((check) => check.code === code)?.status;

describe('composePageChecks', () => {
  it('is null when the crawl predates the record', () => {
    expect(composePageChecks(null, null, [])).toBeNull();
  });

  it('covers every running check exactly once, in catalogue order', () => {
    const checks = composePageChecks([...ACTIVE_ISSUE_CODES], [], []);

    expect(checks?.map(({ code }) => code)).toEqual(ACTIVE_ISSUE_CODES);
  });

  it('calls a judged check that did not fail passed', () => {
    const checks = composePageChecks(
      [...ACTIVE_ISSUE_CODES],
      [],
      ['TITLE_MISSING'],
    );

    expect(statusOf(checks, 'TITLE_MISSING')).toBe('failed');
    expect(statusOf(checks, 'NOT_HTTPS')).toBe('passed');
  });

  it('separates a skipped check from a passed one', () => {
    const judged = ACTIVE_ISSUE_CODES.filter((code) => code !== 'TITLE_LENGTH');
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
    const [newest, ...known] = ACTIVE_ISSUE_CODES;
    const checks = composePageChecks(known, [], []);

    expect(statusOf(checks, newest)).toBe('notYetChecked');
    expect(statusOf(checks, known[0])).toBe('passed');
  });

  /**
   * Retiring a check leaves its code in the rows already stored under it. The screen
   * lists what the catalogue RUNS, so such a code is dropped rather than given a status:
   * `notYetChecked` would claim it was added after this crawl, which is the opposite of
   * what happened.
   */
  it('drops a stored code the catalogue no longer runs', () => {
    const checks = composePageChecks(
      [...ACTIVE_ISSUE_CODES, 'RETIRED_CHECK' as TSeoIssueCode],
      [],
      [],
    );

    expect(checks?.map(({ code }) => code)).toEqual(ACTIVE_ISSUE_CODES);
    expect(statusOf(checks, 'RETIRED_CHECK')).toBeUndefined();
  });
});
