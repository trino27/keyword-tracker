import {
  ACTIVE_ISSUE_CODES,
  LIGHTHOUSE_ISSUE_CODES,
  type IPageCheck,
  type TCheckStatus,
  type TIssueCodeOf,
  type TScoredIssueOwner,
  type TSeoIssueCode,
} from '@app/contracts';

/**
 * The codes each scored owner lists as checks today: the crawl's minus what it retired,
 * and every Lighthouse code — Lighthouse retires an audit by no longer reporting it.
 */
const ACTIVE_CODES: { [O in TScoredIssueOwner]: readonly TIssueCodeOf<O>[] } = {
  crawl: ACTIVE_ISSUE_CODES,
  lighthouse: LIGHTHOUSE_ISSUE_CODES,
};

/**
 * Every check one scored owner still runs, with what that owner last concluded about it
 * on this page — the crawl from the lists on `pages`, Lighthouse from the lists on the
 * page's measurement (lighthouse-checks D6). Codes of any other owner in `failed` are
 * ignored, so the caller passes every finding of the page. Retired checks are left out entirely rather than given a status: there is no true
 * thing to say about a check the reader can no longer act on, and `notYetChecked` would
 * claim it was added after the crawl.
 *
 * The two stored lists are that crawl's record of the catalogue it ran. An active code in
 * neither is therefore one the catalogue has gained since — `notYetChecked`, not
 * `passed`, which is the whole reason the lists are stored and not just counted. A code
 * in `judged` that is no longer active is simply not rendered: the screen shows what the
 * catalogue runs today. Such a page still counts that check in its stored denominator,
 * so its score is explained as what applied WHEN IT WAS CRAWLED; the next crawl settles
 * it.
 *
 * Null in, null out: a page whose last crawl predates the record cannot be enumerated,
 * and guessing would reward it for checks that were never run.
 */
export function composePageChecks<O extends TScoredIssueOwner>(
  owner: O,
  judged: TSeoIssueCode[] | null,
  notApplicable: TSeoIssueCode[] | null,
  failed: TSeoIssueCode[],
): IPageCheck<O>[] | null {
  if (judged === null || notApplicable === null) return null;

  const wasJudged = new Set<string>(judged);
  const wasSkipped = new Set<string>(notApplicable);
  const hasFailed = new Set<string>(failed);

  return ACTIVE_CODES[owner].map((code) => ({ code, status: statusOf(code) }));

  // Failure is asked before membership on purpose: a stored finding is an observation,
  // and a composition that could hide one is worse than one that reports a
  // contradiction. The contradiction cannot arise anyway — a notApplicable verdict
  // never produces an issue, and the disjointness CHECK forbids the overlap.
  function statusOf(code: string): TCheckStatus {
    if (wasSkipped.has(code)) return 'notApplicable';
    if (hasFailed.has(code)) return 'failed';
    return wasJudged.has(code) ? 'passed' : 'notYetChecked';
  }
}
